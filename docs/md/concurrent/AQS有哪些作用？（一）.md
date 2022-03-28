---
layout: post
title: AQS有哪些作用？（一）
lock: need
---

# 并发工具类：AQS有哪些作用？（一）

![请添加图片描述](https://img-blog.csdnimg.cn/c04d44a2c08446e4b19317466538f18b.png)
## 如何手写一个锁？
如果让我们自己基于API来实现一个锁，你会将实现拆分为几部分呢？

大多数人肯定会将实现拆分为如下几个步骤
1. 加锁
2. 解锁
3. 入队
4. 出队
5. 阻塞
6. 唤醒

我们来想一下这几个部分的实现

### 加锁
1. 用一个变量state作为锁的标志位，默认是0，表示此时所有线程都可以加锁，加锁的时候通过cas将state从0变为1，cas执行成功表示加锁成功

2. 当有线程占有了锁，这时候有其他线程来加锁，判断当前来抢锁的线程是不是占用锁的线程？
是：重入锁，state+1，当释放的时候state-1，用state表示加锁的次数
否：加锁失败，将线程放入队列，并且阻塞

### 解锁
1. 通过cas对state-1，如果是重入锁，释放一次减一次，当state=0时表示锁被释放。
2. 唤醒等待队列中的线程
### 入队
直接将线程放入队列中就行了
### 出队
线程获取到锁后，把自己从同步队列中删除
### 阻塞和唤醒
阻塞和唤醒线程调用api即可

```java
// 阻塞线程
LockSupport.park(this)
// 唤醒线程
LockSupport.unpark(this)
```
基于上面的思想，我们先来写一个不可重入锁。
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
我这里用了一个bool值来表示锁的状态，当locked=true时，表示锁被获取，当locked=false时，表示锁没有被获取。

**如果要实现一个可重入锁，你想到的操作有哪些？**

首先肯定不能用一个bool值来表示锁的状态，需要用一个int类型的变量state来记录加锁的次数，其次需要把当前获取锁的线程记录下来，用来实现可重入操作。

**有兴趣的可以自己尝试写一下，还是挺难的**
## AQS有哪些作用
为了方便我们定义自己的锁，Doug Lea大佬写了一个模版类AbstractQueuedSynchronizer，内内部封装了入队，出队，阻塞，唤醒的模版方法，**想实现锁只需要继承AbstractQueuedSynchronizer类，并重写加解锁逻辑即可**

```java
// 加锁
// AbstractQueuedSynchronizer
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}
```

```java
// 解锁
// AbstractQueuedSynchronizer
protected boolean tryRelease(int arg) {
    throw new UnsupportedOperationException();
}
```

**所以你看基于AQS实现的锁，基本上只重写了这2个方法，意识到AQS这个类封装的有多好了把？**

为了保存持有锁的线程，用来实现可重入锁，AbstractQueuedSynchronizer继承了AbstractOwnableSynchronizer类，这个类只用来保存获取锁的线程，没有其他逻辑

![在这里插入图片描述](https://img-blog.csdnimg.cn/c71935d0891f4b9f95197897afe17b15.png)

上面的例子中，我们在手写锁的时候，队列是Queue，并且是把Thread直接放到Queue中，而在AQS中定义了一个类Node来包装线程，并且使用双向链表来实现队列的

```java
static final class Node {
	//表示当前线程以共享模式持有锁
	static final Node SHARED = new Node();
	//表示当前线程以独占模式持有锁
	static final Node EXCLUSIVE = null;

	static final int CANCELLED =  1;
	static final int SIGNAL    = -1;
	static final int CONDITION = -2;
	static final int PROPAGATE = -3;

	//当前节点的状态
	volatile int waitStatus;

	//前继节点
	volatile Node prev;

	//后继节点
	volatile Node next;

	//当前线程
	volatile Thread thread;

	//存储在condition队列（等待队列）中的后继节点
	Node nextWaiter;

}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/2fecbd200ebf4fd9a2c74020107fd0c1.png)

**我们只分析同步队列哈，等待队列和Condition相关，我们后续来分析**

可以看到Node类中还有一个重要的属性waitStatus（默认是0）表示线程的状态，包含的状态有

状态 | 值 | 含义 
- | :-: | :-: 
CANCELLED | 1| 线程获取锁的请求已经取消|
SIGNAL | -1 | 表示当前节点的的后继节点将要或者已经被阻塞，在当前节点释放的时候需要unpark后继节点|
CONDITION | -2 | 表示当前节点在等待condition，即在condition队列中|
PROPAGATE| -3 | 表示状态需要向后传播，仅在共享模式下使用|
||0|Node被初始化后的默认值，当前节点在同步队列中等待获取锁|

我们接着来看一下AbstractQueuedSynchronizer这个类的属性

```java
// 同步队列的头节点
private transient volatile Node head;

// 同步队列的尾节点
private transient volatile Node tail;

// 加锁的状态，在不同子类中有不同的意义
private volatile int state;
```

head和tail比较好理解，指向同步队列的头节点和尾节点

**而这个state在不同的子类中有不同的含义**

**ReentrantLock**：state表示加锁的次数，为0表示没有被加锁，为1表示被加锁1次，为2表示被加锁2次，因为ReentrantLock是一个可以重入的锁
**CountDownLatch**：state表示一个计数器，当state>0时，线程调用await会被阻塞，当state值被减少为0时，线程会被唤醒
**Semaphore**：state表示资源的数量，state>0时，可以获取资源，并将state-1，当state=0时，获取不到资源，此时线程会被阻塞。当资源被释放时，state+1，此时其他线程可以获得资源

state的值都是在工具类的构造函数中赋值的

![在这里插入图片描述](https://img-blog.csdnimg.cn/92308fc39ff34b11bb95d6038533a522.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/02f9d8054a914b76a4b3ac3833474c56.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/a4076fa1210a4e48ae43762ce347f2cd.png)

从类的继承图我们可以明显看到在锁的实现中AQS起到了非常重要的作用


**本节我们先分析这些工具类加解锁的逻辑，后面一节分析AQS入队，出队，阻塞，唤醒的逻辑**

## 获取独占锁
ReentrantLock获取独占锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/7e9bb70b1aaa4ed6898b594e1a0137e3.png)

**ReentrantLock的实现分为公平锁和非公平锁，默认是非公平锁，吞吐量更高，我们就单独分析一下非公平锁**

可以看到上来先尝试获取一波锁，并没有直接到同步队列中等待，这就是非公平性的体现

```java
// ReentrantLock.NonfairSync#lock
final void lock() {
    if (compareAndSetState(0, 1))
        setExclusiveOwnerThread(Thread.currentThread());
    else
        acquire(1);
}
```
获取到锁，则执行业务逻辑，否则到同步队列中等待
```java
// AbstractQueuedSynchronizer#acquire
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```
子类重写获锁的逻辑
```java
// ReentrantLock.NonfairSync#tryAcquire
protected final boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
}
```
如果是头一次获取锁，则增加state值，并将获锁的线程设置为自己
如果锁被获取了，看看获取锁的线程是否是当前线程。是则增加state值，获锁成功。否则或锁失败。

```java
// ReentrantLock.Sync#nonfairTryAcquire
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```
从加锁的逻辑我们可以看出ReentrantLock是一个重入锁
## 释放独占锁
ReentrantLock释放独占锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/8b192ebb7a8946f8865157942577869a.png)

```java
// ReentrantLock#unlock
public void unlock() {
    sync.release(1);
}
```
需要释放锁，则执行唤醒逻辑，返回true。否则，直接返回false
```java
// AbstractQueuedSynchronizer#release
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
当state=0时，需要释放锁，否则不需要释放锁
```java
// ReentrantLock.Sync#tryRelease
protected final boolean tryRelease(int releases) {
    int c = getState() - releases;
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    if (c == 0) {
        free = true;
        setExclusiveOwnerThread(null);
    }
    setState(c);
    return free;
}
```

**目前ReentrantLock是一个重入锁，那么你能基于AQS实现一个非重入锁吗？**

很简单，把AQS中的tryAcquire和tryRelease重写一下就行了

```java
public class MyLock {

    private final Sync sync;

    public MyLock() {
        sync = new Sync();
    }

    public class Sync extends AbstractQueuedSynchronizer {

        @Override
        protected boolean tryAcquire(int arg) {
            return compareAndSetState(0, arg);
        }

        @Override
        protected boolean tryRelease(int arg) {
            setState(0);
            return true;
        }

    }

    public void lock() {
        sync.acquire(1);
    }

    public void unLock() {
        sync.release(1);
    }
}

```

## 获取共享锁
### CountDownLatch获取共享锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/bf5f29af8dd04e6daaf3662ec1077b5f.png)

```java
// CountDownLatch#await()
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```

```java
// AbstractQueuedSynchronizer#acquireSharedInterruptibly
public final void acquireSharedInterruptibly(int arg)
        throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    if (tryAcquireShared(arg) < 0)
        // 获锁失败，进入同步队列
        doAcquireSharedInterruptibly(arg);
}
```
重写加锁逻辑
```java
// CountDownLatch.Sync#tryAcquireShared
protected int tryAcquireShared(int acquires) {
    return (getState() == 0) ? 1 : -1;
}
```
**state=0，则获锁成功，执行业务逻辑。否则，进入同步队列阻塞**

#### Semaphore获取共享锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/d6b8c3c355374ed4849fccdcd0a008bd.png)

```java
// Semaphore#acquire()
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```

```java
// AbstractQueuedSynchronizer#acquireSharedInterruptibly
public final void acquireSharedInterruptibly(int arg)
        throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    if (tryAcquireShared(arg) < 0)
    	// 获锁失败，进入同步队列
        doAcquireSharedInterruptibly(arg);
}
```
重写加锁逻辑
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
remaining（剩余的资源数）= state（总的资源数）- acquires（需要的资源数）

**剩余的资源数小于0则进入同步队列。进行阻塞，否则执行业务逻辑**
## 释放共享锁
### CountDownLatch释放共享锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/1b92160950eb4a86972bf0cbf40f61aa.png)

```java
// CountDownLatch#countDown
public void countDown() {
    sync.releaseShared(1);
}
```

```java
// AbstractQueuedSynchronizer#releaseShared
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        // 释放共享锁
        doReleaseShared();
        return true;
    }
    return false;
}
```
重写释放锁的逻辑
```java
// CountDownLatch.Sync#tryReleaseShared
protected boolean tryReleaseShared(int releases) {
    // Decrement count; signal when transition to zero
    for (;;) {
        int c = getState();
        // state=0表明没有线程进入同步队列，不需要执行释放锁逻辑
        if (c == 0)
            return false;
        int nextc = c-1;
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```
**state-1=0表明同步队列中没有线程了，需要执行释放锁逻辑。否则同步队列中还有线程，不能执行释放锁逻辑**
### Semaphore释放共享锁

![在这里插入图片描述](https://img-blog.csdnimg.cn/9fe6b2ab7ccf4644b9c7bc4711be86a9.png)

```java
// Semaphore#release()
public void release() {
    sync.releaseShared(1);
}
```

```java
// AbstractQueuedSynchronizer#releaseShared
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        // 释放共享锁
        doReleaseShared();
        return true;
    }
    return false;
}
```
重写释放锁的逻辑
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
**释放资源，增大state值，唤醒同步队列的头节点，唤醒的线程获锁成功则执行业务逻辑，获锁失败则继续进入同步队列**