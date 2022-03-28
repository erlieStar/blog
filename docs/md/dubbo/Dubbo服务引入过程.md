---
layout: post
title: Dubbo服务引入过程
lock: need
---

# Dubbo源码解析：Dubbo服务引入过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201114200113379.png?)
## 懒汉式启动和饿汉式启动

服务引入无非就是在客户端生成一个代理对象，这个代理对象帮我们组装调用参数，发起网络调用，接收请求等。我们调用一个接口的方法时，就像调用本地方法一样。

放一个Dubbo服务导出的简略图，后面分析的时候不至于绕晕。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201121174710516.png?)

前面的配置章节我们说过，在引入服务的时候，接口对应的代理类会被解析为一个**ReferenceBean**对象

```java
public class ReferenceBean<T> extends ReferenceConfig<T> implements 
FactoryBean, ApplicationContextAware, InitializingBean, DisposableBean {
```

ReferenceBean实现了FactoryBean接口，当想获取这个Bean时，会调用FactoryBean#getObject方法返回Bean
ReferenceBean，**当服务被注入其它类时，才会启动引入流程，即用到才会引入，这种引入方式为懒汉式**。

ReferenceBean实现了InitializingBean接口，即Bean在初始化的过程中，会回调这个接口的afterPropertiesSet方法，根据配置决定是否手动调用FactoryBean#getObject方法。

```java
<dubbo:reference id="demoService" check="false" init="true" interface="org.apache.dubbo.demo.DemoService"/>
```

**init=true，当spring容器启动后，服务已经被引入，这种方式为饿汉式**。

```java
public void afterPropertiesSet() throws Exception {
    // 进行属性赋值
    
    // 当配置了饿汉式时，调用FactoryBean#getObject
    if (shouldInit()) {
        getObject();
    }
}
```

懒汉式和饿汉式只是服务引入的时机不同，引入的过程都是调用FactoryBean#getObject方法。所以我们追一下FactoryBean#getObject方法即可
## 初始化过程

```java
// ReferenceBean
// 重写了FactoryBean接口的getObject方法
public Object getObject() {
    return get();
}
```

```java
// ReferenceConfig
// 生成代理类
public synchronized T get() {
    checkAndUpdateSubConfigs();

    if (destroyed) {
        throw new IllegalStateException("The invoker of ReferenceConfig(" + url + ") has already destroyed!");
    }
    if (ref == null) {
        init();
    }
    return ref;
}
```

```java
// ReferenceConfig
private void init() {
	// 构建参数，代码省略
    // 创建代理对象
    ref = createProxy(map);
}
```
init方法主要构建参数map，不详细分析了，直接看结果。接着调用createProxy创建代理对象。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200908192801181.png?)
创建代理对象的时候，根据配置方式的不同，按照如下三种方式来创建代理

1. 本地引用
2. 使用直连的方式引用服务
3. 基于注册中心引用服务

当基于注册中心引用服务的时候，分为单个注册中心引入和多个注册中心引入。就简单分析一下单个注册中心引入的方式
### 单个注册中心

当调用refprotocol#refer方法时，protocol=registry，所以对应的实现类为RegistryProtocol，进入RegistryProtocol#refer方法

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201104161325865.png?)
这个方法的第一步就是将protocol设置为parameters中registry 的值，然后把parameters中registry的值删除，对比一下上下两个图就知道了。

**将protocol从registry改为zookeeper，然后获得具体的注册中心类型**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201104161820530.png?)
接着会调用到doRefer方法

