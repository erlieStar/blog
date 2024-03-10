---
layout: post
title: MySQL有哪些锁？
lock: need
---
# MySQL实战：MySQL有哪些锁？

![请添加图片描述](https://img-blog.csdnimg.cn/4d8d9eaf53e44b3493cf55e3a668c71a.jpg?)
## 并发场景
当我们学习MySQL的时候，经常会提到事物的四大特性，原子性，一致性，隔离性，持久性。那么隔离性是如何实现的？

**隔离的本质就是控制并发**，如果SQL语句就是串行执行的。那么数据库的四大特性中就不会有隔离性这个概念了，也就不会有脏读，不可重复读，幻读等各种问题了

**对数据库的各种并发操作，只有如下四种，写写，读读，读写和写读**
### 写-写
事务A更新一条记录的时候，事务B能同时更新同一条记录吗？

答案肯定是不能的，不然就会造成**脏写**问题，那如何避免脏写呢？答案就是**加锁**
### 读-读
MySQL读操作默认情况下不会加锁，所以可以并行的读
### 读-写 和 写-读
**基于各种场景对并发操作容忍程度不同，MySQL就搞了个隔离性的概念**。你自己根据业务场景选择隔离级别。

**MySQL的隔离性是通过锁和MVCC来实现的**

√ 为会发生，×为不会发生
|隔离级别| 脏读 |不可重复读|幻读|
|--|--|--|--|
|read uncommitted（未提交读）  | √ | √ | √ |
|read committed（提交读）  |×  | √ | √ |
| repeatable read（可重复读） |×  |×| √ |
|serializable （可串行化） | × |×|×|

按照粒度分，MySQL锁可以分为全局锁，表级锁，行锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/249a74d88dae406b8e04e9ea917466d1.png)
InnoDB存储引擎中有如下两种类型的行级锁

1. **共享锁**（Shared Lock，简称S锁），在事务需要读取一条记录时，需要先获取改记录的S锁
2. **排他锁**（Exclusive Lock，简称X锁），在事务要改动一条记录时，需要先获取该记录的X锁

如果事务T1获取了一条记录的S锁之后，事务T2也要访问这条记录。如果事务T2想再获取这个记录的S锁，可以成功，这种情况称为锁兼容，如果事务T2想再获取这个记录的X锁，那么此操作会被阻塞，直到事务T1提交之后将S锁释放掉

如果事务T1获取了一条记录的X锁之后，那么不管事务T2接着想获取该记录的S锁还是X锁都会被阻塞，直到事务1提交，这种情况称为锁不兼容。

**多个事务可以同时读取记录，即共享锁之间不互斥，但共享锁会阻塞排他锁。排他锁之间互斥**

S锁和X锁的兼容关系
| 兼容性 | X锁 | S锁 |
|--|--|--|
| X锁 |不兼容 | 不兼容|
| S锁 | 不兼容 | 兼容|
## 全局锁
执行如下语句，可以使用全局锁。

```sql
flush tables with read lock
```
执行完毕，整个数据库就处于只读状态了，这时其他线程执行如下操作，都会被阻塞

对数据库的增删改操作，比如insert delete update语句
对表结构的更改操作，比如alter table，drop table等语句

要释放全局锁，则要执行这条命令

```sql
unlock tables
```

## 表级锁
### 表锁

**表锁也有S锁和X锁之分**

在系统变量autocommit=0，innodb_table_locks = 1时，手动获取InnoDB存储引擎提供的表t的S锁或者X锁，可以这么写

对表t加表级别的S锁
```sql
lock tables t read
```

对表t加表级别的X锁

```sql
lock tables t write
```

使用如下命令，会释放当前会话的所有表锁，当会话退出后，也会释放所有表锁

```sql
unlock tables
```

**如果一个事务给表加了S锁，那么**

- 别的事务可以继续获得该表的S锁
- 别的事务可以继续获得表中某些记录的S锁
- 别的事务不可以继续获得该表的X锁
- 别的事务不可以继续获得表中某些记录的X锁

**如果一个事务给表加了X锁，那么**

