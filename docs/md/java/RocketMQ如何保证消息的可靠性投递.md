---
layout: post
title: RocketMQ如何保证消息的可靠性投递？
lock: need
---

# 面试官：RocketMQ如何保证消息的可靠性投递？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422153005761.jpg?)
## 介绍
要想保证消息的可靠型投递，无非保证如下3个阶段的正常执行即可。

1. 生产者将消息成功投递到broker
2. broker将投递过程的消息持久化下来
3. 消费者能从broker消费到消息
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422151636588.png?)
## 发送端消息重试
producer向broker发送消息后，没有收到broker的ack时，rocketmq会自动重试。重试的次数可以设置，默认为2次

```java
DefaultMQProducer producer = new DefaultMQProducer(RPODUCER_GROUP_NAME);
// 同步发送设置重试次数为5次
producer.setRetryTimesWhenSendFailed(5);
// 异步发送设置重试次数为5次
producer.setRetryTimesWhenSendAsyncFailed(5);
```

## 消息持久化
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422151911872.png?)
我们先来了解一下消息的存储流程，这个知识对后面分析消费端消息重试非常重要。

和消息相关的文件有如下几种

1. CommitLog：存储消息的元数据
2. ConsumerQueue：存储消息在CommitLog的索引
3. IndexFile：可以通过Message Key，时间区间快速查找到消息

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210423142738397.png)


整个消息的存储流程如下
1. Producer将消息顺序写到CommitLog中
5. 有一个线程根据消息的队列信息，写入到相关的ConsumerQueue中（minOffset为写入的初始位置，consumerOffset为当前消费到的位置，maxOffset为ConsumerQueue最新写入的位置）和IndexFile
6. Consumer从ConsumerQueue的consumerOffset读取到当前应该消费的消息在CommitLog中的偏移量，到CommitLog中找到对应的消息，消费成功后移动consumerOffset

### 刷盘机制

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210425095357120.png?)
1. **异步刷盘**：消息被写入内存的PAGECACHE，返回写成功状态，当内存里的消息量积累到一定程度时，统一触发写磁盘操作，快速写入 。吞吐量高，当磁盘损坏时，会丢失消息
2. **同步刷盘**：消息写入内存的PAGECACHE后，立刻通知刷盘线程刷盘，然后等待刷盘完成，刷盘线程执行完成后唤醒等待的线程，给应用返回消息写成功的状态。吞吐量低，但不会造成消息丢失

### 主从复制
如果一个broker有master和slave时，就需要将master上的消息复制到slave上，复制的方式有两种

1. **同步复制**：master和slave均写成功，才返回客户端成功。maste挂了以后可以保证数据不丢失，但是同步复制会增加数据写入延迟，降低吞吐量
2. **异步复制**：master写成功，返回客户端成功。拥有较低的延迟和较高的吞吐量，但是当master出现故障后，有可能造成数据丢失

## 消费端消息重试
### 顺序消息的重试
对于顺序消息，当消费者消费消息失败后，消息队列RocketMQ版会自动不断地进行消息重试（每次间隔时间为1秒），这时，应用会出现消息消费被阻塞的情况。所以一定要做好监控，避免阻塞现象的发生

**顺序消息消费失败后不会消费下一条消息而是不断重试这条消息，应该是考虑到如果跨过这条消息消费后面的消息会对业务逻辑产生影响**

**顺序消息暂时仅支持集群消费模式，不支持广播消费模式**

### 无序消息的重试
对于无序消息（普通、定时、延时、事务消息），当消费者消费消息失败时，您可以通过设置返回状态达到消息重试的结果。

**无序消息的重试只针对集群消费方式生效；广播方式不提供失败重试特性，即消费失败后，失败消息不再重试，继续消费新的消息**

**消费时候后，重试的配置方式有如下三种**
1. 返回Action.ReconsumeLater（推荐）
2. 返回Null
3. 抛出异常

```java
public class MessageListenerImpl implements MessageListener {

    @Override
    public Action consume(Message message, ConsumeContext context) {
        //消息处理逻辑抛出异常，消息将重试。
        doConsumeMessage(message);
        //方式1：返回Action.ReconsumeLater，消息将重试。
        return Action.ReconsumeLater;
        //方式2：返回null，消息将重试。
        return null;
        //方式3：直接抛出异常，消息将重试。
        throw new RuntimeException("Consumer Message exception");
    }
}
```
**消费失败后，无需重试的配置方式**

