---
layout: post
title: NameServer是如何存路由信息的？
lock: need
---

# RocketMQ源码解析：NameServer是如何存路由信息的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210417182700145.jpg?)
## NameServer的作用有哪些?

![在这里插入图片描述](https://img-blog.csdnimg.cn/5e9b93b9ab884d26bb1d338b4da10634.png?)

NameServer其实就是一个注册中心。在分布式系统中为了避免单点故障，所有的应用都是以集群的形式提供服务的，RocketMQ也不例外。在RocketMQ中NameServer的具体作用如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210521165606715.png?)
**Broker启动的时候会往所有的NameServer注册自己的信息，由此可以看出NameServer是一个CP系统，即放弃系统的一致性，保证可用性**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210521170138655.png?)

NameServer的路由关系都保存在RouteInfoManager中的4个map中，路由注册，路由删除和路由发现基本都是操作这4个map

```java
// topic -> broker信息
private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;
// brokerName -> 每个broker具体的ip地址
private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
// 
private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;
// brokerAddr -> 具体的心跳信息
private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
```

假如说我们搭建了如下双主双从的集群，集群名字为rocketmq-cluster
| 序号 | ip |架构模式 |
|--|--|--|--|
| 1|  192.168.25.131  |   Master1|
| 2 | 192.168.25.132 |   Master2 |
| 2 | 192.168.25.133 |   Slave1 |
| 2 | 192.168.25.134 |   Slave2 |
相关配置如下
master1
```bash
# 所属集群名字
brokerClusterName=rocketmq-cluster
# broker名字
brokerName=broker-a
# 0 表示 Master, 大于0 表示 Slave
brokerId=0
```
master2
```bash
brokerClusterName=rocketmq-cluster
brokerName=broker-b
brokerId=0
```
slave1
```bash
brokerClusterName=rocketmq-cluster
brokerName=broker-a
brokerId=1
```
slave2
```bash
brokerClusterName=rocketmq-cluster
brokerName=broker-b
brokerId=1
```

假如说我们在rocketmq-cluster集群的broker-a和broker-b上创建一个topic，名字为myTopic，读写队列都默认为4个，消息的分布情况如下图所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210521175359189.png?)

上面4个Map对应的值为

topicQueueTable
```json
{
  "myTopic": [
    {
      "brokerName": "broker-a",
      "readQueueNums": 4,
      "writeQueueNums": 4,
      "perm": 6,
      "topicSynFlag": 0
    },
    {
      "brokerName": "broker-b",
      "readQueueNums": 4,
      "writeQueueNums": 4,
      "perm": 6,
      "topicSynFlag": 0
    }
  ]
}
```
brokerAddrTable

```json
{
  "broker-a": {
    "cluster": "rocketmq-cluster",
    "brokerName": "broker-a",
    "brokerAddrs": {
      "0": "192.168.25.131:10000",
      "1": "192.168.25.133:10000"
    }
  },
  "broker-b": {
    "cluster": "rocketmq-cluster",
    "brokerName": "broker-a",
    "brokerAddrs": {
      "0": "192.168.25.132:10000",
      "1": "192.168.25.134:10000"
    }
  }
}
```
clusterAddrTable

```json
{
  "rocketmq-cluster": [
    "broker-a",
    "broker-a"
  ]
}
```
brokerLiveTable

```json
{
  "192.168.25.131:10000": {
    "lastUpdateTimestamp": 1618750125000,
    "haServerAddr": ""
  },
  "192.168.25.132:10000": {
    "lastUpdateTimestamp": 1618750126000,
    "haServerAddr": ""
  },
  "192.168.25.133:10000": {
    "lastUpdateTimestamp": 1618750129000,
    "haServerAddr": ""
  },
  "192.168.25.134:10000": {
    "lastUpdateTimestamp": 1618750127000,
    "haServerAddr": ""
  }
}
```
## 源码分析
### NameServer启动流程
当运行NamesrvStartup#main方法时，就能启动NameServer
```java
public class NamesrvStartup {

    public static void main(String[] args) {
        main0(args);
    }

    public static NamesrvController main0(String[] args) {

        try {
            NamesrvController controller = createNamesrvController(args);
            start(controller);
            String tip = "The Name Server boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();
            log.info(tip);
            System.out.printf("%s%n", tip);
            return controller;
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }

        return null;
    }

}
```
这个启动流程比较简单，就不追源码了，简单画图总结一下

![请添加图片描述](https://img-blog.csdnimg.cn/0ddb7e473a4b4ac3a5fb5905f75cbc5f.png?)

启动NettyRemotingServer的时候，这几个关键的ChannelHandler需要注意一下

NettyEncoder：编码器，将RemotingCommand转为字节

NettyDecoder：解码器，将字节转为RemotingCommand

NettyServerHandler：用来处理接收到的请求

我们所有发出去的请求都会构建成RemotingCommand对象然后转为byte发送出去，同理接收到的所有请求都会转为RemotingCommand对象，这样方便我们在程序内部进行处理。即RemotingCommand是一个协议对象

协议格式如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/0d891f666cc940beb9666a8fddbc0dc2.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021052117504662.png?)
rocketmq remoting模块的一个继承关系图如下所示

