---
layout: post
title: 如何用explain分析sql执行性能？
lock: need
---

# 面试官：如何用explain分析sql执行性能？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200911185558700.jpg?)

## MySQL执行计划
在工作中，我们用于捕捉性能问题最常用的就是打开慢查询，定位执行效率差的SQL，那么当我们定位到一个SQL以后还不算完事，我们还需要知道该SQL的执行计划，比如是全表扫描，还是索引扫描，这些都需要通过EXPLAIN去完成。EXPLAIN命令是查看优化器如何决定执行查询的主要方法。

需要注意的是，生成的QEP并不确定，它可能会根据很多因素发生改变。MySQL不会将一个QEP和某个给定查询绑定，QEP将由SQL语句每次执行时的实际情况确定，即便使用存储过程也是如此。尽管在存储过程中SQL语句都是预先解析过的，但QEP仍然会在每次调用存储过程的时候才被确定。（QEP：sql生成一个执行计划query Execution plan）

## 根据慢查询日志定位慢SQL
执行如下语句看是否启用慢查询日志，ON为启用，OFF为没有启用
```sql
show variables like "%slow_query_log%"
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200308165100201.PNG)
可以看到我的没有启用，我在命令行中执行如下2句打开慢查询日志，设置超时时间为1s
```sql
set global slow_query_log = on;
set global long_query_time = 1;
```
想要永久生效得到配置文件中配置，否则数据库重启后，这些配置失效

执行如下语句获得慢查询数量

```sql
show status like "%slow_queries%"
```

建议先看一下这篇分享[MySQL为什么要用B+树实现](https://blog.csdn.net/zzti_erlie/article/details/82973742)，这样你就能更好的理解什么时候需要回表查询，什么时候不需要，explain用法很简单，只需要在执行的select语句前加上explain即可

```sql
explain select * from teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018102717184925.PNG)

| 类型          | 描述                   |
| ------------- | ---------------------- |
| id            | 编号                   |
| select_type   | 查询类型               |
| table         | 表                     |
| type          | 类型                   |
| possible_keys | 预测用到的索引         |
| key           | 实际使用的索引         |
| key_len       | 实际使用索引的长度     |
| ref           | 表之间的引用           |
| rows          | 估算出来的结果记录条数 |
| Extra         | 额外的信息             |

下面来具体分析，准备的数据如下

course表
```sql
CREATE TABLE `course` (
  `cid` int(3) NOT NULL,
  `cname` varchar(20) NOT NULL,
  `tid` int(3) NOT NULL,
  PRIMARY KEY (`cid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028202110870.PNG)
teacher表

```sql
CREATE TABLE `teacher` (
  `tid` int(3) NOT NULL,
  `tname` varchar(20) NOT NULL,
  `tcid` int(3) NOT NULL,
  PRIMARY KEY (`tid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028202129454.PNG)
teacher_card表

```sql
CREATE TABLE `teacher_card` (
  `tcid` int(3) NOT NULL,
  `tcdesc` varchar(20) NOT NULL,
  PRIMARY KEY (`tcid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028202138862.PNG)
## id
我们来查询课程编号为2或者教师证编号为3的老师信息

```sql
SELECT
	t.* 
FROM
	course c,
	teacher t,
	teacher_card tc 
WHERE
	c.tid = t.tid 
	AND t.tcid = tc.tcid 
	AND ( c.cid = 2 OR t.tcid = 3 )
```
explain上述SQL后，如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181027172848310.PNG)

**id值相同，从上往下顺序执行**

为什么要先从t表中读取数据，然后和tc表做表联结，最后再和c表做表联结呢？（上面的SQL可以改写为join on的形式，执行效果一样）

我们写的SQL会被优化器优化，MySQL会按照小结果集驱动大结果集的方式进行表联结，表联结即对2个表做笛卡尔积，所以联结的顺序是t(3)-tc(3)-c(4)，括号中为个数。如果表t表的个数为5，则联结的顺序为tc(3)-c(4)-t(5)，注意括号里的数字不是表的数量，是**结果集**的数量

