---
layout: post
title: 线上服务CPU飙高怎么排查？
lock: need
---

# 面试官：线上服务CPU飙高怎么排查？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231248518.png?)
## 用jstack排查
1. 先执行top，找到CPU占用比较高的进程
2. jstack 进程id > show.txt
3. 找到进程中CPU占用比较高的线程，线程id转为16进制
4. 到show.txt文件中根据线程id查看线程的具体状态即可

## Top命令使用
top 命令运行图：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231607348.png?)

第一行：基本信息

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231648401.png)

第二行：任务信息

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231702290.png)

第三行：CPU使用情况

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231715782.png?)

第四行：物理内存使用情况

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901231739883.png)

**buff/cache：**

buffers 和 cache 都是内存中存放的数据，不同的是，buffers 存放的是准备写入磁盘的数据，而 cache 存放的是从磁盘中读取的数据

在Linux系统中，有一个守护进程(daemon)会定期把buffers中的数据写入的磁盘，也可以使用 sync 命令手动把buffers中的数据写入磁盘。使用buffers可以把分散的 I/O 操作集中起来，减少了磁盘寻道的时间和磁盘碎片。

cache是Linux把读取频率高的数据，放到内存中，减少I/O。Linux中cache没有固定大小，根据使用情况自动增加或删除。
## 演示死循环死锁
```java
@RestController
@RequestMapping("top")
public class ShowTopController {

    private Object lock1 = new Object();
    private Object lock2 = new Object();

    @RequestMapping("test")
    public String test() {
        return "success";
    }

    @RequestMapping("loop")
    public String loop() {
        System.out.println("start");
        while (true) {}
    }

    @RequestMapping("deadlock")
    public String deadlock() {
        new Thread(() -> {
            synchronized (lock1) {
                try{
                    TimeUnit.SECONDS.sleep(1);
                } catch (Exception e) {}
                synchronized (lock2) {
                    System.out.println("thread1 over");
                }
            }
        }).start();
        new Thread(() -> {
            synchronized (lock2) {
                try{
                    TimeUnit.SECONDS.sleep(1);
                } catch (Exception e) {}
                synchronized (lock1) {
                    System.out.println("thread2 over");
                }
            }
        }).start();
        return "success";
    }
}
```

### 死循环

这里我只介绍一下用到的top参数
| 参数选项名称 |                             含义                             |
| :----------: | :----------------------------------------------------------: |
|      p       | 通过指定进程ID（PID）来仅仅监控某个进程的状态。可以指定多个，-pN1 -pN2 ... （-p N1 -p N2...也可）或者 -pN1,N2,N3 ...（-p N1,N2...也可） |
|      H       | 显示所有线程的运行状态指标。如果没有该参数，会显示一个进程中所有线程的总和。在运行过程中，可以通过H命令进行交互控制 |

先手动制造CPU飙高的场景，多执行几次，小编这里执行3次

```shell
curl localhost:8080/top/loop
```

先执行top

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019010317460292.PNG)

看到pid为23757的进程CPU占用较高，执行如下命令
```shell
jstack 23757 > loop.txt
```
看看线程的具体情况
```shell
top -p 23757 -H
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190103174921118.PNG)

当然你也可以使用交互命令
```shell
top -p 23757
```
然后再输入H，效果和上面一样

可以看到PID为23772,23773和23774的线程占用CPU较高

这里可能有人有疑惑，为什么线程也有PID啊？其实线程进程都会有自己的ID，这个ID就叫做PID，PID是不特指进程ID，线程ID也可以叫做PID

将10进制的23772转为16进制，因为jstack中PID用的是16进制

```shell
printf "%x" 23772
输出5cdc
```
打开loop.txt文件，搜5cdc
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190103175859431.png?)
**可以看到线程状态为RUNNABLE**，一直在执行ShowTopController中的第23行，即

```java
while (true) {}
```
好了定位到代码中的位置了，当然生产环境中肯定不会写一个死循环的，有可能在特殊场景下出现死循环，或执行一个方法特别慢，用这种方法很快就能找到代码位置。

### 死锁

接着访问
```shell
curl localhost:8080/top/loop
```
执行

```shell
jstack 23757 > loop.txt
```

打开loop.txt文件到最后
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190103193136724.PNG?)

看到发现一个死锁，死锁代码的位置描述的很清楚，生产环境发生的死锁当然没有这么简单，所有学会用这些命令排查还是很有必要的~~~~