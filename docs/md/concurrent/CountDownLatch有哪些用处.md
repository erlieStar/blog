---
layout: post
title: CountDownLatch有哪些用处？
lock: need
---
# 并发工具类：CountDownLatch有哪些用处？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210210184304457.jpg?)
## CountDownLatch常见用法
CountDownLatch是jdk1.5之后提供的并发流程控制的工具类，它主要有如下两个方面的作用

1. 一个线程等多个线程执行完毕，再继续自己的工作
2. 多个线程等待一个线程的信号，然后同时开始执行
### 一个线程等多个线程执行完毕，再继续自己的工作

```java
public class CountDownLatchUseCase1 {

    public static void main(String[] args) throws InterruptedException{
        CountDownLatch latch = new CountDownLatch(5);
        ExecutorService service = Executors.newFixedThreadPool(5);
        Random random = new Random();
        for (int i = 0; i < 5; i++) {
            int num = i;
            service.submit(() -> {
                try {
                    TimeUnit.SECONDS.sleep(random.nextInt(5));
                    System.out.println(num + " 号运动员完成比赛");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }
        System.out.println("等待运动员都跑完");
        latch.await();
        System.out.println("运动员都跑完，裁判宣布比赛结束");
    }

}
```
一种可能的结果为
```java
等待运动员都跑完
4 号运动员完成比赛
1 号运动员完成比赛
0 号运动员完成比赛
3 号运动员完成比赛
2 号运动员完成比赛
运动员都跑完，裁判宣布比赛结束
```
![这里写图片描述](https://img-blog.csdn.net/20180523174320124?)

### 多个线程等待一个线程的信号，然后同时开始执行

```java
public class CountDownLatchUseCase2 {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("5秒后比赛正式开始");
        CountDownLatch latch = new CountDownLatch(1);
        ExecutorService service = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 5; i++) {
            int num = i;
            service.submit(() -> {
                System.out.println(num + " 号运动员准备完毕，等待开赛");
                try {
                    latch.await();
                    System.out.println(num + " 号运动员开始跑步");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
        TimeUnit.SECONDS.sleep(5);
        System.out.println("5秒准备时间已经过去，比赛开始！");
        latch.countDown();
    }
}
```
1种可能的结果为
```java
5秒后比赛正式开始
1 号运动员准备完毕，等待开赛
0 号运动员准备完毕，等待开赛
2 号运动员准备完毕，等待开赛
3 号运动员准备完毕，等待开赛
4 号运动员准备完毕，等待开赛
5秒准备时间已经过去，比赛开始！
0 号运动员开始跑步
4 号运动员开始跑步
3 号运动员开始跑步
2 号运动员开始跑步
1 号运动员开始跑步
```
## 共享锁的应用
![在这里插入图片描述](https://img-blog.csdnimg.cn/13edaff4118a42c5b7d452976cb55a23.png)

CountDownLatch的源码非常少，主要是通过操作AbstractQueuedSynchronizer中共享锁的api来实现的，我们在AQS文章中其实基本上把CountDownLatch的源码盘了个遍，这篇文章再接着谢谢，加深记忆

**独占锁和共享锁的异同**

相同点：获取锁失败的节点会被放入队列

不同点：独占锁只有一个线程能获取锁，当释放锁时需要唤醒header节点后面的一个节点。而共享锁多个线程都可以获取锁，当释放锁时需要唤醒header后面的所有有效节点

```java
public class CountDownLatch {

	// 用来阻塞线程，直到state变为0
    public void await() throws InterruptedException {
        sync.acquireSharedInterruptibly(1);
    }

	// 将state-1
    public void countDown() {
        sync.releaseShared(1);
    }
}
```

从源码中可以看到CountDownLatch最主要的2个方式是调用AbstractQueuedSynchronizer中的如下方法来实现的

acquireSharedInterruptibly：获取响应中断的共享锁
releaseShared：释放共享锁

### 获取共享锁（await）

当我们使用CountDownLatch时，构造函数只有一个，且必须传入一个整数，这个整数值会被赋给AQS中的成员变量state，表示共享锁的数量

```java
// CountDownLatch#await
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
    // 加锁失败
    if (tryAcquireShared(arg) < 0)
        // 入队并阻塞
        doAcquireSharedInterruptibly(arg);
}
```

```java
// CountDownLatch.Sync#tryAcquireShared
protected int tryAcquireShared(int acquires) {
    return (getState() == 0) ? 1 : -1;
}
```
因为CountDownLatch的使用场景一般都是调用await，然后调用countDown将阻塞的线程唤醒，所以一般情况下tryAcquireShared返回的都是-1，线程被阻塞
```java
private void doAcquireSharedInterruptibly(int arg)
    throws InterruptedException {
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                	// 唤醒后续节点，并且传递唤醒状态
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                throw new InterruptedException();
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```
当 r >=0 时，表示当前线程获得了锁，然后把同步队列中的线程也都唤醒，这样其他线程也就能获得锁了。
```java
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head; // Record old head for check below
    setHead(node);

    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
```
doReleaseShared唤醒同步队列中的所有阻塞线程，后面释放锁的时候会再次分析
### 释放共享锁（countDown）

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
        doReleaseShared();
        return true;
    }
    return false;
}
```
state - 1，当state = 0时，唤醒阻塞的线程
```java
// CountDownLatch.Sync#tryReleaseShared
protected boolean tryReleaseShared(int releases) {
    // Decrement count; signal when transition to zero
    for (;;) {
        int c = getState();
        // 为0不需要释放，因为构造函数中state=0时，线程也没有阻塞
        if (c == 0)
            return false;
        int nextc = c-1;
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```
唤醒同步队列中所有的阻塞线程
```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            // 头节点的后继节点需要被唤醒
            if (ws == Node.SIGNAL) {
            	// 这里用cas，避免多次执行unpark，setHeadAndPropagate和releaseShared这2个方法都会调用到这里
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                // 唤醒后继节点
                unparkSuccessor(h);
            }
            // 后继节点暂时不需要唤醒，状态更新为PROPAGATE，确保后续可以传递给后继节点
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        // 头节点没有更改，退出循环，当前节点是队列中唯一节点
        // 头节点发生变化，其他线程获取了共享锁，继续循环
        if (h == head)                   // loop if head changed
            break;
    }
}
```
### 总结
**await**

共享锁获取成功（计数器为0），从第一个节点一次唤醒后继节点，实现共享状态传播
共享锁获取失败（计数器不为0），阻塞线程

**countDown**

将state-1，为0，则唤醒所有线程，不为0，则什么都不做