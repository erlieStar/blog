---
layout: post
title: 使用MAT进行内存溢出排查
lock: need
---

# JVM实战：使用MAT进行内存溢出排查
![在这里插入图片描述](https://img-blog.csdnimg.cn/a1f35c8b20fc49e7843f34d08ffadc1a.png)
## 内存溢出排查
先来了解一下Java堆的组成机构。对于大多数应用来说，Java堆（Java Heap）是Java虚拟机锁管理的内存中最大的一块。Java堆是所有线程共享的一块内存区域，在虚拟机启动时创建。此内存区域的唯一目的就是存放对象实例，几乎所有的对象实例都在这里分配内存

**堆的结构如下**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210313144833657.png?)

**新生代老年代的具体划分比例如下**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210313144851245.png?)

**分代的主要作用就是为了更高效的管理内存**

内存泄漏和内存溢出是2个不同的概念

内存泄漏：对象已经不使用了，但是还占用着内存空间，没有被释放

内存溢出：堆空间不够用了，通常表现为OutOfMemoryError，内存泄漏通常会导致内存溢出
## 使用Eclipse Memory Analyzer分析
分析堆内存的工具有很多，比如jvisualvm，但是都很鸡肋，最强大的工具就是Eclipse Memory Analyzer（简称MAT）

我们写一个程序，来演示内存不断增加的场景
```java
public class OomDemo {

    private static final int NUM = 1024;

    public static void main(String[] args) throws InterruptedException {
        List<byte[]> list = Lists.newArrayList();
        for (int i = 0; i < NUM; i++) {
            TimeUnit.SECONDS.sleep(1);
            list.add(new byte[NUM * NUM]);
        }
    }
}
```

Eclipse Memory Analyzer下载地址：
https://www.eclipse.org/mat/downloads.php

还是上面的程序，我们启动时设置如下参数，让程序内存溢出时自动生成Dump文件

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021062613002677.png?)

```java
-Xmx30m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/Users/peng
```
-Xmx30m：最大堆内存为30m
-XX:+HeapDumpOnOutOfMemoryError：当JVM发生OOM时，自动生成DUMP文件。
-XX:HeapDumpPath：指定文件路径，例如：-XX:HeapDumpPath=${目录}/java_heapdump.hprof。如果不指定文件名，默认为：java_pid\<pid>.hprof

生产环境一般都会配置堆溢出时自动生成DUMP文件

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210626130312846.png?)

当内存溢出的时候自动生成了一个文件，java_pid28598.hprof

当然你也可以执行如下命令手动生成dump文件

```java
jmap -dump:file=文件名字 进程id
```

**接着用MAT打开dump文件然后开始分析，分析的过程就3步**

1. 占用内存过大的对象有哪些？（MAT Histogram）
2. 这个对象被谁引用？（MAT dominator_tree）
3. 定位到具体的代码（MAT thread_overview）

### 占用内存过大的对象有哪些？
点击标红的按钮即可看到，byte[]数组占用的内存最多

![在这里插入图片描述](https://img-blog.csdnimg.cn/6b55cfc8aa764d05bf79597da0f3100f.png)

### 这个对象被谁引用？

点击标红按钮即可看到大对象和GC Root的引用关系，原来main线程中引用了这个对象

![在这里插入图片描述](https://img-blog.csdnimg.cn/3f5f257a347e49ffb83b6a57c2995d82.png)

### 定位到具体的代码

点击标红按钮能看到应用中所有的线程状态，比如方法的调用链路，以及在每个方法中创建的对象。另外还可以看到线程总数是6个

![在这里插入图片描述](https://img-blog.csdnimg.cn/4f800947b5d94e0c966fcd16e1f366b5.png)

从图中可以看到main线程此时执行到OomDemo类的第26行，即如下代码

```java
list.add(new byte[NUM * NUM]);
```
好了问题排查出来了，是不是很简单。**排查的过程都很简单，难的是如何解决**，如果代码是自己写的，那一会就改完了，如果是一些中间件的代码造成的内存溢出就要求你对中间件的实现有个基本的了解才能解决！