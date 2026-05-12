# Kafka 消息存储
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/58a4e532346c7fe5b8067ee658897902.png)
## 请求处理
Kafka 的中的通信是基于 TCP 进行的，应用层的协议是 Kafka 自定义的。

**Kafka Broker 是如何处理海量用户请求的？**

基于 Reactor 模式，如下图所示
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/98afdd4917eb2f513a64c716bba72af3.png)

Acceptor 监听建立连接事件，然后将连接转交给 Processor，让 Processor 监听读写事件，处理后返回对应的结果。

Processor 会监听多个 socket 读写的请求，放入请求队列，同时监听自己的响应队列，把响应拿出来通过 socket 连接发送回客户端

KafkaRequestHandler 线程池不停的从请求队列中获取请求来处理，这个线程池的默认大小为8个，由 num.io.threads 来控制，处理完请求后的响应，会放入每个 Processor 自己的响应队列中

| 参数名 | 描述 |默认值|
|--|--|--|
|num.network.threads|processor 线程的数量|3|
| queued.max.requests | broker 全局唯一的请求队列，用来保存请求 | 500|
| num.io.threads | 用来处理请求的线程数 | 8|
## Kafka 消息读写
为了保证高可用和高性能，Kafka 会将 一个 topic下的消息 分为多个 partition，存到不同的 broker 上，为了实现负载均衡，Kafka 会尽量把 leader partition 均匀分布在集群各个机器上
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/450e02e363d39dd29267ce9980978f40.png)

创建 topic时，Kafka 为该 topic 的每个分区在文件系统中创建一个对应的文件夹，文件夹名字的格式为\<topic>-<分区号>，假如有一个 topic 名为 order，有两个分区，文件系统会在对应的 broker 上创建2个文件夹 order-0 和 order-1，文件夹中的文件如下图所示
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9135ab0edc13568f7d68fd7fcdbca02e.png)

文件名为消息起始的offset，这样就能通过文件名快速找到对应的消息

| 文件 | 作用 |
|--|--|
|*.log | 日志文件，存储消息 |
|*.index|索引文件，存储偏移量索引|
|*.timeindex|索引文件，存储时间戳索引|

索引文件是按照位移和时间戳升序排序的，可以使用二分查找来索引文件中找消息的索引，时间复杂度为O(logN)

kafka 默认是保留最近7天的数据，每天都会把7天以前的数据给清理掉，包括 .log .index .timeindex 文件

| 参数名 | 描述 |默认值|
|--|--|--|
| log.segment.bytes | 每个日志段文件的大小，即 *.log 文件的大小 | 1GB |
|log.index.interval.bytes|在日志文件中写入多少条数据，就要在索引文件（包括偏移量索引文件和时间戳索引文件）写一条索引，默认是4kb，所以索引本身是稀疏索引|4kb|
|log.retention.hours|消息保留多少个小时|7天|
### Kafka是如何实现高性能读写的？

**Kafka 通过 PageCache 和 顺序写来实现高性能写**

PageCache是操作系统内核用来缓存磁盘文件内容的一块区域
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8575561c73017063e96fc0e4f8338853.png)

这个page cache有什么用呢？我们知道对内存和磁盘进行读写的速度差了好几个数量级，为了避免每次读写文件时，都需要对磁盘进行操作，Linux使用page cache来对文件中的数据进行缓存。

每次读文件时，如果读取的数据在页缓存中已经存在，直接返回，否则将文件中的数据拷贝到页缓存（同时会对相邻的页进行预读取），然后再将页缓存中的数据拷贝给用户

每次写文件时，如果写入的数据所在的页缓存已经存在，则直接把新数据写入到页缓存中即可，否则将文件中的数据拷贝到页缓存，并把新数据写入到页缓存，内核在一定时机把页缓存刷新到文件中

**由于PageCache的存在，当对文件进行顺序读写时性能很高**

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f00e7a9a9b7931b53ad91d7c2602ee28.png)
**传统方式的问题**：应用程序buffer->PageCache->磁盘，通常需要fsync强制落盘，会阻塞等待磁盘。

**Kafka 的做法**：

1. Producer 发来一批消息。
2. Kafka Broker 直接把这批消息追加到 PageCache 中对应的文件尾部（顺序写）。
3. 立即返回 ACK 给 Producer（相当于完成了）。
4. 操作系统在后台异步地将 PageCache 里的脏页刷到磁盘上。

