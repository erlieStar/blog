---
layout: post
title: Object类有哪些方法？
lock: need
---

# 面试官：Object类有哪些方法？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210228195419484.jpg?)
## 方法介绍
**1.getClass()**

final，native方法，获得运行时类型。

**2.hashCode()**

hashCode()方法主要用于hash表，比如HashMap，当集合要添加元素时，大致按如下步骤：

1. 先调用该元素的hashCode()方法获取hashCode，hashCode对数组取模定位到它应该放置的物理位置
2. 如果这个位置上没有元素，就直接存储在这个位置上
3. 如果这个位置上已经有元素，就调用equals()方法进行比较，相同的话就更新，不相同的话放到链表后面

所以重写equals()方法时，也必须重写hashCode()方法。如果不这样做，就会违反Object.hashCode()的规范，导致无法结合所有基于hash的集合一起正常运作，这样的集合包括HashMap、HashSet和Hashtable

那为什么不直接使用equals()进行操作呢？如果只使用equals()，意味着需要迭代整个集合进行比较操作，如果集合中有1万个元素，就需要进行1万次比较，这明显不可行

**3.equals(obj)**

该方法是非常重要的一个方法。一般equals和==是不一样的，但是在Object中两者是一样的。子类一般都要重写这个方法。

**4.clone()**

保护方法，实现对象的浅复制，只有实现了Cloneable接口才可以调用该方法，否则抛出CloneNotSupportedException异常。

**5.toString()**

该方法用得比较多，一般子类都有覆盖。

**6.notify()**

该方法唤醒在该对象上等待的某个线程。

**7.notifyAll()**

该方法唤醒在该对象上等待的所有线程。

**8.wait()**

wait方法就是使当前线程等待该对象的锁，当前线程必须是该对象的拥有者，也就是具有该对象的锁。wait()方法一直等待，直到获得锁或者被中断。

调用该方法后当前线程进入睡眠状态，直到以下事件发生。

1. 其他线程调用了该对象的notify方法。
2. 其他线程调用了该对象的notifyAll方法。
3. 其他线程调用了interrupt中断该线程。
4. 时间间隔到了。

此时该线程就可以被调度了，如果是被中断的话就抛出一个InterruptedException异常

**9.wait(long)**

wait(long timeout)设定一个超时间隔，如果在规定时间内没有获得锁就返回。

**10.wait(long, int)**

在纳秒级别进行更精细的等待控制，一般用不到。

**11.finalize()**

该方法用于释放资源。因为无法确定该方法什么时候被调用。如果你想使用这个方法，百度一下相关的内容，然后不要使用它

**wait，notify，notifyAll就是线程之间用来通信的工具**