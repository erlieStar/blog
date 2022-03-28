---
layout: post
title: Spring MVC启动流程
lock: need
---

# Spring MVC源码解析：Spring MVC启动流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325140830473.jpg?)
## 基于XML配置的容器启动过程
我们常用的Spring MVC是基于Servlet规范实现的，所以我们先来回顾一下Servlet相关的内容。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325144034710.png?)

如果我们直接用Servlet来开发web应用，只需要继承HttpServlet，实现service方法即可，HttpServlet继承自Servlet，Servlet中常用的方法如下

```java
public interface Servlet {

	// 初始化，只会被调用一次，在service方法调用之前完成
    void init(ServletConfig config) throws ServletException;
    
    ServletConfig getServletConfig();
    
    // 处理请求
    void service(ServletRequest req, ServletResponse res）throws ServletException, IOException;
    
    String getServletInfo();
    
    // 销毁
    void destroy();
}
```

**每个Servlet有一个ServletConfig，用来保存和Servlet相关的配置
每个Web应用有一个ServletContext，用来保存和容器相关的配置**

考虑到很多小伙伴可能对Servlet的很多用法不熟悉了，简单介绍一下，就用xml配置了，当然你可以用JavaConfig的方式改一下

项目结构如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325150909797.png)

web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
          http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

  <context-param>
    <param-name>configLocation</param-name>
    <param-value>test</param-value>
  </context-param>

  <servlet>
    <servlet-name>userServlet</servlet-name>
    <servlet-class>com.javashitang.controller.UserServlet</servlet-class>
    <init-param>
      <param-name>helloWord</param-name>
      <param-value>hello sir</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
  </servlet>

  <servlet-mapping>
    <servlet-name>userServlet</servlet-name>
    <url-pattern>/user.do</url-pattern>
  </servlet-mapping>

  <listener>
    <listener-class>com.javashitang.listener.MyServletContextListener</listener-class>
  </listener>

</web-app>
```

```java
public class UserServlet extends HttpServlet {

    private String helloWord;

    @Override
    public void init(ServletConfig config) throws ServletException {
        this.helloWord = config.getInitParameter("helloWord");
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/html");
        PrintWriter out = resp.getWriter();
        String userId = req.getParameter("userId");
        out.println(helloWord + " " + userId);
    }
}
```
xml配置文件中可以用init-param标签给Servlet设置一些配置，然后在init方法中通过ServletConfig来获取这些配置，做初始化
```
访问
http://localhost:8080/user.do?userId=1
返回
hello sir 1
```
可以看到我们针对这个servlet还配置了load-on-startup这个标签，那么这个标签有什么用呢？

**load-on-startup表示当容器启动时就初始化这个Servlet，数组越小，启动优先级越啊高。当不配置这个标签的时候则在第一次请求到达的时候才会初始化这个Servlet**

context-param标签是容器的初始化配置，可以调用容器的getInitParameter方法获取属性值

**Listener是一种扩展机制，当Web应用启动或者停止时会发送各种事件，我们可以用Listener来监听这些事件，做一些初始化工作。如监听启动事件，来初始化数据库连接等。**

我这个demo只是获取了一下配置文件的位置，并打印出来。
```java
public class MyServletContextListener implements ServletContextListener {

	// 容器启动
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext sc = sce.getServletContext();
        String location = sc.getInitParameter("configLocation");
        System.out.println(location);
    }

	// 容器销毁
    public void contextDestroyed(ServletContextEvent sce) {

    }
}
```


### 基于Xml写一个Spring MVC应用
我们基于xml方式写一个spring mvc应用，基于这个应用来分析，项目结构如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325151118208.png)

web.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
		 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		 xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
          http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
		 version="3.1">
		 
	<context-param>
		<param-name>contextConfigLocation</param-name>
		<param-value>classpath:spring-context.xml</param-value>
	</context-param>

	<listener>
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>

	<servlet>
		<servlet-name>dispatcher</servlet-name>
		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
		<init-param>
			<param-name>contextConfigLocation</param-name>
			<param-value>classpath:spring-mvc.xml</param-value>
		</init-param>
		<load-on-startup>1</load-on-startup>
	</servlet>

	<servlet-mapping>
		<servlet-name>dispatcher</servlet-name>
		<url-pattern>/</url-pattern>
	</servlet-mapping>

</web-app>
```

spring-context.xml（配置service，dao层）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns:context="http://www.springframework.org/schema/context"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">

	<context:component-scan base-package="com.javashitang.service"/>

</beans>
```

spring-mvc.xml（配置和spring mvc相关的配置）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns:context="http://www.springframework.org/schema/context"
	   xmlns:mvc="http://www.springframework.org/schema/mvc"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd  http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc.xsd">

	<context:component-scan base-package="com.javashitang.controller"/>
	<mvc:annotation-driven/>

</beans>
```

```java
@RestController
public class UserController implements ApplicationContextAware {

	@Resource
	private UserService userService;
	private ApplicationContext context;

	@RequestMapping("user")
	public String index(@RequestParam("userId") String userId) {
		return userService.getUsername(userId);
	}

	@Override
	public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
		this.context = applicationContext;
		System.out.println("UserController " + context.getId());
	}
}
```

