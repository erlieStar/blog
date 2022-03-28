---
layout: post
title: Redis的基本数据类型都有哪些应用场景啊？
lock: need
---

# 面试官：Redis的基本数据类型都有哪些应用场景啊？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200902215745692.png?)
## 介绍
redis有五种基本数据类型
1. string（字符串）
2. hash（哈希）
3. list（列表）
4. set（集合）
5. zset(sorted set：有序集合)
## string
**缓存**
简单key-value存储

**分布式锁**
setnx key value，当key不存在时，将 key 的值设为 value ，返回1
若给定的 key 已经存在，则setnx不做任何动作，返回0。

当setnx返回1时，表示获取锁，做完操作以后del key，表示释放锁，如果setnx返回0表示获取锁失败，整体思路大概就是这样

**计数器**
如知乎每个问题的被浏览器次数
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190627212603907.png)

```shell
set key 0
incr key // incr readcount::{帖子id} 每阅读一次
get key // get readcount::{帖子id} 获取阅读量
```
**分布式全局唯一id**
分布式全局唯一id的实现方式有很多，这里只介绍用redis实现
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190627212735819.png)

每次获取userId的时候，对userId加1再获取，可以改进为如下形式
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190627212747618.png)

直接获取一段userId的最大值，缓存到本地慢慢累加，快到了userId的最大值时，再去获取一段，一个用户服务宕机了，也顶多一小段userId没有用到

```shell
set userId 0
incr usrId //返回1
incrby userId 1000 //返回10001
```

## hash
redis的散列可以让用户将多个键值对存储到一个Redis的键里面，散列非常适用于将一些相关的数据存储在一起。类似map的一种结构，将结构化的数据，比如一个对象（前提是这个对象没嵌套其他的对象）给缓存到redis中，以后每次读写内存时，就可以操作hash里的某个字段

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

## list
**消息队列**
在list里面一边进，一边出即可

```shell
# 实现方式一
lpush key value //一直往list左边放
brpop key value 10 
//key这个list有元素时，直接弹出，没有元素被阻塞，直到等待超时或发现可弹出元素为止，上面例子超时时间为10s

# 实现方式二
rpush key value
blpop key value 10
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190627212838206.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
**新浪/Twitter用户消息列表（list）**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191009151313265.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
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
## set
**去重**
无序集合，自动去重，将数据放到set中就可去重，可以基于JVM的HashSet去重，如果系统部署在多台机器上，就可以用redis进行全局去重

**抽奖活动**

```shell
sadd key {userId} // 参加抽奖活动
smembers key //获取所有抽奖用户，大轮盘转起来
spop key count //抽取count名中奖者，并从抽奖活动中移除
srandmember key count //抽取count名中奖者，不从抽奖活动中移除
```
**实现点赞，签到，like等功能**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191009151729840.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

```shell
// 1001用户给8001帖子点赞
sadd like::8001 1001
srem like::8001 1001 //取消点赞
sismember like::8001 1001 //检查用户是否点过赞
smembers like::8001 //获取点赞的用户列表
scard like::8001 //获取点赞用户数
```
**实现关注模型，可能认识的人（set）**

可以基于set做交集，并集，差集的操作。如把2个人的粉丝列表弄一个交集，就能看到两个人的共同好友是谁

seven关注的人
sevenSub -> {qing, mic, james}
青山关注的人
qingSub->{seven,jack,mic,james}
Mic关注的人
MicSub->{seven,james,qing,jack,tom}

```shell
//返回sevenSub和qingSub的交集，即seven和青山的共同关注
sinter sevenSub qingSub -> {mic,james}

// 我关注的人也关注他,下面例子中我是seven
// qing在micSub中返回1，否则返回0
sismember micSub qing
sismember jamesSub qing

// 我可能认识的人,下面例子中我是seven
// 求qingSub和sevenSub的差集，并存在sevenMayKnow集合中
sdiffstore sevenMayKnow qingSub sevenSub -> {seven,jack}
```
**电商商品筛选**
![在这里插入图片描述](https://img-blog.csdnimg.cn/2019100915191241.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
每个商品入库的时候即会建立他的静态标签列表如，品牌，尺寸，处理器，内存

```shell
// 将拯救者y700P-001和ThinkPad-T480这两个元素放到集合brand::lenovo
sadd brand::lenovo 拯救者y700P-001 ThinkPad-T480
sadd screenSize::15.6 拯救者y700P-001 机械革命Z2AIR
sadd processor::i7 拯救者y700P-001 机械革命X8TIPlus

// 获取品牌为联想，屏幕尺寸为15.6，并且处理器为i7的电脑品牌(sinter为获取集合的交集)
sinter brand::lenovo screenSize::15.6 processor::i7 -> 拯救者y700P-001
```

## zset
排序的set，可以去重还可以排序，写进去的时候给一个分数，自动根据根据分数排序，分数可以自定义排序规则

redis的zset天生是用来做排行榜的、好友列表, 去重, 历史记录等业务需求
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190627213440547.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

```shell
// user1的用户分数为 10
zadd ranking 10 user1
zadd ranking 20 user2

// 取分数最高的3个用户
zrevrange ranking 0 2 withscores
```