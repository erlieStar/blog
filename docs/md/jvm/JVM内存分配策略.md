---
layout: post
title: JVM内存分配策略
lock: need
---
# JVM实战：JVM内存分配策略
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/fb2387bf3d28d1ea4f64f323d6731709.jpeg)
## JVM运行时数据区
Java虚拟机在执行Java程序的过程中会把它所管理的内存划分为若干个不同的数据区域。这些区域都有各自的用途，以及创建和销毁的时间，有的区域随着虚拟机进程的启动而存在，有些区域则依赖用户线程的启动和结束而建立和销毁。Java虚拟机所管理的内存将会包括以下几个运行时数据区域
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ec866de0a2df19ad5bcfdc39585944a1.png)
**其中方法区和堆是所有线程共享的数据区。程序计数器，虚拟机栈，本地方法栈是线程隔离的数据区**

虚拟机栈和本地方法栈中的空间会随着方法的调用和完成而不断分配和释放。应用中创建的对象则会被分配到堆中，当对象不在使用的时候会被回收。今天我们就先聊一下内存分配的过程
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/2af36e3b05ed9f3dc81409df70602ee5.jpeg)
JVM的堆在1.8之后主要分为2个部分新生代和老年代。新生代和老年代默认的比例为1:3
其中新生代又分为Eden区，From区（Survivor S0区）， To区（Survivor S1区）

**堆空间为什么要分代呢？**

为了更高效的进行垃圾回收
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4f8498c9cd0078a65899f677288d3c55.png)

## JVM内存分配的整体流程
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/17a19c94cc51c585560b8831ef2e432c.png)

## YGC日志如何查看
本文的内容总结自《深入理解Java虚拟机》，后面涉及的结论如果有想复现的小伙伴可直接看这本书，因为在书中没有介绍YGC的日志如何查看，我写个例子来介绍一下，这样你就能看懂书中的Demo了

```java
private static final int _1MB = 1024 * 1024;

// -Xms20M -Xmx20M -Xmn10M -XX:+PrintGCDetails -XX:SurvivorRatio=8
public static void testAllocation() {
	byte[] allocation1, allocation2, allocation3, allocation4;
	allocation1 = new byte[2 * _1MB];
	allocation2 = new byte[2 * _1MB];
	allocation3 = new byte[2 * _1MB];
	allocation4 = new byte[4 * _1MB]; // 出现一次Minor GC
}
```
| 参数 | 含义 |
|--|--|
| -Xms20M | 堆最小内存为20M |
| -Xmx20M | 堆最大内存为20M |
| -Xmn10M | 新生代大小为10M |
| -XX:+PrintGCDetails | 打印日志详情 |
| -XX:SurvivorRatio=8 | Eden和一个Survivor的空间比例为8:1 |

**最终新生代大小为10M（其中Eden区为8M，一个Survivor区为1M），老年代大小为10M**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a700142457153b5333b6ab62c4efd972.png)
我们先来分析一下这个 Young GC 日志应该怎么看？
```java
// 内存分配失败，发生GC
[GC (Allocation Failure)
```

```java
// PSYoungGen 使用的垃圾收集器为 Parallel Scavenge
// 8025K->1014K(9216K) YGC前新生代内存 -> YGC后新生代内存（新生代总内存大小）
// 8025K->5118K(19456K) YGC前JVM堆内存 -> YGC后JVM堆内存（JVM堆总内存大小）
// 0.0040891 secs YGC耗时
[PSYoungGen: 8025K->1014K(9216K)] 8025K->5118K(19456K), 0.0040891 secs]
```
**为什么新生代总内存大小为9216K？**

9216k=9M，Eden（8M）+Survivor（1M）=9M，因为新生代中只有一个Survivor区可以存放对象

**我们在启动参数中并没有设置垃圾收集器，为什么使用了 Parallel Scavenge 收集器呢？**

因为当没有设置时，用了默认的垃圾收集器，相当于启动参数加了如下参数
```java
-XX:+UseParallelGC 年轻代使用 Parallel Scavenge 垃圾收集器
-XX:+UseParallelOldGC 老年代使用 Parallel Old 垃圾收集器
```

