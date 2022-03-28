---
layout: post
title: JDBC用法一览
lock: need
---
# Mybatis源码解析：JDBC用法一览

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210409161419847.jpg?)
## JDBC相关的基础知识 
在正式分析mybatis源码之前，我们需要对JDBC的api有一个比较清晰的认识，因为mybatis就是基于JDBC的封装，理解了这些常用的api，能提高我们阅读源码的速度。

**JDBC的所有编程接口包含在java.sql和javax.sql这2个包中**

| 相关类 | 作用 |
|--|--|
|DriverManager | 驱动管理器，加载JDBC驱动，获得数据库连接 |
|DataSource | 代表特定数据源，修改DataSource的属性，就可以获取不同数据源的Connection对象，JDBC没有DataSource的具体实现，主流数据库连接池实现了这个接口，如DBCP，Druid等 |
| Connection | 数据库连接接口 |
|Statement  | 语句接口，用来静态操作SQL语句 |
| PreparedStatement |  预定义语句，用来动态操作SQL语句|
| CallableStatement | 可以调用存储过程的预定义语句 |
| ResultSet | 结果集，保存数据记录的结果集合 |
| ResultSetMetaData | 结果集元数据，如列名称，列类型等 |
| DataBaseMetaData | 元数据，如数据库名称，版本等 |

我们可以通过如下两种方式获取JDBC的Connection对象
1. 通过JDBC api提供的DriverManager类来获取
2. 通过DataSource接口的实现类来获取（**主要就是利用池的机制来复用连接，提供系统性能**）

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021040419383537.png?)

Statement：定义了执行SQL语句的方法，这些方法不支持参数输入
PreparedStatement：增加了设置SQL参数的方法
CallableStatement：增加了调用存储过程以及检索存储过程调用结果的方法

## 使用JDBC进行开发
在MySQL下面建立一个test的库，接着就是创建表和插入记录

```sql
create table user_info
(
  id  int auto_increment comment '用户id' primary key,
  name varchar(255) not null comment '用户名',
  age int not null comment '年龄'
);


INSERT INTO `user_info`(`name`, `age`) VALUES ('1', 1);
INSERT INTO `user_info`(`name`, `age`) VALUES ('2', 2);
INSERT INTO `user_info`(`name`, `age`) VALUES ('3', 3);
```
pom文件中加入加入mysql依赖

```xml
<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
	<version>5.1.35</version>
	<scope>runtime</scope>
</dependency>
```

**Statement语句是SQL语句的描述，使用它可以操作各种SQL语句，包括DDL（数据定义语句，如创建表）DML（CRUD）和DCL（修改权限）等**

**ResultSet用来获取SQL语句的查询结果**

**通过DriverManager来获取连接**
```java
Connection connection = DriverManager.getConnection("jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false", "test", "test");
String sql = "select id, name, age from user_info";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(sql);
while(rs.next()) {
    int id = rs.getInt(1);
    String name = rs.getString(2);
    String email = rs.getString(3);
    System.out.println(id + "," + name + "," + email);
}
connection.close();
```
**通过DataSource来获取连接**
```java
Map<String, Object> configMap = new HashMap<>();
configMap.put("driverClassName", "com.mysql.jdbc.Driver");
configMap.put("url", "jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false");
configMap.put("username", "test");
configMap.put("password", "test");
configMap.put("initialSize", "5");
configMap.put("maxActive", "10");
DataSource dataSource = DruidDataSourceFactory.createDataSource(configMap);
Connection connection = dataSource.getConnection();
String sql = "select id, name, age from user_info";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(sql);
while(rs.next()) {
    int id = rs.getInt(1);
    String name = rs.getString(2);
    String email = rs.getString(3);
    System.out.println(id + "," + name + "," + email);
}
connection.close();
```

**PreparedStatement在Statement的基础上提供了使用？作为参数占位符的功能，并且提供了相应的方法为参数占位符设值**

```java
Connection connection = DriverManager.getConnection("jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false", "test", "test");
String sql = "insert user_info(name, age) values (?, ?)";
PreparedStatement pstmt = connection.prepareStatement(sql);
pstmt.setString(1, "testName");
pstmt.setInt(2, 10);
pstmt.execute();
connection.close();
```

## CallableStatement
**CallableStatement继承PreparedStatement，提供了调用存储过程的能力**
1. 调用简单的存储过程
2. 调用有输入参数的存储过程
3. 调用有输入输出参数的存储过程

先在数据中执行如下sql创建表和存储过程
```sql
-- 创建表
CREATE TABLE `kf_user_info` (
  `id` int(11) NOT NULL COMMENT '用户id',
  `gid` int(11) NOT NULL COMMENT '客服组id',
  `name` varchar(25) NOT NULL COMMENT '客服名字'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='客户信息表';

-- 存储过程如果存在则删除
DROP PROCEDURE IF EXISTS create_kf_use_arg;
-- 定义存储过程
DELIMITER //
CREATE PROCEDURE create_kf_use_arg(IN loop_times INT)
BEGIN
    DECLARE var INT;
    SET var = 1;
    WHILE var <= loop_times DO
    INSERT INTO kf_user_info (`id`,`gid`,`name`)
    VALUES (var, var, var);
    SET var = var + 1;
    END WHILE;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS get_kf;
DELIMITER //
CREATE PROCEDURE get_kf(IN num int)
BEGIN
    SELECT `id`,`gid`,`name` FROM kf_user_info kf_user_info WHERE id = num;
END //
DELIMITER ;
```

```java
Connection connection = DriverManager.getConnection("jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false", "root", "XpFNhfrEM6eIlRB1");
// 插入5条记录
CallableStatement cs = connection.prepareCall("call create_kf_use_arg(5)");
cs.execute();
// 获取id=5的记录
cs = connection.prepareCall("call get_kf(5)");
cs.execute();
ResultSet rs = cs.getResultSet();
while(rs.next()) {
    int id = rs.getInt(1);
    String name = rs.getString(2);
    String email = rs.getString(3);
    System.out.println(id + "," + name + "," + email);
}
connection.close();
```