---
layout: post
title: Spring处理循环依赖只使用二级缓存可以吗？
lock: need
---

# Spring处理循环依赖只使用二级缓存可以吗？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200621193137922.jpg?)
## 什么是循环依赖？
先说一下什么是循环依赖，Spring在初始化A的时候需要注入B，而初始化B的时候需要注入A，在Spring启动后这2个Bean都要被初始化完成

Spring的循环依赖有4种场景
1. 构造器的循环依赖（singleton，prototype）
2. 属性的循环依赖（singleton，prototype）

**spring目前只支持singleton类型的属性循环依赖**

## 构造器的循环依赖

```java
@Component
public class ConstructorA {

	private ConstructorB constructorB;

	@Autowired
	public ConstructorA(ConstructorB constructorB) {
		this.constructorB = constructorB;
	}
}
```

```java
@Component
public class ConstructorB {

	private ConstructorA constructorA;

	@Autowired
	public ConstructorB(ConstructorA constructorA) {
		this.constructorA = constructorA;
	}
}
```

```java
@Configuration
@ComponentScan("com.javashitang.dependency.constructor")
public class ConstructorConfig {
}
```

```java
public class ConstructorMain {

	public static void main(String[] args) {
		AnnotationConfigApplicationContext context =
				new AnnotationConfigApplicationContext(ConstructorConfig.class);
		System.out.println(context.getBean(ConstructorA.class));
		System.out.println(context.getBean(ConstructorB.class));
	}
}
```
运行ConstructorMain的main方法的时候会在第一行就报异常，说明Spring没办法初始化所有的Bean，即上面这种形式的循环依赖Spring无法解决。

**构造器的循环依赖，可以在构造函数中使用@Lazy注解延迟加载。在注入依赖时，先注入代理对象，当首次使用时再创建对象完成注入**

```java
@Autowired
public ConstructorB(@Lazy ConstructorA constructorA) {
	this.constructorA = constructorA;
}
```
因为我们主要关注属性的循环依赖，构造器的循环依赖就不做过多分析了
## 属性的循环依赖
先演示一下什么是属性的循环依赖

```java
@Data
@Component
public class A {

    @Autowired
    private B b;
}
```

```java
@Data
@Component
public class B {

    @Autowired
    private A a;
}
```

```java
@Configuration
@EnableAspectJAutoProxy
@ComponentScan("com.javashitang.dependency")
public class Config {
}
```

```java
public class Main {

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(Config.class);
        System.out.println(context.getBean(A.class).getB() == context.getBean(B.class));
        System.out.println(context.getBean(B.class).getA() == context.getBean(A.class));
    }
}
```
Spring容器正常启动，运行结果为true，想实现类似的功能并不难，我写个demo演示一下

```java
public class DependencyDemoV1 {

    private static final Map<String, Object> singletonObjects =
            new HashMap<>(256);

    @SneakyThrows
    public static <T> T getBean(Class<T> beanClass) {
        String beanName = beanClass.getSimpleName();
        if (singletonObjects.containsKey(beanName)) {
            return (T) singletonObjects.get(beanName);
        }
        // 实例化bean
        Object object = beanClass.getDeclaredConstructor().newInstance();
        singletonObjects.put(beanName, object);
        // 开始初始化bean，即填充属性
        Field[] fields = object.getClass().getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            // 获取需要注入字段的class
            Class<?> fieldClass = field.getType();
            field.set(object, getBean(fieldClass));
        }
        return (T) object;
    }

    public static void main(String[] args) {
        // 假装扫描出来的类
        Class[] classes = {A.class, B.class};
        for (Class aClass : classes) {
            getBean(aClass);
        }
        System.out.println(getBean(A.class).getB() == getBean(B.class));
        System.out.println(getBean(B.class).getA() == getBean(A.class));
    }

}
```
**在开始后面的内容的时候，我们先明确2个概念**

