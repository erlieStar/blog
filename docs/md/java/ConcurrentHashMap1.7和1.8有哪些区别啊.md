---
layout: post
title: ConcurrentHashMap1.7和1.8有哪些区别啊？
lock: need
---

# 面试官：ConcurrentHashMap1.7和1.8有哪些区别啊？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210210185834197.jpg?)
## 前言
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
## 整体实现
JDK1.7实现：数组+链表
JDK1.7保证并发安全：Segment 分段锁（继承自ReentrantLock）+ HashEntry

JDK1.8实现：数组+链表+红黑树
JDK1.8保证并发安全：Node + CAS + synchronized

## JDK1.8源码
### put执行过程

1. 根据key的hashCode()计算hash值
2. 如果table数组为空，则初始化table数组
3. 定位到的Node为null时，利用CAS尝试写入，失败则自旋直到写入成功
4. 如果当前位置的Node.hash等于-1，则需进行扩容
5. 利用synchronized锁写入数据，key已经存在的话返回旧值
6. 如果链表的长度大于8，则转为红黑树

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}
```

```java
final V putVal(K key, V value, boolean onlyIfAbsent) {
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;
        // 数组为空，初始化
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();
        // 数组i这个位置的元素为null，并且cas设置成功，返回
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            if (casTabAt(tab, i, null,
                         new Node<K,V>(hash, key, value, null)))
                break;                   // no lock when adding to empty bin
        }
        // 正在扩容
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            synchronized (f) {
                // 再校验一下，怕别的元素把table[i]的元素删除
                if (tabAt(tab, i) == f) {
                    // 是链表
                    if (fh >= 0) {
                        binCount = 1;
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key,
                                                          value, null);
                                break;
                            }
                        }
                    } // 是红黑树
                    else if (f instanceof TreeBin) {
                        Node<K,V> p;
                        binCount = 2;
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                       value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            if (binCount != 0) {
                // 链表长度>8转为红黑树
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    // hashmap中元素个数加1
    addCount(1L, binCount);
    return null;
}
```

### get执行过程

1. 根据key的hashCode()计算hash值
2. 定位到所在槽的第一个元素就是要获取的元素，则直接返回
3. 如果是红黑树则按照树的方式获取值
4. 如果是链表则按照链表的方式获取值

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    int h = spread(key.hashCode());
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {
        // 所在槽的第一个元素就是要获取的元素
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                return e.val;
        }
        // 从红黑树上获取
        else if (eh < 0)
            return (p = e.find(h, key)) != null ? p.val : null;
        // 从链表上获取
        while ((e = e.next) != null) {
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```
**为什么get不用加锁呢？**

是因为Node对象用了volatile关键字来保证可见性。而final一旦赋值，对其他线程也是可见的
```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    volatile V val;
    volatile Node<K,V> next;
}
```
### 给元素总数加1

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210222232255788.png?)
```java
private final void addCount(long x, int check) {
    CounterCell[] as; long b, s;
    // 1. counterCells数组不为空
    // 2. 利用cas对baseCount+x失败
    // 才会进入if语句
    if ((as = counterCells) != null ||
        !U.compareAndSwapLong(this, BASECOUNT, b = baseCount, s = b + x)) {
        CounterCell a; long v; int m;
        boolean uncontended = true;
        // 1. 当数组不为空 2.对线程hash后能在数组中取到值 3. 对取到的cell对象cas失败，才会进入fullAddCount
        // 否则执行完成
        if (as == null || (m = as.length - 1) < 0 ||
            (a = as[ThreadLocalRandom.getProbe() & m]) == null ||
            !(uncontended =
              U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))) {
            fullAddCount(x, uncontended);
            return;
        }
        if (check <= 1)
            return;
        s = sumCount();
    }
    // 扩容的逻辑，不分析
    if (check >= 0) {}
}
```


