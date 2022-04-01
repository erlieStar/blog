---
layout: post
title: order by 语句怎么优化？
lock: need
---
# MySQL实战：order by 语句怎么优化？

![请添加图片描述](https://img-blog.csdnimg.cn/f28146cc48de4106804d9282cf172851.png)
## order by是怎么工作的？

```sql
CREATE TABLE `person` (
  `id` int(11) NOT NULL,
  `city` varchar(16) NOT NULL,
  `name` varchar(16) NOT NULL,
  `age` int(11) NOT NULL,
  `addr` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `city` (`city`)
) ENGINE=InnoDB;
```
假如有如上一张表执行如下sql

```sql
explain select city, name, age from person where city = '杭州' order by name limit 1000;
```
explain的结果如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/d9d0159d52804bc6ad6bd159af02f8ca.png#pic_center)

Extra列中有Using filesort说明进行了排序，**排序这个动作有可能在内存中完成，也有可能在磁盘中完成**

那么对记录根据name字段排序是如何做到的呢？

**排序的方式主要分为两种，全字段排序和rowid排序**
## 全字段排序
![在这里插入图片描述](https://img-blog.csdnimg.cn/3576b563035d4118b667d4538e526d33.png)

全字段排序的过程如下

1. 初始化 sort buffer，从 city 索引找满足city=杭州条件的主键id
2. 根据主键id回表找到对应的记录，取出 name city age 三个字段的值，存入 sort buffer
3. 从 city 索引找到下一个记录的主键
4. 重复步骤2，3，找到所有满足条件的记录
5. 对 sort buffer 中的数据按照字段 name 排序，排序结果取前1000行返回客户端

我们可以通过执行如下语句查看sort buffer的大小
```sql
show variables like '%sort_buffer%'
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/aca5f980d53c4dffaf7dfc6ad414a638.png)

**我们把这个排序的过程叫做全字段排序**

按name排序这个动作，可能在内存中完成，也可能需要使用外部排序。这取决于排序需要的内存大小和 sort_buffer_size（mysql为排序开辟的内存大小，即sort buffer）

如果数据量太大，则需要利用磁盘文件排序

## rowid排序

如果查询要返回的字段很多的话，那么sort buffer里面需要放的字段数也很多，此时就会分成很多临时文件，排序的性能会很差

如果单行很大，这个方法效率不够好。那我们减少放入sort buffer的大小不就能解决这个问题吗？

当单行的大小超过定值时，我们只往sort buffer放入必要的字段（主键id和排序的字段），等按照name排好序后，根据主键id回表查询数据返回即可

![在这里插入图片描述](https://img-blog.csdnimg.cn/b66749f9fa6c424481f6ebd53b2417f7.png)

**我们把这个排序的过程叫做rowid排序**

我们可以通过执行如下语句设置一个定值，当单行的大小超过这个定值时，让mysql换一个算法
```sql
SET max_length_for_sort_data = 16;
```

**全字段排序，rowid排序如何选择？**

**当内存足够的时候会采用全字段排序，减少磁盘访问。当内存不够的时候才会采用rowid排序**

当然并不是所有的 order by 语句，都是需要排序操作的。MySQL之所以要生成临时表，并在临时表上做排序操作，其原因是原来的数据都是无序的

**有没有可能取数据的时候，name就已经是有序的？**

我们建一个 city 和 name 的联合索引不就满足了

```sql
alter table person add index city_user(city, name);
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/657139ed1c88458fa03969b3fe433e0b.png)

可以看到执行计划的Extra列已经没有 Using filesort 了，说明不用排序，因为从索引上读取数据时，name已经有序了

**假设现在person表对 city 和 name 建了联合索引，那么下面语句需要排序吗？**

```sql
explain select * from person where city in ('杭州') order by name limit 100
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/f07f5f9b4d53413e9b70bd40fc4150ea.png)

答案是不会，一个城市的name是有序的，不用排序

**如果是下面的语句呢？**

```sql
explain select * from person where city in ('杭州', '苏州') order by name limit 100
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/467ba32e5c824e358c0a907e828bdfda.png)

答案是会，多个城市的name不是有序的，需要排序

**当 order by 语句执行的比较慢时，我们可以通过如下方法来进行优化**
1. 排序的字段增加索引
2. 增大 sort buffer 的大小
3. 不要用 * 作为查询列表，只返回需要的列