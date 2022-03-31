---
layout: post
title: explain详解（上）
lock: need
---
# MySQL实战：explain详解（上）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200911185558700.jpg?)

## 如何分析慢sql？
在工作中，我们用于捕捉性能问题最常用的就是打开慢查询日志，定位执行效率差的SQL，那么当我们定位到一个SQL以后还不算完事，我们还需要知道该SQL的执行计划，比如是全表扫描，还是索引扫描，这些都需要通过EXPLAIN去完成。EXPLAIN命令是查看优化器如何决定执行查询的主要方法。

在正式介绍explain的使用之前，我们需要了解一下单表的访问方法有哪些？
## 单表的访问方法
我们先建一个single_table表，方便演示后面的结果
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

### const
通过主键或者唯一二级索引与常数值的等值比较来定位一条记录

例如如下语句

```sql
-- 通过主键和常数值进行比较
select * from single_table where id = 400;
-- 通过唯一二级索引和常数值进行比较
select * from single_table where key2 = 100;
```
**注意**：如果主键或者唯一二级索引的索引列由多个列组成，则只有在索引列中的每一项都与常数进行等值比较时，这个const访问方法才有效（因为只有这样才能保证最多只有一条记录符合条件）

```sql
select * from single_table where key2 is null
```

当执行上述语句的时候，访问方法并不是const，因为唯一二级索引并不限制null值的数量，所以上述语句可能访问到多条记录。那它是什么访问方法？接着往下看

### ref
将某个普通的二级索引与常数进行等值比较

```sql
select * from single_table where key1 = 'abc'
```
对于普通的二级索引来说，通过索引列进行等值比较后可能会匹配到多条连续的二级索引记录，而不像主键或者唯一二级索引那样最多只能匹配一条记录，所以ref访问方法比const差。

**另外需要注意如下两种情况**

1. 不论是普通二级索引还是唯一二级索引，索引列对包含null值的数量并不限制，所以采用key is null 这种形式的搜索条件最多只能使用ref的访问方法，而不是const的访问方法
2. 满足最左前缀原则的等值查询可能采用ref的访问方法

例如如下几条语句
```sql
select * from single_table where key_part1 = 'a';

select * from single_table where key_part1 = 'a' and key_part2 = 'b';

select * from single_table where key_part1 = 'a' and key_part2 = 'b' AND key_part3 = 'c'; 
```
**如果索引列并不全是等值查询的时候，访问方法就不是ref了，为range**

```sql
select * from single_table where key_part1 = 'a' AND key_part2 > 'b';
```

### ref_or_null
同时找出某个二级索引列的值等于某个常数值的记录，并且把该列中值为null的记录也找出来

```sql
select * from single_table where key1 = 'abc' or key1 is null
```

### range
使用索引执行查询时，对应的扫描区间为若干个单点扫描区间或者范围扫描

```sql
select * from single_table where key2 in (11, 12) or (key2 >= 30)
```
上面sql的扫描区间为[11, 11]，[12, 12]，以及[30,+∞)

扫描区间为(-∞, +∞)的访问方法不能称为range
### index

```sql
select key_part1, key_part2, key_part3 from single_table where key_part2 = 'abc'
```
可以看到key_part2并不是联合索引最左边的列，所以无法使用ref的访问方法来执行这个语句。但是它有如下两个特点

1. 查询的列为key_part1，key_part2，key_part3 。而索引idx_key_part中包含这3个列的列值
2. 搜索条件只有key_part2列，而这个列也包含在idx_key_part中

此时我们可以直接遍历idx_key_part索引中的所有记录，判断key_part2的值，并返回key_part1，key_part2，key_part3的值，此时扫描区间为(-∞, +∞)

扫描全部二级索引记录比直接扫描全部的聚集索引记录的成本要小很多（因为聚集索引的叶子节点要存所有列以及隐藏列，而**二级所以只需要存索引列的列值和主键值**，所以树高有可能比较低），这种方法为index

另外当语句添加了order by 主键的时候访问方法也为index

**所以当查询满足如下条件时，访问方法为index**

1. 扫描全部二级索引记录
2. 添加了order by 主键的语句
### all
全表扫描，即直接扫描全部的聚集索引记录

```sql
select * from single_table
```

## explain的使用
我们先构造2个和single_table表一摸一样的表，命名为s1表和s2表，这2个表里各有10000条记录，除id列外其余列都插入随机值。
```sql
create table t1 like single_table;
create table t2 like single_table;
```

explain用法很简单，只需要在执行的select语句前加上explain即可

