---
layout: post
title: ReentrantLock的效率为什么这么高？
lock: need
---

# 并发工具类：ReentrantLock的效率为什么这么高？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210212223733508.jpg?)
## 手写一个锁
说起ReentrantLock可能很多人都用过，也知道这个类的作用，可以用来保证线程安全。我们用synchronized也能保证线程安全啊，为什么还需要ReentrantLock呢？

这是因为Java6之前，synchronized是一个重量级锁，每次执行时都会从用户态切换到内核态，状态的转换比较耗时间。所以Doug Lea大神就写了这个类，避免了频繁的状态切换，提升了执行效率。当然java6之后synchronized进行了大量的优化，性能已经相差无几了。

在AQS那一节中我们已经知道了手写一个锁，主要分为**加锁，解锁，入队，出队，阻塞，唤醒**等6个操作，并手写了一个锁

```java
public class MyLockV1 {

    private final AtomicBoolean locked = new AtomicBoolean(false);
    private final Queue<Thread> waiters = new ConcurrentLinkedQueue<>();

    public void lock() {
        Thread current = Thread.currentThread();
        waiters.add(current);

        while (waiters.peek() != current || !locked.compareAndSet(false, true)) {
            LockSupport.park(this);
        }

        waiters.remove();
    }

    public void unLock() {
        locked.set(false);
        LockSupport.unpark(waiters.peek());
    }
}
```
手写一个锁是为了让我们对锁的实现有个基本的了解。

ReentrantLock实现了Lock接口，我们来看一下Lock接口的定义

```java
public interface Lock {

	//不响应中断的获取锁
    void lock();

	//响应中断的获取锁
    void lockInterruptibly() throws InterruptedException;

	//尝试非阻塞的获取锁，true为获取到锁，false为没有获取到锁
    boolean tryLock();

	//超时获取锁，以下情况会返回：时间内获取到了锁，时间内被中断，时间到了没有获取到锁
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;

	//释放锁
    void unlock();

	//创建一个condition
    Condition newCondition();
}
```
从接口的定义我们就可以看出Lock相对于synchronized提供了更丰富的API

1. lockInterruptibly()：能够响应中断
2. tryLock()：支持非阻塞的方式获取锁
3. tryLock(long time, TimeUnit unit)：支持超时获取锁
4. newCondition()：实现条件通知

