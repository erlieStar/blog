---
layout: post
title: JVM运行时数据区包含哪几部分？作用是啥？
lock: need
---

# 面试官：JVM运行时数据区包含哪几部分？作用是啥？

![在这里插入图片描述](https://img-blog.csdnimg.cn/896f5bb63b594c90a4840aa57ff718f7.png?)

## JDK，JRE，JVM的联系是啥？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190118193517872.PNG?)

JVM Java Virtual Machine
JDK Java Development Kit
JRE Java Runtime Environment
看上图官方的介绍讲的很清楚
## JVM的作用是啥？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190121174837892.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

JVM有2个特别有意思的特性，**语言无关性和平台无关性**。

语言无关性是指实现了Java虚拟机规范的语言对可以在JVM上运行，如Groovy，和在大数据领域比较火的语言Scala，因为JVM最终运行的是class文件，只要最终的class文件复合规范就可以在JVM上运行。

平台无关性是指安装在不同平台的JVM会把class文件解释为本地的机器指令，从而实现Write Once，Run Anywhere
## JVM运行时数据区
Java虚拟机在执行Java程序的过程中会把它所管理的内存划分为若干个不同的数据区域。这些区域都有各自的用途，以及创建和销毁的时间，有的区域随着虚拟机进程的启动而存在，有些区域则依赖用户线程的启动和结束而建立和销毁。Java虚拟机所管理的内存将会包括以下几个运行时数据区域

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190118194119929.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

**其中方法区和堆是所有线程共享的数据区。程序计数器，虚拟机栈，本地方法栈是线程隔离的数据区，** 画一个逻辑图

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190120182439808.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

### 程序计数器
程序计数器是一块较小的内存空间，它可以看作是当前线程所执行的字节码的行号指示器

为什么要记录当前线程所执行的字节码的行号？直接执行完不就可以了吗？ 

因为代码是在线程中运行的，线程有可能被挂起。即CPU一会执行线程A，线程A还没有执行完被挂起了，接着执行线程B，最后又来执行线程A了，CPU得知道执行线程A的哪一部分指令，线程计数器会告诉CPU。

### 虚拟机栈
虚拟机栈存储当前线程运行方法所需要的数据，指令，返回地址。虚拟机栈描述的是Java方法执行的内存模型：**每个方法在执行的同时都会创建一个栈帧用于存储局部变量表，操作数栈，动态链接，方法出口等信息**。每个方法从调用直至执行完成的过程，就对应着一个栈帧在虚拟机栈中从入栈到出栈的过程。

**局部变量表**

存储存储局部变量，是一个定长为32位的局部变量空间。其中64位长度的long和double类型的数据会占用2个局部变量空间（Slot），其余的数据类型只占用一个。引用类型（new出来的对象）如何存储?看下图

```java
public int methodOne(int a, int b) {
    Object obj = new Object();
    return a + b;
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190120180006852.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
如果局部变量是Java的8种基本基本数据类型，则存在局部变量表中，如果是引用类型。如String，局部变量表中存的是引用，而实例在堆中。

假如methodOne方法调用methodTwo方法时， 虚拟机栈的情况如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190120182918856.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
当虚拟机栈无法再放下栈帧的时候，就会出现StackOverflowError，演示一下

```java
public class JavaVMStackSOF {

    private int stackLength = 1;

    public void stackLeak() {
        stackLength++;
        stackLeak();
    }

    public static void main(String[] args) throws Throwable {
        JavaVMStackSOF oom = new JavaVMStackSOF();
        try {
            oom.stackLeak();
        } catch (Throwable e) {
            System.out.println("stack length: " + oom.stackLength);
            throw e;
        }
    }
}
```
在idea中设置运行时的线程的堆栈大小为如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019012021220829.png?)

-Xss 参数的作用是设置每个线程的堆栈大小
运行输出为

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190120212415141.png)

-Xss参数的值越大，打印输出的深度越大

**操作数栈**

接着解释一下**操作数栈**，还是比较容易理解的

有如下一个Test类
```java
public class Test {

    public int calc() {
        int a = 100;
        int b = 200;
        int c = 300;
        return (a + b) * c;
    }

    public int getSum(int a, int b) {
        return a + b;
    }
}
```
用javap反编译一下，看一下getSum的字节码文件内容

```shell
javap -v Test
```
```java
public int getSum(int, int);
  descriptor: (II)I
  flags: ACC_PUBLIC
  Code:
    stack=2, locals=3, args_size=3 //操作数栈大小为2，本地变量表大小为3，入参有3个
       0: iload_1 // 局部变量1压栈
       1: iload_2 // 局部变量2压栈
       2: iadd // 栈顶2个元素相加，计算结果压栈
       3: ireturn
    LineNumberTable: // 指令与代码行数的偏移关系
      line 17: 0
    LocalVariableTable: // 局部变量表
      // 作用域开始位置，作用偏移长度，槽位，变量名，类型描述
      Start  Length  Slot  Name   Signature
          0       4     0  this   Lcom/javashitang/jvm/Test;
          0       4     1     a   I
          0       4     2     b   I
```

**当Java类编译完成时，操作数栈，本地变量表的大小就已经确定了。**

操作数栈的大小为2
本地变量表有3个参数，this，a，b。其中this对象是jvm隐式传递的哈
入参有3个，this（jvm隐式传递），a，b

LineNumberTable和LocalVariableTable我用jclasslib Bytecode viewer插件（查看字节码比较方便，我一般不用javap命令）来解释一下

![在这里插入图片描述](https://img-blog.csdnimg.cn/51848b1cfb1c435f9657078b071c6bc4.png?)

**可以看到Test类的第17行代码对应的是getSum方法指令的第一行**

![在这里插入图片描述](https://img-blog.csdnimg.cn/82c4fe9c0c7f4724884e88aa5ecfb787.png)

getSum方法有3个局部变量
this，作用范围在[Start PC, Start PC+Length]，在局部变量表的第0个位置，类型为Test类

![在这里插入图片描述](https://img-blog.csdnimg.cn/c53e6108c97848dfbf95bc27a5a3110f.png)

图示如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/839ab758fdc045eaba14fb4fe947193a.png?)

假如getSum方法的入参是long，则局部变量表如下（64位长度的long和double类型的数据会占用2个局部变量空间（Slot），其余的数据类型只占用一个）

```java
public long getSum(long a, int b) {
    return a + b;
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/70cb5b8954664ffb8f07005aae0c7c39.png)

注意看局部变量表b的位置从2变为3了，因为a变量从原来占用一个slot变为占用2个slot

![在这里插入图片描述](https://img-blog.csdnimg.cn/f38b74035c084b73af21a136e6762fd1.png?)

以calc方法的执行演示一下程序计数器，操作数栈，局部变量表是如何协同工作的
```java
public int calc() {
    int a = 100;
    int b = 200;
    int c = 300;
    return (a + b) * c;
}
```
calc方法的字节码如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/6a3b886517a940c9b862eeb9d4460541.png)

执行流程图示如下

![请添加图片描述](https://img-blog.csdnimg.cn/84a55b89e84444cd92e4f7c232d584ee.png?)

可能有小伙伴们对指令的作用不太熟悉，我就简单介绍一下

一般情况下，指令的格式有如下2种形式
1. 操作指令
2. 操作指令 操作数

istore 100 将一个数值从操作数栈存储到局部变量表中的第100位
istore_1 将一个数值从操作数栈存储到局部变量表中的第1位

**为什么istore_1不写成istore 1，或者将istore 100写成istore_100?**

因为**将一个数值从操作数栈存储到局部变量表中的第1位**这个操作经常发生，如果用istore_1则会占用1个字节，如果用istore 1会占用2个字节，所以用istore_1，可以节省空间。同时一个字节表示的种类数有限（128个，**Java中各种操作指令占用1字节**），所以istore_\<n>这种形式不能表示所有操作类型，只能一少部分指令用istore_\<n>，其余的用istore n这种形式

**所以你现在理解了上图中指令的偏移量不是连续的原因了吧！**

与操作类型相关的指令，会在最开头表明操作的类型

![在这里插入图片描述](https://img-blog.csdnimg.cn/70d589d0df704ec8887c5b7bf94ea92f.png?)

bipush：将一个常量加载到操作数栈
istore：将一个数值从操作数栈存储到局部变量表
iload：将一个局部变量加载到操作栈
iadd：对操作数栈栈顶的2个只进行加法运算，并将结果重新存入操作数栈栈顶

**动态链接**

Java有些方法，类加载的过程中就能知道具体执行的逻辑，而有些需要在运行的过程中才能确定具体执行的逻辑（多态），这就是动态链接在起作用，具体的实现没太看懂，就不过多分析了。
### 本地方法栈
本地方法栈（Native Method Stack）与虚拟机栈锁发挥的作用是非常相似的，他们之间的区别不过是虚拟机栈为虚拟机执行Java方法（也就是字节码）服务，而本地方法栈则为虚拟机使用到的Native方法服务。
### Java堆
对于大多数应用来说，Java堆（Java Heap）是Java虚拟机锁管理的内存中最大的一块。Java堆是所有线程共享的一块内存区域，在虚拟机启动时创建。此内存区域的唯一目的就是存放对象实例，几乎所有的对象实例都在这里分配内存
### 方法区
方法区（Method Area）与Java堆一样，是各个线程共享的内存区域，它用于存储已被虚拟机加载的类信息，常量，静态变量，即时编译器编译后的代码等数据。
## JVM内存模型

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190121172050704.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

由颜色可以看出，jdk1.8之前，堆内存被分为新生代，老年代，永久带，jdk1.8及以后堆内存被分成了新生代和老年代。新生代的区域又分为eden区，s0区，s1区，默认比例是8:1:1，元空间可以理解为直接的物理内存

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190829233955325.png?)