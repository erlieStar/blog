---
layout: post
title: 既然你用了原子类，那你知道CAS的工作原理是啥吗？
lock: need
---

# 面试官：既然你用了原子类，那你知道CAS的工作原理是啥吗？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200902211819739.png?)
## 前言

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
synchronized属于悲观锁，它有一个明显的缺点，它不管数据存不存在竞争都加锁，随着并发量增加，且如果锁的时间比较长，其性能开销将会变得很大。有没有办法解决这个问题？答案是基于冲突检测的乐观锁。这种模式下，已经没有所谓的锁概念了，每个线程都直接先去执行操作，检测是否与其他线程存在共享数据竞争，如果没有则让此操作成功，如果存在共享数据竞争则不断地重新执行操作，直到成功为止，重新尝试的过程叫自旋

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
CAS（Compare and Swap）, 翻译成比较并交换。
>CAS有3个操作数，内存值V，旧的预期值A，要修改的新值B。当且仅当预期值A和内存值V相同时，将内存值V修改为B，否则什么都不做。 

![这里写图片描述](https://img-blog.csdn.net/20180417153325899?)

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

 **1.只能保证对一个变量的原子性操作**
 当对一个共享变量执行操作时，我们可以使用循环CAS的方式来保证原子操作，但是对多个共享变量操作时，循环CAS就无法保证操作的原子性，这个时候就可以用锁来保证原子性。

 **2.长时间自旋会给CPU带来压力**
 我们可以看到getAndAddInt方法执行时，如果CAS失败，会一直进行尝试。如果CAS长时间一直不成功，可能会给CPU带来很大的开销。

 **3.ABA问题**
如果内存地址V初次读取的值是A，并且在准备赋值的时候检查到它的值仍然为A，那我们就能说它的值没有被其他线程改变过了吗？

如果在这段期间它的值曾经被改成了B，后来又被改回为A，那CAS操作就会误认为它从来没有被改变过。这个漏洞称为CAS操作的“ABA”问题。Java并发包为了解决这个问题，提供了一个带有标记的原子引用类“AtomicStampedReference”，它可以通过控制变量值的版本来保证CAS的正确性。因此，在使用CAS前要考虑清楚“ABA”问题是否会影响程序并发的正确性，如果需要解决ABA问题，改用传统的互斥同步可能会比原子类更高效。