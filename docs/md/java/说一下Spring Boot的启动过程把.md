---
layout: post
title: 说一下Spring Boot的启动过程把！
lock: need
---

# 面试官：说一下Spring Boot的启动过程把！
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325182719144.jpg?)
## 介绍
Spring Boot相对于Spring在启动流程上来说并没有太大的区别，只是借助于SpringApplication将启动过程模版化了，并在其中增加了批量注册，自动装配的功能，并开放了一系列的扩展点

对了还有一个重要的区别，原来基于servlet的web应用，是由servlet容器如tomcat来启动spring容器，现在是spring容器来启动servlet容器

常见的扩展点有如下几种

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

### ApplicationListener
ApplicationListener是Spring容器中事件监听接口，用来接收各种事件，典型观察者模式的实现
上面说到Spring Boot在SpringApplication启动过程中会利用EventPublishingRunListener发送各种事件，我们可以利用ApplicationListener进行监听，并增加自己的扩展

Spring Boot中我们可以通过如下三种方式添加自定义的ApplicationListener

1. 实现ApplicationListener接口，调用SpringApplication#addListeners或者SpringApplication#setListeners注册
2. 实现ApplicationListener接口，在META-INF/spring.factories文件中配置key=org.springframework.context.ApplicationListener的实现类
3. 方法上加@EventListener注解
### ApplicationContextInitializer
ApplicationContextInitializer是Spring中的扩展点，这个是在ConfigurableApplicationContext类型（或者子类型）的ApplicationContext做refresh之前，允许我们对ConfigurableApplicationContext做进一步的处置

我们可以通过如下2种方式添加自定义的SpringApplicationRunListener

1. 调用springApplication#addInitializers注册
2. 在META-INF/spring.factories文件中配置key=org.springframework.context.ApplicationContextInitializer的实现类

### CommandLineRunner
CommandLineRunner是Spring Boot特有的扩展接口，和它类似的还有一个ApplicationRunner接口

CommandLineRunner和ApplicationRunner会在ApplicationContext完全启动后开始执行（你可以认为是main方法执行的最后一步）

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
## Spring Boot启动过程
搞懂来Spring Boot的扩展点，再回过头来看Spring Boot的启动过程就比较清晰了

Spring Boot的启动过程大致可以分为如下4步（基于Servlet容器的we应用）
1. SpringApplication的创建
2. SpringApplication的启动
3. WebServer的创建与启动
4. DispatcherServlet的注册

### SpringApplication的创建
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328162220893.png?)
### SpringApplication的启动
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021032818040917.png?)
###  WebServer的创建与启动

前面说过WebServer的创建过程是在Spring启动过程中，在子类的onRefresh方法中，因为Servlet容器有很多中，所有用了工厂方法模式来创建对应的工厂，ServletWebServerFactory的自动注册过程我就不分析了，有兴趣的可以自己看看。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328172814634.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328173432199.png?)
我原来看这块代码的时候比较晕，死活没看懂这个this::selfInitialize是啥意思。然后我就仿造它写了一个Demo

```java
public interface TestInterface {

    void doSomething();
}
```

```java
public class TestInterfaceTest {

    @Test
    public void doSomething() {
        // doSomething
        // real
        TestInterface testInterface = getInterface();
        System.out.println("doSomething");
        testInterface.doSomething();
    }

    private TestInterface getInterface() {
        return this::real;
    }

    private void real() {
        System.out.println("real");
    }
}
```

我这个demo应该演示的很清楚了把，它是把接口的实现过程放到一个方法中了，等调用接口的时候会调用方法

你追一遍代码你会发现最终把ServletContextInitializer接口的实现类传到TomcatStarter中了，有什么用呢？后面DispatcherServlet的注册分析

### DispatcherServlet的注册
将DispatcherServlet注册到WebServer的过程主要分为如下2个部分
1. DispatcherServlet被注册到Spring容器中
2. ServletRegistrationBean包装了DispatcherServlet，并将DispatcherServlet注册到WebServer中

#### DispatcherServlet怎么被注册到Spring容器中的


