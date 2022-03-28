---
layout: post
title: Spring Boot 自动装配是如何实现的？
lock: need
---

# 面试官：Spring Boot 自动装配是如何实现的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210327140859242.jpg?)
## Enable注解是如何实现的？
当我们使用Spring Boot的时候，只需要在启动类上加@SpringBootApplication注解即可，非常方便。@SpringBootApplication是一个复合注解

```java
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
```
其中自动装配的功能就是由@EnableAutoConfiguration注解实现的，那么@EnableAutoConfiguration是如何实现这个神奇的功能的？

**我们先从Enable注解是如何是如何实现的开始聊起**

在使用Spring的时候，我们只需要一个Enable注解就能实现开启一个模块的功能，非常的方便，那么这个功能是如何实现的？

我们常用的Enable注解如下所示

| 注解 | 作用 |
|--|--|
|@EnableAspectJAutoProxy|开启AspectJ自动代理|
| @EnableAsync | 开启异步方法支持 |
|@EnableScheduling|开启定时任务支持|
|@EnableWebMVC|开启web mvc支持|
|@EnableTransactionManagement|开启注解式事务支持|
|@EnableCaching|开启注解式缓存支持|
|@EnableAutoConfiguration|开启自动配置|

其实Enable注解底层是通过@Import注解实现的，@Import注解会往spring容器中注入所需要的Bean

@Import注解注入Bean的方式有如下三种

1. 基于Configuration Class
2. 基于ImportSelector接口
3. 基于ImportBeanDefinitionRegistrar接口

演示一波
```java
@EnableHelloWorld
public class EnableModuleDemo {

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(EnableModuleDemo.class);
        context.refresh();
        String helloWorld = context.getBean("helloWorld", String.class);
        // hello world
        System.out.println(helloWorld);
        context.close();
    }
}
```
可以看到启动容器后就能从容器中拿到名字为helloWorld的Bean，注入的过程就是@EnableHelloWorld注解中

**基于Configuration Class**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(HelloWorldConfiguration.class)
public @interface EnableHelloWorld {
}
```

```java
@Configuration
public class HelloWorldConfiguration {

    @Bean
    public String helloWorld() {
        return "hello world";
    }
}
```

直接通过@Bean的方式将bean注入到容器

**基于ImportSelector接口**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(HelloWorldImportSelector.class)
public @interface EnableHelloWorld {
}
```

```java
public class HelloWorldImportSelector implements ImportSelector {

    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        return new String[]{"com.javashitang.HelloWorldConfiguration"};
    }
}
```
通过ImportSelector注解返回，需要注入到容器中bean的全类名，框架帮你将bean注入到容器

**基于ImportBeanDefinitionRegistrar接口**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(HelloWorldImportBeanDefinitionRegistrar.class)
public @interface EnableHelloWorld {
}
```

```java
public class HelloWorldImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        AnnotatedGenericBeanDefinition beanDefinition = new AnnotatedGenericBeanDefinition(HelloWorldConfiguration.class);
        BeanDefinitionReaderUtils.registerWithGeneratedName(beanDefinition, registry);
    }
}
```

自己构造BeanDefinition，然后将BeanDefinition注入到BeanDefinitionRegistry

**不就简单注入一个Bean吗？为啥还要搞这么多方式？一句话，按需扩展**

看看我们之前的Enable注解是如何实现的？
### 基于Configuration Class

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {

}
```

```java
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class SchedulingConfiguration {

    @Bean(name = TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME)
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    public ScheduledAnnotationBeanPostProcessor scheduledAnnotationProcessor() {
        return new ScheduledAnnotationBeanPostProcessor();
    }

}
```
通过配置类，注入一个新的BeanPostProcessor，在BeanPostProcessor增加对@Scheduled注解的支持

### 基于ImportSelector接口

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync {

    Class<? extends Annotation> annotation() default Annotation.class;

    boolean proxyTargetClass() default false;

    AdviceMode mode() default AdviceMode.PROXY;

    int order() default Ordered.LOWEST_PRECEDENCE;

}
```

```java
public class AsyncConfigurationSelector extends AdviceModeImportSelector<EnableAsync> {

