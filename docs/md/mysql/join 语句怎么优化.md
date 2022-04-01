---
layout: post
title: join 语句怎么优化？
lock: need
---
# MySQL实战：join 语句怎么优化？

![在这里插入图片描述](https://img-blog.csdnimg.cn/8e98a797482c479095e0460c88c987ea.png)

## Simple Nested-Loop Join
我们来看一下当进行 join 操作时，mysql是如何工作的。常见的 join 方式有哪些？

![在这里插入图片描述](https://img-blog.csdnimg.cn/95f0cc45ac554338bff3220dcadc4cfb.png)

如图，当我们进行连接操作时，左边的表是**驱动表**，右边的表是**被驱动表**

Simple Nested-Loop Join 这种连接操作是从驱动表中取出一条记录然后逐条匹配被驱动表的记录，如果条件匹配则将结果返回。然后接着取驱动表的下一条记录进行匹配，直到驱动表的数据全都匹配完毕

**因为每次从驱动表取数据比较耗时，所以MySQL并没有采用这种算法来进行连接操作**

## Block Nested-Loop Join

![在这里插入图片描述](https://img-blog.csdnimg.cn/49d0deee0424470d9090f0fed5ac5b97.png)

既然每次从驱动表取数据比较耗时，那我们每次从驱动表取一批数据放到内存中，然后对这一批数据进行匹配操作。这批数据匹配完毕，再从驱动表中取一批数据放到内存中，直到驱动表的数据全都匹配完毕

批量取数据能减少很多IO操作，因此执行效率比较高，这种连接操作也被MySQL采用

对了，这块内存在MySQ中有一个专有的名词，叫做 join buffer，我们可以执行如下语句查看 join buffer 的大小

```sql
show variables like '%join_buffer%'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/e1bed1bf69eb40f0abc621466f34d393.png)

把我们之前用的 single_table 表搬出来，基于 single_table 表创建2个表，每个表插入1w条随机记录
```sql
CREATE TABLE single_table (
    id INT NOT NULL AUTO_INCREMENT,
    key1 VARCHAR(100),
    key2 INT,
    key3 VARCHAR(100),
    key_part1 VARCHAR(100),
    key_part2 VARCHAR(100),
    key_part3 VARCHAR(100),
    common_field VARCHAR(100),
    PRIMARY KEY (id),
    KEY idx_key1 (key1),
    UNIQUE KEY idx_key2 (key2),
    KEY idx_key3 (key3),
    KEY idx_key_part(key_part1, key_part2, key_part3)
) Engine=InnoDB CHARSET=utf8;

create table t1 like single_table;
create table t2 like single_table;
```


如果直接使用 join 语句，MySQL优化器可能会选择表 t1 或者 t2 作为驱动表，这样会影响我们分析sql语句的过程，所以我们用 straight_join 让mysql使用固定的连接方式执行查询

```sql
select * from t1 straight_join t2 on (t1.common_field = t2.common_field)
```

运行时间为0.035s

![在这里插入图片描述](https://img-blog.csdnimg.cn/d440bfe247184f10bb274a6912960118.png)

执行计划如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/01891b3c21a541cbae915cff132c87e4.png)

在Extra列中看到了 Using join buffer ，说明连接操作是基于 **Block Nested-Loop Join** 算法

## Index Nested-Loop Join
了解了 **Block Nested-Loop Join** 算法之后，可以看到驱动表的每条记录会把被驱动表的所有记录都匹配一遍，非常耗时，能不能提高一下被驱动表匹配的效率呢？

估计这种算法你也想到了，就是给被驱动表连接的列加上索引，这样匹配的过程就非常快，如图所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/649ba2e6e57c4e7286b453b4044546e5.png)

我们来看一下基于索引列进行连接执行查询有多快？

```sql
select * from t1 straight_join t2 on (t1.id = t2.id)
```

执行时间为0.001秒，可以看到比基于普通的列进行连接快了不止一个档次

![在这里插入图片描述](https://img-blog.csdnimg.cn/8702395b1364412c8e9984843af83391.png)

执行计划如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/04e0dcf9decb43829136439b7d9add20.png)

**驱动表的记录并不是所有列都会被放到 join buffer，只有查询列表中的列和过滤条件中的列才会被放入 join buffer，因此我们不要把 * 作为查询列表，只需要把我们关心的列放到查询列表就好了，这样可以在 join buffer 中放置更多的记录**

## 如何选择驱动表？
知道了 join 的具体实现，我们来聊一个常见的问题，即如何选择驱动表？

**如果是 Block Nested-Loop Join 算法：**

1. 当 join buffer 足够大时，谁做驱动表没有影响
2. 当 join buffer 不够大时，应该选择小表做驱动表（小表数据量少，放入 join buffer 的次数少，减少表的扫描次数）

**如果是 Index Nested-Loop Join 算法**

假设驱动表的行数是M，因此需要扫描驱动表M行

被驱动表的行数是N，每次在被驱动表查一行数据，要先搜索索引a，再搜索主键索引。每次搜索一颗树近似复杂度是以2为底N的对数，所以在被驱动表上查一行的时间复杂度是$2*log2^N$


驱动表的每一行数据都要到被驱动表上搜索一次，整个执行过程近似复杂度为 $M + M*2*log2^N$

**显然M对扫描行数影响更大，因此应该让小表做驱动表。当然这个结论的前提是可以使用被驱动表的索引**

**总而言之，我们让小表做驱动表即可**

**当 join 语句执行的比较慢时，我们可以通过如下方法来进行优化**

1. 进行连接操作时，能使用被驱动表的索引
2. 小表做驱动表
3. 增大 join buffer 的大小
4. 不要用 * 作为查询列表，只返回需要的列