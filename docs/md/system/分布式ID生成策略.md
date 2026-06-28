---
layout: post
title: 分布式ID生成策略
lock: need
---

# 分布式ID生成策略
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/462d83b231405ae20f8ba88af034e936.jpeg)
## UUID

```java
// 3eece1c6-5b57-4bce-a306-6c49e44a1f90
UUID.randomUUID().toString()
```

**原理**：基于 MAC 地址、时间戳、命名空间、随机数等组合生成一个 128 位的字节流，通常表示为 32 位的十六进制字符串

**优点**：本地生成，性能极高，没有网络 I/O 损耗。天然去中心化，扩展性极强。

**缺点**：太长且无序：32 位字符串占用空间大，作为数据库主键（如 MySQL InnoDB B+Tree）会导致大量的页分裂和随机 I/O，严重影响写入性能

## 数据库自增ID / 步长模式
利用关系型数据库（如 MySQL）的 auto_increment 特性，但在分布式环境下通过设置不同的起始值和步长来避免冲突。

原理：假设有 2 台 MySQL 实例：

- 实例 A：起始值为 1，步长为 2（生成的 ID：1, 3, 5, 7...）
- 实例 B：起始值为 2，步长为 2（生成的 ID：2, 4, 6, 8...）

**优点**：实现简单，完全具备自增和连续性。

**缺点**：扩容困难：一旦步长确定（如集群拓展到 3 台），需要修改所有数据库的步长配置，运维成本极高。性能瓶颈在单台数据库的写入能力
## 数据库号段模式

为了解决上述数据库自增的性能瓶颈，美团的 Leaf、滴滴的 Tinyid 等开源组件对其进行了改良，演变出了号段模式。

原理：不再是每次生成 ID 都读写一次数据库，而是每次从数据库批量获取一个号段（比如 [1000, 2000]）加载到业务系统的内存中。内存中用完毕后，再去数据库加载下一个号段。

**优点**：大幅降低数据库压力，数据库挂掉后，业务系统靠内存中的号段还能撑一段时间。ID 也是趋势递增的，整型存储，占用空间小。

**缺点**：如果号段将要用尽时，刚好遇到突发大流量，可能会在刷新号段时造成瞬间的线程阻塞（通常采用双缓冲（Double Buffer）机制异步加载来解决）

可以新建一个如下表
```sql
CREATE TABLE `tiny_id_info` (
  `biz_type` varchar(64) NOT NULL DEFAULT '' COMMENT '业务类型，如 order, user',
  `max_id` bigint(20) NOT NULL DEFAULT '1' COMMENT '当前已分配出去的最大ID值',
  `step` int(11) NOT NULL DEFAULT '1000' COMMENT '每次批发的号段长度（步长）',
  `version` bigint(20) NOT NULL DEFAULT '0' COMMENT '乐观锁版本号，用于并发控制',
  PRIMARY KEY (`biz_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

id用完执行如下sql语句

```sql
UPDATE tiny_id_info 
SET max_id = max_id + step, version = version + 1 
WHERE biz_type = 'order' AND version = 0;
```

## 基于 Redis 的 incr

利用 Redis 的原子操作 INCR 或 INCRBY 来生成分布式 ID

**原理**：因为 Redis 是单线程的，天然具备原子性。可以结合时间戳和 Redis 自增值组合成一个唯一的 ID

**优点**：性能比关系型数据库高得多，能够做到连续自增，适合需要严格序列号的业务

**缺点**：引入了新的第三方依赖，需要考虑 Redis 的持久化（RDB/AOF）和高可用（Cluster/Sentinel）。如果 Redis 挂了且数据未完全持久化，重启后可能会导致 ID 重复

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8366246657b2ce11cd9e1a4f6ac15ce9.png)

设置一个key为userId，值为0，每次获取userId的时候，对userId加1再获取

```shell
set userId 0
incr usrId //返回1
```

每获取一次id都会和redis有一个网络交互的过程，因此可以改进为如下形式

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d0d23d7031792185c05741ca8ce42635.png)

