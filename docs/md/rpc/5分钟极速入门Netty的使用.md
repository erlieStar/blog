---
layout: post
title: 5分钟极速入门Netty的使用
lock: need
---

# 手写RPC框架：5分钟极速入门Netty的使用

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210601232444546.jpg?)
## 介绍
当我们用Netty开发网络应用程序时，一般只需要写对应的ChannelHandler即可，在ChannelHandler中处理业务逻辑

Channel是网络通信的载体，你可以把它认为是一个实际的物理连接，Channel有很多种事件，如连接建立，连接关闭，数据读取。随着事件的发生会让Channel处于不同的生命周期，当对应的事件发生时，会回调ChannelHandler接口的对应方法

| 事件回调方法 | 解释 |
|--|--|
| channelRegistered | Channel创建后被注册到EventLoop上 |
| channelUnregistered |Channel创建后未注册或者从EventLoop取消注册  |
| channelActive | Channel处于就绪状态，可以被读写 |
| channelInactive | Channel处于非就绪状态 |
| channelRead | Channel读取到数据 |
| channelReadComplete | Channel读取数据完成 |
| exceptionCaught | 处理过程中ChannelPipeline有错误产生时被调用 |

我们先用Netty实现一个简单的功能，即客户端给服务端发送一条消息，服务端收到后原封不动的返回给客户端

## 客户端

```java
public class EchoClient {

    private final String host;
    private final int port;

    public EchoClient(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public void start() throws InterruptedException {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .remoteAddress(new InetSocketAddress(host, port))
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline().addLast(new EchoClientHandler());
                        }
                    });
            // 连接到远程节点，阻塞等待直到连接完成
            ChannelFuture future = bootstrap.connect().sync();
            // 阻塞，直到Channel关闭
            future.channel().closeFuture().sync();
        } finally {
            // 关闭线程池并且释放所有的资源
            group.shutdownGracefully().sync();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        new EchoClient("127.0.0.1", 8080).start();
    }
}
```

```java
@Slf4j
public class EchoClientHandler extends SimpleChannelInboundHandler<ByteBuf> {

    // 客户端读取到数据
    @Override
    protected void channelRead0(ChannelHandlerContext channelHandlerContext, ByteBuf byteBuf) throws Exception {
        log.info("client channelRead0");
        System.out.println("client accept: " + byteBuf.toString(CharsetUtil.UTF_8));
    }

    // channel可用时做的事情
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        log.info("client channelActive");
        ctx.writeAndFlush(Unpooled.copiedBuffer("hello netty", CharsetUtil.UTF_8));
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

启动客户端，当建立连接的时候，向服务端发送hello netty，服务端收到消息后，原封不动返回给客户端

```java
client channelActive
client channelRead0
client accept: hello netty
```
## 服务端

```java
public class EchoServer {

    private final int port;

    public EchoServer(int port) {
        this.port = port;
    }

    public void start() throws InterruptedException {
        final EchoServerHandler serverHandler = new EchoServerHandler();
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(group)
                    .channel(NioServerSocketChannel.class)
                    .localAddress(new InetSocketAddress(port))
                    .childOption(ChannelOption.TCP_NODELAY, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline().addLast(serverHandler);
                        }
                    });
            // 连接到远程节点，阻塞等待直到连接完成
            ChannelFuture future = bootstrap.bind().sync();
            future.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully().sync();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        new EchoServer(8080).start();
    }
}
```

```java
@Slf4j
@ChannelHandler.Sharable
public class EchoServerHandler extends ChannelInboundHandlerAdapter {

    // 服务端读取到网络数据后做的处理
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        log.info("server channelRead");
        ByteBuf in = (ByteBuf) msg;
        System.out.println("Server received: " + in.toString(CharsetUtil.UTF_8));
        ctx.write(in);
    }

    // 读取完网络数据做的处理
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        log.info("server channelReadComplete");
        ctx.writeAndFlush(Unpooled.EMPTY_BUFFER)
                .addListener(ChannelFutureListener.CLOSE);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

**可以看到我们在EchoServerHandler上加了注解@ChannelHandler.Sharable，而EchoClientHandler上却没有加，那么@ChannelHandler.Sharable这个注解有什么作用呢？**

@ChannelHandler.Sharable标识同一个ChannelHandler的实例可以被多次添加到多个ChannelPipelines中

如果一个ChannelHandler没有标志@ChannelHandler.Sharable，在添加到到一个pipeline中时，你需要每次都创建一个新的handler实例


![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602155416402.png?)

**为什么客户端使用的是SimpleChannelInboundHandler而服务端使用的是ChannelInboundHandlerAdapter？**

在客户端，当channelRead0方法完成时，你已经有来传入消息，并且已经处理完它来，当该方法返回后，SimpleChannelInboundHandler会释放保存该消息的ByteBuf的饮用

在服务端，你需要将传入的消息会传给发送者，而write操作是异步的，直到channelRead方法返回后有可能还没有完成，ChannelInboundHandlerAdapter在这个时间点不会释放消息。

消息在EchoServerHandler的channelReadComplete方法中，当writeAndFlush方法被调用时释放

Netty中有两种类型的ChannelHandler

ChannelInboundHandler：入站事件发生时会触发（收到消息）
ChannelOutboundHandler：出站事件发生时会触发（发送消息）
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602162001911.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021060216520355.png?)
每个Channel都会被分配一个ChannelPipline，ChannelPipline中包含了多个ChannelHandler，当Channel对应的事件发生是，就会回掉对应的方法。**典型的责任链模式**
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021060219452672.png?)
ChannelHandle添加到ChannelPipeline的时候，ChannelHandlerContext被创建ChannelHandlerContext管理它关联的ChannelHandler和同一个ChannelPipeline中其他ChannelHandler的交互
## 参考博客
@Shareable注解
[1]https://blog.csdn.net/anurnomeru/article/details/80537128