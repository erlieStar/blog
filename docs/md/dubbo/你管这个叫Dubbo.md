---
layout: post
title: 你管这个叫Dubbo?
lock: need
---

# Dubbo源码解析：你管这个叫Dubbo?

![请添加图片描述](https://img-blog.csdnimg.cn/d0b3c9b89b2940ca94904b5e8c95f05b.png)
## RPC框架的实现

又到年初了，大家又要开始准备面试了。为了方便大家，我就写几篇面试相关的文章吧，这次是Dubbo

相信很多小伙伴已经看了很多Dubbo的八股文了。比如，Dubbo支持哪些序列化框架，支持哪些注册中心，支持哪些集群容错策略，支持服务降级吗？但是你知道Dubbo服务导出和服务引入的过程吗？服务降级是如何实现的？等等

本文就从源码的角度来分享一下Dubbo的整个调用过程（放心，图示为主，辅助一少部分源码）


**RPC框架的实现基本上都是如下架构**
![在这里插入图片描述](https://img-blog.csdnimg.cn/f69a808af4a64f7facaf3cd8fa17ce7b.png)
一个RPC调用的过程如下

1. 调用方发送请求后由代理类将调用的方法，参数组装成能进行网络传输的消息体
2. 调用方代理类将消息体发送到提供方
3. 提供方代理类将消息进行解码，得到调用的方法和参数
4. 提供方代理类执行相应的方法，并将结果返回

**协议，编解码，序列化的部分不是本文的重点，我就不分析了，有兴趣的可以看我之前的文章。**

首先来手写一个极简版的RPC框架，以便你对上面的流程有一个更深的认识
## 手写一个简单的PRC框架
### 封装网络请求对象

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpcRequest implements Serializable {

    private String interfaceName;
    private String methodName;
    private Class<?>[] paramTypes;
    private Object[] parameters;
}
```
根据interfaceName可以确定需要调用的接口，methodName和paramTypes则可以确定要调用接口的方法名，定位到具体的方法，传入参数即可调用方法

### 封装调用接口
封装接口到api模块，producer端写实现逻辑，consumer端写调用逻辑

```java
public interface HelloService {

    String sayHello(String content);
}
```

```java
public interface UpperCaseService {

    String toUpperCase(String content);
}
```

### 开发producer端

```java
public class HelloServiceImpl implements HelloService {

    @Override
    public String sayHello(String content) {
        return "hello " + content;
    }
}
```

```java
public class UpperCaseServiceImpl implements UpperCaseService {

    @Override
    public String toUpperCase(String content) {
        return content.toUpperCase();
    }
}
```
ServiceMap保存了producer端接口名和接口实现类的映射关系，这样可以根据请求对象的接口名，找到对应的实现类
```java
public class ServiceMap {

    // 接口名 -> 接口实现类
    private static Map<String, Object> serviceMap = new HashMap<>();

    public static void registerService(String serviceKey, Object service) {
        serviceMap.put(serviceKey, service);
    }

    public static Object lookupService(String serviceKey) {
        return serviceMap.get(serviceKey);
    }
}
```
为了提高服务端的并发度，我们将每一个请求的处理过程放到线程池中
```java
@Slf4j
public class RequestHandler implements Runnable {

    private Socket socket;

    public RequestHandler(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        try (ObjectInputStream inputStream = new ObjectInputStream(socket.getInputStream());
             ObjectOutputStream outputStream = new ObjectOutputStream(socket.getOutputStream())) {
            RpcRequest rpcRequest = (RpcRequest) inputStream.readObject();
            Object service = ServiceMap.lookupService(rpcRequest.getInterfaceName());
            Method method = service.getClass().getMethod(rpcRequest.getMethodName(), rpcRequest.getParamTypes());
            Object result = method.invoke(service, rpcRequest.getParameters());
            outputStream.writeObject(result);
        } catch (Exception e) {
            log.error("invoke method error", e);
            throw new RuntimeException("invoke method error");
        }
    }

}
```

启动服务端

```java
public class RpcProviderMain {

    private static final ExecutorService executorService = Executors.newCachedThreadPool();

    public static void main(String[] args) throws Exception {

        HelloService helloService = new HelloServiceImpl();
        UpperCaseService upperCaseService = new UpperCaseServiceImpl();
        // 将需要暴露的接口注册到serviceMap中
        ServiceMap.registerService(HelloService.class.getName(), helloService);
        ServiceMap.registerService(UpperCaseService.class.getName(), upperCaseService);

        ServerSocket serverSocket = new ServerSocket(8080);

        while (true) {
            // 获取一个套接字（阻塞）。所以为了并行，来一个请求，开一个线程处理
            // 为了复用线程，用了threadPool
            final Socket socket = serverSocket.accept();
            executorService.execute(new RequestHandler(socket));
        }
    }
}
```

### 开发consumer端
前面说过，我们要通过动态代理对象解耦方法调用和网络调用，所以接下来我们就写一下动态代理对象的实现逻辑

生成一个代理对象的过程很简单
1. 实现InvocationHandler接口，在invoke方法中增加代理逻辑
2. 调用Proxy.newProxyInstance方法生成代理对象，3个参数分别是ClassLoader，代理对象需要实现的接口数组，InvocationHandler接口实现类
3. 当执行代理执行实现的接口方法时，会调用到InvocationHandler#invoke，这个方法中增加了代理逻辑哈。
```java
public class ConsumerProxy {

    public static <T> T getProxy(final Class<T> interfaceClass, final String host, final int port) {

        return (T) Proxy.newProxyInstance(interfaceClass.getClassLoader(),
                new Class<?>[]{interfaceClass}, new ConsumerInvocationHandler(host, port));
    }
}
```
可以看到代理对象的主要功能就是组装请求参数，然后发起网络调用
```java
@Slf4j
public class ConsumerInvocationHandler implements InvocationHandler {

    private String host;
    private Integer port;

    public ConsumerInvocationHandler(String host, Integer port) {
        this.host = host;
        this.port = port;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {

        try (Socket socket = new Socket(host, port);
             ObjectOutputStream outputStream = new ObjectOutputStream(socket.getOutputStream());
             ObjectInputStream inputStream = new ObjectInputStream(socket.getInputStream())) {
            RpcRequest rpcRequest = RpcRequest.builder()
                    .interfaceName(method.getDeclaringClass().getName())
                    .methodName(method.getName())
                    .paramTypes(method.getParameterTypes())
                    .parameters(args).build();
            outputStream.writeObject(rpcRequest);
            Object result = inputStream.readObject();
            return result;
        } catch (Exception e) {
            log.error("consumer invoke error", e);
            throw new RuntimeException("consumer invoke error");
        }
    }
}
```
此时我们只需要通过ConsumerProxy#getProxy方法，就能很方便的获取到代理对象。通过代理对象调用远程方法和调用本地方法一样方便
```java
public class RpcConsumerMain {

    public static void main(String[] args)  {

        // 因为这是一个小demo，就不拆分多模块了
        // 这个HelloService是通过网络调用的HelloServiceImpl，而不是本地调用
        HelloService helloService = ConsumerProxy.getProxy(HelloService.class, "127.0.0.1", 8080);
        // hello world
        System.out.println(helloService.sayHello("world"));
        UpperCaseService upperCaseService = ConsumerProxy.getProxy(UpperCaseService.class, "127.0.0.1", 8080);
        // THIS IS CONTENT
        System.out.println(upperCaseService.toUpperCase("this is content"));
    }
}
```
至此我们已经把一个RPC框架最核心的功能就实现了，是不是很简单。**其实Dubbo的源码也很简单，只不过增加了很多扩展功能，所以大家有时候会认为比较难。**

所以我们就来分析一下核心的扩展功能。比如Filter，服务降级，集群容错等是如何实现的？其他的扩展功能，比如支持多种注册中心，支持多种序列化框架，支持多种协议，基本不会打交道，所以就不浪费时间了

从前面的图示我们知道，代理类在服务调用和响应过程中扮演着重要的角色。**在Dubbo中，代理类有个专有名词叫做Invoker，而Dubbo中就是通过对这个Invoker不断进行代理增加各种新功能的**
## Dubbo服务导出
**当第三方框架想和Spring整合时，有哪些方式？**
1. 实现BeanFactoryPostProcessor接口（对BeanFactory进行扩展） 
2. 实现BeanPostProcessor接口（对Bean的生成过程进行扩展）
![在这里插入图片描述](https://img-blog.csdnimg.cn/2199813646c041d5873a15ee0a199271.png)

Dubbo也不例外，当Dubbo和Spring整合时，会往容器中注入2个BeanPostProcessor，作用如下

ServiceAnnotationBeanPostProcessor，将@Service注解的类封装成ServiceBean注入容器
ReferenceAnnotationBeanPostProcessor，将@Reference注解的接口封装成ReferenceBean注入容器
![请添加图片描述](https://img-blog.csdnimg.cn/88e2a981099e45d09ca74b68b1b4f55c.png)

所以服务导出和服务引入肯定和ServiceBean和ReferenceBean的生命周期有关。
![在这里插入图片描述](https://img-blog.csdnimg.cn/97369f930d2d44ac83af28139b052b79.png)
**ServiceBean实现了ApplicationListener接口，当收到ContextRefreshedEvent事件时（即Spring容器启动完成）开始服务导出。**

服务导出比较重要的2个步骤就是
1. 将服务注册到zk（我们后面的分析，注册中心都基于zk哈）
2. 将服务对象包装成Invoker，并保存在一个map中，key为服务名，value为Invoker对象

**当收到请求时，根据服务名找到Invoker对象，Invoker对象根据方法名和参数反射执行方法，然后将结果返回。**

这里留个小问题，反射执行方式效率会很低，那么在Dubbo中还有哪些解决方案呢？

从图中可以看到AbstractProxyInvoker被其他Invoker进行代理了，而这些Invoker是用来执行Filter的，一个Invoker代理类执行一个Filter，层层进行代理

**如下图为Dubbo收到请求层层调用的过程**
![在这里插入图片描述](https://img-blog.csdnimg.cn/7a6b415f061245fb8c30cc882f2c03ad.png)

## Dubbo服务引入
![在这里插入图片描述](https://img-blog.csdnimg.cn/605d658fc1ce4b97bfa7c59dc04b9afe.png)
前面我们已经推断出来服务导出和ReferenceBean有关。我们来看看具体在哪个阶段？
ReferenceBean实现了FactoryBean接口，并重写了getObject方法，在这个方法中进行服务导出。因此我们推断服务导出的时机是ReferenceBean被其他对象注入时

```java
public Object getObject() {
    return get();
}
```
接下来就是从注册中心获取服务地址，构建Invoker对象，并基于Invoker对象构建动态代理类，赋值给接口。

最终能发起网络调用的是DubboInvoker，而这个Invoker被代理了很多层，用来实现各种扩展功能。
### 服务降级
第一个就是服务降级，什么是服务降级呢？

**当服务可不用时，我们不希望抛出异常，而是返回特定的值（友好的提示等），这时候我们就可以用到服务降级。**

dubbo中有很多服务降级策略，简单举几个例子

force: 代表强制使用 Mock 行为，在这种情况下不会走远程调用
fail: 只有当远程调用发生错误时才使用 Mock 行为

假如有如下一个controller，调用DemoService获取值，但是DemoService并没有启动
```java
@RestController
public class DemoController {

    @Reference(check = false, mock = "force:return mock")
    private DemoService demoService;

    @RequestMapping("hello")
    public String hello(@RequestParam("msg") String msg) {
        return demoService.hello(msg);
    }

}
```
可以看到直接返回mock字符串（也并不会发生网络调用）

将@Reference的mock属性改为如下，再次调用
```java
@RestController
public class DemoController {

    @Reference(check = false, mock = "fail:return fail")
    private DemoService demoService;

    @RequestMapping("hello")
    public String hello(@RequestParam("msg") String msg) {
        return demoService.hello(msg);
    }

}
```
会发起网络调用，调用失败，然后返回fail。

**dubbo中的服务降级只用了MockClusterInvoker这一个类来实现，因此相对于Hystrix等功能很简单，实现也很简单，如下图。**
![在这里插入图片描述](https://img-blog.csdnimg.cn/c521a3350ac34b568b0fa6a09795c446.png)
1. 当Reference不配置mock属性或者属性为false时，表示不进行降级，直接调用代理对象即可
2. 以属性以force开头时，表示直接进行降级，都不会发生网络调用
3. 其他请求就是在进行网络失败后才进行降级
### 集群容错
过了服务降级这一层，接下来就到了集群容错了。
![在这里插入图片描述](https://img-blog.csdnimg.cn/63ec7136e71c4af897655ac2e3d3bb22.png)

dubbo中有很多集群容错策略

| 容错策略 | 解释 |代理类|
|--|--|--|
|AvailableCluster|找到一个可用的节点，直接发起调用|AbstractClusterInvoker匿名内部类|
| FailoverCluster |  失败重试（默认）|FailoverClusterInvoker|
| FailfastCluster | 快速失败 |FailfastClusterInvoker|
| FailsafeCluster | 安全失败 |FailsafeClusterInvoker|
|FailbackCluster  | 失败自动恢复 |FailbackClusterInvoker|
| ForkingCluster | 并行调用 |ForkingClusterInvoker|
|BroadcastCluster|广播调用|BroadcastClusterInvoker|

Failover Cluster：失败自动切换，当出现失败，重试其它服务器。通常用于读操作，但重试会带来更长延迟。

Failfast Cluster：快速失败，只发起一次调用，失败立即报错。通常用于非幂等性的写操作，比如新增记录。

Failsafe Cluster：失败安全，出现异常时，直接忽略。通常用于写入审计日志等操作。

Failback Cluster：失败自动恢复，后台记录失败请求，定时重发。通常用于消息通知操作。

Forking Cluster：并行调用多个服务器，只要一个成功即返回。通常用于实时性要求较高的读操作，但需要浪费更多服务资源。可通过 forks=”2″ 来设置最大并行数。

Broadcast Cluster：广播调用所有提供者，逐个调用，任意一台报错则报错 。通常用于通知所有提供者更新缓存或日志等本地资源信息。

**读操作建议使用 Failover 失败自动切换，默认重试两次其他服务器。写操作建议使用 Failfast 快速失败，发一次调用失败就立即报错。**

不知道你发现没？**换集群容错策略就是换DubboInvoker的代理类**

集群容错相关的代理类都有一个共同的属性RegistryDirectory，这个是一个很重要的组件，它用List保存了服务提供者对应的所有Invoker。

更牛逼的是这个List是动态变化的，当服务提供者下线时，会触发相应的事件，调用方会监听这个事件，并把对应的Invoker删除，这样后续就不会调用到下线的服务了。当有新的服务提供者时，会触发生成新的Invoker。

当一个服务的多个Invoker摆在我们面前时，该选择哪个来调用呢？这就不得不提到负载均衡策略了。
| 负载均衡策略实现类 | 解释 |
|--|--|
| RandomLoadBalance | 随机策略（默认）|
| RoundRobinLoadBalance | 轮询策略 |
| LeastActiveLoadBalance | 最少活跃调用数 |
| ConsistentHashLoadBalance | 一致性hash策略 |

**我们只需要通过合适的负载均衡策略来选择即可**

和服务端类似类似，最终能发送网络请求的Invoker还会被Filter对应的Invoker类所代理，一个Filter一个代理类，层层代理。

如下图为Dubbo发送请求时层层调用的过程

![在这里插入图片描述](https://img-blog.csdnimg.cn/e1d548334dee4d4dab868263c6de9d7a.png)

好了，Dubbo一些比较重要的扩展点就分享完了，整个请求响应的基本过程也串下来了！