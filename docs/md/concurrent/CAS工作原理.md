---
layout: post
title: CAS工作原理
lock: need
---

# 并发理论：CAS工作原理

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/522d3509454d368e1ba74350274d5d15.png)
## 前言

在 Java 并发编程中，CAS 是一个极其重要的核心概念。它的全称是 Compare And Swap（比较并交换），是一种无锁（lock-free）的非阻塞算法。

简单来说，它就像是并发编程中的“乐观锁”基石，允许多个线程在不使用传统重量级锁（如 synchronized）的情况下，安全地实现原子操作

>JUC是java.util.concurrent包的简称，JUC有2大核心，CAS和AQS，CAS是java.util.concurrent.atomic包的基础，即AtomicInteger和AtomicLong等是用CAS实现的

我在volatile相关文章中分享过volatile只能保证可见性，不能保证原子性。
但原子类（AtomicInteger等可以保证原子性），原子类利用volatile+CAS来保证原子性，来看看怎么做到的吧。

开5个线程，每个线程将count加1000
```java
@NotThreadSafe
public class CountTest {

    public static int count = 0;

    public static void main(String[] args) {

        //新建一个线程池
        ExecutorService service = Executors.newCachedThreadPool();
        //Java8 lambda表达式执行runnable接口
        for (int i = 0; i < 5; i++) {
            service.execute(() -> {
                for (int j = 0; j < 1000; j++) {
                    count++;
                }
            });
        }
        //关闭线程池
        service.shutdown();
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("count = " + count);
    }
}
```
由于这个代码是线程不安全的（因为count++不是原子操作），所以最终结果有可能小于5000，我们可以用synchronized保证操作的原子性和可见性

```java
@ThreadSafe
public class CountTest {

    public static int count = 0;

    public static void main(String[] args) {

        ExecutorService service = Executors.newCachedThreadPool();
        for (int i = 0; i < 5; i++) {
            service.execute(() -> {
                for (int j = 0; j < 1000; j++) {
                    synchronized (CountTest.class) {
                        count++;
                    }
                }
            });
        }
        service.shutdown();
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("count = " + count);
    }
}
```
synchronized属于悲观锁，它有一个明显的缺点，它不管数据存不存在竞争都加锁，随着并发量增加，且如果锁的时间比较长，其性能开销将会变得很大。

有没有办法解决这个问题？答案是基于冲突检测的乐观锁。这种模式下，已经没有所谓的锁概念了，每个线程都直接先去执行操作，检测是否与其他线程存在共享数据竞争，如果没有则让此操作成功，如果存在共享数据竞争则不断地重新执行操作，直到成功为止，重新尝试的过程叫自旋

java.util.concurrent.atomic包就用到了CAS，如AtomicInteger可以用于Integer类型的原子性操作，可将上述代码改为如下，也是线程安全的

```java
@ThreadSafe
public class CountTest {

    public static AtomicInteger count = new AtomicInteger(0);

    public static void main(String[] args) {

        ExecutorService service = Executors.newCachedThreadPool();
        for (int i = 0; i < 5; i++) {
            service.execute(() -> {
                for (int j = 0; j < 1000; j++) {
                    count.getAndIncrement();
                }
            });
        }
        service.shutdown();
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("count = " + count);
    }
}
```
## CAS介绍

**CAS有3个操作数，内存值V，旧的预期值A，要修改的新值B。当且仅当预期值A和内存值V相同时，将内存值V修改为B，否则什么都不做**

![这里写图片描述](https://i-blog.csdnimg.cn/blog_migrate/9010bf2c95f600e444cb9ae858561d04.png)

仔细看图，CAS原理就是这么简单，看源码加深一下印象。

## 源码分析
基于jdk1.8.0_20
```java
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
	try {
		valueOffset = unsafe.objectFieldOffset
			(AtomicInteger.class.getDeclaredField("value"));
	} catch (Exception ex) { throw new Error(ex); }
}

private volatile int value;
```
AtomicInteger的值保存在value中，通过volatile保证操作的可见性，通过一个静态代码块来保证，类被加载时valueOffset已经有值了

Unsafe是一个不安全的类，提供了一些对底层的操作，我们是不能使用这个类的，valueOffset 是AtomicInteger对象value成员变量在内存中的偏移量

```java
public final int getAndIncrement() {
	return unsafe.getAndAddInt(this, valueOffset, 1);
}
```

```java
//第一个参数为当前这个对象，如count.getAndIncrement()，则这个参数则为count这个对象
//第二个参数为AtomicInteger对象value成员变量在内存中的偏移量
//第三个参数为要增加的值
public final int getAndAddInt(Object var1, long var2, int var4) {
	int var5;
	do {
		//调用底层方法得到value值
		var5 = this.getIntVolatile(var1, var2);
		//通过var1和var2得到底层值,var5为当前值，如果底层值=当前值，则将值设为var5+var4，并返回true，否则返回false
	} while(!this.compareAndSwapInt(var1, var2, var5, var5 + var4));

	return var5;
}
```
这个方法是由其他语言实现的，就不再分析
```java
public final native boolean compareAndSwapInt(Object var1, long var2, int var4, int var5);
```
**并发比较低的时候用CAS比较合适，并发比较高用synchronized比较合适**

## CAS的缺点

### 只能保证一个共享变量的原子操作

CAS 每次只能针对一个内存地址进行原子操作。如果要同时保证多个变量合并操作的原子性，CAS 就无能为力了

**解决办法**：从 Java 5 开始，可以使用 AtomicReference 来把多个变量封装成一个对象，然后对这个对象引用进行 CAS 操作

### 长时间自旋会给CPU带来压力

我们可以看到getAndAddInt方法执行时，如果CAS失败，会一直进行尝试。如果CAS长时间一直不成功，可能会给CPU带来很大的开销。

### ABA问题

这是 CAS 最经典的问题，场景如下

1. 线程 1 读取到内存值为 A。在线程 1 准备修改它之前，线程 2 把值改成了 B，接着又改回了 A。
2. 当线程 1 执行 CAS 时，发现值依然是 A，“误以为”这个值从来没被动过，于是修改成功。

**解决办法**：版本号机制，Java 提供了 AtomicStampedReference，它不仅比较值，还比较版本号