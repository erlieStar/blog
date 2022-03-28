---
layout: post
title: RocketMQ是如何存储消息的？
lock: need
---

# RocketMQ源码解析：RocketMQ是如何存储消息的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210417191903114.jpg?)
## Broker端使用到的文件
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210417191931607.png?)
我们先来看一下RocketMQ的消息存储流程，当消息发送到RocketMQ上时，会被顺序写入CommitLog文件，这样能保证消息存储的高性能和高吞吐量。

但是消息是按照Topic来消费的，如果消费时从CommitLog上查找对应的消息时，会比较慢。为了提高消息消费的效率，RocketMQ会将Topic一样的消息放在ConsumerQueue中，每个ConsumerQueue又分为几个写队列，一个队列一个文件。

假如创建一个名为TopicTest的topic，并创建4个写队列。那么在RocketMQ是通过如下形式存储的
![在这里插入图片描述](https://img-blog.csdnimg.cn/96d158e032184d85870f5c2651406fab.png)
需要注意的是，CommitLog和ComsumerQueue并不是将相同的消息存储了2份。CommitLog存储了消息原始的内容，而ComsumerQueue主要存储了消息在CommitLog中的偏移量，具体的消息格式看下图
![请添加图片描述](https://img-blog.csdnimg.cn/a5ed8222e1864089a8ac4df7a6dc2401.png?)
**borker端存储的消息格式如下**
| 内容 | 解释 |长度|
|--|--|--|
| TOTALSIZE |  消息总长度|4字节|
| MAGICCODE | 魔术，固定值Oxdaa320a7  |4字节 |
| BODYCRC | 消息crc校验码 |4字节 |
| QUEUEID | 消息队列id | 4字节|
| FLAG | 消息flag，供应用程序使用 |4字节 |
| QUEUEOFFSET | 消息在消费队列的偏移量 |8字节 |
|PHYSICALOFFSET  | 消息在CommitLog文件中的偏移量 | 8字节|
| SYSFLAG | 消息系统flag，例如是否压缩，是否是事务消息等 | 4字节|
|BORNTIMESTAMP  | 生产者调用消息发送API的时间戳 | 8字节|
|BORNHOST  | 消息发送者ip，端口号 | 8字节|
|STORETIMESTAMP  |消息存储时间戳  | 8字节|
| STOREHOSTADDRESS | Broker服务器ip+端口号 |8字节 |
| RECONSUMETIMES | 消息重试次数 |4字节 |
|  Prepared Transaction Offset| 事务消息物理偏移量 | 8字节|
| BodyLength | 消息体长度 | 4字节|
| Body | 消息体内容 | BodyLength字节|
| TopicLength |topic长度，1字节，即主题名称不能超过255个字符  | 1字节|
| Topic | 主题 | TopicLength字节|
|  PropertiesLength | 消息属性长度 |2字节 |
| Properties  | 消息属性 | PropertiesLength字节|

ConsumerQueue中消息的格式如下

![请添加图片描述](https://img-blog.csdnimg.cn/23c4b59e7a7a4de9876125426944af99.png)

**根据commitlog offset 和 size 就能从IndexFile中获取到具体的消息内容，而 tag hashcode 用来根据topic+tag消费时过滤消息**

从存储图看到还有一个IndexFile和CommitLog也有关系

**IndexFile的主要作用就是用来根据Message Key和Unique Key查找对应的消息**

IndexFile文件结构如下所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210509165729959.png?)
从图中可以看出，IndexFile主要分为如下3部分，IndexHead，Hash槽，Index条目

**IndexHead的格式如下**
| 字段 | 解释 |
|--|--|
|beginTimestamp  | 消息的最小存储时间 |
|endTimestamp  | 消息的最大存储时间 |
|beginPhyOffset  | 消息的最小偏移量（commitLog文件中的偏移量） |
| endPhyOffset | 消息的最大偏移量（commitLog文件中的偏移量） |
| hashSlotCount | hash槽个数 |
| indexCount | index条目当前已使用的个数 |

**Hash槽存储的内容为落在该Hash槽内的Index的索引（看后面图示你就会很清楚了）**

每个Index条目的格式如下
| 字段 | 解释 |
|--|--|
| hashcode | key的hashcode |
| phyoffset | 消息的偏移量（commitLog文件中的偏移量） |
| timedif | 该消息存储时间与第一条消息的时间戳的差值，小于0该消息无效 |
| pre index no | 该条目的前一条记录的Index索引，当hash冲突时，用来构建链表 |

key的组成有如下两种形式
1. Topic#Unique Key
2. Topic#Message Key

Unique Key是在producer端发送消息生成的

```java
// DefaultMQProducerImpl#sendKernelImpl
if (!(msg instanceof MessageBatch)) {
    MessageClientIDSetter.setUniqID(msg);
}
```

Message Key是我们在发送消息的时候设置的哈，通常具有业务意义，方便我们快速查找消息

```java
// 指定 topicName，tagName，MessageKey，消息内容，然后发送消息
String messageKey = UUID.randomUUID().toString();
Message message = new Message(TOPIC_NAME, TAG_NAME, messageKey,
        ("hello rocketmq " + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
SendResult sendResult = producer.send(message);
System.out.println(sendResult);
```

**IndexFile构成过程比较麻烦，画图演示一下把，你可以把IndexFile想成基于文件实现的HashMap**。

假如说往数组长度为10的HashMap依次放入3个key为11，34，21的数据（以尾插法演示了哈），HashMap的结构如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021042316522844.png?)

**将key为11，34，21的数据放到IndexFile中的过程如下（假如hash槽的数量为10**）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210509155655982.png?)

