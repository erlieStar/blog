---
layout: post
title: Spring容器启动流程
lock: need
---

# Spring IOC源码解析：Spring容器启动流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210317224843860.jpg?)
## 基本概念
本篇文章是我们Spring源码专栏的第一篇，这个专栏我不会分享那些比较基础的知识点，比如ioc aop的好处之类的，这些内容写的人也比较多，你可以看一下其他博主的文章，这个专栏我会尽量挑干货来分享

**Spring是一个IOC容器**
当我们不用Spring进行开发时，我们需要在代码中设置对象的依赖关系。当我们用了Spring之后，由Spring来管理这种依赖关系，当我们想使用对象时，直接从Spring容器中获取即可

**BeanDefinition**
在Spring中对象被叫做Bean，因为Spring Bean在Java类的基础上增加了很多概念，比如scope（作用域），isLazyInit（是否延迟初始化），isSingleton（是否单例），此时Java类不能完整的描述，所以需要新的定义描述类，这个类就是BeanDefinition

**BeanDefinitionReader**
BeanDefinitionReader会将配置的bean解析成为BeanDefinition，Spring Bean的配置方式有很多种，如XML，properties，groovy，注解（可能通过properties，groovy的方式你不常用，但Spring确实支持这种方式），所以BeanDefinitionReader的实现类也很多

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210330111959746.png?)

**ClassPathBeanDefinitionScanner**
当把Bean配置出后，得需要相应的组件把他们从资源文件中扫描出来，这个组件就是ClassPathBeanDefinitionScanner

**BeanDefinitionRegistry**
BeanDefinitionReader将配置的bean解析成为BeanDefinition，需要将BeanDefinition保存到BeanDefinitionRegistry。类似工厂把原料保存到仓库中，供后续生产产品使用

**BeanFactory**
BeanFactory会根据BeanDefinition将Bean生产出来

