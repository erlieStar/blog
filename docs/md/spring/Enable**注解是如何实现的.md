---
layout: post
title: Enable**注解是如何实现的？
lock: need
---

# Spring源码解析：Enable**注解是如何实现的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210317110548858.jpg?)
## 介绍
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
## 基于Configuration Class

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

## 基于ImportSelector接口

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

## 基于ImportBeanDefinitionRegistrar接口

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