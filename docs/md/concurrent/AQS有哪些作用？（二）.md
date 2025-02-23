---
layout: post
title: AQS有哪些作用？（二）
lock: need
---

# 并发工具类：AQS有哪些作用？（二）
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e21d51750c4b9529e0da8ad6115f338c.jpeg)
## AQS封装的加锁和解锁方法

AQS提供了独占锁和共享锁两种加锁方式，每种方式都有响应中断和不响应中断的区别，所以AQS的锁可以分为如下四类

1. 不响应中断的独占锁(acquire)
2. 响应中断的独占锁(acquireInterruptibly)
3. 不响应中断的共享锁(acquireShared)
4. 响应中断的共享锁(acquireSharedInterruptibly)

而释放锁的方式只有两种

1. 独占锁的释放(release)
2. 共享锁的释放(releaseShared)

## 独占锁的加锁
我们前面在写入队的逻辑的时候，直接将Thread放到Queue中就完事了。看看Doug Lea是如何写的

AQS队列，当队列为空时，第一次生成两个节点，第一个节点代表当前占有锁的线程，第二个节点为抢锁失败的节点。不为空的时候，每次生成一个节点放入队尾。

**当把线程放入队列中时，后续应该做哪些操作呢？**

如果让你写是不是直接放入队列中就完事了？但Doug Lea是这样做的

1. 如果当前线程是队列中的第二个节点则再尝试抢一下锁（不是第二个节点就不用抢来，轮不到），这样避免了频繁的阻塞和唤醒线程，提高了效率
2. 上闹钟，让上一个线程来唤醒自己（后续会说到，即更改上一个节点的waitStatus）
3. 阻塞


**另外还得注意一下出队的逻辑，当A线程释放锁，唤醒队列中的B线程，A线程会从队列中删除。那出队这个事情由谁来做？是由被唤醒的线程来做，即B线程**


从加锁的模版方法开始分析
```java
// 调用ReentrantLock.FairSync#lock方法其实就是调用acquire(1);
public final void acquire(int arg) {
	if (!tryAcquire(arg) &&
		acquireQueued(addWaiter(Node.EXCLUSIVE), arg))//获取到锁返回false，否则返回true
		selfInterrupt();//当前线程将自己中断
}
```

1. 先尝试获取，如果获取到直接退出，否则进入2
2. 获取锁失败，以独占模式将线程包装成Node放到队列中
3. 如果放入的节点是队列的第二个节点，则再尝试获取锁，因为此时锁有可能释放类，不是第二个节点就不用尝试了，因为轮不到。如果获取到锁则将当前节点设为head节点，退出，否则进入4
4. 设置好闹钟后将自己阻塞
5. 线程被唤醒，重新竞争锁，获取锁成功，继续执行。如果线程发生过中断，则最后重置中断标志位位true，即执行selfInterrupt()方法

**从代码层面详细分析一波，走起**

tryAcquire是让子类实现的

```java
protected boolean tryAcquire(int arg) {
	throw new UnsupportedOperationException();
}
```
这里通过抛出异常来告诉子类要重写这个方法，为什么不将这个方法定义为abstract方法呢？因为AQS有2种功能，独占和共享，如果用abstract修饰，则子类需要同时实现两种功能的方法，对子类不友好

1. 当队列不为空，尝试将新节点通过CAS的方式设置为尾节点，如果成功，返回附加着当前线程的节点
2. 当队列为空，或者新节点通过CAS的方式设置为尾节点失败，进入enq方法
```java
private Node addWaiter(Node mode) {
	Node node = new Node(Thread.currentThread(), mode);
	Node pred = tail;
	if (pred != null) {
		node.prev = pred;
		if (compareAndSetTail(pred, node)) {
			pred.next = node;
			return node;
		}
	}
	enq(node);
	return node;
}
```

1. 当队列不为空，一直CAS，直到把新节点放入队尾
2. 当队列为空，先往对列中放入一个节点，在把传入的节点CAS为尾节点

**前面已经说过了哈，AQS队列为空时，第一次会放入2个节点**

