---
layout: post
title: Spring Bean生命周期详解（二）
lock: need
---

# Spring Bean生命周期详解（二）
![请添加图片描述](https://img-blog.csdnimg.cn/7b680b067e224616a10f9bc254d8a7eb.png?)
## BeanFactoryPostProcessor和BeanPostProcessor
在上一节我们对Bean的生命周期有了一个大概的了解，但是跳过了BeanPostProcessor的执行部分，本节我们就只分析BeanPostProcessor的执行部分。并且完善我们之前画的流程图。

**如果我们要对Spring进行扩展，一般有如下方法**
1. 实现BeanFactoryPostProcessor接口（对BeanFactory进行扩展）
2. 实现BeanPostProcessor接口（对Bean的生成过程进行扩展）

BeanPostProcessor相关接口的继承关系如下（说实话，单看这个uml类图，都能说出Spring Bean生命周期的大概阶段）
![在这里插入图片描述](https://img-blog.csdnimg.cn/e128c78596ef4fb6b6800993143b9fc8.png?)
BeanFactoryPostProcessor的子接口只有一个BeanDefinitionRegistryPostProcessor
![在这里插入图片描述](https://img-blog.csdnimg.cn/1a75ea5a98784a8caa3288ca7fe027e3.png?)
利用BeanFactoryPostProcessor接口可以获取到BeanFactory，这样可以对工厂进行扩展
![在这里插入图片描述](https://img-blog.csdnimg.cn/c30a6cb744c64a55bca4e54f3fae581a.png?)
利用BeanDefinitionRegistryPostProcessor接口你就可以往BeanDefinitionRegistry中增加Bean定义或者删除Bean定义

BeanPostProcessor接口的使用我会在文章最后写一个Demo，先演示一下BeanFactoryPostProcessor接口的作用，对BeanFactory进行扩展

```java
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory factory) throws BeansException {
        for (String beanDefinitionName : factory.getBeanDefinitionNames()) {
            BeanDefinition beanDefinition = factory.getBeanDefinition(beanDefinitionName);
            beanDefinition.setScope("prototype");
        }
    }
}
```
我们都知道Spring容器中的Bean的作用域默认是singleton，我们扩展BeanFactoryPostProcessor接口并注入到容器中，让所有Bean的作用域变为prototype，此时每次从容器中获取的对象都是新对象

```java
Animal animal1 = applicationContext.getBean("animal", Animal.class);
Animal animal2 = applicationContext.getBean("animal", Animal.class);
// false
System.out.println(animal1 == animal2);
```

**这个例子就充分体现了BeanFactoryPostProcessor方法需要排序调用的重要性了，按照之前的排序规则ConfigurationClassPostProcessor类的调用时机会早于MyBeanFactoryPostProcessor，此时Bean已经都注入到容器中了，所以能将所有Bean的作用域修改为prototype，如果先执行MyBeanFactoryPostProcessor后执行ConfigurationClassPostProcessor，那只会修改部分Bean的作用域为prototype。这样你用起来估计都会懵逼**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210527005222400.png?)

**BeanPostProcessor接口可以对Bean生命周期中的很多部分进行扩展，并且Spring容器中有很多内建的BeanPostProcessor对Spring Bean的功能进行支持。搞懂了Spring内置的BeanPostProcessor的功能，基本上就把Spring Bean的生命周期搞懂了**。其余的如事件，国际化，资源管理在此基础上就很容易理解了


**Spring Bean的生命周期可以主要分为如下4个部分**

1. 处理BeanDefinition：BeanDefinition的解析，注册，合并
2. Bean实例化（Instantiation）：还没有生成bean，即没有调用构造函数，生成对象
3. Bean初始化（Initialization）：已经生成bean，进行属性赋值
4. Bean销毁：并没有gc

**分享到这了，我就抛出一个问题，BeanFactoryPostProcessor和BeanPostProcessor接口哪个先执行？**

当然是BeanFactoryPostProcessor先执行，BeanPostProcessor后执行了，仔细看启动流程图

1. BeanFactoryPostProcessor的执行在BeanFactory后置处理阶段
2. BeanPostProcessor的执行在BeanFactory初始化完成阶段（初始化非延迟单例Bean）
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021052700213626.png?)

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
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021031215280990.png?)

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

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210314195526777.png?)
**可以看到注册了6个BeanPostProcessor，后面分析Bean的生命周期的时候，我会把每个BeanPostProcessor所起的作用标记出来**

