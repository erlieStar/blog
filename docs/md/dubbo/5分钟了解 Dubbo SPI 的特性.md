---
layout: post
title: 5分钟了解 Dubbo SPI 的特性
lock: need
---

# Dubbo源码解析：5分钟了解 Dubbo SPI 的特性
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200808182717643.png?)
## 介绍
Dubbo的架构是基于分层来设计的，每层执行固定的功能，上层依赖下层，下层的改变对上层不可见，每层都是可以被替换的组件
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200805213437530.png?)
Service和Config为API接口层，让Dubbo使用者方便的发布和引用服务
其他各层均为SPI层，意味着每层都是组件化的，可以被替换

例如，注册中心可以用Redis，Zookeeper。传输协议可以用dubbo，rmi，hessian等。
网络通信可以用mina，netty。序列化可以用fastjson，hessian2，java原生的方式等

> SPI 全称为 Service Provider Interface，是一种服务发现机制。SPI 的本质是将接口实现类的全限定名配置在文件中，并由服务加载器读取配置文件，加载实现类。这样可以在运行时，动态为接口替换实现类。正因此特性，我们可以很容易的通过 SPI 机制为我们的程序提供拓展功能

那么Dubbo的SPI是怎么实现的呢？先来了解一下Java SPI
## Java SPI
Java SPI是通过策略模式实现的，一个接口提供多个实现类，而使用哪个实现类不在程序中确定，而是配置文件配置的，具体步骤如下

1. 定义接口及其对应的实现类
2. 在META-INF/services目录下创建以接口全路径命名的文件
3. 文件内容为实现类的全路径名
4. 在代码中通过java.util.ServiceLoader#load加载具体的实现类

写个Demo演示一下
![在这里插入图片描述](https://img-blog.csdnimg.cn/202007261047254.png?)
```java
public interface Car {

    void getBrand();
}
```

```java
public class BenzCar implements Car {

    @Override
    public void getBrand() {
        System.out.println("benz");
    }
}
```

```java
public class BMWCar implements Car {

    @Override
    public void getBrand() {
        System.out.println("bmw");
    }
}
```
org.apache.dubbo.Car的内容如下

```txt
org.apache.dubbo.BenzCar
org.apache.dubbo.BMWCar
```

测试类
```java
public class JavaSpiDemo {

    public static void main(String[] args) {
        ServiceLoader<Car> carServiceLoader = ServiceLoader.load(Car.class);
        // benz
        // bmw
        carServiceLoader.forEach(Car::getBrand);
    }
}
```

## Dubbo SPI
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200729232543292.PNG?)

用Dubbo SPI将上面的例子改造一下


```java
@SPI
public interface Car {

    void getBrand();
}
```

```java
public class BenzCar implements Car {

    @Override
    public void getBrand() {
        System.out.println("benz");
    }
}
```

```java
public class BMWCar implements Car {
    @Override
    public void getBrand() {
        System.out.println("bmw");
    }
}
```
org.apache.dubbo.quickstart.Car的内容如下

```java
benz=org.apache.dubbo.quickstart.BenzCar
bmw=org.apache.dubbo.quickstart.BMWCar
```

测试类

```java
public class DubboSpiDemo {

    public static void main(String[] args) {
        ExtensionLoader<Car> extensionLoader = ExtensionLoader.getExtensionLoader(Car.class);
        Car car = extensionLoader.getExtension("benz");
        car.getBrand();
    }
}
```

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface SPI {

    String value() default "";

}
```

@SPI标记接口是一个Dubbo SPI接口，即是一个扩展点，value属性可以指定默认实现

Dubbo 并未使用 Java 原生的 SPI 机制，而是对其进行了增强，使其能够更好的满足需求。Dubbo SPI的优点如下

1. JDK标准的SPI会一次性实例化扩展点的所有实现。而Dubbo SPI能实现按需加载
2. Dubbo SPI增加了对扩展点Ioc和Aop的支持

Dubbo SPI的实现步骤如下

1. 定义接口及其对应的实现类，接口上加@SPI注解，表明这是一个扩展类
2. 在META-INF/services目录下创建以接口全路径命名的文件
3. 文件内容为实现类的全路径名
4. 在代码中通过ExtensionLoader加载具体的实现类
### Dubbo SPI 扩展点的特性
#### 自动包装

**扩展类的构造函数是一个扩展点，则认为这个类是一个Wrapper类，即AOP**

用例子演示一下

```java
@SPI
public interface Car {

