---
layout: post
title: 基于Java SPI的可扩展版
lock: need
---

# 手写RPC框架：基于Java SPI的可扩展版

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210604175317588.jpg?)
## 封装服务接口

在之前的章节中，我们基于Java Socket实现了一个极简版本的RPC框架，了解了其实现的大概套路，本节我们就基于Java SPI写一个可扩展的RPC框架。各种组件都有对应的接口，如果你想替换某一个组件的实现，只需要重写接口的实现类，配置一下即可。

rpc框架整体调用流程如下所示。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210605153719602.png?)
老规矩，先封装一个获取学生信息的公共接口
```java
public interface StudentService {

    Student getStudentInfo(Integer id);
}
```

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student implements Serializable {

    private Integer id;
    private String name;
    private Integer age;
}
```

## 工具类
为了让大家更清晰的理解RPC框架的实现，也为了让项目看着更简洁，我就没有抽取对应的API层和配置类，固定从rpc.properties中读取配置信息，所以写了一个读取配置的工具类
```java
@Slf4j
public class PropertiesUtil {

    private static Properties properties;

    static {
        String fileName = "rpc.properties";
        properties = new Properties();
        try {
            properties.load(new InputStreamReader(PropertiesUtil.class.getClassLoader().getResourceAsStream(fileName), "utf-8"));
        } catch (IOException e) {
            log.error("read rpc.properties error", e);
        }
    }

    public static String getProperty(String key) {
        String value = properties.getProperty(key.trim());
        if (StringUtils.isBlank(value)) {
            return null;
        }
        return value.trim();
    }

    public static String getProperty(String key, String defaultValue) {
        String value = properties.getProperty(key.trim());
        if (StringUtils.isBlank(value)) {
            value = defaultValue;
        }
        return value.trim();
    }

    public static Integer getInteger(String key) {
        String value = getProperty(key);
        if (StringUtils.isBlank(value)) {
            return null;
        }
        return Integer.valueOf(value);
    }
    public static Integer getInteger(String key, Integer defaultValue) {
        String value = getProperty(key);
        if (StringUtils.isBlank(value)) {
            return defaultValue;
        }
        return Integer.valueOf(value);
    }
}
```

**基于SPI根据接口获取对应实现的过程也封装了一个工具类，固定返回加载到的第一个实现类（加载顺序我们在之前的章节中提到了哈），否则就报ServiceLoadException。**

目前项目中只有注册中心和负载均衡策略可以通过Java SPI的方式替换，大家理解意思就成，我就不把所有的组件都改成通过SPI的方式加载了

```java
public class SpiUtil {

    public synchronized static <S> S load(Class<S> service) {
        return StreamSupport.stream(ServiceLoader.load(service).spliterator(), false)
                .findFirst().orElseThrow(ServiceLoadException::new);
    }
}
```

```java
public class ServiceLoadException extends RuntimeException {
}
```

对zookeeper的各种操作都是通过curator这个框架来执行的
```java
@Slf4j
public class CuratorZkUtil {

    public static final String ROOT_PATH = "/simple-rpc";
    private static CuratorFramework zkClient;
    // 类似 Map<String, List<String>>
    // 保存服务名和服务提供者地址的映射关系
    private static final Multimap<String, String> serviceMap = ArrayListMultimap.create();
    private static String defaultZkAddress = PropertiesUtil.getProperty("registry.address");

    private CuratorZkUtil() {}

    public static void setZkAddress(String address) {
        defaultZkAddress = address;
    }


    public static CuratorFramework getZkClient() {
        // 重试3次，每次间隔1000ms
        RetryPolicy retryPolicy = new ExponentialBackoffRetry(1000, 3);
        if (zkClient == null) {
            synchronized (CuratorZkUtil.class) {
                if (zkClient == null) {
                    zkClient = CuratorFrameworkFactory.newClient(defaultZkAddress, retryPolicy);
                    zkClient.start();
                }
            }
        }
        return zkClient;
    }