**为什么 PageCache 对写特别重要？**

1. 写操作变成了纯粹的内存操作，速度极快。Kafka 的延迟很低，主要就是因为它不等磁盘。

2. 顺序写入：Kafka 的 Log 是 Append-Only 的，PageCache 对顺序写入特别友好，几乎能跑满磁盘带宽。

3. 批量合并：操作系统可以将多次小的写操作合并成一次大的顺序写，减少磁盘 I/O 次数。

**Kafka 通过 PageCache 和 零拷贝实现高性能读**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b0da23bd9c5574a87ebff27db221a87c.png)
当我们通过普通方式进行文件读取时，会有4次上下文切换，4次数据拷贝

**4次上下文切换**：一次系统调用（比如read()或write()）=用户态->内核态->用户态=2次上下文切换，上图执行了2次系统调用（read()+write()）=4次上下文切换

**传统方式的问题**：磁盘 → PageCache → 应用程序 Buffer → Socket Buffer → 网卡，数据在内存中拷贝了多次（CPU 参与）

**Kafka 的做法**：它使用 sendfile 系统调用（零拷贝技术）。路径变成：磁盘 → PageCache → 网卡。数据直接从 PageCache 拷贝到网卡，完全绕过 Kafka 进程自己的内存。

结果：没有冗余拷贝，没有 CPU 参与，速度极快

**为什么 PageCache 对读特别重要？**
1. 只要消费速度不落后太多，消息大概率还留在 PageCache 里（热数据）。消费者读消息其实是在读内存，而不是读磁盘。
2. 历史数据（冷数据）才需要真正读磁盘，但现代磁盘顺序读性能也还不错
## 副本机制
### 为什么需要ISR
**如果说PageCache和零拷贝是让Kafka“稳”，那么ISR就让Kafka“稳”**

Kafka 的主题（Topic）会拆分成多个分区（Partition），每个分区有多个副本（Replica）分布在不同的 Broker 上。

Leader 副本：负责所有的读写请求。没有它，数据没法写入。

Follower 副本：默默地从 Leader 那里拉取数据，保持同步。

问题来了：**如果 Leader 所在的 Broker 突然宕机了，谁来做新的 Leader？**

ISR 就是用来回答这个问题的。
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4db5278f9fc10d9cbc0799364798c079.png)
### ISR是什么？

当 leader 副本宕机后，会从 follower 副本选一个成本新的 leader 副本，显然不是所有的 follower 副本都有资格去竞选 leader，对于那些落后 leader 进度太多的 follower 而言，它们是没有资格竞选 leader 的，基于这个原因，kafka 引入了 isr 的概念

isr 是 kafka 集群动态维护的一组同步副本集合（in-sync replicas）。leader 副本总是包含在 isr 中的，只有 isr 中的副本才有资格被选举为 leader。follower 在 **replica.lag.time.max.ms** 指定的时间段内没有发送任何拉取请求，就会被移除 isr 列表

| 名词 | 介绍 |
|--|--|
| AR | 分区中的所有副本 |
| ISR | 与 leader 保持同步状态的副本合集 |

| 名词 | 介绍 |
|--|--|
| LEO | 每个分区中最后一条消息的下一个位置 |
| HW | ISR中最小的LEO即为HW，俗称高水位，消费者只能拉取到HW之前的消息 |

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7f540e1a9a3b34ddf19255fe4338e66e.png)
### HW 和 LEO 的更新时机
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ff3e59a8aeeecd177538d4b16513b81c.png)

**leader 和 follower 上的 LEO 是如何更新的？**

| 更新对象 | 更新时机 |
|--|--|
| leader leo | 接收到生产者发送的消息，写入本地磁盘后，更新其 leo 值 |
| leadr hw   | 主要有两个更新时机，一个是 leader leo 更新后，另一个是 remote leo 更新后。具体算法是：取 leadr 副本和所有与 leader 同步的远程副本 leo 中的最小值 |
| remote leo | follower 副本从 leader 副本拉取消息时，会告诉 leader 副本从哪个位移处开始拉取，leader 副本会使用这个位移值来更新 remote leo |
| follower leo | follower 副本从 leader 副本拉取消息，写入到本地磁盘后，更新其 leo 值 |
| folloer hw | follower 副本成功更新完 leo 后，会比较其 leo 值和 leader 副本发来的高水位值，用两者的最小值更新其 hw 值 |

