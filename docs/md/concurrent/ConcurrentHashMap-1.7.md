---
layout: post
title: ConcurrentHashMap（JDK1.7）
lock: need
---

# 并发容器：ConcurrentHashMap（JDK1.7）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210210185834197.jpg?)

## HashMap不是线程安全的
我们知道HashMap不是线程安全的，在高并发下会发生如下问题

1. 多线程扩容，会让链表形成环，从而造成死循环
2. 多线程put可能导致元素丢失

**jdk1.8中死循环问题已经解决，元素丢失问题还存在**

那如何避免HashMap在高并发下的问题呢？

1. 使用ConcurrentHashMap
2. 使用Hashtable
3. 用Collections.synchronizedMap(hashMap)包装成线程安全的集合，原理就是返回传入map的代理类，代理类将所有方法用synchronized修饰

Hashtable实现线程安全的方式是用synchronized修饰方法，如get和put方法都是用synchronized修饰的，使用的是对象锁，这样会导致线程1get元素（或者put元素）时，线程2不能get元素和put元素，在竞争激烈的时候会出现严重的性能问题。

下面我们就来分析一下ConcurrentHashMap和Hashtable相比，是如何提高并发度的

JDK1.7实现：数组+链表

JDK1.7保证并发安全：Segment 分段锁 + Unsafe

JDK1.8实现：数组+链表+红黑树

JDK1.8保证并发安全： CAS + synchronized + Unsafe

## JDK1.7源码
Hashtable出现性能问题的原因是所有访问Hashtable的线程都在竞争同一把锁，如果让你优化的话你会如何提高并发度？

**多搞几个锁不就行了？数组中每隔一段距离用一把锁，这就是分段锁的基本思路**

ConcurrentHashMap的主要结构如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/d42639442f114b5c9cd9bcdae47536b6.png)

假设我们有三个键值对，dnf:1，cf:2，lol:3，每次放值会进行2次hash，即先确定放在哪个Segment中，再确定放在哪个HashEntry中。

JDK1.7采用头插法

JDK1.8采用尾插法

假设三个键值对同时进行放，1=hash1(dnf)，知道了放在应该放在segments[1]处，接着获取到segments[1]的锁，再进行hash，2=hash2(dnf)，即放在hashentrys[2]处，放完对segments[1]解锁

3=hash1(cf)，放在segments[3]处，获取到segments[3]的锁，0=hash2(cf)，放在hashentrys[0]，放完对segments[3]解锁

1=hash1(lol)，放在segments[1]处，因为此时segments[1]的锁已经被key为dnf的键值对获取，所以会阻塞的获取锁，直到锁被放置key为dnf的这一步操作释放，获取到锁后，2=hash2(lol)，放在hashentrys[2]处，因为已经有值了，采用头插法，放在链表的头节点

3个线程操作完，结果如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/e20a01dd5d1f40e7bbc922c915c7194d.png)

到现在我们了解到对ConcurrentHashMap的操作，基本上就是对Segment数组和HashEntry数组进行操作，所以我们先看一下这2个类的定义

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {

	// hash数组
	transient volatile HashEntry<K,V>[] table;

	// 元素数量
	transient int count;

	// 段被修改的次数（如执行put或者remove）
	transient int modCount;

	// 进行扩容的阀值
	transient int threshold;

	// 负载因子
	final float loadFactor;

	Segment(float lf, int threshold, HashEntry<K,V>[] tab) {
		this.loadFactor = lf;
		this.threshold = threshold;
		this.table = tab;
	}
}
```

Segment继承自ReentrantLock，原来Segment是通过ReentrantLock来加锁的

```java
static final class HashEntry<K,V> {
	final int hash;
	final K key;
	volatile V value;
	volatile HashEntry<K,V> next;

	HashEntry(int hash, K key, V value, HashEntry<K,V> next) {
		this.hash = hash;
		this.key = key;
		this.value = value;
		this.next = next;
	}

}
```
**注意这里value和next用volatile修饰，保证了可见性，这样在遍历链表的时候就不用加锁了**

### 构造函数

```java
 public ConcurrentHashMap() {
     this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR, DEFAULT_CONCURRENCY_LEVEL);
 }
