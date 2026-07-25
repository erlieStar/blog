---
layout: post
title: InterruptedException有啥用？
lock: need
---
# 并发理论：InterruptedException有啥用？
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/60761a498a496a1263b37599b1219884.jpeg)
## InterruptedException异常是如何来的？
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9afbd6bfcf648750ca49f0f4cd0e47b0.png)
InterruptedException（中断异常）是 Java 多线程编程中最常见的检查型异常之一

**当线程处于WAITING和TIMED_WAITING状态时，如果其他线程调用了该线程的interrupt()方法会抛出InterruptedException，阻塞的方法就会立即抛出 InterruptedException，并提前结束阻塞**

```java
Object lock = new Object();
Thread thread1 = new Thread(() -> {
    synchronized (lock) {
        try {
            lock.wait();
        } catch (InterruptedException e) {
        	// 在这里抛出 InterruptedException
            e.printStackTrace();
        }
    }
});

thread1.start();

new Thread(() -> {
    thread1.interrupt();
}).start();
```

**中断状态标志**：每个线程都有一个内部的布尔标志，用于表示其中断状态

**如果目标线程正处在如下阻塞方法中，它会立即清除中断状态并抛出这个异常**
- Thread.sleep(long millis)：线程休眠。
- Object.wait()：等待获取对象锁通知。
- Thread.join()：等待另一个线程执行完毕。
- 并发容器的阻塞操作：如 BlockingQueue.take()、BlockingQueue.put() 等。
- 显式锁的中断响应：如 ReentrantLock.lockInterruptibly()


**如果目标线程没有在阻塞中，interrupt() 仅会将其中断状态设为 true。线程可以通过轮询 Thread.interrupted() 或 Thread.isInterrupted() 方法来检查这个标志，并自行决定如何响应**

Thread类提供了如下2个方法来判断线程是否是中断状态
1. isInterrupted()
2. interrupted()

这2个方法虽然都能判断状态，但是有细微的差别
```java
 @Test
 public void testInterrupt() throws InterruptedException {
     Thread thread = new Thread(() -> {
         while (true) {}
     });
     thread.start();
     TimeUnit.MICROSECONDS.sleep(100);
     thread.interrupt();
     // true
     System.out.println(thread.isInterrupted());
     // true
     System.out.println(thread.isInterrupted());
     // true
     System.out.println(thread.isInterrupted());
 }
```

```java
 @Test
 public void testInterrupt2() {
     Thread.currentThread().interrupt();
     // true
     System.out.println(Thread.interrupted());
     // false
     System.out.println(Thread.interrupted());
     // false
     System.out.println(Thread.interrupted());
 }
```

**isInterrupted和interrupted的方法区别如下**

Thread#isInterrupted：测试线程是否是中断状态，执行后不更改中断状态

Thread#interrupted：测试线程是否是中断状态，执行后将中断标志更改为false

**AQS中就有类似的逻辑**

```java
public final void acquireInterruptibly(int arg)
        throws InterruptedException {
    // 1. 前置中断检查：若调用前线程已被中断，直接抛出异常
    if (Thread.interrupted())
        throw new InterruptedException();
        
    // 2. 尝试获取资源（由子类实现，如 ReentrantLock）
    if (!tryAcquire(arg))
        // 3. 获取失败，入队阻塞，且在阻塞期间【强响应中断】
        doAcquireInterruptibly(arg);
}
```
## InterruptedException有啥用？
InterruptedException 的核心设计作用，可以概括为一句话：**为 Java 多线程提供一种“安全、可控、协作式”的取消与停止机制**

**解决强制终止线程的安全隐患**：在早期 Java（JDK 1.0）中，Thread.stop() 可以强制直接杀死一个线程。但这带来了严重的系统风险

为了解决这个问题，Java 废弃了 Thread.stop()，转而设计了以 InterruptedException 为核心的协作式中断机制：外部只能发出“请停下来”的请求，由线程自己决定何时、如何安全地释放资源并退出

**可以及时打断阻塞状态**：如果没有中断机制，线程将无法感知外部的停止指令，会一直卡在阻塞调用处，直到等待超时或自然唤醒。这会导致线程池无法关闭、系统响应变慢甚至卡死