![请添加图片描述](https://img-blog.csdnimg.cn/c963ee8f29364dcf80a39f1de82d1fa3.png?)
RemotingService提供了一个远程服务最基本的方法，开启和关闭

RemotingServer在RemotingService的基础上又抽象出了一个服务提供者需要提供的方法
RemotingClient在RemotingService的基础上又抽象出了一个服务调用者需要提供的方法

NettyRemotingServer基于netty实现服务提供者
NettyRemotingClient基于netty实现服务调用者

NettyRemotingAbstract则是将NettyRemotingServer和NettyRemotingClient一些公共的功能抽象到出来

**至于注册消息处理器是网络请求处理的常规套路，一个请求交给一个处理器来处理，每个处理器又绑定一个线程池**
![请添加图片描述](https://img-blog.csdnimg.cn/4823cec39ddf40e78bfc4d4c46f2ea49.png?)

**NettyRemotingServer处理请求的过程是一个典型的策略模式，针对不同的请求，用不同的NettyRequestProcessor来处理**。

几种常见的NettyRequestProcessor如下，在后面的章节中，我们会详细分析这些类的实现

| NettyRequestProcessor | 作用 |
|--|--|
| PullMessageProcessor | broker端处理消息拉取请求 |
|SendMessageProcessor  | broker端处理消息发送请求 |
| QueryMessageProcessor | broker端处理消息查询请求 |
| DefaultRequestProcessor | nameserver端处理所有类型的请求 |

NameServer端只注册了一个消息处理器DefaultRequestProcessor，所以所有的消息都会交给这个处理器来处理，如注册broker信息，获取topic的路由信息。之所以用一个NettyRequestProcessor来处理，是因为每种请求的实现逻辑并不复杂，没必要再拆分到 不同的NettyRequestProcessor中。

```java
// DefaultRequestProcessor
public RemotingCommand processRequest(ChannelHandlerContext ctx,
    RemotingCommand request) throws RemotingCommandException {

    switch (request.getCode()) {
        case RequestCode.PUT_KV_CONFIG:
            return this.putKVConfig(ctx, request);
        case RequestCode.GET_KV_CONFIG:
            return this.getKVConfig(ctx, request);
        case RequestCode.DELETE_KV_CONFIG:
            return this.deleteKVConfig(ctx, request);
        case RequestCode.QUERY_DATA_VERSION:
            return queryBrokerTopicConfig(ctx, request);
        case RequestCode.REGISTER_BROKER:
            // 注册broker信息
            Version brokerVersion = MQVersion.value2Version(request.getVersion());
            if (brokerVersion.ordinal() >= MQVersion.Version.V3_0_11.ordinal()) {
                return this.registerBrokerWithFilterServer(ctx, request);
            } else {
                return this.registerBroker(ctx, request);
            }
        case RequestCode.UNREGISTER_BROKER:
            return this.unregisterBroker(ctx, request);
        case RequestCode.GET_ROUTEINFO_BY_TOPIC:
            // 获取路由信息
            return this.getRouteInfoByTopic(ctx, request);
            // 省略部分代码
        default:
            break;
    }
    return null;
}

```

### 路由注册
路由注册，路由删除，路由发现的过程都比较简单，都是操作上面说过的那5个map

**borker在启动后会每隔30s向nameserver发送一次注册请求**
```java
// org.apache.rocketmq.broker.BrokerController#start
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

    @Override
    public void run() {
        try {
        	// 每隔30s向nameserver发送一次注册请求
            BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());
        } catch (Throwable e) {
            log.error("registerBrokerAll Exception", e);
        }
    }
}, 1000 * 10, Math.max(10000, Math.min(brokerConfig.getRegisterNameServerPeriod(), 60000)), TimeUnit.MILLISECONDS);
```
根据请求的类型，我们可以发现最终执行到RouteInfoManager#registerBroker方法，然后将信息存在这4个map中

```java
private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;
private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
```
### 路由删除
**而NameServer在启动后每隔10s扫描brokerLiveTable，将当前时间和上次心跳时间lastUpdatetime进行比较，如果超过120s，则认为broker不可用，移除路由表中与该broker相关的所有信息**
```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

    @Override
    public void run() {
        NamesrvController.this.routeInfoManager.scanNotActiveBroker();
    }
}, 5, 10, TimeUnit.SECONDS);
```

```java
private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;
```
### 路由发现
DefaultRequestProcessor#getRouteInfoByTopic

返回TopicRouteData对象，用如下3个map构建TopicRouteData对象

```java
// topic -> broker信息
private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;
// brokerName -> 每个broker具体的ip地址
private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
// brokerAddr -> Filter Server列表，用于类模式消息过滤
private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
```

```cpp
public class TopicRouteData extends RemotingSerializable {
    private String orderTopicConf;
    private List<QueueData> queueDatas;
    private List<BrokerData> brokerDatas;
    private HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
}
```
**当进行消息发送和消费时都会用到TopicRouteData**