```

1. initialCapacity：table数组的初始化大小（默认为16）
2. loadFactor：负载因子（默认为0.75）
3. concurrencyLevel：并发等级，用来确定Segment的个数，Segment的个数要大于等于并发等级（默认为16）

![在这里插入图片描述](https://img-blog.csdnimg.cn/a5ae1b2a46fb4b96b217c3294244cbec.png)

构造函数的代码挺长的，但最重要的作用就是确定Segment数组的长度，以及每个Segment数组里面HashEntry的数组长度，另外先创建一个Segment对象放到Segment[0]处

默认情况下initialCapacity和concurrencyLevel都为16，**这样就会导致segments的数组长度是16，每个Segment里面的HashEntry数组的大小为2**

**我们先猜猜，为什么在构造函数中要提前创建一个Segment对象放到Segment[0]处呢？**

后面肯定是基于原型模式来获取新对象，即通过复制而不是创建来获取新对象

### put执行过程

1. 如果value为null，抛出NullPointerException
2. 根据key的hashCode定位到Segment数组的位置
3. 如果定位到的Segment数组的位置为空，初始化Segment对象
4. 执行Segment对象的put方法（后续接着分析）

```java
// ConcurrentHashMap
public V put(K key, V value) {
	Segment<K,V> s;
	if (value == null)
		throw new NullPointerException();
	// 对元素的hashCode进行一次再散列，减少散列冲突
	int hash = hash(key);
	// segmentMask在构造函数中就赋值了哈，segmentMask为Segment数组长度减1
	// 定位Segment
	int j = (hash >>> segmentShift) & segmentMask;
	// 如果Segment不存在，则创建
	if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
		 (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
		s = ensureSegment(j);
	// 放到 Segment 中的 HashEntry 数组中
	return s.put(key, hash, value, false);
}
```

**注意，这里是利用UNSAFE从数组中获取值，这样就能直接从主内存中获取最新的值，防止并发问题**

**ConcurrentHashMap将put操作代理给Segment**

分析一下Segment对象的put操作

1. 根据key的hash值定位到Segment的HashEntry数组，遍历链表，如果key已经存在，则返回oldValue，否则将HashEntry节点插入链表的头节点
2. 当HashEntry数组的长度超过阈值，进行rehash操作

```java
// Segment
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
	// 尝试获取锁
	HashEntry<K,V> node = tryLock() ? null :
		scanAndLockForPut(key, hash, value);
	V oldValue;
	// 获锁成功
	try {
		HashEntry<K,V>[] tab = table;
		// 获取在tab数组中的位置
		int index = (tab.length - 1) & hash;
		// 得到链表的头节点
		HashEntry<K,V> first = entryAt(tab, index);
		// 遍历链表
		for (HashEntry<K,V> e = first;;) {
			if (e != null) {
				K k;
				if ((k = e.key) == key ||
					(e.hash == hash && key.equals(k))) {
					oldValue = e.value;
					if (!onlyIfAbsent) {
						e.value = value;
						++modCount;
					}
					break;
				}
				e = e.next;
			}
			// 遍历到链表尾部，没有重复的key，则新插入
			else {	
				if (node != null)
					// 头插法，将node节点设为链表头节点
					node.setNext(first);
				else
					// 为null，则新建一个节点
					node = new HashEntry<K,V>(hash, key, value, first);
				int c = count + 1;
				// 若c超过阈值则扩容，并且数组长度小于MAXIMUM_CAPACITY = 1 << 30
				if (c > threshold && tab.length < MAXIMUM_CAPACITY)
					// 扩容并进行重新hash
					rehash(node);
				else
					setEntryAt(tab, index, node);
				++modCount;
				count = c;
				oldValue = null;
				break;
			}
		}
	} finally {
		unlock();
	}
	return oldValue;
}
```

这段方法其实不难，先获取到锁，然后定位到HashEntry数组中的位置，遍历链表，有相同的key则返回旧值，并根据onlyIfAbsent参数来决定是否用新值替换旧值。没有相同的key则用头插入法插入链表

tryLock获锁失败后，则会调用scanAndLockForPut再次尝试获锁
```java
// Segment
private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
	// 获取链表头结点
	HashEntry<K,V> first = entryForHash(this, hash);
	HashEntry<K,V> e = first;
	HashEntry<K,V> node = null;
	int retries = -1; // negative while locating node
	// 不断尝试获取锁
	while (!tryLock()) {
		HashEntry<K,V> f; // to recheck first below
		// retries = -1 的作用就是不断遍历链表
		if (retries < 0) {
			// 链表的头结点为null，或者遍历到链表的尾部
			if (e == null) {
				// 这里加条件是因为，有可能已经初始化node节点了
				// 结果由于头结点改变重新遍历链表
				if (node == null) // speculatively create node
					node = new HashEntry<K,V>(hash, key, value, null);
				retries = 0;
			}
			// 找到相同key的节点
			else if (key.equals(e.key))
				retries = 0;
			// 没有找到key对应的节点，指向下一个节点
			else
				e = e.next;
		}
		// 执行到一定次数直接阻塞式的获取锁
		else if (++retries > MAX_SCAN_RETRIES) {
			lock();
			break;
		}
		// 重试次数为偶数次时，检查一下头结点发生变化没？
		// 如果发生变化，更新头结点，并重置retries值为-1
		else if ((retries & 1) == 0 &&
				 (f = entryForHash(this, hash)) != first) {
			e = first = f; // re-traverse if entry changed
			retries = -1;
		}
	}
	return node;
}
```
好家伙，操作又一次秀出天际，要是让我写这个方法的话直接调用lock()方法完事。没想道Doug Lea在调用lock方法之前还遍历一波对应位置的链表，如果链表的头节点为null或者遍历到链表的尾部没有发现key值相同的HashEntry对象，还提前把node对象创建出来

怪不得之前创建新元素的时候先判断一下已经创建好了没，原来Doug Lea是这样想的，与其阻塞不如先提前把对象创建出来
```java
// Segment#put
if (node != null)
    node.setNext(first);
