---
layout: post
title: 同样是等待，说一下sleep和wait的区别
lock: need
---

# 面试官：同样是等待，说一下sleep和wait的区别

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901225639977.png?)
## 介绍
基本的差别

1. sleep是Thread类的方法，wait是Object类的方法
2. sleep方法可以在任何地方使用，wait只能在synchronized方法或synchronized块中使用

最主要的本质区别

1. Thread.sleep只会让出CPU，不会释放对象锁
2. Object.wait不仅让出CPU，还会释放对象锁。只有针对此对象调用notify()方法或者时间到了，才能再次执行

示例代码1

```java
public class WaitSleepDemo {

    public static void main(String[] args) {
        Object lock = new Object();

        new Thread(() -> {
            System.out.println("Thread A is waiting to get lock");
            synchronized (lock) {
                try {
                    System.out.println("Thread A get lock");
                    Thread.sleep(1000);
                    System.out.println("Thread A is done");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();

        // 为了先执行Thread A 再执行 Thread B
        try {
            Thread.sleep(20);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        new Thread(() -> {
            System.out.println("Thread B is waiting to get lock");
            synchronized (lock) {
                try {
                    System.out.println("Thread B get lock");
                    lock.wait(1000);
                    System.out.println("Thread B is done");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }

}
```
输出为

```java
Thread A is waiting to get lock
Thread A get lock
Thread B is waiting to get lock
Thread A is done
Thread B get lock
Thread B is done
```
由输出可以看到Thread.sleep不会释放锁，因为A完成了B才拿到锁

```java
public class WaitSleepDemo {

    public static void main(String[] args) {
        Object lock = new Object();

        new Thread(() -> {
            System.out.println("Thread A is waiting to get lock");
            synchronized (lock) {
                try {
                    System.out.println("Thread A get lock");
                    lock.wait(1000);
                    System.out.println("Thread A is done");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();

        // 为了先执行Thread A 再执行 Thread B
        try {
            Thread.sleep(20);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        new Thread(() -> {
            System.out.println("Thread B is waiting to get lock");
            synchronized (lock) {
                try {
                    System.out.println("Thread B get lock");
                    Thread.sleep(1000);
                    System.out.println("Thread B is done");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }

}
```
我们将sleep和wait换一下，输出为

```java
Thread A is waiting to get lock
Thread A get lock
Thread B is waiting to get lock
Thread B get lock
Thread B is done
Thread A is done
```
可以看到Object.wait会释放锁，因为A还没有执行完，锁就被B获得了

去掉try catch方便看

```java
public class WaitSleepDemo {

    public static void main(String[] args) {
        Object lock = new Object();

        new Thread(() -> {
            System.out.println("Thread A is waiting to get lock");
            synchronized (lock) {
				System.out.println("Thread A get lock");
				Thread.sleep(1000);
				System.out.println("Thread A is done");
            }
        }).start();

        // 为了先执行Thread A 再执行 Thread B
		Thread.sleep(20);

        new Thread(() -> {
            System.out.println("Thread B is waiting to get lock");
            synchronized (lock) {
				System.out.println("Thread B get lock");
				lock.wait(1000);
				System.out.println("Thread B is done");
            }
        }).start();
    }

}
```

```java
public class WaitSleepDemo {

    public static void main(String[] args) {
        Object lock = new Object();

        new Thread(() -> {
            System.out.println("Thread A is waiting to get lock");
            synchronized (lock) {
				System.out.println("Thread A get lock");
				lock.wait(1000);
				System.out.println("Thread A is done");
            }
        }).start();

        // 为了先执行Thread A 再执行 Thread B
		Thread.sleep(20);

        new Thread(() -> {
            System.out.println("Thread B is waiting to get lock");
            synchronized (lock) {
				System.out.println("Thread B get lock");
				Thread.sleep(1000);
				System.out.println("Thread B is done");
            }
        }).start();
    }

}
```