```java
// 引入
// RegistryProtocol
private <T> Invoker<T> doRefer(Cluster cluster, Registry registry, Class<T> type, URL url) {
    // 创建服务目录
    RegistryDirectory<T> directory = new RegistryDirectory<T>(type, url);
    directory.setRegistry(registry);
    // 放入生成的Protocol$Adaptive
    directory.setProtocol(protocol);
    // all attributes of REFER_KEY
    Map<String, String> parameters = new HashMap<String, String>(directory.getUrl().getParameters());
    // 构建订阅的url
    URL subscribeUrl = new URL(CONSUMER_PROTOCOL, parameters.remove(REGISTER_IP_KEY), 0, type.getName(), parameters);
    if (!ANY_VALUE.equals(url.getServiceInterface()) && url.getParameter(REGISTER_KEY, true)) {
        directory.setRegisteredConsumerUrl(getRegisteredConsumerUrl(subscribeUrl, url));
        // consumer也将自己注册到注册中心
        registry.register(directory.getRegisteredConsumerUrl());
    }
    // 初始化路由规则
    directory.buildRouterChain(subscribeUrl);
    // 订阅这几个节点的变化
    // category providers configurators routers
    // RegistryProtocol会收到这几个节点的信息，触发生成DubboInvoker，即用于远程调用的Invoker
    directory.subscribe(subscribeUrl.addParameter(CATEGORY_KEY,
            PROVIDERS_CATEGORY + "," + CONFIGURATORS_CATEGORY + "," + ROUTERS_CATEGORY));
    // 从服务目录选出来一个Invoker
    // MockClusterWrapper -> FailoverCluster
    // MockClusterInvoker -> FailoverClusterInvoker
    Invoker invoker = cluster.join(directory);
    ProviderConsumerRegTable.registerConsumer(invoker, url, subscribeUrl, directory);
    return invoker;
}
```

这个方法创建了一个RegistryDirectory对象，你可以先认为RegistryDirectory根据服务提供者的地址生成了一系列的Invoker，这些Invoker列表是动态的，根据注册中心的状态来刷新Invoker

接着consumer将自己注册到注册中心，订阅category providers configurators routers这几个节点的变化。当consumer第一次订阅这些节点信息，或者节点信息发生改变时，都会重新设置路由规则，将provider url 转为Invoker 等

当协议为dubbo时，最后生成的 Client Stub 为 DubboInvoker
```java
Invoker invoker = cluster.join(directory);
```
然后通过Cluster接口实现集群容错的功能，集群容错在后面会详细介绍，会返回一个Invoker

```java
// ReferenceConfig
proxyFactory.getProxy(invoker)
```
接着对返回的Invoker生成目标接口的代理类并返回，导出过程完毕。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210615163524130.png?)
## DubboInvoker的具体执行过程
前面说到当服务目录订阅providers节点的时候，会把providerUrl转为Invoker，即可以发起网络调用的对象。从providerUrl转DubboInvoker的过程如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210615224204860.png?)
当第一次订阅服务端，或者当服务端的配置发生改变的时候会回调用RegistryDirectory#notify方法，继而根据协议生成对应的Invoker，因为一般情况是dubbo协议，所以导出为DubboInvoker

整个调用链路如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201121203517723.jpeg?)
由providerUrl转为Invoker的过程在《Dubbo源码解析：集群容错》一节中详细介绍，一般协议为dubbo，所以最终会调用到DubboProtocol#refer方法

```java
public <T> Invoker<T> refer(Class<T> serviceType, URL url) throws RpcException {
    optimizeSerialization(url);

    // create rpc invoker.
    // 比较重要的方法为getClients，获取客户端
    DubboInvoker<T> invoker = new DubboInvoker<T>(serviceType, url, getClients(url), invokers);
    invokers.add(invoker);

    return invoker;
}
```

直接new一个DubboInvoker，最主要是的生成一个ExchangeClient（可发起网络调用的客户端）
```java
private ExchangeClient[] getClients(URL url) {
    // whether to share connection

    // 是否共享连接
    boolean useShareConnect = false;

    int connections = url.getParameter(Constants.CONNECTIONS_KEY, 0);
    List<ReferenceCountExchangeClient> shareClients = null;
    // if not configured, connection is shared, otherwise, one connection for one service
    // 没有配置连接数，则默认使用一个
    if (connections == 0) {
        useShareConnect = true;

        /**
         * The xml configuration should have a higher priority than properties.
         */
        String shareConnectionsStr = url.getParameter(Constants.SHARE_CONNECTIONS_KEY, (String) null);
        // 这里默认为1
        connections = Integer.parseInt(StringUtils.isBlank(shareConnectionsStr) ? ConfigUtils.getProperty(Constants.SHARE_CONNECTIONS_KEY,
                Constants.DEFAULT_SHARE_CONNECTIONS) : shareConnectionsStr);
        shareClients = getSharedClient(url, connections);
    }

    ExchangeClient[] clients = new ExchangeClient[connections];
    for (int i = 0; i < clients.length; i++) {
        if (useShareConnect) {
            // 获取共享客户端
            clients[i] = shareClients.get(i);

        } else {
            // 初始化新的客户端
            clients[i] = initClient(url);
        }
    }

    return clients;
}
```

