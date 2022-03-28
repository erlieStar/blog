---
layout: post
title: Synchronized和Lock接口有哪些区别？
lock: need
---

# 面试官：Synchronized和Lock接口有哪些区别？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210103190005603.jpg?)
## Lock接口的使用
既然有了synchronized，为啥还要提供Lock接口呢？也许你会说Lock接口比synchronized性能高。在jdk1.5之前确实如此，但是在jdk1.6之后，两者性能差不多了。直接来看Lock接口的定义，看看比synchronized多了哪些功能？

```clike
public interface Lock {

	// 加锁
    void lock();
	// 能够响应中断
    void lockInterruptibly() throws InterruptedException;
	// 非阻塞获取锁
    boolean tryLock();
	// 非阻塞超时获取锁
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;
	// 解锁
    void unlock();
	// 定义阻塞条件
    Condition newCondition();
}

```
可以看到Lock接口相比synchronized多了很多特性，详细解释一下方法

1. lock()方法，用来获取锁，如果锁被其他线程获得则进行等待，需要和unlock方法配合主动释放锁。发生异常时，不会主动释放锁，所以释放锁的操作放在finally块中
2. lockInterruptibly()方法，当通过这个方法去获取锁时，如果线程正在等待获取锁，则这个线程能够响应中断，即中断线程的等待状态。也就使说，当两个线程同时通过lock.lockInterruptibly()想获取某个锁时，假若此时线程A获取到了锁，而线程B只有在等待，那么对线程B调用threadB.interrupt()方法能够中断线程B的等待过程
3. tryLock()方法，用来尝试获取锁，如果获取成功，则返回true。如果获取失败则返回false。也就说这个方法无论如何都会立即返回。在拿不到锁时不会一直在那等待
4. tryLock(long time, TimeUnit unit)方法，和tryLock()类似。只不过区别在于这个方法在拿不到锁时会等待一定的时间，在时间期限之内如果还拿不到锁，就返回false。如果一开始拿到锁或者在等待期间内拿到了锁，则返回true
5. unlock()方法，解锁
6. newCondition()方法，定义条件

其余的应该都很好理解，演示一下lockInterruptibly()和newCondition()方法

**lockInterruptibly()方法**
```java
ReentrantLock myLock = new ReentrantLock();
// 先获取一次锁，让后续获取锁的操作阻塞
myLock.lock();
Thread thread = new Thread(() -> {
	try {
		// myLock.lock();
		myLock.lockInterruptibly();
	} catch (Exception e) {
		e.printStackTrace();
	} finally {
		// 当使用myLock.lockInterruptibly()时
		// 会抛出java.lang.InterruptedException，打印over
		// 使用myLock.lock()，一直阻塞获取锁，不会打印over
		System.out.println("over");
	}
});
thread.start();
TimeUnit.SECONDS.sleep(1);
thread.interrupt();
TimeUnit.SECONDS.sleep(100);
```
**Condition的使用**

synchronized与wait()和nitofy()/notifyAll()方法相结合可以实现等待/通知模型，ReentrantLock同样可以，但是需要借助Condition，且Condition有更好的灵活性，具体体现在

1. 一个Lock里面可以创建多个Condition实例，实现多路通知

2. notify()方法进行通知时，被通知的线程时Java虚拟机随机选择的，但是ReentrantLock结合Condition可以实现有选择性地通知

```java
public class WaitNotify {

    static ReentrantLock lock = new ReentrantLock();
    static Condition conditionA  = lock.newCondition();
    static Condition conditionB = lock.newCondition();

    public static void main(String[] args) throws InterruptedException {
        Thread waitThreadA = new Thread(new WaitA(), "WaitThreadA");
        waitThreadA.start();
        Thread waitThreadB = new Thread(new WaitB(), "WaitThreadB");
        waitThreadB.start();
        TimeUnit.SECONDS.sleep(2);
        lock.lock();
        try {
            conditionA.signal();
        } finally {
            lock.unlock();
        }
    }

    static class WaitA implements Runnable {

        @Override
        public void run() {
            lock.lock();
            try {
                System.out.println(Thread.currentThread() + " begin await @ "
                        + new SimpleDateFormat("HH:mm:ss").format(new Date()));
                conditionA.await();
                System.out.println(Thread.currentThread() + " end await @ "
                        + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }
    }

    static class WaitB implements Runnable {

        @Override
        public void run() {
            lock.lock();
            try {
                System.out.println(Thread.currentThread() + " begin await @ "
                        + new SimpleDateFormat("HH:mm:ss").format(new Date()));
                conditionB.await();
                System.out.println(Thread.currentThread() + " end await @ "
                        + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }
    }
}
```

```java
Thread[WaitThreadA,5,main] begin await @ 00:49:57
Thread[WaitThreadB,5,main] begin await @ 00:49:57
Thread[WaitThreadA,5,main] end await @ 00:49:59
```
WaitThreadB因为没有被通知，一直阻塞

## 总结
**synchronized和ReentrantLock的异同**

1. ReentrantLock支持非阻塞的方式获取锁，能够响应中断，而synchronized不行
2. ReentrantLock必须手动获取和释放锁，而synchronized不需要
3. ReentrantLock可以是公平锁或者非公平锁，而synchronized只能是非公平锁
4. synchronized在发生异常的时候，会自动释放线程占有的锁，而ReentrantLock在发生异常时，如果没有通过unlock去释放锁，很有可能造成死锁，因此需要在finally块中释放锁
5. synchronized和ReentrantLock都是可重入锁