---
layout: post
title: Mybatis是如何兼容这么多日志框架的？
lock: need
---

# Mybatis源码解析：Mybatis是如何兼容这么多日志框架的？

![请添加图片描述](https://img-blog.csdnimg.cn/6170966e9ba247e6a94ef41b873954ef.jpg?)
## 配置打印sql
在开发调试的过程中，我们经常需要查看打印出来的sql来帮助我们排查问题。我们可以在mybatis-config.xml中settings标签配置日志框架，可选的日志框架如下

SLF4J | LOG4J | LOG4J2 | JDK_LOGGING | COMMONS_LOGGING | STDOUT_LOGGING | NO_LOGGING
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<settings>
		<setting name="logImpl" value="SLF4J" />
	</settings>
</configuration>
```
在logback.xml中配置dao包的日志级别为DEBUG，就能打印执行的SQL

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="debug">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
    
    <!--这里是mapper的包名-->
    <logger name="com.javashitang.blog.dao" level="DEBUG"/>
    
</configuration>
```

## 如何兼容这么多日志框架的？
mybatis中支持多种日志框架，用户如果不配置的话则会按如下顺序加载第三方日志
 slf4j > apache commons log > log4j2 > log4j > jul > 不打印log
从LogFactory类的静态代码块中可以看到加载顺序
![在这里插入图片描述](https://img-blog.csdnimg.cn/912683c684794e26937ff62ded9f27b5.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/8b7081387aa34fa4acd806adaa51c1ee.png)
在LogFactory的静态代码块中，会初始化logConstructor这个属性，后续获取log的实现时直接通过构造函数返回即可

那这个Constructor是哪个类的呢？就需要不断的尝试，按照上面的顺序依次加载日志实现类然后调用构造函数，如果构造函数成功执行，则将其构造函数赋到logConstructor，并停止尝试。如果执行失败，则接着尝试

![在这里插入图片描述](https://img-blog.csdnimg.cn/7ccd09b223b44fd0ad15ccb9ba0e09d6.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/2564441e149c41b7a71b504599ad8059.png?)
但是第三方日志都有各自的log级别，mybatis用适配器模式统一提供了trace,debug,warn,error四个级别

org.apache.ibatis.logging.Log接口有多个实现类，实现类即Mybatis提供的适配器
，例如Log4jImpl，Log4j2Impl等，一种实现类提供一个适配器，UML类图如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200220215523465.png?)

上图中Logger对象是org.apache.log4j.Logger，即通过Log4jImpl的适配将对Log接口的操作转化为Logger对象的操作

适配器模式设计的几个角色如下
1. 目标接口（Target）：调用者能够直接使用的接口，即Log接口
2. 需要适配的类（Adaptee）：Adaptee类中有真正的逻辑，但是不能被调用者直接使用，即Logger对象
3. 适配器（Adapter）：实现了Target接口，包装了Adaptee对象

**当然我们在项目中一般也不配置Mybatis适配后的Logger对象，因为级别实在是太少了，INFO级别都没有**
```cpp
import org.apache.ibatis.logging.Log;
import org.apache.ibatis.logging.LogFactory;
public static final Log log = LogFactory.getLog(Test.class);
```
直接配置slf4j的即可
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public static final Logger logger = LoggerFactory.getLogger(Test.class);
```

当然mybatis内部的日志如JDBC模块日志，它没有和特定的日志框架绑定，用的是Mybatis适配后的Log对象，如想控制源码内部用的日志框架，可以在mybatis配置文件中配置一下
## JDBC调试，打印不同类型的日志
在mybatis源码logging模块下有一个jdbc包，当日志级别设置为DEBUG级别时它通过动态代理的方式输出很多实用信息，如输出SQL语句，用户传入的绑定参数，SQL语句影响的行数等信息

你可能会想，为什么要通过动态代理来打印debug级别的日志呢？用log.debug()不就行了，主要还是为了避免日志逻辑和正常逻辑耦合到一块

BaseJdbcLogger是一个抽象类，它是jdbc包下其他Logger类的父类，继承关系如下图
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200219205706801.png)
ConnectionLogger：负责打印连接信息和SQL语句，并创建PreparedStatementLogger
PreparedStatementLogger：负责打印参数信息，并创建ResultSetLogger
StatementLogger：负责打印参数信息，并创建ResultSetLogger
ResultSetLogger：负责打印数据结果信息

**4个类实现的思路是一样的**，这里只分析一下ConnectionLogger

当日志级别为debug时，返回的是被代理后的Connection对象，否则就是正常的Connection对象

org.apache.ibatis.executor.BaseExecutor#getConnection
![在这里插入图片描述](https://img-blog.csdnimg.cn/26dd2431014249ec95dc1b2d0ef443ed.png)

ConnectionLogger对象实现了InvocationHandler接口，返回了代理后的Connection对象

org.apache.ibatis.logging.jdbc.ConnectionLogger#newInstance
![在这里插入图片描述](https://img-blog.csdnimg.cn/7ff72cc2dca4496d9d809e60ae4d7793.png)
具体的代理逻辑如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/7ceb474982f846469e64c7600c6fbedf.png?)
如果是Object类的方法则直接调用，并且对prepareStatement，prepareCall，createStatement则三个方法进行了增强，返回了代理后的PreparedStatement或者Statement，而这些代理后的对象中会打印sql相关的日志

org.apache.ibatis.logging.jdbc.PreparedStatementLogger#invoke
![在这里插入图片描述](https://img-blog.csdnimg.cn/940d15f20af14e1c8e17f057e6bb9ff2.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/0308bf5c6bc24a1993225db29b18dd63.png)

现在知道sql日志是从哪打印的了吧？