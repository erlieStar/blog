---
layout: post
title: volatile如何保证可见性和有序性？
lock: need
---

# 并发关键字：volatile如何保证可见性和有序性？

![请添加图片描述](https://img-blog.csdnimg.cn/f8011400c5034f3491de41f75d8705fd.png)
## Java内存模型
在之前的文章中我们提到为了便于进行分析，Java中的内存模型被抽象为如下这种形式。这个内存模型对我们分析volatile关键字非常有用，所以再次提一下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190112171010636.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

## volatile的作用是什么？
**volatile可以保证可见性，有序性，但不能保证原子性**

### 可见性

**可见性是指当多个线程访问同一个变量时，一个线程修改了这个变量的值，其他线程能够立即看得到修改的值**

假如说有2个线程对一个变量data进行操作，线程先会把主内存中的值缓存到工作内存，这样做的原因和上面提到的高速缓存类似，提高效率

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190112171216554.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

但是这样会引入新的问题，假如说线程A把data修改为1，线程A的工作内存data值为1，但是主内存和线程B的工作内存data值为0，此时就有可能出现Java并发编程中的可见性问题

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190112171308741.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

举个例子，如下面代码，线程A已经将flag的值改变，但是线程B并没有及时的感知到，导致一直进行死循环

```java
public class Test {

    public static boolean flag = false;

    public static void main(String[] args) {

        new Thread(()->{
            while(!flag) {
            }
            System.out.println("threadB end");
        }).start();

        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        new Thread(()->{
            flag = true;
            System.out.println("threadA end");
        }).start();
    }

}
```
输出为，线程B一直没有结束

```text
threadA end
```

但是如果将data定义为如下形式，线程A对data的变更，线程B立马能感知到

```java
public static volatile boolean flag = false;
```
输出为

```text
threadA end
threadB end
```

那么是如何实现的呢？

1. 线程A将工作内存的data更改后，强制将data值刷回主内存
2. 如果线程B的工作内存中有data变量的缓存时，会强制让这个data变量缓存失效
3. 当线程B需要读取data变量的值时，先从工作内存中读，发现已经过期，就会从主内存中加载data变量的最新值了

放个图理解的更清楚

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190112171858397.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

### 有序性

有序性即程序执行的顺序按照代码的先后顺序执行

```java
int i = 0;              
boolean flag = false;
i = 1;                //语句1  
flag = true;          //语句2
```
上面代码定义了一个int型变量，定义了一个boolean类型变量，然后分别对两个变量进行赋值操作。从代码顺序上看，语句1是在语句2前面的，那么JVM在真正执行这段代码的时候会保证语句1一定会在语句2前面执行吗？不一定，为什么呢？这里可能会发生指令重排序（Instruction Reorder）。

　　下面解释一下什么是指令重排序，一般来说，处理器为了提高程序运行效率，可能会对输入代码进行优化，它不保证程序中各个语句的执行先后顺序同代码中的顺序一致，但是它会保证程序最终执行结果和代码顺序执行的结果是一致的。

　　比如上面的代码中，语句1和语句2谁先执行对最终的程序结果并没有影响，那么就有可能在执行过程中，语句2先执行而语句1后执行。

但是有依赖关系的语句不会进行重排序，如下面求圆面积的代码

```java
double pi = 4.14   //A
double r = 1.0     //B
double area = pi * r * r   //c 
```
程序的执行顺序只有下面这2个形式
A->B->C和B->A->C，因为A和C之间存在依赖关系，同时B和C之间也存在依赖关系。因此最终执行的指令序列中C不能被重排序到A和B前面。

虽然重排序不会影响单个线程内程序执行的结果，但是多线程呢？下面看一个例子

```java
//线程1:
context = loadContext();   //语句1
inited = true;             //语句2
 
//线程2:
while(!inited ){
  sleep()
}
doSomethingwithconfig(context);
```
上面代码中，由于语句1和语句2没有数据依赖性，因此可能会被重排序。假如发生了重排序，在线程1执行过程中先执行语句2，而此是线程2会以为初始化工作已经完成，那么就会跳出while循环，去执行doSomethingwithconfig(context)方法，而此时context并没有被初始化，就会导致程序出错。

从上面可以看出，指令重排序不会影响单个线程的执行，但是会影响到线程并发执行的正确性

当写双重检测锁定版本的单例模式时，就要用到volatile来保证有序性

```java
public class Singleton {

   private volatile static Singleton uniqueInstance;

   private Singleton() {}

   public static Singleton getInstance() {
       if (uniqueInstance == null) {
           synchronized (Singleton.class) {
               if (uniqueInstance == null) {
                   uniqueInstance = new Singleton();
               }
           }
       }
       return uniqueInstance;
   }
}
```
### 原子性

原子性即一个操作或者多个操作 要么全部执行并且执行的过程不会被任何因素打断，要么就都不执行。

```java
public class Test {

    public static volatile int inc = 0;

    public static void main(String[] args) {

        //新建一个线程池
        ExecutorService service = Executors.newCachedThreadPool();
        //Java8 lambda表达式执行runnable接口
        for (int i = 0; i < 5; i++) {
            service.execute(() -> {
                for (int j = 0; j < 1000; j++) {
                    inc++;
                }
            });
        }
        //关闭线程池
        service.shutdown();
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("inc = " + inc);
    }

}
```
执行上述代码结果并不是每次都是5000，表明volatile并不能保证原子

可能有的朋友就会有疑问，不对啊，上面是对变量inc进行自增操作，由于volatile保证了可见性，那么在每个线程中对inc自增完之后，在其他线程中都能看到修改后的值啊，所以有5个线程分别进行了1000次操作，那么最终inc的值应该是1000*5=5000。

这里面就有一个误区了，volatile关键字能保证可见性没有错，但是上面的程序错在没能保证原子性。可见性只能保证每次读取的是最新的值，但是volatile没办法保证对变量的操作的原子性。

在前面已经提到过，自增操作是不具备原子性的，它包括读取变量的原始值、进行加1操作、写入工作内存。那么就是说自增操作的三个子操作可能会分割开执行，就有可能导致下面这种情况出现：

假如某个时刻变量inc的值为10，线程1对变量进行自增操作，线程1先读取了变量inc的原始值，然后线程1被阻塞了；然后线程2对变量进行自增操作，线程2也去读取变量inc的原始值，由于线程1只是对变量inc进行读取操作，而没有对变量进行修改操作，所以不会导致线程2的工作内存中缓存变量inc的缓存行无效（假设inc的值已经从主内存加载到工作内存了哈），也不会导致主存中的值刷新，所以线程2会去工作内存读取inc的值，发现inc的值时10，然后进行加1操作，并把11写入工作内存，最后写入主存。

然后线程1接着进行加1操作，由于已经读取了inc的值（inc++，包括3个操作，1.读取inc的值，2.进行加1操作，3.写入新的值），注意此时在线程1的工作内存中inc的值仍然为10，所以线程1对inc进行加1操作后inc的值为11，然后将11写入工作内存，最后写入主存。

那么两个线程分别进行了一次自增操作后，inc只增加了1。

根源就在这里，自增操作不是原子性操作，而且volatile也无法保证对变量的任何操作都是原子性的。

解决方案：可以通过synchronized或lock，进行加锁，来保证操作的原子性。也可以通过使用AtomicInteger

## volatile关键字的应用

1. 状态标记量
2. 单例模式中的double check

## volatile如何实现可见性和有序性的？
### 可见性
当对volatile进行写的时候，会根据缓存一致性协议将变量写入内存，在写入内存的过程中会经过总线，其他线程会**嗅探**总线上的数据，当发现数据已经被修改时，会将工作内存中的变量置为失效，后续再从主内存中读取
### 有序性
volatile通过内存屏障来实现有序性能。在Java中有如下四种内存屏障

| 屏障类型 | 指令示例 | 说明 |
|--|--|--|
| LoadLoad Barriers | Load1; LoadLoad; Load2 | 确保Load1数据的装载先于Load2及所有后续装载指令的装载|
| StoreStore Barriers | Store1; StoreStore; Store2 |确保Store1数据对其他处理器可见（刷新到内存）先于Store2及所有后续存储指令的存储 |
| LoadStore Barriers | Load1; LoadStore; Store2 | 确保Load1数据装载优先于Store2及所有后续的存储指令刷新到内存|
| StoreLoad Barriers| Store1; StoreLoad; Load2 | 确保Store1数据对其他处理器变得可见（只刷新到内存）先于Load2及所有后续装载指令的装载|

volatile使用内存屏障的方式如下

1. 在每个volatile写操作的前面插入一个StoreStore屏障；
2. 在每个volatile写操作的后面插入一个StoreLoad屏障；
3. 在每个volatile读操作的后面插入一个LoadLoad屏障；
4. 在每个volatile读操作的后面插入一个LoadStore屏障。


**需要注意的是：volatile写是在前面和后面分别插入内存屏障，而volatile读操作是在后面插入两个内存屏障**