fullAddCount主要就是对CounterCell数组进行操作
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210216161643377.jpg?)
1. cell数组已经初始化完成，主要是在cell数组中放元素，对cell数组进行扩容等操作
2. cell数组没有初始化，则对数组进行初始化
3. cell数组正在初始化，这时其他线程利用cas对baseCount进行累加操作
```java
    // See LongAdder version for explanation
    private final void fullAddCount(long x, boolean wasUncontended) {
        int h;
        if ((h = ThreadLocalRandom.getProbe()) == 0) {
            ThreadLocalRandom.localInit();      // force initialization
            h = ThreadLocalRandom.getProbe();
            wasUncontended = true;
        }
        // 往数组中放的时候是否冲突
        boolean collide = false;                // True if last slot nonempty
        for (;;) {
            CounterCell[] as; CounterCell a; int n; long v;
            // 1 数组不为空
            if ((as = counterCells) != null && (n = as.length) > 0) {
                // 1.1 数组下标位置为空
                if ((a = as[(n - 1) & h]) == null) {
                    // 有线程在操作数组cellsBusy=1
                    // 没有线程在操作数组cellsBusy=0
                    if (cellsBusy == 0) {            // Try to attach new Cell
                        CounterCell r = new CounterCell(x); // Optimistic create
                        if (cellsBusy == 0 &&
                            U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
                            boolean created = false;
                            try {               // Recheck under lock
                                CounterCell[] rs; int m, j;
                                // 和单例模式的双重检测一个道理
                                if ((rs = counterCells) != null &&
                                    (m = rs.length) > 0 &&
                                    rs[j = (m - 1) & h] == null) {
                                    rs[j] = r;
                                    created = true;
                                }
                            } finally {
                                cellsBusy = 0;
                            }
                            // 成功在数组中放置元素
                            if (created)
                                break;
                            continue;           // Slot is now non-empty
                        }
                    }
                    collide = false;
                }
                // cas baseCount失败
                // 并且往CounterCell数组放的时候已经有值了
                // 才会重新更改wasUncontended为true
                // 让线程重新生成hash值，重新找下标
                else if (!wasUncontended)       // CAS already known to fail
                    wasUncontended = true;      // Continue after rehash
                // cas CounterCell数组中的值加x
                else if (U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))
                    break;
                // 其他线程把数组地址改了
                // 数组的数量>=CPU的核数
                // 不会进行扩容
                else if (counterCells != as || n >= NCPU)
                    collide = false;            // At max size or stale
                else if (!collide)
                    collide = true;
                // collide = true（collide = true会进行扩容）的时候，才会进入这个else if 
                // 上面2个else if 是用来控制collide的
                else if (cellsBusy == 0 &&
                         U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
                    try {
                        if (counterCells == as) {// Expand table unless stale
                            CounterCell[] rs = new CounterCell[n << 1];
                            for (int i = 0; i < n; ++i)
                                rs[i] = as[i];
                            counterCells = rs;
                        }
                    } finally {
                        cellsBusy = 0;
                    }
                    collide = false;
                    continue;                   // Retry with expanded table
                }
                // 对线程生成新的hash值
                h = ThreadLocalRandom.advanceProbe(h);
            }
            // 2 counterCells为空并且将cellsBusy的值从0变成1
            else if (cellsBusy == 0 && counterCells == as &&
                     U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
                boolean init = false;
                try {                           // Initialize table
                    if (counterCells == as) {
                        CounterCell[] rs = new CounterCell[2];
                        rs[h & 1] = new CounterCell(x);
                        counterCells = rs;
                        init = true;
                    }
                } finally {
                    cellsBusy = 0;
                }
                // 数组初始化完成
                // 并且将CounterCell放到数组中
                // 任务完成，跳出循环
                if (init)
                    break;
            }
            // 3 多个线程都对数组做初始化的时候
            // 只有一个能执行初始化逻辑
            // 其他线程利用cas对baseCount加x
            // 成功的线程直接退出循环，其余线程继续循环
            else if (U.compareAndSwapLong(this, BASECOUNT, v = baseCount, v + x))
                break;                          // Fall back on using base
        }
    }
```

### 获取元素总数

当获取元素总数时，对baseCount和CounterCell数组加和即可
```java
final long sumCount() {
    CounterCell[] as = counterCells; CounterCell a;
    long sum = baseCount;
    if (as != null) {
        for (int i = 0; i < as.length; ++i) {
            if ((a = as[i]) != null)
                sum += a.value;
        }
    }
    return sum;
}
```

## JDK1.7源码
>Hashtable出现性能问题的原因是所有访问Hashtable的线程都在竞争一把锁，假如容器中有多把锁，每一把锁用于锁容器的中的一部分数据，那么多线程访问容器里不同数据段的数据时，线程之间就不会存在锁竞争，从而可以有效提高并发访问效率，这就是ConcurrentHashMap使用的锁分段技术   《Java并发编程的艺术》

