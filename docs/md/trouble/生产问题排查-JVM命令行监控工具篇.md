---
layout: post
title: 生产环境发生问题，你一般怎么排查？（JVM命令行监控工具篇）
lock: need
---

# 面试官：生产环境发生问题，你一般怎么排查？（JVM命令行监控工具篇）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707140945668.jpg?)

## 介绍
在生产环境中，经常会遇到各种各样奇葩的性能问题，所以掌握最基本的JVM命令行监控工具还是很有必要的

|名称| 主要作用 |
|--|--|
| jps | 查看正在运行的Java进程 |
|jstack|打印线程快照|
|jmap|导出堆内存映像文件|
|jstat|查看jvm统计信息|
|jinfo|实时查看和修改jvm配置参数|
|jhat|用于分析heapdump文件|

## jps:查看正在运行的Java进程
jps可以列出正在运行的Java进程，并显示虚拟机执行主类（Main Class，main()函数所在的类）名称以及进程id

**如果想看一个命令的后面加 -help参数即可**

```shell
[root@VM-0-14-centos ~]# jps -help
usage: jps [-help]
       jps [-q] [-mlvV] [<hostid>]

Definitions:
    <hostid>:      <hostname>[:<port>]
```
**可以看到可以监控远程服务，但是基于安全考虑，一般不使用**

常见的选项如下
|选项| 作用 |
|--|--|
| -q | 只输出进程id |
| -m | 输出传递给主类main函数的参数 |
| -l | 输出主类全类名，如果进程执行的是Jar包，输出jar包名字 |
| -v | 程序启动时指定的jvm参数|

```shell
cis@mt002:~$ jps
70208 KmpService
183525 LinkAnalysisServer
25160 MipSerachServer
```

```shell
cis@mt002:~$ jps -l
70208 com.st.kmp.main.KmpService
183525 com.st.cis.main.LinkAnalysisServer
25160 com.st.cis.main.MipSerachServer
```

## jstack:打印线程快照
**查看某个Java进程中所有线程的状态。一般用来定位线程出现长时间停顿的原因，如发生死循环，死锁，请求外部资源长时间等待等！**

```java
public class DeadLockDemo {

    private static Object lockA = new Object();
    private static Object lockB = new Object();


    public static void main(String[] args) {

        Thread threadA = new Thread(() -> {
            synchronized (lockA) {
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("get lockA");
                synchronized (lockB) {
                    System.out.println("threadA run finish");
                }
            }
        });

        Thread threadB = new Thread(() -> {
            synchronized (lockB) {
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("get lockB");
                synchronized (lockA) {
                    System.out.println("threadB run finish");
                }
            }
        });

        threadA.setName("myThreadA");
        threadB.setName("myThreadB");
        threadA.start();
        threadB.start();
    }
}
```

**我写了一个死锁的例子，启动后执行jps找到进程id为19457**

```java
peng@pengdeMacBook-Pro ~ % jps
19457 DeadLockDemo
19458 Launcher
2658 
19459 Jps
```
接着执行如下命令，列出了这个进程每个线程的执行状态

```shell
jstack 19457
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707144554346.png?)

**从图中可以看到有很多线程，GC线程，myThreadA，myThreadB等，其中myThreadA和myThreadB的线程状态为BLOCKED，并且在最后提示出了死锁发生的位置**

## jmap:导出堆内存映像文件
**jmap主要用来用来导出堆内存映像文件，看是否发生内存泄露等。**

生产环境我们一般会配置如下参数，让虚拟机在OOM异常出现之后自动生成dump文件

```java
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/Users/peng
```
执行如下命令即可手动获得dump文件
```shell
jmap -dump:file=文件名.dump 进程id
```
**分析堆内存的工具有很多，如Java VisualVM，jhat等。但个人觉得最好用的就是Eclipse Memory Analyzer，没有之一**

## jstat:查看jvm统计信息
**jstat可以显示本地或者远程虚拟机进程中的类装载、 内存、 垃圾收集、 JIT编译等运行数据**

用jstat查看一下类装载的信息。我个人很少使用这个命令，命令行看垃圾收集信息真不如看图形界面方便，就不多做介绍了。
```java
[root@VM-0-14-centos ~]# jstat -class 19402
Loaded  Bytes  Unloaded  Bytes     Time   
 10229 19679.1       52    76.0       5.33
```
含义如下
|Loaded | 解释 |
|--|--|
| Loaded | 加载类的个数 |
| Bytes | 加载类的字节数|
| Unloaded | 卸载类的个数 |
| Bytes | 卸载类的字节数 |
| Time | 花费的时间 |
## jinfo:实时查看和修改jvm配置参数
jinfo的作用是实时地查看和修改虚拟机各项参数。

**使用jps命令的-v参数可以查看虚拟机启动时显式指定的参数列表**，但如果想知道未被显式指定的参数的系统默认值，除了去找资料外，就只能使用jinfo的-flag选项进行查询了（如果只限于JDK 1.6或以上版本的话，使用java -XX:+PrintFlagsFinal查看参数默认值也是一个很好的选择）

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021070716373839.jpg?)

**jinfo flags pid在高版本才能正常使用，我在jdk1.8这个版本不能正常使用**

应用程序设置如下参数
```java
-Xmx10m -Xms10m
```
查看最大堆内存和是否打印GC日志，可以看到不打印GC日志
接着设置打印GC日志，再次查看，打印GC日志
```java
peng@pengdeMacBook-Pro ~ % jinfo -flag MaxHeapSize 20253         
-XX:MaxHeapSize=10485760
peng@pengdeMacBook-Pro ~ % jinfo -flag PrintGCDetails 20253
-XX:-PrintGCDetails
peng@pengdeMacBook-Pro ~ % jinfo -flag +PrintGCDetails 20253
peng@pengdeMacBook-Pro ~ % jinfo -flag PrintGCDetails 20253 
-XX:+PrintGCDetails
```

**Xmx是MaxHeapSize的别名**