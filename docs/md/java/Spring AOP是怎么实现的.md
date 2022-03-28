---
layout: post
title: Spring AOP是怎么实现的？
lock: need
---

# 面试官：Spring AOP是怎么实现的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200911190034582.png?)

## 介绍
Spring AOP的实现和IOC的实现比起来还是比较简单的。在正式介绍流程之前，先介绍一个接口

```java
public interface BeanPostProcessor {

	// 在bean初始化之前执行
	@Nullable
	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

	// 在Bean初始化之后执行
	@Nullable
	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

}
```
这个接口在Spring中应该算是一个很重要的接口了，是Spring框架的扩展点之一。让程序员可以扩展Bean的产生过程。在后续的文章《Spring Bean的创建过程》我会详细介绍这个接口。确认过眼神，是一篇长文，因为流程确实长。

还是老样子，Spring的Bean的初始化过程其实比较复杂，为了方便理解，我就把Spring Bean的初始化过程分为2部分

1. bean的实例化过程，即调用构造函数将对象创建出来
2. bean的初始化过程，即填充bean的各种属性

下面就是Spring AOP的流程

1. 要想启用Spring AOP，配置类加上注解@EnableAspectJAutoProxy，会往spring容器注入一个BeanPostProcessor即AnnotationAwareAspectJAutoProxyCreator
2. 在Bean实例化完成后（即调用构造函数将对象创建出来）会执行AnnotationAwareAspectJAutoProxyCreator#postProcessAfterInitialization（这个方法在父类AbstractAutoProxyCreator中，AnnotationAwareAspectJAutoProxyCreator并没有重写）
3. 当执行完成AbstractAutoProxyCreator#postProcessAfterInitialization这个方法会将原生对象变成代理代理对象，代理对象中写入了横切的逻辑

**原来Spring IOC实现用的是工厂模式，Spring AOP实现用的是代理模式**

## 源码解析
### 注入AnnotationAwareAspectJAutoProxyCreator
前面都说了AOP的起点是@EnableAspectJAutoProxy这个注解

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy
```
用@Import引入了AspectJAutoProxyRegistrar类，而AspectJAutoProxyRegistrar这个类实现了ImportBeanDefinitionRegistrar接口，这个接口的主要作用是用来实现Bean的动态注入

```java
class AspectJAutoProxyRegistrar implements ImportBeanDefinitionRegistrar {

	@Override
	public void registerBeanDefinitions(
			AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {

		// 在这个方法里面往spring容器中注入了一个AnnotationAwareAspectJAutoProxyCreator后置处理器
		// 而这个后置处理器就是用来生成代理对象的
		AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);

		// 省略后续一些配置方法
	}

}
```
在registerBeanDefinitions方法中，往spring容器中注入了一个AnnotationAwareAspectJAutoProxyCreator后置处理器，而这个后置处理器就是用来生成代理对象的

### 用原生对象生成代理对象
在《Spring Bean的创建过程》，我会详细讲Bean的创建过程，这节你只需要知道，在Bean的创建过程中会执行AnnotationAwareAspectJAutoProxyCreator#postProcessAfterInitialization（这个方法在父类AbstractAutoProxyCreator中，AnnotationAwareAspectJAutoProxyCreator并没有重写），来分析这个方法

postProcessAfterInitialization中调用了wrapIfNecessary这个方法

```java
// AbstractAutoProxyCreator#wrapIfNecessary
// 省略部分代码

protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {

	// Create proxy if we have advice.
	// 拿到切面，如果符合，加上拦截器
	Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
	if (specificInterceptors != DO_NOT_PROXY) {
		this.advisedBeans.put(cacheKey, Boolean.TRUE);
		// 创建代理对象
		Object proxy = createProxy(
				bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
		this.proxyTypes.put(cacheKey, proxy.getClass());
		return proxy;
	}
}

```
通过createProxy方法创建出代理对象

```java
// AbstractAutoProxyCreator#createProxy
// 省略部分代码

protected Object createProxy(Class<?> beanClass, @Nullable String beanName,
		@Nullable Object[] specificInterceptors, TargetSource targetSource) {
	// 从这里能看出来是使用jdk还是cglib来实现动态代理
	return proxyFactory.getProxy(getProxyClassLoader());
}
```
从这个方法一直追能看到代理对象的具体实现策略

```java
// DefaultAopProxyFactory#createAopProxy
public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
	// isOptimize表示让spring自行优化，默认为false
	// isProxyTargetClass表示是否对类生成代理，默认为false(即使用JDK Proxy,只代理接口)
	// hasNoUserSuppliedProxyInterfaces表示bean没有实现任何接口或者实现的接口是SpringProxy接口
	if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
		Class<?> targetClass = config.getTargetClass();
		if (targetClass == null) {
			throw new AopConfigException("TargetSource cannot determine target class: " +
					"Either an interface or a target is required for proxy creation.");
		}
		// 即使设置了proxyTargetClass（用cglib代理），但只要是接口，就会用jdk动态代理
		// 非jdk代理类也会用jdk动态代理
		if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
			return new JdkDynamicAopProxy(config);
		}
		return new ObjenesisCglibAopProxy(config);
	}
	else {
		// 用jdk进行动态代理
		return new JdkDynamicAopProxy(config);
	}
}
```
指定proxyTargetClass=true后,  target对象 非接口类型 && 非JDK代理类 时，执行CGLIB代理，其他情况下都是用JDK代理

JDK动态代理大家应该都比较熟悉了，即Proxy.newProxyInstance()方法