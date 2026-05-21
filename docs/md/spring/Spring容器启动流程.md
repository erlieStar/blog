---
layout: post
title: Spring容器启动流程
lock: need
---

# Spring IOC源码解析：Spring容器启动流程
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/39a8e3a839458f1e2843d827b9c186ac.jpeg)
## 基本概念

**Spring是一个IOC容器**
当我们不用Spring进行开发时，我们需要在代码中设置对象的依赖关系。当我们用了Spring之后，由Spring来管理这种依赖关系，当我们想使用对象时，直接从Spring容器中获取即可

**BeanDefinition**
在Spring中对象被叫做Bean，因为Spring Bean在Java类的基础上增加了很多概念，比如scope（作用域），isLazyInit（是否延迟初始化），isSingleton（是否单例），此时Java类不能完整的描述，所以需要新的定义描述类，这个类就是BeanDefinition

**BeanDefinitionReader**
BeanDefinitionReader会将配置的bean解析成为BeanDefinition，Spring Bean的配置方式有很多种，如XML，properties，groovy，注解（可能通过properties，groovy的方式你不常用，但Spring确实支持这种方式），所以BeanDefinitionReader的实现类也很多

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/bf324e9e2997840b19a17c04ccac8fb6.png)

**ClassPathBeanDefinitionScanner**
当把Bean配置出后，得需要相应的组件把他们从资源文件中扫描出来，这个组件就是ClassPathBeanDefinitionScanner

**BeanDefinitionRegistry**
BeanDefinitionReader将配置的bean解析成为BeanDefinition，需要将BeanDefinition保存到BeanDefinitionRegistry。类似工厂把原料保存到仓库中，供后续生产产品使用

**BeanFactory**
BeanFactory会根据BeanDefinition将Bean生产出来

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/dadab632e9d4de96c61043ec2f7dd967.png)

一些比较重要的BeanFactory如图所示。**可能你比较纳闷，为什么有的容器的类名后缀为BeanFactory，有的则为ApplicationContext？** 这其实是一个很常见的面试

1. BeanFactory是一个最基础的IOC容器，提供了依赖查找，依赖注入等基础的功能
2. ApplicationContext继承了BeanFactory，在BeanFactory的基础上增加了企业级的功能，如AOP，资源管理（Resources）事件（Event），国际化（i18n），Environment抽象等

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/25480ad125ca13ba251b93c31d7d40a8.png)

从接口的定义上你就可以看出来，我们一般在开发的时候也都是用ApplicationContext，而且大多继承自GenericApplicationContext

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cf1331ede383c50fa16f10f820c1d378.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d832b7cf5c02b3794dbc18f83e13c2f2.png)
**GenericApplicationContext本身就是一个BeanFactory，但是它却把对Bean的一些基本操作委托给DefaultListableBeanFactory，典型的代理模式**

因为GenericApplicationContext是最常用的ApplicationContext，它将对Bean的基本操作委托给DefaultListableBeanFactory，所以在大部分应用下对Bean的操作都是由DefaultListableBeanFactory来完成的

**DefaultListableBeanFactory**

DefaultListableBeanFactory同时实现了BeanDefinitionRegistry接口和BeanFactory接口，所以能保存BeanDefinition，同时又能根据BeanDefinition将Bean生产出来

**BeanPostProcessor**
BeanFactory根据BeanDefinition生成Bean的过程是一个标准化的流程，就像一个流水线一样，当然你可以在这个流水线上做一些自定义的操作。**在Spring中你可以通过实现BeanPostProcessor来干预Bean的生产过程**

**BeanFactoryPostProcessor**
Spring作为一个强大的容器，不仅能让你干预Bean的生产过程，还可以让你干预BeanFactory，**例如你可以通过BeanFactoryPostProcessor将Bean的作用域都改成原型，默认是单例**

**所以BeanPostProcessor和BeanFactoryPostProcessor是spring容器2个很重要的扩展点，大多数框架和Spring框架继承基本上都是基于这2个扩展点来的**

## 容器启动流程

