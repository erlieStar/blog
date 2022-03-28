---
layout: post
title: Spring如何解决循环依赖？
lock: need
---

# 面试官：Spring如何解决循环依赖？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200621193137922.jpg?)
## 介绍
先说一下什么是循环依赖，Spring在初始化A的时候需要注入B，而初始化B的时候需要注入A，在Spring启动后这2个Bean都要被初始化完成

Spring的循环依赖有两种场景
1. 构造器的循环依赖
2. 属性的循环依赖

构造器的循环依赖，可以在构造函数中使用@Lazy注解延迟加载。在注入依赖时，先注入代理对象，当首次使用时再创建对象完成注入

属性的循环依赖主要是通过3个map来解决的

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

我们可以在ConstructorA或者ConstructorB构造函数的参数上加上@Lazy注解就可以解决

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
@Component
public class FieldA {

	@Autowired
	private FieldB fieldB;
}
```

```bash
@Component
public class FieldB {

	@Autowired
	private FieldA fieldA;
}
```

```java
@Configuration
@ComponentScan("com.javashitang.dependency.field")
public class FieldConfig {
}
```

```java
public class FieldMain {

	public static void main(String[] args) {
		AnnotationConfigApplicationContext context =
				new AnnotationConfigApplicationContext(FieldConfig.class);
		// com.javashitang.dependency.field.FieldA@3aa9e816
		System.out.println(context.getBean(FieldA.class));
		// com.javashitang.dependency.field.FieldB@17d99928
		System.out.println(context.getBean(FieldB.class));
	}
}
```
Spring容器正常启动，能获取到FieldA和FieldB这2个Bean

属性的循环依赖在面试中还是经常被问到的。总体来说也不复杂，但是涉及到Spring Bean的初始化过程，所以感觉比较复杂，我写个demo演示一下整个过程

Spring的Bean的初始化过程其实比较复杂，为了方便理解Demo，我就把Spring Bean的初始化过程分为2部分

1. bean的实例化过程，即调用构造函数将对象创建出来
2. bean的初始化过程，即填充bean的各种属性

bean初始化过程完毕，则bean就能被正常创建出来了

下面开始写Demo，ObjectFactory接口用来生产Bean，和Spring中定义的接口一样
```java
public interface ObjectFactory<T> {
	T getObject();
}
```

```java
public class DependencyDemo {

	// 初始化完毕的Bean
	private final Map<String, Object> singletonObjects =
			new ConcurrentHashMap<>(256);

	// 正在初始化的Bean对应的工厂，此时对象已经被实例化
	private final Map<String, ObjectFactory<?>> singletonFactories =
			new HashMap<>(16);

	// 存放正在初始化的Bean，对象还没有被实例化之前就放进来了
	private final Set<String> singletonsCurrentlyInCreation =
			Collections.newSetFromMap(new ConcurrentHashMap<>(16));

	public  <T> T getBean(Class<T> beanClass) throws Exception {
		// 类名为Bean的名字
		String beanName = beanClass.getSimpleName();
		// 已经初始化好了，或者正在初始化
		Object initObj = getSingleton(beanName, true);
		if (initObj != null) {
			return (T) initObj;
		}
		// bean正在被初始化
		singletonsCurrentlyInCreation.add(beanName);
		// 实例化bean
		Object object = beanClass.getDeclaredConstructor().newInstance();
		singletonFactories.put(beanName, () -> {
			return object;
		});
		// 开始初始化bean，即填充属性
		Field[] fields = object.getClass().getDeclaredFields();
		for (Field field : fields) {
			field.setAccessible(true);
			// 获取需要注入字段的class
			Class<?> fieldClass = field.getType();
			field.set(object, getBean(fieldClass));
		}
		// 初始化完毕
		singletonObjects.put(beanName, object);
		singletonsCurrentlyInCreation.remove(beanName);
		return (T) object;
	}

	/**
	 * allowEarlyReference参数的含义是Spring是否允许循环依赖，默认为true
	 * 所以当allowEarlyReference设置为false的时候，当项目存在循环依赖，会启动失败
	 */
	public Object getSingleton(String beanName, boolean allowEarlyReference) {
		Object singletonObject = this.singletonObjects.get(beanName);
		if (singletonObject == null 
				&& isSingletonCurrentlyInCreation(beanName)) {
			synchronized (this.singletonObjects) {
				if (singletonObject == null && allowEarlyReference) {
					ObjectFactory<?> singletonFactory =
							this.singletonFactories.get(beanName);
					if (singletonFactory != null) {
						singletonObject = singletonFactory.getObject();
					}
				}
			}
		}
		return singletonObject;
	}