    // 创建节点
    public static void create(CuratorFramework zkClient, String path, boolean isPersistent) {
        try {
            if (zkClient.checkExists().forPath(path) != null) {
                log.info("path {} is already exists", path);
            } else {
                if (isPersistent) {
                    zkClient.create().creatingParentContainersIfNeeded().withMode(CreateMode.PERSISTENT).forPath(path);
                } else {
                    zkClient.create().creatingParentContainersIfNeeded().withMode(CreateMode.EPHEMERAL).forPath(path);
                }
            }
        } catch (Exception e) {
            log.error("createPersistentMode error", e);
            throw new RpcException(e.getMessage(), e);
        }
    }

    // 获取子节点
    public static List<String> getChildrenNodes(CuratorFramework zkClient, String path) {
        log.info("getChildrenNodes param path: {}", path);
        if (serviceMap.containsKey(path)) {
            log.info("hit cache");
            return (List<String>) serviceMap.get(path);
        }
        List<String> result = null;
        try {
            if (zkClient.checkExists().forPath(path) == null) {
                return result;
            }
            result = zkClient.getChildren().forPath(path);
            registryWatcher(zkClient, path);
        } catch (Exception e) {
            log.error("getChildrenNodes error", e);
            throw new RpcException(e.getMessage(), e);
        }
        return result;
    }

    // 注册监听
    public static void registryWatcher(CuratorFramework zkClient, String path) {
        // 1.只能监听子节点，监听不到当前节点
        // 2.不能递归监听，即监听不到子节点下的子节点
        PathChildrenCache cache = new PathChildrenCache(zkClient, path, true);
        PathChildrenCacheListener listener = ((CuratorFramework client, PathChildrenCacheEvent event) -> {
            String changePath = event.getData().getPath();
            changePath = changePath.substring(changePath.lastIndexOf("/") + 1);
            switch (event.getType()) {
                case CHILD_ADDED:
                case CHILD_UPDATED:
                    log.info("child add or update");
                    serviceMap.put(path, changePath);
                    break;
                case CHILD_REMOVED:
                    log.info("child removed");
                    serviceMap.remove(path, changePath);
                    break;
                default:
                    break;
            }
            log.info("eventType: {}, path: {}", event.getType(), changePath);
        });
        cache.getListenable().addListener(listener);
        try {
            cache.start();
        } catch (Exception e) {
            log.error("registryWatcher error", e);
        }
    }

}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210605150503827.png)

创建节点的时候服务节点的名字是持久节点（如com.javashitang.StudentService），服务提供者地址节点是临时节点（192.168.97.137:8080）

在这个工具类中缓存了服务提供者具体地址，保存在serviceMap中。

**此时你可能会问，如果服务提供者宕机了，缓存还在，那岂不是每次调用都会调用失败？**
此时就体现出临时节点的作用，我们对服务提供者地址节点注册了监听，当服务宕机，服务调用者会收到消息，此时就会从本地删除缓存消息

这篇文章是按照服务调用和请求响应的流程组织的

## Consumer端
我们需要在rpc.properteis配置文件中配置zookeeper的地址，key固定为registry.address

rpc.properteis

```properteis
registry.address=myhost:2181
```
```java
public class RpcClient {

    public static void main( String[] args ) {
        // 获取代理类
        StudentService studentService = ConsumerProxy.getProxy(StudentService.class);
        for (int i = 0; i < 5; i++) {
            System.out.println(studentService.getStudentInfo(10));
        }
    }
}
```
在启动类中通过ConsumerProxy工具类获取接口的代理对象，调用接口的方法即可获取到结果

生成代理的方式是通过jdk的动态代理
```java
public class ConsumerProxy {

    public static <T> T getProxy(final Class<T> interfaceClass) {

        return (T) Proxy.newProxyInstance(interfaceClass.getClassLoader(),
                new Class<?>[]{interfaceClass}, new ConsumerInvocationHandler());
    }
}
```