```java
// 本次 GC 耗时
[Times: user=0.01 sys=0.01, real=0.01 secs] 
```

**这段日志是JVM退出时打印出来当前堆内存的使用情况**

```java
Heap
 PSYoungGen      total 9216K, used 7395K [0x00000007bf600000, 0x00000007c0000000, 0x00000007c0000000)
  eden space 8192K, 77% used [0x00000007bf600000,0x00000007bfc3b660,0x00000007bfe00000)
  from space 1024K, 99% used [0x00000007bfe00000,0x00000007bfefd818,0x00000007bff00000)
  to   space 1024K, 0% used [0x00000007bff00000,0x00000007bff00000,0x00000007c0000000)
 ParOldGen       total 10240K, used 4104K [0x00000007bec00000, 0x00000007bf600000, 0x00000007bf600000)
  object space 10240K, 40% used [0x00000007bec00000,0x00000007bf002020,0x00000007bf600000)
 Metaspace       used 3342K, capacity 4496K, committed 4864K, reserved 1056768K
  class space    used 363K, capacity 388K, committed 512K, reserved 1048576K
```


```java
// PSYoungGen Parallel Scavenge 垃圾收集器
// toal 9216K 年轻代总共有 9216K（9MB）
// used 7395K 目前使用了 7395K
PSYoungGen      total 9216K, used 7395K [0x00000007bf600000, 0x00000007c0000000, 0x00000007c0000000)
```

```java
// eden大小为 8192K（8MB） 使用了 77%
eden space 8192K, 77% used [0x00000007bf600000,0x00000007bfc3b660,0x00000007bfe00000)
```
## 内存分配策略
### 对象优先在Eden分配
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/514bbb49ee80746ae40e8cb719f8e086.png)

**将新生代分为Eden区，From区，To区是基于其所用的垃圾回收决定的（标记复制算法）**

这3个区的内存分配过程如下
1. 对象优先在Eden区分配，当进行YGC时，会将存活的对象放到From区，To区空着不用哈。
2. 当第二次进行YGC时，会将From区和Eden区存活的对象复制到To区，此时Eden区和From区就为空哈。
3. 当第二次进行YGC时，会将To区和Eden区存活的对象复制到From区，此时Eden区和To就为空哈。
4. 按照此规律，循环往复下去
### 大对象直接进入老年代
JVM中有这样一个参数 **-XX: PretenureSizeThreshold** ，指定大于该设置值的对象直接在老年代分配，这样做的目的就是避免在Eden区以及2个Survivor区之间来回复制，产生大量的内存复制操作
### 长期存活的对象将进入老年代
对象通常在Eden区诞生，如果经过第一次Minor GC后仍然存活，并且能被Survivor容纳的话，该对象会被移动到Survivor中，并且将其对象设为1岁，对象在Survivor区中每熬过一次Minor GC，年龄就增加一岁，当它的年龄增加到一定程度（默认15），就会被晋升到老年代中，对象晋升老年代的年龄阈值， 可以通过参数-XX:MaxTenuringThreshold设置

### 动态对象年龄判定
HotSpot虚拟机并不是永远要求对象的年龄必须达到-XX:MaxTenuringThreshold才能晋升老年代，如果在Survivor空间中相同年龄所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象就可以直接进入老年代

### 空间分配担保

**如果在Minor GC之后发现剩余的存活对象太多了，没办法放入另一块Survivor区怎么办？**

这个时候就必须把这些对象直接转移到老年代去

**但是这样就会引入新的问题了，如果老年代也放不下这些对象该怎么办？**

只要老年代的连续空间大于新生代对象的总大小或者历次晋升到老年代的对象的平均大小就进行MinorGC。

否则FullGC，对老年代进行垃圾回收，尽量腾出一些空间，然后执行Minor GC，如果Full GC 过后，老年代还是没有足够的空间存放Minor GC过后剩余的存活对象，就会导致内存溢出
