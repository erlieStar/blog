---
layout: post
title: 详解Redis超实用工具类库Redisson
lock: need
---

# Redis实战：详解Redis超实用工具类库Redisson

![请添加图片描述](https://img-blog.csdnimg.cn/5c76430347894cd59487aad123f6d3a0.png)
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

为了防止锁不能被正确的释放，我们通常需要给锁设置超时时间，但是这样又会引入新的问题。

假如锁的超时时间设置为10s，但是任务在10s之内没执行完，锁就被释放了，其他线程获取达到锁就会有问题

**为了解决这个问题，Redisson提供了一个watch dog自动延时的机制，即当加锁成功后。开启一个后台线程，传入加锁成功的threadId，后台线程每隔10s检查一下，当前持有锁的线程是否为threadId，是则设置锁的超时时间为30s，接着进行检查，否则不再进行检查。**

![在这里插入图片描述](https://img-blog.csdnimg.cn/2e75e6ef61424a42ab10bb308dbba7b7.png)

**需要注意的是，加锁的时候不能显示指定超时时间，不然看门狗不会生效**

加锁的时候不显示指定锁的超时时间时，锁的超时时间为Config类的lockWatchdogTimeout属性，这个属性的默认值为30s（可以配置），看门狗自动检查的时间恒定为锁的超时时间的1/3


