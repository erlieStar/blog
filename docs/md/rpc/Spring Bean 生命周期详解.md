---
layout: post
title: Spring Bean 生命周期详解
lock: need
---

# 手写RPC框架：Spring Bean 生命周期详解

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210317224843860.jpg?)
## 基本概念
我们将自己写的RPC框架和Spring进行整合，分析Dubbo源码的时候，都要对Spring Bean的生命周期有一个清晰的理解，所以这一节我们就分析一下Spring Bean的生命周期

**Spring是一个IOC容器**
当我们不用Spring进行开发时，我们需要在代码中设置对象的依赖关系。当我们用了Spring之后，由Spring来管理这种依赖关系，当我们想使用对象时，直接从Spring容器中获取即可

**BeanDefinition**
在Spring中对象被叫做Bean，因为Spring Bean在Java类的基础上增加了很多概念，比如scope（作用域），isLazyInit（是否延迟初始化），isSingleton（是否单例），此时Java类不能完整的描述，所以需要新的定义描述类，这个类就是BeanDefinition

**BeanDefinitionReader**
BeanDefinitionReader会将配置的bean解析成为BeanDefinition，Spring Bean的配置方式有很多种，如XML，properties，groovy，注解（可能通过properties，groovy的方式你不常用，但Spring确实支持这种方式），所以BeanDefinitionReader的实现类也很多

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210330111959746.png?)

**ClassPathBeanDefinitionScanner**
当把Bean配置出后，得需要相应的组件把他们从资源文件中扫描出来吗，这个组件就是ClassPathBeanDefinitionScanner

**BeanDefinitionRegistry**
BeanDefinitionReader将配置的bean解析成为BeanDefinition，需要将BeanDefinition保存到BeanDefinitionRegistry。类似工厂把原料保存到仓库中，供后续生产产品使用

**BeanFactory**
BeanFactory会根据BeanDefinition将Bean生产出来，并保存下来

**DefaultListableBeanFactory**
DefaultListableBeanFactory在绝大多数的场景都是BeanFactory的实现类，DefaultListableBeanFactory实现了BeanDefinitionRegistry接口和BeanFactory接口，所以能保存Bean定义，同时又能根据Bean定义将Bean生产出来

**BeanPostProcessor**
BeanFactory根据BeanDefinition生成Bean的过程是一个标准化的流程，就像一个流水线一样，当然你可以在这个流水线上做一些自定义的操作。**在Spring中你可以通过实现BeanPostProcessor来干预Bean的生产过程**

**BeanFactoryPostProcessor**
Spring作为一个强大的容器，不仅能让你干预Bean的生产过程，还可以让你干预BeanFactory，**例如你可以通过BeanFactoryPostProcessor将Bean的作用域都该成原型，默认是单例**

## Spring容器启动流程
### 容器初始化过程
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
初始化的过程可以看到初始化beanFactory为DefaultListableBeanFactory。**这里可以看到AnnotationConfigApplicationContext虽然本身是一个beanFactory（实现了BeanFactory接口），但是依赖查找，依赖注入的过程是依赖内部的beanFactory来实现的（典型的代理模式）**

**另外需要注意的一点是，在容器初始化的过程中注册了6个Bean**
1. ConfigurationClassPostProcessor（**实现了BeanFactoryPostProcessor，处理@Configuration，@ComponmentScan等注解，这是一个很重要的类**）
2. **AutowiredAnnotationBeanPostProcessor（实现了BeanPostProcessor，处理@Autowired，@Value等）**
3. **CommonAnnotationBeanPostProcessor（实现了BeanPostProcessor，用来处理JSR-250规范的注解，如@Resource，@PostConstruct等）**
4. PersistenceAnnotationBeanPostProcessor（实现了BeanFactoryPostProcessor，用来支持JPA，在我们这个Demo中不会注册，因为路径中没有JPA相关的类）
5. EventListenerMethodProcessor（实现了BeanFactoryPostProcessor）
6. DefaultEventListenerFactory

注册的过程估计你也猜到了，就是将对应的类，如ConfigurationClassPostProcessor解析为RootBeanDefinition，并注册到BeanDefinitionRegistry中

**这几个BeanPostProcessor在Spring Bean的生命周期中发挥了很大的作用，我们在Spring Bean生命周期这篇文章中来分析**。

**好了，我们来看最重要的过程，容器刷新的过程，入口方法为AbstractApplicationContext#refresh**

### 容器刷新过程
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

**回调BeanFactoryPostProcessor接口的相关方法就搞这么多排序规则，有必要吗？**