## ReentrantLock底层实现
![在这里插入图片描述](https://img-blog.csdnimg.cn/6c86580faf594bcca42c0a1439f597be.png)

Sync是ReentrantLock的一个成员变量，可以认为它是一个代理类，加解锁操作都由这个类来实现。继承自AbstractQueuedSynchronizer，它有2个子类FairSync用来实现公平锁，NonfairSync用来实现非公平锁

ReentrantLock类有两个构造函数，默认是非公平锁。当传入的参数是true为公平锁，为false为非公平锁

```java
private final Sync sync;

public ReentrantLock() {
	sync = new NonfairSync();
}

public ReentrantLock(boolean fair) {
	sync = fair ? new FairSync() : new NonfairSync();
}
```

在前面我们自己的分析中，我们得出需要有一个成员变量state来标识锁是否被获取

在源码中这个成员变量定义在Sync的父类AbstractQueuedSynchronizer中，state变量在不同子类中有不同的含义，在ReentrantLock中表示锁的状态

 - state的值表示加锁的次数，无锁时值为0，第一次加锁将state设置为1，由于ReentrantLock是可重入锁，当持有锁的线程是当前线程时，即可加锁，加锁一次，将state的值加1
 
 - 每解锁一次将state的个数减1，当state的值为0，其他线程可以获得锁

### 不响应中断的非公平锁
```java
// ReentrantLock#lock
public void lock() {
	sync.lock();
}
```

```java
// ReentrantLock.NonfairSync#lock
final void lock() {
	// 这就是不公平的地方，上来直接通过CAS尝试将state的值从0设置为1
	if (compareAndSetState(0, 1))
		// 设置成功则将持有锁的线程设置为当前线程
		setExclusiveOwnerThread(Thread.currentThread());
	else
		acquire(1);
}
```

```java
// AbstractQueuedSynchronizer
public final void acquire(int arg) {
	if (!tryAcquire(arg) &&
		acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
		// 中断相关，和主流程影线不大
		selfInterrupt();
}
```

tryAcquire尝试加锁，成功则返回true，执行业务逻辑，否则放到同步队列中并阻塞

子类需要重写加锁的逻辑
```java
// ReentrantLock.NonfairSync#tryAcquire
protected final boolean tryAcquire(int acquires) {
	return nonfairTryAcquire(acquires);
}
```

```java
// ReentrantLock.NonfairSync#nonfairTryAcquire
final boolean nonfairTryAcquire(int acquires) {
	final Thread current = Thread.currentThread();
	int c = getState();
	// 没有线程加锁
	if (c == 0) {
		// 通过cas获取锁
		if (compareAndSetState(0, acquires)) {
			setExclusiveOwnerThread(current);
			return true;
		}
	}
	// 加锁的线程为当前线程
	else if (current == getExclusiveOwnerThread()) {
		int nextc = c + acquires;
		if (nextc < 0) // overflow
			throw new Error("Maximum lock count exceeded");
		// 设置state=nextc
		setState(nextc);
		return true;
	}
	return false;
}
```
就是通过cas将state值加一

### 响应中断的公平锁
```java
// ReentrantLock.FairSync#lock
final void lock() {
    acquire(1);
}
```

```java
// AbstractQueuedSynchronizer#acquire
public final void acquire(int arg) {
	if (!tryAcquire(arg) &&
		acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
		selfInterrupt();
}
```
子类重写加锁逻辑
```java
// ReentrantLock.FairSync#tryAcquire
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    // 锁没有被获取
    if (c == 0) {
    	// 不需要排队，并且通过cas将state变量的值从0变为1
        if (!hasQueuedPredecessors() &&
            compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    // 锁被当前线程获取
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```
**仔细对比两种锁lock()方法和tryAcquire()方法就能看出公平和非公平的区别**

公平锁：每次获锁的时候都老老实实去排队

非公平锁：一上来就通过cas尝试获取一波锁，获取不到再去排队

**判断是否需要排队（比较复杂，但是不重要）**

```java
// 当前线程前面有等待线程，返回true
// 当前线程位于队列的头部或者队列为空，返回false
public final boolean hasQueuedPredecessors() {
    Node t = tail; // Read fields in reverse initialization order
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

如果head=tail，则表示FIFO队列为空，如刚开始head和tail都为null，返回false

如果head!=tail，并且head的next为空时，或者head的next线程不是当前线程，则FIFO队列不为空

有两种情况会导致h的next为空

 1. 当前线程进入hasQueuedPredecessors的同时，另一个线程已经更改了tail，但还没有将head的next指向tail
 2. 当前线程将head赋给h后，head被另一个线程移除队列，导致h的next为空，这种情况说明锁已经被占用

```java
// AbstractQueuedSynchronizer#enq
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) { // Must initialize
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                //第一种情况在这行字中间
                t.next = node;
                return t;
            }
        }
    }
}
```

```java
// AbstractQueuedSynchronizer#acquireQueued
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) {
                //第二种情况在这里，p.next=null
                setHead(node);
                p.next = null; 
                failed = false;
                return interrupted;
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```
### 释放锁
当释放锁时，公平锁和非公平锁都是调用的如下方法，其实就是对state变量减1

```java
// ReentrantLock#unlock
public void unlock() {
	sync.release(1);
}
```

```java
// AbstractQueuedSynchronizer#release
public final boolean release(int arg) {
	if (tryRelease(arg)) {
		Node h = head;
		if (h != null && h.waitStatus != 0)
			// 唤醒队列后面的线程
			unparkSuccessor(h);
		return true;
	}
	return false;
}
```

尝试释放锁
```java
// ReentrantLock.Sync#tryRelease
protected final boolean tryRelease(int releases) {
	// 当前加锁的次数-释放的次数
	int c = getState() - releases;
	// 当前线程不是持有锁的线程
	if (Thread.currentThread() != getExclusiveOwnerThread())
		throw new IllegalMonitorStateException();
	boolean free = false;
	if (c == 0) {
		// 为true时表示已经释放锁了
		free = true;
		// 设置持有锁的线程为null
		setExclusiveOwnerThread(null);
	}
	// 重新设置state变量
	setState(c);
	return free;
}
```

## 非公平锁的吞吐量比公平锁高
最后再说一下公平锁和非公平锁，举2个例子

```java
public class SyncTest {

    public static Lock lock = new ReentrantLock();

    public static void main(String[] args) {

        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                System.out.println(Thread.currentThread().getName() + " 开始运行");
                testMethod();
            });
        }
        for (int i = 0; i < 10; i++) {
            threads[i].start();
        }
    }

    public static void testMethod() {
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 获得锁");
        } finally {
            lock.unlock();
        }
    }
}
```
执行结果有时如下

```txt
Thread-0 开始运行
Thread-2 开始运行
Thread-0 获得锁
Thread-3 开始运行
Thread-1 开始运行
Thread-2 获得锁
Thread-4 开始运行
Thread-4 获得锁
Thread-5 开始运行
Thread-3 获得锁
Thread-6 开始运行
Thread-6 获得锁
Thread-1 获得锁
Thread-9 开始运行
Thread-7 开始运行
Thread-5 获得锁
Thread-8 开始运行
Thread-9 获得锁
Thread-7 获得锁
Thread-8 获得锁
```
可以看到开始运行的顺序和获得锁的顺序是不一致的

将lock成员变量改为如下

```java
public static Lock lock = new ReentrantLock(true);
```
执行结果有时如下

```txt
Thread-0 开始运行
Thread-2 开始运行
Thread-1 开始运行
Thread-3 开始运行
Thread-4 开始运行
Thread-6 开始运行
Thread-0 获得锁
Thread-5 开始运行
Thread-2 获得锁
Thread-7 开始运行
Thread-1 获得锁
Thread-9 开始运行
Thread-8 开始运行
Thread-3 获得锁
Thread-4 获得锁
Thread-6 获得锁
Thread-5 获得锁
Thread-7 获得锁
Thread-9 获得锁
Thread-8 获得锁
```
可以看到开始运行的顺序和获得锁的顺序是一致的，但是这并不是绝对的，假设线程B调用tryAcquire失败后，并在调用addWaiter之前，线程A释放了锁，且线程C判断到锁空闲，进入hasQueuedPredecessors返回false（等待队列为空），最终C比B先获取到锁，因此公平锁并不是绝对公平的

>非公平的锁的效率高于公平锁的效率，是因为在恢复一个被挂起的线程与该线程真正运行之间存在着严重的延迟，假设线程A持有一个锁，并且线程B请求这个锁。由于锁被A持有，因此B将被挂起。当A释放锁时，B将被唤醒，因此B会再次尝试获取这个锁。与此同时，如果线程C也请求这个锁，那么C很可能会在B被完全唤醒之前获得、使用以及释放这个锁。这样就是一种双赢的局面：B获得锁的时刻并没有推迟，C更早的获得了锁，并且吞吐量也提高了。
