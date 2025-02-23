---
layout: post
title: ConcurrentHashMap（JDK1.8）
lock: need
---

# 并发容器：ConcurrentHashMap（JDK1.8）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c16402b540cb9de018da5d2fa55ae869.jpeg)
## JDK1.8源码
### put执行过程

1. 根据key的hashCode()计算hash值
2. 如果table数组为空，则初始化table数组
3. 定位到的Node为null时，利用CAS尝试放入，成功则退出，失败则再此进入循环
4. 如果当前位置的Node.hash等于-1，则ConcurrentHashMap正在扩容，当前线程去帮助转移
5. 利用synchronized加锁，将元素放入红黑树或者链
6. 如果链表的长度>=8，并且数组长度>=64，转为红黑树，否则扩容

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}
```

```java
// 当元素存在时，onlyIfAbsent = true 直接返回旧值，不进行替换，否则进行替换
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
				// 链表的头节点有可能发生变化，再检测一遍
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
				// 链表长度 >= 8，并且数组长度 >= 64，链表转为红黑树
				// 否则扩容
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
**为什么Node.hash >= 0 就说明是链表呢？**

因为红黑树的结点为TreeBin，hash值为-2。还有一个特殊节点ForwardingNode（表示数组正在扩容），hash值为-1

**这里有个需要注意的点为**

链表长度 >= 8，并且数组长度 >= 64，链表转为红黑树，否则扩容
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

首先从数组上取值时，用了Unsafe的api，保证了线程安全

```java
static final <K,V> Node<K,V> tabAt(Node<K,V>[] tab, int i) {
    return (Node<K,V>)U.getObjectVolatile(tab, ((long)i << ASHIFT) + ABASE);
}
```

其次Node对象用了volatile关键字来保证可见性。而final一旦赋值，对其他线程也是可见的
```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    volatile V val;
    volatile Node<K,V> next;
}
```

### 扩容
前面我们提到，当put的时候，遇到扩容，要去帮助扩容。

```java
else if ((fh = f.hash) == MOVED)
	tab = helpTransfer(tab, f);
```

扩容的过程比较复杂，大概说一下思路。

扩容之后，需要进行rehash。一个线程rehash比较慢，所以我们可以让多个线程同时rehash，每个线程负责一部分区间

每个线程区间的左右边界分别用i和bound记录，区间的长度用stride记录，下个线程转移时的右边界用transferIndex记录

