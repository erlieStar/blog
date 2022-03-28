---
layout: post
title: 读多写少？试试CopyOnWriteArrayList
lock: need
---

# 并发容器：读多写少？试试CopyOnWriteArrayList

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210222172213114.jpg?)

## 如何高效的读写缓存？
我原来遇到这样一种场景，我们将一些配置信息存在数据库中，但这种配置信息访问的频率非常高，如果每次从数据库中查询，会明显降低效率。后来我就在每次启动项目的时候把数据库中的数据加载到本地缓存中，当配置发生变化时同步更新缓存

本地缓存结构如下
```java
Map<String, List<Integer>> cache = new ConcurrentHashMap<>();
```
**这个缓存有什么问题呢？**

如果这个List的实现类是ArrayList，那么可能会发生线程安全问题。当读线程读取的时候，如果有写线程在写数据，**基于fast-fail机制，会抛出ConcurrentModificationException异常**

那我们把List换成Collections.synchronizedList或者Vector不就没问题了，但是这是基于synchronized来保证了线程安全，同一时间只能有一个线程获取到锁，执行效率不是很高。

**如果让你来改写这部分你会如何提高效率呢？**

对了，可以使用ReentrantReadWriteLock。这样读读就可以并行了

聪明，但是**如果你对数据一致性要求不高的话，还能再次提高效率，做到读写并行**

这个神奇的容器类就是CopyOnWriteArrayList和CopyOnWriteArraySet，**其实CopyOnWriteArrayList和CopyOnWriteArraySet背后的原理就是Copy-on-Write（写时复制），即在容器中的元素被修改时，复制数组，在复制的数组上做修改。当修改完毕用复制的数组替代旧的数组**

## 读取数组内容

读取数组内容不需要加锁，直接从数组中取值

```java
// CopyOnWriteArrayList
public E get(int index) {
    return get(getArray(), index);
}

final Object[] getArray() {
    return array;
}

private E get(Object[] a, int index) {
    return (E) a[index];
}
```
**注意array用volatile修饰（保证可见性），当写线程把array地址更新后，其他线程能看到更新后的array**
```java
private transient volatile Object[] array;
```

## 修改数组内容

整体思想就是加锁，复制新数组，在新数组上进行修改，修改完毕再用新数组替换旧数组

```java
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        newElements[len] = e;
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}
```
**此时读和写分别操作的是2个数组，做到了读写并行**

但是读取的时候可能会发生数据不一致的情况，因为读和写分别操作的是2个数组

## 适用场景
1. 业务场景读多写少
2. 对数据一致性要求不高可以考虑使用COW容器