如果查询课程编号为2的老师信息

```sql
SELECT
	t.* 
FROM
	course c,
	teacher t,
	teacher_card tc 
WHERE
	c.tid = t.tid 
	AND t.tcid = tc.tcid 
	AND c.cid = 2
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181027234134291.PNG)

因为可以确定c的结果集最小，只有一个记录，因此联结顺序为c(1)-t(3)-tc(3)

查询教授SQL课程的老师的描述

```sql
SELECT
	tc.tcdesc 
FROM
	teacher_card tc 
WHERE
	tc.tcid = (
SELECT
	t.tcid 
FROM
	teacher t 
WHERE
	t.tid = ( SELECT c.tid FROM course c WHERE c.cname = "sql" ) 
	);
```
这个SQL是先查询c表，再查询t表，最后查询tc表，执行explain看一下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181027231840532.PNG)

**id值不同，id值越大，越优先执行**。将上述SQL改为如下形式
```sql
SELECT
	tc.tcdesc 
FROM
	teacher t,
	teacher_card tc 
WHERE
	tc.tcid = t.tcid 
	AND t.tid = ( SELECT c.tid FROM course c WHERE c.cname = "sql" )
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181027235405301.PNG)

**id值有相同，又有不同，id值越大越优先，id值相同，从上往下顺序执行**

## select_type

**SIMPLE**：查询不包含子查询和UNION
```sql
explain select * from teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018102717184925.PNG)

**PRIMARY**：查询有任何复杂的子部分，则外层部分标记为PRIMARY
SUBQUERY：包含在SELECT列表中的子查询中的SELECT（换句话说，不在FROM子句中）标记为SUBQUERY
```sql
SELECT
	tc.tcdesc 
FROM
	teacher_card tc 
WHERE
	tc.tcid = (
SELECT
	t.tcid 
FROM
	teacher t 
WHERE
	t.tid = ( SELECT c.tid FROM course c WHERE c.cname = "sql" ) 
	);
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181027231840532.PNG)

**DERIVED**：DERIVED值用来表示包含在FROM子句的子查询中的SELECT，MySQL会递归执行并将结果放到一个临时表中。服务器内部称其“派生表”，因为该临时表是从子查询中派生来的

```sql
SELECT
	cr.cname 
FROM
	( SELECT * FROM course WHERE tid IN ( 1, 2 ) ) cr
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028002705253.PNG)

id为1的table表名为\<derived2>，表示是一张派生表，派生表从id为2的执行过程中来

**UNION**：在UNION中的第二个和随后 的SELECT被标记为UNION。第一个SELECT被标记就好像它以部分外查询来执行。这就是下面第一个例子中在UNION中的第一个SELECT显示为PRIMARY的原因。如果UNION被FROM子句中的子查询包含，那么它的第一个SELECT会被标记为DERIVED，即下面的第二个例子

**UNION RESULT**：用来从UNION的匿名临时表检索结果的SELECT被标记为UNION RESULT

```sql
SELECT * FROM course WHERE tid = 1 UNION SELECT * FROM course WHERE tid = 2
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028204349512.PNG)
```sql
SELECT
	cr.cname 
FROM
	( SELECT * FROM course WHERE tid = 1 UNION SELECT * FROM course WHERE tid = 2 ) cr
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028005628368.PNG)



## type
索引类型， 要对type进行优化的前提是有索引。type类型有很多，这里不一一介绍，值介绍几个常用的
const，system>eq_ref>>ref>range>index>all
其中system，const只是理想情况，实际能达到ref>range

**system**：只有一条数据的系统表，或派生表只有一条数据的子查询
```sql
SELECT
	a.tname 
FROM
	( SELECT * FROM teacher t WHERE t.tid = 1 ) a
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028094908923.PNG)