	/**
	 * 判断bean是否正在被初始化
	 */
	public boolean isSingletonCurrentlyInCreation(String beanName) {
		return this.singletonsCurrentlyInCreation.contains(beanName);
	}

}
```
测试一波
```java
public static void main(String[] args) throws Exception {
	DependencyDemo dependencyDemo = new DependencyDemo();
	// 假装扫描出来的对象
	Class[] classes = {A.class, B.class};
	// 假装项目初始化所有bean
	for (Class aClass : classes) {
		dependencyDemo.getBean(aClass);
	}
	// true
	System.out.println(
			dependencyDemo.getBean(B.class).getA() == dependencyDemo.getBean(A.class));
	// true
	System.out.println(
			dependencyDemo.getBean(A.class).getB() == dependencyDemo.getBean(B.class));
}
```
是不是很简单？我们只用了2个map就搞定了Spring的循环依赖

**2个Map就能搞定循环依赖，那为什么Spring要用3个Map呢？**

原因其实也很简单，当我们从singletonFactories中根据BeanName获取相应的ObjectFactory，然后调用getObject()这个方法返回对应的Bean。在我们的例子中
ObjectFactory的实现很简单哈，就是将实例化好的对象直接返回，但是在Spring中就没有这么简单了，执行过程比较复杂，为了避免每次拿到ObjectFactory然后调用getObject()，我们直接把ObjectFactory创建的对象缓存起来不就行了，这样就能提高效率了

比如A依赖B和C，B和C又依赖A，如果不做缓存那么初始化B和C都会调用A对应的ObjectFactory的getObject()方法。如果做缓存只需要B或者C调用一次即可。

知道了思路，我们把上面的代码改一波，加个缓存。

```java
public class DependencyDemo {

	// 初始化完毕的Bean
	private final Map<String, Object> singletonObjects =
			new ConcurrentHashMap<>(256);

	// 正在初始化的Bean对应的工厂，此时对象已经被实例化
	private final Map<String, ObjectFactory<?>> singletonFactories =
			new HashMap<>(16);

	// 缓存Bean对应的工厂生产好的Bean
	private final Map<String, Object> earlySingletonObjects =
			new HashMap<>(16);

	// 存放正在初始化的Bean，对象还没有被实例化之前就放进来了
	private final Set<String> singletonsCurrentlyInCreation =
			Collections.newSetFromMap(new ConcurrentHashMap<>(16));

	public  <T> T getBean(Class<T> beanClass) throws Exception {
		// 类名为Bean的名字
		String beanName = beanClass.getSimpleName();
		// 已经初始化好了，或者正在初始化
		Object initObj = getSingleton(beanName, true);
		if (initObj != null) {
			return (T) initObj;
		}
		// bean正在被初始化
		singletonsCurrentlyInCreation.add(beanName);
		// 实例化bean
		Object object = beanClass.getDeclaredConstructor().newInstance();
		singletonFactories.put(beanName, () -> {
			return object;
		});
		// 开始初始化bean，即填充属性
		Field[] fields = object.getClass().getDeclaredFields();
		for (Field field : fields) {
			field.setAccessible(true);
			// 获取需要注入字段的class
			Class<?> fieldClass = field.getType();
			field.set(object, getBean(fieldClass));
		}
		singletonObjects.put(beanName, object);
		singletonsCurrentlyInCreation.remove(beanName);
		earlySingletonObjects.remove(beanName);
		return (T) object;
	}

	/**
	 * allowEarlyReference参数的含义是Spring是否允许循环依赖，默认为true
	 */
	public Object getSingleton(String beanName, boolean allowEarlyReference) {
		Object singletonObject = this.singletonObjects.get(beanName);
		if (singletonObject == null
				&& isSingletonCurrentlyInCreation(beanName)) {
			synchronized (this.singletonObjects) {
				singletonObject = this.earlySingletonObjects.get(beanName);
				if (singletonObject == null && allowEarlyReference) {
					ObjectFactory<?> singletonFactory =
							this.singletonFactories.get(beanName);
					if (singletonFactory != null) {
						singletonObject = singletonFactory.getObject();
						this.earlySingletonObjects.put(beanName, singletonObject);
						this.singletonFactories.remove(beanName);
					}
				}
			}
		}
		return singletonObject;
	}
}
```
我们写的getSingleton的实现和org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String, boolean)的实现一模一样，这个方法几乎所有分析Spring循环依赖的文章都会提到，这次你明白工作原理是什么了把

## 总结一波

1. 拿bean的时候先从singletonObjects（一级缓存）中获取
2. 如果获取不到，并且对象正在创建中，就从earlySingletonObjects（二级缓存）中获取
3. 如果还是获取不到就从singletonFactories（三级缓存）中获取，然后将获取到的对象放到earlySingletonObjects（二级缓存）中，并且将bean对应的singletonFactories（三级缓存）清除
4. bean初始化完毕，放到singletonObjects（一级缓存）中，将bean对应的earlySingletonObjects（二级缓存）清除