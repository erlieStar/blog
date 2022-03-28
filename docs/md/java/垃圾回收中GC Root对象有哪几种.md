---
layout: post
title: 垃圾回收中GC Root对象有哪几种？
lock: need
---

# 面试官：垃圾回收中GC Root对象有哪几种？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901234621495.png?)

## 介绍
写过C++程序的小伙伴都知道，每次new出来的对象，都要在代码中手动回收，不然就会造成内存泄露（即内存一直占用，直到程序崩溃），而写Java就不用担心这个问题，只管申请，不用管释放。因为JVM会帮你释放清除那些不用的对象。那么JVM是怎么判断哪些对象不被使用了，可以被清除了

## 判断对象不被使用的算法
### 引用计数法
引用计数法（Reference Counting）：给对象添加一个引用计数器，每当有一个地方引用它时，计数器值就加1，当引用失效时，计数器值就减1，任何时刻计数器为0的对象就是不可能被再使用的。

但这种方法算法很难解决对象之间相互循环引用的问题。举个例子

>对象objA和objB都有字段instance，赋值令objA.instance=objB，以及objB.instance=objA，除此之外这2个对象再无任何引用，实际上这2个对象已经不可能再被访问，但是他们因为互相引用这对方，导致他们的计数器都不为0，于是引用计数法无法通知GC收集器回收他们

示例代码如下

```java
public class ReferenceCountingGC {

    public Object instance;

    public ReferenceCountingGC(String name){}
}

public static void testGC(){

    ReferenceCountingGC a = new ReferenceCountingGC("objA");
    ReferenceCountingGC b = new ReferenceCountingGC("objB");

    a.instance = b;
    b.instance = a;

    a = null;
    b = null;
}
```

### 可达性分析法

可达性分析算法（Reachability Analysis）：通过一些被称为引用链（GC Roots）的对象作为起点，从这些节点开始向下搜索，搜索走过的路径被称为（Reference Chain)，当一个对象到 GC Roots 没有任何引用链相连时（即从 GC Roots 节点到该节点不可达），则证明该对象是不可用的。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190901174401667.jpg?)

如图，object5，object6和object7虽然互相有关联，但是他们到GC Roots是不可达的，所以他们会被判定为是可回收的对象。

所以什么样的对象需要回收呢？

对象到GC Root没有引用链，那么这个对象不可用，需要回收。Java就是用可达性分析法来判断对象是否需要被回收的

## 可作为GC Roots的对象
1. 虚拟机栈（栈帧中的本地变量表）中引用的对象
2. 方法区中类静态属性引用的对象
3. 方法区中常量引用的对象
4. 本地方法栈中JNI（Native方法）引用的对象

建议先看一下我写的JVM运行时数据区的内容，这样理解的更深

**虚拟机栈（栈帧中的本地变量表）中引用的对象**
此时的 s，即为 GC Root，当s置空时，localParameter 对象也断掉了与 GC Root 的引用链，将被回收。

```java
public class StackLocalParameter {
    public StackLocalParameter(String name){}
}

public static void testGC(){
    StackLocalParameter s = new StackLocalParameter("localParameter");
    s = null;
}
```


**方法区中类静态属性引用的对象**
s 为 GC Root，s 置为 null，经过 GC 后，s 所指向的 properties 对象由于无法与 GC Root 建立关系被回收。

而 m 作为类的静态属性，也属于 GC Root，parameter 对象依然与 GC root 建立着连接，所以此时 parameter 对象并不会被回收。

```java
public class MethodAreaStaicProperties {
    public static MethodAreaStaicProperties m;
    public MethodAreaStaicProperties(String name){}
}

public static void testGC(){
    MethodAreaStaicProperties s = new MethodAreaStaicProperties("properties");
    s.m = new MethodAreaStaicProperties("parameter");
    s = null;
}
```

**方法区中常量引用的对象**
m 即为方法区中的常量引用，也为 GC Root，s 置为 null 后，final 对象也不会因没有与 GC Root 建立联系而被回收。

```java
public class MethodAreaStaicProperties {
    public static final MethodAreaStaicProperties m = MethodAreaStaicProperties("final");
    public MethodAreaStaicProperties(String name){}
}

public static void testGC(){
    MethodAreaStaicProperties s = new MethodAreaStaicProperties("staticProperties");
    s = null;
}
```

**本地方法栈中引用的对象**
和虚拟机栈类似，一个是虚拟机层面的调用，一个是本地层面的调用
