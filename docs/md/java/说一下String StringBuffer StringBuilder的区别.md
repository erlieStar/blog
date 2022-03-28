---
layout: post
title: 说一下String StringBuffer StringBuilder的区别
lock: need
---

# 面试官：说一下String StringBuffer StringBuilder的区别

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200901225114694.png?)
## 介绍
先来看String类的实现

```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    /** The value is used for character storage. */
    private final char value[];
}
```
先来说一下final关键字的作用

1. final修饰类时，表明这个类不能被继承
2. final修饰方法，表明方法不能被重写
3. final修饰变量，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能改变；如果是对象类型的变量，只能保证它的引用不变，但对象的内容是可以改变的

可以看到String类和保存变量的value数组都被final修饰，表明String类是不可变的。
StringBuffer和StringBuilder都继承自AbstractStringBuilder类，看一下AbstractStringBuilder类的定义

```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
    /**
     * The value is used for character storage.
     */
    char[] value;
}
```
看到区别了吗？value数组没有用private和final修饰，说明了StringBuffer和StringBuilder是可变的。

而StringBuilder和StringBuffer的方法是差不多的，只不过StringBuffer在方法上添加了
synchronized关键字，所以在多线程环境下我们要用StringBuffer来保证线程安全，单线程环境下用StringBuilder来获得更高的效率。

看2个类中同一个方法的定义

```java
// StringBuffer

@Override
public synchronized StringBuffer append(char[] str) {
	toStringCache = null;
	super.append(str);
	return this;
}
```

```java
// StringBuilder 

@Override
public StringBuilder append(char[] str) {
	super.append(str);
	return this;
}
```
因为StringBuffer和StringBuilder的实现类似，所以性能比较就落在String和StringBuilder之间了。

1. String是不可变对象，每次操作都会生成新的String对象，然后将指针指向新的对象。
2. 抽象类AbstractStringBuilder内部提供了一个自动扩容机制，当发现长度不够的时候，会自动进行扩容工作（具体扩容可以看源码，很容易理解），会创建一个新的数组，并将原来数组的数据复制到新数组，不会创建新对象，拼接字符串的效率高。

用源码证实一下

```java
// String

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

```java
// StringBuilder

@Override
public StringBuilder append(String str) {
	super.append(str);
	return this;
}
```
介绍完毕，所以你应该知道这道题应该怎么答了
## 常见面试题
1.说一下String StringBuffer StringBuilder的区别？
1. 都是final类，不允许被继承
2. String长度是不可变的，StringBuffer，StringBuilder长度是可变的
3. StringBuffer是线程安全的，StringBuilder不是线程安全的。但它们方法实现类似，StringBuffer在方法之上添加了synchronized修饰，保证线程安全
4. StringBuilder比StringBuffer拥有更好的性能
5. 如果一个String类型的字符串，在编译时可以确定是一个字符串常量，则编译完成之后，字符串会自动拼接成一个常量，此时String的速度比StringBuffer和StringBuilder的性能好的多

我用例子解释一下第五条

```java
public static void main(String[] args) {
    String a = "a";
    String b = "b";
    String c = a + b;
    String d = "a" + "b" + "c";
}
```
反编译class文件后是这样的

```java
public static void main(String[] args) {
	String a = "a";
	String b = "b";
	(new StringBuilder()).append(a).append(b).toString();
	String d = "abc";
}
```
看string d，理解了吗？

同时看string c的拼接过程，先生成一个StringBuilder对象，再调用2次append方法，最后再返回一个String对象，知道String比StringBuilder慢的原因了吧