```java
private Node enq(final Node node) {
	for (;;) {
		Node t = tail;
		// 队列为空，进行初始化，
		if (t == null) {
			if (compareAndSetHead(new Node()))
				tail = head;
		} else {
			node.prev = t;
			if (compareAndSetTail(t, node)) {
				t.next = node;
				return t;
			}
		}
	}
}
```
放入队列后还要干什么？
1. 如果是第二个节点再尝试获取一波锁，因为此时有可能锁已经释放了，其他节点就不用了，因为还轮不到
2. 上闹钟，让别的线程唤醒自己
3. 阻塞自己
```java
// 自旋获取锁，直到获取锁成功，或者异常退出
// 但是并不是busy acquire，因为当获取失败后会被挂起，由前驱节点释放锁时将其唤醒
// 同时由于唤醒的时候可能有其他线程竞争，所以还需要进行尝试获取锁，体现的非公平锁的精髓。
final boolean acquireQueued(final Node node, int arg) {
	boolean failed = true;
	try {
		boolean interrupted = false;
		for (;;) {
			// 获取前继节点
			final Node p = node.predecessor();
			// node节点的前继节点是head节点，尝试获取锁，如果成功说明head节点已经释放锁了
			// 将node设为head开始运行(head中不包含thread)
			if (p == head && tryAcquire(arg)) {
				setHead(node);
				// 将第一个节点出队
				p.next = null; // help GC
				failed = false;
				return interrupted;
			}
			// 获取锁失败后是否可以挂起
			// 如果可以挂起，则阻塞当前线程（获取锁失败的节点）
			if (shouldParkAfterFailedAcquire(p, node) &&
				parkAndCheckInterrupt())
				interrupted = true;
		}
	} finally {
		if (failed)
			cancelAcquire(node);
	}
}
```
根据前继节点的状态，是否可以阻塞当前获取锁失败的节点

一般情况会经历如下2个过程
1. 默认情况下上一个节点的waitStatus=0，所以会进入compareAndSetWaitStatus方法，通过cas将上一个节点的waitStatus设置为SIGNAL，然后return false
2. shouldParkAfterFailedAcquire方法外面是一个死循环，当再次进入这个方法时，如果上一步cas成功，则会走第一个if，return true。接着执行parkAndCheckInterrupt，线程会阻塞
```java
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
	int ws = pred.waitStatus;
	// 前继节点释放时会unpark后继节点，可以挂起
	if (ws == Node.SIGNAL)
		return true;
	if (ws > 0) {
		//将CANCELLED状态的线程清理出队列
		// 后面会提到为什么会有CANCELLED的节点
		do {
			node.prev = pred = pred.prev;
		} while (pred.waitStatus > 0);
		pred.next = node;
	} else {
		// 将前继节点的状态设置为SIGNAL，代表释放锁时需要唤醒后面的线程
		// cas更新可能失败，所以不能直接返回true
		compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
	}
	return false;
}
```
shouldParkAfterFailedAcquire表示上好闹钟了，可以阻塞线程了。后续当线程被唤醒的时候会从return语句出继续执行，然后进入acquireQueued方法的死循环，重新抢锁。至此，加锁结束。
```java
// 挂起线程，返回是否被中断过
private final boolean parkAndCheckInterrupt() {
	// 阻塞线程
	LockSupport.park(this);
	// 返回当前线程是否被调用过Thread#interrupt方法
	return Thread.interrupted();
}
```

最后用一个流程图来解释不响应中断的独占锁
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/29110870472eba4839ecdb9ae82bbac5.png)
#### 入队过程中有异常该怎么办？
**这部分内容比较难，看着吃力的小伙伴跳过即可，对主流程影响不大**

可以看到上面调用acquireQueued方法发生异常的时候，会调用cancelAcquire方法，我们就详细分析一下这个cancelAcquire方法有哪些作用？

**哪些地方执行发生异常会执行cancelAcquire?**

可以看到调用cancelAcquire方法的有如下几个部分
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e7fab2bee62f816a8c090299d7dfecdf.png)
**分析这些方法的调用，发现基本就是如下2个地方会发生异常**
1. 尝试获取锁的方法如tryAcquire，这些一般是交给子类来实现的
2. 当线程是被调用Thread#interrupt方法唤醒，如果要响应中断，会抛出InterruptedException

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/12214b3c2eb0afd908bde57a73b151a5.jpeg)
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6975a206ef0f907d3de3d2631ee5ea7c.jpeg)