**这部分是根据配置来决定新开连接，还是复用之前的连接**

接着看一下初始化连接的过程

```java
private ExchangeClient initClient(URL url) {

    // client type setting.
    // 客户端类型，默认为netty
    String str = url.getParameter(Constants.CLIENT_KEY, url.getParameter(Constants.SERVER_KEY, Constants.DEFAULT_REMOTING_CLIENT));

    // 加编解码和心跳包参数
    url = url.addParameter(Constants.CODEC_KEY, DubboCodec.NAME);
    // enable heartbeat by default
    url = url.addParameterIfAbsent(Constants.HEARTBEAT_KEY, String.valueOf(Constants.DEFAULT_HEARTBEAT));

    // BIO is not allowed since it has severe performance issue.
    // 检查是否有这个类型的客户端
    if (str != null && str.length() > 0 && !ExtensionLoader.getExtensionLoader(Transporter.class).hasExtension(str)) {
        throw new RpcException("Unsupported client type: " + str + "," +
                " supported client type is " + StringUtils.join(ExtensionLoader.getExtensionLoader(Transporter.class).getSupportedExtensions(), " "));
    }

    ExchangeClient client;
    try {
        // connection should be lazy
        // 懒加载，当真正发生请求的时候才进行连接
        if (url.getParameter(Constants.LAZY_CONNECT_KEY, false)) {
            client = new LazyConnectExchangeClient(url, requestHandler);

        } else {
            // 进行连接
            client = Exchangers.connect(url, requestHandler);
        }

    } catch (RemotingException e) {
        throw new RpcException("Fail to create remoting client for service(" + url + "): " + e.getMessage(), e);
    }

    return client;
}
```

**看到可以配置生成Invoker的时候直接进行连接，还是在发起请求的时候才连接服务端。**

最终返回的HeaderExchangeClient封装的为NettyClient。连接的这部分代码和服务导出的部分很类似，画个图总结一下服务连接的过程

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210615175152853.png?)

**DubboProtocol#refer**：这一步可以决定是共享连接，还是创建新的连接。假如connections配置为10，则启动时候会和服务端建立10个连接（一个DubboInvoker和服务端建立10个连接）发送请求的时候这10个连接轮流用。默认connections=0，只会建立一个连接。

**DubboProtocol#initClient**：这一步可以决定服务引入的时候连接服务提供者，还是发起网络调用的时候才连接服务提供者。默认是服务引入的时候连接服务提供者

**从这里就能看到Dubbo为什么不适合大数据量的服务，如传文件，传视频等？**

因 dubbo 协议采用单一长连接，如果每次请求的数据包大小为 500KByte，假设网络为千兆网卡，每条连接最大 7MByte(不同的环境可能不一样，供参考)。
单个服务提供者的 TPS(每秒处理事务数)最大为：128MByte / 500KByte = 262。
单个消费者调用单个服务提供者的 TPS(每秒处理事务数)最大为：7MByte / 500KByte = 14。如果能接受，可以考虑使用，否则网络将成为瓶颈

创建NettyClient并启动
```java
// NettyClient
protected void doOpen() throws Throwable {
    // 执行业务逻辑的handler
    final NettyClientHandler nettyClientHandler = new NettyClientHandler(getUrl(), this);
    bootstrap = new Bootstrap();
    bootstrap.group(nioEventLoopGroup)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .option(ChannelOption.TCP_NODELAY, true)
            .option(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
            //.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, getTimeout())
            .channel(NioSocketChannel.class);

    if (getConnectTimeout() < 3000) {
        bootstrap.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000);
    } else {
        bootstrap.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, getConnectTimeout());
    }

    bootstrap.handler(new ChannelInitializer() {

        @Override
        protected void initChannel(Channel ch) throws Exception {
            int heartbeatInterval = UrlUtils.getHeartbeat(getUrl());
            NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyClient.this);
            ch.pipeline()//.addLast("logging",new LoggingHandler(LogLevel.INFO))//for debug
                    .addLast("decoder", adapter.getDecoder())
                    .addLast("encoder", adapter.getEncoder())
                    .addLast("client-idle-handler", new IdleStateHandler(heartbeatInterval, 0, 0, MILLISECONDS))
                    .addLast("handler", nettyClientHandler);
        }
    });
}
```
所以在下一节，我们又要分析这个ChannelHandler的执行过程了
