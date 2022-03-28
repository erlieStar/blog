---
layout: post
title: Dubbo是如何同时支持同步调用和异步调用的？
lock: need
---

# Dubbo源码解析：Dubbo是如何同时支持同步调用和异步调用的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200912182827205.jpg?)
## 介绍
当依次调用多个没依赖关系的接口时，用CompletableFuture可以将调用接口的过程异步化，提高qps。

其实Dubbo接口本身就支持异步调用，我们可以直接获取一个CompletableFuture对象，不用自己去新建。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200912130454124.jpeg?)
来演示一下同步调用和异步调用的两种方式

**同步调用**

```java
DemoService demoService = context.getBean("demoService", DemoService.class);
String hello = demoService.sayHello("world");
// result: Hello world
System.out.println("result: " + hello);
```
**异步调用** 
```java
DemoService demoService = context.getBean("demoService", DemoService.class);
String result = demoService.sayHello("world");
// null
System.out.println(result);
CompletableFuture<String> future = RpcContext.getContext().getCompletableFuture();
future.whenComplete((v, t) -> {
    if (t != null) {
        t.printStackTrace();
    } else {
        System.out.println(v);
    }
});
```
当然异步调用的方法需要配置一下，xml配置如下，如果你用的是@Reference注解，也可以用类似的方式配置

```csharp
<dubbo:reference id="demoService" check="false" interface="org.apache.dubbo.demo.DemoService">
  <!-- 需要异步调用的方法，均需要使用 <dubbo:method/>标签进行描述-->
  <dubbo:method name="sayHello" async="true"/>
</dubbo:reference>
```
刚开始我知道Dubbo能同时支持同步调用和异步调用还挺诧异的。因为大家都知道Dubbo的网络调用是通过Netty实现的，同时支持异步调用和同步调用难道是针对同步方法创建一个NettyClient使用BIO的方式进行请求，针对异步方法创建一个NettyClient使用NIO的方式进行请求？

源码之下无秘密，直接看一波源码，对了版本为2.7.1

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
**NettyClientHandler为最终执行业务逻辑的Handler，建立连接，连接断开，读取到消息之类的事件都由NettyClientHandler来处理**。

netty客户端启动时，EventLoopGroup为NioEventLoopGroup，channel为NioSocketChannel，这明明就是一个异步请求客户端，那么是怎么同时支持异步请求和同步请求的？

## 开始请求
在Dubbo进行远程调用的时候，最终都会调用DubboInvoker的doInvoke方法，如何调用到这个方法，前面的文章已经分析过了哈。

```java
// DubboInvoker
protected Result doInvoke(final Invocation invocation) throws Throwable {
    // 设置附加属性
    RpcInvocation inv = (RpcInvocation) invocation;
    final String methodName = RpcUtils.getMethodName(invocation);
    // 设置路径，版本
    inv.setAttachment(Constants.PATH_KEY, getUrl().getPath());
    inv.setAttachment(Constants.VERSION_KEY, version);

    // 获取客户端，发起实际调用
    ExchangeClient currentClient;
    if (clients.length == 1) {
        currentClient = clients[0];
    } else {
        currentClient = clients[index.getAndIncrement() % clients.length];
    }
    try {
        // 是否为异步
        boolean isAsync = RpcUtils.isAsync(getUrl(), invocation);
        // 是否为future方式异步
        boolean isAsyncFuture = RpcUtils.isReturnTypeFuture(inv);
        // isOneway 为 true，表示“单向”通信
        boolean isOneway = RpcUtils.isOneway(getUrl(), invocation);
        // 超时等待时间
        int timeout = getUrl().getMethodParameter(methodName, Constants.TIMEOUT_KEY, Constants.DEFAULT_TIMEOUT);
        // 不需要响应的请求
        if (isOneway) {
            boolean isSent = getUrl().getMethodParameter(methodName, Constants.SENT_KEY, false);
            currentClient.send(inv, isSent);
            RpcContext.getContext().setFuture(null);
            return new RpcResult();
        } else if (isAsync) {
            // 异步有返回值
            // 同步：框架调用ResponseFuture#get()
            // 异步：用户调用ResponseFuture#get()
            ResponseFuture future = currentClient.request(inv, timeout);
            // For compatibility
            // FutureAdapter 是将ResponseFuture与jdk中的Future进行适配
            // 当用户调用Future的get方法时，经过FutureAdapter的适配，最终会调用DefaultFuture的get方法
            FutureAdapter<Object> futureAdapter = new FutureAdapter<>(future);
            RpcContext.getContext().setFuture(futureAdapter);

            Result result;
            // 返回值是否是 CompletableFuture
            if (isAsyncFuture) {
                // register resultCallback, sometimes we need the async result being processed by the filter chain.
                result = new AsyncRpcResult(futureAdapter, futureAdapter.getResultFuture(), false);
            } else {
                result = new SimpleAsyncRpcResult(futureAdapter, futureAdapter.getResultFuture(), false);
            }
            return result;
        } else {
            // 同步调用
            RpcContext.getContext().setFuture(null);
            // 发送请求，得到一个 ResponseFuture 实例，并调用该实例的 get 方法进行等待
            // 本质上还是通过异步的代码来实现同步调用
            return (Result) currentClient.request(inv, timeout).get();
        }
    } catch (TimeoutException e) {
        throw new RpcException(RpcException.TIMEOUT_EXCEPTION, "Invoke remote method timeout. method: " + invocation.getMethodName() + ", provider: " + getUrl() + ", cause: " + e.getMessage(), e);
    } catch (RemotingException e) {
        throw new RpcException(RpcException.NETWORK_EXCEPTION, "Failed to invoke remote method: " + invocation.getMethodName() + ", provider: " + getUrl() + ", cause: " + e.getMessage(), e);
    }
}
```
currentClient#request是实际发起调用的方法，会返回一个ResponseFuture（是一个接口）对象，ResponseFuture的实现类为DefaultFuture
```java
ResponseFuture future = currentClient.request(inv, timeout);
```
调用会依次经过如下方法

