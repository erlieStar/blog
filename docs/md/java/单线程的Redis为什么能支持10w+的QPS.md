---
layout: post
title: 单线程的Redis为什么能支持10w+的QPS?
lock: need
---

# 面试官：单线程的Redis为什么能支持10w+的QPS?
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130141613187.jpg?)
## 单线程为什么能支持10w+的QPS？
我们经常听到Redis是一个单线程程序。准确的说Redis是一个多线程程序，只不过请求处理的部分是用一个线程来实现的。

阿里云对Redis QPS的测试结果如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021022721212118.png?)
**Redis是如何用单线程来实现每秒10w+的QPS的呢？**
1. 使用IO多路复用
2. 非CPU密集型任务
3. 纯内存操作
4. 高效的数据结构

**只用一个线程怎么来处理多个客户端的连接呢？**

这就不得不提IO多路复用技术，即Java中的NIO。

当我们使用阻塞IO（Java中的BIO），调用read函数，传入参数n，表示读取n个字节后线程才会返回，不然就一直阻塞。write方法一般不会阻塞，除非写缓冲区被写满，write才会被阻塞，直到缓冲区中有空间被释放出来。

当我们使用IO多路复用技术时，当没有数据可读或者可写，客户端线程会直接返回，并不会阻塞。这样Redis就可以用一个线程来监听多个Socket，当一个Socket可读或可写的时候，Redis去读取请求，操作内存中数据，然后返回。

**当采用单线程时，就无法使用多核CPU，但Redis中大部分命令都不是CPU密集型任务，所以CPU并不是Redis的瓶颈**。

高并发和大数据量的请宽下Redis的瓶颈主要体现在内存和网络带宽，所以你看Redis为了节省内存，在底层数据结构上占用的内存能少就少，并且一种类型的数据在不同的场景下会采用不同的数据结构。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130140038568.png?)

**所以Redis采用单线程就已经能处理海量的请求，因此就没必要使用多线程**。除此之外，**使用单线程还有如下好处**

1. 没有了线程切换的性能开销
2. 各种操作不用加锁（如果采用多线程，则对共享资源的访问需要加锁，增加开销）
3. 方便调试，可维护性高

**最后Redis是一个内存数据库，各种命令的读写操作都是基于内存完成的**。大家都知道操作内存和操作磁盘效率相差好几个数量级。虽然Redis的效率很高，但还是有一些慢操作需要大家避免

## Redis有哪些慢操作？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130154650489.png)
Redis的各种命令是在一个线程中依次执行的，如果一个命令在Redis中执行的时间过长，就会影响整体的性能，因为后面的请求要等到前面的请求被处理完才能被处理，这些耗时的操作有如下几个部分

Redis可以通过日志记录那些耗时长的命令，使用如下配置即可

```conf
# 命令执行耗时超过 5 毫秒，记录慢日志
CONFIG SET slowlog-log-slower-than 5000
# 只保留最近 500 条慢日志
CONFIG SET slowlog-max-len 500
```
执行如下命令，就可以查询到最近记录的慢日志

```c
127.0.0.1:6379> SLOWLOG get 5
1) 1) (integer) 32693       # 慢日志ID
   2) (integer) 1593763337  # 执行时间戳
   3) (integer) 5299        # 执行耗时(微秒)
   4) 1) "LRANGE"           # 具体执行的命令和参数
      2) "user_list:2000"
      3) "0"
      4) "-1"
2) 1) (integer) 32692
   2) (integer) 1593763337
   3) (integer) 5044
   4) 1) "GET"
      2) "user_info:1000"
...
```

### 使用复杂度过高的命令
之前的文章我们已经介绍了Redis的底层数据结构，它们的时间复杂度如下表所示
| 名称 | 时间复杂度 |
|--|--|
| dict（字典） |  O(1)|
| ziplist （压缩列表）| O(n) |
| zskiplist （跳表）|  O(logN)|
| quicklist（快速列表） | O(n) |
| intset（整数集合） | O(n) |

**单元素操作**：对集合中的元素进行增删改查操作和底层数据结构相关，如对字典进行增删改查时间复杂度为O(1)，对跳表进行增删查时间复杂为O(logN)

**范围操作**：对集合进行遍历操作，比如Hash类型的HGETALL，Set类型的SMEMBERS，List类型的LRANGE，ZSet类型的ZRANGE，时间复杂度为O(n)，避免使用，用SCAN系列命令代替。（hash用hscan，set用sscan，zset用zscan）

**聚合操作**：这类操作的时间复杂度通常大于O(n)，比如SORT、SUNION、ZUNIONSTORE 

**统计操作**：当想获取集合中的元素个数时，如LLEN或者SCARD，时间复杂度为O(1)，因为它们的底层数据结构如quicklist，dict，intset保存了元素的个数