**需要实现InvocationHandler接口完成具体的代理逻辑**

```java
public class ConsumerInvocationHandler implements InvocationHandler {

    public static final AtomicLong INVOKE_ID = new AtomicLong(0);

    private Transporter transporter = new NettyTransport();

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        RpcRequest rpcRequest = RpcRequest.builder()
                .requestId(INVOKE_ID.getAndIncrement())
                .interfaceName(method.getDeclaringClass().getName())
                .methodName(method.getName())
                .paramTypes(method.getParameterTypes())
                .parameters(args)
                .build();
        CompletableFuture<RpcResponse> future = (CompletableFuture<RpcResponse>) transporter.sendRequest(rpcRequest);
        // 阻塞获取结果
        RpcResponse response = future.get();
        if (!response.isSuccess()) {
            throw new RpcException(RpcException.BIZ_EXCEPTION, response.getMessage());
        }
        return response.getResult();
    }
}
```
根据调用的方法，将请求信息封装到RpcRequest请求对象中，服务端会将响应封装到RpcResponse响应对象中，如果调用失败，会抛出RpcException，code为RpcException.BIZ_EXCEPTION

```java
public class RpcException extends RuntimeException {

    public static final int NETWORK_EXCEPTION = 0;
    public static final int BIZ_EXCEPTION = 1;
    public static final int NO_PROVIDER_EXCEPTION = 2;
    public static final int SERIALIZATION_EXCEPTION = 3;

    private int code;

    public RpcException(String message) {
        super(message);
    }

    public RpcException(int code, String message) {
        super(message);
        this.code = code;
    }

    public RpcException(String message, Throwable cause) {
        super(message, cause);
    }

    public RpcException(int code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}
```

### 封装请求对象和响应对象
请求对象
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpcRequest implements Serializable {

    private long requestId;
    private String interfaceName;
    private String methodName;
    private Class<?>[] paramTypes;
    private Object[] parameters;
}
```
响应对象

```java
@Data
@NoArgsConstructor
public class RpcResponse implements Serializable {

    private long requestId;
    private Integer code;
    private String message;
    private Object result;

    public static RpcResponse success(Long requestId, Object result) {
        RpcResponse response = new RpcResponse();
        response.setCode(ResponseCodeEnum.SUCCESS.getCode());
        response.setRequestId(requestId);
        response.setResult(result);
        return response;
    }

    public static RpcResponse fail(Long requestId, String message) {
        RpcResponse response = new RpcResponse();
        response.setCode(ResponseCodeEnum.FAIL.getCode());
        response.setRequestId(requestId);
        response.setMessage(message);
        return response;
    }

    public boolean isSuccess() {
        return this.code.equals(ResponseCodeEnum.SUCCESS.getCode());
    }
}
```
用枚举表示响应状态，成功或者失败

```java
@Getter
@AllArgsConstructor
public enum ResponseCodeEnum {

    SUCCESS(200, "success"),
    FAIL(500, "fail");

    private final int code;
    private final String message;
}
```
### 网络传输层
网络传输接口，目前在项目中写死了都用NettyTransport
```java
public interface Transporter {

    Object sendRequest(RpcRequest request);
}
```

```java
@Slf4j
public class NettyTransport implements Transporter {

    private RegistryService registryService = SpiUtil.load(RegistryService.class);

    @Override
    public CompletableFuture<RpcResponse> sendRequest(RpcRequest request) {
        String serviceName = request.getInterfaceName();
        InetSocketAddress address = registryService.lookup(serviceName);
        Channel channel = ChannelMap.getChannel(address);
        CompletableFuture<RpcResponse> requestFuture = new CompletableFuture();
        ResponseFutureMap.put(request.getRequestId(), requestFuture);
        channel.writeAndFlush(request).addListener((ChannelFutureListener) future -> {
            if (future.isSuccess()) {
                log.info("send msg: {} success", request);
            } else {
                log.error("send msg: {} failed", request);
                future.channel().close();
                requestFuture.completeExceptionally(future.cause());
            }
        });
        return requestFuture;
    }
}
```
通过SPI的方式加载注册中心的实现，根据调用的服务名获取服务端的地址，建立网络连接，发送请求信息

将没有拿到响应的消息放到ResponseFutureMap，当客户端收到响应消息后根据requestId找到对应的CompletableFuture，并完成。这样客户端就能唤醒这个响应消息对应的请求消息的线程，完成业务逻辑

```java
public class ResponseFutureMap {