直接获取一段userId的最大值，缓存到本地慢慢累加，快到了userId的最大值时，再去获取一段，一个用户服务宕机了，也顶多一小段userId没有用到

```shell
set userId 0
incr usrId //返回1
incrby userId 1000 //返回10001
```

## 雪花算法

由 Twitter 开源的经典分布式 ID 算法，是目前国内互联网公司最常用的方案。它将一个 64 位的 long 型整数分成若干部分：1bit符号位、41bit时间戳位、10bit工作进程位以及12bit序列号位。

**符号位(1bit)**

预留的符号位，恒为零。

**时间戳位(41bit)**

41位的时间戳可以容纳的毫秒数是2的41次幂，一年所使用的毫秒数是：365 * 24 * 60 * 60 * 1000。通过计算可知：

```java
Math.pow(2, 41) / (365 * 24 * 60 * 60 * 1000L);
```
结果约等于69.73年。ShardingSphere的雪花算法的时间纪元从2016年11月1日零点开始，可以使用到2086年，相信能满足绝大部分系统的要求。

**工作进程位(10bit)**

该标志在Java进程内是唯一的，如果是分布式应用部署应保证每个工作进程的id是不同的。该值默认为0，可通过属性设置。

**一般情况这10bit会拆分为2个5bit**

前5个bit代表机房id，最多代表 2 ^ 5 个机房（32 个机房）
后5个bit代表机器id，每个机房里可以代表 2 ^ 5 个机器（32 台机器）

**因此这个服务最多可以部署在 2^10 台机器上，也就是1024台机器**

**序列号位(12bit)**

该序列是用来在同一个毫秒内生成不同的ID。如果在这个毫秒内生成的数量超过4096(2的12次幂)，那么生成器会等待到下个毫秒继续生成。

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f1bf99160029fca246b1422b2d24f576.png)
**优点**：
1. **趋势递增**：高位是时间戳，整体上保证了 ID 按时间先后递增，对数据库索引非常友好
2. **高性能**：本地内存计算（位运算），不依赖第三方系统

**缺点**：**时钟回拨问题**：强烈依赖机器本地时钟，如果服务器发生时钟回拨，可能会导致 ID 重复（通常需要配合 ZooKeeper 或本地逻辑进行时钟容错）

## 生成策略对比

| 策略方案 | 生成性能 | 递增性 | 核心优点 | 核心缺点 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UUID** | 极高 | 无序 | 本地生成，无网络 I/O，完全去中心化，实现极其简单。 | 32位字符串占用空间大；无序会导致 MySQL B+Tree 索引频繁页分裂，严重影响写入性能。 | 临时日志记录、文件命名、不作为数据库主键的业务 Token。 |
| **雪花算法<br>(Snowflake)** | 极高 | 趋势递增 | 64位 Long 类型，节省空间；高位为时间戳，天然按时间趋势递增，对数据库索引友好。 | 强依赖机器本地时钟，若发生**时钟回拨**会导致 ID 重复或服务不可用。 | 绝大多数高并发分布式系统、微服务架构下的数据库主键。 |
| **数据库步长模式** | 低 | 严格递增 | 实现简单，完全具备自增和连续性，符合传统单机数据库使用习惯。 | 强依赖数据库，存在单点性能瓶颈；**扩容极其困难**，一旦确定步长后很难动态增加机器。 | 业务量较小、并发量低、发展初期的系统。 |
| **号段模式<br>(Leaf / Tinyid)** | 高 | 趋势递增 | 批量加载号段至内存，大幅降低数据库压力；数据库宕机后内存号段仍可支撑一段时间，可用性极高。 | ID 不连续（每次重启或切换号段会有跳跃）；号段用尽时突发大流量可能导致瞬时线程阻塞。 | 高可用要求极高、并发量大、能容忍 ID 不连续的电商、支付等大厂核心业务。 |
| **Redis (INCR)** | 高 | 严格递增/趋势递增 | 性能远高于关系型数据库；能够做到严格的原子自增，适合需要连续序列号的业务。 | 引入了新的第三方缓存依赖；需严格配置 Redis 持久化（AOF/RDB）以防重启后 ID 重复。 | 需要严格自增序列（如订单流水号）、系统已有稳定 Redis 集群的场景。 |
## 雪花算法实现