**边界操作**：list底层是用quicklist实现的，quicklist保存了链表的头尾节点，因此对链表的头尾节点进行操作，时间复杂度为O(1)，如LPOP、RPOP、LPUSH、RPUSH

**当想获取Redis中的key时，避免使用keys \*** ，Redis中保存的键值对是保存在一个字典中的（和Java中的HashMap类似，也是通过数组+链表的方式实现的），key的类型都是string，value的类型可以是string，set，list等

例如当我们执行如下命令后，redis的字典结构如下

```shell
set bookName redis;
rpush fruits banana apple;
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210116155453782.png?)
我们可以用keys命令来查询Redis中特定的key，如下所示

```shell
# 查询所有的key
keys *
# 查询以book为前缀的key
keys book*
```
keys命令的复杂度是O(n)，它会遍历这个dict中的所有key，如果Redis中存的key非常多，所有读写Redis的指令都会被延迟等待，所以千万不用在生产环境用这个命令（如果你已经准备离职的话，祝你玩的开心）。

**既然不让你用keys，肯定有替代品，那就是scan** 

scan和keys相比，有如下特点
1. 复杂虽然也是O(n)，但是是通过游标分布执行的，不会阻塞线程
2. 同keys一样，提供模式匹配功能
3. 从完整遍历开始到完整遍历结束，一直存在于数据集内的所有元素都会被完整遍历返回，但是同一个元素可能会被返回多次
4. 如果一个元素是在迭代过程中被添加到数据集的，或者在迭代过程中从数据集中被删除的，那么这个元素可能会被返回，也可能不会被返回
5. 返回结果为空并不意味着遍历结束，而要看返回的游标值是否为0

有兴趣的小伙伴可以分析一下scan源码的实现就能明白这些特性了

**用用zscan遍历zset，hscan遍历hash，sscan遍历set的原理和scan命令类似，因为hash，set，zset的底层实现的数据结构中都有dict。**

### 操作bigkey
**如果一个key对应的value非常大，那么这个key就被称为bigkey。写入bigkey在分配内存时需要消耗更长的时间。同样，删除bigkey释放内存也需要消耗更长的时间**

如果在慢日志中发现了SET/DEL这种复杂度不高的命令，此时你就应该排查一下是否是由于写入bigkey导致的。

**如何定位bigkey?**

Redis提供了扫描bigkey的命令

```c
$ redis-cli -h 127.0.0.1 -p 6379 --bigkeys -i 0.01

...
-------- summary -------

Sampled 829675 keys in the keyspace!
Total key length in bytes is 10059825 (avg len 12.13)

Biggest string found 'key:291880' has 10 bytes
Biggest   list found 'mylist:004' has 40 items
Biggest    set found 'myset:2386' has 38 members
Biggest   hash found 'myhash:3574' has 37 fields
Biggest   zset found 'myzset:2704' has 42 members

