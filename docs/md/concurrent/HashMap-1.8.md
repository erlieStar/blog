---
layout: post
title: HashMap（JDK1.8）
lock: need
---
# 并发容器：HashMap（JDK1.8）

![在这里插入图片描述](https://img-blog.csdnimg.cn/3054c895fa1c479b8ca464edafee716f.png)

## JDK1.8源码
### 构造函数

```java
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                           initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                           loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}
```

构造函数没啥变化，还是原来的2个参数
1. initialCapacity：table数组的初始化大小
2. loadFactor：负载因子

### put执行过程

1. 对key的hashcode()高16位和低16位进行异或运算求出具体的hash值
2. 如果table数组没有初始化，则初始化table数组长度为16
3. 根据hash值计算index，如果没碰撞则直接放到bucket里（bucket可为链表或者红黑树）
4. 链表长度超过8则转为红黑树
5. 如果key已经存在，用new value替换old value，并返回old value
6. 如果超过扩容的阈值则进行扩容，threshold = capacity * load factor
```java
public V put(K key, V value) {
	return putVal(hash(key), key, value, false, true);
}
```
从hashu函数可以看到存取key为null的数据并没有进行特判，而是通过将hash值返回为0将其放在table[0]处
```java
static final int hash(Object key) {
	int h;
	// 对象的hashCode高16位和低16位进行异或操作
	return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```
和jdk1.7相比数组中的元素从Entry对象变为Node对象，只是换了一个名，属性之类的没有变

putVal的代码长度比较长，我们先理一下整体思路，再看代码细节

![在这里插入图片描述](https://img-blog.csdnimg.cn/4ae6f7b8d2bd47d8a6ca25842245f895.png)

数组没初始化则先初始化数组，没发生碰撞则直接放到bucket中。

如果发生碰撞，则放到bucket中，如果key值已经存在则将原来的Node赋值给e。e不为空，则返回旧值，并根据onlyIfAbsent参数来决定是否用新值替换旧值

接着就是扩容操作

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
			   boolean evict) {
	Node<K,V>[] tab; Node<K,V> p; int n, i;
	// 如果HashMap的初始容量没有指定，则为16
	if ((tab = table) == null || (n = tab.length) == 0)
		n = (tab = resize()).length;
	// 用hash值求出bucket的位置
	if ((p = tab[i = (n - 1) & hash]) == null)
		// bucket位置上没有放元素,放置第一个元素
		tab[i] = newNode(hash, key, value, null);
	else {
		// bucket位置上已经有了元素
		// e用来保存已经存在的同名key的Node
		Node<K,V> e; K k;
		// 特判 bucket 的第一个节点是否是同名key
		if (p.hash == hash &&
			((k = p.key) == key || (key != null && key.equals(k))))
			e = p;
		else if (p instanceof TreeNode)
			// 判断该链为红黑树
			e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
		else {
			// 判断该链为链表
			for (int binCount = 0; ; ++binCount) {
				if ((e = p.next) == null) {
					// 插入新元素，可以看到是尾插法
					p.next = newNode(hash, key, value, null);
					// 链表长度 >= 8，并且数组长度 >= 64，链表转为红黑树
                    // 否则扩容
					if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
						treeifyBin(tab, hash);
					break;
				}
				if (e.hash == hash &&
					((k = e.key) == key || (key != null && key.equals(k))))
					break;
				// 遍历链表的下一个节点
				p = e;
			}
		}
		// 有同名key
		if (e != null) { // existing mapping for key
			V oldValue = e.value;
			if (!onlyIfAbsent || oldValue == null)
				// key相等用新值替换旧值
				e.value = value;
			afterNodeAccess(e);
			return oldValue;
		}
	}
	++modCount;
	// 超过扩容阈值则扩容
	if (++size > threshold)
		resize();
	afterNodeInsertion(evict);
	return null;
}
```
**这里有个需要注意的点为**

链表长度 >= 8，并且数组长度 >= 64，链表转为红黑树，否则扩容

**jdk1.8在rehash的过程中，计算元素在新数组中的下标的算法发生了变化（实际效果没发生改变）**
1. jdk1.7，index = hash & (newTable.length - 1)
2. jdk1.8，index = hash & oldTable.length == 0 ? i : i + oldTable.length （i为元素在旧数组中的下标值）


```java
final Node<K,V>[] resize() {
	Node<K,V>[] oldTab = table;
	int oldCap = (oldTab == null) ? 0 : oldTab.length;
	int oldThr = threshold;
	int newCap, newThr = 0;
	if (oldCap > 0) {
		// 查过最大值就不再扩充
		if (oldCap >= MAXIMUM_CAPACITY) {
			threshold = Integer.MAX_VALUE;
			return oldTab;
		}
		// 没超过最大值，就扩充为原来的2倍
		else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
				 oldCap >= DEFAULT_INITIAL_CAPACITY)
			newThr = oldThr << 1; // double threshold
	}
	else if (oldThr > 0) // initial capacity was placed in threshold
		newCap = oldThr;
	else {               // zero initial threshold signifies using defaults
		newCap = DEFAULT_INITIAL_CAPACITY;
		newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
	}
	// 重新计算扩容阈值
	if (newThr == 0) {
		float ft = (float)newCap * loadFactor;
		newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
				  (int)ft : Integer.MAX_VALUE);
	}
	threshold = newThr;
	@SuppressWarnings({"rawtypes","unchecked"})
		Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
	table = newTab;
	if (oldTab != null) {
		// 把每个bucket都移动到新的bucket中
		for (int j = 0; j < oldCap; ++j) {
			Node<K,V> e;
			if ((e = oldTab[j]) != null) {
				oldTab[j] = null;
				if (e.next == null)
					newTab[e.hash & (newCap - 1)] = e;
				else if (e instanceof TreeNode)
					((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
				else { // preserve order
					// 链表优化重hash的代码块
					Node<K,V> loHead = null, loTail = null;
					Node<K,V> hiHead = null, hiTail = null;
					Node<K,V> next;
					do {
						next = e.next;
						if ((e.hash & oldCap) == 0) {
							if (loTail == null)
								loHead = e;
							else
								loTail.next = e;
							loTail = e;
						}
						else {
							if (hiTail == null)
								hiHead = e;
							else
								hiTail.next = e;
							hiTail = e;
						}
					} while ((e = next) != null);
					if (loTail != null) {
						loTail.next = null;
						newTab[j] = loHead;
					}
					if (hiTail != null) {
						hiTail.next = null;
						newTab[j + oldCap] = hiHead;
					}
				}
			}
		}
	}
	return newTab;
}
```
在rehash的过程中，链表没有发生倒置

![在这里插入图片描述](https://img-blog.csdnimg.cn/b91075963a6342dda479321ecc89b88c.png)

### get执行过程

1. 对key的hashcode()高16位和低16位进行异或运算求出具体的hash值
5. 如果在bucket里的第一个节点直接命中，则直接返回
6. 如果有冲突，通过key.equals(k)去查找对应的Node，并返回value。在树中查找的效率为O(logn)，在链表中查找的效率为O(n)

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}
```

```java
final Node<K,V> getNode(int hash, Object key) {
	Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
	if ((tab = table) != null && (n = tab.length) > 0 &&
		(first = tab[(n - 1) & hash]) != null) {
		if (first.hash == hash && // always check first node
			((k = first.key) == key || (key != null && key.equals(k))))
			return first;
		if ((e = first.next) != null) {
			if (first instanceof TreeNode)
				return ((TreeNode<K,V>)first).getTreeNode(hash, key);
			do {
				if (e.hash == hash &&
					((k = e.key) == key || (key != null && key.equals(k))))
					return e;
			} while ((e = e.next) != null);
		}
	}
	return null;
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/47c2972f2c504ddf9affdd3eea02131b.png)

## 常见面试题
### HashMap，HashTable，ConcurrentHashMap之间的区别
|对象     | key和value是否允许为空         | 是否线程安全| 
|:-------------: |:-------------:| :-------------:| 
| HashMap  | key和value都允许为null |否|
| HashTable | key和value都不允许为null | 是 |
| ConcurrentHashMap |key和value都不允许为null|是|
### HashMap在什么条件下扩容
**jdk1.7**

1. 超过扩容的阈值
2. 发生碰撞

**jdk1.8**
1. 超过扩容的阈值
### HashMap的大小为什么是$2^n$
为了通过hash值确定元素在数组中存的位置，我们需要进行如下操作hash%length，当时%操作比较耗时间，所以优化为 hash & (length - 1)

当length为2的n次方时，hash & (length - 1) =hash % length

我们假设数组的长度为15和16，hash码为8和9
| h & (length - 1)       | h          |length|index|
| ------------- |:-------------|:-------------| :-------------|
| 8 & (15 - 1)    | 0100 |1110|0100|
| 9 & (15 - 1) |0101|1110|0100|  
| 8 & (16 - 1)    | 0100 |1111|0100|
| 9 & (16 - 1) |0101|1111|0101|
可以看出数组长度为15的时候，hash码为8和9的元素被放到数组中的同一个位置形成链表，键低了查询效率，当hahs码和15-1(1110)进行&时，最后一位永远是0，这样0001，0011，0101，1001，1011，0111，1101这些位置永远不会被放置元素，这样会导致

1. 空间浪费大
2. 增加了碰撞的几率，减慢查询的效率

当数组长度为$2^n$时，$2^n-1$的所有位都是1，如8-1=7即111，那么进行低位&运算时，值总与原来的hash值相同，降低了碰撞的概率

## JDK1.8发生了哪些变化？
1. 由数组+链表改为数组+链表+红黑树，当链表的长度超过8时，链表变为红黑树。
    1. **为什么要这么改？**
       我们知道链表的查找效率为O(n)，而红黑树的查找效率为O（logn），查找效率变高了。
    2. **为什么不直接用红黑树？**
       因为红黑树的查找效率虽然变高了，但是插入效率变低了，如果从一开始就用红黑树并不合适。从概率学的角度选了一个合适的临界值为8
2. 优化了hash算法（高低16位异或操作）
3. 计算元素在新数组中位置的算法发生了变化，index = hash & oldTable.length == 0 ? i : i + oldTable.length （i为元素在旧数组中的下标值）
4. 头插法改为尾插法，扩容时链表没有发生倒置（避免形成死循环）
5. 当放入的key值已经存在时，可以让用户决定是否用新值替换旧值
## HashMap在高并发下会发生什么问题？
1. 多线程扩容，会让链表形成环，从而造成死循环
2. 多线程put可能导致元素丢失

**jdk1.8中死循环问题已经解决，元素丢失问题还存在**

## 如何避免HashMap在高并发下的问题？
1. 使用ConcurrentHashMap
2. 用Collections.synchronizedMap(hashMap)包装成同步集合