![在这里插入图片描述](https://img-blog.csdnimg.cn/fa18ff5a13f54bc289b9a4a624ffbd48.png?)

一些比较重要的BeanFactory如图所示。**可能你比较纳闷，为什么有的容器的类名后缀为BeanFactory，有的则为ApplicationContext？** 这其实是一个很常见的面试

1. BeanFactory是一个最基础的IOC容器，提供了依赖查找，依赖注入等基础的功能
2. ApplicationContext继承了BeanFactory，在BeanFactory的基础上增加了企业级的功能，如AOP，资源管理（Resources）事件（Event），国际化（i18n），Environment抽象等

![在这里插入图片描述](https://img-blog.csdnimg.cn/17064e8a5e7a4a5f9caa4b4b37b6bcb7.png)
从接口的定义上你就可以看出来，我们一般在开发的时候也都是用ApplicationContext，而且大多继承自GenericApplicationContext

![在这里插入图片描述](https://img-blog.csdnimg.cn/6de8599f0e114ec5b4e18c155a848af7.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/331d58d6852c4b8e8b70bbe7500ff92f.png?)
**GenericApplicationContext本身就是一个BeanFactory，但是它却把对Bean的一些基本操作委托给DefaultListableBeanFactory，典型的代理模式**

因为GenericApplicationContext是最常用的ApplicationContext，它将对Bean的基本操作委托给DefaultListableBeanFactory，所以在大部分应用下对Bean的操作都是由DefaultListableBeanFactory来完成的

**DefaultListableBeanFactory**

DefaultListableBeanFactory同时实现了BeanDefinitionRegistry接口和BeanFactory接口，所以能保存BeanDefinition，同时又能根据BeanDefinition将Bean生产出来

**BeanPostProcessor**
BeanFactory根据BeanDefinition生成Bean的过程是一个标准化的流程，就像一个流水线一样，当然你可以在这个流水线上做一些自定义的操作。**在Spring中你可以通过实现BeanPostProcessor来干预Bean的生产过程**

**BeanFactoryPostProcessor**
Spring作为一个强大的容器，不仅能让你干预Bean的生产过程，还可以让你干预BeanFactory，**例如你可以通过BeanFactoryPostProcessor将Bean的作用域都改成原型，默认是单例**

**所以BeanPostProcessor和BeanFactoryPostProcessor是spring容器2个很重要的扩展点，大多数框架和Spring框架继承基本上都是基于这2个扩展点来的**
## 容器初始化过程
我们常用的容器有如下2种
1. 基于xml配置Bean（ClassPathXmlApplicationContext）
2. 基于注解配置Bean（AnnotationConfigApplicationContext）

因为我们现在开发都是基于注解，所以分析一下AnnotationConfigApplicationContext的启动流程

```java
@Repository
public class UserDao {

	public String getUser() {
		return "user";
	}
}
```

```java
@Configuration
@ComponentScan("com.javashitang")
public class AppConfig {

}
```

```java
public class Main {

	public static void main(String[] args) {
		// 容器启动完毕
		AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
		UserDao userDao = context.getBean(UserDao.class);
		String str = userDao.getUser();
		System.out.println(str);
	}
}
```
可以看到当AnnotationConfigApplicationContext被new出来的时候，容器已经启动完毕，后续就可以直接从容器中获取Bean了。

构造函数主要执行了如下3个步骤，其中this和register方法主要是容器初始化的过程。refresh是刷新容器，即启动的过程，在这个里面做了很多操作，我们后面会用一个小节来分析
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210330144835601.png?)

**需要注意的一点是，在容器初始化的过程中注册了6个Bean**
1. ConfigurationClassPostProcessor（**实现了BeanFactoryPostProcessor，处理@Configuration，@ComponmentScan等注解，这是一个很重要的类**）
2. **AutowiredAnnotationBeanPostProcessor（实现了BeanPostProcessor，处理@Autowired，@Value等）**
3. **CommonAnnotationBeanPostProcessor（实现了BeanPostProcessor，用来处理JSR-250规范的注解，如@Resource，@PostConstruct等）**
4. PersistenceAnnotationBeanPostProcessor（实现了BeanFactoryPostProcessor，用来支持JPA，在我们这个Demo中不会注册，因为路径中没有JPA相关的类）
5. EventListenerMethodProcessor（实现了BeanFactoryPostProcessor）
6. DefaultEventListenerFactory

注册的过程估计你也猜到了，就是将对应的类，如ConfigurationClassPostProcessor解析为RootBeanDefinition，并注册到BeanDefinitionRegistry中

**这几个BeanPostProcessor在Spring Bean的生命周期中发挥了很大的作用，我们在Spring Bean生命周期这篇文章中来分析**。

好了，我们来看最重要的过程，容器刷新的过程，入口方法为AbstractApplicationContext#refresh

**AbstractApplicationContext是一个很重要的类，基本上所有的ApplicationContext都继承自AbstractApplicationContext**

## 容器刷新过程
**容器刷新的过程可以细分为如下几个步骤**
1. Spring应用上下文启动准备阶段
2. BeanFactory创建阶段
3. BeanFactory准备阶段
4. BeanFactory后置处理阶段
5. BeanFactory注册BeanPostProcessor阶段
6. 初始化内建Bean：MessageSource
7. 初始化内建Bean：Spring事件广播器
8. Spring应用上下文刷新阶段
9. Spring事件监听器注册阶段
10. BeanFactory初始化完成阶段
11. Spring应用上下文启动完成阶段

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021052700213626.png?)

## Spring应用上下文启动准备阶段
AbstractApplicationContext#prepareRefresh

1. 记录启动时间 startupDate
2. 设置标志为closed（false），active（true）
3. 初始化PropertySources
4. 校验Environment中必须属性
5. 初始化事件监听器集合
6. 初始化早期Spring事件集合

## BeanFactory创建阶段
AbstractApplicationContext#obtainFreshBeanFactory

刷新Spring应用上下文底层BeanFactory（refreshBeanFactory）

1. 如果已存在BeanFactory，销毁Bean，并且关闭BeanFactory
2. 创建DefaultListableBeanFactory（一般情况下都是DefaultListableBeanFactory）
3. 设置BeanFactory id
4. 设置BeanFactory是否允许BeanDefinition重复定义，是否允许循环引用
5. 加载BeanDefinition
6. 关联新建的BeanFactory到Spring应用上下文

返回Spring应用上下文底层BeanFactory（getBeanFactory）

## BeanFactory准备阶段
AbstractApplicationContext#prepareBeanFactory
1. 关联ClassLoader
2. 设置Bean表达式处理器
3. 添加 PropertyEditorRegistrar 的实现 ResourceEditorRegistrar
4. **注册BeanPostProcessor（ApplicationContextAwareProcessor）**，用来处理Aware回调接口
5. 忽略Aware回调接口作为依赖注入接口
6. 注册ResolvableDependency对象-BeanFactory，ResourceLoader，ApplicationEventPublisher，ApplicationContext
7. **注册BeanPostProcessor（ApplicationListenerDetector）**，用来处理ApplicationListener接口
8. 注册BeanPostProcessor（LoadTimeWeaverAwareProcessor），用来处理aop
9. 注册单例对象（Environment，Java System Properties以及OS环境变量）

##  BeanFactory后置处理阶段
如果想对BeanFactory进行扩展，可以通过如下2种方式
1. 子类重写AbstractApplicationContext#postProcessBeanFactory方法
2. 实现BeanFactoryPostProcessor接口

AbstractApplicationContext#invokeBeanFactoryPostProcessors
方法就是用来处理BeanFactoryPostProcessor接口的，调用的次序比较复杂，总结如下

1. BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（入参中的）
2. BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，并且实现了PriorityOrdered接口）
3. BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，并且实现了Ordered接口）
4. BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，除去第2，3步剩余的BeanDefinitionRegistryPostProcessor）
5. BeanDefinitionRegistryPostProcessor#postProcessBeanFactory（所有BeanDefinitionRegistryPostProcessor接口实现类）
6. BeanFactoryPostProcessor#postProcessBeanFactory（入参数中的）
7. BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，实现了PriorityOrdered接口）
8. BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，实现了Ordered接口）
9. BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，除去7，8步剩余的BeanFactoryPostProcessor）

**注册BeanPostProcessor（ConfigurationClassPostProcessor.ImportAwareBeanPostProcessor）**

注册LoadTimeWeaverAwareProcessor对象

前面说过在容器初始化的过程中，往容器中注入了一个BeanFactoryPostProcessor接口的实现类即ConfigurationClassPostProcessor。

**这是一个非常重要的BeanFactoryPostProcessor，通过@Bean、@Component、@ComponentScan、@Import、@ImportResource注入Bean的方式都由这个类来处理，对这些注解的实现感兴趣的小伙伴可以看一下这个类的源码**

## BeanFactory注册BeanPostProcessor阶段
1. **注册BeanPostProcessor（PostProcessorRegistrationDelegate.BeanPostProcessorChecker）**
2. 注册PriorityOrdered类型的BeanPostProcessor
4. 注册Ordered类型的BeanPostProcessor
5. 注册普通的BeanPostProcessor
6. 注册MergedBeanDefinitionPostProcessor
7. **注册BeanPostProcessor（ApplicationListenerDetector）**

**此时注册到容器中的BeanPostProcessor有如下6个（注册的时机我都在前文标注过了）**，这6个BeanPostProcessor在Spring Bean的生命周期中起着重要的作用
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210322232429517.png?)
## 初始化内建Bean：MessageSource
AbstractApplicationContext#initMessageSource
国际化相关的内容，不怎么用，不研究了

