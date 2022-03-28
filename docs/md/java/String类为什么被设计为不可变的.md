---
layout: post
title: String类为什么被设计为不可变的？
lock: need
---

# 面试官：String类为什么被设计为不可变的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200620162725374.jpg?)

## 从哪看出来String类是不可变的？
```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    /** The value is used for character storage. */
    private final char value[];
}
```
String类的值是保存在value数组中的，并且是被**private final**修饰的
1. private修饰，表明外部的类是访问不到value的，同时子类也访问不到，当然String类不可能有子类，因为类被final修饰了
2. final修饰，表明value的引用是不会被改变的，而value只会在String的构造函数中被初始化，而且并没有其他方法可以修改value数组中的值，保证了value的引用和值都不会发生变化

final关键字的作用有如下几种

1. final修饰类时，表明这个类不能被继承
2. final修饰方法，表明方法不能被重写
3. final修饰变量，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能改变；如果是对象类型的变量，只能保证它的引用不变，但对象的内容是可以改变的

**在Java中数组也是对象**，数组即使被final修饰，内容还是可以改变的

所以我们说String类是不可变的。

而很多方法，如substring并不是在原来的String类上进行操作，而是生成了新的String类
```java
public String substring(int beginIndex) {
	if (beginIndex < 0) {
		throw new StringIndexOutOfBoundsException(beginIndex);
	}
	int subLen = value.length - beginIndex;
	if (subLen < 0) {
		throw new StringIndexOutOfBoundsException(subLen);
	}
	return (beginIndex == 0) ? this : new String(value, beginIndex, subLen);
}
```
## 为什么String被设置为不可变的？
### 字符串常量池
字符串常量池可以节省大量的内存空间。如果String类可变就不可能有字符串常量池

**字符串常量池放在哪？**

jdk1.7之前的不讨论，从jdk1.7开始，字符串常量池就开始放在堆中，然后本文的所有内容都是基于jdk1.8的

下面这个代码还是经常被问到的

```java
String str1 = "abc";
String str2 = "abc";
String str3 = new String("abc");
String str4 = new String("abc");
// true
System.out.println(str1 == str2);
// false
System.out.println(str1 == str3);
// false
System.out.println(str3 == str4);
```
内存中的结构如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200620154847402.png?)
**其中常量池中存的是引用**

解释一下上面代码的输出，Java中有2种创建字符串对象的方式

```java
String str1 = "abc";
String str2 = "abc";
// true
System.out.println(str1 == str2);
```
采用字面值的方式创建一个字符串时，JVM首先会去字符串池中查找是否存在"abc"这个对象的引用

如果不存在，则在堆中创建"abc"这个对象，并将其引用添加到字符串常量池（实际上是将引用放到哈希表中），随后将引用赋给str1

如果存在，则不创建任何对象，直接将池中"abc"对象的引用返回，赋给str2。因为str1、str2指向同一个对象，所以结果为true。

```java
String str3 = new String("abc");
String str4 = new String("abc");
// false
System.out.println(str3 == str4);
```
采用new关键字新建一个字符串对象时，JVM首先在字符串池中查找有没有"abc"这个字符串对象的引用

如果没有，则先在堆中创建一个"abc"字符串对象，并将引用添加到字符串常量池，随后将引用赋给str3

如果有，则不往池中放"abc"对象的引用，直接在堆中创建一个"abc"字符串对象，然后将引用赋给str4。这样，str4就指向了堆中创建的这个"abc"字符串对象；

因为str3和str4指向的是不同的字符串对象，结果为false。
## 缓存HashCode
String类在被创建的时候，hashcode就被缓存到hash成员变量中，因为String类是不可变的，所以hashcode是不会改变的。这样每次想使用hashcode的时候直接取就行了，而不用重新计算，提高了效率
```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {

    /** Cache the hash code for the string */
    private int hash; // Default to 0
	
}
```
## 可以用作HashMap的key
**由于String类不可变的特性，所以经常被用作HashMap的key**，如果String类是可变的，内容改变，hashCode也会改变，当根据这个key从HashMap中取的时候有可能取不到value，或者取到错的value
## 线程安全
不可变对象天生就是线程安全的，这样可以避免在多线程环境下对String做同步操作