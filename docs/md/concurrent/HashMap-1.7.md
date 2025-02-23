---
layout: post
title: HashMap（JDK1.7）
lock: need
---
# 并发容器：HashMap（JDK1.7）

![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/37ea34709f27cf782fa209f091c2449f.jpeg)

## HashMap实现
在面试的时候，大家经常用HashMap来打开话题，可能是这个容器被频繁使用，比较重要吧

那么HashMap是怎么实现的？

1. jdk1.7的HashMap是用数组+链表实现的
2. jdk1.8的HashMap是用数组+链表+红黑树实现的

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/421ee65da07de643a9bdb41e895dfc9d.png)

HashMap的主干是一个数组，假设我们有3个键值对dnf:1，cf:2，lol:3，每次放的时候会根据key.hash % table.length（对象的hashcode进行一些操作后对数组的长度取余）确定这个键值对应该放在数组的哪个位位置

1 = indexFor(dnf)，我们将键值对放在数组下标为1的位置
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9355164b94575af7be2518edf7ddaedf.png)

3 = indexFor(cf)   
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/63ee385f0106702b62270f8cf0ec6096.png)

1 = indexFor(lol)，这时发现数组下标为1的位置已经有值了，我们把lol:3放到链表的下一位

jdk1.7是头插法

jdk1.8是尾插法
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1fba5b7bd073a1a85f3ca89086f9980a.png)
在获取key为lol的键值对时，1=hash(lol)，得到这个键值对在数组下标为1的位置，lol和dnf不相等，和下一个元素比较，相等返回。set和get的过程就是这么简单。先定位到槽的位置（即数组中的位置），再遍历链表找到相同的元素。

由上图可以看出，HashMap在发生hash冲突的时候用的是链地址法，解决hash冲突并不只有这一种方法，常见的有如下四种方法

1. 开放定址法
2. 链地址法
3. 再哈希法
4. 公共溢出区域法。

## JDK1.7源码
### 构造函数
HashMap有如下三个构造函数
```java
public HashMap() {
    this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR);
}
```

```java
public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}
```
最终都会调用到如下构造函数，传入2个参数

1. initialCapacity：table数组的初始化大小
2. loadFactor：负载因子

