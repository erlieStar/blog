---
layout: post
title: Spring Boot 自动装配是如何实现的？
lock: need
---

# Spring Boot 自动装配是如何实现的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210327140859242.jpg?)
## Spring Boot 自动装配是如何实现的？
**当我们需要自动装配的时候，需要在配置类上加上@EnableAutoConfiguration注解**，在之前的文章中我们分析过Enable注解的套路，就是将一些相关的Bean注入到容器中，@EnableAutoConfiguration肯定也不例外。我们来分析一下具体的实现

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