---
layout: post
title: Object类有哪些方法？
lock: need
---

# 面试官：Object类有哪些方法？
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/63214dd5383196eb2ec70f8e5803a5a7.jpeg)
## 常用方法
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

**6.finalize()**

该方法用于释放资源。因为无法确定该方法什么时候被调用。如果你想使用这个方法，百度一下相关的内容，然后不要使用它
## 重点方法介绍

**wait，notify，notifyAll是线程之间用来通信的工具，都定义在Object类上，必须在同步块/同步方法中调用**

### wait
**让当前线程进入 WAITING 状态，释放对象锁**

调用该方法后当前线程进入睡眠状态，直到以下事件发生。

1. 其他线程调用了该对象的notify方法。
2. 其他线程调用了该对象的notifyAll方法。
3. 其他线程调用了interrupt中断该线程。
4. 时间间隔到了。

此时该线程就可以被调度了，如果是被中断的话就抛出一个InterruptedException异常

常见形式：

1. wait()：无限等待，直到被唤醒。
2. wait(long timeout)：等待指定毫秒数后自动唤醒。
3. wait(long timeout, int nanos)：更精确的超时控制。

### notify

作用：**唤醒在该对象等待集中的某一个线程**

1. 具体唤醒哪个线程由 JVM 调度决定，不保证公平。
2. 被唤醒的线程不会立即执行，它需要重新竞争对象锁，获得锁后才从 wait() 返回。

### notifyAll

作用：**唤醒在该对象等待集中的所有线程**

- 所有被唤醒的线程都会去竞争锁，一次只有一个能进入临界区。
- notifyAll 通常比 notify 更安全，避免“唤醒丢失”问题。

| 要点 | 说明 |
|------|------|
| 必须先持有锁 | 必须在 synchronized 方法或块中调用，否则抛出 IllegalMonitorStateException |
| 用 while 而非 if 检查条件 | 因为线程被唤醒后条件可能再次变化（虚假唤醒或竞争） |
| notify 易丢失唤醒 | 如果唤醒的线程无法执行后续操作，其他线程可能永久等待 |
| notifyAll 开销稍大 | 但更安全，多数情况优先使用 |
| 锁与等待集关联 | 每个对象有一个监视器锁和一个等待集（wait 进入，notify 移出） |

经典使用模式（生产者-消费者示例）
```java
public class SharedQueue {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int MAX_SIZE = 5;

    public synchronized void produce(int value) throws InterruptedException {
        while (queue.size() == MAX_SIZE) {
            wait();   // 队列满，等待消费者消费
        }
        queue.add(value);
        System.out.println("Produced: " + value);
        notifyAll(); // 唤醒可能等待的消费者
    }

    public synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();   // 队列空，等待生产者生产
        }
        int value = queue.poll();
        System.out.println("Consumed: " + value);
        notifyAll(); // 唤醒可能等待的生产者
        return value;
    }
}
```