Spring 启动的本质，就是**两段式架构**的平滑过渡：

1. **元数据准备阶段（生产图纸）**： 把程序员写的注解、配置类，“翻译”成统一的 BeanDefinition 塞入工厂。此时，没有任何用户自定义的 Bean 被 new 出来。

2. **对象大生产阶段（组装产品）**： 冻结图纸，遍历 BeanDefinition，批量通过反射 new 出单例对象，并走完依赖注入与生命周期。

为了让这个流水线具备无限的扩展性，Spring 引入了两个最关键的Hook

**BeanFactoryPostProcessor（工厂后置处理器）**：对象还没创建，允许你修改图纸。

**BeanPostProcessor（Bean后置处理器）**：对象开始创建，在过流水线时，允许你修改对象（如 AOP 代理）

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
可以看到当AnnotationConfigApplicationContext被new出来的时候，容器已经启动完毕，后续就可以直接从容器中获取Bean了，启动流程可以分为如下四步

### 1. 建工厂与初始化准备（兵马未动，粮草先行）
对应步骤：prepareRefresh() -> obtainFreshBeanFactory() -> prepareBeanFactory()

**本质**： 诞生一个干净的、空的 DefaultListableBeanFactory 工厂（同时充当仓库 BeanDefinitionRegistry）。

**核心逻辑**： 此时 Spring 会预先偷偷往里面塞几个“特务组件”（内建 Bean），其中最核心的就是 ConfigurationClassPostProcessor（实现了 BeanFactoryPostProcessor）。记住它，它是第二步的绝对主角

### 2. 进图纸（从 1 到 N 的元数据大爆发）
对应步骤：invokeBeanFactoryPostProcessors()

这是整个启动流程中最惊心动魄、最具技术含量的一步。

**本质**： 在此阶段之前，容器里其实只有你传进去的那一个 AppConfig.class 的图纸。

**核心逻辑**： Spring 激活了前一步埋下的特务——ConfigurationClassPostProcessor。这个类像探照灯一样去扫描你指定的 @ComponentScan 路径，把项目里所有的 @Component、@Service、@Repository 统统挖出来，统一翻译成 BeanDefinition 注册到工厂。

**核心避坑**： 此时，你的 UserDao、UserService 统统还只是纸上的名字和属性（BeanDefinition），它们在内存中还根本不存在！因为在这个阶段，Spring 只允许“改图纸”，决不允许提前“造对象”

### 3. 装插件（磨刀不误砍柴工）
对应步骤：registerBeanPostProcessors()

**本质**： 在真正把产品推上流水线之前，必须先把所有的“质检员和加工工具”（BeanPostProcessor）配齐。

**核心逻辑**： 这一步会把负责处理 @Autowired 的 AutowiredAnnotationBeanPostProcessor、负责处理 @Resource 的 CommonAnnotationBeanPostProcessor 等各种后置处理器实例化，并放入工厂的备用工具箱里

### 4. 开马达，单例对象全量大生产（高潮来临）
对应步骤：finishBeanFactoryInitialization()

前面的所有步骤都是在铺垫，到了这一步，工厂大门正式打开，流水线全力运转。

**本质**： 遍历前几步存好的 BeanDefinition 图纸，把所有非懒加载的单例 Bean 一口气全部生产出来。

**生命周期闭环**： 在这一步中，每一个 Bean 都会高频调用 getBean() -> doGetBean() -> createBean() -> doCreateBean()。

对象在这里经历它的完整一生：

**实例化**： 顺着图纸反射 new 出原始对象。

**属性注入**： 激活第三步装好的 AutowiredAnnotationBeanPostProcessor 工具，把 @Autowired 的依赖塞进去。

**初始化**： 触发各种 Aware 接口回调、init-method。

**AOP 织入**： 临出厂前，后置处理器最后一次介入，如果发现需要代理，直接在这里把原始对象包装成代理对象。

**说一个高频面试题，Spring容器在何时创建对象？**