36313 strings with 363130 bytes (04.38% of keys, avg size 10.00)
787393 lists with 896540 items (94.90% of keys, avg size 1.14)
1994 sets with 40052 members (00.24% of keys, avg size 20.09)
1990 hashs with 39632 fields (00.24% of keys, avg size 19.92)
1985 zsets with 39750 members (00.24% of keys, avg size 20.03)
```
可以看到命令的输入有如下3个部分
1. 内存中key的数量，已经占用的总内存，每个key占用的平均内存
2. 每种类型占用的最大内存，已经key的名字
3. 每种数据类型的占比，以及平均大小

这个命令的原理就是redis在内部执行了scan命令，遍历实例中所有的key，然后正对key的类型，分别执行strlen，llen，hlen，scard，zcard命令，来获取string类型的长度，容器类型（list，hash，set，zset）的元素个数

使用这个命令需要注意如下两个问题

1. 对线上实例进行bigkey扫描时，为避免ops（operation per second 每秒操作次数）突增，可以通过-i增加一个休眠参数，上面的含义为，每隔100条scan指令就会休眠0.01s
2. 对于容器类型（list，hash，set，zset），扫描出的是元素最多的key，但一个key的元素数量多，不一定代表占用的内存多

**如何解决bigkey带来的性能问题？**

1. 尽量避免写入bigkey
2. 如果使用的是redis4.0以上版本，可以用unlink命令代替del，此命令可以把释放key内存的操作，放到后台线程中去执行
3. 如果使用的是redis6.0以上版本，可以开启lazy-free机制（lazyfree-lazy-user-del yes），执行del命令的时候，也会放到后台线程中去执行

### 大量key集中过期
我们可以给Redis中的key设置过期时间，那么当key过期了，它在什么时候会被删除呢？

**如果让我们写Redis过期策略，我们会想到如下三种方案**

1. 定时删除，在设置键的过期时间的同时，创建一个定时器。当键的过期时间来临时，立即执行对键的删除操作
2. 惰性删除，每次获取键的时候，判断键是否过期，如果过期的话，就删除该键，如果没有过期，则返回该键
3. 定期删除，每隔一段时间，对键进行一次检查，删除里面的过期键
定时删除策略对CPU不友好，当过期键比较多的时候，Redis线程用来删除过期键，会影响正常请求的响应

定时删除策略对CPU不友好，当过期键比较多的时候，Redis线程用来删除过期键，会影响正常请求的响应

惰性删除读CPU是比较有好的，但是会浪费大量的内存。如果一个key设置过期时间放到内存中，但是没有被访问到，那么它会一直存在内存中

定期删除策略则对CPU和内存都比较友好

redis过期key的删除策略选择了如下两种

1. 惰性删除
2. 定期删除

**惰性删除**
客户端在访问key的时候，对key的过期时间进行校验，如果过期了就立即删除

**定期删除**
Redis会将设置了过期时间的key放在一个独立的字典中，定时遍历这个字典来删除过期的key，遍历策略如下

1. 每秒进行10次过期扫描，每次从过期字典中随机选出20个key
2. 删除20个key中已经过期的key
3. 如果过期key的比例超过1/4，则进行步骤一
4. 每次扫描时间的上限默认不超过25ms，避免线程卡死

**因为Redis中过期的key是由主线程删除的，为了不阻塞用户的请求，所以删除过期key的时候是少量多次**。源码可以参考expire.c中的activeExpireCycle方法

为了避免主线程一直在删除key，我们可以采用如下两种方案

1. 给同时过期的key增加一个随机数，打散过期时间，降低清除key的压力
2. 如果你使用的是redis4.0版本以上的redis，可以开启lazy-free机制（lazyfree-lazy-expire yes），当删除过期key时，把释放内存的操作放到后台线程中执行

### 内存达到上限，触发淘汰策略

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130162350771.png?)
Redis是一个内存数据库，当Redis使用的内存超过物理内存的限制后，内存数据会和磁盘产生频繁的交换，交换会导致Redis性能急剧下降。所以在生产环境中我们通过配置参数maxmemoey来限制使用的内存大小。

当实际使用的内存超过maxmemoey后，Redis提供了如下几种可选策略。

noeviction：写请求返回错误

volatile-lru：使用lru算法删除设置了过期时间的键值对
volatile-lfu：使用lfu算法删除设置了过期时间的键值对
volatile-random：在设置了过期时间的键值对中随机进行删除
volatile-ttl：根据过期时间的先后进行删除，越早过期的越先被删除

allkeys-lru：在所有键值对中，使用lru算法进行删除
allkeys-lfu：在所有键值对中，使用lfu算法进行删除
allkeys-random：所有键值对中随机删除

**Redis的淘汰策略也是在主线程中执行的。但内存超过Redis上限后，每次写入都需要淘汰一些key，导致请求时间变长**

可以通过如下几个方式进行改善
1. 增加内存或者将数据放到多个实例中
2. 淘汰策略改为随机淘汰，一般来说随机淘汰比lru快很多
3. 避免存储bigkey，降低释放内存的耗时
### 写AOF日志的方式为always

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130163842737.png?)
Redis的持久化机制有RDB快照和AOF日志，每次写命令之后后，Redis提供了如下三种刷盘机制

always：同步写回，写命令执行完就同步到磁盘
everysec：每秒写回，每个写命令执行完，只是先把日志写到aof文件的内存缓冲区，每隔1秒将缓冲区的内容写入磁盘
no：操作系统控制写回，每个写命令执行完，只是先把日志写到aof文件的内存缓冲区，由操作系统决定何时将缓冲区内容写回到磁盘

当aof的刷盘机制为always，redis每处理一次写命令，都会把写命令刷到磁盘中才返回，整个过程是在Redis主线程中进行的，势必会拖慢redis的性能

当aof的刷盘机制为everysec，redis写完内存后就返回，刷盘操作是放到后台线程中去执行的，后台线程每隔1秒把内存中的数据刷到磁盘中

当aof的刷盘机制为no，宕机后可能会造成部分数据丢失，一般不采用。

**一般情况下，aof刷盘机制配置为everysec即可**

### fork耗时过长
在持久化一节中，我们已经提到**Redis生成rdb文件和aof日志重写，都是通过主线程fork子进程的方式，让子进程来执行的，主线程的内存越大，阻塞时间越长。**

可以通过如下方式优化
1. 控制Redis实例的内存大小，尽量控制到10g以内，因
2. 为内存越大，阻塞时间越长
3. 配置合理的持久化策略，如在slave节点生成rdb快照