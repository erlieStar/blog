---
layout: post
title: Kafka和RocketMQ的区别
lock: need
---
# Kafka和RocketMQ的区别

![请添加图片描述](https://i-blog.csdnimg.cn/direct/f0ca8a1417b84e78bf5e6b77d0fc2f1f.jpeg)
## 存储模型
RocketMQ 和 Kafka 在底层存储模型的设计上有着本质的区别。虽然它们都利用了追加写日志（Append-only Log）和顺序 I/O 来保证高吞吐，但它们组织文件的方式完全不同。

一句话总结：**Kafka 是“每个分区一个文件”，而 RocketMQ 是“所有队列共用一个文件”**
### Kafka 的存储设计是以 Partition（分区）为核心的。

**存储结构**： 在 Kafka 的磁盘上，每个 Topic 的每个 Partition 都对应一个独立的文件夹。在这个文件夹里，数据被切分成多个 Segment（段）文件（包括 .log 数据文件和 .index 索引文件）。

**写入流程**： 消息发送到某个 Partition，Kafka 就直接追加到该 Partition 当前活跃的 Segment 文件末尾。

物理形态：

```java
kafka-data/
├── topicA-partition0/
│   ├── 0000000000.log  <-- 真实消息数据
│   └── 0000000000.index
└── topicB-partition0/
    ├── 0000000000.log
    └── 0000000000.index
```

**优点**

**并发吞吐极高**： 在 Partition 数量有限时，顺序写盘速度极快。

**消费逻辑简单**： 消费者直接顺序读取对应 Partition 的 .log 文件即可，不需要二次转换。

**清理方便**： 可以按 Partition 级别直接物理删除旧的 Segment 文件。

**缺点**

**单机 Partition 上限低（致命弱点）**： 如果单机上的 Topic 或 Partition 数量达到几千上万个，原本的“顺序写”就会退化为磁盘的“随机写”。因为操作系统需要在海量的不同文件句柄之间来回切换磁头，导致 I/O 性能急剧下降
### RocketMQ 的存储模型：集中式 CommitLog + ConsumeQueue

**CommitLog（数据主体）**： 所有的消息（不论属于哪个 Topic、哪个 MessageQueue）全部混合顺序写入到一个统一的文件中，叫做 CommitLog。每个文件固定 1GB，写满创建新文件。

**ConsumeQueue（消息消费队列）**： 既然都混在一起，消费者怎么找？RocketMQ 为每个 MessageQueue 创建了一个轻量级的索引文件，叫 ConsumeQueue。它只存储消息在 CommitLog 中的 物理 Offset、消息大小（Size）和 Tag 的 HashCode。每一个索引条目固定 20 字节。

**IndexFile（哈希索引）**： 提供按 Message Key 或 Unique Key 查询消息的能力（可选）。


```java
store/
├── commitlog/
│   ├── 00000000000000000000       <-- 所有的 Topic 数据全在这里混合追加写入（1GB/个）
│   └── 00000000001073741824
│
├── consumequeue/                  <-- 消费队列索引（按 Topic 和 Queue 维度划分）
│   ├── topicA/
│   │   └── queue0/
│   │       └── 00000000000000000000 <-- 轻量级索引（20字节/条，包含CommitLog Offset、Size、Tag Hash）
│   └── topicB/
│       └── queue0/
│           └── 00000000000000000000
│
└── index/                         <-- IndexFile 目录（哈希索引）
    ├── 20260630120000000          <-- 以创建时间戳命名的索引文件（每个约400MB）
    └── 20260630150000000
```


**优点**

**完美的单机海量队列支持**： 无论你创建几万个 Topic 或队列，在底层写盘时，永远只有当前活跃的 CommitLog 在做绝对的顺序写。因此，RocketMQ 单机可以支撑几万、几十万个队列而性能不衰减。

**极佳的抗压能力**： 写入极为稳定。

**缺点**

**消费时存在随机读**： 消费者先读 ConsumeQueue 拿到 Offset，再写去 CommitLog 读真实数据。如果消费滞后太多（走磁盘而非 PageCache），会产生随机读，对磁盘 I/O 压力较大。

**逻辑较复杂**： 需要异步线程不停地将 CommitLog 的消息转发构建到 ConsumeQueue 中。
## 名字服务（NameServer vs ZooKeeper/KRaft）

在分布式系统中，路由发现（哪个 Topic 在哪台 Broker 上）是核心。两者的路由管理架构完全不同。

**Kafka（重度依赖协调者）**： 早期的 Kafka 依赖 ZooKeeper，现代 Kafka（2.8+ 之后）去 ZK 引入了 KRaft。

无论是 ZK 还是 KRaft，它们的核心都是强一致性协议（CP模型，如 Paxos/Raft）。Broker 之间有严格的 Controller（主控节点） 角色，负责集群的选主、分区分配和元数据变更。

**RocketMQ（去中心化、轻量级）**：

RocketMQ 自研了 NameServer。NameServer 之间互不通信，没有任何状态同步。每个 NameServer 都拥有全量的路由信息。

Broker 启动时，会向所有的 NameServer 上报自己的状态（每 30 秒心跳）。NameServer 属于 AP 模型，极其轻量、高效，某个 NameServer 挂了完全不影响集群运行。
## 高可用与副本机制

当某台物理机器宕机时，两者保证数据不丢失和自动恢复的架构逻辑不同。

**Kafka：分区级（Partition-level）的 Master-Slave**
- 机制： Kafka 的副本是针对 Partition 级别的。一个 Topic 的不同 Partition，其 Leader（主）和 Follower（从）可以错开分布在不同的 Broker 上。
- ISR 机制： Kafka 独创了 ISR（In-Sync Replicas） 动态副本集合。Leader 负责读写，Follower 只负责从 Leader 拉取数据。如果 Leader 挂了，Controller 会从 ISR 集合中自动选举出一个新的 Leader。

**RocketMQ：Broker 级的 Master-Slave**
- 机制： RocketMQ 的主从是针对 Broker 机器 级别的。比如 Broker-A 分为 Broker-A-Master 和 Broker-A-Slave。
- 读写分离与切换： 正常情况下，Producer 和 Consumer 都和 Master 交互。当 Master 堆积积压严重，或者 Master 宕机时，Consumer 会自动切换到 Slave 节点进行读取（旧版本需要结合 DLedger 实现主从自动切换，新版本 5.x 引入了基于 Raft 的自动主备切换组件）

| 对比维度 | Kafka | RocketMQ |
| :--- | :--- | :--- |
| **主从隔离粒度** | **分区（Partition）级别**。<br>每台机器既可以是 A 分区的 Master，也可以是 B 分区的 Slave。 | **机器（Broker）级别**。<br>是 Master 就全是 Master，是 Slave 就全是 Slave。 |
| **Slave（从）能读吗** | **默认不能**（仅用于高可用容灾备份）。 | **能**。<br>在 Master 压力大、消息堆积时，会自动切换由 Slave 提供读取服务。 |
| **自动主从切换** | **天然支持**。<br>依赖 Controller 节点和 ISR 机制，秒级自动选出新 Leader。 | <ul><li>**4.x 及以前：** 默认不支持自动切换，Master 挂了 Slave 只能读不能写。需要结合 DLedger（Raft 协议）才能自动切换。</li><li>**5.x 版本：** 引入了基于 Raft 的自动主备切换架构（Controller 模式）。</li></ul> |
## 消费模型与队列拉取机制（Pull vs Push）
虽然两者的底层通信本质上都是由客户端发起的 Pull（拉取），但在架构抽象和并发设计上不同。

**Kafka：严格的 Partition 绑定**

- 并发限制： Kafka 的一个 Partition 在同一个 Consumer Group 内只能被一个 Consumer 实例消费。
- 架构后果： 如果你的 Topic 只有 4 个 Partition，那么即使你部署了 10 个 Consumer 实例，也有 6 个实例会处于闲置状态（没有活干）。想要提高消费并发度，必须物理上增加 Partition 数量。

**RocketMQ：支持更灵活的消费模式**
- 并发设计： 同样支持类似 Kafka 的集群消费（AllocateMessageQueueStrategy）。
- 广播消费与消息过滤（Tag/SQL）： RocketMQ 架构上天然支持在 Broker 端进行消息过滤（通过 Tag 的 HashCode 或者 SQL92 表达式）。这意味着 Broker 架构内部有专门的计算逻辑，帮客户端过滤掉不需要的消息，减少网络带宽浪费。而 Kafka 的过滤通常需要客户端自己拉回数据后在内存中过滤。
## 延迟消息与事务消息的架构支持
这是两者在业务支持架构上最大的分水岭。

**Kafka（纯粹的管道）**：  Kafka 架构设计的初衷是追求极致的吞吐量，因此它的架构非常纯粹——不提供原生的延迟消息和完善的事务消息机制。如果要实现，需要业务层或者外围组件（如 Kafka Streams）做复杂的二次开发。

**RocketMQ（为业务而生的架构）**：

- 定时/延迟消息： 架构内部自带 SCHEDULE_TOPIC_XXXX 这种系统级转储队列。4.x 版本支持 18 个固定的延迟级别，5.x 版本引入了时间轮机制支持任意精度的定时消息。

- 事务消息（两阶段提交）： 架构内集成了事务反查机制。当 Producer 发送半消息（Half Message）后如果断网或宕机，RocketMQ Broker 会主动回调 Producer 接口询问该事务最终是 Commit 还是 Rollback，在架构层实现了分布式事务的最终一致性。

## 附录
### RocketMQ消息过滤
在实际业务中，我们经常遇到这种情况：同一个 Topic 内有多种消息（如订单 Topic 内有：手机类订单、食品类订单、服装类订单）。不同的微服务只关心其中一种。

- Kafka 的做法： 管道只管无脑输送。消费者必须把整个 Topic 的数据全拉回到自己的内存里，然后写 if-else 代码去过滤。
- RocketMQ 的做法： 提供 Tag 过滤 和 SQL92 过滤，直接在 Broker（服务端）把不需要的数据抠掉，只把消费者想要的数据通过网络发过去
