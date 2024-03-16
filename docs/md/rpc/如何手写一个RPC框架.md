---
layout: post
title: 如何手写一个RPC框架？
lock: need
---

# 手写RPC框架：如何手写一个RPC框架？

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020103018110044.jpg?)
## 介绍
当开发一个单体项目的时候，大家肯定都写过类似的代码。即服务提供方和服务调用方在一个服务中

```java
public interface HelloService {
    public String sayHello(String content);
}
```

```java
public class HelloServiceImpl implements HelloService {

    @Override
    public String sayHello(String content) {
        return "hello, " + content;
    }
}
```

```java
public class Test {

    public static void main(String[] args) {
        HelloService helloService = new HelloServiceImpl();
        String msg = helloService.sayHello("world");
        // hello world
        System.out.println(msg);
    }
}
```

但是由于单体服务的诸多弊端，现在很多公司已经将不相关的功能拆分到不同的服务中。

如何像调用本地服务一样调用远程服务呢？这时就不得不提RPC框架了（Remote Procedure Call，远程过程调用）。他帮我们屏蔽了网络通信，序列化等操作的实现，真正做到了调用远程服务和调用本地服务一样方便。

知名的RPC框架有Spring Cloud，阿里巴巴的Dubbo，Facebook的Thrift，Google grpc等

## RPC的调用过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201029221811338.png?)
一个RPC调用的过程如下
1. 调用方发送请求后由代理类将调用的方法，参数组装成能进行网络传输的消息体
2. 调用方将消息体发送到提供方
3. 提供方将消息进行解码，得到调用的参数
4. 提供方反射执行相应的方法，并将结果返回

下面我们就分析一下rpc框架是怎么实现的？有哪些地方可以扩展。
为了让大家有一个更形象的认识，我写了一个github项目，由简到难实现了一个rpc框架，欢迎star

https://github.com/erlieStar/simple-rpc
## 生成代理类
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210617201331983.png?)

前面我们说过，调用方执行方法后，实际上执行的是代理类的方法，代理类帮我们进行序列化和编解码操作。那么如何生成代理类呢？

我们看一下主流的做法。

Facebook的Thrift和Google的grpc都是定义一个schema文件，然后执行程序，帮你生成客户端代理类，以及接口。调用方直接用生成的代理类来请求，提供方继承生成的接口即可。

**这种方式最大的优点就是能进行多语言通信**，即一份schema文件可以生成Java程序，也可以生成Python程序。调用方是Java程序，提供方是Python程序都能正常进行通讯。**而且是二进制协议，通讯效率比较高**。

在Java中生成代理类的方式有如下几种

1. JDK动态代理（实现InvocationHandler接口）
2. 字节码操作类库（如cglib，Javassist）

在Dubbo中提供了2种生成代理类的方式，jdk动态代理和Javassist，默认是javassist，**至于原因吗？当然是javassist的效率更高**

## 协议
为什么需要协议这个东西呢？Spring Cloud是通过Http协议来进行通讯的，那么Dubbo是通过哪种协议来进行通讯的？

**为什么需要协议这个东西？**

因为数据是以二进制的形式在网络中传输中，RPC的请求数据并不是以一个整体发送到提供方的，而是可能被拆分成多个数据包发送出去，那提供方怎么识别数据呢？

例如一个文本ABCDEF，提供方有可能依次收到的数据为ABC DEF，也有可能为AB CD EF。提供方该怎么处理这些数据呢？

简单啊，定个规则就可以了。这个规则可以有很多种，这里举3个例子

1. **定长协议**，协议内容长度固定，如读取到50个byte就开始decode操作，可以参考Netty的FixedLengthFrameDecoder
2. **特殊结束符**，定义一个消息结束的分隔符，如读到\n，表示一个数据读取完毕了，没有读到就一直读，可以参考Netty的DelimiterBasedFrameDecoder
3. **变长协议（协议头+协议体）**，用一个定长来表示消息体的长度，剩下的内容为消息体，如果你愿意的话，协议头还会放一些常用的属性，Http协议的Header就是协议头，如content-type，content-length等。可以参考Netty的DelimiterBasedFrameDecoder

