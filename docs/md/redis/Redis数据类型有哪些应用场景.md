---
layout: post
title: Redis数据类型有哪些应用场景？
lock: need
---

# Redis实战：Redis数据类型有哪些应用场景？

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/812a93212e021902c7980e800564b3ef.png)
## 数据类型
redis有五种基本数据类型
1. String（字符串）
2. Hash（哈希）
3. List（列表）
4. Set（集合）
5. Zset(Sorted Set：有序集合)

应对特定高级场景的类型

1. Bitmap（位图）
2. HyperLogLog（基数统计）
3. GEO（地理位置）
4. Stream（流）

| 数据类型 | 应用场景 |
|--|--|
|String  | 单纯的缓存、计数器、分布式锁 |
| List | 简单的消息队列 |
| Hash | 存储结构化对象，如用户信息 |
| Set | 去重，公共关注 |
| Zset | 排行榜，带权重的队列 |
|Bitmap|海量用户签到、二值状态（0/1）统计|
|HyperLogLog|百万级以上的独立访客（UV）粗略统计|
|GEO|存储地理位置的经纬度，附近的人、地图定位距离计算|
|Stream|完善的、高可用的消息队列|
## String

这是最基础的类型，一个键对应一个值。它是二进制安全的，意味着你可以用它存任何东西（从文本到图片、再到序列化的对象）

**常用命令**：SET, GET, INCR, DECR, MSET

**缓存基础数据**：缓存用户信息、商品详情（通常转为 JSON 字符串）

**计数器/限流器**： 利用 INCR 类的原子自增操作，可以用来做网页访问量统计、文章点赞数、或者是限制同一个 IP 每秒访问次数（限流）

如知乎每个问题的被浏览器次数

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/87b1a91765bdac03222721abe8a4913a.png)

```shell
set key 0
incr key // incr readcount::{帖子id} 每阅读一次
get key // get readcount::{帖子id} 获取阅读量
```

**分布式锁**：SET {key} {value} NX PX {time}，被{}标记的变量需要在执行时替换为实际的值


**分布式全局唯一id**：分布式全局唯一id的实现方式有很多，这里只介绍用redis实现
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/505b15430d4011ca3db7cc1f23148f03.png)

每次获取userId的时候，对userId加1再获取，可以改进为如下形式
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/142ec9d15cb6598633dfe20a063163a1.png)

直接获取一段userId的最大值，缓存到本地慢慢累加，快到了userId的最大值时，再去获取一段，一个用户服务宕机了，也顶多一小段userId没有用到

```shell
set userId 0
incr usrId //返回1
incrby userId 1000 //返回10001
```
**共享session**：在分布式架构中，把用户的 Session 信息存放在 Redis 中实现多台服务器共享

## List

底层的实现是一个双向链表（或快速列表），这意味着在列表的头部或尾部插入和删除元素的速度极快（时间复杂度为 $O(1)$）

**常用命令**： LPUSH, RPUSH, LPOP, RPOP, LRANGE

**消息队列（轻量级）**：用 LPUSH 写入消息，用 RPOP（或阻塞版的 BRPOP）读取消息，形成一个先进先出（FIFO）的队列

**最新动态/时间线（Timeline）**

比如微博的消息、朋友圈动态，把最新的消息 LPUSH 进去，获取时用 LRANGE 0 9 拿最新的 10 条

假如说小编li关注了2个微博a和b，a发了一条微博（编号为100）就执行如下命令

```shell
lpush msg::li 100
```
b发了一条微博（编号为200）就执行如下命令：

```shell
lpush msg::li 200
```
假如想拿最近的10条消息就可以执行如下命令（最新的消息一定在list的最左边）：

```shell
lrange msg::li 0 9 //下标从0开始，[start,stop]是闭区间，都包含
```
## Hash

**常用命令**： HSET, HGET, HMGET, HGETALL

键值对的集合，特别适合用来存储对象。可以把它想象成编程语言里的 Map 或 Dictionary