集群消费方式下，消息失败后期望消息不重试，需要捕获消费逻辑中可能抛出的异常，最终返回Action.CommitMessage，此后这条消息将不会再重试。

```java
public class MessageListenerImpl implements MessageListener {

    @Override
    public Action consume(Message message, ConsumeContext context) {
        try {
            doConsumeMessage(message);
        } catch (Throwable e) {
            //捕获消费逻辑中的所有异常，并返回Action.CommitMessage;
            return Action.CommitMessage;
        }
        //消息处理正常，直接返回Action.CommitMessage;
        return Action.CommitMessage;
    }
}
```
**消息重试次数**

**RocketMQ默认允许每条消息最多重试16次，每次消费失败发送一条延时消息到重试队列，同一条消息失败一次将延时等级提高一次，然后再放到重试队列。重试16次后如果还没有消费成功，则将消息放到死信队列中。**

**注意：重试队列和死信队列都是按照Consumer Group划分的**

重试队列topic名字：%RETRY% + consumerGroup
死信队列topic名字：%DLQ% + consumerGroup

**为什么重试队列和死信队列要按照Consumer Group来进行划分？**

**因为在RocketMQ的时候使用一定要保持订阅关系一致。即一个Consumer Group订阅的topic和tag要完全一致，不然可能会导致消费逻辑混乱，消息丢失**

如下任意一种情况都表现为订阅关系不一致
1. 相同ConsumerGroup下的Consumer实例订阅了不同的Topic。
2. 相同ConsumerGroup下的Consumer实例订阅了相同的Topic，但订阅的Tag不一致。

我们可以通过控制台查看各种类型的主题

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422172826251.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422163147169.png?)
消息每次重试的间隔时间如下
| 第几次重试 | 与上次重试的间隔时间 | 第几次重试| 与上次重试的间隔时间|
|--|--|--|--|
|1  | 10 秒 | 9 |  7 分钟|
| 2 | 30 秒 | 10 | 8 分钟 |
| 3 | 1 分钟 | 11 | 9 分钟 |
| 4 |2 分钟  | 12 |10 分钟  |
|5  |3 分钟  | 13 | 20 分钟 |
| 6 |  4 分钟| 14 | 30 分钟 |
| 7 | 5 分钟 | 15 |1 小时  |
| 8 | 6 分钟 | 16 | 2 小时 |

**前面说到RocketMQ的消息重试是通过往重试队列发送定时消息来实现的。** RocketMQ支持18个级别的定时延时，每个级别定时消息的延时时间如下。

```java
// MessageStoreConfig.java
private String messageDelayLevel = "1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h";
```
消息重试只是把定时消息的前2个级别去掉，每次发送下一个级别的定时消息

我们可以设置消费端消息重试次数
1. 最大重试次数小于等于16次，则重试时间间隔同上表描述。
2. 最大重试次数大于16次，超过16次的重试时间间隔均为每次2小时。

```java
Properties properties = new Properties();
// 配置对应Group ID的最大消息重试次数为20次，最大重试次数为字符串类型。
properties.put(PropertyKeyConst.MaxReconsumeTimes,"20");
Consumer consumer =ONSFactory.createConsumer(properties);
```

**那么重试队列中的消息是如何被消费的？**

消息消费者在启动的时候，会订阅正常的topic和重试队列的topic
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210422162736516.png?)

定时消息的实现逻辑也比较简单，可以归纳为如下几步
1. 发送延时消息
  1.1 替换topic为SCHEDULE_TOPIC_XXXX，queueId为消息延迟等级（如果不替换topic直接发到对应的consumeQueue中，则消息会被立马消费）
  1.2 将消息原来的topic，queueId放到消息扩展属性中
  1.3 将消息应该执行的时间放到tagsCode中
2. 将消息顺序写到CommitLog中
3. 将消息对应的信息分发到对应的ConsumerQueue中（topic为SCHEDULE_TOPIC_XXXX总共有18个queue，对应18个延迟级别）
4. 定时任务不断判断消息是否到达投递时间，没有到达则后续执行投递
5. 如果到达投递时间，则从commitLog中拉取消息的内容，重新设置消息topic，queueId为原来的（原来的topic，queueId在消息扩展属性中），然后将消息投递到commitLog中，此时消息就会被分发到对应的队列中，然后被消费