```sql
explain select * from t1
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/48c925dacc994964837773c6433ef863.png)

每列的作用如下

|类型|描述|
|-|-|
|id|在一个大的查询语句中，每个select关键字都对应一个唯一的id|
|select_type|select关键字对应的查询类型|
|table|表|
|type|针对单表的访问方法|
|possible_keys|针对表进行查询时有哪些可以潜在使用的索引|
|key|实际使用的索引|
|key_len|实际使用索引的长度|
|ref|表之间的引用|
|rows|估算出来的结果记录条数|
|filtered||
|Extra|额外的信息|

下面具体分析一下每个列值的含义

### table
无论我们的查询有多复杂，里面包含了多少表，到最后也是对单个表进行访问。explain语句输出中的每一行都对应着某个单表的访问方法，table列为该表的表名

```sql
explain select * from t1 inner join t2
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/75f15f92bbb5497594be26fc5cb64bbd.png)

### id

查询语句中的每个select关键字都会被分配唯一的id值。

**在连接查询的执行计划中，每个表都会对应一条记录，这些记录的id值是相同的，出现在前面的表表示驱动表，出现在后面的表表示被驱动表**

```sql
explain select * from t1 inner join t2
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/759de99394f4409b8d82fbfc3d73be58.png)

对于包含子查询的查询语句来说，可能涉及多个select关键字，所以在包含子查询的查询语句的执行计划中，每个select关键字都会对应一个唯一的id值

```sql
explain select * from t1 where key1 in (select key1 from t2) or key3 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/5557a92ddd2d4585af7904682aad7300.png)

**id值相同，从上往下顺序执行**

**id值不同，id值越大，越优先执行**

### select_type（关键字对应的查询类型）
|名称  | 描述 |
|--|--|
| simple |  查询中不包含union或子查询|
|primary|对于包含union union all 或者子查询的大查询来说，它是由几个子查询组成的，最左边查询的select type 值为primary|
|union|对于包含union或者union all的大查询来说，它是由几个小查询组成的，除了最左边的那个小查询以外，其余小查询的select type值为union|
|union result|mysql使用临时表来完成union的去重工作，针对该临时表的查询的select type为union result|
|subquery|包含子查询的查询语句不能够转为对应的半连接形式，并且该查询不是相关子查询，查询优化器决定采用该子查询物化的方案来执行该子查询时，该子查询的第一个select关键字对应的select_type为subquery|
|dependent subquery|包含子查询的查询语句不能够转为对应的半连接形式，并且该查询是相关子查询，该子查询的第一个select关键字对应的select_type为dependent subquery|
|dependent union|在包含union 或者 union all的大查询中，如果各个小查询都依赖外层查询的话，除了最左边的那个小查询外，其余的select type为dependent  union|
|derived|采用物化的方式执行包含派生表的查询，该派生表对应的自查询的select_type就是derived|
|materialized|查询优化器在执行包含子查询的语句时，选择将子查询物化之后与外层查询进行连接查询时，该子查询对应的select_type为materialized|

**SIMPLE**：查询中不包含union或子查询

```sql
explain select * from t1
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/48c925dacc994964837773c6433ef863.png)

```sql
explain select * from t1 inner join t2
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/75f15f92bbb5497594be26fc5cb64bbd.png)

**PRIMARY**：对于包含**union**,**union all** 或者**子查询**的大查询来说，它是由几个子查询组成的，最左边查询的**select type** 值为**primary**

```cpp
explain select * from t1 union select * from t2
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/ac654c20475e4c2680426d9b41ffc7f7.png)

**UNION**：对于包含union或者union all的大查询来说，它是由几个小查询组成的，除了最左边的那个小查询以外，其余小查询的select type值为union

**UNION RESULT**：mysql使用临时表来完成union的去重工作，**针对该临时表的查询的select type为union result**

**SUBQUERY**：包含子查询的查询语句不能够转为对应的 semi-join 形式，并且该查询是不相关子查询，查询优化器决定采用该子查询物化的方案来执行该子查询时，该子查询的第一个select关键字对应的select_type为subquery。

![在这里插入图片描述](https://img-blog.csdnimg.cn/2a3f583aa7d848d080b15fc620719384.png)

**需要注意的一点是，由于select_type为SUBQUERY的子查询会被物化，所以只需要执行一遍**

**DEPENDENT SUBQUERY**：包含子查询的查询语句不能够转为对应的semo-join形式，并且该查询是相关子查询，该子查询的第一个select关键字对应的select_type为dependent subquery

```sql
explain select * from t1 where key1 in (select key1 from t2 where t1.key2 = t2.key2) or key3 = 'a'
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/0865b294710443d0b27b6fc5068888f6.png)

**select_type为DEPENDENT SUBQUERY的查询可能会被执行多次**

**DERIVED**：采用物化的方式执行包含派生表的查询，该派生表对应的子查询的select_type就是DERIVED

