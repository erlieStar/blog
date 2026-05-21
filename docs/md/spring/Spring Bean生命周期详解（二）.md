---
layout: post
title: Spring Bean生命周期详解（二）
lock: need
---

# Spring Bean生命周期详解（二）
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/b77a4a5f321109af2adf4cb8135d9aef.jpeg)
## Spring Bean生命周期
### BeanDefinition解析阶段
|配置方式| 实现类 |
|--|--|
| XML资源 | XmlBeanDefinitionReader |
| Properties资源 | PropertiesBeanDefinitionReader |
| Java注解 | AnnotatedBeanDefinitionReader |

在开发过程中，我们会用Java文件来描述一个对象。在Spring中我们则用BeanDefinition来描述一个Bean，因为Bean在对象的基础上增加了很多属性，例如Bean是单例的还是原型的？Bean是否延迟加载，此时Java文件就不能描述一个Bean了，我们就用BeanDefinition来描述BeanDefinition

BeanDefinition的一些元信息如下
| 属性 | 说明 |
|--|--|
|beanClass  | bean对应的Class类 |
|lazyInit  | 是否延迟初始化 |
| autowireMode | 自动绑定模式，无，byName，byType等 |
| initMethodName | 初始化回调方法 |
| destroyMethodName | 销毁回调方法 |


### BeanDefinition注册阶段
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f89a3ba796ec8abe1c4d9d21d2469e92.png)

配置被解析成BeanDefinition后，会被注册到BeanDefinitionRegistry

**BeanDefinitionRegistry基本实现就是DefaultListableBeanFactory**

DefaultListableBeanFactory中和BeanDefinition相关的属性如下

```java
/** Map of bean definition objects, keyed by bean name. */
private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);

/** List of bean definition names, in registration order. */
private volatile List<String> beanDefinitionNames = new ArrayList<>(256);
```
beanDefinitionMap用来保存beanName和BeanDefinition的映射关系
因为map不能保存bean放进来的顺序，所以增加了一个beanDefinitionNames来保存bean的顺序

### BeanDefinition合并阶段

假设有2个对象User和Student，Student继承自User
```xml
<bean id="user" class="com.javashitang.domain.User">
    <property name="id" value="1"/>
    <property name="name" value="zhang"/>
</bean>

<bean id="student" class="com.javashitang.domain.Student" parent="user">
    <property name="age" value="10"/>
    <property name="description" value="xml"/>
</bean>
```

从容器中获取这2个对象时，属性如下，可以看到Student把User对象的属性继承过来了，这种情况就涉及到BeanDefinition的合并。

```java
User(id=1, name=zhang)
Student(super=User(id=1, name=zhang), age=10, description=xml)
```

**在最开始的时候User和Student都是GenericBeanDefinition，当进行完合并的时候会变成RootBeanDefinition**

源码位置：org.springframework.beans.factory.support.AbstractBeanFactory#getMergedBeanDefinition(java.lang.String, org.springframework.beans.factory.config.BeanDefinition, org.springframework.beans.factory.config.BeanDefinition)

我启动的容器是ApplicationContext，因为BeanPostProcessor在Bean的生命周期中起了重要的作用，我们就直接来看一下容器启动后，注册了多少BeanPostProcessor

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cdfa091f6d52565f391f28139deaf86c.png)
**可以看到注册了6个BeanPostProcessor，后面分析Bean的生命周期的时候，我会把每个BeanPostProcessor所起的作用标记出来**


Spring Bean生命周期的过程比较复杂，因此我用两节来分享。**第一节了解Bean生命周期的主要执行链路，涉及到BeanPostProcessor执行的部分全部跳过。第二季主要分析BeanPostProcessor的执行部分。**

这样先了解执行链路，再了解执行细节的方式，大家更容易接受，也不会晕车。毫不夸张的说，搞懂了Spring生命周期，就把Spring搞懂了一半

## 执行链路

为了方便大家调试，我把Spring Bean生命周期的时序图画了出来，大家可以对着图debug代码，这样理解的更深

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ed96ae6874eab09ba2355b0609f875c1.png)
### 初始化非延迟单例Bean
DefaultListableBeanFactory#preInstantiateSingletons
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e5dc30ded35d210df66044d020c7e2ba.png)
这个方法后面还有回调SmartInitializingSingleton#afterSingletonsInstantiated方法，这其实是Bean生命周期中的初始化完成阶段，我们下节详细分析