理解了实现思路，我们来把算法实现一遍

```java
public class SnowFlake {

    /**
     * 起始的时间戳
     */
    private final static long START_STMP = 1480166465631L;

    /**
     * 每一部分占用的位数
     */
    private final static long SEQUENCE_BIT = 12; //序列号占用的位数
    private final static long MACHINE_BIT = 5;   //机器标识占用的位数
    private final static long DATACENTER_BIT = 5;//数据中心占用的位数

    /**
     * 每一部分的最大值
     */
    private final static long MAX_DATACENTER_NUM = -1L ^ (-1L << DATACENTER_BIT);
    private final static long MAX_MACHINE_NUM = -1L ^ (-1L << MACHINE_BIT);
    private final static long MAX_SEQUENCE = -1L ^ (-1L << SEQUENCE_BIT);

    /**
     * 每一部分向左的位移
     */
    private final static long MACHINE_LEFT = SEQUENCE_BIT;
    private final static long DATACENTER_LEFT = SEQUENCE_BIT + MACHINE_BIT;
    private final static long TIMESTMP_LEFT = DATACENTER_LEFT + DATACENTER_BIT;

    private long datacenterId;  //数据中心
    private long machineId;     //机器标识
    private long sequence = 0L; //序列号
    private long lastStmp = -1L;//上一次时间戳

    public SnowFlake(long datacenterId, long machineId) {
        if (datacenterId > MAX_DATACENTER_NUM || datacenterId < 0) {
            throw new IllegalArgumentException("datacenterId can't be greater than MAX_DATACENTER_NUM or less than 0");
        }
        if (machineId > MAX_MACHINE_NUM || machineId < 0) {
            throw new IllegalArgumentException("machineId can't be greater than MAX_MACHINE_NUM or less than 0");
        }
        this.datacenterId = datacenterId;
        this.machineId = machineId;
    }

    /**
     * 产生下一个ID
     *
     * @return
     */
    public synchronized long nextId() {
        long currStmp = getNewstmp();
        // 发生时钟回拨
        if (currStmp < lastStmp) {
            throw new RuntimeException("Clock moved backwards.  Refusing to generate id");
        }

        if (currStmp == lastStmp) {
            //相同毫秒内，序列号自增
            sequence = (sequence + 1) & MAX_SEQUENCE;
            //同一毫秒的序列数已经达到最大
            if (sequence == 0L) {
                currStmp = getNextMill();
            }
        } else {
            //不同毫秒内，序列号置为0
            sequence = 0L;
        }

        lastStmp = currStmp;

        return (currStmp - START_STMP) << TIMESTMP_LEFT //时间戳部分
                | datacenterId << DATACENTER_LEFT       //数据中心部分
                | machineId << MACHINE_LEFT             //机器标识部分
                | sequence;                             //序列号部分
    }

    private long getNextMill() {
        long mill = getNewstmp();
        while (mill <= lastStmp) {
            mill = getNewstmp();
        }
        return mill;
    }

    private long getNewstmp() {
        return System.currentTimeMillis();
    }

    public static void main(String[] args) {
        SnowFlake snowFlake = new SnowFlake(2, 3);

        for (int i = 0; i < (1 << 12); i++) {
            System.out.println(snowFlake.nextId());
        }

    }
}
```

**这端代码将workerid分为datacenterId和machineId，如果我们业务上不需要做区分的话，直接使用10位的workerid即可。**

### workerid生成
我们可以通过zookeeper的有序节点保证id的全局唯一性，比如我通过以下命令创建一个永久有序节点

```shell
# 创建一个根节点
create  /test ''
# 创建永久有序节点
create -s /test/ip-port- ''
# 返回 Created /test/ip-port-0000000000
```
**ip和port可以为应用的ip和port，规则你来定，别重复就行**

其中/test/ip-port-0000000000中的0000000000就是我们的workerid

说一个我们原来生产环境遇到的一个workerid重复的问题，生成workid的方式那叫一个简洁

