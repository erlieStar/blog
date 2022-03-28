---
layout: post
title: Dubbo服务导出过程
lock: need
---

# Dubbo源码解析：Dubbo服务导出过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020112618270770.jpg?)
## 相关知识
**Dubbo URL**

看Dubbo源码时经常看到URL这个参数，所以先分享一下Dubbo URL

url即一个资源在互联网上的地址，在Dubbo中它被用做配置总线的功能，和服务相关的配置都放在这个总线上。一个标准格式的URL如下

```java
protocol://username:password@host:port/path?key=value&key=value
```
Dubbo中URL对象的构造函数如下
```java
public URL(String protocol, String username, String password, String host, int port, String path, Map<String, String> parameters) {
}
```
Dubbo中URL对象的解析参数如下
|参数  | 解释 |
|--|--|
| protocol |  dubbo中的各种协议，dubbo，thrift，http|
|username/password|用户名/密码|
|host/port|主机/端口|
|path|路径，默认为接口名称，可以设置|
|parameters|参数键值对|

一些典型的Dubbo URL如下

```java
// 描述一个 dubbo 协议的服务
dubbo://192.168.1.6:20880/moe.cnkirito.sample.HelloService?timeout=3000

// 描述一个 zookeeper 注册中心
zookeeper://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?application=demo-consumer&dubbo=2.0.2&interface=org.apache.dubbo.registry.RegistryService&pid=1214&qos.port=33333&timestamp=1545721981946

// 描述一个消费者
consumer://30.5.120.217/org.apache.dubbo.demo.DemoService?application=demo-consumer&category=consumers&check=false&dubbo=2.0.2&interface=org.apache.dubbo.demo.DemoService&methods=sayHello&pid=1209&qos.port=33333&side=consumer&timestamp=1545721827784
```
在后续的介绍中，可以看到在Dubbo运行过程中，会频繁的对这个URL进行修改，增加等操作

为什么要有URL这个对象呢？其实主要就是为了方便传参的过程。将所有和服务相关的参数都放在URL中。

**Invoker**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210612185001808.png?)
**RPC框架中客户端发送网路请求，服务端执行本地方法的过程是由代理对象来执行的，这个代理对象（不管是Client Stub还是Server Stub）都是Invoker对象**

**先来看一下服务导出的整体流程，对服务导出的流程有个大概的了解**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201113000821839.png?)

## 配置解析的过程
在之前的文章中，我们了解到不管是基于XML配置还是注解的方式，每个服务提供者对象都会被解析成ServiceBean对象（实现了ApplicationListener接口），即每个导出的服务对应成一个ServiceBean对象

ServiceBean有2个重要的方法

afterPropertiesSet（初始化方法，实现InitializingBean接口）：初始化一些service的属性
onApplicationEvent：监听spring容器刷新事件，在这个方法进行服务导出

根据Spring容器启动阶段可以知道，先执行afterPropertiesSet方法，后执行onApplicationEvent方法
## 开始服务导出
ServiceBean实现了ApplicationListener接口
```java
public class ServiceBean<T> extends ServiceConfig<T> implements InitializingBean, DisposableBean,
        ApplicationContextAware, ApplicationListener<ContextRefreshedEvent>, BeanNameAware,
        ApplicationEventPublisherAware {
```

所以当监听到ContextRefreshedEvent事件发生时开始导出服务

```java
// ServiceBean.java
// 监听事件开始服务导出，观察者模式
@Override
public void onApplicationEvent(ContextRefreshedEvent event) {
    // 是否已经导出 && 是否已被取消导出
    if (!isExported() && !isUnexported()) {
        if (logger.isInfoEnabled()) {
            logger.info("The service ready on spring started. service: " + getInterface());
        }
        // 服务导出的入口方法
        export();
    }
}
```
接着调用到

```java
// ServiceConfig.java
public synchronized void export() {
    // 检查及更新配置
    checkAndUpdateSubConfigs();

    // 有类似如下配置的时候，服务则不会暴露出去，例如本地调试等
    // <dubbo:provider export="false" />
    if (!shouldExport()) {
        return;
    }

    // 延时导出服务
    if (shouldDelay()) {
        delayExportExecutor.schedule(this::doExport, delay, TimeUnit.MILLISECONDS);
    } else {
        // 立即导出服务
        doExport();
    }
}
```
在doExport中进行导出服务，会调用到doExportUrls()方法

**可以看到一个服务可以以多种形式进行导出，并且注册到多个注册中心**

