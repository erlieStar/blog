---
layout: post
title: Netty高性能的秘密是？
lock: need
---

# 手写RPC框架：Netty高性能的秘密是？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201126153809132.jpg)
## 介绍
Netty是一个高性能的NIO网络框架，极大的的降低了网络编程的门槛，并且提供了简单易用的api。

客户端和服务端的启动是一个很简单的模版代码，我们更多的精力是的写处理业务逻辑的ChannelHandler，看几个Demo你就能写一个简单的Http服务器，Im系统等。

相对于Java nio原生api来说，Netty有如下的优点
1. 提供的简单易用的api，实现同一个功能你可以用java nio和netty都实现一下，就知道netty用起来是有多爽了
2. 性能高，稳定性高，如解决了jdk select空轮询的bug
3. 扩展性高，可以复用的组件很多。默认提供了处理http，websocket等协议的handler，各种编解码算法的实现。

## Reactor是如何支持高并发？
Netty的能支持高并发，离不开它的开发模式Reactor
| 类别 | 开发模式|
|--|--|
| BIO | Thread-Per-Connection |
|NIO  | Reactor |
|AIO|  Proactor|

用例子类别一下

BIO：排队打饭
NIO：点餐等待被叫

### Thread-Per-Connection
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201018194908809.png?)

Thread-Per-Connection这种开发模式应该很多人都比较清楚，见名知意，**一个请求创建一个线程**，支持不了高并发，当然你可以用线程池避免线程的重复创建

### Reactor

Reactor的核心流程为
1. 注册感兴趣的事件
2. 扫描是否有感兴趣的事件发生
3. 事件发生后作出相应的处理

Reactor模式的演进过程如下

#### 单Reactor单线程

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201018212234786.jpg?)

**执行流程**

1. Reactor对象通过select监控客户端请求事件，收到事件后通过dispatch分发
2. 如果是建立连接事件，则交给Acceptor通过accept处理连接请求，然后创建一个handler对象处理连接完成后的的后续业务处理
3. 如果是读写事件，则调用对应的handler来处理请求。handler会完成 read->业务处理->send整个完整的业务流程

**优点**

模型简单，整个过程都在一个线程中完成

**缺点**

1. 性能问题，只有一个线程，无法发挥多核CPU的性能。并且当handler在处理请求时，无法处理连接请求，容易导致性能瓶颈

2. 可靠性问题，线程意外终止或者死循环，系统不能接收和处理外部消息，造成节点故障

#### 单Reactor多线程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201018212254290.jpg?)

**执行流程**

1. Reactor对象通过select监控客户端请求事件，收到事件后通过dispatch分发
2. 如果是建立连接事件，则交给Acceptor通过accept处理连接请求，然后创建一个handler对象处理连接完成后的的后续业务处理
3. 如果是读写事件，则调用对应的handler来处理请求
4. handler只负责读取和响应事件，不做具体的业务处理，读取到数据后，会分发给Worker线程池中的某个线程处理业务，处理完毕后将结果返回给handler
5. handler收到响应后返回给client

**优点**

充分利用多核cpu的处理能力

**缺点**

Reactor单线程运行，处理所有事件的监听和响应，在高并发场景容易出现性能瓶颈

#### 主从Reactor多线程

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201018212308273.jpg?)

**Reactor在高并发下容易出现瓶颈，所以将Reactor分为2部分，MainReactor只处理连接事件，SubReactor只处理读写事件**

如果是连接事件MainReactor直接交给Acceptor来处理，如果是读写事件MainReactor交给SubReactor来处理

**当我们在写Netty程序时，会创建2个EventLoopGroup，一个是bossGroup，一个是workerGroup。bossGroup 就用来处理连接请求的，而 workerGroup 是用来处理读写请求的**

EventLoop对应Reactor模式中的Reactor，EventLoopGroup就是EventLoop组成的集合

**MainReactor有一个，在单线程中运行。SubReactor有多个，在多个线程中运行**

推荐你看一下Doug Lea大佬对Reactor模式解释的文章（你用的并发包就是他写的），保证你能有一个更深的印象

http://gee.cs.oswego.edu/dl/cpjslides/nio.pdf

现在我们常用的NIO框架是Netty，在Netty中切换这三种模式就非常方便了，代码如下

**当然Netty做了一定的改进。即单Reactor多线程和主从Reactor多线程中Reactor线程可以是多个**

```java
// 单Reactor单线程
EventLoopGroup eventLoopGroup = new NioEventLoopGroup(1);
ServerBootstrap serverBootstrap = new ServerBootstrap();
serverBootstrap.group(eventLoopGroup);

// 单Reactor多线程
// EventLoopGroup不指定线程数的话默认是cpu核数的2倍
EventLoopGroup eventLoopGroup = new NioEventLoopGroup();
ServerBootstrap serverBootstrap = new ServerBootstrap();
serverBootstrap.group(eventLoopGroup);

// 主从Reactor多线程
EventLoopGroup bossGroup = new NioEventLoopGroup();
EventLoopGroup workerGroup = new NioEventLoopGroup();
ServerBootstrap serverBootstrap = new ServerBootstrap();
serverBootstrap.group(bossGroup, workerGroup);
```
## 参考博客