    void getBrand();
}
```

```java
public class BenzCar implements Car {
    @Override
    public void getBrand() {
        System.out.println("benz");
    }
}
```

```java
public class CarWrapper implements Car {

    private Car car;

    public CarWrapper(Car car) {
        this.car = car;
    }

    @Override
    public void getBrand() {
        System.out.println("start");
        car.getBrand();
        System.out.println("end");
    }
}
```

org.apache.dubbo.aop.Car内容如下（resources\META-INF\services目录下）

```text
benz=org.apache.dubbo.aop.BenzCar
org.apache.dubbo.aop.CarWrapper
```

测试类

```java
public class DubboSpiAopDemo {

    public static void main(String[] args) {
        ExtensionLoader<Car> extensionLoader = ExtensionLoader.getExtensionLoader(Car.class);
        Car car = extensionLoader.getExtension("benz");
        // start
        // benz
        // end
        car.getBrand();
    }
}
```
BenzCar是一个扩展类，CarWrapper是一个包装类，当获取BenzCar的时候实际获取的是被CarWrapper包装后的对象，类似代理模式
#### 自动加载
如果一个扩展类是另一个扩展类的成员变量，并且拥有set方法，框架会自动注入这个扩展点的实例，即IOC。先定义2个扩展点

org.apache.dubbo.ioc.Car（resources\META-INF\services目录下）

```text
benz=org.apache.dubbo.ioc.BenzCar
```
org.apache.dubbo.ioc.Wheel（resources\META-INF\services目录下）

```text
benz=org.apache.dubbo.ioc.BenzWheel
```

```java
@SPI
public interface Wheel {

    void getBrandByUrl();
}
```

```java
public class BenzWheel implements Wheel {

    @Override
    public void getBrandByUrl() {
        System.out.println("benzWheel");
    }
}
```

```java
@SPI
public interface Car {

    void getBrandByUrl();
}
```

```java
public class BenzCar implements Car {

    private Wheel wheel;

    public void setWheel(Wheel wheel) {
        this.wheel = wheel;
    }

    @Override
    public void getBrandByUrl() {
        System.out.println("benzCar");
        wheel.getBrandByUrl();
    }
}
```
测试demo

```java
public class DubboSpiIocDemo {

    public static void main(String[] args) {
        ExtensionLoader<Car> extensionLoader = ExtensionLoader.getExtensionLoader(Car.class);
        Car car = extensionLoader.getExtension("benz");
        car.getBrandByUrl();
    }
}
```
我跑这个代码的时候直接报异常，看了一下官网才发现dubbo是可以注入接口的实现的，但不像spring那么智能，
dubbo必须用URL（类似总线）来指定扩展类对应的实现类.。这就不得不提到@Adaptive注解了
#### 自适应
**使用@Adaptive注解，动态的通过URL中的参数来确定要使用哪个具体的实现类**

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface Adaptive {

    String[] value() default {};

}
```

```java
@SPI
public interface Wheel {

    @Adaptive("wheel")
    void getBrandByUrl(URL url);
}
```

```java
public class BenzWheel implements Wheel {

    @Override
    public void getBrandByUrl(URL url) {
        System.out.println("benzWheel");
    }
}
```

```java
@SPI
public interface Car {

    void getBrandByUrl(URL url);
}
```

```java
public class BenzCar implements Car {

    // 这个里面存的是代理对象
    private Wheel wheel;

    public void setWheel(Wheel wheel) {
        this.wheel = wheel;
    }

    @Override
    public void getBrandByUrl(URL url) {
        System.out.println("benzCar");
        // 代理类根据URL找到实现类，然后再调用实现类
        wheel.getBrandByUrl(url);
    }
}
```