```java
// uid为zookeeper中的一个有序持久节点
List<String> pidListNode = zkClient.getChildren("uid");
String workerId = String.valueOf(pidListNode.size());
zkClient.create("uid", new byte[0], CreateMode.PERSISTENT_SEQUENTIAL);
```
**你能看出来这段代码为什么会造成workid重复吗？**

它把uid子节点的数量作为workid，当2个应用同时执行到第一行代码时，子节点数量是一样的，得到的workerId就会重复。

有意思的是这段代码跑了好几年都没有问题，直到运维把应用的发版效率提高了一点，线上就开始报错了。因为刚开始应用是串行发版，后来改为并行发版
## 附录
### 数据库号段模式，双缓冲机制

传统的号段模式有一个小瑕疵：当内存中的号段刚好用完（比如发到了 2000）的那那一刻，下一个请求必须同步等待发号器去读写一次数据库。如果此时数据库响应稍慢，就会导致这次请求发生瞬时的卡顿（TP99 尖峰）。

为了解决这个问题，美团 Leaf 引入了双缓冲机制：

**原理**：发号器在内存中维护两个号段缓存（Segment-A 和 Segment-B）。

**感知预加载**：当 Segment-A 的号段消耗到一定比例（例如消耗了 10%，还剩 90% 时；或者消耗了 80% 时，可根据并发量调整阈值），发号器会异步启动一个线程去数据库悄悄把下一个号段加载到 Segment-B 中。

**无缝切换**：当 Segment-A 完全用完后，发号器直接将指针秒切换到 Segment-B。整个过程业务请求完全感知不到数据库的存在，真正实现了零阻塞

### 时钟回拨
**时钟回拨是指服务器的系统本地时间突然倒退、变回了过去的某个时间点的现象**

美团的 Leaf 组件为了解决雪花算法（Leaf-Snowflake）中致命的时钟回拨问题，设计了一套非常严密的容错和自愈机制

Leaf 主要通过 「延迟等待」、「历史时间检查」 以及 「基于 ZooKeeper 的周期性时间同步（解决大步长回拨）」 三种手段来共同保障 ID 的唯一性
#### 微小时钟回拨：阻塞等待（Ms 级别）

如果时钟回拨的时间非常短（例如在 5 毫秒以内），Leaf 会选择让当前线程直接“硬挺”过去

逻辑：当算法发现 当前系统时间 < 上一次生成 ID 的时间，且差值 <= 5ms时，程序会调用 Thread.sleep() 让当前线程阻塞等待两倍的差值时间。

结果：等待完成后再次获取时间。如果时间追上了，则正常生成 ID；如果还是回拨状态，则直接抛出异常，报告时钟回拨

#### 大步长时钟回拨：利用 ZooKeeper 周期性上报与校验

如果机器重启后或者 NTP 同步导致时钟回拨了几百毫秒甚至几分钟，单靠 sleep 是无法解决的。Leaf 引入了 ZooKeeper（ZK）来做分布式节点的协调和时间校验

核心流程如下

**周期性上报时间**：Leaf 节点启动后，会在后台开启一个定时任务（每隔 3s），将当前机器的本地时间，以心跳的形式写入到 ZooKeeper 对应顺序节点的 Value 中（形如 {"ip":"xxx", "timestamp":1719582744000}）

**启动时强校验**：当 Leaf 节点发生重启或新加入集群时，它不会盲目信任本地时钟，而是会做两件事：去 ZK 上读取该机器最后一次上报的时间戳。如果 本地当前时间 < ZK最后上报时间，说明发生了时钟回拨，启动失败，直接报错报警。去 ZK 上获取所有其他 Leaf 节点的平均时间。如果 |本地当前时间 - 所有节点平均时间| > 阈值，同样启动失败

**运行中动态感知**：由于每 3 秒会上报一次，如果本地时钟在运行期间回拨了，在下一次上报时，Leaf 会通过对比内存中上一次成功生成 ID 的时间 lastTimestamp。如果 当前时间 < lastTimestamp 且超过 5ms，Leaf 会直接关闭该节点的 ID 生成服务，不再对外提供服务，并触发报警，等待人工介入或时钟追回