**const**：仅仅能查到一条数据的SQL，用于Primary key或unique索引。如果只是能查到一条数据，但是条件列上没有Primary key或unique索引，则不是const。
```sql
SELECT * FROM teacher t WHERE t.tid = 1
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028095846256.PNG?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_27,color_FFFFFF,t_70)


假如说去掉tid上的主键（只是针对这个例子临时更改），执行上面的语句，结果如下

```sql
SELECT * FROM teacher t WHERE t.tid = 1
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028100237520.PNG)

此时type为ALL，验证了我们的想法，即虽然结果只有一条，但条件列上没有Primary key或unique索引，也不是const

**eq_ref**：唯一性索引，对于每个键的查询，返回匹配唯一行数据（有且只有一个，不能多，不能0），常见于唯一索引和主键索引，不是必须的有索引，我下面句的例子中teacher表的tcid字段就没有加任何索引，当然是我数据太简单的问题，才能在不建索引的情况下出现eq_ref

```sql
SELECT
	t.tcid 
FROM
	teacher t,
	teacher_card tc 
WHERE
	t.tcid = tc.tcid
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028102605141.PNG)

来看看此时表的数据
teacher表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028102915129.PNG)
teacher_card表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028102923249.PNG)

此时对于teacher表的tcid这个键，都会返回唯一条数据，所以type为eq_ref，假如说将teacher表增加一条数据（只是针对这个例子临时更改），teacher_card表不变，数据如下

teacher表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028103231176.PNG)

```sql
SELECT
	t.tcid 
FROM
	teacher t,
	teacher_card tc 
WHERE
	t.tcid = tc.tcid
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028103534647.PNG)

可以看到type类型变为了ALL，因为对于teacher表，4这个键，返回了0条数据，不是每个键值都返回了一条数据

上面的例子teacher_card都保持了不变，是为了验证的严密性，如果给teacher_card表增加数据再执行eq_ref的2个例子，其实是没有影响的，因为eq_ref针对的是teacher的键都能返回唯一行数据

**ref**：非唯一性索引，对于每个索引键的查询，返回匹配所有行（0，多）

修改表为如下（只是针对这个例子临时更改），出现了一个同名的老师张三，并且在teacher表的name列加上普通索引，演示一下匹配行有多个的情况

teacher表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028110941933.PNG)
teacher_card表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028111109164.PNG?)

```sql
SELECT
	* 
FROM
	teacher 
WHERE
	tname = "张三"
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028112534523.PNG)

**range**：检索指定范围的行，where后面是一个范围查询（between，>，<，>=，in有时候会失效，从而转为无索引ALL）

```sql
SELECT * FROM teacher WHERE tid < 3
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028113654583.PNG)

**index**：查询索引中全部数据

对teacher表的name字段建索引（只是针对这个例子临时更改）
```sql
SELECT tname FROM teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181030001910159.PNG)

对tname建立索引，当我们只查询tid时，它的值已经在B+树的叶子节点上了，不需要回表查询，从索引中就可以拿到，因为非聚集索引，叶子节点存放索引键值，以及该索引键值指向的主键

同时查tname，tcid

```sql
SELECT tname, tcid FROM teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018103000232442.PNG)

可以看到type为ALL，因为从tname索引中拿不到tcid的数据，只能通过全表扫描

现在我们想同时查询tname和tcid，不想通过回表，只想通过索引表拿到数据，应该怎么建索引呢？现在我们可以肯定的是，只对tname加索引，或者只对tcid加索引肯定是不行的，那么在tname和tcid上都分别加索引呢（只是针对这个例子临时更改）？
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018102817031498.PNG)
执行如下sql
```sql
SELECT tname, tcid FROM teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028165827955.PNG)
可以看到是ALL，针对这种情况我们得对tname和tcid建联合索引，因为只有联合索引才能拿到tname和tcid的值，还不用回表
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028170448693.PNG)

再次执行

```sql
SELECT tname, tcid FROM teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028170543792.PNG)