```clike
// ServiceConfig.java
// 多协议多注册中心导出服务
// 配置文件中配了多个<dubbo:protocol/>
// 配置文件中配了多个<dubbo:config-center>
private void doExportUrls() {
    // 加载注册中心链接
    List<URL> registryURLs = loadRegistries(true);
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        // 应用模型
        // 服务名 对应的实现类 对应的接口
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 在每个协议下导出服务，并且注册到每个注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```
doExportUrlsFor1Protocol方法比较长，因此截成几端来分析

```java
// ServiceConfig.java
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
    String name = protocolConfig.getName();
    if (StringUtils.isEmpty(name)) {
        // 默认协议为dubbo
        name = Constants.DUBBO;
    }
	
	// 省略部分代码
	
    String scope = url.getParameter(Constants.SCOPE_KEY);
```
从第一行到取scope属性，这一大块主要就是构造url参数，看一下最终构建成的url对象长啥样

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200905135526945.png?)
string内容如下
```java
dubbo://192.168.97.70:20880/org.apache.dubbo.demo.DemoService
?anyhost=true
&application=demo-provider
&bean.name=org.apache.dubbo.demo.DemoService
&bind.ip=192.168.97.70
&bind.port=20880
&default.deprecated=false
&default.dynamic=false
&default.register=true
&deprecated=false
&dubbo=2.0.2
&dynamic=false
&generic=false
&interface=org.apache.dubbo.demo.DemoService
&methods=sayHello
&pid=3752
&qos.port=22222
&register=true
&release=
&side=provider
&timestamp=1599285134651
```
下面就正式开始服务暴露的过程，我们可以根据配置导出如下类型的三种服务

```xml
<!-- 导出本地服务 -->
<dubbo:service scope="local" />
<!-- 导出远程服务 -->
<dubbo:service scope="remote" />
<!-- 不导出服务 -->
<dubbo:service scope="none" />
```
### 导出本地服务

```java
// ServiceConfig.java
private void exportLocal(URL url) {
    if (!Constants.LOCAL_PROTOCOL.equalsIgnoreCase(url.getProtocol())) {
        // 显示指定injvm协议进行暴露
        URL local = URLBuilder.from(url)
                .setProtocol(Constants.LOCAL_PROTOCOL)
                .setHost(LOCALHOST_VALUE)
                .setPort(0)
                .build();
        // 这里会调用InjvmProtocol#export
        // 返回 InjvmExporter
        Exporter<?> exporter = protocol.export(
                proxyFactory.getInvoker(ref, (Class) interfaceClass, local));
        exporters.add(exporter);
        logger.info("Export dubbo service " + interfaceClass.getName() + " to local registry");
    }
}
```
看protocol，proxyFactory成员变量的定义，都是获取自适应扩展类。
即框架帮我们生成代理类，代理类在执行过程中从url获取对应的值，然后返回相应的实现类
```java
private static final Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();

private static final ProxyFactory proxyFactory = ExtensionLoader.getExtensionLoader(ProxyFactory.class).getAdaptiveExtension();
```

老规矩用Arthas看一下生成的代理类，典型的Dubbo SPI代码

```shell
curl -O https://alibaba.github.io/arthas/arthas-boot.jar
java -jar arthas-boot.jar
# 根据前面的序号选择进入的进程，然后执行下面的命令
jad *Adaptive
jad org.apache.dubbo.rpc.Protocol$Adaptive
```
生成的代码如下，后续环节我就不看生成的代理类了，都是一个套路。

Protocol接口的定义如下

```java
@SPI("dubbo")
public interface Protocol {

    int getDefaultPort();

    @Adaptive
    <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;

    @Adaptive
    <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;

    void destroy();

}
```

```java
public class Protocol$Adaptive implements Protocol {
    public Exporter export(Invoker invoker) throws RpcException {
        String string;
        if (invoker == null) {
            throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument == null");
        }
        if (invoker.getUrl() == null) {
            throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument getUrl() == null");
        }
        URL uRL = invoker.getUrl();
        String string2 = string = uRL.getProtocol() == null ? "dubbo" : uRL.getProtocol();
        if (string == null) {
            throw new IllegalStateException(new StringBuffer().append("Failed to get extension (org.apache.dubbo.rpc.Protocol) name from url (").append(uRL.toString()).append(") use keys([protocol])").toString());
        }
        Protocol protocol = (Protocol)ExtensionLoader.getExtensionLoader(Protocol.class).getExtension(string);
        return protocol.export(invoker);
    }

    public Invoker refer(Class class_, URL uRL) throws RpcException {
        String string;
        if (uRL == null) {
            throw new IllegalArgumentException("url == null");
        }
        URL uRL2 = uRL;
        String string2 = string = uRL2.getProtocol() == null ? "dubbo" : uRL2.getProtocol();
        if (string == null) {
            throw new IllegalStateException(new StringBuffer().append("Failed to get extension (org.apache.dubbo.rpc.Protocol) name from url (").append(uRL2.toString()).append(") use keys([protocol])").toString());
        }
        Protocol protocol = (Protocol)ExtensionLoader.getExtensionLoader(Protocol.class).getExtension(string);
        return protocol.refer(class_, uRL);
    }

    public void destroy() {
        throw new UnsupportedOperationException("The method public abstract void org.apache.dubbo.rpc.Protocol.destroy() of interface org.apache.dubbo.rpc.Protocol is not adaptive method!");
    }

    public int getDefaultPort() {
        throw new UnsupportedOperationException("The method public abstract int org.apache.dubbo.rpc.Protocol.getDefaultPort() of interface org.apache.dubbo.rpc.Protocol is not adaptive method!");
    }
}
```

