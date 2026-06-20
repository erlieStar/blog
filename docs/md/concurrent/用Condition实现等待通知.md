---
layout: post
title: 用Condition实现等待通知
lock: need
---

# 并发工具类：用Condition实现等待通知

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/81e9bf838a0123d8a91a5fd290dde48a.jpeg)
## 介绍

在 Java Concurrent 包中，AQS（AbstractQueuedSynchronizer） 是整个并发工具包的核心。而 Condition（通常以 ConditionObject 的形式实现在 AQS 内部）则是用来替代传统 Java Object.wait()/notify() 的线程间通信机制

## 同步队列和等待队列
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ab2214b2c5a460ab1638efffd47fb326.png)

理解 Condition 的关键在于理解 AQS 内部维护的两种队列

**同步队列**：双向链表。用来存放等待获取锁（如 ReentrantLock.lock()）的线程

**等待队列**： 单向链表。用来存放调用了 condition.await()、正在等待某个特定条件满足的线程。一个锁（AQS 实例）可以同时拥有多个条件队列
## 核心工作原理
和synchronized一样，调用await和signal方法时，必须获得与Condition相关的锁
### condition.await() —— 释放锁，进条件队列
当一个线程调用了 await() 方法时，它通常已经持有了锁。接下来的流程如下
1. **封装与入队**： AQS 会将当前线程封装成一个 Node 节点，并将其加入到该 Condition 的等待队列队尾
2. **完全释放锁**： 线程会释放它持有的所有锁（因为 ReentrantLock 是可重入的，所以会一次性将 state 置为 0），并唤醒 AQS 同步队列中的下一个等待线程
3. **挂起**： 当前线程调用 LockSupport.park(this) 进入阻塞状态，等待被唤醒

### condition.signal() —— 出等待队列，进同步队列
当另一个线程改变了某个条件（例如队列不为空了），并调用了 signal()
1. **移出等待队列**： AQS 会取出该 Condition 等待队列中的第一个节点（FIFO）
2. **加入同步队列**： 将这个节点通过 CAS 转移到 AQS 的同步队列队尾
3. **准备抢锁**： 此时，该线程并没有立即执行，而是去重新竞争锁。只有当它在同步队列中成功再次拿到锁后，才能从当初 await() 的地方苏醒并继续向下执行

## 总结
| 特性 | 传统 Object 方法 (wait/notify) | AQS Condition (await/signal) |
| :--- | :--- | :--- |
| **底层队列** | 每个 Object 只有一个 JVM 内部的 WaitSet | 每个 Condition 对象都有一个独立的单向链表队列 |
| **条件数量** | 一个锁对象只能绑定**一个**等待队列 | 一个锁对象（AQS）可以通过 newCondition() 绑定**多个**条件队列 |
| **精确唤醒** | notify() 只能随机唤醒一个，容易导致“信号丢失”或无效唤醒 | 可以精确唤醒管辖该特定条件的线程（如：notFull 和 notEmpty） |
| **死锁防范** | 不支持中断响应（wait 虽响应中断但会抛异常且不易控制） | 支持不响应中断的 awaitUninterruptibly() 以及带超时时间的 await |
## 应用场景
Java 官方文档中提供了一个最经典的实现——阻塞队列（BoundedBuffer）。通过两个 Condition（notFull 和 notEmpty）完美解决了空间满了不能写、空间空了不能读的问题

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

class BoundedBuffer {
    final Lock lock = new ReentrantLock();
    // 定义两个条件，分别代表“不满”和“不空”
    final Condition notFull  = lock.newCondition(); 
    final Condition notEmpty = lock.newCondition(); 

    final Object[] items = new Object[100];
    int putPtr, takePtr, count;

    // 生产者：放入数据
    public void put(Object x) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                // 队列满了，进入 notFull 条件队列挂起，并释放锁
                notFull.await();
            }
            items[putPtr] = x;
            if (++putPtr == items.length) putPtr = 0;
            ++count;
            
            // 生产了数据，通知正在等待“不空”的消费者
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    // 消费者：取出数据
    public Object take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                // 队列空了，进入 notEmpty 条件队列挂起，并释放锁
                notEmpty.await();
            }
            Object x = items[takePtr];
            if (++takePtr == items.length) takePtr = 0;
            --count;
            
            // 消费了数据，说明有空位了，通知正在等待“不满”的生产者
            notFull.signal();
            return x;
        } finally {
            lock.unlock();
        }
    }
}
```

**为什么这里用 while 而不是 if？**

这是为了防止虚假唤醒（Spurious Wakeup）。线程被唤醒并从 AQS 同步队列重新拿到锁后，条件可能再次被其他抢先的线程改变了，所以必须在 while 循环里重新检查一遍条件是否真的满足