很简单，在DispatcherServlet的无参构造方法上加一个断点

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328153553722.png?)
看下一个调用栈，实在DispatcherServletAutoConfiguration中被注入进来的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328153835156.png?)
这个配置类在spring.factories文件中，所以Spring Boot启动就会加载这个类，但这只是将DispatcherServlet注入到spring容器，所以一定是有其他的Bean把DispatcherServlet注入到Servlet容器中的，查找到用了DispatcherServlet类的Bean就只有DispatcherServletRegistrationBean

```java
// DispatcherServletAutoConfiguration.java

@Configuration(proxyBeanMethods = false)
@Conditional(DefaultDispatcherServletCondition.class)
@ConditionalOnClass(ServletRegistration.class)
@EnableConfigurationProperties({ HttpProperties.class, WebMvcProperties.class })
protected static class DispatcherServletConfiguration {

    @Bean(name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
    public DispatcherServlet dispatcherServlet(HttpProperties httpProperties, WebMvcProperties webMvcProperties) {
        DispatcherServlet dispatcherServlet = new DispatcherServlet();
        dispatcherServlet.setDispatchOptionsRequest(webMvcProperties.isDispatchOptionsRequest());
        dispatcherServlet.setDispatchTraceRequest(webMvcProperties.isDispatchTraceRequest());
        dispatcherServlet.setThrowExceptionIfNoHandlerFound(webMvcProperties.isThrowExceptionIfNoHandlerFound());
        dispatcherServlet.setPublishEvents(webMvcProperties.isPublishRequestHandledEvents());
        dispatcherServlet.setEnableLoggingRequestDetails(httpProperties.isLogRequestDetails());
        return dispatcherServlet;
    }

    @Bean
    @ConditionalOnBean(MultipartResolver.class)
    @ConditionalOnMissingBean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
    public MultipartResolver multipartResolver(MultipartResolver resolver) {
        // Detect if the user has created a MultipartResolver but named it incorrectly
        return resolver;
    }

}

@Configuration(proxyBeanMethods = false)
@Conditional(DispatcherServletRegistrationCondition.class)
@ConditionalOnClass(ServletRegistration.class)
@EnableConfigurationProperties(WebMvcProperties.class)
@Import(DispatcherServletConfiguration.class)
protected static class DispatcherServletRegistrationConfiguration {

    @Bean(name = DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME)
    @ConditionalOnBean(value = DispatcherServlet.class, name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
    public DispatcherServletRegistrationBean dispatcherServletRegistration(DispatcherServlet dispatcherServlet,
            WebMvcProperties webMvcProperties, ObjectProvider<MultipartConfigElement> multipartConfig) {
        DispatcherServletRegistrationBean registration = new DispatcherServletRegistrationBean(dispatcherServlet,
                webMvcProperties.getServlet().getPath());
        registration.setName(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME);
        registration.setLoadOnStartup(webMvcProperties.getServlet().getLoadOnStartup());
        multipartConfig.ifAvailable(registration::setMultipartConfig);
        return registration;
    }

}
```

### 为什么DispatcherServletRegistrationBean能把DispatcherServlet注入到Servelt容器中呢？

**这时候就不得不提我们在《面试官：说一下Spring MVC的启动流程呗！》提到的ServletContainerInitializer接口了，Servlet3.0之后Servlet容器启动后得回掉ServletContainerInitializer#onStartup方法，这是规范得遵守。**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210328172814634.png?)
我直接总结一下把，你对着我的流程图debug就懂了

1. 通过DispatcherServletAutoConfiguration往spring容器中注入DispatcherServlet
2. DispatcherServlet被包装为DispatcherServletRegistrationBean，用于向Servlet容器中注册
3. 在Tomcat创建阶段，将ServletContainerInitializer接口的实现类（即selfInitialize方法）设置到TomcatStarter中
4. 把TomcatStarter注册到Tomcat中
5. Tomcat启动后，会调用ServletContainerInitializer#onStartup，即调用TomcatStarter#onStartup，接着调用ServletWebServerApplicationContext#selfInitialize
6. selfInitialize方法回调用ServletContextInitializer#onStartup方法
7. DispatcherServletRegistrationBean实现类ServletContextInitializer接口，所以会调用父类的
RegistrationBean#onStartup方法
8. 在RegistrationBean#onStartup方法中会把内部维护的Servlet，Listener，Filter注册到ServletContext中