1. **对于标准的、非延迟加载的单例 Bean（Singleton）**： 在容器启动流程的第4步（finishBeanFactoryInitialization）中统一、全量创建。容器启动完毕后，你再去 getBean()，只是从一级缓存里直接拿现成的。

2. **对于原型 Bean（Prototype）或加了 @Lazy 的懒加载 Bean**： 在容器启动阶段，Spring 只为它们生成图纸（BeanDefinition）。直到代码中第一次显式调用 context.getBean() 时，才会临时触发流水线，现场生产对象
## 源码分析
源码分析的部分主要是作者用来参考的，有兴趣的可以看看

AnnotationConfigApplicationContext构造函数主要执行了如下3个步骤，其中this和register方法主要是容器初始化的过程。refresh是刷新容器，即启动的过程，在这个里面做了很多操作，我们后面会用一个小节来分析
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/005f7004fbfc7ecfa0872412f3c12c30.png)

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

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/fb36bc755a3c1a5e79b27476a421e3cc.png)
### Spring应用上下文启动准备阶段
AbstractApplicationContext#prepareRefresh

1. 记录启动时间 startupDate
2. 设置标志为closed（false），active（true）
3. 初始化PropertySources
4. 校验Environment中必须属性
5. 初始化事件监听器集合
6. 初始化早期Spring事件集合

### BeanFactory创建阶段
AbstractApplicationContext#obtainFreshBeanFactory

刷新Spring应用上下文底层BeanFactory（refreshBeanFactory）

1. 如果已存在BeanFactory，销毁Bean，并且关闭BeanFactory
2. 创建DefaultListableBeanFactory（一般情况下都是DefaultListableBeanFactory）
3. 设置BeanFactory id
4. 设置BeanFactory是否允许BeanDefinition重复定义，是否允许循环引用
5. 加载BeanDefinition
6. 关联新建的BeanFactory到Spring应用上下文

返回Spring应用上下文底层BeanFactory（getBeanFactory）

### BeanFactory准备阶段
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

###  BeanFactory后置处理阶段
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

### BeanFactory注册BeanPostProcessor阶段
1. **注册BeanPostProcessor（PostProcessorRegistrationDelegate.BeanPostProcessorChecker）**
2. 注册PriorityOrdered类型的BeanPostProcessor
4. 注册Ordered类型的BeanPostProcessor
5. 注册普通的BeanPostProcessor
6. 注册MergedBeanDefinitionPostProcessor
7. **注册BeanPostProcessor（ApplicationListenerDetector）**

**此时注册到容器中的BeanPostProcessor有如下6个（注册的时机我都在前文标注过了）**，这6个BeanPostProcessor在Spring Bean的生命周期中起着重要的作用
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/99c1cbc8a80e175c78c29159464ddb87.png)
### 初始化内建Bean：MessageSource
AbstractApplicationContext#initMessageSource
国际化相关的内容，不怎么用，不研究了

### 初始化内建Bean：Spring事件广播器
AbstractApplicationContext#initApplicationEventMulticaster

### Spring应用上下文刷新阶段
AbstractApplicationContext#onRefresh
留给子类扩展用的

### Spring事件监听器注册阶段
AbstractApplicationContext#registerListeners

1. 添加当前应用上下文所关联的ApplicationListener对象
2. 添加BeanFactory所注册的ApplicationListener
3. 广播早期Spring事件
### BeanFactory初始化完成阶段
AbstractApplicationContext#finishBeanFactoryInitialization

1. conversionService如果存在的话，设置到beanFactory
2. 添加 StringValueResolver 对象
3. 依赖查找LoadTimeWeaverAware Bean
4. beanFactory将ClassLoader临时设置为null
5. beanFactory冻结配置
6. beanFactory初始化非延迟单例Beans
### Spring应用上下文启动完成阶段
AbstractApplicationContext#finishRefresh

1. 清除ResoureLoader缓存
2. 初始化lifecycleProcessor对象
3. 调用lifecycleProcessor#onRefresh方法
4. 发布应用上下文刷新事件 ContextRefreshedEvent
5. 向MBeanServer托管Live Beans
