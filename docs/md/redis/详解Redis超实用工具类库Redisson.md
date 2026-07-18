---
layout: post
title: 详解Redis超实用工具类库Redisson
lock: need
---

# Redis实战：详解Redis超实用工具类库Redisson

![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/aa884eca2432c16cee9ed986b2b84243.jpeg)
## Redisson工具类库
**给大家推荐一个基于Redis开发的工具类库，这个类库提供了很多实用的功能，比如限流，布隆过滤器，分布式锁等！**

```java
<dependency>
  <groupId>org.redisson</groupId>
  <artifactId>redisson</artifactId>
  <version>3.16.8</version>
</dependency>
```
我们今天就只分析一下分布式锁的实现，Redisson提供了很多加锁的方式，非阻塞式加锁，阻塞式加锁，加公平锁等。

另外还提供自动延时的功能，当一个任务没有完成任务式，Redisson会通过Watch Dog不断延长锁的期限

**阻塞式获取锁**
```java
// 阻塞式获取锁，并且是重入锁
RLock lock = client.getLock("testLock");
try {
    lock.lock();
    lock.lock();

	// 执行业务逻辑
	
} finally {
    lock.unlock();
    lock.unlock();
}
```
**非阻塞式获取锁**
```java
RLock lock = client.getLock("lock");
if (lock.tryLock()) {
    System.out.println("获锁成功");
} else {
    System.out.println("获锁失败");
}
```
## Redisson如何实现一个可重入锁？
**加锁执行脚本**

脚本入参
| 参数 | 含义 |
|--|--|
| KEYS[1] |锁的名字  |
| ARGV[1] | 锁的超时时间（毫秒） |
| ARGV[2] | 客户端唯一ID:线程ID |

```c
// 锁不存在
if (redis.call('exists', KEYS[1]) == 0) then
    // 新建锁，加锁次数设为1，并设置超时时间
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    // 当前线程已经获取到锁了，将加锁次数加1
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
// 加锁失败
return redis.call('pttl', KEYS[1]);
```

**加锁成功返回nil，否则返回锁的剩余时间**

**解锁执行脚本**

脚本入参
| 参数 | 含义 |
|--|--|
| KEYS[1] |锁的名字  |
| KEYS[2 |解锁消息的频道，频道名为，redisson_lock__channel:{锁的名字} |
| ARGV[1] | 固定为0，Redisson定义解锁消息固定为0 |
| ARGV[2] | 锁的超时时间|
| ARGV[3] | 客户端唯一ID:线程ID |
```c
// 为0表示锁不存在
if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then
    return nil;
end;
// 将加锁次数减1
local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1);
if (counter > 0) then
    // 当前线程持有锁，设置超时时间
    redis.call('pexpire', KEYS[1], ARGV[2]);
    return 0;
else
	// 加锁次数为0了，直接删除锁，并广播释放锁的消息
    redis.call('del', KEYS[1]);
    redis.call('publish', KEYS[2], ARGV[1]);
    return 1;
end;
return nil;
```
**解锁成功为什么要发布消息呢？**

因为阻塞式获取锁的线程并不是一直不断的尝试获取锁，而是会阻塞，当收到解锁的消息后，才会唤醒，重新开始抢锁。

## Redisson如何实现锁的自动延时？

在 Redis 分布式锁的实现中，如果某个线程获取了锁，但在执行业务逻辑时耗时过长，或者锁的过期时间（TTL）设置得太短，锁就会在业务还没跑完时被自动释放。这时，其他线程就能趁虚而入拿到锁，从而导致超卖、数据错乱等并发安全问题。

为了解决这个问题，Redisson 引入了看门狗（Watchdog）机制。简单来说，它就像一个忠诚的保安，只要你的业务还在跑，它就会不断帮你给锁续期

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/da38105a77af158ee6ed54d4dcde76c6.png)

看门狗的核心机制可以总结为如下几个步骤

**1. 触发条件：不显式指定过期时间**。只有当你加锁时没有显式指定锁的释放时间时，看门狗机制才会启动。

- lock.lock(10, TimeUnit.SECONDS); ➔ 不会启动看门狗，10秒后锁必释放
- lock.lock(); ➔ 会启动看门狗

**2.赋予默认过期时间**。加锁成功后，Redisson 会给这个锁设置一个默认的过期时间，默认是 30 秒（由配置项 lockWatchdogTimeout 决定）

**3.开启定时续期任务**。Redisson 内部会启动一个定时任务（基于 Netty 的 HashedWheelTimer 时间轮）。它的触发周期是：lockWatchdogTimeout / 3，也就是默认每 10 秒执行一次

**4.检查并续期**。当 10 秒时间到，看门狗会检查当前线程是否还持有这把锁：
- 如果业务还在执行：看门狗会向 Redis 发送一段 Lua 脚本，把锁的过期时间重新重置为 30 秒。
- 如果业务执行完毕或服务宕机：看门狗停止续命，锁会在剩余的 TTL 到期后自动释放，防止死锁




