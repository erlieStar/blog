---
layout: post
title: ReadWriteLock是如何做到读读并行的？
lock: need
---

# 并发工具类：ReadWriteLock是如何做到读读并行的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210225220059396.png?)

## ReadWriteLock的特点
当我们想保证并发安全的时候，我们可以使用ReentrantLock或者synchronized。这样就能做到写写互斥，读写互斥，读读互斥。

鉴于大多数业务场景中都是读多写少，我们有没有可能做到读读并行呢？还真可以，这个类就是ReadWriteLock
```java
@Test
public void testLock() throws IOException {
    ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    ReentrantReadWriteLock.ReadLock readLock = lock.readLock();
    ReentrantReadWriteLock.WriteLock writeLock = lock.writeLock();
    Thread thread1 = new Thread(() -> {
        readLock.lock();
        System.out.println("thread1 read lock " + System.currentTimeMillis());
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("thread1 read unlock " + System.currentTimeMillis());
        readLock.unlock();
    });
    Thread thread2 = new Thread(() -> {
        readLock.lock();
        System.out.println("thread2 read lock " + System.currentTimeMillis());
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("thread2 read unlock " + System.currentTimeMillis());
        readLock.unlock();
    });
    Thread thread3 = new Thread(() -> {
        writeLock.lock();
        System.out.println("thread3 write lock " + System.currentTimeMillis());
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("thread3 write unlock " + System.currentTimeMillis());
        writeLock.unlock();
    });
    thread1.start();
    thread2.start();
    thread3.start();
    System.in.read();
}
```
执行结果
```java
thread1 read lock 1646210521360
thread2 read lock 1646210521360
thread1 read unlock 1646210522362
thread2 read unlock 1646210522362
thread3 write lock 1646210522362
thread3 write unlock 1646210523367
```

从上面的执行结果，**我们可以看到读锁和写锁互斥，但是读锁和读锁可以并行**