实例化：调用构造函数将对象创建出来
初始化：调用构造函数将对象创建出来后，给对象的属性也被赋值

可以看到只用了一个map就实现了循环依赖的实现，但这种实现有个小缺陷，singletonObjects中的类有可能只是完成了实例化，并没有完成初始化

而在spring中singletonObjects中的类都完成了初始化，因为我们取单例Bean的时候都是从singletonObjects中取的，不可能让我们获取到没有初始化完成的对象。

所以我们来写第二个实现，**用singletonObjects存初始化完成的对象，而用earlySingletonObjects暂存实例化完成的对象，等对象初始化完毕再将对象放入singletonObjects，并从earlySingletonObjects删除**
```java
public class DependencyDemoV2 {

    private static final Map<String, Object> singletonObjects =
            new HashMap<>(256);

    private static final Map<String, Object> earlySingletonObjects =
            new HashMap<>(256);

    @SneakyThrows
    public static <T> T getBean(Class<T> beanClass) {
        String beanName = beanClass.getSimpleName();
        if (singletonObjects.containsKey(beanName)) {
            return (T) singletonObjects.get(beanName);
        }
        if (earlySingletonObjects.containsKey(beanName)) {
            return (T) earlySingletonObjects.get(beanName);
        }
        // 实例化bean
        Object object = beanClass.getDeclaredConstructor().newInstance();
        earlySingletonObjects.put(beanName, object);
        // 开始初始化bean，即填充属性
        Field[] fields = object.getClass().getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            // 获取需要注入字段的class
            Class<?> fieldClass = field.getType();
            field.set(object, getBean(fieldClass));
        }
        singletonObjects.put(beanName, object);
        earlySingletonObjects.remove(beanName);
        return (T) object;
    }

    public static void main(String[] args) {
        // 假装扫描出来的类
        Class[] classes = {A.class, B.class};
        for (Class aClass : classes) {
            getBean(aClass);
        }
        System.out.println(getBean(A.class).getB() == getBean(B.class));
        System.out.println(getBean(B.class).getA() == getBean(A.class));
    }

}
```

现在的实现和spring保持一致了，并且只用了2级缓存。spring为什么搞第三个缓存呢？
**第三个缓存主要和代理对象相关**

我还是把上面的例子改进一下，改成用3级缓存的实现

```java
public interface ObjectFactory<T> {
    T getObject();
}
```

```java
public class DependencyDemoV3 {

    private static final Map<String, Object> singletonObjects =
            new HashMap<>(256);

    private static final Map<String, Object> earlySingletonObjects =
            new HashMap<>(256);

    private static final Map<String, ObjectFactory<?>> singletonFactories =
            new HashMap<>(256);

    @SneakyThrows
    public static <T> T getBean(Class<T> beanClass) {
        String beanName = beanClass.getSimpleName();
        if (singletonObjects.containsKey(beanName)) {
            return (T) singletonObjects.get(beanName);
        }
        if (earlySingletonObjects.containsKey(beanName)) {
            return (T) earlySingletonObjects.get(beanName);
        }
        ObjectFactory<?> singletonFactory = singletonFactories.get(beanName);
        if (singletonFactory != null) {
            return (T) singletonFactory.getObject();
        }
        // 实例化bean
        Object object = beanClass.getDeclaredConstructor().newInstance();
        singletonFactories.put(beanName, () -> {
            Object proxy = createProxy(object);
            singletonFactories.remove(beanName);
            earlySingletonObjects.put(beanName, proxy);
            return proxy;
        });
        // 开始初始化bean，即填充属性
        Field[] fields = object.getClass().getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            // 获取需要注入字段的class
            Class<?> fieldClass = field.getType();
            field.set(object, getBean(fieldClass));
        }
        createProxy(object);
        singletonObjects.put(beanName, object);
        singletonFactories.remove(beanName);
        earlySingletonObjects.remove(beanName);
        return (T) object;
    }

    public static Object createProxy(Object object) {
        // 因为这个方法有可能被执行2次，所以这里应该有个判断
        // 如果之前提前进行过aop操作则直接返回，知道意思就行，不写了哈
        // 需要aop的话则返回代理对象，否则返回传入的对象
        return object;
    }

    public static void main(String[] args) {
        // 假装扫描出来的类
        Class[] classes = {A.class, B.class};
        for (Class aClass : classes) {
            getBean(aClass);
        }
        System.out.println(getBean(A.class).getB() == getBean(B.class));
        System.out.println(getBean(B.class).getA() == getBean(A.class));
    }

}
```
**为什么要包装一个ObjectFactory对象？**