HeaderExchangeClient#request
HeaderExchangeChannel#request

```java
// HeaderExchangeChannel
public ResponseFuture request(Object request, int timeout) throws RemotingException {
    if (closed) {
        throw new RemotingException(this.getLocalAddress(), null, "Failed to send request " + request + ", cause: The channel " + this + " is closed!");
    }
    // create request.
    Request req = new Request();
    req.setVersion(Version.getProtocolVersion());
    req.setTwoWay(true);
    req.setData(request);
    DefaultFuture future = DefaultFuture.newFuture(channel, req, timeout);
    try {
        channel.send(req);
    } catch (RemotingException e) {
        future.cancel();
        throw e;
    }
    return future;
}
```

将请求封装成Request对象发送出去，追一下DefaultFuture#newFuture方法，你会发现在DefaultFuture保存了请求id和对应DefaultFuture的映射关系，这个映射关系后续会用到

```java
public class DefaultFuture implements ResponseFuture {
    // future缓存
    private static final Map<Long, DefaultFuture> FUTURES = new ConcurrentHashMap<>();
}
```

请求完成，返回的结果都是一个DefaultFuture
1. 如果是同步方法，框架直接调用DefaultFuture#get方法，此时线程会阻塞等待结果
2. 如果是异步返回，将DefaultFuture包装为FutureAdapter然后返回，FutureAdapter的作用只是为了当用户调用Future的get方法时，转为调用DefaultFuture的get方法。

**所以同步方法是框架请求完直接帮你调用DefaultFuture的get方法阻塞获取结果，
异步方法是把DefaultFuture返回给用户，让用户决定获取调用get()方法的时机**

```java
public class DefaultFuture implements ResponseFuture {

    // future缓存
    private static final Map<Long, DefaultFuture> FUTURES = new ConcurrentHashMap<>();

    private volatile Response response;

    private final Condition done = lock.newCondition();
	
	// 获取结果
    @Override
    public Object get() throws RemotingException {
        return get(timeout);
    }

    @Override
    public Object get(int timeout) throws RemotingException {
        if (timeout <= 0) {
            timeout = Constants.DEFAULT_TIMEOUT;
        }
        // 检测服务提供方是否成功返回了调用结果
        if (!isDone()) {
            long start = System.currentTimeMillis();
            lock.lock();
            try {
                // 循环检测服务提供方是否成功返回了调用结果
                while (!isDone()) {
                    // 如果调用结果尚未返回，这里等待一段时间
                    done.await(timeout, TimeUnit.MILLISECONDS);
                    // 如果调用结果成功返回，或等待超时，此时跳出 while 循环，执行后续的逻辑
                    if (isDone() || System.currentTimeMillis() - start > timeout) {
                        break;
                    }
                }
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } finally {
                lock.unlock();
            }
            // 等完到这肯定超时，直接抛出超时异常
            if (!isDone()) {
                throw new TimeoutException(sent > 0, channel, getTimeoutMessage(false));
            }
        }
        // 返回调用结果
        return returnFromResponse();
    }

    @Override
    public boolean isDone() {
        return response != null;
    }
}
```
当调用get()方法时，如果response != null，则直接返回response，如果response == null，则阻塞等待。