- 别的事务不可以继续获得该表的S锁
- 别的事务不可以继续获得表中某些记录的S锁
- 别的事务不可以继续获得该表的X锁
- 别的事务不可以继续获得表中某些记录的X锁
### 元数据锁
我们不需要显示的使用元数据锁（MDL），因为当我们对数据库表进行操作时，会自动给这个表加上MDL

- 当对表进行增删改查时，加的是MDL读锁
- 当对表结构进行变更时，假的是MDL写锁

在对表执行一些诸如ALTER TABLE，DROP TABLE这类的DDL语句时，会对这个表加MDL写锁，因此其他事务对这个表执行诸如SELECT INSERT UPDATE DELETE的语句会发生阻塞

**所以修改线上的表时一定要小心，因为会使大量事务阻塞**，目前有很多成熟的修改线上表的方法，不再赘述
### 意向锁

在表级别还有IS锁（意向共享锁）和IX锁（意向排他锁）

**当事物给一条记录上S锁时，同时会给记录对应的表上IS锁（IS锁是表级锁），当事务给一条记录上X锁时，同时会给记录对应表上IX锁（IX锁是表级别锁）**

IS锁和IX锁的使命是为了后续在加表级别的S锁和X锁时，判断表中是否有已经被加锁的记录，避免用遍历的方式来查看表中有没有上锁的记录
### AUTO-INC锁
在使用MySQL过程中，我们可以为表的某个列添加AUTO_INCREMENT属性，之后在插入记录的时候，可以不指定该列的值列，系统为他赋上递增的值

如下面这个表
```sql
CREATE TABLE t (
    id INT NOT NULL AUTO_INCREMENT,
    c VARCHAR(100),
    PRIMARY KEY (id)
) Engine=InnoDB CHARSET=utf8;

INSERT INTO t(c) VALUES('aa'), ('bb');
```
插入2条记录后，结果如下

```sql
mysql> SELECT * FROM t;
+----+------+
| id | c    |
+----+------+
|  1 | aa   |
|  2 | bb   |
+----+------+
2 rows in set (0.00 sec)
```
**MySQL自动给AUTO_INCREMENT修饰的列递增赋值的原理主要有如下两种方式**
1. 采用AUTO-INC锁，插入语句时就在表级别加一个AUTO-INC锁，然后为每条待插入记录中AUTO_INCREMENT修饰的列分配递增的值，插入语句执行结束后，再把AUTO-INC锁释放掉（**插入语句执行完释放锁，不是事务结束时**）。这样一个事务在持有AUTO-INC锁的过程中，其他事务的插入语句都要被阻塞，可以保证分配的递增值是连续的
2. 采用一个轻量级的锁，在为插入语句生成AUTO_INCREMENT修饰列的值时获取一下这个轻量级锁，生成本次插入语句需要的AUTO_INCREMENT列的值之后，就把该轻量级锁释放掉，并不需要等到整个插入语句执行完才插入锁

最后总结一下兼容性
| 兼容性 | IS | IX| S | X|AUTO_INC|
|--|--|--|--|--|--|
| IS | 兼容 |兼容| 兼容 | 不兼容 |兼容|
| IX | 兼容 |兼容|  不兼容| 不兼容 |兼容|
| S | 兼容 |不兼容| 兼容 | 不兼容 |不兼容|
| X | 不兼容 |不兼容|  不兼容| 不兼容 |不兼容|
| AUTO_INC |兼容  |兼容| 不兼容 |不兼容|  不兼容|
## 行级锁

**update，delete，insert 都会自动给涉及到的数据加上排他锁，select 语句默认不会加任何锁**

那什么情况下会对读操作加锁呢？

1. select .. lock in share mode，对读取的记录加S锁
2. select ... for update ，对读取的记录加X锁
3. 在事务中读取记录，对读取的记录加S锁
4. 事务隔离级别在 SERIALIZABLE 下，对读取的记录加S锁

**InnoDB中行锁的算法有如下三种**
1. Record Lock：对单个记录加锁
6. Gap Lock：间隙锁，锁住记录前面的间隙，不允许插入记录
7. Next-key Lock：同时锁住数据和数据前面的间隙，即数据和数据前面的间隙都不允许插入记录

