---
layout: post
title: final关键字有哪些作用？
lock: need
---

# 面试官：final关键字有哪些作用？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210228193437225.jpg?)
## 介绍
final关键字的作用有如下几种

1. final修饰类时，表明这个类不能被继承
2. final修饰方法，表明方法不能被重写
3. final修饰变量，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能改变；如果是对象类型的变量，只能保证它的引用不变，但对象的内容是可以改变的
## 修饰类
**final修饰类时，表明这个类不能被继承**
```java
// 编译错误，提示
// Cannot inherit from final 'java.lang.String'
public class ClassDemo extends String{
}
```
尽量不要用final修饰类，除非这个类真的不可能被继承，或者出于安全方面的考虑
## 修饰方法
**final修饰方法，表明方法不能被重写**

在早期的版本，final修饰方法可以提高性能。不过在最新的版本中JVM做了优化，即使使用了final修饰也不会提高性能。

所以目前final的作用只是不想让子类重写
## 修饰变量
**final修饰变量，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能改变；如果是对象类型的变量，只能保证它的引用不变，但对象的内容是可以改变的**

先来回顾一下8种基本数据类型

整数类型：byte（1字节） short（2字节） int（4字节） long（8字节）
浮点类型：float（4字节） double（8字节）
字符类型：char（2字节）可以存储一个汉字
布尔类型：boolean

JVM规范指出boolean当做int处理，也就是4字节，boolean数组当做byte数组处理，这样我们可以得出boolean类型占了单独使用是4个字节，在数组中是确定的1个字节

```java
public class VarDemo {

    public final int var = 0;

    public static void main(String[] args) {
        VarDemo varDemo = new VarDemo();
        // 编译错误，提示
        // Cannot assign a value to final variable 'var'
        varDemo.var = 10;
    }
}
```
从例子中可以看到，当想给final变量再次赋值的时候，报编译错误。

```java
public class VarDemo {

    public final Map<String, String> map = new HashMap<>();

    public static void main(String[] args) {
        VarDemo varDemo = new VarDemo();
        varDemo.map.put("10", "10");
        varDemo.map.put("20", "20");
        // {20=20, 10=10}
        System.out.println(varDemo.map);
    }
}
```
map虽然被final修饰了，里面的值还是可以改变的，因为对象类型的变量只能保证对象的引用不变，对象的内容是可以改变的

```java
public class VarDemo {

    public final Map<String, String> map = new HashMap<>();

    public static void main(String[] args) {
        VarDemo varDemo = new VarDemo();
        // 编译错误，提示
        // Cannot assign a value to final variable 'map'
        varDemo.map = new HashMap<>();
    }
}
```
如果想让map中的数据也不能变该怎么办呢？有很多三方的类库，如Google Guava

```java
// 不可变集合的创建
ImmutableList<String> list = ImmutableList.of("a", "b", "c");
ImmutableSet<String> set = ImmutableSet.of("a", "b");
```
不可变集合是线程安全的，并且中途不可改变，因为add等方法是被声明为过期，并且会抛出异常

```java
public final void add(int index, E element) {
    throw new UnsupportedOperationException();
}
```
还有需要注意的一点是**在Java中数组也是对象**，对象数组即使被final修饰，内容还是可以改变的

```java
public class ArrayDemo {

    public static void main(String[] args) {
        final int array[] = {1, 2, 3};
        for (int i = 0; i < array.length; i++) {
            array[i] += 10;
            // 11
            // 12
            // 13
            System.out.println(array[i]);
        }
    }
}
```
**final还可以修饰在方法的入参上，表示在方法内部不允许对参数进行修改**

```java
public class VarDemo {

    public static void invoke(final int a) {
        // 可以读，但不可以修改
        System.out.println(a);
        // 编译错误，提示
        // Cannot assign a value to final variable 'a'
        a = 100;
    }
}
```