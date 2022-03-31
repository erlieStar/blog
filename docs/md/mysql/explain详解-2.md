---
layout: post
title: explain详解（下）
lock: need
---
# MySQL实战：explain详解（下）

![请添加图片描述](https://img-blog.csdnimg.cn/ff5f3b0ac22d4686acaf1c0271f6b484.png)

## explain的使用
### possilbe_keys 和 key
possible_keys 列表示在某个查询语句中，对某个表执行单表查询时可能用到的索引有哪些？key列表示实际用到的索引有哪些

```sql
explain select * from t1 where key1 > 'z' and key3 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/95d2b46981e54e799cbd33f7667dc3c6.png#pic_center)

possible_keys 列的值为 idx_key1,idx_key3，表示该查询可能使用到idx_key1,idx_key3两个索引，key列的值为idx_key3，表示最终使用的索引是idx_key3

### key_len
索引的长度，**一般用于判断联合索引是否被完全使用**

```sql
explain select * from t1 where key1 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/f414ad42242341feaa7ee48d211654be.png)

**可以看到key_len为303，那么是如何算出来的呢？**

先复习一下基本的数据类型

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205738871.PNG?)

char和varchar跟字符编码也有密切的联系

latin1占用一个字节，gbk占用2个字节，utf8占用3个字节，utf8mb4占用4个字节（不同字符编码占用的存储空间不同）

**字符类型-索引字段为char类型+不可为Null时**

char(n)=n*(utf8mb4=4,utf8=3,gbk=2,latin1=1)

**字符类型-索引字段为char类型+允许为Null时**

char(n)=n\*3+1（允许null，是否为空的标记）

**字符类型-索引字段为varchar类型+不可为Null时**

varchar(n)=n\*3+2（变长列，记录当前数据存了多少）

**字符类型-索引字段为varchar类型+允许为Null时**

varchar(n)=n*3+1（允许null）+2（变长列，记录当前数据存了多少）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205754996.PNG?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205807476.PNG?)

datetime类型在5.6中字段长度是5个字节，datetime类型在5.5中字段长度是8个字节

**整数/浮点数/时间类型的索引长度**

Not Null=字段本身的长度

Null=字段本身的长度+1

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
```

key1的数据类型是varchar(100)，并且可以为null，表的字符编码是uft8，因此对应的计算公式为


**字符类型-索引字段为varchar类型+允许为Null时**

varchar(n)=n*3+1（允许null）+2（变长列，记录当前数据存了多少）

varchar(100)=100 * 3 + 1 + 2 = 303

![在这里插入图片描述](https://img-blog.csdnimg.cn/f414ad42242341feaa7ee48d211654be.png)

```sql
explain select * from t1 where key_part1 = 'a' and key_part2 < 'b' and key_part3 = 'c'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/0ad5d61dd16f46b792ba05772b7d4f17.png)

可以看到使用到的索引为idx_key_part，但是这是一个联合索引，使用到了哪些索引列呢？从key_len中就能看出来

key_part1索引列长度为 100 * 3 + 1 + 2 = 303

key_part2索引列长度为 100 * 3 + 1 + 2 = 303

这2个索引列加起来的长度为606，正好和key_len相等，说明联合索引只用到了key_part1，key_part2这2个列
### ref
对索引列执行等值匹配查询时，也就是单表访问方法在const、eq_ref、ref、ref_or_null、unique_subquery、index_subquery中时，ref列展示的就是与索引列进行等值匹配的值是啥？

```sql
explain select key_part2 from t1 where key1 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/0cd3ed04ee0944c7a7509c5d298524f6.png)

ref为const说明是一个常量值

```sql
explain select * from t1 inner join t2 on t1.id = t2.id
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/f58fb5a027d54fa1bcfcbcddccae5bc3.png)

第二行ref为test.t1.id说明与t2进行等值匹配的列卫test库t1表的id列