那么reponse在什么情况下不为null呢？当然是客户端接收到服务端请求的时候

## 获得结果
在最开始我们就分析了Netty处理业务逻辑的Handler为NettyClientHandler，所有当有消息的时候会调用NettyClientHandler#channelRead

```java
@io.netty.channel.ChannelHandler.Sharable
public class NettyClientHandler extends ChannelDuplexHandler {

    // 从通道中接接收到消息
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        NettyChannel channel = NettyChannel.getOrAddChannel(ctx.channel(), url, handler);
        try {
            handler.received(channel, msg);
        } finally {
            NettyChannel.removeChannelIfDisconnected(ctx.channel());
        }
    }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201114203140479.png?)

前面的文章分析过了哈，这个channelHandler就是典型的装饰者模式，所以追着channelHandler一层一层往下看就行。

中间这些过程我就分析了哈，最终会调用到HeaderExchangeHandler#received方法，接着执行
HeaderExchangeHandler#handleResponse方法

```java
static void handleResponse(Channel channel, Response response) throws RemotingException {
    if (response != null && !response.isHeartbeat()) {
        // 唤醒阻塞线程并通知结果
        DefaultFuture.received(channel, response);
    }
}
```

最终DefaultFuture#received方法会唤醒阻塞线程并通知结果
因为获取结果时会调用get方法阻塞线程，当线程被唤醒时，就会返回结果


```java
public class DefaultFuture implements ResponseFuture {

    // future缓存
    private static final Map<Long, DefaultFuture> FUTURES = new ConcurrentHashMap<>();

    private volatile Response response;

    private final Condition done = lock.newCondition();

    /**
     * 有响应消息时会调用这个方法
     */
    public static void received(Channel channel, Response response) {
        try {
            DefaultFuture future = FUTURES.remove(response.getId());
            if (future != null) {
                future.doReceived(response);
            } else {
                logger.warn("The timeout response finally returned at "
                        + (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new Date()))
                        + ", response " + response
                        + (channel == null ? "" : ", channel: " + channel.getLocalAddress()
                        + " -> " + channel.getRemoteAddress()));
            }
        } finally {
            CHANNELS.remove(response.getId());
        }
    }

    private void doReceived(Response res) {
        lock.lock();
        try {
            response = res;
            // 有结果返回，激活阻塞获取结果的线程
            if (done != null) {
                done.signal();
            }
        } finally {
            lock.unlock();
        }
        if (callback != null) {
            invokeCallback(callback);
        }
    }
    /**
     * 用户线程在发送完请求后的动作，即调用 DefaultFuture 的 get 方法等待响应对象的到来
     */
    @Override
    public Object get() throws RemotingException {
        return get(timeout);
    }

    @Override
    public Object get(int timeout) throws RemotingException {
        if (timeout <= 0) {
            timeout = Constants.DEFAULT_TIMEOUT;
        }
        // 检测服务提供方是否成功返回了调用结果
        if (!isDone()) {
            long start = System.currentTimeMillis();
            lock.lock();
            try {
                // 循环检测服务提供方是否成功返回了调用结果
                while (!isDone()) {
                    // 如果调用结果尚未返回，这里等待一段时间
                    done.await(timeout, TimeUnit.MILLISECONDS);
                    // 如果调用结果成功返回，或等待超时，此时跳出 while 循环，执行后续的逻辑
                    if (isDone() || System.currentTimeMillis() - start > timeout) {
                        break;
                    }
                }
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } finally {
                lock.unlock();
            }
            // 等完到这肯定超时，直接抛出超时异常
            if (!isDone()) {
                // sent > 0 表明服务端超时了，否则没有写入sent客户端超时
                throw new TimeoutException(sent > 0, channel, getTimeoutMessage(false));
            }
        }
        // 返回调用结果
        return returnFromResponse();
    }

}
```
收到响应的时候，先根据reponseId从map中获取到DefaultFuture（Dubbo会将请求封装成Rquest对象，将响应封装成Reponse对象，Request对应的Reponse的id值是一样的），然后设置DefaultFuture的response，最后激活阻塞获取结果的线程，返回结果

图示总结一波

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201122111522227.png?)