ConcurrentHashMap的主要结构如下
![这里写图片描述](https://img-blog.csdn.net/20180513105647406?)
假设我们有三个键值对，dnf:1，cf:2，lol:3，每次放值会进行2次hash，即先确定放在哪个Segment中，再确定放在哪个HashEntry中。

JDK1.7采用头插法
JDK1.8采用尾插法

假设三个键值对同时进行放，1=hash1(dnf)，知道了放在应该放在segments[1]处，接着获取到segments[1]的锁，再进行hash，2=hash2(dnf)，即放在hashentrys[2]处，放完对segments[1]解锁

3=hash1(cf)，放在segments[3]处，获取到segments[3]的锁，0=hash2(cf)，放在hashentrys[0]，放完对segments[3]解锁

1=hash1(lol)，放在segments[1]处，因为此时segments[1]的锁已经被key为dnf的键值对获取，所以会阻塞的获取锁，直到锁被放置key为dnf的这一步操作释放，获取到锁后，2=hash2(lol)，放在hashentrys[2]处，因为已经有值了，采用头插法，放在链表的头节点

3个线程操作完，结果如下

![这里写图片描述](https://img-blog.csdn.net/20180513112124165?)

get方法也是进行两次hash即可，get方法不用上锁，get方法只读不写

先看ConcurrentHashMap类的属性

```java
// segments数组的初始容量
static final int DEFAULT_INITIAL_CAPACITY = 16;

// 负载因子
static final float DEFAULT_LOAD_FACTOR = 0.75f;

// 默认并发数
static final int DEFAULT_CONCURRENCY_LEVEL = 16;

// 最大容量是2的30次方 
static final int MAXIMUM_CAPACITY = 1 << 30;

// 最小段数，必须是2的倍数
static final int MIN_SEGMENT_TABLE_CAPACITY = 2;

// segments数组的最大大小，必须是2的倍数
static final int MAX_SEGMENTS = 1 << 16; // slightly conservative

// 在size和containsValue方法中使用
// 在采用加锁方法之前， 最多尝试的次数
static final int RETRIES_BEFORE_LOCK = 2;

// 段掩码（和segmentShift配合使用定位Segment）
final int segmentMask;

// 段偏移量
final int segmentShift;

final Segment<K,V>[] segments;
```
这里说一下RETRIES_BEFORE_LOCK，由于多线程的缘故，调用size和containsValue方法有可能得不到准确的结果
不加锁尝试RETRIES_BEFORE_LOCK次还得不到准确的结果，直接上锁

接着看Segment内部类

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {

    // 链表数组，数组中的每一个元素存放了一个链表的头部
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
HashEntry内部类

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
注意这里value和next用volatile修饰保证了可见性

**构造方法**

```java
public ConcurrentHashMap(int initialCapacity,
                         float loadFactor, int concurrencyLevel) {
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    // MAX_SEGMENTS = 1 << 16，最大并发数为1 << 16
    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;
    // 2的sshift次方为ssize
    int sshift = 0;
    // ssize为segments的数组长度
    int ssize = 1;
    // 找大于等于concurrencyLevel的2的幂次方数
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    this.segmentShift = 32 - sshift;
    this.segmentMask = ssize - 1;
    // MAXIMUM_CAPACITY = 1 << 30，最大容量为1 << 30
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    // 计算Segment中HashEntry数组长度
    int c = initialCapacity / ssize;
    if (c * ssize < initialCapacity)
        ++c;
    // MIN_SEGMENT_TABLE_CAPACITY = 2
    // 计算Segment下HashEntry数组的长度，不能比2小
    int cap = MIN_SEGMENT_TABLE_CAPACITY;
    while (cap < c)
        cap <<= 1;
    // 创建Segment数组，并且设置segments[0]
    Segment<K,V> s0 =
        new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                         (HashEntry<K,V>[])new HashEntry[cap]);
    Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];
    UNSAFE.putOrderedObject(ss, SBASE, s0); // ordered write of segments[0]
    this.segments = ss;
}
```
默认情况下concurrencyLevel=16，这样就会导致segments的数组长度也是16，每个Segment里面的HashEntry数组的大小为2

**注意segments数组在初始化完后就不动了，后续扩容操作的是HashEntry数组**

**put执行过程**

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
    // 定位Segment
    int j = (hash >>> segmentShift) & segmentMask;
    // 如果Segment不存在，则调用ensureSegment方法
    if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
         (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
        s = ensureSegment(j);
    return s.put(key, hash, value, false);
}
```
**注意，这里是利用UNSAFE从数组中获取值，这样就能直接从主内存中获取最新的值，防止并发问题**

根据索引去segments数组中获取Segment，如果已经存在了则返回，否则创建并自旋插入
```java
// ConcurrentHashMap
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // raw offset
    Segment<K,V> seg;
    // 该索引处还没有Segment
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        // 这里能直接赋值的原因是ss[0]在构造函数中已经初始化了
        Segment<K,V> proto = ss[0]; // use segment 0 as prototype
        int cap = proto.table.length;
        float lf = proto.loadFactor;
        int threshold = (int)(cap * lf);
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap];
        // 再次检查
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
            == null) { // recheck
            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            // 自旋插入，成功则退出
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
                   == null) {
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}
```
**ConcurrentHashMap将put操作代理给Segment**

分析一下Segment对象的put操作

1. 根据key的hash值定位到Segment的HashEntry数组，遍历链表，如果key已经存在，则返回oldValue，否则将HashEntry节点插入链表的头节点
2. 当HashEntry数组的长度超过阈值，进行rehash操作

```java
// Segment
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
    // 尝试直接获取锁，获取到锁node为null，否则调用scanAndLockForPut方法来获取锁
    HashEntry<K,V> node = tryLock() ? null :
        scanAndLockForPut(key, hash, value);
    V oldValue;
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

获取锁失败才会调用这个方法，说明锁被其他线程所占有

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
        // 执行到一定次数直接阻塞
        else if (++retries > MAX_SCAN_RETRIES) {
            // 调用ReentrantLock中NonfairSync的lock()方法
            // 执行过程中有可能不阻塞获取到锁，也有可能被阻塞
            // 而不是之前的一直尝试直接获取锁
            lock();
            break;
        }
        // 链表的头结点发生变化，更新头结点，并重置retries值为-1
        else if ((retries & 1) == 0 &&
                 (f = entryForHash(this, hash)) != first) {
            e = first = f; // re-traverse if entry changed
            retries = -1;
        }
    }
    return node;
}
```
### get执行过程
**get方法并没有上锁，利用UNSAFE的api从主内存中读取值**

get执行过程
1. 根据hash值定到Segment对象数组中的位置
2. Segment对象为空直接返回，否则根据hash值定位到HashEntry数组中的位置
3. 遍历HashEntry数组所在位置的链表，找到则直接返回，否则返回null

```java
public V get(Object key) {
    Segment<K,V> s; // manually integrate access methods to reduce overhead
    HashEntry<K,V>[] tab;
    int h = hash(key);
    // 定位Segment
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

在计算ConcurrentHashMap的size时，因为并发操作的缘故，还有可能一直插入数据，可能导致计算返回的
size和实际的size有相差（在return size的插入了多个数据），因此会分为如下2步来进行


1.尝试不加锁的模式计算RETRIES_BEFORE_LOCK+1次，其中有连续两次计算的总的modCount相等则直接返回size
2.如果没有连续两次计算的结果相等，则对segments加锁求size

这里为什么会超过Integer.MAX_VALUE呢？因为ConcurrentHashMap最多有（MAX_SEGMENTS = 1 << 16）个Segment，而每个Segment允许的最大容量为（MAXIMUM_CAPACITY = 1 << 30），则最大值为（2 << 46）,int最大值为（2 << 31 - 1）

### ConcurrentHashMap1.7和1.8的区别
**底层实现**

**jdk1.7的实现为数组+链表**，当发生hash冲突的时候采用拉链法，即链表，在链表上查找的复杂度为O(n)

**jdk1.8的实现为数组+链表+红黑树**，当发生hash冲突的时候也是采用拉链法，
但是当链表的长度大于8时，将链表转为红黑树，在红黑树上查找的效率为O(log(n))

**保证线程安全的实现**

jdk1.7基于Segment 分段锁（继承自ReentrantLock）来保证并发安全

jdk1.8基于synchronized+CAS来保证线程安全

**并发度**

jdk1.7中每个Segment独立加锁，能支持的最大并发度为Segment数组的长度

jdk1.8中锁的粒度变的更细，能支持的最大并发度为table数组的长度，并发度比1.7有所提高

**获取元素总数**

jdk1.7通过加锁来保证获取的元素总数是准确的

jdk1.8的元素总数是通过累加baseCount和cell数组的值得出来的，会有并发的问题，最终的值可能不精确