    private static final String ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME =
            "org.springframework.scheduling.aspectj.AspectJAsyncConfiguration";

    @Override
    @Nullable
    public String[] selectImports(AdviceMode adviceMode) {
        switch (adviceMode) {
            case PROXY:
                return new String[] {ProxyAsyncConfiguration.class.getName()};
            case ASPECTJ:
                return new String[] {ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME};
            default:
                return null;
        }
    }

}
```
按照用户配置的不同的代码方式，选择不同的配置类，返回要加载的类的名字

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {

    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    // 要排除的bean的类型
    Class<?>[] exclude() default {};
    
    // 要排除的bean的名字
    String[] excludeName() default {};

}
```

### 基于ImportBeanDefinitionRegistrar接口

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy {

    boolean proxyTargetClass() default false;

    boolean exposeProxy() default false;

}
```

```java
class AspectJAutoProxyRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(
            AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {

        // 直接往registry中注册BeanDefinition
        AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);

        AnnotationAttributes enableAspectJAutoProxy =
                AnnotationConfigUtils.attributesFor(importingClassMetadata, EnableAspectJAutoProxy.class);
        if (enableAspectJAutoProxy != null) {
            if (enableAspectJAutoProxy.getBoolean("proxyTargetClass")) {
                AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
            }
            if (enableAspectJAutoProxy.getBoolean("exposeProxy")) {
                AopConfigUtils.forceAutoProxyCreatorToExposeProxy(registry);
            }
        }
    }

}
```
直接把BeanDefinitionRegistry给你，自己往里面注入BeanDefinition，适用于比较底层的实现

**看到这，估计你也能想到@EnableAutoConfiguration实现的大概套路了，根据不同的starter往容器注入提前设置好的Bean，接着我们来分析一下具体的实现**

## Spring Boot 自动装配是如何实现的？

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration
```
EnableAutoConfiguration引入AutoConfigurationImportSelector类，AutoConfigurationImportSelector返回需要注入容器的全类名，看一下AutoConfigurationImportSelector#selectImports方法就能理解自动注入的实现了

```java
public String[] selectImports(AnnotationMetadata annotationMetadata) {
    // 1. 是否开启自动配置，默认开启
    if (!isEnabled(annotationMetadata)) {
        return NO_IMPORTS;
    }
    // 2. 从META-INF/spring-autoconfigure-metadata.properties文件中载入属性配置，后续过滤自动注入的类要用
    // 在spring-boot-autoconfigure-x.x.RELEASE.jar包中
    AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader
            .loadMetadata(this.beanClassLoader);
    // 3. 获取需要自动注入的类的全类名
    AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(autoConfigurationMetadata,
            annotationMetadata);
    return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
}
```

大概逻辑如图所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210327155802731.png?)
**自动装配的过程如下**

1. @SpringBootApplication是复合注解，包含@EnableAutoConfiguration
2. @EnableAutoConfiguration会导入AutoConfigurationImportSelector这个类，这个类会利用SpringFactoriesLoader组件加载jar包里面META-INF/spring.factories配置文件里面填写的配置类，将这些配置类过滤一波后，返回全类名

我们可以在spring-boot-autoconfigure模块中的spring.factories文件中看到配置了一大堆配置类
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210327165242157.png?)
**启动一个应用就要加载这么多配置类，用的着吗？**

其实所有的配置类并不会都加载，因为每个配置类上有条件注解，如WebMvcAutoConfiguration

@ConditionalOnClass：当classpath中有Servlet类，DispatcherServlet类，WebMvcConfigurer类才会加载这个配置类。所以当你的应用中没有这些类时，这个自动配置类不会生效

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
@ConditionalOnClass({ Servlet.class, DispatcherServlet.class, WebMvcConfigurer.class })
@ConditionalOnMissingBean(WebMvcConfigurationSupport.class)
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE + 10)
@AutoConfigureAfter({ DispatcherServletAutoConfiguration.class, TaskExecutionAutoConfiguration.class,
        ValidationAutoConfiguration.class })
public class WebMvcAutoConfiguration
```
当你加入如下starter时，classpath中有这些类了，这个配置类才会生效，这就是spring boot只要加一个依赖就能用而不用配置的秘密
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```