```java
public class DubboSpiIocDemo {

    public static void main(String[] args) {
        ExtensionLoader<Car> extensionLoader = ExtensionLoader.getExtensionLoader(Car.class);
        Car car = extensionLoader.getExtension("benz");
        Map<String, String> map = new HashMap<>();
        // 指定wheel的实现类为benz
        map.put("wheel", "benz");
        URL url = new URL("", "", 1, map);
        // benzCar
        // benzWheel
        car.getBrandByUrl(url);
    }
}
```
可以看到BenzCar对象成功注入了BenzWheel。BenzCar中其实注入的是BenzWheel的代码对象，这个代理对象会根据@Adaptive("wheel")获取到wheel，然后从url中找到key为wheel的值，这个值即为实现类对应的key。

**上面的注释提到BenzCar里面注入的Wheel其实是一个代理对象（框架帮我们生成），在代理对象中根据url找到相应的实现类，然后调用实现类。**

因为代理对象是框架在运行过程中帮我们生成的，没有文件可以查看，所以用Arthas来查看一下生成的代理类

```shell
curl -O https://alibaba.github.io/arthas/arthas-boot.jar
java -jar arthas-boot.jar
# 根据前面的序号选择进入的进程，然后执行下面的命令
jad org.apache.dubbo.adaptive.Wheel$Adaptive
```
生成的Wheel$Adaptive类如下所示

```java
package org.apache.dubbo.adaptive;

import org.apache.dubbo.adaptive.Wheel;
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.extension.ExtensionLoader;

public class Wheel$Adaptive
implements Wheel {
    public void getBrandByUrl(URL uRL) {
        if (uRL == null) {
            throw new IllegalArgumentException("url == null");
        }
        URL uRL2 = uRL;
        String string = uRL2.getParameter("wheel");
        if (string == null) {
            throw new IllegalStateException(new StringBuffer().append("Failed to get extension (org.apache.dubbo.adaptive.Wheel) name from url (").append(uRL2.toString()).append(") use keys([wheel])").toString());
        }
        Wheel wheel = (Wheel)ExtensionLoader.getExtensionLoader(Wheel.class).getExtension(string);
        wheel.getBrandByUrl(uRL);
    }
}
```
**@Adaptive可以标记在类上或者方法上**

标记在类上：将该实现类直接作为默认实现，不再自动生成代码
标记在方法上：通过参数动态获得实现类，比如上面的例子

用源码演示一下用在类上的@Adaptive，Dubbo为自适应扩展点生成代码，如我们上面的Wheel$Adaptive，但生成的代码还需要编译才能生成class文件。**我们可以用JavassistCompiler（默认的）或者JdkCompiler来编译（需要配置）**，这个小小的功能就用到了@Adaptive

如果想用JdkCompiler需要做如下配置

```xml
<dubbo:application compiler="jdk" />
```
Compiler类图如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200808174219100.png?)


```java
@SPI("javassist")
public interface Compiler {

    Class<?> compile(String code, ClassLoader classLoader);

}
```
Compiler用@SPI指定了默认实现类为javassist


源码中获取Compiler调用了如下方法
```java
org.apache.dubbo.common.compiler.Compiler compiler = ExtensionLoader.getExtensionLoader(org.apache.dubbo.common.compiler.Compiler.class).getAdaptiveExtension();
```
getAdaptiveExtension()会获取自适应扩展类，那么这个自适应扩展类是谁呢？