写个Demo演示一下
```sql
CREATE TABLE `girl` (
  `id` int(11) NOT NULL,
  `name` varchar(255),
  `age` int(11),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

```java
insert into girl values
(1, '西施', 20),
(5, '王昭君', 23),
(8, '貂蝉', 25),
(10, '杨玉环', 26),
(12, '陈圆圆', 20);
```
#### Record Lock
**对单个记录加锁**

如把id值为8的数据加一个Record Lock，示意图如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/6e118579d9ca4f299e85b899c74b6ba1.png)
Record Lock也是有S锁和X锁之分的，兼容性和之前描述的一样。

SQL执行加什么样的锁受很多条件的制约，比如事务的隔离级别，执行时使用的索引（如，聚集索引，非聚集索引等），因此就不详细分析了，举几个简单的例子。

```sql
-- READ UNCOMMITTED/READ COMMITTED/REPEATABLE READ 利用主键进行等值查询
-- 对id=8的记录加S型Record Lock
select * from girl where id = 8 lock in share mode;

-- READ UNCOMMITTED/READ COMMITTED/REPEATABLE READ 利用主键进行等值查询
-- 对id=8的记录加X型Record Lock
select * from girl where id = 8 for update;
```
### Gap Lock
**锁住记录前面的间隙，不允许插入记录**

**MySQL在可重复读隔离级别下可以通过MVCC和加锁来解决幻读问题**

当前读：加锁
快照读：MVCC

但是该如何加锁呢？因为第一次执行读取操作的时候，这些幻影记录并不存在，我们没有办法加Record Lock，此时可以通过加Gap Lock解决，即对间隙加锁。

![在这里插入图片描述](https://img-blog.csdnimg.cn/3d43e374d4744b20824939caff021f7a.png)

如一个事务对id=8的记录加间隙锁，则意味着不允许别的事务在id=8的记录前面的间隙插入新记录，即id值在(5, 8)这个区间内的记录是不允许立即插入的。直到加间隙锁的事务提交后，id值在(5, 8)这个区间中的记录才可以被提交

我们来看如下一个SQL的加锁过程

```sql
-- REPEATABLE READ 利用主键进行等值查询
-- 但是主键值并不存在
-- 对id=8的聚集索引记录加Gap Lock
SELECT * FROM girl WHERE id = 7 LOCK IN SHARE MODE;
```
由于id=7的记录不存在，为了禁止幻读现象（避免在同一事务下执行相同的语句得到的结果集中有id=7的记录），所以在当前事务提交前我们要预防别的事务插入id=7的记录，此时在id=8的记录上加一个Gap Lock即可，即不允许别的事务插入id值在(5, 8)这个区间的新记录


**给大家提一个问题，Gap Lock只能锁定记录前面的间隙，那么最后一条记录后面的间隙该怎么锁定？**

其实mysql数据是存在页中的，每个页有2个伪记录
1. Infimum记录，表示该页面中最小的记录
2. upremum记录，表示该页面中最大的记录

为了防止其它事务插入id值在(12, +∞)这个区间的记录，我们可以给id=12记录所在页面的Supremum记录加上一个gap锁，此时就可以阻止其他事务插入id值在(12, +∞)这个区间的新记录

### Next-key Lock
**同时锁住数据和数据前面的间隙，即数据和数据前面的间隙都不允许插入记录**
所以你可以这样理解Next-key Lock=Record Lock+Gap Lock
![在这里插入图片描述](https://img-blog.csdnimg.cn/1e316027813b4cfd96ec65f126eadf0e.png)
```sql
-- REPEATABLE READ 利用主键进行范围查询
-- 对id=8的聚集索引记录加S型Record Lock
-- 对id>8的所有聚集索引记录加S型Next-key Lock（包括Supremum伪记录）
SELECT * FROM girl WHERE id >= 8 LOCK IN SHARE MODE;
```

因为要解决幻读的问题，所以需要禁别的事务插入id>=8的记录，所以

- 对id=8的聚集索引记录加S型Record Lock
- 对id>8的所有聚集索引记录加S型Next-key Lock（包括Supremum伪记录）

事物隔离级别的实现
|  | RR | RC |
|--|--|--|
| 普通的select | MVCC | MVCC|
| 加锁的select和更新<br>select .. in shart mode<br> select ... for update <br> insert <br> delete <br> update|  Record Lock <br> Gap Lock <br> Next-key Lock| Record Lock <br> |