![在这里插入图片描述](https://img-blog.csdnimg.cn/fb94a0c5223643a3b516483be113d0de.png?)
为了方便大家调试，我把Spring Bean生命周期的时序图画了出来，大家可以对着图debug代码，这样理解的更深
### Bean 实例化前阶段
![在这里插入图片描述](https://img-blog.csdnimg.cn/593696e5dcfc4a93900a8f2f7e13fee0.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/de6fe086318f4b89b63c87d290398a5c.png?)
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
![在这里插入图片描述](https://img-blog.csdnimg.cn/e2e033f98b7047a8bd12a64196b0fa18.png?)
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

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210313193619600.jpeg?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210313193631403.jpeg?)

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
![在这里插入图片描述](https://img-blog.csdnimg.cn/7b6eb80600ac4d4bb99f075fdbcbe418.png?)

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
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210527165808994.png?)
## 演示
因为在Bean的生命周期中如下2个方法都有分支，我就演示一下这2个方法把
InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation
InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation

```java
@Data
@ToString
public class Animal {

    private String name;
    private Long speed;

    public Animal() {
        System.out.println("Animal 构造函数");
    }
}
```

```java
@Data
@ToString
public class User {

    private Long id;
    private String name;

    public User() {
        System.out.println("User 构造函数");
    }

}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        https://www.springframework.org/schema/context/spring-context.xsd">

    <bean id="animal" class="com.javashitang.domain.Animal">
        <property name="name" value="小狗"/>
        <property name="speed" value="10"/>
    </bean>

    <bean id="user" class="com.javashitang.domain.User">
        <property name="id" value="1"/>
        <property name="name" value="zhang"/>
    </bean>

    <bean class="com.javashitang.MyInstantiationAwareBeanPostProcessor"/>

    <context:annotation-config/>

</beans>
```

```java
public class MyInstantiationAwareBeanPostProcessor implements InstantiationAwareBeanPostProcessor {

    /**
     * 实例化前阶段
     * 返回为null，说明继续让spring创建bean
     * 返回不为null，bean已经在这个方法中创建好了，不需要再进行后续的处理了
     */
    @Override
    public Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
        if (ObjectUtils.nullSafeEquals("animal", beanName) && Animal.class.equals(beanClass)) {
            Animal animal = new Animal();
            animal.setName("老虎");
            animal.setSpeed(100L);
            return animal;
        }
        return null;
    }

    /**
     * 属性赋值前阶段
     * bean已经被实例化，bean的属性还没有被设置，都是null
     * 返回false，忽略属性值的设置
     * 返回true，按照正常流程设置属性值
     */
    @Override
    public boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
        if (ObjectUtils.nullSafeEquals("user", beanName) && User.class.equals(bean.getClass())) {
            User user = (User) bean;
            user.setId(10L);
            user.setName("li");
            return false;
        }
        return true;
    }
}
```

```java
public class BeanLifecycleDemo {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext applicationContext = new ClassPathXmlApplicationContext();
        String[] locations = {"bean-lifecycle-context.xml"};
        applicationContext.setConfigLocations(locations);
        applicationContext.refresh();

        Animal animal = applicationContext.getBean("animal", Animal.class);
        // Animal(name=老虎, speed=100)
        System.out.println(animal);

        User user = applicationContext.getBean("user", User.class);
        // User(id=10, name=li)
        System.out.println(user);

        applicationContext.close();

    }
}
```
可以看到Animal对象和User对象返回的值并不是我在xml中配置的，而是在MyInstantiationAwareBeanPostProcessor接口中配置的

其他接口的使用你可以参考我github
https://github.com/erlieStar/spring-learning（bean-lifecycle模块）
