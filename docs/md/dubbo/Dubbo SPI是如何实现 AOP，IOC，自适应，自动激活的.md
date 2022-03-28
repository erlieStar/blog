---
layout: post
title: Dubbo SPI是如何实现 AOP，IOC，自适应，自动激活的？
lock: need
---

# Dubbo源码解析：Dubbo SPI是如何实现 AOP，IOC，自适应，自动激活的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210613164821694.jpg?)
## ExtensionLoader的工作原理
Dubbo在启动的时候默认会扫描这三个目录下的配置，以加载需要的扩展类

/META-INF/services
/META-INF/dubbo
/META-INF/dubbo/internal

ExtensionLoader是Dubbo SPI中用来加载扩展类的，有如下三个重要方法，搞懂这3个方法基本上就搞懂Dubbo SPI了。

加载扩展类的三种方法如下

1. getExtension()，获取普通扩展类
2. getAdaptiveExtension()，获取自适应扩展类
3. getActivateExtension()，获取自动激活的扩展类

我们以源码中的例子分析Dubbo SPI的实现。
## getExtension（实现自动装载，自动包装，即IOC和AOP）
### 使用例子
获取Exchanger层的实现，通过名字直接获取实现，并没有根据url中的参数获取实现
```java
public class Exchangers {

    public static Exchanger getExchanger(String type) {
        return ExtensionLoader.getExtensionLoader(Exchanger.class).getExtension(type);
    }

}
```

```java
class ExchangersTest {

    @Test
    void getExchanger() {
        Exchanger header = Exchangers.getExchanger("header");
        // org.apache.dubbo.remoting.exchange.support.header.HeaderExchanger@1d8d30f7
        System.out.println(header);
    }
}
```
### 实现

```java
// ExtensionLoader
public T getExtension(String name) {
    if (StringUtils.isEmpty(name)) {
        throw new IllegalArgumentException("Extension name == null");
    }
    if ("true".equals(name)) {
        // 传入的name为true，获取默认的扩展实现类
        return getDefaultExtension();
    }
    Holder<Object> holder = getOrCreateHolder(name);
    Object instance = holder.get();
    if (instance == null) {
        synchronized (holder) {
            instance = holder.get();
            if (instance == null) {
                // 创建扩展实例，就是通过name创建对应的对象
                instance = createExtension(name);
                holder.set(instance);
            }
        }
    }
    return (T) instance;
}
```

```java
// ExtensionLoader
private T createExtension(String name) {
    // 从配置文件中加载所有的扩展类
    // 初始化 cachedWrapperClasses（包装类集合）
    // clazz为name对应的实现类
    Class<?> clazz = getExtensionClasses().get(name);
    if (clazz == null) {
        throw findException(name);
    }
    try {
        T instance = (T) EXTENSION_INSTANCES.get(clazz);
        if (instance == null) {
            // putIfAbsent方法
            // 如果key值不存在，则向map中添加
            // 如果key值已存在，不会覆盖已有的值，直接返回已经存在的值
            EXTENSION_INSTANCES.putIfAbsent(clazz, clazz.newInstance());
            instance = (T) EXTENSION_INSTANCES.get(clazz);
        }
        // 执行IOC
        injectExtension(instance);
        // 执行AOP
        Set<Class<?>> wrapperClasses = cachedWrapperClasses;
        if (CollectionUtils.isNotEmpty(wrapperClasses)) {
            for (Class<?> wrapperClass : wrapperClasses) {
                // 找到参数类型为type的构造函数，循环包装
                instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
            }
        }
        return instance;
    } catch (Throwable t) {
        throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
                type + ") couldn't be instantiated: " + t.getMessage(), t);
    }
}
```

## getAdaptiveExtension（实现自适应）
标记在类上：将该实现类直接作为默认实现，不再自动生成代码
标记在方法上：生成接口对应的Adaptive类，通过url中的参数来确定最终的实现类
### 用在类上

```java
public class ExtensionLoader<T> {

    private ExtensionLoader(Class<?> type) {
        this.type = type;
        objectFactory = (type == ExtensionFactory.class ? null : ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension());
    }

}
```