当所有的线程都完成rehash时，则整个rehash过程结束
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d942e55ce1d50d28d244da42129418ce.png)
```java
private final void transfer(Node<K,V>[] tab, Node<K,V>[] nextTab) {
    // stride 可以理解为步长 单核模式下为 n，多核模式下为 (n >>> 3) / NCPU，步长最小为16
    int n = tab.length, stride;
    if ((stride = (NCPU > 1) ? (n >>> 3) / NCPU : n) < MIN_TRANSFER_STRIDE)
        stride = MIN_TRANSFER_STRIDE; // subdivide range
    if (nextTab == null) {            // initiating
        try {
            @SuppressWarnings("unchecked")
            // 容量翻倍
            Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n << 1];
            nextTab = nt;
        } catch (Throwable ex) {      // try to cope with OOME
            sizeCtl = Integer.MAX_VALUE;
            return;
        }
        nextTable = nextTab;
        // transferIndex 是 ConcurrentHashMap 的属性，用来控制迁移的位置
        transferIndex = n;
    }
    int nextn = nextTab.length;
    ForwardingNode<K,V> fwd = new ForwardingNode<K,V>(nextTab);
    
    // 做完一个位置的迁移工作，可以准备做下一个位置的了
    boolean advance = true;
    boolean finishing = false; // to ensure sweep before committing nextTab
    for (int i = 0, bound = 0;;) {
        Node<K,V> f; int fh;
        
        // advance 为 true 表示可以进行下一个位置的迁移了
        while (advance) {
            int nextIndex, nextBound;
            if (--i >= bound || finishing)
                advance = false;
            // transferIndex <= 0 说明原数组的所有位置都有相应的线程去处理了
            else if ((nextIndex = transferIndex) <= 0) {
                i = -1;
                advance = false;
            }
            else if (U.compareAndSwapInt
                     (this, TRANSFERINDEX, nextIndex,
                      nextBound = (nextIndex > stride ?
                                   nextIndex - stride : 0))) {
                bound = nextBound;
                i = nextIndex - 1;
                advance = false;
            }
        }
        if (i < 0 || i >= n || i + n >= nextn) {
            int sc;
            if (finishing) {
                // 所有操作已经迁移完成
                nextTable = null;
                table = nextTab;
                // 重新计算 sizeCtl : 
                sizeCtl = (n << 1) - (n >>> 1);
                return;
            }
            if (U.compareAndSwapInt(this, SIZECTL, sc = sizeCtl, sc - 1)) {
                if ((sc - 2) != resizeStamp(n) << RESIZE_STAMP_SHIFT)
                    return;
                finishing = advance = true;
                i = n; // recheck before commit
            }
        }
        else if ((f = tabAt(tab, i)) == null)
            // 位置 i 是空的，放入 fwd 节点
            advance = casTabAt(tab, i, null, fwd);
        else if ((fh = f.hash) == MOVED)
            // 该位置是一个 ForwardingNode，表示该位置已经迁移过了
            advance = true; // already processed
        else {
            // 对槽位进行加锁，开始处理该位置处的迁移工作
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    Node<K,V> ln, hn;
                    // 是链表的节点
                    if (fh >= 0) {
                        int runBit = fh & n;
                        Node<K,V> lastRun = f;
                        // 这个主要就是为了重用对象，和1.7类似，看我1.7的解析吧
                        for (Node<K,V> p = f.next; p != null; p = p.next) {
                            int b = p.hash & n;
                            if (b != runBit) {
                                runBit = b;
                                lastRun = p;
                            }
                        }
                        if (runBit == 0) {
                            ln = lastRun;
                            hn = null;
                        }
                        else {
                            hn = lastRun;
                            ln = null;
                        }
                        for (Node<K,V> p = f; p != lastRun; p = p.next) {
                            int ph = p.hash; K pk = p.key; V pv = p.val;
                            if ((ph & n) == 0)
                                ln = new Node<K,V>(ph, pk, pv, ln);
                            else
                                hn = new Node<K,V>(ph, pk, pv, hn);
                        }
                        // 放一个链表在新数组的位置 i
                        setTabAt(nextTab, i, ln);
                        // 放另一个链表在新数组的位置 i + n
                        setTabAt(nextTab, i + n, hn);
                        // 在原数组放 fwd 节点，表示该位置已经处理完毕了
                        setTabAt(tab, i, fwd);
                        // 该位置已经迁移完毕
                        advance = true;
                    }
                    else if (f instanceof TreeBin) {
                        TreeBin<K,V> t = (TreeBin<K,V>)f;
                        TreeNode<K,V> lo = null, loTail = null;
                        TreeNode<K,V> hi = null, hiTail = null;
                        int lc = 0, hc = 0;
                        for (Node<K,V> e = t.first; e != null; e = e.next) {
                            int h = e.hash;
                            TreeNode<K,V> p = new TreeNode<K,V>
                                (h, e.key, e.val, null, null);
                            if ((h & n) == 0) {
                                if ((p.prev = loTail) == null)
                                    lo = p;
                                else
                                    loTail.next = p;
                                loTail = p;
                                ++lc;
                            }
                            else {
                                if ((p.prev = hiTail) == null)
                                    hi = p;
                                else
                                    hiTail.next = p;
                                hiTail = p;
                                ++hc;
                            }
                        }
                        ln = (lc <= UNTREEIFY_THRESHOLD) ? untreeify(lo) :
                            (hc != 0) ? new TreeBin<K,V>(lo) : t;
                        hn = (hc <= UNTREEIFY_THRESHOLD) ? untreeify(hi) :
                            (lc != 0) ? new TreeBin<K,V>(hi) : t;
                        setTabAt(nextTab, i, ln);
                        setTabAt(nextTab, i + n, hn);
                        setTabAt(tab, i, fwd);
                        advance = true;
                    }
                }
            }
        }
    }
}
```

**当发生rehash的时候，get和put操作会有怎样的行为？**

1. 未迁移到的hash槽，可以正常进行get和put操作
2. 正在迁移的hash槽，get请求正常访问桶上的链表或者红黑树，因为rehash是复制新节点到table，不是移动，put请求会被阻塞（迁移的时候会对槽加锁，put请求也需要对槽加锁）
3. 完成迁移的hash槽，get请求到新table上获取元素（迁移完成的槽上的节点为ForwardingNode，通过ForwardingNode到新table上查询），put请求则帮助迁移

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a0aaf5655fab9afae84ba0763be245bd.png)
### size方法
计数和获取总数的思路和LongAdder的差不多，看我的LongAdder文章吧

## ConcurrentHashMap1.7和1.8的区别
**底层实现**

**jdk1.7的实现为数组+链表**，当发生hash冲突的时候采用拉链法，即链表，在链表上查找的复杂度为O(n)

**jdk1.8的实现为数组+链表+红黑树**，当发生hash冲突的时候也是采用拉链法，
但是当链表的长度大于8时，将链表转为红黑树，在红黑树上查找的效率为O(log(n))

**保证线程安全的实现**

jdk1.7基于Segment 分段锁 + Unsafe来保证线程安全

jdk1.8基于synchronized + CAS + Unsafe 来保证线程安全

**并发度**

jdk1.7中每个Segment独立加锁，能支持的最大并发度为Segment数组的长度

jdk1.8中锁的粒度变的更细，能支持的最大并发度为table数组的长度，并发度比1.7有所提高

**获取元素总数**

jdk1.7通过加锁来保证获取的元素总数是准确的

jdk1.8的元素总数是通过累加baseCount和cell数组的值得出来的，会有并发的问题，最终的值可能不精确（和LongAdder的计数思路类似）

**扩容**

jdk1.7只能通过单个线程扩容

jdk1.8能通过多个线程扩容