是AdaptiveCompiler，因为类上有@Adaptive注解
```java
@Adaptive
public class AdaptiveCompiler implements Compiler {

    private static volatile String DEFAULT_COMPILER;

    public static void setDefaultCompiler(String compiler) {
        DEFAULT_COMPILER = compiler;
    }

    /**
     * 获取对应的Compiler，并调用compile做编译
     * 用户设置了compiler，就用设置了的，不然就用默认的
     */
    @Override
    public Class<?> compile(String code, ClassLoader classLoader) {
        Compiler compiler;
        ExtensionLoader<Compiler> loader = ExtensionLoader.getExtensionLoader(Compiler.class);
        String name = DEFAULT_COMPILER; // copy reference
        if (name != null && name.length() > 0) {
            // 用用户设置的
            compiler = loader.getExtension(name);
        } else {
        	// 用默认的
            compiler = loader.getDefaultExtension();
        }
        return compiler.compile(code, classLoader);
    }

}
```
从compile方法可以看到，如果用户设置了编译方式，则用用户设置的，如果没有设置则用默认的，即JavassistCompiler
#### 自动激活
**使用@Activate注解，可以标记对应的扩展点默认被激活使用**

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface Activate {

    // 所属组，例如消费端，服务端
    String[] group() default {};

    // URL中包含属性名为value的键值对，过滤器才处于激活状态
    String[] value() default {};

    // 指定执行顺序，before指定的过滤器在该过滤器之前执行
    @Deprecated
    String[] before() default {};

    // 指定执行顺序，after指定的过滤器在该过滤器之后执行
    @Deprecated
    String[] after() default {};

    // 指定执行顺序，值越小，越先执行
    int order() default 0;
}
```

**可以通过指定group或者value，在不同条件下获取自动激活的扩展点**。before，after，order是用来排序的，感觉一个order参数就可以搞定排序的功能，所以官方把before，after标记为@Deprecated

Dubbo Filter就是基于这个来实现的。Dubbo Filter是Dubbo可扩展性的一个体现，可以在调用过程中对请求进行进行增强

我写个demo演示一下这个自动激活是怎么工作的

```java
@SPI
public interface MyFilter { 
    void filter();
}
```
consumer组能激活这个filter
```java
@Activate(group = {"consumer"})
public class MyConsumerFilter implements MyFilter {
    @Override
    public void filter() {

    }
}
```
provider组能激活这个filter
```java
@Activate(group = {"provider"})
public class MyProviderFilter implements MyFilter {
    @Override
    public void filter() {
        
    }
}
```
consumer组和provide组都能激活这个filter
```java
@Activate(group = {"consumer", "provider"})
public class MyLogFilter implements MyFilter {
    @Override
    public void filter() {

    }
}
```
consumer组和provide组都能激活这个filter，同时url中指定key的value为cache
```java
@Activate(group = {"consumer", "provider"}, value = "cache")
public class MyCacheFilter implements MyFilter {
    @Override
    public void filter() {

    }
}
```

测试类如下
getActivateExtension有3个参数，依次为url, key, group

```java
public class ActivateDemo {

    public static void main(String[] args) {
        ExtensionLoader<MyFilter> extensionLoader = ExtensionLoader.getExtensionLoader(MyFilter.class);
        // url中没有参数
        URL url = URL.valueOf("test://localhost");
        List<MyFilter> allFilterList = extensionLoader.getActivateExtension(url, "", null);
        /**
         * org.apache.dubbo.activate.MyConsumerFilter@53e25b76
         * org.apache.dubbo.activate.MyProviderFilter@73a8dfcc
         * org.apache.dubbo.activate.MyLogFilter@ea30797
         *
         * 不指定组则所有的Filter都被激活
         */
        allFilterList.forEach(item -> System.out.println(item));
        System.out.println();

        List<MyFilter> consumerFilterList = extensionLoader.getActivateExtension(url, "", "consumer");
        /**
         * org.apache.dubbo.activate.MyConsumerFilter@53e25b76
         * org.apache.dubbo.activate.MyLogFilter@ea30797
         *
         * 指定consumer组，则只有consumer组的Filter被激活
         */
        consumerFilterList.forEach(item -> System.out.println(item));
        System.out.println();

        // url中有key为cache的参数
        url = URL.valueOf("test://localhost?cache=xxx&test=a");
        List<MyFilter> customerFilter = extensionLoader.getActivateExtension(url, "", "consumer");
        /**
         * org.apache.dubbo.activate.MyConsumerFilter@53e25b76
         * org.apache.dubbo.activate.MyLogFilter@ea30797
         * org.apache.dubbo.activate.MyCacheFilter@aec6354
         *
         * 指定key在consumer组的基础上，MyCacheFilter被激活
         */
        customerFilter.forEach(item -> System.out.println(item));
        System.out.println();
    }
}
```

总结一下就是，getActivateExtension不指定组就是激活所有的Filter，指定组则激活指定组的Filter。指定value值时，则当url中有key为value值时，这个Filter才会生效

**即group通过传入的组来过滤，value通过判断url是否有指定的key来过滤**。后面分析源码的时候你会更清楚

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210617145549653.jpg?)