### rows
查询优化器决定使用全表扫描的方式对某个表执行查询时，执行计划的rows列就代表预计需要扫描的行数

查询优化器决定使用索引的方式对某个表执行查询时，执行计划的rows列就代表预计扫描的索引记录行数

```sql
explain select * from t1 where key1 > 'e'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/a0acc16d21ca48fc930036fcb2af0bf6.png)

可以看到rows列卫1247，说明查询优化器在进行成本分析后，认为满足key1 > 'e' 的数据只有1247条
### filtered
满足使用索引搜索条件外的其他搜索条件的记录占用的百分比

```sql
explain select * from t1 where key1 > 'e'and common_field = 'a'
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/f989162f2ffb42c7b7e083b6bd05f539.png)

从执行计划可以看出，满足 key1 > 'e' 的记录有1247条，执行计划的filtered列就表示查询优化器预测在这些记录中，有多少条记录满足其余的搜索条件，此处值为10，说明在1247条记录中有10%的记录满足common_field = 'a'这个条件

**一般情况下我们更关注连接查询中驱动表对应的filtered值。用 rows * filtered 可以估算出和下一张表连接的行数**

```sql
explain select * from t1 join t2 on t1.key1 = t2.key1 and t1.common_field = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/8f24c6780f9d4a90aa16da880742a128.png)

从执行计划可以看出t1为驱动表，t2为被驱动表，rows * filtered = 9887 * 10% = 987，说明对被驱动表大约执行 987 次查询

### Extra
**Using index**：当出现**索引覆盖**时。即所需要的数据，只需要在索引上即可全部获得，而不需要回表查询数据

```sql
explain select key1 from t1 where key1 = 'a'
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/3b09dc282faf401388c4b4a55734bd66.png)

**Using index condition**：当查询语句在执行过程中使用**索引下推**这个特性时

```sql
explain select * from t1 where key1 > 'z' and key1 like '%b'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/347adc2afd3e47f19ab7d0d1047db898.png)

**Using where**：当我们使用全表扫描来执行对某个表的查询，并且该语句中where子句中有针对该表的搜索条件时

```sql
explain select * from t1 where common_field = 'a'
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/d513bf384bc3458fac817c213734e660.png)

```sql
explain select * from t1 where key1 = 'a' and common_field = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/b91bc4c8262e4882a25e35f99d4e6091.png)

**Using temporary**：当MySQL某些操作中必须使用临时表时，在Extra信息中就会出现Using temporary。主要常见于GROUP BY和ORDER BY等操作中

```sql
explain select distinct common_field from t1
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/695d9801899c4bc88d5b576d411eb42e.png)

**Using filesort**：排序的时候没办法用到索引，此时就会基于内存或者磁盘文件来排序，大部分时候得基于磁盘文件来排序

```sql
explain select * from t1 order by common_field limit 10
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/c2567a60f6134674bb2797a47505fa58.png)

将所有数据写入一个临时的磁盘文件，基于排序算法在磁盘文件里完成排序

```sql
explain select * from t1 order by key1 limit 10
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/4f4b0a59745045de9a43535648564251.png)

**Using join buffer（Block Nested Loop）**

```sql
explain select * from t1 inner join t2 on t1.common_field = t2.common_field
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/81c3ee070ca742489b7f1b866a6a9cac.png)

## 基于 explain 的 sql 调优思路

SQL调优的核心是避免出现全表扫描，尽量使每个步骤都能基于索引执行，避免扫描过多的数据

type（单表访问方法）的执行效率从高到低依次为

**const，system > eq_ref > ref > range > index > all**

尽量使用执行效率高的单表访问方法

**当Extra列出现了如下提示，需要注意**

Using filesort：使用内存或者文件进行排序

Using temporary：使用了临时表

**当Extra列出现了如下提示，说明效率得到提高**

Using index：出现**索引覆盖**

Using index condition：使用**索引下推**