```java
//处理异常退出的node
private void cancelAcquire(Node node) {
	if (node == null)
		return;

	// 设置该节点不再关联任何线程
	node.thread = null;

	// 跳过CANCELLED节点，找到一个有效的前继节点
	Node pred = node.prev;
	while (pred.waitStatus > 0)
		node.prev = pred = pred.prev;

	// 获取过滤后的有效节点的后继节点
	Node predNext = pred.next;

	// 设置状态为取消
	node.waitStatus = Node.CANCELLED;

	// case 1
	if (node == tail && compareAndSetTail(node, pred)) {
		compareAndSetNext(pred, predNext, null);
	} else {
		// case 2
		int ws;
		if (pred != head &&
			((ws = pred.waitStatus) == Node.SIGNAL ||
			 (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
			pred.thread != null) {
			Node next = node.next;
			if (next != null && next.waitStatus <= 0)
				compareAndSetNext(pred, predNext, next);
		} else {
			// case3
			unparkSuccessor(node);
		}

		node.next = node; // help GC
	}
}
```
将node出队有如下三种情况

1. 当前节点是tail
2. 当前节点不是head的后继节点，也不是tail
3. 当前节点是head的后继节点

**当前节点是tail**

compareAndSetTail，将tail指向pred
compareAndSetNext，将pred的next指向null，也就是把当前节点移出队列

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/fd8319bbf44ed50438ed833c0dfaca58.png)

**当前节点不是head的后继节点，也不是tail**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8fb19d130384f476e78dae1bef555f8a.png)
这里将node的前继节点的next指向了node的后继节点，即compareAndSetNext(pred, predNext, next)，**注意pred和node节点中间有可能有CANCELLED的节点，怕乱就没画出来**

**当前节点是head的后继节点**

没有对队列进行操作，只是进行head后继节点的唤醒操作（unparkSuccessor方法，后面会分析这个方法），因为此时他是head的后继节点，还是有可能获取到锁的，所以唤醒它尝试获取一波锁，当再次调用到shouldParkAfterFailedAcquire（判断是否应该阻塞的方法时）会把CANCELLED状态的节点从队列中删除

### 独占锁的解锁
独占锁是释放其实就是利用cas将state-1，当state=0表示锁被释放，需要将阻塞队列中的线程唤醒

```java
public final boolean release(int arg) {
	// 是否需要释放锁，返回ture则需要释放锁
	if (tryRelease(arg)) {
		Node h = head;
		if (h != null && h.waitStatus != 0)
			// 唤醒阻塞的线程
			unparkSuccessor(h);
		return true;
	}
	return false;
}
```

**tryRelease即具体的解锁逻辑，需要子类自己去实现**

**唤醒同步队列中的线程，可以看到前面加了判断h != null && h.waitStatus != 0**

h = null，说明同步同步队列中没有数据，则不需要唤醒
h = null && waitStatus = 0，同步队列是有了，但是没有线程给自己上闹钟，不用唤醒
h != null && waitStatus < 0，说明头节点被人上了闹钟，自己需要唤醒阻塞的线程
h != null && waitStatus > 0，头节点因为发生异常被设置为取消，但还是得唤醒线程
```java
private void unparkSuccessor(Node node) {

	int ws = node.waitStatus;
	if (ws < 0)
		compareAndSetWaitStatus(node, ws, 0);

	// 头结点的下一个节点
	Node s = node.next;
	// 为空或者被取消
	if (s == null || s.waitStatus > 0) {
		s = null;
		// 从队列尾部向前遍历找到最前面的一个waitStatus<=0的节点
		for (Node t = tail; t != null && t != node; t = t.prev)
			if (t.waitStatus <= 0)
				s = t;
	}
	if (s != null)
		// 唤醒节点,但并不表示它持有锁，要从阻塞的地方开始运行
		LockSupport.unpark(s.thread);
}
```

**为什么要从后向前找第一个非CANCELLED的节点呢？**

```java
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    // Try the fast path of enq; backup to full enq on failure
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
        	// 线程在这里挂起了
            pred.next = node;
            return node;
        }
    }
    enq(node);
    return node;
}
```
这其实和入队的逻辑有关系，假如Node1在图示位置挂起了，Node1后面又陆续增加了Node2和Node3，如果此时从前向后遍历会导致元素丢失，不能正确唤醒线程
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c099b2b715f0a7849448cd3152804f30.png)
### 分析一下独占锁响应中断和不响应中断的区别
我们之前说过独占锁可以响应中断，也可以不响应中断，调用的方法如下？

1. 不响应中断的独占锁(acquire)
2. 响应中断的独占锁(acquireInterruptibly)

所以我们只需要看这2个方法的区别在哪里就可以，我下面只列出有区别的部分哈。

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

```java
 public final void acquireInterruptibly(int arg)
         throws InterruptedException {
     // 判断线程是否被中断
     if (Thread.interrupted())
         throw new InterruptedException();
     if (!tryAcquire(arg))
         doAcquireInterruptibly(arg);
 }
```
**acquire在尝试获取锁的时候完全不管线程有没有被中断，而acquireInterruptibly在尝试获取锁之前会判断线程是否被中断，如果被中断，则直接抛出异常。**