```java
# 设置用户信息
hset student name test
hset student age 10

# 获取用户的所有相关信息
hgetall student
"name"
"test"
"age"
"10"

# 重新设置用户的年龄
hset student age 20

# 获取用户的年龄
hget student age
"20"
```
## Set
无序的、去重的字符串集合。**它不仅能自动帮你去重，还提供了求交集、并集、差集的操作**

**常用命令**： SADD, SREM, SISMEMBER, SINTER（交集）, SUNION（并集）

**唯一性统计/去重**： 比如统计网站的独立 IP 访问量（UV）

**抽奖活动**

```shell
sadd key {userId} // 参加抽奖活动
smembers key //获取所有抽奖用户，大轮盘转起来
spop key count //抽取count名中奖者，并从抽奖活动中移除
srandmember key count //抽取count名中奖者，不从抽奖活动中移除
```
**实现点赞，签到，like等功能**

```shell
// 1001用户给8001帖子点赞
sadd like::8001 1001
srem like::8001 1001 //取消点赞
sismember like::8001 1001 //检查用户是否点过赞
smembers like::8001 //获取点赞的用户列表
scard like::8001 //获取点赞用户数
```
**社交网络关系（共同好友/共同关注）**
- 你的关注列表是一个 Set，你朋友的关注列表是一个 Set。
- 用 SINTER 求交集，就能算出你们的共同关注。
- 用 SISMEMBER 快速判断 A 是否关注了 B。

**电商商品筛选**

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4d959af10557b7acaf74d8bf2b355a05.png)
每个商品入库的时候即会建立他的静态标签列表如，品牌，尺寸，处理器，内存

通过对标签集合做交集来筛选物品
```shell
// 将拯救者y700P-001和ThinkPad-T480这两个元素放到集合brand::lenovo
sadd brand::lenovo 拯救者y700P-001 ThinkPad-T480
sadd screenSize::15.6 拯救者y700P-001 机械革命Z2AIR
sadd processor::i7 拯救者y700P-001 机械革命X8TIPlus

// 获取品牌为联想，屏幕尺寸为15.6，并且处理器为i7的电脑品牌(sinter为获取集合的交集)
sinter brand::lenovo screenSize::15.6 processor::i7 -> 拯救者y700P-001
```
## Zset
在 Set 的基础上，给每个元素关联了一个分数（Score）。Redis 会根据这个分数自动为集合中的元素进行从小到大的排序。元素不能重复，但分数可以相同

**各种排行榜**： 比如游戏积分榜、微博热搜榜、商品销量榜。用 ZINCRBY 增加热度/分数，用 ZREVRANGE 获取前 10 名。

**带有权重的任务队列**： 比如根据任务的优先级（Score）或执行时间戳作为分数，让程序优先处理权重高的任务
## 进阶数据类型

除了上述五大基础类型，Redis 还在后续版本中加入了一些应对特定高级场景的类型：

**Bitmap（位图）**： 基于 String 类型，但可以通过偏移量（Offset）控制每一个 bit 位（0 或 1）。极其节省内存。

用途： 每日签到、用户在线状态统计。一亿用户一天的活跃状态只需要约 12MB 的内存。

**HyperLogLog（基数统计）**： 用来做模糊去重计数。它的特点是无论统计多少个元素的基数，占用的内存都是固定的（约 12KB），标准误差在 0.81% 左右。

用途： 统计海量网页的 UV（独立访客），不需要精准到个位数，但极度在乎内存消耗的场景。

**GEO（地理位置）**： 可以存储地理位置的经纬度，并计算两点之间的距离、获取指定范围内的其他位置。

用途： 附近的人、附近的单车、外卖配送距离计算。

**Stream（流）**： Redis 5.0 引入的全新类型。是一个强大的、支持多消费组（Consumer Group）的持久化消息队列。

用途： 替代传统 List 或 Pub/Sub，作为更完美的分布式消息队列解决方案（支持消息确认 ACK、消息回溯等）