**Dubbo通过自定义协议来进行通讯**（是一种变长协议，即协议头+协议体）
![在这里插入图片描述](https://img-blog.csdnimg.cn/202010301346551.jpg?)
每个位代表的含义如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/202010301351057.png?)


**Dubbo为什么要自定义协议，而不用现成的Http协议？**

**最主要的原因就是自定义协议可以提高性能**

1. Http协议的请求包比较大，有很多无用的内容。自定义协议可以精简很多内容
2. Http协议是无状态的，每次都要重新建立连接，响应完毕后将连接关闭

### 如何自定义协议？

## 序列化
协议头的内容是通过位来表示的，协议体在应用程序中则会被封装成对象，如Dubbo将请求封装成Request，将响应封装成Response

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201030095049568.png)


前面我们说过网络传输的数据必须是二进制数据，但调用方的入参和提供方的返回值都是对象，因此需要序列化和反序列化的过程

序列化的方式有如下几种

1. JDK原生序列化
2. JSON
3. Protobuf
4. Kryo
5. Hessian2
6. MessagePack

我们选择序列化的方式时，主要考虑如下几个因素

1. 效率
2. 空间开销
3. 通用性和兼容性
4. 安全性

## 通讯

常见的IO模型有如下四种
1. 同步阻塞IO（Blocking IO）
2. 同步非阻塞IO（Non-blocking IO）
3. IO多路复用（IO Multiplexing）
4. 异步IO（Asynchronous IO）

这4种IO模型我就不分别阐述了，看如下这篇文章

[10分钟看懂， Java NIO 底层原理](https://blog.csdn.net/zzti_erlie/article/details/109302172)

因为RPC一般用在高并发的场景下，因此我们选择IO多路复用这种模型，Netty的IO多路复用基于Reactor开发模式来实现，后续的文章我会分析一下这种开发模式是如何支持高并发的

## 注册中心

**注册中心的作用和电话簿类似**。保存了服务名称和具体的服务地址之间的映射关系，当我们想和某个服务进行通信时，只需要根据服务名就能查到服务的地址。

**更重要的是这个电话簿是动态的**，当某个服务的地址改变时，电话簿上的地址就会改变，当某个服务不可用时，电话簿上的地址就会消失

这个动态的电话簿就是注册中心。

注册中心的实现方式有很多种，Zookeeper，Redis，Nocas等都可以实现

介绍一下用Zookeeper实现注册中心的方式

zookeeper有两种类型的节点，**持久节点和临时节点**

**当我们往zookeeper上注册服务的时候，用的是临时节点**，这样当服务断开时，节点能被删除

| 节点类型 | 解释 |
|--|--|
| 持久节点 |  将节点创建为持久节点，数据会一直存储在zookeeper服务器上，即使创建该节点的客户端与服务端的会话关闭了，该节点依然不会被删除|
| 持久顺序节点|在持久节点的基础上增加了节点有序的特性|
| 临时节点 | 将节点创建为临时节点，数据不会一直存储在zookeeper服务器上，当创建该临时节点的客户端会话关闭时，该节点在相应的zookeeper服务器上被删除 |
|临时顺序节点|在临时节点的基础上增加了节点有序的特性|

**注册中心全部挂掉该怎么通信？**

当一台zookeeper挂掉后，会自动切换到另一个zookeeper。全部挂掉也没有关系，因为dubbo把映射关系保存了一份在本地，这个映射关系可以保存在Map中，也可以保存在文件中

**新的服务注册到注册中心，本地缓存会更新吗？**

注册了监听的话，当然会更新啊。当被监听的节点或者子节点发生变化的时候，会将相应的内容推送给监听的客户端，你就可以更新本地的缓存了

Zookeeper中的事件如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201030180243247.jpeg?)
**你可以把这个监听理解为分布式的观察者模式**

## 负载均衡策略
对于同一个服务我们不可能只部署一个节点，每次调用的时候我们需要选一个节点来发起调用，这就涉及到负载均衡策略了

常见的负载均衡策略如下：
1. 随机
2. 轮询
3. 一致性hash
## 小结

当然一个成熟的RPC框架还得考虑很多内容，例如路由策略，异常重试，监控，异步调用等，和主流程相关度不大，就不多做介绍了