    private static final Map<Long, CompletableFuture<RpcResponse>> FUTURES = Maps.newHashMap();

    public static void put(Long requestId, CompletableFuture<RpcResponse> future) {
        FUTURES.put(requestId, future);
    }

    public static void received(RpcResponse response) {
        CompletableFuture future = FUTURES.remove(response.getRequestId());
        if (future != null) {
            future.complete(response);
        }
    }
}
```

### 注册中心
注册中心我们只提供了2个方法，服务注册和服务查找
```java
public interface RegistryService {

    /**
     * 服务注册
     */
    void register(String serviceName, InetSocketAddress inetSocketAddress);

    /**
     * 服务查找
     */
    InetSocketAddress lookup(String serviceName);
}
```

```java
@Slf4j
public class ZookeeperRegistryService implements RegistryService {

    private final LoadBalance loadBalance = SpiUtil.load(LoadBalance.class);

    @Override
    public void register(String serviceName, InetSocketAddress inetSocketAddress) {
        CuratorFramework zkClient = CuratorZkUtil.getZkClient();
        String rootPath = new StringBuilder(ROOT_PATH).append("/").append(serviceName).toString();
        CuratorZkUtil.create(zkClient, rootPath, true);
        CuratorZkUtil.create(zkClient, rootPath + inetSocketAddress.toString(), false);
    }

    @Override
    public InetSocketAddress lookup(String serviceName) {
        log.info("serviceName: {}, loadBalance: {}", serviceName, loadBalance);
        CuratorFramework zkClient = CuratorZkUtil.getZkClient();
        String path = new StringBuilder(ROOT_PATH).append("/").append(serviceName).toString();
        List<String> serviceUrls = CuratorZkUtil.getChildrenNodes(zkClient, path);
        if (CollectionUtils.isEmpty(serviceUrls)) {
            throw new RpcException(RpcException.NO_PROVIDER_EXCEPTION, "no provider");
        }
        String targetServiceUrl = loadBalance.selectService(serviceUrls);
        String[] array = targetServiceUrl.split(":");
        return new InetSocketAddress(array[0], Integer.valueOf(array[1]));
    }
}
```
服务查找的时候，通过负载均衡策略确定调用的服务，然后通过Netty建立网络连接，发起调用

```java
@Slf4j
public class ChannelMap {

    private static final NettyClient nettyClient = new NettyClient();

    // 服务地址 -> 对应的网络连接
    private static final Map<String, Channel> channelMap = Maps.newHashMap();

    public static Channel getChannel(InetSocketAddress address) {
        log.info("address: {}", address);
        String key = address.toString();
        if (channelMap.containsKey(key)) {
            Channel channel = channelMap.get(key);
            if (channel != null && channel.isActive()) {
                return channel;
            } else {
                channelMap.remove(key);
            }
        }
        Channel channel = nettyClient.connect(address);
        if (channel != null && channel.isActive()) {
            channelMap.put(key, channel);
        } else {
            throw new RpcException(RpcException.NETWORK_EXCEPTION, "channel is not active");
        }
        return channel;
    }
}
```
因为每次都建立连接非常耗时，所以用ChannelMap保存了服务及其对应的长连接，提高调用的速度
```java
public class NettyClient {

    private NioEventLoopGroup nioEventLoopGroup = new NioEventLoopGroup();
    private Bootstrap bootstrap;