```java
public class ExtensionLoaderTest {

    @Test
    public void spiTest() {
        ExtensionFactory extensionFactory = ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension();
        //org.apache.dubbo.common.extension.factory.AdaptiveExtensionFactory@4abdb505
        System.out.println(extensionFactory);
    }

}
```

### 用在方法上
获取网络连接框架的具体实现

```java
public class Transporters {

    public static Transporter getTransporter() {
        return ExtensionLoader.getExtensionLoader(Transporter.class).getAdaptiveExtension();
    }

}
```

```java
class TransportersTest {

    @Test
    void getTransporter() throws IOException {
        Transporter transporter = Transporters.getTransporter();
        // org.apache.dubbo.remoting.Transporter$Adaptive@49070868
        System.out.println(transporter);
    }
}
```

```java
@SPI("netty")
public interface Transporter {

    /**
     * 启动一个服务
     * 当外部调用Transporter#bind方法时，会从URL中提取key为server的value，然后找对应的实现类，没找到再提取key为transporter的value
     * 然后找实现类，如果还没找到，则报异常
     * @Adaptive 可以进行多个实现类的依次匹配，如果都找不到则抛出异常
     */
    @Adaptive({Constants.SERVER_KEY, Constants.TRANSPORTER_KEY})
    Server bind(URL url, ChannelHandler handler) throws RemotingException;

    /**
     * 连接到一个服务
     */
    @Adaptive({Constants.CLIENT_KEY, Constants.TRANSPORTER_KEY})
    Client connect(URL url, ChannelHandler handler) throws RemotingException;

}
```

```java
public class Transporter$Adaptive
implements Transporter {
    public Server bind(URL uRL, ChannelHandler channelHandler) throws RemotingException {
        if (uRL == null) {
            throw new IllegalArgumentException("url == null");
        }
        URL uRL2 = uRL;
        String string = uRL2.getParameter("server", uRL2.getParameter("transporter", "netty"));
        if (string == null) {
            throw new IllegalStateException(new StringBuffer().append("Failed to get extension (org.apache.dubbo.remoting.Transporter) name from url (").append(uRL2.toString()).append(") use keys([server, transporter])").toString());
        }
        Transporter transporter = (Transporter)ExtensionLoader.getExtensionLoader(Transporter.class).getExtension(string);
        return transporter.bind(uRL, channelHandler);
    }

    public Client connect(URL uRL, ChannelHandler channelHandler) throws RemotingException {
        if (uRL == null) {
            throw new IllegalArgumentException("url == null");
        }
        URL uRL2 = uRL;
        String string = uRL2.getParameter("client", uRL2.getParameter("transporter", "netty"));
        if (string == null) {
            throw new IllegalStateException(new StringBuffer().append("Failed to get extension (org.apache.dubbo.remoting.Transporter) name from url (").append(uRL2.toString()).append(") use keys([client, transporter])").toString());
        }
        Transporter transporter = (Transporter)ExtensionLoader.getExtensionLoader(Transporter.class).getExtension(string);
        return transporter.connect(uRL, channelHandler);
    }
}
```
**根据@Adaptive中指定的多个key，依次匹配具体的实现，当没有指定实现类时，抛出异常**

## 实现

```java
// ExtensionLoader
private T createAdaptiveExtension() {
    try {
        // 1. 获取代理对象的一个实例
        // 2. 执行ioc
        return injectExtension((T) getAdaptiveExtensionClass().newInstance());
    } catch (Exception e) {
        throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
    }
}
```

```java
private Class<?> getAdaptiveExtensionClass() {
    // 从配置文件中加载扩展类
    // 如果类上有@Adaptive注册，则赋值给cachedAdaptiveClass
    getExtensionClasses();
    // 所有的实现类都没有Adaptive，则表示没有代理类
    // 如果有代理类，则直接返回代理类
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    // 没有手动定义代理类，帮你创建代理类
    // 创建的过程就是用字符串拼出类的实现，然后编译，逻辑比较多，不分析了
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
```

## getActivateExtension（实现自动激活）
在Dubbo过滤器一节详细分析把