AbstractBeanFactory#doGetBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6fd025dbed40230d82448226b5f76ac1.png)
首先先从1，2，3级缓存中取，取不到再进行下面的创建过程
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5d2b288663942bb51e0b802ea970bb09.png)
AbstractAutowireCapableBeanFactory#createBean（删除部分代码）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0e1a3bbeb80cbb5304c1b6b01f27c0af.png)
先执行实例化前阶段的逻辑，然后再调用doCreateBean进行创建

AbstractAutowireCapableBeanFactory#doCreateBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1a9cc91855004a87a96151dbb5aadca9.png)
比较重要的过程我都框起来了！
### 实例化Bean
AbstractAutowireCapableBeanFactory#createBeanInstance（省略了部分不常用的逻辑）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ce58503f2707f9af0d6a716a5793d3e3.png)
实例化策略如下

1. 工厂方法不为空则使用工厂方法实例化Bean
2. 因为Bean的构造函数有可能有很多个，所以要推断使用哪个构造函数来实例化Bean
3. 如果推断出来的构造函数不为空，则使用推断出来的构造函数实例化Bean，否则使用默认构造函数实例化Bean

使用默认推断出来的构造函数还是使用默认构造函数实例化Bean会缓存下来，下次再实例化的时候就可以直接用，不用再次推断了

### 属性赋值
AbstractAutowireCapableBeanFactory#populateBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7307c6317547488e2b5cf26818cd1bc2.png)
属性赋值主要分为属性赋值前阶段和属性赋值阶段
### 初始化
AbstractAutowireCapableBeanFactory#initializeBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5bc6bb374a7ef790912921601cf56674.png)
AbstractAutowireCapableBeanFactory#invokeAwareMethods
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/59fe618a75eb50d36848784ed5e4c4fd.png)

**回调BeanNameAware，BeanClassLoaderAware，BeanFactoryAware接口的注入方法**

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a9bd06a0e2523661727799d7fd310a10.png)
**执行InitializingBean#afterPropertiesSet方法
执行用户自定义的初始化方法，例如@Bean(initMethod = "customerInit")**
### 注册DisposableBean
当我们想在Bean销毁前做一些操作时，可以通过如下3种方式实现

1. 使用@PreDestroy注解
2. 实现DisposableBean接口，重写destroy方法
3. 自定义销毁方法，例如 @Bean(destroyMethod = "customerDestroy")

AbstractBeanFactory#registerDisposableBeanIfNecessary
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7a892b2ea45e659fe708ccdefed397f8.png)
registerDisposableBeanIfNecessary的作用就是把实现了Bean销毁方法的Bean（以上三种方式只要实现了一种就行）注册到DefaultSingletonBeanRegistry的disposableBeans中

```java
// DefaultSingletonBeanRegistry
/** Disposable bean instances: bean name to disposable instance. */
private final Map<String, Object> disposableBeans = new LinkedHashMap<>();
```
当容器关闭的时候，就会从disposableBeans拿到需要执行销毁方法的Bean，然后执行对应的销毁方法，**执行的优先级为@PreDestroy > DisposableBean > 自定义销毁方法**
## BeanPostProcessor的执行部分
### Bean 实例化前阶段
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/39ff416b8e0b9890e755f23845d36b31.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4557a91fc3cef58c88e101e7a98c34fd.png)
实例化前会执行如下方法

**InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation**
**返回不为空，说明bean已经在这个方法中创建好了，不需要再进行后续的处理了，接着直接跳到初始化后阶段**

**生效类**
CommonAnnotationBeanPostProcessor#postProcessBeforeInstantiation：return null，所以正常情况下都会进行后续的流程

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInstantiation

### Bean 实例化阶段

**SmartInstantiationAwareBeanPostProcessor#determineCandidateConstructors**
选择合适的构造器，如果返回的不为空，则用返回的构造函数实例化Bean，如果返回为null，则用无参数构造函数实例化Bean

**生效类**
AutowiredAnnotationBeanPostProcessor#determineCandidateConstructors：用来支持@Lookup注解，并且推断出要创建这个Bean需要的构造函数

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#determineConstructorsFromBeanPostProcessors

### Bean 实例化后阶段

**MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition**

**生效类**
AutowiredAnnotationBeanPostProcessor#postProcessMergedBeanDefinition：
解析@Autowired，@Value，@Inject，并将相关的信息保存下来，后续对Bean属性进行赋值的时候要用

CommonAnnotationBeanPostProcessor#postProcessMergedBeanDefinition：
解析@WebServiceRef，@EJB，@Resource，@PostConstruct，@PreDestroy，并将相关信息保存下来，后续对Bean属性赋值（@WebServiceRef，@EJB，@Resource），生命周期（@PostConstruct，@PreDestroy）支持要用

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyMergedBeanDefinitionPostProcessors

**往3级缓存放工厂**

**SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference**
发生循环依赖的对象会从ObjectFactory获取提前代理的对象，而这个提前代理的对象，会经过
SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference进行代理，然后返回

**生效类**
InstantiationAwareBeanPostProcessorAdapter#getEarlyBeanReference（ConfigurationClassPostProcessor$ImportAwareBeanPostProcessor父类）：直接return bean
InstantiationAwareBeanPostProcessorAdapter#getEarlyBeanReference

（AutowiredAnnotationBeanPostProcessor父类）：直接return bean

**因为我们的demo没有开启aop哈，所有不会注入提前代理的BeanPostProcessor**

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#getEarlyBeanReference

### Bean 属性赋值前阶段
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/eddb3e12c099853fd5aa0b628e1a1c6e.png)
**InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation**
对象已经被实例化，该实例的属性还未被设置，都是null。
**该方法返回false，会忽略属性值的设置。返回true，会按正常流程设置属性值**

**生效类**
CommonAnnotationBeanPostProcessor#postProcessAfterInstantiation：return true

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean

### Bean 属性赋值阶段
**InstantiationAwareBeanPostProcessor#postProcessProperties**
**InstantiationAwareBeanPostProcessor#postProcessPropertyValues**

**对属性赋值，在高版本中postProcessPropertyValues已经被标记为@Deprecated，用postProcessProperties来替代**

AutowiredAnnotationBeanPostProcessor#postProcessProperties：查找被@Autowired和@Value标注的方法或属性，并且注入需要的值
CommonAnnotationBeanPostProcessor#postProcessProperties：查找被@WebServiceRef，@EJB，@Resource标注的属性，并且注入需要的值

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean

### Bean Aware接口回调阶段
依次回掉如下接口，注入相应的对象

BeanNameAware
BeanClassLoaderAware
BeanFactoryAware
EnvironmentAware
EmbeddedValueResolverAware
ResourceLoaderAware
ApplicationEventPublisherAware
MessageSourceAware
ApplicationContextAware

**源码位置1**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#invokeAwareMethods

**只会回调BeanNameAware，BeanClassLoaderAware，BeanFactoryAware这3个接口的实现类**

**源码位置2**
org.springframework.context.support.ApplicationContextAwareProcessor#invokeAwareInterfaces

**只会回调EnvironmentAware接口及其后面的接口**

为啥Aware接口的回调要放在2个不同的地方？

在回答这个问题之前我抛出一个高频面试题

**ApplicationContext和BeanFactory有哪些区别？**

1. BeanFactory是一个最基础的IOC容器，提供了依赖查找，依赖注入等基础的功能
2. ApplicationContext继承了BeanFactory，在BeanFactory的基础上增加了企业级的功能，如AOP，资源管理（Resources）事件（Event），国际化（i18n），Environment抽象等

因此当我们启动的容器是BeanFactory时，只能注入BeanNameAware，BeanClassLoaderAware，BeanFactoryAware接口的实现，其他接口的实现它并没有，怎么给你？

当我们启动的容器是ApplicationContext时，对这些接口进行了实现，此时才能注入进来

**根据启动容器类型的不同，回调不同的Aware接口是如何实现的？**

当进行依赖查找的时候（调用getBean方法），会回掉BeanNameAware，BeanClassLoaderAware，BeanFactoryAware接口

当容器是ApplicationContext时，会在启动的时候增加一个BeanPostProcessor，即ApplicationContextAwareProcessor，当调用ApplicationContextAwareProcessor#postProcessBeforeInitialization方法的时候，会回掉其余Aware接口的实现

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2bc91216a606a85c6d3d06f926940bb0.jpeg)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6c4312922696e843ef24affeba087fb3.jpeg)

### Bean 初始化前阶段
**BeanPostProcessor#postProcessBeforeInitialization**
在Bean初始化之前需要调用的方法

**生效类**

ApplicationContextAwareProcessor#postProcessBeforeInitialization：用来回调ApplicationContext相关的一些接口

ConfigurationClassPostProcessor.ImportAwareBeanPostProcessor#postProcessBeforeInitialization：用来支持ImportAware接口

CommonAnnotationBeanPostProcessor#postProcessBeforeInstantiation：执行@PostConstruct标注的方法

AutowiredAnnotationBeanPostProcessor#postProcessBeforeInstantiation：
return null

ApplicationListenerDetector#postProcessBeforeInitialization：直接return bean，没有做任何操作

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInitialization

### Bean 初始化阶段

