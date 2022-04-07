---
layout: post
title: Spring Bean生命周期详解（一）
lock: need
---

# Spring IOC源码解析：Spring Bean生命周期详解（一）
![请添加图片描述](https://img-blog.csdnimg.cn/f65ad42603314eab86cbe622422db039.png?)
## DefaultListableBeanFactory继承体系
![在这里插入图片描述](https://img-blog.csdnimg.cn/0addcb9df04142469dad7523caf2aaca.png?)

BeanFactory：Bean工厂，用来生产Bean

ConfigurableBeanFactory：提供配置工厂的方法

AutowireCapableBeanFactory：创建Bean，自动注入，初始化以及应用BeanPostProcessor

HierarchicalBeanFactory：获取父工厂

ListableBeanFactory：迭代的方式获取Bean

ConfigurableListableBeanFactory：指定忽略类型及清单

FactoryBeanRegistrySupport：增加对FactoryBean的支持

DefaultListableBeanFactory：最常用的BeanFactory实现类

---

AliasRegistry：定义对别名的增删查操作

SimpleAliasRegistry：对AliasRegistry进行实现。使用map保存 bean的别名->bean的名字 的映射关系

BeanDefinitionRegistry：定义对BeanDefinition的增删查操作

SingletonBeanRegistry：实现对单例Bean的注册和互殴去

DefaultSingletonBeanRegistry：对SingletonBeanRegistry进行实现。用map保存生成的单例Bean

因为初始化非延迟单例Bean的调用链路比较深，我先画一个简图，后续源码解析都围绕这个简图来展开。你可以先看一下这个简图，后续看源码就非常容易理解了！

![在这里插入图片描述](https://img-blog.csdnimg.cn/41cb7c1c205d49f9afea9ee57ee5b801.png?)

Spring Bean生命周期的过程比较复杂，因此我用两节来分享。**第一节了解Bean生命周期的主要执行链路，涉及到BeanPostProcessor执行的部分全部跳过。第二季主要分析BeanPostProcessor的执行部分。**

这样先了解执行链路，再了解执行细节的方式，大家更容易接受，也不会晕车。毫不夸张的说，搞懂了Spring生命周期，就把Spring搞懂了一半
## 实例化Bean的几种方式
我们常用的实例化Bean的方式有如下几种

1. 构造方法实例化 Bean
2. 静态方法实例化 Bean
3. Bean工厂方法实例化 Bean
4. FactoryBean实例化 Bean

写个demo演示一下这几种方式

![在这里插入图片描述](https://img-blog.csdnimg.cn/2334de472adc4ce3a85b7ee737cf4bbc.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/7dc76f1c654142b4a0460e759041c58d.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/33852fd8386742debe0d6ea2b3f3cdd2.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/6685f946af9f4c3cbcfe392e98953f6e.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/8d249fb604c0443884db8dc0cc46078a.png)
可以看到当我们用FactoryBean实现类的名字来获取Bean时，获取到的并不是FactoryBean，而是调用FactoryBean#getObject方法创建出来的对象。

我们我们如何获取FactoryBean对象呢？只需要在名字前面加一个&即可
## 初始化非延迟单例Bean
DefaultListableBeanFactory#preInstantiateSingletons
![在这里插入图片描述](https://img-blog.csdnimg.cn/059cc3e5fb0041bd9a636b8d209968d5.png?)
这个方法后面还有回调SmartInitializingSingleton#afterSingletonsInstantiated方法，这其实是Bean生命周期中的初始化完成阶段，我们下节详细分析

AbstractBeanFactory#doGetBean
![在这里插入图片描述](https://img-blog.csdnimg.cn/4703b7e5a1574575aa2b6d7699ea407b.png?)
首先先从1，2，3级缓存中取，取不到再进行下面的创建过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/3c785046b382437292344313ad8f0b31.png?)
AbstractAutowireCapableBeanFactory#createBean（删除部分代码）
![在这里插入图片描述](https://img-blog.csdnimg.cn/cc99ad80260244ff99b0197a773ca358.png?)
先执行实例化前阶段的逻辑，然后再调用doCreateBean进行创建

AbstractAutowireCapableBeanFactory#doCreateBean
![在这里插入图片描述](https://img-blog.csdnimg.cn/82bbb79da64b469f9e5b1f1cefd96433.png?)
比较重要的过程我都框起来了！
## 实例化Bean
AbstractAutowireCapableBeanFactory#createBeanInstance（省略了部分不常用的逻辑）
![在这里插入图片描述](https://img-blog.csdnimg.cn/5f1d0ba48c544cfbbf249c1ed433f4c4.png?)
实例化策略如下

1. 工厂方法不为空则使用工厂方法实例化Bean
2. 因为Bean的构造函数有可能有很多个，所以要推断使用哪个构造函数来实例化Bean
3. 如果推断出来的构造函数不为空，则使用推断出来的构造函数实例化Bean，否则使用默认构造函数实例化Bean

使用默认推断出来的构造函数还是使用默认构造函数实例化Bean会缓存下来，下次再实例化的时候就可以直接用，不用再次推断了

## 属性赋值
AbstractAutowireCapableBeanFactory#populateBean
![在这里插入图片描述](https://img-blog.csdnimg.cn/bc6a719419d340df9d248e73a75a77de.png?)
属性赋值主要分为属性赋值前阶段和属性赋值阶段
## 初始化
AbstractAutowireCapableBeanFactory#initializeBean
![在这里插入图片描述](https://img-blog.csdnimg.cn/462195e9124c4ba1a9b818049bec4f22.png?)
AbstractAutowireCapableBeanFactory#invokeAwareMethods
![在这里插入图片描述](https://img-blog.csdnimg.cn/ea28b70b4706488da7662c73cbe4bf77.png?)
**回调BeanNameAware，BeanClassLoaderAware，BeanFactoryAware接口的注入方法**
![在这里插入图片描述](https://img-blog.csdnimg.cn/05511f33c0054d80b54e51ba3dcae80d.png?)
**执行InitializingBean#afterPropertiesSet方法
执行用户自定义的初始化方法，例如@Bean(initMethod = "customerInit")**
## 注册DisposableBean
当我们想在Bean销毁前做一些操作时，可以通过如下3种方式实现

1. 使用@PreDestroy注解
2. 实现DisposableBean接口，重写destroy方法
3. 自定义销毁方法，例如 @Bean(destroyMethod = "customerDestroy")

![在这里插入图片描述](https://img-blog.csdnimg.cn/8f31a1251ab945e88db8e0c84509ab63.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/0947613231b643d9aea66812c8605883.png?)
AbstractBeanFactory#registerDisposableBeanIfNecessary
![在这里插入图片描述](https://img-blog.csdnimg.cn/f01b4b44302e4e20a4ce9ed63bd2f736.png?)
registerDisposableBeanIfNecessary的作用就是把实现了Bean销毁方法的Bean（以上三种方式只要实现了一种就行）注册到DefaultSingletonBeanRegistry的disposableBeans中

```java
// DefaultSingletonBeanRegistry
/** Disposable bean instances: bean name to disposable instance. */
private final Map<String, Object> disposableBeans = new LinkedHashMap<>();
```
当容器关闭的时候，就会从disposableBeans拿到需要执行销毁方法的Bean，然后执行对应的销毁方法，**执行的优先级为@PreDestroy > DisposableBean > 自定义销毁方法**