与 leader 副本保持同步的判断条件有两个
1. follower 副本在 isr 中
2. follower 副本向 leader 发送复制请求的时间在 replica.lag.time.max.ms 范围内

> 乍看上去好像这两个条件说的是一回事，毕竟刚才定义ISR时也是用的这个参数。但某些情况下 Kafka 的确可能出现副本已经“追上”了 leader 的进度，但却不在ISR 中的情况——比如，某个从failure中恢复的副本。如果Kafka只判断第一个条件，确定分区HW值时就不会考虑这些未在 ISR中的副本，但这些副本已经具备了“立刻进入 ISR”的资格，因此就可能出现分区HW值越过ISR中副本LEO的情况——这肯定是不允许的，因为分区HW实际上就是ISR中所有副本LEO的最小值（原文来自 Apache Kafka 实战）

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2d41a2a1038a69842bba6e92ca5dc0e3.png)
| 参数名 | 描述 |默认值|
|--|--|--|
| min.insync.replicas | isr 列表必须有多少个副本与 leader 副本保持同步 | 1|
| replica.lag.time.max.ms | follwer 在这个时间段没有发送任何拉取请求，则会被移除 isr 列表 |10s |

min.insync.replicas=2，acks=-1，生产者要求必须有2个副本在 isr 里，并且所有副本全部接收到数据才能算写入成功，一旦 isr 副本里面小于2个，还是可能会导致生产数据被卡住

follower 跟不上的情况主要有如下两种

1. follower 所在机器的性能变差，比如网络负载过高，IO负载过高，CPU负载过高，机器负载过高，都可能导致机器性能变差
2. follower 所在的 borker 进程卡顿，常见的就是 fullgc 问题（比较少）

高水位机制在 leader 切换时可能会发生日志丢失和日志错乱的问题，所以引入了 leader epoch，有兴趣的同学可以参考一下其他的文章

**推荐的最佳实践（兼顾高可用与不丢失）：**

1. 设置 Topic 副本数 = 3
2. 设置 min.insync.replicas = 2
3. 设置生产者 acks=all

**效果为**

ISR 里必须有 2 个副本（Leader + 至少 1 个 Follower）。

写入一条消息，Leader 收到后，必须等至少 1 个 Follower 也复制完成，才返回成功。

这样能容忍 1 台 Broker 宕机：如果 Leader 坏了，ISR 里还有另一个 Follower 可以顶上，数据不丢。
## Kafka 控制器

**控制器组件（Controller）是 Apache Kafka 的核心组件。它的主要作用是在 Zookeeper 的帮助下管理和协调整个 Kafka 集群**

**控制器是如何选举出来的？**

在 Kafka 集群启动的时候，会自动选举一台 broker 出来承担控制器的责任。在启动的过程中每台 broker 都会尝试在zk上创建一个 /controller 临时节点，zk 会保证只有一个 broker 可以创建成功，创建成功的 broker 就是 controller。

一旦控制器对应的 broker 宕机了，此时临时节点消失，集群中的其他节点会一直监听这个临时节点，发现临时节点消失，就争抢再次创建临时节点，保证有一台新的 broker 成为控制器

**控制器保存了哪些数据？**

控制器几乎包含了所有 Kafka 集群的数据，比较重要的数据有
1. 所有 topic 信息，包括具体的分区信息，比如 leader 副本是谁，ISR 集合中有哪些副本等
2. 所有 broker 信息，包括正在运行的 broker，正在关闭的 broker

**控制器有哪些作用？**

1. 集群管理，管理集群中的各个broker，包括broker的上下线，broker的状态变化，partition的副本分配和迁移，
2. leader选举，控制器参与 leader 选举，当某个 partition 的 leader 出现故障时，controller 会协调其他副本参与 leader 选举，选举一个新的 leader 来继续服务，保证了集群的高可用
3. topic管理，管理 topic 的创建，修改和删除操作，同时也负责对 topic 的分区数和副本数等参数进行调节
4. 数据服务，向其他 broker 提供数据服务，控制器上保存了最全的集群元数据信息，其他 broker 会定期获取元数据