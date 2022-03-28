---
layout: post
title: 详解Spring Boot启动流程
lock: need
---

# 详解Spring Boot启动流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325182719144.jpg?)
## 新增扩展点
Spring Boot相对于Spring在启动流程上来说并没有太大的区别，只是借助于SpringApplication将启动过程模版化了，并在其中增加了批量注册，自动装配的功能，并开放了一系列的扩展点

对了还有一个重要的区别，原来基于servlet的web应用，是由servlet容器如tomcat来启动spring容器，现在是spring容器来启动servlet容器


### SpringApplicationRunListener

SpringApplicationRunListener它可以在Spring Boot main方法启动过程中接收不同时间点的事件。
```java
public interface SpringApplicationRunListener {

	// 开始启动
	default void starting() {
	}

	// environment准备好了
	default void environmentPrepared(ConfigurableEnvironment environment) {
	}

	// context准备好了
	default void contextPrepared(ConfigurableApplicationContext context) {
	}

	default void contextLoaded(ConfigurableApplicationContext context) {
	}

	default void started(ConfigurableApplicationContext context) {
	}

	default void running(ConfigurableApplicationContext context) {
	}

	default void failed(ConfigurableApplicationContext context, Throwable exception) {
	}

}
```

Spring Boot中SpringApplicationRunListener的实现类就有一个EventPublishingRunListener，基本就是在各个时间点发布相应的事件，如ApplicationStartingEvent，ApplicationEnvironmentPreparedEvent等，有需要的化可以监听这些事件扩展启动的过程

当我们想用SpringApplicationRunListener进行扩展时，在当前应用的classpath下的META-INF/spring.factories中配置key为org.springframework.boot.SpringApplicationRunListener的实现类即可

### CommandLineRunner
**CommandLineRunner是Spring Boot特有的扩展接口，和它类似的还有一个ApplicationRunner接口**

CommandLineRunner和ApplicationRunner会在ApplicationContext完全启动后开始执行
可以利用这个接口做一些初始化工作，或者打印加载容器中的Bean，方便排查问题

```java
@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

    @Bean
    public CommandLineRunner commandLineRunner(ApplicationContext context) {
	    return args -> {
            String[] bns = context.getBeanDefinitionNames();
            for (String beanName : bns) {
                System.out.println(beanName);
            }
        };
    }
}
```
如果你对Spring Boot启动过程中的扩展点的默认实现感兴趣的话，可以看一下spring.factories文件

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328121251601.png?)
## SpringApplication的创建
Spring Boot的启动过程大致可以分为如下4步（基于Servlet容器的we应用）
1. SpringApplication的创建
2. SpringApplication的启动
3. WebServer的创建与启动
4. DispatcherServlet的注册

![在这里插入图片描述](https://img-blog.csdnimg.cn/df29c9287a7e4a0696c79c63df234922.png)
primarySource是启动的配置类
![在这里插入图片描述](https://img-blog.csdnimg.cn/118ef25c9cc24c2d8f3a6d0df03c03de.png)
推断web容器的方式比较简单，看classpath中是否有相应的类
![在这里插入图片描述](https://img-blog.csdnimg.cn/9bc76eb49ee54f29b1d4dc34a20000e1.png?)
SpringApplication的创建比较简单，画图总结一下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328162220893.png?)
## SpringApplication的启动
![在这里插入图片描述](https://img-blog.csdnimg.cn/a94deccb22bf4c7699dcb526253aa5d6.png?)
SpringApplication的源码就不追了，大概就是这样一个启动流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/2fcaaf88d24f4c7aa4f079497489bb49.png?)

其中通告starting，就是执行SpringApplicationRunListener#starting方法。以此类推

##  WebServer的创建与启动
启动Application的过程其实就是执行AbstractApplicationContext#refresh方法，这个方法我们之前仔细分析过了哈，就是一个启动的模版方法，子类可以基于这个方法进行扩展。本节我们就简单看一下针对servlet这种容器，在启动的过程中做了哪些扩展！

![在这里插入图片描述](https://img-blog.csdnimg.cn/88f3b120a9454e3389bdec68c46a1e85.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/0365085df22c475ab667fab754b64979.png)
ServletWebServerApplicationContext#createWebServer
![在这里插入图片描述](https://img-blog.csdnimg.cn/cd486db552c74b84befa0d6ca55c0858.png?)
创建的时候传入了一个ServletContextInitializer接口的实现类，这个类后面会用到哈，先在这里提一下

ServletWebServerApplicationContext#getSelfInitializer
![在这里插入图片描述](https://img-blog.csdnimg.cn/c1917f168f3a48578284e6df08bdfd04.png?)

画图总结一下WebServer的创建与启动过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/9891aea3f2f447ea913318b3b9f2a560.png?)
## DispatcherServlet的注册
将DispatcherServlet注册到WebServer的过程主要分为如下2个部分
1. DispatcherServlet被注册到Spring容器中
2. ServletRegistrationBean包装了DispatcherServlet，并将DispatcherServlet注册到WebServer中

#### DispatcherServlet怎么被注册到Spring容器中的
很简单，在DispatcherServlet的无参构造方法上加一个断点

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328153553722.png?)
看下一个调用栈，实在DispatcherServletAutoConfiguration中被注入进来的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328153835156.png?)
这个配置类在spring.factories文件中，所以Spring Boot启动就会加载这个类，但这只是将DispatcherServlet注入到spring容器，所以一定是有其他的Bean把DispatcherServlet注入到Servlet容器中的，查找到用了DispatcherServlet类的Bean就只有DispatcherServletRegistrationBean
![在这里插入图片描述](https://img-blog.csdnimg.cn/97a7098af3c948ceb6242b0f40027075.png?)
那估计就是DispatcherServletRegistrationBean将DispatcherServlet注入到Servlet容器了
### 为什么DispatcherServletRegistrationBean能把DispatcherServlet注入到Servelt容器中呢？

**这时候就不得不提我们在Spring MVC的启动流程中提到的ServletContainerInitializer接口了，Servlet3.0之后Servlet容器启动后得回调ServletContainerInitializer#onStartup方法，这是规范得遵守。**

在tomcat启动后会调用TomcatStarter#onStartup方法，接着调用ServletContextInitializer#onStartup方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/665df21476ad46ac8595adb5b4be0f04.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/7bbe39cc8d814738bf792cfe3905df35.png?)
![请添加图片描述](https://img-blog.csdnimg.cn/2225b825087e452289280e94e741020c.png)

DispatcherServletRegistrationBean实现了ServletContextInitializer接口，在onStartup方法中将servlet注入到servlet容器

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328172814634.png?)
我直接总结一下把，你对着我的流程图debug就懂了

1. 通过DispatcherServletAutoConfiguration往spring容器中注入DispatcherServlet
2. DispatcherServlet被包装为DispatcherServletRegistrationBean，用于向Servlet容器中注册
3. 在Tomcat创建阶段，将ServletContainerInitializer接口的实现类（即selfInitialize方法）设置到TomcatStarter中
4. 把TomcatStarter注册到Tomcat中
5. Tomcat启动后，会调用ServletContainerInitializer#onStartup，即调用TomcatStarter#onStartup，接着调用ServletWebServerApplicationContext#selfInitialize
6. selfInitialize方法回调ServletContextInitializer#onStartup方法
7. DispatcherServletRegistrationBean实现类ServletContextInitializer接口，所以会调用父类的
RegistrationBean#onStartup方法
8. 在RegistrationBean#onStartup方法中会把内部维护的Servlet，Listener，Filter注册到ServletContext中