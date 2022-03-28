---
layout: post
title: Spring 和 Spring Boot 有哪些区别？
lock: need
---

# Spring Boot源码解析：Spring 和 Spring Boot 有哪些区别？
![在这里插入图片描述](https://img-blog.csdnimg.cn/bcbfe22d9b2c4d318e2e329348e5febc.png?)
## 手写一个Spring Boot
当别人问你Spring和Spring Boot的区别时，你可能会随口而出

1. 应用可以直接运行，而不用打成jar包再放到tomcat中运行
2. 当使用某些功能时，引入相应的starter即可，不用再配置各种Bean了

**其实我觉得自动装配才是Spring Boot最大的创新。应用直接运行我们用嵌入式tomcat就可以办到**。我们把之前的spring mvc项目改为直接运行

依赖如下
```xml
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-context</artifactId>
  <version>5.2.19.RELEASE</version>
</dependency>
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-webmvc</artifactId>
  <version>5.2.19.RELEASE</version>
</dependency>
<dependency>
  <groupId>org.apache.tomcat.embed</groupId>
  <artifactId>tomcat-embed-core</artifactId>
  <version>8.0.28</version>
</dependency>
<dependency>
  <groupId>org.apache.tomcat.embed</groupId>
  <artifactId>tomcat-embed-logging-juli</artifactId>
  <version>8.0.28</version>
</dependency>
<dependency>
  <groupId>org.apache.tomcat.embed</groupId>
  <artifactId>tomcat-embed-jasper</artifactId>
  <version>8.0.28</version>
</dependency>
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/e319b99e6ff84d99b411e46de2b7e683.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/04aa9569a4624461880980fd6ea40cc5.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/495f98e9b11d4ba9bb4780fc14238cc1.png?)

这3个类就是我们之前分析Spring MVC源码用到的，工作原理我就不再重复了。现在我们要把它改造为直接通过main方法运行

![在这里插入图片描述](https://img-blog.csdnimg.cn/fac12bd849584f9eb64be40789975e2a.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/c19a58b2860b4779b2ed2cfa9c7a3ae1.png?)
点击main方法即可运行，和我们启动Spring Boot的方式很类似把。这里说个挺有意思的问题，为什么我们这个Demo运行完main方法后为什么没有直接退出呢？

其实导致进程退出的条件之一是非daemon线程完全终止，那么我们只需要应用中包含一个非daemo线程不会终止，main在运行完就不会退出。上面的awaitThread就是一个非daemon线程，并且一直在阻塞监听请求，所以在main方法运行完毕后，不会退出，spring boot也是用这种方式实现的

一个典型的Spring Boot的启动类如下
```java
@SpringBootApplication
public class BlogApplication {
	public static void main(String[] args) {
		SpringApplication.run(BlogApplication.class, args);
	}
}
```
写成如下形式你可能更好理解
```java
@Configuration
@ComponentScan
@EnableAutoConfiguration
public class BlogConfiguration {
}


public class BlogApplication {
	public static void main(String[] args) {
		SpringApplication.run(BlogConfiguration.class, args);
	}
}
```
可以看到并没有多少新奇的东西，@Configuration和@ComponentScan我们在之前就接触到了，而@EnableAutoConfiguration算是一个创新，用来实现自动装配。下节我们会分析@EnableAutoConfiguration是如何实现自动装配的。

出去自动装配，Spring Boot的源码和我们代码的区别就是

Spring容器是在main中启动spring容器和tomcat的，在WebApplicationInitializer实现类中，将DispatcherServlet注册到tomcat中

而我们的代码只在main方法中启动了tomcat容器，在WebApplicationInitializer实现类中启动spring容器和将DispatcherServlet注册到tomcat中。你可以将上面的代码改一下，改成和Spring容器一样的形式
