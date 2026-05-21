---
layout: post
title: Spring Bean生命周期详解（一）
lock: need
---

# Spring IOC源码解析：Spring Bean生命周期详解（一）
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/f394262deadd1044b261738f77fbcb31.jpeg)
## Bean生命周期的四大阶段
Spring Bean 的生命周期虽然繁杂，但从大体上可以划分为 **4 大核心阶段**：

**BeanDefinition 解析与注册阶段**：把配置（XML/注解）解析为 Bean 的元数据

**实例化阶段（Instantiation）**：在内存中为 Bean 分配空间，调用构造函数生成对象实例（此时属性皆为默认值）

**初始化阶段（Initialization）**：为对象进行属性赋值、依赖注入，并执行各类 Aware 回调和初始化方法

**销毁阶段（Destruction）**：当容器关闭时，执行相关的资源释放操作。

## BeanFactoryPostProcessor和BeanPostProcessor
**如果我们要对Spring进行扩展，一般有如下方法**
1. 实现BeanFactoryPostProcessor接口
2. 实现BeanPostProcessor接口

BeanPostProcessor相关接口的继承关系如下（说实话，单看这个uml类图，都能说出Spring Bean生命周期的大概阶段）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/56f2291d9a9a837bc211a7caa65a7b7f.png)

BeanFactoryPostProcessor的子接口只有一个BeanDefinitionRegistryPostProcessor

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/90739722f183f3cd798f7a50fe7af963.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4983f6a9eb646e3d5f4f5fe6d73de008.png)

利用BeanFactoryPostProcessor接口可以获取到BeanFactory，这样可以对工厂进行扩展

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/53590f3c45caa4b9c4ffdcf8ea5f7ed7.png)

利用BeanDefinitionRegistryPostProcessor接口你就可以往BeanDefinitionRegistry中增加Bean定义或者删除Bean定义

先演示一下BeanFactoryPostProcessor接口的作用，对BeanFactory进行扩展

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

这个例子就充分体现了BeanFactoryPostProcessor方法需要排序调用的重要性了，按照之前的排序规则ConfigurationClassPostProcessor类的调用时机会早于MyBeanFactoryPostProcessor，此时Bean已经都注入到容器中了，所以能将所有Bean的作用域修改为prototype，如果先执行MyBeanFactoryPostProcessor后执行ConfigurationClassPostProcessor，那只会修改部分Bean的作用域为prototype。这样你用起来估计都会懵逼

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/33029a9bf2c3f5cb2285afabac3011ad.png)

**BeanPostProcessor接口可以对Bean生命周期中的很多部分进行扩展，并且Spring容器中有很多内建的BeanPostProcessor对Spring Bean的功能进行支持。搞懂了Spring内置的BeanPostProcessor的功能，基本上就把Spring Bean的生命周期搞懂了**。其余的如事件，国际化，资源管理在此基础上就很容易理解了


**分享到这了，我就抛出一个问题，BeanFactoryPostProcessor和BeanPostProcessor接口哪个先执行？**

当然是 BeanFactoryPostProcessor 先执行。因为前者处理的是 Bean 的“图纸”（BeanDefinition），后者处理的是根据图纸建好的“楼房”（Bean 实例）

**我来用图总结一下Spring Bean生命周期，如果对源码感兴趣，可以看下一节**

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e4e8bf6a5bca064778d51dfaf2cc6cac.png)

因为在Bean的生命周期中如下2个方法都有分支，我就演示一下这2个方法吧
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