如果创建的Bean有对应的aop代理，那其他对象注入时，注入的应该是对应的代理对象；**但是Spring无法提前知道这个对象是不是有循环依赖的情况**，而正常情况下（没有循环依赖情况），Spring都是在对象初始化后才创建对应的代理。这时候Spring有两个选择：

1. 不管有没有循环依赖，实例化后就直接创建好代理对象，并将代理对象放入缓存，出现循环依赖时，其他对象直接就可以取到代理对象并注入（只需要2级缓存，singletonObjects和earlySingletonObjects即可）
2. **不提前创建好代理对象，在出现循环依赖被其他对象注入时，才提前生成代理对象（此时只完成了实例化）。这样在没有循环依赖的情况下，Bean还是在初始化完成才生成代理对象**（需要3级缓存）

**所以到现在为止你知道3级缓存的作用了把，主要是为了正常情况下，代理对象能在初始化完成后生成，而不用提前生成**
| 缓存 | 说明 |
|--|--|
|singletonObjects  | 第一级缓存，存放初始化完成的Bean |
|earlySingletonObjects|第二级缓存，存放实例化完成的Bean，有可能被进行了代理|
|singletonFactories|延迟生成代理对象|

## 源码解析
获取Bean的时候先尝试从3级缓存中获取，和我们上面的Demo差不多哈

DefaultSingletonBeanRegistry#getSingleton
![在这里插入图片描述](https://img-blog.csdnimg.cn/7924dfdd6d5b4ed2a75e02afa186bab1.png?)
当从缓存中获取不到时，会进行创建
AbstractAutowireCapableBeanFactory#doCreateBean（删除了部分代码哈）
![在这里插入图片描述](https://img-blog.csdnimg.cn/93416b9665274ee998218aeae51ae28c.png?)
发生循环依赖时，会从工厂里获取代理对象哈

![在这里插入图片描述](https://img-blog.csdnimg.cn/75cbc3c3cf134a9f8abebabaae218f88.png?)
当开启aop代理时，SmartInstantiationAwareBeanPostProcessor的一个实现类有AbstractAutoProxyCreator

AbstractAutoProxyCreator#getEarlyBeanReference
![在这里插入图片描述](https://img-blog.csdnimg.cn/e591128ede814d3196d886e909d5eee4.png)
getEarlyBeanReference方法提前进行代理，为了防止后面再次进行代理，需要用earlyProxyReferences记录一下，这个Bean已经被代理过了，不用再代理了

AbstractAutoProxyCreator#postProcessAfterInitialization
![在这里插入图片描述](https://img-blog.csdnimg.cn/4f26ed9a308f4e04a1cbdd8f99b00a89.png)

这个方法是进行aop代理的地方，因为有可能提前代理了，所以先根据earlyProxyReferences判断一下，是否提前代理了，提前代理过就不用代理了

当bean初始化完毕，会放入一级缓存，并从二三级缓存删除

DefaultSingletonBeanRegistry#addSingleton
![在这里插入图片描述](https://img-blog.csdnimg.cn/d871349721aa4a959e67c3a403a27399.png)

发生循环依赖时，整体的执行流程如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/0fd882ca9fcc4c14941065dafe0e0d34.png?)