有必要，一方面是提高可扩展性，另外一方面是有些实现类的调用优先级必须要高一点，不然会有问题，我后面用例子演示

### BeanFactory注册BeanPostProcessor阶段
1. **注册BeanPostProcessor（PostProcessorRegistrationDelegate.BeanPostProcessorChecker）**
2. 注册PriorityOrdered类型的BeanPostProcessor
4. 注册Ordered类型的BeanPostProcessor
5. 注册普通的BeanPostProcessor
6. 注册MergedBeanDefinitionPostProcessor
7. **注册BeanPostProcessor（ApplicationListenerDetector）**

**此时注册到容器中的BeanPostProcessor有如下6个（注册的时机我都在前文标注过了）**，这6个BeanPostProcessor在Spring Bean的生命周期中起着重要的作用
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210322232429517.png?)
这个注册时机会影响后面调用的时机，所以搞优先级很有必要

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

**说一个高频面试题，Spring容器在何时创建对象？**

1. scope=singleton，容器启动过程中创建对象
2. scope!=singleton，延迟Bean（加了@Lazy，或\<bean lazy-init="true"/>），在调用getBean的同时创建对象
### Spring应用上下文启动完成阶段
AbstractApplicationContext#finishRefresh

1. 清除ResoureLoader缓存
2. 初始化lifecycleProcessor对象
3. 调用lifecycleProcessor#onRefresh方法
4. 发布应用上下文刷新事件 ContextRefreshedEvent
5. 向MBeanServer托管Live Beans

## Spring Bean生命周期
### BeanFactoryPostProcessor和BeanPostProcessor
**书接上文，如果我们要对Spring进行扩展，一般有如下方法**
1. 实现BeanFactoryPostProcessor接口
2. 实现BeanPostProcessor接口

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

### Spring Bean生命周期
#### BeanDefinition解析阶段
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


#### BeanDefinition注册阶段
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

#### BeanDefinition合并阶段

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

**Bean的实例化和初始化这部分只要追着AbstractBeanFactory#doGetBean这个方法看就行了，我会在每个阶段标注代码执行的位置，方便大家Debug调试，及查看调用链路**

源码位置：org.springframework.beans.factory.support.AbstractBeanFactory#getMergedBeanDefinition(java.lang.String, org.springframework.beans.factory.config.BeanDefinition, org.springframework.beans.factory.config.BeanDefinition)

我启动的容器是ApplicationContext，因为BeanPostProcessor在Bean的生命周期中起了重要的作用，我们就直接来看一下容器启动后，注册了多少BeanPostProcessor

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210314195526777.png?)
**可以看到注册了6个BeanPostProcessor，后面分析Bean的生命周期的时候，我会把每个BeanPostProcessor所起的作用标记出来**

#### Bean 实例化前阶段
**InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation**
返回不为空，说明bean已经在这个方法中创建好了，不需要再进行后续的处理了

**生效类**
CommonAnnotationBeanPostProcessor#postProcessBeforeInstantiation：return null，所以正常情况下都会进行后续的流程

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInstantiation

#### Bean 实例化阶段
**SmartInstantiationAwareBeanPostProcessor#determineCandidateConstructors**
选择合适的构造器，如果返回的不为空，则用返回的构造函数实例化Bean，如果返回为null，则用无参数构造函数实例化Bean

**生效类**
AutowiredAnnotationBeanPostProcessor#determineCandidateConstructors：用来支持@Lookup注解，并且推断出要创建这个Bean需要的构造函数

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#determineConstructorsFromBeanPostProcessors

#### Bean 实例化后阶段

**MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition**

**生效类**
AutowiredAnnotationBeanPostProcessor#postProcessMergedBeanDefinition：
解析@Autowired，@Value，@Inject，并将相关的信息保存下来，后续对Bean属性进行赋值的时候要用

CommonAnnotationBeanPostProcessor#postProcessMergedBeanDefinition：
解析@WebServiceRef，@EJB，@Resource，@PostConstruct，@PreDestroy，并将相关信息保存下来，后续对Bean属性赋值（@WebServiceRef，@EJB，@Resource），生命周期（@PostConstruct，@PreDestroy）支持要用

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyMergedBeanDefinitionPostProcessors

**SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference**
发生循环依赖的对象会从ObjectFactory获取提前曝光的对象，而这个提前曝光的对象，会经过
SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference增强，然后返回。
如果你对循环依赖的三级缓存不清楚的话，建议看《面试官：Spring如何解决循环依赖？》