    public NettyClient() {
        Serializer serializer = new KryoSerializer();
        bootstrap = new Bootstrap();
        bootstrap.group(nioEventLoopGroup)
                .channel(NioSocketChannel.class);

        bootstrap.handler(new ChannelInitializer<SocketChannel>() {
            @Override
            protected void initChannel(SocketChannel ch) throws Exception {
                ChannelPipeline pipeline = ch.pipeline();
                pipeline.addLast(new RpcMsgDecoder(serializer, RpcResponse.class));
                pipeline.addLast(new RpcMsgEncoder(serializer, RpcRequest.class));
                pipeline.addLast(new NettyClientHandler());
            }
        });
    }

    public Channel connect(InetSocketAddress inetSocketAddress) {
        Channel channel = null;
        try {
            ChannelFuture future = bootstrap.connect(inetSocketAddress).sync();
            channel = future.channel();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return channel;
    }
}
```

NettyClient在启动的时候添加了3个handler

RpcMsgEncoder：消息编码器
RpcMsgDecoder：消息解码器
NettyClientHandler：处理响应消息
### 负载均衡策略
负载均衡策略接口
```java
public interface LoadBalance {

    String selectService(List<String> serviceUrlList);
}
```

```java
public abstract class AbstractLoadBalance implements LoadBalance {

    @Override
    public String selectService(List<String> serviceUrlList) {
        if (serviceUrlList.size() == 1) {
            return serviceUrlList.get(0);
        }
        return doSelect(serviceUrlList);
    }

    public abstract String doSelect(List<String> serviceUrlList);
}
```
当服务提供者只有一个的时候直接返回即可

```java
@Slf4j
public class RandomLoadBalance extends AbstractLoadBalance {

    private final Random random = new Random();

    @Override
    public String doSelect(List<String> serviceUrlList) {
        log.info("doSelect param serviceUrlList: {}", JsonConvert.obj2Str(serviceUrlList));
        return serviceUrlList.get(random.nextInt(serviceUrlList.size()));
    }
}
```
当服务提供者有多个时，随机选择一个发起调用
### 序列化
```java
public interface Serializer {

    /**
     * 序列化
     */
    byte[] serialize(Object obj);

    /**
     * 反序列化
     */
    <T> T deserialize(byte[] bytes, Class<T> clazz);
}
```

基于Kryo对消息进行序列化和反序列化
```java
@Slf4j
public class KryoSerializer implements Serializer {

    /**
     * 线程不安全，所以放到ThreadLocal中，可以在方法中每次new
     */
    private ThreadLocal<Kryo> kryoThreadLocal = ThreadLocal.withInitial(() -> {
        Kryo kryo = new Kryo();
        return kryo;
    });


    @Override
    public byte[] serialize(Object obj) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             Output output = new Output(outputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            kryo.writeObject(output, obj);
            kryoThreadLocal.remove();
            return output.toBytes();
        } catch (Exception e) {
            log.error("serialize error", e);
            throw new RpcException(RpcException.SERIALIZATION_EXCEPTION, e.getMessage(), e);
        }
    }

    @Override
    public <T> T deserialize(byte[] bytes, Class<T> clazz) {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes);
             Input input = new Input(inputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            kryoThreadLocal.remove();
            return kryo.readObject(input, clazz);
        } catch (Exception e) {
            log.error("deserialize error", e);
            throw new RpcException(RpcException.SERIALIZATION_EXCEPTION, e.getMessage(), e);
        }
    }
}
```

### 编解码器
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210605125149125.png)

编码器
```java
@AllArgsConstructor
public class RpcMsgEncoder extends MessageToByteEncoder {

    private Serializer serializer;
    private Class<?> clazz;

    @Override
    protected void encode(ChannelHandlerContext ctx, Object msg, ByteBuf out) throws Exception {
        // clazz 是 msg 的父类
        if (clazz.isInstance(msg)) {
            byte[] body = serializer.serialize(msg);
            int dataLength = body.length;
            out.writeInt(dataLength);
            out.writeBytes(body);
        }
    }
}
```
解码器

```java
@Slf4j
@AllArgsConstructor
public class RpcMsgDecoder extends ByteToMessageDecoder {

