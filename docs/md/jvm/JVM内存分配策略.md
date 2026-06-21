---
layout: post
title: JVM内存分配策略
lock: need
---
# JVM实战：JVM内存分配策略
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/fb2387bf3d28d1ea4f64f323d6731709.jpeg)
## 介绍
JVM的内存分配策略主要围绕着对象如何在堆内存中分配以及何时触发垃圾回收展开
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/2af36e3b05ed9f3dc81409df70602ee5.jpeg)
## 内存分配策略
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/17a19c94cc51c585560b8831ef2e432c.png)
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