![在这里插入图片描述](https://img-blog.csdnimg.cn/3946ce0f50f640f9a93d345d47ea507a.png)

和ReentrantLock类似ReadWriteLock也分为公平锁和非公平锁。到现在估计你也能猜出来公平性和非公平性体现在哪了！
```java
public ReentrantReadWriteLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
    readerLock = new ReadLock(this);
    writerLock = new WriteLock(this);
}
```

从ReadWriteLock的行为我们可以猜到，写锁是互斥锁，读锁是共享锁，但是AQS中只提供了一个state变量来表示锁的状态。

**我们如何用一个变量来存储两种锁的状态呢？**

在ReadWriteLock中是这样做的，state变量的高16位表示读锁的状态，低16位表示写锁的状态

![在这里插入图片描述](https://img-blog.csdnimg.cn/7c7f49984bc448fd8f42e676ca0d472c.png)

## 获取写锁
鉴于写锁的实现比较简单，我们就先看写锁的实现，再看读锁的实现
```java
// WriteLock
public void lock() {
    sync.acquire(1);
}
```

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```
上面的代码我们在AQS中已经分析过了，不再分析了，直接分析加锁的逻辑
```java
// Sync
protected final boolean tryAcquire(int acquires) {
    Thread current = Thread.currentThread();
    int c = getState();
    // 获取写锁的值
    int w = exclusiveCount(c);
    if (c != 0) {
    	// state不为0，写锁为0，说明读锁不为0
        // (Note: if c != 0 and w == 0 then shared count != 0)
        // 1. 读锁不为0
        // 2. 写锁不为0，并且获取写锁的线程不是当前线程，则写锁加锁失败
        if (w == 0 || current != getExclusiveOwnerThread())
            return false;
        // 超过写锁能表示的最大获取次数
        if (w + exclusiveCount(acquires) > MAX_COUNT)
            throw new Error("Maximum lock count exceeded");
        // Reentrant acquire
        // 写锁重入
        setState(c + acquires);
        return true;
    }
    // 没有被加锁，先看看是否需要排队
    if (writerShouldBlock() ||
        !compareAndSetState(c, c + acquires))
        return false;
    // 获锁成功，执行业务逻辑
    setExclusiveOwnerThread(current);
    return true;
}
```
**在这里我们先引入2个概念**

锁升级：同一个线程先申请读锁，再申请写锁，此时能正确申请到写锁
锁降低：同一个线程先申请写锁，再申请读锁，此时能正确申请到读锁

**从上面的源码中我们可以看到申请写锁的时候，只要有读锁就会失败，因此ReadWriteLock并不支持锁升级**

加锁时公平锁和非公平锁的逻辑和ReentrantLock一样
```java
static final class NonfairSync extends Sync {
    // 非公平模式，直接cas去抢锁，抢不到再排队
    final boolean writerShouldBlock() {
        return false; // writers can always barge
    }
}

static final class FairSync extends Sync {
    // 同步队列中有线程则去排队
    final boolean writerShouldBlock() {
        return hasQueuedPredecessors();
    }
}
```

## 释放写锁

```java
// WriteLock
public void unlock() {
    sync.release(1);
}
```

```java
// AQS
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```
直接看释放锁的逻辑
```java
// Sync
protected final boolean tryRelease(int releases) {
    // 解锁的线程和获取锁的线程不一样
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    int nextc = getState() - releases;
    // 写锁是可重入的，判断所有的写锁是否都被释放
    boolean free = exclusiveCount(nextc) == 0;
    if (free)
        setExclusiveOwnerThread(null);
    setState(nextc);
    return free;
}
```
将写锁的加锁次数减一，因为写锁是可重入的。当写锁都被释放时，唤醒同步队列中的线程，否则只是修改次数
## 获取读锁

```java
// ReadLock
public void lock() {
    sync.acquireShared(1);
}
```

```java
// AQS
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```
直接看加锁的逻辑
```java
// Sync
protected final int tryAcquireShared(int unused) {
    Thread current = Thread.currentThread();
    int c = getState();
    // 写锁已经被持有，并且不是持有锁的线程不是当前线程
    if (exclusiveCount(c) != 0 &&
        getExclusiveOwnerThread() != current)
        return -1;
    int r = sharedCount(c);
    // 是否需要排队
    // 是否超过能表示的加锁次数
    // cas加锁
    if (!readerShouldBlock() &&
        r < MAX_COUNT &&
        compareAndSetState(c, c + SHARED_UNIT)) {
        if (r == 0) {
        	// 第一个获取读锁
            firstReader = current;
            firstReaderHoldCount = 1;
        } else if (firstReader == current) {
        	// 读锁重入
            firstReaderHoldCount++;
        } else {
        	// cachedHoldCounter用来保存最后一个获取读锁的线程
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != getThreadId(current))
                cachedHoldCounter = rh = readHolds.get();
            else if (rh.count == 0)
                readHolds.set(rh);
            rh.count++;
        }
        // 从 AQS中acquireShared方法可以知道大于0表示获取到锁
        return 1;
    }
    // 自旋获取读锁
    return fullTryAcquireShared(current);
}
```
**当我们加读锁的时候，如果有写锁并且不是当前线程就会加锁失败。如果有写锁并且是当前线程那么可以正常获取读锁，因此ReadWriteLock是支持锁降级的**


firstReader，cachedHoldCounter等只是一些统计变量，例如读锁的获取次数，对主流程影响不大，不展开分析了
## 释放读锁

```java
// ReadLock
public void unlock() {
    sync.releaseShared(1);
}
```

```java
// AQS
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

```java
// Sync
protected final boolean tryReleaseShared(int unused) {

	// 省略部分无关代码
	
    for (;;) {
        int c = getState();
        // 将读锁次数减1
        int nextc = c - SHARED_UNIT;
        if (compareAndSetState(c, nextc))
        	// nextc == 0表示读锁和写锁都被释放了
            return nextc == 0;
    }
}
```
**通过CAS不断减少读锁的加锁次数。**

## 总结

读取是获取共享锁，在获取读锁之前会先判断写锁是否被获取，如果写锁被当前线程获取或者没有写锁，则获取读锁成功，否则获取读锁失败（支持锁降级）

写锁是获取独占锁，在获取之前会先判断读锁是否被获取，如果读锁已经被获取，则获取写锁失败。如果写锁没有被获取或者已经被当前线程获取，则获取写锁成功，否则获取写锁失败