依次调用如下方法：
1. @PostConstruct标注方法
2. 实现InitializingBean接口的afterPropertiesSet()方法
3. 自定义初始方法

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#invokeInitMethods

### Bean 初始化后阶段
**BeanPostProcessor#postProcessAfterInitialization**

**生效类**
AutowiredAnnotationBeanPostProcessor#postProcessBeforeInstantiation：return null
CommonAnnotationBeanPostProcessor#postProcessBeforeInstantiation：在父类InitDestroyAnnotationBeanPostProcessor中有实现，return bean
在Bean初始化之后需要调用的对象

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsAfterInitialization
### Bean 初始化完成阶段
DefaultListableBeanFactory#preInstantiateSingletons
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/69b2a23e1f786b244207697ea430ad1f.png)

SmartInitializingSingleton#afterSingletonsInstantiated
启动阶段，初始化所有非延迟单例Bean完成后，会回调这个方法，只会回调一次

**源码位置**
org.springframework.beans.factory.support.DefaultListableBeanFactory#preInstantiateSingletons

### Bean 销毁前阶段
**DestructionAwareBeanPostProcessor#postProcessBeforeDestruction**

实现DestructionAwareBeanPostProcessor接口的postProcessBeforeDestruction方法，添加自定义的逻辑。

**生效类**
InitDestroyAnnotationBeanPostProcessor#postProcessBeforeDestruction（CommonAnnotationBeanPostProcessor的父类）：被@PreDestory标注方法标注的方法

源码位置：
org.springframework.beans.factory.support.DisposableBeanAdapter#destroy

### Bean 销毁阶段

依次调用如下方法：
1. @PreDestory标注方法
2. 实现DisposableBean接口的destory()方法
3. 自定义销毁方法

源码位置：
org.springframework.beans.factory.support.DisposableBeanAdapter#destroy

## 总结
可以看到在整个Bean的生命周期中，各种BeanPostProcessor起了非常重要的作用，搞懂了这些BeanPostProcessor的实现，基本上就搞懂了Spring Bean的生命周期

最后总结一波流程图

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e4e8bf6a5bca064778d51dfaf2cc6cac.png)
## 附录
为了不打断上述生命周期主线的节奏，我将相关的基础类继承体系与定义方式抽离到附录中，供查阅参考。
### DefaultListableBeanFactory 的核心继承体系
Spring 生命周期的管理离不开核心容器类。DefaultListableBeanFactory 是极其常用的 BeanFactory 实现，它实现了多个接口，各司其职：

BeanFactory：最基础的顶层工厂，定义了 getBean 的行为。

ListableBeanFactory：提供迭代、批量获取 Bean 的能力（如 getBeanNamesOfType）。

AutowireCapableBeanFactory：提供控制 Bean 自动注入、创建、初始化及应用后置处理器的能力。

BeanDefinitionRegistry：定义了对 BeanDefinition（Bean 图纸）的增删改查操作。

DefaultSingletonBeanRegistry：内部用一个 Map 维护着所有创建好的单例 Bean（即我们常说的一级缓存）。
### 实例化方式
在日常开发中，我们有多种手段来控制 Bean 的创建与销毁：

| 实现方式 | 说明 |
|--|--|
| 构造方法实例化 | 最常用，Spring 默认寻找无参构造或推断构造 |
| 静态工厂/实例工厂 | 通过指定 factory-method 来控制实例化 |
| 实现 FactoryBean 接口 | 注册的是 FactoryBean，但实际 getBean 获取到的是其 getObject() 返回的对象（若想获取其自身，需在 beanName 前加 &） |


写个demo演示一下这几种方式

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e8ee002bc17c52ee85a0f89759e27945.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c66578ef438d0d025148200a77dbb554.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/963546b4785e5bf4b41bf7912410f552.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cbf67744e13e8d983e617ee1dea8e209.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/98eb2b45209de5f48a72b5702ab26dc2.png)
可以看到当我们用FactoryBean实现类的名字来获取Bean时，获取到的并不是FactoryBean，而是调用FactoryBean#getObject方法创建出来的对象。

我们我们如何获取FactoryBean对象呢？只需要在名字前面加一个&即可

### 销毁方式
| 实现方式| 说明 |
|--|--|
| @PreDestroy 注解 | JSR-250 标准，执行优先级最高 |
| 实现 DisposableBean | 重写 destroy() 方法，属于 Spring 的接口侵入式设计 |
| 自定义 destroyMethod | 如 @Bean(destroyMethod="clean")，解耦效果最好 |

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/da5b4d4848d60b17d160d793209eb963.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b7530e12c687af13e7fac67848f20c40.png)