```java
// 默认的数组大小
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;

// 默认的负载因子
static final float DEFAULT_LOAD_FACTOR = 0.75f;
```

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
	threshold = initialCapacity;
	init();
}
```
这里看到一个新参数threshold，我们先暂时不管这个参数的作用，后面用到的时候会再次提到

接着来看HashMap中最常用的2个方法，put和get

### put方法的执行过程

1. key为null直接放在table[0]处，对key的hashCode()做hash运算，计算index;
2. 如果节点已经存在就替换old value(保证key的唯一性)，并返回old Value
3.  如果达到扩容的阈值（超过capacity * load factor），并且发生碰撞，就要resize
4. 将元素放到bucket的首位，即头插法

```java
public V put(K key, V value) {
	//hashmap的数组为空
	if (table == EMPTY_TABLE) {
		inflateTable(threshold);
	}
	if (key == null)
		return putForNullKey(value);
	//获取hash值
	int hash = hash(key);
	//找到应该放到table的哪个位置
	int i = indexFor(hash, table.length);
	//遍历table[i]位置的链表，查找相同的key,若找到则使用新的value替换oldValue,并返回oldValue
	for (Entry<K,V> e = table[i]; e != null; e = e.next) {
		Object k;
		//如果key已经存在，将value设置为新的，并返回旧的value值
		if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
			V oldValue = e.value;
			e.value = value;
			e.recordAccess(this);
			return oldValue;
		}
	}

	modCount++;
	//将元素放到table[i]，新的元素总在table[i]位置的第一个元素，原来的元素后移
	addEntry(hash, key, value, i);
	return null;
}
```
为空时，HashMap还没有创建这个数组，有可能用的是默认的16的初始值，还有可能自定义了长度，这时需要把长度变为2的最小倍数，并且这个长度大于等于设定的值

```java
private void inflateTable(int toSize) {
	// 返回大于或等于最接近2的幂数
	int capacity = roundUpToPowerOf2(toSize);

	threshold = (int) Math.min(capacity * loadFactor, MAXIMUM_CAPACITY + 1);
	table = new Entry[capacity];
	initHashSeedAsNeeded(capacity);
}
```
初始化数组的时候，将 threshold 设置为 capacity * loadFactor，Math.min是一个兜底策略，很少会超过这个值

**若key为null，则将值放在table[0]这个链上**

```java
private V putForNullKey(V value) {
	for (Entry<K,V> e = table[0]; e != null; e = e.next) {
		if (e.key == null) {
			V oldValue = e.value;
			e.value = value;
			e.recordAccess(this);
			return oldValue;
		}
	}
	modCount++;
	addEntry(0, null, value, 0);
	return null;
}
```

找到应该放在数组的位置，h & (length-1)这个式子你可以认为hash值对数组长度取余，后面会说到这个式子
```java
static int indexFor(int h, int length) {
	// assert Integer.bitCount(length) == 1 : "length must be a non-zero power of 2";
	return h & (length-1);
}
```
**添加元素**

```java
void addEntry(int hash, K key, V value, int bucketIndex) {
	// 容量超过阈值，并且发生碰撞时进行扩容
	if ((size >= threshold) && (null != table[bucketIndex])) {
		// 数组扩容为原来的2倍，并将元素复制到新数组上
		resize(2 * table.length);
		// 重新计算hash值，如果不做特殊设置的话，和之前算出来的hash值一样
		hash = (null != key) ? hash(key) : 0;
		bucketIndex = indexFor(hash, table.length);
	}

	createEntry(hash, key, value, bucketIndex);
}
```
**终于看到 threshold 的用处了，原来是扩容的阈值啊。**

threshold = capacity \*  load factor

扩容的阈值 = 数组长度 \* 负载因子

如果hashmap数组的长度为16，负载因子为0.75，则扩容阈值为16 * 0.75 = 12

1. 负载因子越小，容易扩容，浪费空间，但查找效率高
2. 负载因子越大，不易扩容，对空间的利用更加充分，查找效率低（链表拉长）

**从这里我们可以看到扩容的时机为容器中键值对的数量超过阈值，并且新元素放置的位置发生碰撞**


```java
void resize(int newCapacity) {
    Entry[] oldTable = table;
    int oldCapacity = oldTable.length;
    //容量已经达到最大
    if (oldCapacity == MAXIMUM_CAPACITY) {
        threshold = Integer.MAX_VALUE;
        return;
    }

    Entry[] newTable = new Entry[newCapacity];
    // initHashSeedAsNeeded函数默认情况下会一直返回false
    transfer(newTable, initHashSeedAsNeeded(newCapacity));
    table = newTable;
    threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
}
```

扩容就是rehash的过程，将旧数组上的元素放到新数组

```java
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    // 遍历数组
    for (Entry<K,V> e : table) {
        // 遍历链表
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
这个transfer函数挺有意思的，如果你仔细理解它的复制过程，会发现有如下2个特别有意思的地方

1. **原来在oldTable[i]位置的元素，会被放到newTable[i]或者newTable[i+oldTable.length]的位置**
2. **链表在复制的时候会反转**

这2个点需要注意一下，我会在JDK1.8中再次提到这2个点

**接着将新增加的元素放到table的第一位，并且将其他元素跟在第一个元素后面，即头插入法**

```java
void createEntry(int hash, K key, V value, int bucketIndex) {
	Entry<K,V> e = table[bucketIndex];
	table[bucketIndex] = new Entry<>(hash, key, value, e);
	size++;
}
```
放入数组的键值对会被封装为Entry对象
```java
static class Entry<K,V> implements Map.Entry<K,V> {
	final K key;
	V value;
	Entry<K,V> next;//存储指向下一个Entry的引用，单链表结构
	int hash;//对key的hashcode值进行hash运算后得到的值，存储在Entry，避免重复计算

	Entry(int h, K k, V v, Entry<K,V> n) {
		value = v;
		next = n;
		key = k;
		hash = h;
	}
}
```

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/842112e1c836ec5d0fd6772ca90e1340.png)
### get方法的执行过程

1. key为null直接从table[0]处取，对key的hashCode()做hash运算，计算index;
2. 通过key.equals(k)去查找对应的Entry，接着返回value

```java
public V get(Object key) {
	if (key == null)
		return getForNullKey();
	Entry<K,V> entry = getEntry(key);

	return null == entry ? null : entry.getValue();
}
```
从table[0]初获取key为null的值

```java
private V getForNullKey() {
	if (size == 0) {
		return null;
	}
	for (Entry<K,V> e = table[0]; e != null; e = e.next) {
		if (e.key == null)
			return e.value;
	}
	return null;
}
```
key不为null时

```java
final Entry<K,V> getEntry(Object key) {
	if (size == 0) {
		return null;
	}

	int hash = (key == null) ? 0 : hash(key);
	for (Entry<K,V> e = table[indexFor(hash, table.length)];
		 e != null;
		 e = e.next) {
		Object k;
		if (e.hash == hash &&
			((k = e.key) == key || (key != null && key.equals(k))))
			return e;
	}
	return null;
}
```

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/720f0fec8141f091d9a66b2c990383cb.png)
