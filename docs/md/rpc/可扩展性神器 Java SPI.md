---
layout: post
title: 可扩展性神器 Java SPI
lock: need
---

# 手写RPC框架：可扩展性神器 Java SPI

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210531172401483.jpg?)
## SPI设计
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210531173931369.png?)

**Java SPI的作用非常简单，就是根据配置文件决定接口的实现类，典型的策略模式**

我先演示一下Java SPI的使用demo，项目结构如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210531171640141.png)

```java
public interface Car {

    void getBrand();
}
```

```java
public class BenzCar implements Car {

    public BenzCar() {
        System.out.println("BenzCar");
    }

    @Override
    public void getBrand() {
        System.out.println("benz");
    }
}
```

```java
public class BMWCar implements Car {

    public BMWCar() {
        System.out.println("BMWCar");
    }
    
    @Override
    public void getBrand() {
        System.out.println("bmw");
    }
}
```
在resource目录下建立如下文件
resources/META-INF/services/com.javashitang.car.Car
```java
com.javashitang.car.BenzCar
com.javashitang.car.BMWCar
```
内容为指定的接口实现类，开始测试
```java
public class CarSpiDemo {

    public static void main(String[] args) {
        ServiceLoader<Car> carServiceLoader = ServiceLoader.load(Car.class);
        System.out.println("---");
		// ---
		// BenzCar
		// benz
		// BMWCar
		// bmw
        carServiceLoader.forEach(Car::getBrand);
    }
}
```
因为我们在配置文件中配置了2个实现，所以最终加载出来2个实现类，配置一个实现时，最终只会加载出来一个实现类

当使用Java spi时，我们需要遵循如下约定：
1. 当提供一个接口的具体实现时，需要在META-INF/services目录下创建一个以接口全类名为名字的文件，文件内容为具体实现类的全类名
2. 通过ServiceLoder扫描META-INF/services目录下以目标接口为名字的文件，找到目标实现类，调用无参构造函数实力化对应的实现类，并返回

至于文件目录已经文件名字为啥必须的这种格式，你看一下源码就清楚了，ServiceLoder中固定写死了加载路径。

## SPI应用

SPI这种思想在很多框架中都有应用。我来举个例子我们在项目中如何应用Java SPI。

假如我们现在写了一个RPC框架，定义了注册中心接口Registry，我们项目中只提供了一种默认实现ZookeeperRegistry，并在META-INF/services/com.javashitang.Registry文件中指定了实现类com.javashitang.ZookeeperRegistry，这样当项目启动时候就会使用ZookeeperRegistry

当别人使用我们这个RPC框架时，觉得用Zookeeper做注册中心不好，要用Redis做注册中心，于是自己写了一个RedisRegistry实现了Registry接口，此时在项目所在的META-INF/services/com.javashitang.Registry文件中指定了实现类RedisRegistry

**此时用ServiceLoader加载Registry实现时，就会加载到2个实现类，应该用哪个呢？**

**我们的想法是，当用户指定自己的实现类时，就用用户指定的，否则就用框架默认的**。所以用ServiceLoader加载对应的实现类时，永远用第一个就可以。

因为实现类的加载是有顺序时，先加载用户jar包指定的，再加载框架jar包中指定的。

用户指定实现类，会加载到2个实现类（用户指定的和框架默认的），第一个为用户指定的
用户不指定实现类，只会加载到一个实现类（框架默认的）

通过这种方式就提高了程序的可扩展性，用户可以随意替换组件的实现
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210531220926943.png?)

## 参考博客
[1]https://zhuanlan.zhihu.com/p/67665359