```java
public interface UserService {

	String getUsername(String userId);
}
```

```java
@Service
public class UserServiceImpl implements UserService, ApplicationContextAware {

	private ApplicationContext context;

	@Override
	public String getUsername(String userId) {
		return userId;
	}

	@Override
	public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
		this.context = applicationContext;
		System.out.println("UserServiceImpl " + context.getId());
	}
}
```

我们之所以要用2个配置文件，是因为在Spring MVC中有2个容器

父容器由ContextLoaderListener来初始化，一般用来存放一些dao层和service层的Bean
子容器由DispatcherServlet来初始化，一般用来存放controller层的Bean

**项目启动后从打印出的值就可以看出来，Service和Controller是从2个容器获取的**

```java
UserServiceImpl org.springframework.web.context.WebApplicationContext:
UserController org.springframework.web.context.WebApplicationContext:/dispatcher
```

**子容器可以访问父容器中的Bean，父容器不能访问子容器中的Bean。当从子容器找不到对应的Bean时，会从父容器中找**

![在这里插入图片描述](https://img-blog.csdnimg.cn/e75043b7ac7145c0a1b7a9f44ec2fe59.png?)
### 父容器启动
父容器由ContextLoaderListener来初始化，当tomcat启动的时候，发布启动事件，调用ContextLoaderListener#contextInitialized方法，接着调用initWebApplicationContext方法

org.springframework.web.context.ContextLoaderListener#contextInitialized
![在这里插入图片描述](https://img-blog.csdnimg.cn/ac5d01dff17d4b1eacebbdb36f809a16.png)
org.springframework.web.context.ContextLoader#initWebApplicationContext
![在这里插入图片描述](https://img-blog.csdnimg.cn/454e9ee5472b4da2b986e7ea9ff28871.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021032516052999.png?)
### 子容器启动
子容器的启动在DispatcherServlet#init方法中

DispatcherServlet中并没有重写init方法，那就实在父类中了，HttpServletBean重写了init方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325153353538.png?)
HttpServletBean#init
![在这里插入图片描述](https://img-blog.csdnimg.cn/7dc93ba1e4974f97ba4a4bc9eec056c4.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/7c0699bfbe3c4f9eb80df9f44d11fe11.png?)

用流程图总结一下过程

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325161044613.png?)
**如果你觉得父容器没啥作用的话，可以把所有的Bean都放在子容器中**

当配置父子容器的时候还是比较容易踩坑的，比如在子容器中配置了Bean A，在父容器中配置了Bean B，Bean B使用自动注入依赖了Bean A，此时因为父容器无法查找子容器的Bean，就会抛出找不到Bean A的异常。

可能觉得父子容器这种设计并不是特别好，所以在Spirng MVC用JavaConfig的方式配置时或者用Spirng Boot开发时，都只存在单一的ApplicationContext
## 基于JavaConfig配置的容器启动过程
Servlet3.0以后出了新规范，Servlet容器容器在启动的时候需要回调javax.servlet.ServletContainerInitializer接口的onStartup方法，方法的实现类放在META-IN/services/javax.servlet.ServletContainerInitializer文件中，典型的spi代码

**这个接口特别重要，Spring Boot中不用web.xml也能启动注册DispatcherServlet的奥秘就在这个接口上**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325170446750.png?)
Servlet3.0并且还提供了一个@HandlesTypes注解，里面指定一个类型，servlet容器会把该类型的子类或者实现类，放到ServletContainerInitializer#onStartup方法中的webAppInitializerClasses参数中，然后实现自己的逻辑
![在这里插入图片描述](https://img-blog.csdnimg.cn/f97eb8f1b173414591597b0ecc71aa65.png?)
### 基于JavaConfig写一个Spring MVC应用
**既然容器启动的时候会调用WebApplicationInitializer#onStartup方法，我们就把初始化容器的操作放到这个方法中，就不搞父子容器了，一个容器搞定**

用JavaConfig写一个Spring MVC应用超级简单

```java
public class MyWebApplicationInitializer implements WebApplicationInitializer {


	@Override
	public void onStartup(ServletContext servletContext) throws ServletException {
		// Load Spring web application configuration
		AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
		context.register(AppConfig.class);

		// Create and register the DispatcherServlet
		DispatcherServlet servlet = new DispatcherServlet(context);
		ServletRegistration.Dynamic registration = servletContext.addServlet("app", servlet);
		registration.setLoadOnStartup(1);
		registration.addMapping("/*");
	}
}
```

```java
@EnableWebMvc
@ComponentScan("com.javashitang")
public class AppConfig {
}
```

```java
@RestController
public class UserController {

	@RequestMapping("user")
	public String index(@RequestParam("userId") String userId) {
		return "hello " + userId;
	}
}
```

启动流程如下

1. tomcat启动过程中回调ServletContainerInitializer#onStartup方法，并把@HandlesTypes中的WebApplicationInitializer实现类作为参数传入
2. ServletContainerInitializer#onStartup方法会调用WebApplicationInitializer#onStartup，完成容器的初始化工作（我们只设置了一个容器哈）

**启动过程除了Spring容器初始化是在Web容器回调WebApplicationInitializer接口时发生的，其余的都一样**
