---
layout: post
title: Condition注解
lock: need
---

# Condition注解
![在这里插入图片描述](https://img-blog.csdnimg.cn/3509b8beaf1147a7a4bc7b27bd98561a.png?)
## 各种各样的条件注解
上一节我们提到，为了避免往Spring容器中注入过多的Bean，我们需要使用条件注解，当某些规则满足时，才往容器中注入相关的Bean。本节我们就简单演示一下如何手写一个条件注解，知道大概的工作方式即可，具体的源码就不分析了

| 类 | 作用 |
|--|--|
| ConditionalOnClass | classpath下有特定类 |
| ConditionalOnBean| 容器中有特定bean |
| ConditionalOnProperty | application.yaml中有特定的key |
|ConditionalOnWebApplication  | 容器是一个web容器 |
## 手写一个条件注解
当前运行的环境为linux才会注入特定的Bean
```java
public class OnLinuxCondition implements Condition {

	@Override
	public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
		Environment environment = context.getEnvironment();
		String osName = environment.getProperty("os.name");
		if (osName.contains("linux")) {
			return true;
		}
		return false;
	}
}
```

```java
@Configuration
@ComponentScan("com.javashitang.condition")
public class AppConfig {

	@Bean
	@Conditional(OnLinuxCondition.class)
	public User user() {
		return new User();
	}
}
```

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Conditional(OnLinuxCondition.class)
public @interface ConditionalOnLinux {
}
```

```java
@Configuration
@ComponentScan("com.javashitang.condition")
public class AppConfig {

	@Bean
	@ConditionalOnLinux
	public User user() {
		return new User();
	}
}
```