    private Serializer serializer;
    private Class<?> clazz;
    private static final int BODY_LENGTH = 4;

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        if (in.readableBytes() >= BODY_LENGTH) {
            in.markReaderIndex();
            int dataLength = in.readInt();
            if (in.readableBytes() < dataLength) {
                in.resetReaderIndex();
                return;
            }
            byte[] body = new byte[dataLength];
            in.readBytes(body);
            Object object = serializer.deserialize(body, clazz);
            out.add(object);
        }
    }
}
```
### 处理响应消息的业务handler

```java
@ChannelHandler.Sharable
public class NettyClientHandler extends SimpleChannelInboundHandler<RpcResponse> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, RpcResponse msg) throws Exception {
        ResponseFutureMap.received(msg);
    }
}
```

```java
public class ResponseFutureMap {

    private static final Map<Long, CompletableFuture<RpcResponse>> FUTURES = Maps.newHashMap();

    public static void put(Long requestId, CompletableFuture<RpcResponse> future) {
        FUTURES.put(requestId, future);
    }

    public static void received(RpcResponse response) {
        CompletableFuture future = FUTURES.remove(response.getRequestId());
        if (future != null) {
            future.complete(response);
        }
    }
}
```
收到消息时唤醒对应的请求线程，给用户返回结果
## Producer端

```java
public class RpcServer {

    public static void main( String[] args ) {
        StudentService studentService = new StudentServiceImpl();
        // 向注册中心注册
        ServiceMap.registryService(StudentService.class.getName(), studentService);
        NettyServer nettyServer = new NettyServer();
        nettyServer.start();
    }
}
```
手动注册服务到注册中心
```java
public class StudentServiceImpl implements StudentService {

    @Override
    public Student getStudentInfo(Integer id) {
        Student student = Student.builder().id(id).name("test").age(10).build();
        return student;
    }
}
```
### 开启Netty服务

```java
@Slf4j
public class NettyServer {

    public static final int port = PropertiesUtil.getInteger("server.port", 8080);

    public void start() {
        log.info("nettyServer start");
        Serializer serializer = new KryoSerializer();
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        DefaultEventLoopGroup eventLoopGroup = new DefaultEventLoopGroup();

        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            pipeline.addLast(new RpcMsgDecoder(serializer, RpcRequest.class));
                            pipeline.addLast(new RpcMsgEncoder(serializer, RpcResponse.class));
                            pipeline.addLast(eventLoopGroup, new NettyServerHandler());
                        }
                    });
            ChannelFuture future = bootstrap.bind(port).sync();
            future.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

启动的时候添加了3个channelHandler
RpcMsgDecoder：消息解码器
RpcMsgEncoder：消息编码器
NettyServerHandler：处理请求消息并返回响应

```java
@Slf4j
@ChannelHandler.Sharable
public class NettyServerHandler extends SimpleChannelInboundHandler<RpcRequest> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, RpcRequest msg) throws Exception {
        log.info("channelRead0");
        RpcResponse response = invokeMethod(msg);
        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
    }

    public RpcResponse invokeMethod(RpcRequest request) {
        log.info("invokeMethod param request: {}", request.toString());
        Object result;
        try {
            String serviceKey = request.getInterfaceName();
            Object service = ServiceMap.getService(serviceKey);
            Method method = service.getClass().getMethod(request.getMethodName(), request.getParamTypes());
            result = method.invoke(service, request.getParameters());
        } catch (Exception e) {
            log.error("invokeMethod error", e);
            return RpcResponse.fail(request.getRequestId(), e.getCause().getMessage());
        }
        return RpcResponse.success(request.getRequestId(), result);
    }
}
```

根据请求信息定位到具体的方法，通过反射调用后，将响应结果封装到RpcResponse中，并返回

github地址
https://github.com/erlieStar/simple-rpc
## 参考博客