具体的过程为
1. 将消息顺序放到Index条目中，将11放到index=1的位置（用index[1]表示哈），11%1=1，算出hash槽的位置是1，存的值是0（刚开始都是0，用hash[0]表示），将index[1].preIndexNo=hash[0]=0，hash[0]=1（1为index数组下标哈）
2. 将34放到index[2]，34%10=4，index[2].preIndexNo=hash[0]=0
3. 将21放到index[3]，21%10=1，index[3].preIndexNo=hash[1]=1

从图中可以看出来，当发生hash冲突时Index条目的preIndexNo属性充当了链表的作用。查找的过程和HashMap基本类似，先定位到槽的位置，然后顺着链表找就行了。

对具体算法感兴趣的可以看看源码，我就不贴代码了，有点多也不重要

```java
// IndexFile的构建过程
org.apache.rocketmq.store.index.IndexFile#putKey

// IndexFile的查找过程
org.apache.rocketmq.store.index.IndexFile#selectPhyOffset
```
## 其他文件
除了上述三种文件外，在rocketmq store文件夹下还有如下几种其他文件

![在这里插入图片描述](https://img-blog.csdnimg.cn/c90c73401af9460da8435f282da86003.png)

lock：有时候一台机器上会起多个broker，如果数据文件放在一个目录，这时候可以通过锁来提示你使用另一个目录，防止冲突

checkpoint：文件检查点，存储commitLog最后一次刷盘时间戳，consumeQueue最后一次刷盘时间戳，IndexFile最后一次刷盘时间戳

config：运行期间一些配置信息

abort：如果存在abort文件说明Broker非正常关闭，该文件默认启动时创建，正常退出时删除

![请添加图片描述](https://img-blog.csdnimg.cn/ad15b732e7114c56996024153021d0c9.png)
## 源码解析
消息写入commitLog的过程比较重要，后面会开单独的章节来分析，这次我们就分析一下从CommitLog读取数据构建ConsumeQueue和IndexFile的过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/4d9b2f5c056e4cd08983435912a32ab4.png?)
ReputMessageService每隔1ms执行一次doReput，构建ConsumeQueue和IndexFile

DefaultMessageStore.ReputMessageService#run
![在这里插入图片描述](https://img-blog.csdnimg.cn/83f2503c441041529e2a0facf09e7515.png?)
如下图所示，我挑了一部分比较重要的代码，标红的就是执行构建的过程。接着的一块代码和长轮询相关（长轮询相关的内容我们后面会详细介绍）

DefaultMessageStore.ReputMessageService#doReput
![在这里插入图片描述](https://img-blog.csdnimg.cn/5ee55540ab154cf4b7470f513e7a4831.png?)
在dispatcherList中总共有2个类
CommitLogDispatcherBuildConsumeQueue：用来构建ConsumeQueue
CommitLogDispatcherBuildIndex：用来构建IndexFile


DefaultMessageStore#doDispatch
![在这里插入图片描述](https://img-blog.csdnimg.cn/ecee46941153486c9140609b459d2a42.png)
### 构建ConsumeQueue
![在这里插入图片描述](https://img-blog.csdnimg.cn/829c799520be4966b108dff8caf2d8fb.png?)
非事务消息，事务提交消息会被放入ConsumeQueue。而半消息和回滚消息则不会，因为他们不会被用户消费哈
### 构建IndexFile
![在这里插入图片描述](https://img-blog.csdnimg.cn/73fe8b3019204ccd99c11d0183a7d1dc.png)
前面演示过了哈，构建IndexFile的过程和往hashmap放值类似。

可以看到key的形式有如下两种
1. Topic#Unique Key
2. Topic#Message Key

![在这里插入图片描述](https://img-blog.csdnimg.cn/8bdc75122291463591bba63f1007d591.png?)
下面我们就详细分析commitLog的构建过程