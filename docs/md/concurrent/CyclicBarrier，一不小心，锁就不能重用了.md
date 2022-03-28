---
layout: post
title: CyclicBarrier，一不小心，锁就不能重用了
lock: need
---
# 并发工具：CyclicBarrier，一不小心，锁就不能重用了

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210304000534847.jpg?)

## 用CyclicBarrier协调都地主
斗地主是一个非常有意思的娱乐活动，但是斗地主必须够3个人才能开始，每次凑够3个人就能开一桌。我们该如何实现这个功能呢？

也许你立马会想到CountDownLatch，CountDownLatch确实能实现这个功能，但是CountDownLatch这个共享锁只能用一次，不能循环使用，有没有可以循环使用的共享锁呢？当然有，这就是CyclicBarrier。

我们用CyclicBarrier模拟一下上面的场景
```java
public class CyclicBarrierUseCase1 {

    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(3);
        ExecutorService service = Executors.newCachedThreadPool();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            int num = i;
            service.submit(() -> {
                try {
                    System.out.println(num + " 准备去棋牌馆");
                    TimeUnit.SECONDS.sleep(random.nextInt(5));
                    System.out.println(num + " 到达");
                    barrier.await();
                    System.out.println(num + " 斗地主");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
```
输出如下，每当凑够4个人时，开始打麻将
```text
0 准备去棋牌馆
1 准备去棋牌馆
2 准备去棋牌馆
3 准备去棋牌馆
4 准备去棋牌馆
5 准备去棋牌馆
2 到达
4 到达
5 到达
5 斗地主
2 斗地主
4 斗地主
0 到达
1 到达
3 到达
3 斗地主
0 斗地主
1 斗地主
```
CyclicBarrier还提供了另一个构造函数，可以让固定数量的线程到达栅栏处时，让主线程执行特定的任务

```java
public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties;
    this.count = parties;
    this.barrierCommand = barrierAction;
}
```

```java
public class CyclicBarrierUseCase2 {

    public static void main(String[] args) {
        CyclicBarrier barrier =
                new CyclicBarrier(3, () -> System.out.println("凑够人了"));
        ExecutorService service = Executors.newCachedThreadPool();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            int num = i;
            service.submit(() -> {
                try {
                    System.out.println(num + " 准备去棋牌馆");
                    TimeUnit.SECONDS.sleep(random.nextInt(5));
                    System.out.println(num + " 到达");
                    barrier.await();
                    System.out.println(num + " 斗地主");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
```

```text
0 准备去棋牌馆
1 准备去棋牌馆
0 到达
2 准备去棋牌馆
3 准备去棋牌馆
3 到达
4 准备去棋牌馆
5 准备去棋牌馆
2 到达
凑够人了
2 斗地主
0 斗地主
3 斗地主
4 到达
1 到达
5 到达
凑够人了
5 斗地主
1 斗地主
4 斗地主
```
当凑够人的时候，让最后一个到达栅栏的线程打印一句凑够人了，各个线程再依次执行

## CyclicBarrier是如何实现这个功能的？
CyclicBarrier的构造函数如下，parties指定了多少个数量的线程到达await()方法才继续执行后续的方法，而barrierAction指定了当多个线程到达后，先执行barrierAction中指定的动作，然后各个线程再执行各自的业务
```java
public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties;
    this.count = parties;
    this.barrierCommand = barrierAction;
}
```
所以最重要的就是一个await方法
```java
public int await() throws InterruptedException, BrokenBarrierException {
    try {
        return dowait(false, 0L);
    } catch (TimeoutException toe) {
        throw new Error(toe); // cannot happen
    }
}
```
最终调用到dowait方法
```java
// timed 是否超时阻塞
// nanos 阻塞等待的时长
private int dowait(boolean timed, long nanos)
    throws InterruptedException, BrokenBarrierException,
           TimeoutException {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {

        int index = --count;
        
        // 所有线程都到了，把栅栏开启，让线程执行
        if (index == 0) {  // tripped
            boolean ranAction = false;
            try {
                final Runnable command = barrierCommand;
                if (command != null)
                    command.run();
                ranAction = true;
                // 唤醒条件队列中的线程，重新设置 count
                nextGeneration();
                return 0;
            } finally {
            }
        }

        // 阻塞到 trip 条件队列中
        // loop until tripped, broken, interrupted, or timed out
        for (;;) {
            try {
                if (!timed)
                    trip.await();
                else if (nanos > 0L)
                    nanos = trip.awaitNanos(nanos);
            } catch (InterruptedException ie) {
            }
        }
    } finally {
        lock.unlock();
    }
}
```
这么一看，CyclicBarrier的逻辑还挺简单的把，只用了一个ReentrantLock和Condition就实现了

nextGeneration用来重制栅栏，这是锁不断重用的基础，唤醒条件队列中的线程，重置count值都容易理解，Generation这个类是用来干嘛的？
```java
// 重置栅栏
private void nextGeneration() {
    // signal completion of last generation
    trip.signalAll();
    // set up next generation
    count = parties;
    generation = new Generation();
}
```
Generation类是CyclicBarrier的一个内部类，这个内部类只有一个属性broken，表示这个栅栏被冲破了没有，如果为true，表示栅栏被冲破了，此时CyclicBarrier不能正常使用，需要调用reset方法重置栅栏的状态
```java
private static class Generation {
    boolean broken = false;
}
```
其实为了大家理解最重要的部分，上面dowait方法是被我精简过的，下面这段才是最全面的，里面包含了对各种异常情况的处理

