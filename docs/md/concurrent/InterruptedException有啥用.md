---
layout: post
title: InterruptedException有啥用？
lock: need
---
# 并发理论：InterruptedException有啥用？
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/60761a498a496a1263b37599b1219884.jpeg)
## InterruptedException异常是如何来的？
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9afbd6bfcf648750ca49f0f4cd0e47b0.png)

**当线程处于WAITING和TIMED_WAITING状态时，如果调用interrupt方法会抛出InterruptedException，让线程处于就绪状态**

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

**当线程处于运行状态时，如果调用interrupt方法只是在当前线程打了一个中断的标记，中断的逻辑需要我们自己去实现**

Thread类提供了如下2个方法来判断线程是否是中断状态
1. isInterrupted
2. interrupted

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

**AQS中获锁执行中断的逻辑，就是通过判断中断状态，来决定是否抛出InterruptedException来实现的**