tryAcquire方法一样，所以我们只需要对比acquireQueued方法和doAcquireInterruptibly方法的区别即可
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d1cf66dd812832bdc92b510650d35243.jpeg)
**执行acquireQueued方法当线程发生中断时，只是将interrupted设置为true，并且调用selfInterrupt方法将中断标志位设置为true**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/def83b2077f3dcb08adeb01b871f02cc.jpeg)
**而执行doAcquireInterruptibly方法，当线程发生中断时，直接抛出异常。**

最后看一下parkAndCheckInterrupt方法，这个方法中判断线程是否中断的逻辑特别巧！
```java
private final boolean parkAndCheckInterrupt() {
	LockSupport.park(this);
	return Thread.interrupted();
}
```
**Thread类提供了如下2个方法来判断线程是否是中断状态**

1. isInterrupted
2. interrupted

**这里为什么用interrupted而不是isInterrupted的呢？**（**这部分内容比较难，看着吃力的小伙伴跳过即可，对主流程影响不大**）

演示一下这2个方法的区别
```java
@Test
public void testInterrupt() throws InterruptedException {
    Thread thread = new Thread(() -> {
        while (true) {}
    });
    thread.start();
    TimeUnit.MICROSECONDS.sleep(100);
    thread.interrupt();
    // true
    System.out.println(thread.isInterrupted());
    // true
    System.out.println(thread.isInterrupted());
    // true
    System.out.println(thread.isInterrupted());
}
```

```java
@Test
public void testInterrupt2() {
    Thread.currentThread().interrupt();
    // true
    System.out.println(Thread.interrupted());
    // false
    System.out.println(Thread.interrupted());
    // false
    System.out.println(Thread.interrupted());
}
```
**isInterrupted和interrupted的方法区别如下**

Thread#isInterrupted：测试线程是否是中断状态，执行后不更改状态标志
Thread#interrupted：测试线程是否是中断状态，执行后将中断标志更改为false

接着再写2个例子

```java
public static void main(String[] args) {
	LockSupport.park();
	// end被一直阻塞没有输出
	System.out.println("end");
}
```

```java
public static void main(String[] args) {
	Thread.currentThread().interrupt();
	LockSupport.park();
	// 输出end
	System.out.println("end");
}
```
可以看到当线程被中断时，调用park()方法并不会被阻塞

```java
public static void main(String[] args) {
	Thread.currentThread().interrupt();
	LockSupport.park();
	// 返回中断状态，并且清除中断状态
	Thread.interrupted();
	// 输出start
	System.out.println("start");
	LockSupport.park();
	// end被阻塞，没有输出
	System.out.println("end");
}
```

到这我们就能理解为什么要进行中断的复位了

- 如果当前线程是非中断状态，则在执行park时被阻塞，返回中断状态false
- 如果当前线程是中断状态，则park方法不起作用，返回中断状态true，interrupted将中断复位，变为false
- 再次执行循环的时候，前一步已经在线程的中断状态进行了复位，则再次调用park方法时会阻塞

**所以这里要对中断进行复位，是为了不让循环一直执行，让当前线程进入阻塞状态，如果不进行复位，前一个线程在获取锁之后执行了很耗时的操作，那当前线程岂不是要一直执行死循环，造成CPU使用率飙升？**

独占锁的获取和释放我们已经搞清楚了，来分析共享锁的获取和释放

## 共享锁的加锁
加锁成功则执行业务逻辑，否则入队并阻塞
```java
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```
入队的逻辑和独占锁的入队逻辑差不多
```java
private void doAcquireShared(int arg) {
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```
在获锁成功后，除了设置头节点，还多了一步操作，就是唤醒同步队列中的所有线程
```java
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head; // Record old head for check below
    setHead(node);
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
```

## 共享锁的解锁

```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```
唤醒同步队列中的所有线程
```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```
## 独占锁和共享锁的区别
我们来总结一下独占锁和共享锁的区别
1. 独占锁：一个锁能被多个线程获取，加锁失败阻塞放入同步队列，加锁成功执行业务逻辑，解锁唤醒同步队列中的一个线程
2. 共享锁：一个锁只能被一个线程获取，加锁失败阻塞放入同步队列，加锁成功会唤醒同步队列中的所有线程，解锁也会唤醒同步队列中的所有线程