---
layout: post
title: ThreadLocal的应用场景和注意事项有哪些？
lock: need
---

# 并发容器：ThreadLocal的应用场景和注意事项有哪些？

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c50c24854a3e266b3a481a106ffc6414.jpeg)
## ThreadLocal有哪些作用？
ThreadLocal主要有如下2个作用

1. 保证线程安全
2. 在线程级别传递变量

## 保证线程安全
最近一个小伙伴把项目中封装的日期工具类用在多线程环境下居然出了问题，来看看怎么回事吧

日期转换的一个工具类
```java
public class DateUtil {

    private static final SimpleDateFormat sdf = 
            new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static Date parse(String dateStr) {
        Date date = null;
        try {
            date = sdf.parse(dateStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
}
```
然后将这个工具类用在多线程环境下

```java
public static void main(String[] args) {

    ExecutorService service = Executors.newFixedThreadPool(20);

    for (int i = 0; i < 20; i++) {
        service.execute(()->{
            System.out.println(DateUtil.parse("2019-06-01 16:34:30"));
        });
    }
    service.shutdown();
}
```
结果报异常了，因为部分线程获取的时间不对

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/48f29c45ce26e78f48e776b514084e36.png)

那么我们如何解决这个问题呢？

### 解决方案
**解决方案1：每次来都new新的，空间浪费比较大**

```java
public class DateUtil {

    public static Date parse(String dateStr) {
        SimpleDateFormat sdf =
                new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date date = null;
        try {
            date = sdf.parse(dateStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
}
```
**解决方案2：方法用synchronized修饰，并发上不来**
```java
public class DateUtil {

    private static final SimpleDateFormat sdf =
            new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static synchronized Date parse(String dateStr) {
        Date date = null;
        try {
            date = sdf.parse(dateStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
}
```
**解决方案3：用jdk1.8中的日期格式类DateFormatter，DateTimeFormatter**

```java
public class DateUtil {

    private static DateTimeFormatter formatter = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static LocalDateTime parse(String dateStr) {
        return LocalDateTime.parse(dateStr, formatter);
    }
}
```

**解决方案4：用ThreadLocal，一个线程一个SimpleDateFormat对象**

```java
public class DateUtil {

    private static ThreadLocal<DateFormat> threadLocal = ThreadLocal.withInitial(
            ()-> new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));

    public static Date parse(String dateStr) {
        Date date = null;
        try {
            date = threadLocal.get().parse(dateStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
}
```

现在这个工具类能正常使用了，这是为啥呢？

### 原理分析
当多个线程同时读写同一共享变量时存在并发问题，如果不共享不就没有并发问题了，一个线程存一个自己的变量，类比原来好几个人玩同一个球，现在一个人一个球，就没有问题了，如何把变量存在线程上呢？

ThreadLocal就是通过给每个线程绑定一个指定类型的变量来实现线程安全的。来看一下是如何实现的？

在Thread类内部有用一个Map容器存变量。它的大概结构如下所示

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4d3c62bc078d8b615ea38330b47e3bfa.png)

ThreadLocalMap是一个Map，key是ThreadLocal，value是Object

映射到源码就是如下所示：

ThreadLocalMap是ThreadLocal的一个静态内部类
```java
public class Thread implements Runnable {
    ThreadLocal.ThreadLocalMap threadLocals = null;
}
```
往ThreadLocalMap里面放值
```java
// ThreadLocal类里面的方法，将源码整合了一下
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = t.threadLocals;
    if (map != null)
        map.set(this, value);
    else
		t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```
从ThreadLocalMap里面取值


```java
// ThreadLocal类里面的方法，将源码整合了一下
public T get() {
	Thread t = Thread.currentThread();
	ThreadLocalMap map = t.threadLocals；
	if (map != null) {
		ThreadLocalMap.Entry e = map.getEntry(this);
		if (e != null) {
			@SuppressWarnings("unchecked")
			T result = (T)e.value;
			return result;
		}
	}
	return setInitialValue();
}
```
从ThreadLocalMap里面删除值

```java
// ThreadLocal类里面的方法，将源码整合了一下
public void remove() {
	ThreadLocalMap m = Thread.currentThread().threadLocals;
	if (m != null)
		m.remove(this);
}
```

执行如下代码

