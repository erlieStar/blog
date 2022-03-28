---
layout: post
title: 用Semaphore实现限流
lock: need
---

# 并发工具类：用Semaphore实现限流

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210220233514179.jpg?)
## 用Semaphore实现限流

在现实生活中我们经常遇到限流的情况，如一个电影院只有2个门，因此每次只能同时检2个人的票。**而Semaphore就是Java中用来控制同时访问特定资源的线程数量**

```java
public class SemaphoreUseDemo {

    public static void main(String[] args) {
        ExecutorService service = Executors.newCachedThreadPool();
        Semaphore semaphore = new Semaphore(2);
        for (int i = 0; i < 8; i++) {
            final int num = i;
            Runnable runnable = () -> {
                try {
                    semaphore.acquire();
                    System.out.println("no " + num + " check");
                    TimeUnit.SECONDS.sleep((long) Math.random() * 200);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release();
                    System.out.println("---- " + "no " + num + " finish");
                }
            };
            service.execute(runnable);
        }
    }
}
```

```java
no 0 check
no 1 check
---- no 1 finish
no 2 check
---- no 2 finish
---- no 0 finish
no 3 check
---- no 3 finish
no 4 check
---- no 4 finish
no 6 check
---- no 6 finish
no 5 check
no 7 check
---- no 7 finish
---- no 5 finish
```
可以看到每次最多同时检票2人，检票完毕一个人才能接着检下一个人的票。

**Semaphore是基于AQS实现的一个共享锁，是Java中一个线程同步的工具类**

Semaphore在使用的时候会定义资源的总量permits，这个permits会被设置为AQS类中的state，state在不同的工具类中有不同的含义，在Semaphore中的含义如下

state>0时，可以获取锁，并将state-1，当state=0时，线程会被阻塞，等待其他线程释放锁。当释放锁时state+1，这样其他线程又能获得锁了。

**当permits被定义为1时，Semaphore相当于互斥锁**


## 源码解析

![在这里插入图片描述](https://img-blog.csdnimg.cn/f135c7e1bdfc473eadb0fbf09da9208c.png)

Semaphore的构造函数有如下两种，permits指定资源数，fair为true和公平锁，否则为非公平锁，**默认是非公平锁，吞吐量较高**

```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}

public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
```

Sync基于AbstractQueuedSynchronizer做了一些针对Semaphore的封装，如设置资源数量，获取资源数量，以及共享锁的释放

**FairSync和NonfairSync的区别比较简单，只是在尝试获取锁这个方式上有区别（tryAcquireShared）**
### acquire获取资源

```java
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```
调用AQS中响应中断的共享锁即可，子类重写尝试获取锁的逻辑即可（tryAcquireShared）

```java
// AQS
public final void acquireSharedInterruptibly(int arg)
        throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    // 小于0获锁失败
    if (tryAcquireShared(arg) < 0)
        // 放到同步队列中并阻塞
        doAcquireSharedInterruptibly(arg);
}
```

我们来看一下公平锁和非公平锁尝试获取锁的逻辑有什么区别？

**公平锁**

```java
// Semaphore.FairSync#tryAcquireShared
protected int tryAcquireShared(int acquires) {
    for (;;) {
    	// 同步队列中有线程，必须排队
        if (hasQueuedPredecessors())
            return -1;
        int available = getState();
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```
同步队列中有线程，则去排队，否则通过CAS加锁

**非公平锁**

```java
// Semaphore.NonfairSync#tryAcquireShared
protected int tryAcquireShared(int acquires) {
    return nonfairTryAcquireShared(acquires);
}
```

```java
// Semaphore.Sync#nonfairTryAcquireShared
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        int available = getState();
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

**可以看到并没有像公平锁一样先排队，而是直接尝试获取锁**

FairSync：每次必须排队获取锁

NonfairSync：先利用CAS获取一下锁，当获取不到锁时，再排队获取锁

### release释放资源

```java
// Semaphore
public void release() {
    sync.releaseShared(1);
}
```

```java
// AbstractQueuedSynchronizer
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
    	// 释放成功，唤醒阻塞队列中的线程
        doReleaseShared();
        return true;
    }
    return false;
}
```
子类重写尝试释放锁的逻辑

```java
// Semaphore.Sync#tryReleaseShared
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        int next = current + releases;
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
        if (compareAndSetState(current, next))
            return true;
    }
}
```
利用cas对state值+1