从代码中可以看出

当URL中的protocol为registry时，protocol的实现类为RegistryProtocol
当URL中的protocol为injvm时，protocol的实现类为InjvmProtocol

仔细分析一个这行代码的执行过程
```java
// ServiceConfig.java
Exporter<?> exporter = protocol.export(
        proxyFactory.getInvoker(ref, (Class) interfaceClass, local));
```

JavassistProxyFactory将服务对象包装为AbstractProxyInvoker，然后被InjvmProtocol#export导出为InjvmExporter

**将Invoker包装为Exporter主要是为了方便对Invoker的生命周期进行管理**

JavassistProxyFactory#getInvoker方法是生成服务端的代理对象，即Server Stub

```java
public class JavassistProxyFactory extends AbstractProxyFactory {

    /**
     * 针对provider端，将服务对象包装成一个Invoker对象
     */
    @Override
    public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
        // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
        final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
        // 重写类AbstractProxyInvoker类的doInvoke方法
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                // 这个方法里面调用执行本地方法
                return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
            }
        };
    }

}
```


当有服务调用的时候最终会执行AbstractProxyInvoker#doInvoke（后续文章中会介绍服务调用的过程），而在这个方法中又会执行wrapper#invokeMethod，wrapper是框架用Javassist帮我们生成的类，包装了服务的实现类，主要是为了减少反射调用。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201108164549736.png?)
你可以看一下JdkProxyFactory#getInvoker（生成Invoker的另一种方式）方法，直接根据调用信息反射执行方法，效率比较低

总结一下导出本地服务的过程。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201108205820860.png?)


### 导出远程服务
在看后面的代码的时候还是要提一下，会根据协议进行2次导出的过程

1. 协议为registry，如registry://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService，确定是本地导出，还是远程导出等
2. 协议为dubbo，如dubbo://192.168.97.70:20880/org.apache.dubbo.demo.DemoService，确定最终导出的Invoker是基于哪个协议

我们主要看一下从Invoker到Exporter过程即可，其他过程和导出本地服务的过程差不多

```java
// ServiceConfig.java
// 从这里开始导出服务
// 调用了 RegistryProtocol
Exporter<?> exporter = protocol.export(wrapperInvoker);
```
传入的是wrapperInvoker，我们追一下url中的内容，就能看到最后的生成类

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201108193503144.jpeg?)

protocol为registry，所以protocol此时选择的类为RegistryProtocol，接着追RegistryProtocol

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201108195129294.png?)

这个方法执行完毕，整个服务导出的过程就全完了，重点关注图中标红的三个部分

```java
URL registryUrl = getRegistryUrl(originInvoker);
```
这行代码做的事情很简单
1. 从parameters中key为registry中取值为zookeeper，将protocol改为zookeeper
2. 将parameters中的registry移除

和上上个图对照一下就知道了
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200905154057915.png?)
因为registryUrl的protocol=zookeeper，所以后续创建的Registry为ZookeeperRegistry

导出服务的过程如下，

```java
// RegistryProtocol.java
// 导出服务，服务已经启动
final ExporterChangeableWrapper<T> exporter = doLocalExport(originInvoker, providerUrl);
```
服务启动的链路比较长，单开一个小节来分析
```java
// 向注册中心注册服务
register(registryUrl, registeredProviderUrl);
```
注册完毕，方法返回DestroyableExporter，导出完毕。