else
    node = new HashEntry<K,V>(hash, key, value, first);
```

rehash的过程我就不分析了，套路差不多

**不过需要注意的一点是，Segment数组在初始化完后就不动了，后续扩容操作的是HashEntry数组**

### get执行过程
get的过程还是分为2部，先定位到Segment数组，再定位到HashEntry数组的HashEntry对象，**注意定位Segment数组和HashEntry数组的过程用了UNSAFE的api，从主内存中读取数据，保证了并发安全。**

而在遍历HashEntry链表的过程中，由于value和next属性用了volatile修饰，保证了可见性。

**因此在整个get过程中并没有加锁，而是用UNSAFE和volatile保证了线程安全**
```java
public V get(Object key) {
	Segment<K,V> s; // manually integrate access methods to reduce overhead
	HashEntry<K,V>[] tab;
	int h = hash(key);
	long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
	if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
		(tab = s.table) != null) {
		for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
				 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
			 e != null; e = e.next) {
			K k;
			if ((k = e.key) == key || (e.hash == h && key.equals(k)))
				return e.value;
		}
	}
	return null;
}
```

**在没读ConcurrentHashMap源码之前我就挺好奇当发生rehash的时候是如果get到元素的？**

因为在HashMap中节点是直接从oldTable转移到newTable的，这样就会造成在多线程的情况下通过key获取不到value，即使value是存在的。不过因为HashMap本身不是线程安全的，所以问题不大

我们来看核心方法

ConcurrentHashMap.Segment#rehash

![在这里插入图片描述](https://img-blog.csdnimg.cn/98be6958273f432488d56fb4569a414c.png)

可以看到原来链表上的节点并不是通过转移的方式放到新链表上的，而是通过复制的方法放到新链表上的。这样就能保证节点在新旧table上都存在。

**另外还做了小优化，即链表末尾的一段并没有重新创建，而是采用了复用的方式。即在新旧链表上都能访问到**

如下图所示，节点颜色相同表示会被放到新数组的同一个槽位

![在这里插入图片描述](https://img-blog.csdnimg.cn/8e2052abd065444189555716e193ab2e.png)

### size方法

```java
public int size() {
	// Try a few times to get accurate count. On failure due to
	// continuous async changes in table, resort to locking.
	final Segment<K,V>[] segments = this.segments;
	int size;
	boolean overflow; // true if size overflows 32 bits
	long sum;         // sum of modCounts
	long last = 0L;   // previous sum
	int retries = -1; // first iteration isn't retry
	try {
		for (;;) {
			// RETRIES_BEFORE_LOCK = 2 不上锁求值尝试3次，值不一样，直接上锁
			if (retries++ == RETRIES_BEFORE_LOCK) {
				for (int j = 0; j < segments.length; ++j)
					ensureSegment(j).lock(); // force creation
			}
			sum = 0L;
			size = 0;
			overflow = false;
			for (int j = 0; j < segments.length; ++j) {
				Segment<K,V> seg = segmentAt(segments, j);
				if (seg != null) {
					sum += seg.modCount;
					int c = seg.count;
					if (c < 0 || (size += c) < 0)
						overflow = true;
				}
			}
			// 只要有连续2次值相等，段没有被修改，退出
			if (sum == last)
				break;
			last = sum;
		}
	} finally {
		// 如果执行到加锁，则解锁
		if (retries > RETRIES_BEFORE_LOCK) {
			for (int j = 0; j < segments.length; ++j)
				segmentAt(segments, j).unlock();
		}
	}
	// 如果size超过了Integer.MAX_VALUE则返回Integer.MAX_VALUE
	return overflow ? Integer.MAX_VALUE : size;
}
```

在计算ConcurrentHashMap的size时，因为并发操作的缘故，还有可能一直插入数据，可能导致计算返回的size和实际的size有相差，因此会分为如下2步来进行

1. 尝试不加锁的模式计算3次，其中有连续两次计算的总的modCount相等则直接返回size
2. 如果没有连续两次计算的结果相等，则对segments加锁求size