## 初始化内建Bean：Spring事件广播器
AbstractApplicationContext#initApplicationEventMulticaster

## Spring应用上下文刷新阶段
AbstractApplicationContext#onRefresh
留给子类扩展用的

## Spring事件监听器注册阶段
AbstractApplicationContext#registerListeners

1. 添加当前应用上下文所关联的ApplicationListener对象
2. 添加BeanFactory所注册的ApplicationListener
3. 广播早期Spring事件
## BeanFactory初始化完成阶段
AbstractApplicationContext#finishBeanFactoryInitialization

1. conversionService如果存在的话，设置到beanFactory
2. 添加 StringValueResolver 对象
3. 依赖查找LoadTimeWeaverAware Bean
4. beanFactory将ClassLoader临时设置为null
5. beanFactory冻结配置
6. beanFactory初始化非延迟单例Beans

**说一个高频面试题，Spring容器在何时创建对象？**

1. scope=singleton，容器启动过程中创建对象
2. scope!=singleton，延迟Bean（加了@Lazy，或\<bean lazy-init="true"/>），在调用getBean的同时创建对象
## Spring应用上下文启动完成阶段
AbstractApplicationContext#finishRefresh

1. 清除ResoureLoader缓存
2. 初始化lifecycleProcessor对象
3. 调用lifecycleProcessor#onRefresh方法
4. 发布应用上下文刷新事件 ContextRefreshedEvent
5. 向MBeanServer托管Live Beans