```java
private int dowait(boolean timed, long nanos)
    throws InterruptedException, BrokenBarrierException,
           TimeoutException {
    final ReentrantLock lock = this.lock;
    // 加锁，往Condition条件队列放置时，需要获取锁
    lock.lock();
    try {
    	// 获取当前栅栏的状态
        final Generation g = generation;

		// 栅栏被冲破了，抛出异常
        if (g.broken)
            throw new BrokenBarrierException();

		// 当前线程被中断
        if (Thread.interrupted()) {
        	// 将栅栏标记为冲突
        	// 唤醒阻塞的队列
            breakBarrier();
            throw new InterruptedException();
        }

        int index = --count;
        // 所有线程都到达，此时把栅栏开启，让线程执行
        if (index == 0) {  // tripped
            boolean ranAction = false;
            try {
                final Runnable command = barrierCommand;
                // 设置了额外任务，执行额外任务
                if (command != null)
                    command.run();
                ranAction = true;
                // 重置栅栏状态，唤醒所有线程
                nextGeneration();
                return 0;
            } finally {
            	// 任务没有正常执行
                if (!ranAction)
                	// 栅栏被标记为冲破，唤醒所有线程
                    breakBarrier();
            }
        }

        // loop until tripped, broken, interrupted, or timed out
        // 栅栏开放，栅栏冲破，线程中断，超时 会跳出循环
        for (;;) {
            try {
            	// 没有超时时间，阻塞当前线程
            	// 有超时时间，超时阻塞当前线程
            	// 调用await阻塞的时候会释放锁
                if (!timed)
                    trip.await();
                else if (nanos > 0L)
                    nanos = trip.awaitNanos(nanos);
            } catch (InterruptedException ie) {
            	// 线程被中断，是当前的栅栏，并且没有被冲破
                if (g == generation && ! g.broken) {
                    breakBarrier();
                    throw ie;
                } else {
                    // We're about to finish waiting even if we had not
                    // been interrupted, so this interrupt is deemed to
                    // "belong" to subsequent execution.
                    // 当栅栏被重置后，发生了InterruptedException，则重置一下标记位即可
                    Thread.currentThread().interrupt();
                }
            }
			
			// 栅栏被冲破
            if (g.broken)
                throw new BrokenBarrierException();

			// 栅栏被重置了，直接return退出即可
            if (g != generation)
                return index;

			// 超时了
			// 标记栅栏被冲破，唤醒阻塞的线程
            if (timed && nanos <= 0L) {
                breakBarrier();
                throw new TimeoutException();
            }
        }
    } finally {
        lock.unlock();
    }
}
```
dowait的大致流程如下
1. 如果栅栏已经被冲破了，抛出BrokenBarrierException
2. 当前线程被中断了，冲破栅栏，抛出InterruptedException
3. 将count计数器减1，当计数器=0的时候，执行barrierCommand。如果正常执行，唤醒阻塞的线程，重置栅栏状态。如果执行barrierCommand发生异常，则冲破栅栏
4. 计数器不是0的时候，线程会被阻塞，当发生栅栏开放，栅栏冲破，线程中断，超时 会跳出循环，此时线程接着执行

**使用CyclicBarrier是一定要注意BrokenBarrierException，因为它会导致锁不能重用，需要特别注意**

## CyclicBarrier的克星BrokenBarrierException
BrokenBarrierException是怎么来的？

```java
private static class Generation {
    boolean broken = false;
}
```

前面我们说过一个重要的成员变量broken，当broken=true的时候表示栅栏被冲破，**当栅栏被冲破继续使用栅栏时，就会抛出BrokenBarrierException。**

所以我们只需要找源码中broken是多会被设置为false的？

```java
private void breakBarrier() {
    generation.broken = true;
    count = parties;
    trip.signalAll();
}
```
只有一个breakBarrier方法，所以调用breakBarrier的地方就是栅栏被冲破的地方，有如下5个地方

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210304234930747.png?)
1. 线程被中断
2. 执行额外任务发生异常
3. 发生中断唤醒线程时，当前栅栏没有被冲破
4. 等待超时
5. 把当前栅栏冲破，然后重置栅栏

**如何处理BrokenBarrierException？**

**当发生异常的时候，调用reset方法，打破现在的栅栏，重新new一个栅栏即可**

```java
public void reset() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        breakBarrier();   // break the current generation
        nextGeneration(); // start a new generation
    } finally {
        lock.unlock();
    }
}
```

## CyclicBarrier和CountDownLatch的异同

**相同点**

CyclicBarrier和CountDownLatch都能让一组线程达到某个条件再继续执行

**不同点**

**作用对象不同**：CyclicBarrier需要等到固定数量的线程都到达栅栏位置才能执行，作用对象是线程。而CountDownLatch只需要把state的值减少到1即可，作用对象是state值

**可重用性不同**：CyclicBarrier可以不断重用，而CountDownLatch只能使用一次

**执行额外任务不同**：CyclicBarrier当固定线程都到达栅栏处时，可以让主线程执行一个任务。而CountDownLatch则不行