**生效类**
InstantiationAwareBeanPostProcessorAdapter#getEarlyBeanReference（ConfigurationClassPostProcessor$ImportAwareBeanPostProcessor父类）：直接return bean
InstantiationAwareBeanPostProcessorAdapter#getEarlyBeanReference

（AutowiredAnnotationBeanPostProcessor父类）：直接return bean


**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#getEarlyBeanReference

#### Bean 属性赋值前阶段

**InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation**
对象已经被实例化，该实例的属性还未被设置，都是null。该方法返回false，会忽略属性值的设置。返回true，会按正常流程设置属性值

**生效类**
CommonAnnotationBeanPostProcessor#postProcessAfterInstantiation：return true

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean

#### Bean 属性赋值阶段
**InstantiationAwareBeanPostProcessor#postProcessProperties**
**InstantiationAwareBeanPostProcessor#postProcessPropertyValues**

对属性值进行修改，postProcessProperties用来替代postProcessPropertyValues

AutowiredAnnotationBeanPostProcessor#postProcessProperties：查找被@Autowired和@Value标注的方法或属性，并且注入需要的值
CommonAnnotationBeanPostProcessor#postProcessProperties：查找被@WebServiceRef，@EJB，@Resource标注的属性，并且注入需要的值

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean

#### Bean Aware接口回调阶段
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

**只会回掉BeanNameAware，BeanClassLoaderAware，BeanFactoryAware这3个接口的实现类**

**源码位置2**
org.springframework.context.support.ApplicationContextAwareProcessor#invokeAwareInterfaces

**只会回掉EnvironmentAware接口及其后面的接口**

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

#### Bean 初始化前阶段
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

#### Bean 初始化阶段

依次调用如下方法：
1. @PostConstruct标注方法
2. 实现InitializingBean接口的afterPropertiesSet()方法
3. 自定义初始方法

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#invokeInitMethods

#### Bean 初始化后阶段
**BeanPostProcessor#postProcessAfterInitialization**

**生效类**
AutowiredAnnotationBeanPostProcessor#postProcessBeforeInstantiation：return null
CommonAnnotationBeanPostProcessor#postProcessBeforeInstantiation：在父类InitDestroyAnnotationBeanPostProcessor中有实现，return bean
在Bean初始化之后需要调用的对象

**源码位置**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsAfterInitialization
#### Bean 初始化完成阶段
SmartInitializingSingleton#afterSingletonsInstantiated
启动阶段，初始化所有非延迟单例Bean完成后，会回调这个方法，只会回调一次

**源码位置**
org.springframework.beans.factory.support.DefaultListableBeanFactory#preInstantiateSingletons

#### Bean 销毁前阶段
**DestructionAwareBeanPostProcessor#postProcessBeforeDestruction**

实现DestructionAwareBeanPostProcessor接口的postProcessBeforeDestruction方法，添加自定义的逻辑，例如修改对象属性等

**生效类**
InitDestroyAnnotationBeanPostProcessor#postProcessBeforeDestruction（CommonAnnotationBeanPostProcessor的父类）：被@PreDestory标注方法标注的方法

源码位置：


#### Bean 销毁阶段

依次调用如下方法：
1. @PreDestory标注方法
2. 实现DisposableBean接口的destory()方法
3. 自定义销毁方法

源码位置：

## 总结
可以看到在整个Bean的生命周期中，各种BeanPostProcessor起了非常重要的作用，搞懂了这些BeanPostProcessor的实现，基本上就搞懂了Spring Bean的生命周期

不仅如此，BeanPostProcessor不仅在IOC上发挥了重要作用，在AOP上也发挥了重要的作用

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
## 参考博客
[1]https://mp.weixin.qq.com/s/gBr3UfC1HRcw4U-ZMmtRaQ
循环依赖解决办法
[0]https://juejin.im/post/5c98a7b4f265da60ee12e9b2
好的博客
[0]https://fangjian0423.github.io/2017/06/20/spring-bean-post-processor/
大概流程
[1]https://editor.csdn.net/md?articleId=104781542
名词介绍
[2]https://juejin.im/post/5da995d25188256a49204d7b
MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition的作用
[3]https://www.cnblogs.com/elvinle/p/13371760.html
[4]https://blog.csdn.net/luoyang_java/article/details/85709475
Aware接口的作用
[5]https://blog.csdn.net/Bronze5/article/details/105902892
循环依赖好文
[6]https://zhuanlan.zhihu.com/p/157314153