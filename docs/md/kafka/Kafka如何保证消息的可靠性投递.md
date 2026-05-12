# Kafka 如何保证消息的可靠性投递？
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/497bfda2f04e4d72baa919f55153d511.png)
## 生产者端：确保消息成功写入Broker
**生产者需要确保消息到达了broker**

生产者设置ack参数，决定需要多少 Broker 确认收到消息

| acks的值 | 含义 |
|--|--|
| 0 |  生产者发完不管，不等待确认|
| 1 | Leader 副本写入本地日志即确认（不等待 follower 同步） |
| all 或 -1 | Leader 和所有 ISR（同步副本）都确认写入 |

**ack应答机制**：acks设置为all或-1

**重试与退避**：retries=Integer.MAX_VALUE（Kafka 2.1+ 默认无限重试），配合 retry.backoff.ms 避免频繁重试

**幂等性**：enable.idempotence=true，即使生产者因为网络原因多次发送同一条消息，Broker 也会通过序列号（Sequence Number）去重（可靠性的一部分，但不解决丢失，解决重复）

## Broker端：持久化存储和多副本保障

**一旦消息到了 Broker，需要确保它不会因为硬件故障而丢失**

**多副本机制 (Replication)**： Kafka 将 Partition 分散在不同的 Broker 上。如果一个节点挂了，其他副本可以接管

**ISR 与最小同步副本 (min.insync.replicas)**：如果设置了 acks=all，但 ISR 中只有一个 Leader，那可靠性依然脆弱。通过设置 min.insync.replicas=2，可以强制要求至少有两个副本写入成功，否则生产者会报错

**持久化策略**：Kafka 利用操作系统的页缓存（Page Cache）并异步刷盘。虽然不是每条消息都立刻调用 fsync（为了性能），但配合副本机制，即使单机断电，数据依然在其他副本中

典型的可靠 Broker 集群配置：

- 分区副本数 = 3
- min.insync.replicas = 2
- acks = all
- unclean.leader.election.enable = false

这样集群最多能容忍 1 台 Broker 宕机而不丢消息（因为还有 2 个 ISR 存活）

如果所有的 ISR（同步副本）都挂了，剩下的只有数据版本非常旧的副本。unclean.leader.election.enable 被设置为 true。当 Leader 宕机且没有健康的 ISR 时，系统允许一个落后很多的副本自动成为新 Leader。这个新 Leader 并没有包含之前已经确认的消息，将该参数设为 false（默认值），宁愿牺牲可用性（停止服务）也不要丢失数据
## 消费者端：正确处理已拉取的消息
**手动提交 offset（enable.auto.commit=false）**：默认的自动提交可能会在业务逻辑还没处理完时就更新了 Offset，导致丢失。正确做法： 在业务逻辑处理成功后，手动调用 commitSync 或 commitAsync

**消费幂等性**：在“至少一次 (At-least-once)”投递场景下，消费者可能会重复收到消息（例如处理完业务但提交位移前宕机）。因此，业务方需要实现幂等处理（如通过数据库唯一键、分布式锁等）
