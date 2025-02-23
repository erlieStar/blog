---
layout: post
title: Spring Bean生命周期详解（一）
lock: need
---

# Spring IOC源码解析：Spring Bean生命周期详解（一）
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/f394262deadd1044b261738f77fbcb31.jpeg)
## DefaultListableBeanFactory继承体系
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/020445dfb5f9ff42dc80c99e5358e9ef.png)

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

SingletonBeanRegistry：实现对单例Bean的注册和获取

DefaultSingletonBeanRegistry：对SingletonBeanRegistry进行实现。用map保存生成的单例Bean

因为初始化非延迟单例Bean的调用链路比较深，我先画一个简图，后续源码解析都围绕这个简图来展开。你可以先看一下这个简图，后续看源码就非常容易理解了！
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4e5a6f3f206d270bc572caccf8d4a3df.png)
Spring Bean生命周期的过程比较复杂，因此我用两节来分享。**第一节了解Bean生命周期的主要执行链路，涉及到BeanPostProcessor执行的部分全部跳过。第二季主要分析BeanPostProcessor的执行部分。**

这样先了解执行链路，再了解执行细节的方式，大家更容易接受，也不会晕车。毫不夸张的说，搞懂了Spring生命周期，就把Spring搞懂了一半
## 实例化Bean的几种方式
我们常用的实例化Bean的方式有如下几种

1. 构造方法实例化 Bean
2. 静态方法实例化 Bean
3. Bean工厂方法实例化 Bean
4. FactoryBean实例化 Bean

写个demo演示一下这几种方式
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e8ee002bc17c52ee85a0f89759e27945.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c66578ef438d0d025148200a77dbb554.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/963546b4785e5bf4b41bf7912410f552.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cbf67744e13e8d983e617ee1dea8e209.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/98eb2b45209de5f48a72b5702ab26dc2.png)
可以看到当我们用FactoryBean实现类的名字来获取Bean时，获取到的并不是FactoryBean，而是调用FactoryBean#getObject方法创建出来的对象。

我们我们如何获取FactoryBean对象呢？只需要在名字前面加一个&即可
## 初始化非延迟单例Bean
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
## 实例化Bean
AbstractAutowireCapableBeanFactory#createBeanInstance（省略了部分不常用的逻辑）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ce58503f2707f9af0d6a716a5793d3e3.png)
实例化策略如下

1. 工厂方法不为空则使用工厂方法实例化Bean
2. 因为Bean的构造函数有可能有很多个，所以要推断使用哪个构造函数来实例化Bean
3. 如果推断出来的构造函数不为空，则使用推断出来的构造函数实例化Bean，否则使用默认构造函数实例化Bean

使用默认推断出来的构造函数还是使用默认构造函数实例化Bean会缓存下来，下次再实例化的时候就可以直接用，不用再次推断了

## 属性赋值
AbstractAutowireCapableBeanFactory#populateBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7307c6317547488e2b5cf26818cd1bc2.png)
属性赋值主要分为属性赋值前阶段和属性赋值阶段
## 初始化
AbstractAutowireCapableBeanFactory#initializeBean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5bc6bb374a7ef790912921601cf56674.png)
AbstractAutowireCapableBeanFactory#invokeAwareMethods
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/59fe618a75eb50d36848784ed5e4c4fd.png)
**回调BeanNameAware，BeanClassLoaderAware，BeanFactoryAware接口的注入方法**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a9bd06a0e2523661727799d7fd310a10.png)
**执行InitializingBean#afterPropertiesSet方法
执行用户自定义的初始化方法，例如@Bean(initMethod = "customerInit")**
## 注册DisposableBean
当我们想在Bean销毁前做一些操作时，可以通过如下3种方式实现

1. 使用@PreDestroy注解
2. 实现DisposableBean接口，重写destroy方法
3. 自定义销毁方法，例如 @Bean(destroyMethod = "customerDestroy")

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/da5b4d4848d60b17d160d793209eb963.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b7530e12c687af13e7fac67848f20c40.png)
AbstractBeanFactory#registerDisposableBeanIfNecessary
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7a892b2ea45e659fe708ccdefed397f8.png)
registerDisposableBeanIfNecessary的作用就是把实现了Bean销毁方法的Bean（以上三种方式只要实现了一种就行）注册到DefaultSingletonBeanRegistry的disposableBeans中

```java
// DefaultSingletonBeanRegistry
/** Disposable bean instances: bean name to disposable instance. */
private final Map<String, Object> disposableBeans = new LinkedHashMap<>();
```
当容器关闭的时候，就会从disposableBeans拿到需要执行销毁方法的Bean，然后执行对应的销毁方法，**执行的优先级为@PreDestroy > DisposableBean > 自定义销毁方法**