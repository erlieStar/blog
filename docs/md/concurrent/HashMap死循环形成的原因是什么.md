---
layout: post
title: HashMap死循环形成的原因是什么？
lock: need
---

# 并发容器：HashMap死循环形成的原因是什么？

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3195b329f990d2aa0c1d9d2d78e08b42.jpeg)
## 介绍

**HashMap 死循环主要发生在 JDK 1.7 及以前的版本中，其根本原因在于：在多线程并发扩容时，HashMap 使用的“头插法”倒序迁移链表节点，导致链表形成了环形结构（$A \rightarrow B \rightarrow A$）**

当后续对该位置进行 get() 或 put() 操作遍历此链表时，CPU 就会陷入 while(e != null) 的死循环，占用率飙升至 100%

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

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d0caf655ca2f142d623e364ec212ea5d.jpeg)

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
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/05a59bfd358425a2f8400776ef20633b.png)

线程2也来执行transfer函数，并执行完成，此时的状态为

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a2aaa39a93987305fdcb62be066585b6.png)

此时线程1接着执行余下的代码，将key3放到线程1的table[3]处

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/763e45cef5d65207dce2da75c89ad3de.png)

接着将e指向key7，不为null，再次进入循环，将next指向key3如下图


![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/14e48b7bab1aaa6745e579c87b24257c.png)

当跑完这次循环时key7被放入线程1的table中，e指向key3，next指向null

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/edaef5b4595cd3a5a048a3fa63793b32.png)

e不为null，还能再次执行循环，key3再次插入线程1中table[3]的头节点，此时e变为null,循环完毕。结构如下

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a04a4d2048f37b1d9655661b7045c8bc.png)

环形链表形成，此时无论将线程1还是线程2的table设置为newTable，当调用get方法执行到这条链上时，死循环形成

**JDK 1.8 对 HashMap 的扩容机制进行了重大改进，改用尾插法，彻底解决了死循环问题**

尾插法：保持链表中元素的相对顺序不变（原序迁移），不再翻转链表