画图总结一下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210616180421672.png?)
### 服务启动的过程
```java
// RegistryProtocol.java
private <T> ExporterChangeableWrapper<T> doLocalExport(final Invoker<T> originInvoker, URL providerUrl) {
    // 获取服务缓存的key
    String key = getCacheKey(originInvoker);

    // java8新特性，判断指定key是否存在，不存在就会调用函数接口，计算value并放入map
    return (ExporterChangeableWrapper<T>) bounds.computeIfAbsent(key, s -> {
        Invoker<?> invokerDelegete = new InvokerDelegate<>(originInvoker, providerUrl);
        return new ExporterChangeableWrapper<>((Exporter<T>) protocol.export(invokerDelegete), originInvoker);
    });
}
```

因为protocol.export(invokerDelegete)最后的实现类是由providerUrl中的protocol决定的，看一下到底是啥？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201108201333487.png?)
protocol=dubbo，所以会执行DubboProtocol#export方法来返回一个Exporter

这个部分有个重要的部分

```java
protocol.export(invokerDelegete)
```
用SPI获取具体协议的时候，会被2个wrapper类包装（Dubbo SPI说过这个特性了哈）
ProtocolListenerWrapper和ProtocolFilterWrapper

所以调用各种协议的实现时，调用链路如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201122212815677.png#pic_center)
ProtocolListenerWrapper：对服务导入导出的过程进行监听
ProtocolFilterWrapper：执行各种Filter
QosProtocolWrapper：在线运维服务，列出服务名，上下线服务等

**看上面RegistryProtocol的导出过程，也被这3个类包装过**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210612191602918.png?)
```java
// DubboProtocol.java
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    URL url = invoker.getUrl();

    // export service.
    // 获取服务的key
    // 例如 org.apache.demo.DemoService:20880
    // 将Invoker转为Exporter，并且保存在 exporterMap 中
    String key = serviceKey(url);
    DubboExporter<T> exporter = new DubboExporter<T>(invoker, key, exporterMap);
    exporterMap.put(key, exporter);

	// 省略部分代码

    // 同一个机器的不同服务导出只会开启一个NettyServer
    openServer(url);
    optimizeSerialization(url);

    return exporter;
}
```

```java
// DubboProtocol.java
private void openServer(URL url) {
    // find server.
    String key = url.getAddress();
    //client can export a service which's only for server to invoke
    // 只有服务提供方才会启动监听
    boolean isServer = url.getParameter(Constants.IS_SERVER_KEY, true);
    if (isServer) {
        ExchangeServer server = serverMap.get(key);
        if (server == null) {
            synchronized (this) {
                server = serverMap.get(key);
                if (server == null) {
                    // 创建服务器实例
                    serverMap.put(key, createServer(url));
                }
            }
        } else {
            // server supports reset, use together with override
            server.reset(url);
        }
    }
}
```
这里就是创建server，并绑定端口的部分。
```java
// DubboProtocol.java
private ExchangeServer createServer(URL url) {

    // 省略部分代码

    ExchangeServer server;
    try {
        // 传输默认选择的是
        server = Exchangers.bind(url, requestHandler);
    } catch (RemotingException e) {
        throw new RpcException("Fail to start server(url: " + url + ") " + e.getMessage(), e);
    }

    // 省略部分代码

    return server;
}
```

画图总结一下服务启动的过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210615191740571.png?)

因为最后默认启动的是NettyServer，因为Netty处理业务逻辑是通过ChannelHandler来处理，我们就来看看NettyServer中加入了哪些ChannelHandler，用了编解码的handler，IdleStateHandler，还有NettyServerHandler。

难道所有的逻辑用NettyServerHandler来处理？当然不是，在后面请求处理的部分，我们接着这部分继续追。

```java
final NettyServerHandler nettyServerHandler = new NettyServerHandler(getUrl(), this);
channels = nettyServerHandler.getChannels();

bootstrap.group(bossGroup, workerGroup)
        .channel(NioServerSocketChannel.class)
        .childOption(ChannelOption.TCP_NODELAY, Boolean.TRUE)
        .childOption(ChannelOption.SO_REUSEADDR, Boolean.TRUE)
        .childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
        .childHandler(new ChannelInitializer<NioSocketChannel>() {
            @Override
            protected void initChannel(NioSocketChannel ch) throws Exception {
                // FIXME: should we use getTimeout()?
                int idleTimeout = UrlUtils.getIdleTimeout(getUrl());
                NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyServer.this);
                ch.pipeline()//.addLast("logging",new LoggingHandler(LogLevel.INFO))//for debug
                        .addLast("decoder", adapter.getDecoder()) // 解码器handler
                        .addLast("encoder", adapter.getEncoder()) // 编码器handler
                        // 心跳检查handler
                        .addLast("server-idle-handler", new IdleStateHandler(0, 0, idleTimeout, MILLISECONDS))
                        .addLast("handler", nettyServerHandler);
            }
        });
```