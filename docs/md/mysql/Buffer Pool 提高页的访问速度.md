---
layout: post
title: Buffer Pool 提高页的访问速度
lock: need
---
# MySQL实战：Buffer Pool 提高页的访问速度

![请添加图片描述](https://img-blog.csdnimg.cn/c681e9f75b5f48e280b5fc59fbfb7362.png)
## 如何提高SQL执行速度？
**当我们想更新某条数据的时候，难道是从磁盘中加载出来这条数据，更新后再持久化到磁盘中吗？**

如果这样搞的话，那一条sql的执行过程可太慢了，因为对一个大磁盘文件的读写操作是要耗费几百万毫秒的

真实的执行过程是，当我们想更新或者读取某条数据的时候，会把对应的页加载到Buffer Pool缓冲池中（Buffer Pool本质上就是一块连续的内存空间）

**默认为128m，当然为了提高系统的并发度，你可以把这个值设大一点**
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/cb3cc03d43cb49578d3e4d39d2652b0e.png)

之所以加载页到Buffer Pool中，是考虑到当你使用这个页的数据时，这个页的其他数据使用到的概率页很大，随机IO的耗时很长，所以多加载一点数据到Buffer Pool

**Buffer Pool的数据结构是怎样的？**

![在这里插入图片描述](https://img-blog.csdnimg.cn/8764d82e1196434c84a910d1c0b04d9f.png)

Buffer Pool中主要分为2部分，缓存页和描述数据，MySQL从磁盘加载的数据页会放入缓存页中

对于每个缓存页都有对应的描述信息，比如数据页所属于表空间，数据页的编号等

Buffer Pool中的描述数据大概相当于缓存页大小的5%左右，这部分内存是不包含在Buffer Pool中的

当更新数据的时候，如果对应的页在Buffer Pool中，则直接更新Buffer Pool中的页即可，对应的页不在Buffer Pool中时，才会从磁盘加载对应的页到Buffer Pool，然后再更新，**此时Buffer Pool中的页和磁盘中的页数据是不一致的，被称为脏页**。这些脏页是要被刷回到磁盘中的


**这些脏页是多会刷回到磁盘中的？** 有如下几个时机
1. Buffer Pool不够用了，要给新加载的页腾位置了，所以会利用改进的后的LRU算法，将一些脏页刷回磁盘
2. 后台线程会在MySQL不繁忙的时候，将脏页刷到磁盘中
3. redolog写满时（redolog的作用后面会提到）
4. 数据库关闭时会将所有脏页刷回到磁盘


这样搞，效率是不是高很多了？

当需要更新的数据所在的页已经在Buffer Pool中时，只需要操作内存即可，效率不是一般的高

**我们怎么知道哪些缓存页是空闲的？**

MySQL为Buffer Pool设计了一个free链表，它是一个双向链表，每个节点就是一个空闲缓存页的描述数据

![在这里插入图片描述](https://img-blog.csdnimg.cn/83ebd89921b9490683abfde81c403519.png)

**我们如何知道缓存页是否被加载到内存了？**

很简单啊，建立一个哈希表不就行了，key为表空间号+页号，value为对应的缓存页

当把数据页读取到缓存页的时候，对应的描述数据会从free链表放到flush链表

![在这里插入图片描述](https://img-blog.csdnimg.cn/796dc91b34cf47b098772416d2e9c870.png)

当不停的把磁盘上的数据页加载到缓存页，free链表不停的移除空闲缓存页，当free链表上没有空闲缓存页，当你还要加载数据页到缓存页时，该怎么办呢？

**如果要淘汰一些数据，该淘汰谁呢？**

**引入LRU链表来判断哪些缓存页是不常用的？**

缓存淘汰策略在很多中间件中会被用到，其中用的最多的就是LRU算法，当每访问一个缓存页的时候就把缓存页移到链表的头部

![在这里插入图片描述](https://img-blog.csdnimg.cn/c0ea8e61b9794413ad2a4312657f0f61.png)

我们只需要把链表尾部的缓存页刷到内存中，然后加载新的数据页即可。

**这样的方式看似很完美，但是在实际运行过程中会存在巨大的隐患**

首先就是mysql的预读，

哪些情况会触发MySQL的预读


当发生全表扫描的时候（比如 select * from users），会导致表里的数据页都加载到 Buffer Pool 中去。这样有可能导致LRU链表前面一大串数据页都是全表扫描加载进来的数据页，但是如果这次全表扫描过后后续几乎没用到这个表里面的数据呢？

这样就会导致经常被扫描的缓存页被淘汰了，留下的都是全表扫描加载进来的缓存页

**为了解决这个问题，LRU链表改进了一下，采用了冷热分离的思想。**

即LRU链表会被拆分为2部分，一部分是冷数据，一部分是热数据

![在这里插入图片描述](https://img-blog.csdnimg.cn/b2042c628ae144ee8c7828fb2109446e.png)

冷热数据的比例由innodb_old_blocks_pct参数控制

```sql
mysql> SHOW VARIABLES LIKE 'innodb_old_blocks_pct';
+-----------------------+-------+
| Variable_name         | Value |
+-----------------------+-------+
| innodb_old_blocks_pct | 37    |
+-----------------------+-------+
1 row in set (0.02 sec)
```

**改进后的链表是如何工作的？**

当数据页第一次被加载到缓存的时候，缓存页会被放到冷数据区域的链表头部。


那么冷数据区的缓存页多会放到热数据区呢？

当一个数据页被加载到缓存页后，在1s（innodb_old_blocks_time参数控制）之后，再次访问这个缓存页，会被挪动到热数据区域的链表头部去

当多线程访问Buffer Pool中的各种链表时，需要加锁保证线程安全，影响请求的处理速度，此时我们就可以将Buffer Pool分为多个，多线程访问时不会互相影响，提高了请求的处理速度
![在这里插入图片描述](https://img-blog.csdnimg.cn/797538f21bc74d8caadf8147aff2ce2d.png)

在MySQL 5.7.5之前，Buffer Pool不能动态扩展。为了增加动态扩展就增加了chunk机制，有兴趣的小伙伴可以看看其他资料，就不多做分析了

![在这里插入图片描述](https://img-blog.csdnimg.cn/30af48c49364408480b6243c294f1291.png)
## Buffer Pool的相关参数
学习了这么多理论知识，那么Buffer Pool应该调多大呢？

执行如下命令可以得到Buffer Pool的大小，名字，以及chunk的大小
```sql
SHOW VARIABLES LIKE '%innodb_buffer%'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/64daa56e82bd4bfb87f5882fa6094052.png)
innodb_buffer_pool_size的单位是字节，我们转成MB来看一下，默认是128M
```sql
-- 128m
SELECT @@innodb_buffer_pool_size / 1024 / 1024
```

执行如下命令可以得到buffer_pool的当前使用状态
```sql
SHOW STATUS LIKE '%buffer_pool%';
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/65ad9105822842bfade6b5b849c7fc8e.png)
**我们挑一些重要的参数来分析一下**

Innodb_buffer_pool_read_requests：读的请求次数

Innodb_buffer_pool_reads：从物理磁盘中读取数据的次数

Innodb_buffer_pool_pages_data：有数据的缓存页

Innodb_buffer_pool_pages_free：空闲缓存页

Innodb_buffer_pool_pages_total：总共的缓存页

<hr>
Buffer Pool 读缓存命中率：

(Innodb_buffer_pool_read_requests - Innodb_buffer_pool_reads) / （Innodb_buffer_pool_read_requests） *100%

<hr>
Buffer Pool 脏页比率：

Innodb_buffer_pool_pages_dirty / （Innodb_buffer_pool_pages_data）*100%

<hr>
Buffer Pool 使用率：

innodb_buffer_pool_pages_data / ( innodb_buffer_pool_pages_data + innodb_buffer_pool_pages_free ) * 100%

**缓存命中率比较低可以增大Buffer Pool的大小**

**使用率比较高时可以增大Buffer Pool的大小**

你也可以执行如下命令获取一些关于Buffer Pool的其他参数，本篇文章就不多做介绍了
```sql
show engine innodb status;
```