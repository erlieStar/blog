---
layout: post
title: AQS有哪些作用？（三）
lock: need
---

# 并发工具类：AQS有哪些作用？（三）

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8c12b5259f26c681acc43ff6b262be60.jpeg)
## 总结
本篇文章是在看完相关源码之后做的一个总结。在 Java 并发编程中，AQS（AbstractQueuedSynchronizer，抽象队列同步器） 是整个核心，而 ReentrantLock、CountDownLatch 和 Semaphore 则是基于 AQS 实现的具体并发工具类

| 工具类 | AQS 的 state 含义 |  独占还是共享|  核心应用场景|
|--|--|--|--|
| ReentrantLock |锁的持有次数（0未持有锁，>0已锁/重入）  | 独占 |  互斥锁|
| CountDownLatch | 计数器值（需要等待完成的事件数） | 共享 | 等待一组线程完成后再继续 |
| Semaphore | 剩余可用的许可证（Permit）数量 | 共享 |     限流、流量控制（如数据库连接池） |
| ReentrantReadWriteLock | 高 16 位：读锁持有的总数 <br>低 16 位：写锁重入的次数 |  独占+共享| 读多写少的并发场景（如缓存系统） |

AQS 采用模板方法模式。它把最复杂的“线程排队、阻塞、唤醒”全部封装好了，子类只需要重写加解锁的方法来修改 state 即可

**三大核心要素**
1. volatile int state：一个基于 CAS 操作的原子整数，代表同步状态。
2. CHL 队列：一个双向链表组成的 FIFO 队列，没抢到锁/许可证的线程会被封装成 Node 节点卡在这里
3. LockSupport：用于真正阻塞（park）和唤醒（unpark）线程

**两种模式**

- **独占模式**（如 ReentrantLock）：同一时间只能有一个线程获取成功
- **共享模式**（如 Semaphore / CountDownLatch）：同一时间可以有多个线程获取成功

## ReentrantLock（可重入锁）的实现
ReentrantLock 内部定义了三个 AQS 的实现类：Sync、NonfairSync（非公平锁）和 FairSync（公平锁）。默认是非公平锁

**非公平锁加锁 lock()**

1. **无视队列**，线程尝试通过 CAS 将 state 从 0 改为 1（源码中会尝试两次）
2. 如果成功，说明抢到锁，将“锁持有者”设为当前线程
3. 如果失败，判断“锁持有者”是不是自己，如果是，state++（这就是可重入性）
4. 如果都不是，线程进入 AQS 队列排队并挂起

**公平锁加锁 lock()**
1. **看一下队列中是否有人排队，如果有人排队则跟着排队**
6. 没人排队， 尝试通过 CAS 将 state 从 0 改为 1
7. 如果失败，判断“锁持有者”是不是自己，如果是，state++（这就是可重入性）
8. 如果都不是，线程进入 AQS 队列排队并挂起

**解锁 unlock()**

state - -，当 state 减到 0 时，清空锁持有者，并唤醒 AQS 队列中下一个等待的线程

**公平锁和非公平锁的解锁逻辑是一样的**
## CountDownLatch（倒计时器）的实现

CountDownLatch 也是基于 AQS 的共享模式，但它的逻辑是“一锤子买卖”，不可重置

**初始化**： 设定 state = count（比如 3，代表要等 3 个任务）

**扣减计数 countDown()**：

每次调用，通过 CAS 将 state--

直到 state 变成 0 时，会触发 AQS 唤醒在队列中等待的主线程

**等待 await()**：

主线程调用 await()，AQS 会检查 state 是否为 0

如果 state > 0，主线程直接进入 AQS 队列阻塞

当 state == 0 时，被唤醒的主线程得以继续向下执行
## Semaphore（信号量）的实现
Semaphore 同样基于 AQS 的共享模式实现

**初始化**： 设定 state = permits（比如 5，代表有 5个许可证）

**获取资源 acquire()**：

使用 CAS 尝试将 state 减去需要的资源数（通常是 1）

如果减完后 state >= 0，说明还有剩余资源，获取成功，线程继续执行

如果 state < 0，说明资源不够了，当前线程会被打包放入 AQS 队列，阻塞等待

**释放资源 release()**：

使用 CAS 将 state++，并唤醒 AQS 队列中等待的线程出来争夺许可证