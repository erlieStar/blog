---
layout: post
title: SQL执行流程
lock: need
---

# Mybatis源码解析：SQL执行流程

![请添加图片描述](https://img-blog.csdnimg.cn/3deb9e21bb434547a8d50bde8085d28f.jpg?)
## 各种Executor的作用
在前面的文章中我们演示了通过SqlSession来执行sql，其实SqlSession只是一个api类，主要是为了方便用户的使用，典型的门面模式
![在这里插入图片描述](https://img-blog.csdnimg.cn/3d8f7f2c43dd4dcd93b71f47903517ff.png)
Executor通过操作StatementHandler来执行sql，并返回结果，因此Executor起到了一个承上启下的作用
![在这里插入图片描述](https://img-blog.csdnimg.cn/5f0daea2d06748dab6441d7e89e2be1d.png?)

**在mybatis中最重要的组件有如下4个**

Executor：驱动sql执行
StatementHandler：调用Statement执行sql
ParameterHandler：给执行的sql设置参数
ResultSetHandler：将返回的ResultSet封装为Java对象

Executor的类的继承关系如下图所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/2e637111a62a46e2ba7a012da76a91bc.png?)

**Executor的设计是一个典型的装饰者模式，SimpleExecutor，ReuseExecutor是具体实现类，而CachingExecutor是装饰器类**

| 类型 | 作用 |
|--|--|
|  SimpleExecutor| 默认配置，使用PreparedStatement对象访问数据库，每次访问都要创建新的PreparedStatement对象 |
| ReuseExecutor |  使用PreparedStatement对象访问数据库，访问时会重用statement对象|
| BatchExecutor | 批量执行增删改sql |
| BaseExecutor | 用来维护一级缓存 |
|  CachingExecutor| 用来维护二级缓存 |

**其中BaseExecutor的设计又用到了模版模式，例如query方法封装了操作一级缓存的内容，而其实现类会重写doQuery方法，到数据库中去查询数据**

后面我们会详细分析一级缓存和二级缓存，先演示一下三种具体Executor的区别
```java
public class UserInfo {

  private Integer id;

  private String name;

  private Integer age;
}
```

```java
public interface UserInfoMapper {

  @Select("select * from user_info WHERE id = #{id}")
  UserInfo selectById(int id);

  @Update("update user_info set name = #{name} where id = #{id}")
  int updateNameById(String name, Integer id);
}
```
mybatis-config.xml

![在这里插入图片描述](https://img-blog.csdnimg.cn/9384f9f465924fea84549a14aa7a946e.png?)

初始化环境测试环境
![在这里插入图片描述](https://img-blog.csdnimg.cn/9dd49acef95f4dbaa6cfe22b98663155.png?)
**测试SimpleExecutor**
![在这里插入图片描述](https://img-blog.csdnimg.cn/696c803d3f154d99a68c5b6c7b6f7cdc.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/b65835b78bdc478597f58d2243646f83.png?)
从日志可以看到SimpleExecutor每次都会重新编译Statement

**测试ReuseExecutor**
![在这里插入图片描述](https://img-blog.csdnimg.cn/5ea519061eda4e9d95029b86a55629e1.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/61f9fa2bcb804d869482fa6afc9c856f.png?)
从日志可以看到ReuseExecutor会重用Statement，并不会每次重新编译Statement

**测试BatchExecutor**
BatchExecutor是用来批量执行增删改sql的
![在这里插入图片描述](https://img-blog.csdnimg.cn/04f45fdc8f16437eaaea9f35e98254d7.png?)
当执行完上面的Test后你会发现更改并未生效，你需要手动刷行一下，如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/3673c1f288614c029b5885503097d37b.png?)
假如你执行了多个更改sql，只有当你手动执行的时候才会刷新

**当一次执行的sql过多时，用SimpleExecutor可能会有性能问题，此时你就可以选用BatchExecutor来执行sql**

## 执行流程
默认情况下我们都是使用SimpleExecutor来执行sql，以doQuery为例看一下具体的执行流程

org.apache.ibatis.executor.SimpleExecutor#doQuery
![在这里插入图片描述](https://img-blog.csdnimg.cn/6eb43c6151d944a5909ae933f8f5fc0b.png?)
这段代码就包含了整体的执行流程
1. 首先根据配置创建一个StatementHandler
2. 然后利用ParameterHandler给Statement设置参数
3. 最后StatementHandler调用Statement执行sql，并通过ResultSetHandler将ResultSet封装成需要的对象，返回给用户

mybatis中有三种具体的StatementHandler，每个类的作用如下
![请添加图片描述](https://img-blog.csdnimg.cn/3406ee8be1934f1d8d4f97533923bd92.png?x-)
|StatementHandler 实现类 | 作用 |
|--|--|
|SimpleStatementHandler  | 调用Statement执行sql，因此要执行的sql没有？，不用设置参数 |
| PreparedStatementHandler | 调用PreparedStatement执行sql，sql有可能有？，当有？的时候需要设置参数 |
| CallableStatementHandler | 调用CallableStatement执行脚本 |
### ParameterHandler设置参数
org.apache.ibatis.executor.SimpleExecutor#prepareStatement
![在这里插入图片描述](https://img-blog.csdnimg.cn/d23d144e6937436595edf4669a906227.png)
org.apache.ibatis.executor.statement.PreparedStatementHandler#parameterize
![在这里插入图片描述](https://img-blog.csdnimg.cn/2220738230ee4bd1be075a7c8069d3be.png)
org.apache.ibatis.scripting.defaults.DefaultParameterHandler#setParameters
![在这里插入图片描述](https://img-blog.csdnimg.cn/755223b27b234f49984db38351cae0be.png?)
这个是设置参数最重要的方法，后续会单开一节来分析

**另外你可以看到SimpleStatementHandler#parameterize方法是一个空实现，因为SimpleStatementHandler通过调用Statement来执行sql，不需要设置参数哈**

org.apache.ibatis.executor.statement.SimpleStatementHandler#parameterize
![在这里插入图片描述](https://img-blog.csdnimg.cn/d72b28ec5de644aab2b2a444a9d2cab7.png)

### StatementHandler调用Statement执行sql
调用BoundSql#getSql获取的sql只会有？，并且在前面通过ParameterHandler设置好参数了，因此直接执行就行，然后通过ResultSetHandler将返回的结果封装成特定的类型返回
![在这里插入图片描述](https://img-blog.csdnimg.cn/bea4a17c807d4d519a41865902cc2dc1.png)
ResultSetHandler我就不分析了哈，mybatis源码最复杂的一个类，没有之一

## DefaultSqlSession有问题？
之前的文章我们分析过，在启动的过程我们会利用SqlSessionFactoryBuilder创建SqlSessionFactory，最终返回的是DefaultSqlSessionFactory，调用openSession方法返回的是DefaultSqlSession。
![在这里插入图片描述](https://img-blog.csdnimg.cn/56eaee8c07244438a7767db92062128d.png)

但是DefaultSqlSession这个api类还并不是很好用，有很多问题
![在这里插入图片描述](https://img-blog.csdnimg.cn/10ea48a0a8e544f4b550c15353ae27f2.png)
**比如DefaultSqlSession不是线程安全的，所以DefaultSqlSession不能是单例，另外我们还得手动关闭DefaultSqlSession**

**为什么DefaultSqlSession不是线程安全的呢？**

因为一个DefaultSqlSession只会开启一个Connection。所以当多个线程使用DefaultSqlSession时，其中一个线程执行完毕，调用close方法，将Connection关闭，另一个线程就会报错
![在这里插入图片描述](https://img-blog.csdnimg.cn/2eaae774e40d4effbc8944dde5611266.png)
当使用sqlSessionManager时，会利用ThreadLocal来保证线程安全
![在这里插入图片描述](https://img-blog.csdnimg.cn/e415b7e826974b8fb6eb0b930fb3a233.png)
getMapper方法传入的SqlSession是自己

org.apache.ibatis.session.SqlSessionManager#getMapper
![在这里插入图片描述](https://img-blog.csdnimg.cn/276e5e7bc40c42f3a567911a2efe2469.png)
因此当mapper接口操作sql时会调用到SqlSessionManager中的方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/6c62cd9beb8d4ffe979d55b01aa58961.png)
SqlSessionManager将执行过程交给sqlSessionProxy，sqlSessionProxy又是一个动态代理类
![在这里插入图片描述](https://img-blog.csdnimg.cn/ee963f7c49564c45b71df53b8b55b5b5.png?)

sql的执行过程会进入SqlSessionInterceptor#invoke方法，先从ThreadLocal中获取，如果没有的话再创建，保证了线程安全
![在这里插入图片描述](https://img-blog.csdnimg.cn/d353d444e0f64f76abc79c36fa710d25.png?)
所以使用SqlSessionManager比直接使用DefaultSqlSession有如下2个好处

1. 利用try-with-resource语法糖，解决自动关闭
2. 利用ThreadLocal，解决线程安全****