```sql
explain select * from (select key1, count(*) as c from t1 group by key1) as derived_s1 where c > 1
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/18bc3268858d48adad9bb804179fbe19.png)

derived_s1为派生表，id为2的记录对应的select_type是DERIVED，说明该子查询是以物化的方式执行的。id为1的记录代表外层查询，它的table列显示的是\<derived2>，说明该查询是针对将派生表物化之后的表进行查询的

**MATERIALIZED**：查询优化器在执行包含子查询的语句时，选择将子查询物化之后与外层查询进行连接查询时，该子查询对应的select_type为materialized

```sql
explain select * from t1 where key1 in (select key1 from t2)
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2b7d833b765e400d942e103a8dfb75ef.png)

然后看执行计划的前2条记录的id值都为1，说明这2条记录对应的表进行连接查询，需要注意的是第二条记录的table列的值为\<subquery2>，说明该表其实就是id为2对应的子查询执行之后产生的物化表，然后将t1与该物化表进行连接查询
### type（单表访问方法）
**执行计划的一条记录代表着mysql对某个表执行查询时的访问方法，type表明了对表的访问方法是啥**？

我们前面只介绍了InnoDB引擎中表访问的部分方法，完整的访问方法如下

| 名称 | 描述 |
|--|--|
| system | 表中只有一条记录并且该表使用的存储引擎的统计数据是精确的，派生表为只有一条数据的子查询 |
| const | 根据主键或者唯一二级索引与常数进行等值匹配时 |
| eq_ref | 连接查询时，被驱动表是通过主键或者唯一二级索引列进行等值匹配的方式进行访问 |
| ref | 普通二级索引与常量值进行等值匹配 |
|ref_or_null  | 普通二级索引进行等值匹配，索引列值可以为null时 |
| fulltext |  全文索引，跳过|
| index_merge | 使用索引合并的方式对表进行查询 |
| unique_subquery | 包含in自查询的语句中，如果查询优化器决定将in子查询转换为exists自查询，而且子查询可以使用到主键进行等值匹配 |
|index_subquery|index_subquery和unique_subquery类似，只不过访问子查询中的表时使用的是普通的索引|
|range|使用索引列获取范围区间的记录|
|index|对二级索引进行全索引扫描|
|all|对聚集索引进行全表扫描|

**常用的执行效率如下所示**

**const，system > eq_ref > ref > range > index > all**

**system**：表中只有一条记录并且该表使用的存储引擎的统计数据是精确的，比如MyISAM，Memory，那么对该表的访问方法就是system

```sql
mysql> CREATE TABLE t(i int) Engine=MyISAM;
Query OK, 0 rows affected (0.04 sec)

mysql> INSERT INTO t VALUES(1);
Query OK, 1 row affected (0.01 sec)
```

```sql
explain select * from t
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/e197f136d1e44e179b7a25a073520172.png)

**const**：根据主键或者唯一二级索引与常数进行等值匹配时

```sql
explain select * from t1 where id = 5
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/7fdad3c282534ed69e9d12d1720ba5dd.png)

**eq_ref**：在连接查询时，如果被驱动表是通过主键或者唯一二级索引列等值匹配的方式进行访问的，则对该被驱动表的访问方法就是eq_ref

```sql
explain select * from t1 inner join t2 on t1.id = t2.id
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/1f774fa7942641bd973ff16538a1e598.png)

**ref**：普通二级索引与常量进行等值匹配来查询某个表

```sql
explain select * from t1 where key1 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/bd023d16db9442f08bd59e27e0bac27a.png)

**ref_or_null**：普通二级索引与常量进行等值匹配，索引值可以为null时

```sql
explain select * from t1 where key1 = 'a' or key1 is null
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/2405d7f28e5b4163aae6aec129867a1e.png)

**range**：使用索引获取某些范围区间的记录

```sql
explain select * from t1 where key1 in ('a', 'b', 'c')
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2923372484a84544a67a824be0ad244e.png)
或者
```sql
explain select * from t1 where key1 > 'a' and key1 < 'b'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/51d56008b9624a138042932e406a1e6f.png)

**index**：对二级索引进行全扫描

```sql
explain select key_part2 from t1 where key_part3 = 'a'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/ee2e47df58044fb89f2e58fb62b9b431.png)

查询的列为key_part2，而筛选的列为key_part2，因此搜索idx_key_part索引就能获取到需要的记录

**对于InnoDB存储引擎的表来说，二级索引的记录只包含索引列和主键值，而聚集索引中包含用户定义的全部列和一些隐藏列，所以扫描二级索引的代价比全表扫描的代价低**

**all**：全表扫描

```sql
explain select * from t1
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/3e6dc68a9a1b4f0f94382a081a8198e1.png)