```java
public class InfoUtil {

    private static ThreadLocal<String> nameInfo = new ThreadLocal<>();
    private static ThreadLocal<Integer> ageInfo = new ThreadLocal<>();

    public static void setInfo(String name, Integer age) {
        nameInfo.set(name);
        ageInfo.set(age);
    }

    public static String getName() {
        return nameInfo.get();
    }

    public static void main(String[] args) {
        new Thread(() -> {
            InfoUtil.setInfo("张三", 10);
            // 张三
            System.out.println(InfoUtil.getName());
        }, "thread1").start();
        new Thread(() -> {
            InfoUtil.setInfo("李四", 20);
            // 李四
            System.out.println(InfoUtil.getName());
        }, "thread2").start();
    }
}
```
变量的结构如下图
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8ff7b79efa1f049ad88db78f29b5ac3b.png)
## 在线程级别传递变量
假设有如下一个场景，method1()调用method2()，method2()调用method3()，method3()调用method4()，method1()生成了一个变量想在method4()中使用，有如下2种解决办法

1. method 2 3 4的参数列表上都写上method4想要的变量
2. method 1 往ThreadLocal中put一个值，method4从ThreadLocal中get出来

哪种实现方式比较优雅呢？相信我不说你也能明白了

我在生产环境中一般是这样用的，如果一个请求在系统中的处理流程比较长，可以对请求的日志打一个相同的前缀，这样比较方便处理问题

这个前缀的生成和移除可以配置在拦截器中，切面中，当然也可以在一个方法的前后

```java
public class Main {

    public static final ThreadLocal<String> SPANID =
            ThreadLocal.withInitial(() -> UUID.randomUUID().toString());

    public static void start() {
        SPANID.set(UUID.randomUUID().toString());
        // 方法调用过程中可以在日志中打印SPANID表明一个请求的执行链路
        SPANID.remove();
    }
}
```
当然Spring Cloud已经有现成的链路追踪组件了。
## ThreadLocal使用注意事项
ThreadLocal如果使用不当会造成如下问题
1. 脏数据
2. 内存泄露

### 脏数据
线程复用会造成脏数据。由于线程池会复用Thread对象，因此Thread类的成员变量threadLocals也会被复用。如果在线程的run()方法中不显示调用remove()清理与线程相关的ThreadLocal信息，并且下一个线程不调用set()设置初始值，就可能get()到上个线程设置的值
### 内存泄露
从类定义可以看到ThreadLocalMap中ThreadLocal是个弱引用
```java
static class ThreadLocalMap {

	static class Entry extends WeakReference<ThreadLocal<?>> {
		Object value;

		Entry(ThreadLocal<?> k, Object v) {
			super(k);
			value = v;
		}
	}
}
```

**为了引出后面内存泄漏是如何发生的？我们先来回顾一下JDK中的四种引用类型**

1. 强引用，直接new
2. 软引用，通过SoftReference创建，在内存空间不足的时候直接销毁，即它可能最后的销毁地点是在老年区
3. 弱引用，通过WeakReference创建，在GC的时候直接销毁。即其销毁地点必定为伊甸区
4. 虚引用，通过PhantomReference创建，它和不存也一样，「非常虚，只能通过引用队列在进行一些操作，主要用于堆外内存回收」

**ThreadLocal为啥要用弱引用？**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0243ad229cb748f4b52d15536a5fa262.png)

当方法结束后，栈上的TheadLocal Ref就不再使用了，但是TheadLocal对象因为还有一条引用链在，所以就会导致它无法被回收，久而久之就有可能会导致OOM

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/4351636981c44d5a8bd1d9ae30549e76.png)
如果用了弱引用，那么ThreadLocal对象就可以在下次GC的时候被回收掉了
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/41be0f3cf60f40e49602d0c90cd23386.png)
**既然设计了弱引用，为什么还会内存泄漏？**

Key 变成了 null，但 Value 还是强引用。线程池中的工作线程有可能存活很长时间也不销毁，这就导致了一条无法斩断的强引用链：Thread Ref -> Thread -> ThreadLocalMap -> Entry -> value

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f5ce71ff3976437f8031e82801adc3b4.png)

这个 Key 为 null 的 Value 永远无法被访问到，但也永远无法被 GC 回收，从而导致了内存泄漏

**JDK 的自愈机制与局限性**

JDK 设计者在 ThreadLocalMap 的 get()、set()、remove() 方法中做了清扫逻辑：当遇到 Key 为 null 的 Entry 时，会顺便将对应的 Value 置为 null 以便回收。

但这个机制是有条件的：如果该线程在后续的操作中，再也没有调用过该 ThreadLocal 的任何方法，那么这个清理动作就永远不会触发，内存依然会泄漏

**如何解决脏数据和内存泄漏？**

解决以上两个问题的办法很简单，就是在每次用完ThreadLocal后，及时调用remove()方法清理即可