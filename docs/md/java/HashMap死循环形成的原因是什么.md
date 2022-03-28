---
layout: post
title: HashMap死循环形成的原因是什么？
lock: need
---

# 面试官：HashMap死循环形成的原因是什么？

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020090200112054.jpg?)

## 介绍
之前的文章已经分析了HashMap在JDK1.7的实现，这篇文章就只分析HashMap死循环形成的原因

死循环形成是在扩容转移元素的时候发生的

```java
void resize(int newCapacity) {
	Entry[] oldTable = table;
	int oldCapacity = oldTable.length;
	if (oldCapacity == MAXIMUM_CAPACITY) {
		threshold = Integer.MAX_VALUE;
		return;
	}

	Entry[] newTable = new Entry[newCapacity];
	transfer(newTable, initHashSeedAsNeeded(newCapacity));
	table = newTable;
	threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
}
```
发生的具体时机在transfer函数中，默认情况下rehash为false
```java
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next;
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity);
            e.next = newTable[i];
            newTable[i] = e;
            e = next;
        }
    }
}
```
## 正常的transfer过程
例子不考虑扩容阈值，假设放4个元素时开始扩容

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200306233930898.jpg?)

主要有2个有意思的地方
1. 原来在oldTable[i]位置的元素，会被放到newTable[i]或者newTable[i+oldTable.length]的位置
2. 链表在复制的时候会反转
## 并发下异常的transfer
假设线程1执行完Entry<K,V> next = e.next后被挂起，此时e指向key3，next指向key7
```java
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next; // 线程1执行完这一句被挂起
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity);
            e.next = newTable[i];
            newTable[i] = e;
            e = next;
        }
    }
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200306215318313.PNG?)

线程2也来执行transfer函数，并执行完成，此时的状态为

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020030622101286.PNG?)

此时线程1接着执行余下的代码，将key3放到线程1的table[3]处

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020030622155248.PNG?)

接着将e指向key7，不为null，再次进入循环，将next指向key3如下图


![在这里插入图片描述](https://img-blog.csdnimg.cn/20200306230018787.PNG?)

当跑完这次循环时key7被放入线程1的table中，e指向key3，next指向null

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200306231918170.PNG?)

e不为null，还能再次执行循环，key3再次插入线程1中table[3]的头节点，此时e变为null,循环完毕。结构如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200306235113474.PNG?)

环形链表形成，此时无论将线程1还是线程2的table设置为newTable，当调用get方法执行到这条链上时，死循环形成