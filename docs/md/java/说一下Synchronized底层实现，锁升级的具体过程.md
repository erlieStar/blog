---
layout: post
title: 说一下Synchronized底层实现，锁升级的具体过程？
lock: need
---


# 面试官：说一下Synchronized底层实现，锁升级的具体过程？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200209225801557.jpg?)
## 介绍
这是我去年7，8月份面试的时候被问的一个面试题，说实话被问到这个问题还是很意外的，感觉这个东西没啥用啊，直到后面被问了一波new Object，Integer对象等作为加锁对象行吗？会出现哪些问题？为啥java6后synchronized性能大幅上升？我彻底蒙蔽了。下面详细总结一下
## synchronized使用方式
我们知道并发编程会产生各种问题的源头是可见性，原子性，有序性。
而synchronized能同时保证可见性，原子性，有序性。所以我们在解决并发问题的时候经常用synchronized，当然还有很多其他工具，如volatile。但是volatile只能保证可见性，有序性，不能保证原子性，参见我之前的文章

[面试官：volatile关键字用过吧？说一下作用和实现吧](https://blog.csdn.net/zzti_erlie/article/details/86355477)

synchronized可以用在如下地方

1. 修饰实例方法，对当前实例对象this加锁
2. 修饰静态方法，对当前类的Class对象加锁
3. 修饰代码块，指定加锁对象，对给定对象加锁

**修饰实例方法**

```java
public class SynchronizedDemo {
    
    public synchronized void methodOne() {
    
    }
}
```

**修饰静态方法**

```java
public class SynchronizedDemo {

    public static synchronized void methodTwo() {

    }
}
```

**修饰代码块**

```java
public class SynchronizedDemo {

    public void methodThree() {
    	// 对当前实例对象this加锁
        synchronized (this) {
        
        }
    }

    public void methodFour() {
    	// 对class对象加锁
        synchronized (SynchronizedDemo.class) {
        
        }
    }
}
```

## synchronized实现原理
### Java对象组成
我们都知道对象是放在堆内存中的，对象大致可以分为三个部分，分别是对象头，实例变量和填充字节
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200206223855185.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

 - 对象头，主要包括两部分1. Mark Word (标记字段)，2.Klass Pointer(类型指针)。Klass Point 是对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是哪个类的实例。Mark Word用于存储对象自身的运行时数据
 - 实例变量，存放类的属性数据信息，包括父类的属性信息，这部分内存按4字节对齐
 - 填充数据，由于虚拟机要求对象起始地址必须是8字节的整数倍。填充数据不是必须存在的，仅仅是为了字节对齐

synchronized不论是修饰方法还是代码块，都是通过持有修饰对象的锁来实现同步，那么synchronized锁对象是存在哪里的呢？答案是存在锁对象的对象头Mark Word，来看一下Mark Word存储了哪些内容？

由于对象头的信息是与对象自身定义的数据没有关系的额外存储成本，因此考虑到JVM的空间效率，Mark Word 被设计成为一个非固定的数据结构，以便存储更多有效的数据，它会根据对象本身的状态复用自己的存储空间，也就是说，Mark Word会随着程序的运行发生变化，变化状态如下 (32位虚拟机)：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200206225939472.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
其中轻量级锁和偏向锁是Java 6 对 synchronized 锁进行优化后新增加的，稍后我们会简要分析。这里我们主要分析一下重量级锁也就是通常说synchronized的对象锁，锁标识位为10，其中指针指向的是monitor对象（也称为管程或监视器锁）的起始地址。每个对象都存在着一个 monitor 与之关联。在Java虚拟机(HotSpot)中，monitor是由ObjectMonitor实现的，其主要数据结构如下（位于HotSpot虚拟机源码ObjectMonitor.hpp文件，C++实现的），省略部分属性

```java
ObjectMonitor() {
    _count        = 0; //记录数
    _recursions   = 0; //锁的重入次数
    _owner        = NULL; //指向持有ObjectMonitor对象的线程 
    _WaitSet      = NULL; //调用wait后，线程会被加入到_WaitSet
    _EntryList    = NULL ; //等待获取锁的线程，会被加入到该列表
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200206232455228.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
结合线程状态解释一下执行过程。(状态装换参考自《深入理解Java虚拟机》)

1. 新建（New），新建后尚未启动的线程
2. 运行（Runable），Runnable包括了操作系统线程状态中的Running和Ready
3. 无限期等待（Waiting），不会被分配CPU执行时间，要等待被其他线程显式的唤醒。例如调用没有设置Timeout参数的Object.wait()方法
4. 限期等待（Timed Waiting），不会被分配CPU执行时间，不过无需等待其他线程显示的唤醒，在一定时间之后会由系统自动唤醒。例如调用Thread.sleep()方法
5. 阻塞（Blocked），线程被阻塞了，“阻塞状态”与“等待状态”的区别是：“阻塞状态”在等待获取着一个排他锁，这个事件将在另外一个线程放弃这个锁的时候发生，而“等待状态”则是在等待一段时间，或者唤醒动作的发生。在程序等待进入同步区域的时候，线程将进入这种状态
6. 结束（Terminated）：线程结束执行
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200209095306245.png)

对于一个synchronized修饰的方法(代码块)来说：

1. 当多个线程同时访问该方法，那么这些线程会先被**放进_EntryList队列**，此时线程处于blocked状态
8. 当一个线程获取到了对象的monitor后，那么就可以进入running状态，执行方法，此时，ObjectMonitor对象的/**_owner指向当前线程，_count加1**表示当前对象锁被一个线程获取
9. 当running状态的线程调用wait()方法，那么当前线程释放monitor对象，进入waiting状态，ObjectMonitor对象的/**_owner变为null，_count减1**，同时线程进入_WaitSet队列，直到有线程调用notify()方法唤醒该线程，**则该线程进入_EntryList队列，竞争到锁再进入_Owner区**
10. 如果当前线程执行完毕，那么也释放monitor对象，ObjectMonitor对象的/**_owner变为null，_count减1**

由此看来，monitor对象存在于每个Java对象的对象头中(存储的是指针)，synchronized锁便是通过这种方式获取锁的，也是**为什么Java中任意对象可以作为锁的原因，同时也是notify/notifyAll/wait等方法存在于顶级对象Object中的原因**

### synchronized如何获取monitor对象？
那么synchronized是通过什么方式来获取monitor对象的？
#### synchronized修饰代码块

```java
public class SyncCodeBlock {
    public int count = 0;
    public void addOne() {
        synchronized (this) {
            count++;
        }
    }
}
```

```java
javac SyncCodeBlock.java
javap -v SyncCodeBlock.class
```
反编译的字节码如下

```java
  public void addOne();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=3, locals=3, args_size=1
         0: aload_0
         1: dup
         2: astore_1
         3: monitorenter // 进入同步方法
         4: aload_0
         5: dup
         6: getfield      #2                  // Field count:I
         9: iconst_1
        10: iadd
        11: putfield      #2                  // Field count:I
        14: aload_1
        15: monitorexit // 退出同步方法
        16: goto          24
        19: astore_2
        20: aload_1
        21: monitorexit // 退出同步方法
        22: aload_2
        23: athrow
        24: return
      Exception table:
```
可以看到进入同步代码块，执行monitorenter指令，退出同步代码块，执行monitorexit指令，可以看到有2个monitorexit指令，第一个是正常退出执行的，第二个是当异常发生时执行的
#### synchronized修饰方法

```java
public class SyncMethod {
    public int count = 0;
    public synchronized void addOne() {
        count++;
    }
}
```
反编译的字节码如下

```java
  public synchronized void addOne();
    descriptor: ()V
    // 方法标识ACC_PUBLIC代表public修饰，ACC_SYNCHRONIZED指明该方法为同步方法
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED
    Code:
      stack=3, locals=1, args_size=1
         0: aload_0
         1: dup
         2: getfield      #2                  // Field count:I
         5: iconst_1
         6: iadd
         7: putfield      #2                  // Field count:I
        10: return
      LineNumberTable:
```

我们并没有看到monitorenter和monitorexit指令，那是怎么来实现同步的呢？
可以看到方法被标识为ACC_SYNCHRONIZED，表明这是一个同步方法
## 锁的升级
在Java早期版本中，synchronized属于重量级锁，效率低下，因为操作系统实现线程之间的切换时需要从用户态转换到核心态，这个状态之间的转换需要相对比较长的时间，时间成本相对较高。庆幸的是在Java 6之后Java官方对从JVM层面对synchronized较大优化，所以现在的synchronized锁效率也优化得很不错了，Java 6之后，为了减少获得锁和释放锁所带来的性能消耗，引入了偏向锁和轻量级锁，简单介绍一下

synchronized锁有四种状态，无锁，偏向锁，轻量级锁，重量级锁，这几个状态会随着竞争状态逐渐升级，**锁可以升级但不能降级，但是偏向锁状态可以被重置为无锁状态**

### 偏向锁
**为什么要引入偏向锁？**

因为经过HotSpot的作者大量的研究发现，大多数时候是不存在锁竞争的，常常是一个线程多次获得同一个锁，因此如果每次都要竞争锁会增大很多没有必要付出的代价，为了降低获取锁的代价，才引入的偏向锁。

**偏向锁原理和升级过程**

当线程1访问代码块并获取锁对象时，会在java对象头和栈帧中记录偏向的锁的threadID，因为**偏向锁不会主动释放锁**，因此以后线程1再次获取锁的时候，需要**比较当前线程的threadID和Java对象头中的threadID是否一致**，如果一致（还是线程1获取锁对象），则无需使用CAS来加锁、解锁；如果不一致（其他线程，如线程2要竞争锁对象，而偏向锁不会主动释放因此还是存储的线程1的threadID），那么**需要查看Java对象头中记录的线程1是否存活**，如果没有存活，那么锁对象被重置为无锁状态，其它线程（线程2）可以竞争将其设置为偏向锁；如果存活，那么立刻**查找该线程（线程1）的栈帧信息，如果还是需要继续持有这个锁对象**，那么暂停当前线程1，撤销偏向锁，升级为轻量级锁，如果线程1 不再使用该锁对象，那么将锁对象状态设为无锁状态，重新偏向新的线程。

### 轻量级锁
**为什么要引入轻量级锁？**

轻量级锁考虑的是竞争锁对象的线程不多，而且线程持有锁的时间也不长的情景。因为阻塞线程需要CPU从用户态转到内核态，代价较大，如果刚刚阻塞不久这个锁就被释放了，那这个代价就有点得不偿失了，因此这个时候就干脆不阻塞这个线程，让它自旋这等待锁释放。

**轻量级锁原理和升级过程**

线程1获取轻量级锁时会先**把锁对象的对象头MarkWord复制一份到线程1的栈帧中创建的用于存储锁记录的空间**（称为DisplacedMarkWord），然后使**用CAS把对象头中的内容替换为线程1存储的锁记录（DisplacedMarkWord）的地址；**

如果在线程1复制对象头的同时（在线程1CAS之前），线程2也准备获取锁，复制了对象头到线程2的锁记录空间中，但是在线程2CAS的时候，发现线程1已经把对象头换了，**线程2的CAS失败，那么线程2就尝试使用自旋锁来等待线程1释放锁。** 自旋锁简单来说就是让线程2在循环中不断CAS

但是如果自旋的时间太长也不行，因为自旋是要消耗CPU的，因此自旋的次数是有限制的，比如10次或者100次，**如果自旋次数到了线程1还没有释放锁，或者线程1还在执行，线程2还在自旋等待，这时又有一个线程3过来竞争这个锁对象，那么这个时候轻量级锁就会膨胀为重量级锁。重量级锁把除了拥有锁的线程都阻塞，防止CPU空转。**

### 几种锁的优缺点
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200209103510228.png?)
## 用锁的最佳实践
**错误的加锁姿势1**

```java
synchronized (new Object())
```
每次调用创建的是不同的锁，相当于无锁

**错误的加锁姿势2**

```java
private Integer count;
synchronized (count)
```
String，Boolean在实现了都用了享元模式，即值在一定范围内，对象是同一个。所以看似是用了不同的对象，其实用的是同一个对象。会导致一个锁被多个地方使用

[Java常量池详解，秒懂各种对象相等操作](https://blog.csdn.net/zzti_erlie/article/details/86587263)

**正确的加锁姿势**
```java
// 普通对象锁
private final Object lock = new Object();
// 静态对象锁
private static final Object lock = new Object();
```