key使用了联合索引
**all**：查询表中全部数据

```sql
SELECT * FROM teacher
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028143238451.PNG)

## possilbe_keys
可能用到的索引，是一种预测，不准
## key
实际使用到的索引
## key_len
索引的长度，用于判断联合索引是否被完全使用

建立如下的表，其中name列和address列都建立了索引

```sql
CREATE TABLE `teacher` (
  `id` int(10) NOT NULL,
  `name` char(20) NOT NULL,
  `address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_addr` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
执行如下命令

```sql
explain select * from teacher where name = "张三"
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104221050891.PNG)

```sql
explain select * from teacher where address = "北京"
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104221215891.PNG)

问题来了，**这些key_len是怎么算出来的呢？**

key_len表示索引使用的字节数，根据这个值，就可以判断索引使用情况，特别是在组合索引的时候，判断所有的索引字段是否都被查询用到

字符串类型
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205738871.PNG?)

char和varchar跟字符编码也有密切的联系
latin1占用一个字节，gbk占用2个字节，utf8占用3个字节，utf8mb4占用4个字节（不同字符编码占用的存储空间不同）

**字符类型-索引字段为char类型+不可为Null时**

char(n)=n*(utf8mb4=4,utf8=3,gbk=2,latin1=1)
所以上面第一个列子（查询name=张三）的key_len为20*3=60
下文中为了描述方便，编码类型默认为utf8

**字符类型-索引字段为char类型+允许为Null时**

char(n)=n\*3+1（允许null，是否为空的标记）

**字符类型-索引字段为varchar类型+不可为Null时**

 varchar(n)=n\*3+2（变长列，记录当前数据存了多少）

**字符类型-索引字段为varchar类型+允许为Null时**

 varchar(n)=n*3+1（允许null）+2（变长列）
 所以上面第二个例子（查询住址=北京）的key_len为100\*3+1+2=303

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205754996.PNG?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181104205807476.PNG?)

datetime类型在5.6中字段长度是5个字节，datetime类型在5.5中字段长度是8个字节

**整数/浮点数/时间类型的索引长度**
Not Null=字段本身的长度
Null=字段本身的长度+1
## ref
列出是通过常量（const），还是某个表的某个字段（如果是join）来过滤（通过key）

先对teacher表的tname字段和course表的tid字段增加索引

```sql
SELECT
	c.cid,
	t.tname 
FROM
	course c,
	teacher t 
WHERE
	c.tid = t.tid 
	AND t.tname = "张三"
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181028174218563.PNG)
第一个为const表示常量，即张三，第二个为test2.t.tid，表示couse表引用的是test2库中的t（teacher）表的tid字段
## rows
MySQL Query Optimizer通过系统收集到的统计信息估算出来的结果记录条数
## Extra
**Using index**：所需要的数据，只需要在索引即可全部获得，而不需要再到表中取数据

**Using where**：如果我们不是读取表的所有数据，或者不是仅仅通过索引就可以获取所有需要的数据，则会出现Using where信息。

Using index和Using where前面已经有例子，当出现索引覆盖时，会显示Using index，性能得到了提升，出现Using temporary和Using filesort说明性能损耗比较大

**Using temporary**：当MySQL某些操作中必须使用临时表时，在Extra信息中就会出现Using temporary。主要常见于GROUP BY和ORDER BY等操作中

**Using filesort**：这意味着MySQL会对结果使用一个外部索引排序，而不是按索引次序从表里读取行

对teacher表的name字段建索引（只是针对这个例子临时更改），

```sql
SELECT * FROM teacher WHERE tname = "张三" ORDER BY tname
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018102819510465.PNG)

```sql
SELECT * FROM teacher WHERE tname = "张三" ORDER BY tcid
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018102819521013.PNG)
