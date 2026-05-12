---
layout: post
title: Condition注解
lock: need
---

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0cb523ad3a103b10cbf2b233c992159c.jpeg)
## 各种各样的条件注解
上一节我们提到，为了避免往Spring容器中注入过多的Bean，我们需要使用条件注解，当某些规则满足时，才往容器中注入相关的Bean。本节我们就简单演示一下如何手写一个条件注解，知道大概的工作方式即可，具体的源码就不分析了

| 类 | 作用 |
|--|--|
| ConditionalOnClass | classpath下有特定类 |
| ConditionalOnBean| 容器中有特定bean |
| ConditionalOnProperty | application.yaml中有特定的key |
|ConditionalOnWebApplication  | 容器是一个web容器 |
## 手写一个条件注解
实现 Condition 接口，定义条件逻辑。

如下例子为当前运行的环境为linux才会注入特定的Bean
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

直接使用 @Conditional 绑定条件类

1. @Conditional 接收一个 Class<? extends Condition> 数组，可以传入多个条件类（都满足才生效）
2. 当应用在 Linux 上运行时，OnLinuxCondition.matches() 返回 true，Spring 执行 user() 方法并将返回的 User 对象放入容器；在 Windows/Mac 上则不会创建这个 Bean
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

自定义注解
```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Conditional(OnLinuxCondition.class)
public @interface ConditionalOnLinux {
}
```

使用自定义注解
```java
@Configuration
@ComponentScan("com.javashitang.condition")
public class AppConfig {

	@Bean
	@ConditionalOnLinux // 等价于 @Conditional(OnLinuxCondition.class)
	public User user() {
		return new User();
	}
}
```