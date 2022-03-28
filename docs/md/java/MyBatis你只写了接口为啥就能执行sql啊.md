---
layout: post
title: MyBatis你只写了接口为啥就能执行sql啊
lock: need
---

# 面试官：MyBatis你只写了接口为啥就能执行sql啊

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200902214646363.jpg?)

**因为mybatis利用动态代理帮我们生成了接口的实现类，这个类就是org.apache.ibatis.binding.MapperProxy**
## 静态代理
又是一年毕业季，很多小伙伴开始去大城市打拼。来大城市第一件事就是租房，免不了和中介打交道，因为很多房东很忙，你根本找不到他。从这个场景中就可以抽象出来代理模式

ISubject:被访问者资源的抽象
SubjectImpl:被访问者具体实现类（房东）
SubjectProxy:被访问者的代理实现类（中介）

UML图如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190706201222733.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

举个例子来理解一下这个设计模式
老板让记录一下用户服务的响应时间，用代理模式来实现这个功能。

```java
public interface IUserService {
    public void request();
}
```

```java
public class UserServiceImpl implements IUserService {
    @Override
    public void request() {
        System.out.println("this is userService");
    }
}
```

```java
public class UserServiceProxy implements IUserService {

    private IUserService userService;

    public UserServiceProxy(IUserService userService) {
        this.userService = userService;
    }

    @Override
    public void request() {
        long startTime = System.currentTimeMillis();
        userService.request();
        System.out.println("reques cost :" + (System.currentTimeMillis() - startTime));
    }

    public static void main(String[] args) {
        IUserService userService = new UserServiceImpl();
        UserServiceProxy userServiceProxy = new UserServiceProxy(userService);
        // this is userService
        // reques cost :0
        userServiceProxy.request();
    }
}
```
一切看起来都非常的美好，老板又发话了，把产品服务的响应时间也记录一下吧。又得写如下3个类

```java
IProductService 
ProductServiceImpl 
ProductServiceProxy 
```

UserServiceProxy和ProductServiceProxy这两个代理类的逻辑都差不多，却还得写2次。其实这个还好，如果老板说，把现有系统的几十个服务的响应时间都记录一下吧，你是不是要疯了？这得写多少代理类啊？
## 动态代理 
>黑暗总是暂时的，终究会迎来黎明，在JDK1.3之后引入了一种称之为动态代理（Dynamic Proxy）的机制。使用该机制，我们可以为指定的接口在系统运行期间动态地生成代理对象，从而帮助我们走出最初使用静态代理实现AOP的窘境

动态代理的实现主要由一个类和一个接口组成，即java.lang.reflect.Proxy类和java.lang.reflect.InvocationHandler接口。

让我们用动态代理来改造一下上面记录系统响应时间的功能。虽然要为IUserService和IProductService两种服务提供代理对象，但因为代理对象中要添加的横切逻辑是一样的。所以我们只需要实现一个InvocationHandler就可以了。代码如下

```java
public class RequestCostInvocationHandler implements InvocationHandler {

    private Object target;

    public RequestCostInvocationHandler(Object target) {
        this.target = target;
    }

	/** 被代理对象的任何方法被执行时，都会先进入这个方法 */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if (method.getName().equals("request")) {
            long startTime = System.currentTimeMillis();
            // 执行目标对象的方法
            method.invoke(target, args);
            System.out.println("reques cost :" + (System.currentTimeMillis() - startTime));
        }
        return null;
    }

    public static void main(String[] args) {

        // 3个参数解释如下
        // classloader,生成代理类
        // 代理类应该实现的接口
        // 实现InvocationHandler的切面类
        IUserService userService = (IUserService) Proxy.newProxyInstance(IUserService.class.getClassLoader(),
                new Class[]{IUserService.class}, new RequestCostInvocationHandler(new UserServiceImpl()));

        IProductService productService = (IProductService) Proxy.newProxyInstance(IProductService.class.getClassLoader(),
                new Class[]{IProductService.class}, new RequestCostInvocationHandler(new ProductServiceImpl()));

        // this is userService
        // reques cost :0
        userService.request();

        // this is productService
        // reques cost :0
        productService.request();
    }

}
```
UML图如下。恭喜你，你现在已经理解了Spring AOP是怎么回事了，就是这么简单，今天先不展开谈Spring

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190706210922904.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

先简单谈谈动态代理在Mybatis中是如何被大佬玩的出神入化的
## Mybatis核心设计思路
相信用过mybatis的小伙伴都能理解下面这段代码，通过roleMapper这个接口直接从数据库中拿到一个对象

```shell
Role role = roleMapper.getRole(3L);
```
直觉告诉我，一个接口是不能运行的啊，一定有接口的实现类，可是这个实现类我自己没写啊，难道mybatis帮我们生成了？你猜的没错，mybatis利用动态代理帮我们生成了接口的实现类，这个类就是org.apache.ibatis.binding.MapperProxy，我先画一下UML图，MapperProxy就是下图中的SubjectProxy类

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190706212003490.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

和上面的UML类图对比一下，发现不就少了一个SubjectImpl类吗？那应该就是SubjectProxy类把SubjectImple类要做的事情做了呗，猜对了。SubjectProxy通过SubjectImple和SubjectImple.xml之间的映射关系知道自己应该执行什么SQL。所以mybatis最核心的思路就是这么个意思，细节之类的可以看源码，理清最主要的思路，看源码就能把握住重点。

## Mybatis插件原理
mybatis的插件也用到了动态代理，还用到了责任链模式，我就不从源码角度分析了。说一下大概实现，我们用插件肯定是为了在原先的基础上增加新功能。增加一个插件，mybatis就在原先类的基础上用动态代理生成一个代理对象，如果有多个插件，就在代理对象的基础上再生成代理对象，形式和如下函数差不多

```java
plugin2( plugin1( start() ) )
```

我再给你写个例子，你再看看相关的源码分析文章（也许我以后会写），很快就能理解了。

在mybatis中要想用插件，有如下2个步骤
1.在mybatis-config.xml中配置插件，如下所示

```xml
<plugins>
	<plugin interceptor="org.xrq.mybatis.plugin.FirstInterceptor" />
	<plugin interceptor="org.xrq.mybatis.plugin.SecondInterceptor" />
</plugins>
```
2.插件类还得实现Interceptor接口

我现在给一个需求，一个应用返回字符串0，我加一个插件在字符串的左右两边加plugin1，再加一个插件在字符串的左右两边加plugin2，开写

返回字符串的接口
```java
public interface IGetStr {
    public String getStrZero();
    public String getStrOne();
}
```
返回字符串的实现类
```java
public class GetStrImpl implements IGetStr {

    @Override
    public String getStrZero() {
        return "0";
    }

    @Override
    public String getStrOne() {
        return "1";
    }
}
```
定义拦截器接口

```java
public interface Interceptor {

    /** 执行拦截逻辑的方法 */
    Object intercept(Invocation invocation);

    /**
     * target是被拦截的对象，它的作用是给被拦截对象生成一个代理对象，并返回它。
     * 为了方便，可以直接使用Mybatis中org.apache.ibatis.plugin类的wrap方法（是静态方法）生成代理对象
     * 我这里也写了一个Plugin方法
     */
    Object plugin(Object target);
}
```
看到一个不认识的类Invocation，定义如下
```java
public class Invocation {

    private final Object target;
    private final Method method;
    private final Object[] args;

    public Invocation(Object target, Method method, Object[] args) {
        this.target = target;
        this.method = method;
        this.args = args;
    }

    public Object proceed() throws InvocationTargetException, IllegalAccessException {
        return method.invoke(target, args);
    }
}
```
就是简单的封装了一下目标对象，目标方法和目标方法的参数。proceed方法就是执行目标对象的目标方法

Plugin算是一个工具类，生成代理对象
```java
public class Plugin implements InvocationHandler {

    /** 目标对象 */
    private final Object target;
    /** Interceptor对象 */
    private final Interceptor interceptor;

    public Plugin(Object target, Interceptor interceptor) {
        this.target = target;
        this.interceptor = interceptor;
    }

	/** 生成代理对象 */
    public static Object wrap(Object target, Interceptor interceptor) {
        return Proxy.newProxyInstance(target.getClass().getClassLoader(),
                new Class[]{IGetStr.class},
                new Plugin(target, interceptor));
    }

	/** 被代理对象的方法执行时，这个方法会被执行 */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    	// 只为方法getStrZero生成代理对象
        if (method.getName().equals("getStrZero")) {
            return interceptor.intercept(new Invocation(target, method, args));
        }
        return method.invoke(target, args);
    }
}
```
写第一个插件

```java
public class FirstInterceptor implements Interceptor {


    /** 执行拦截逻辑的方法 */
    @Override
    public Object intercept(Invocation invocation) {
        try {
            return "plugin1 " + invocation.proceed() + " plugin1";
        } catch (Exception e) {
            return null;
        }
    }

    /** 为原先的类生成代理对象 */
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```
有2个方法

plugin是为插件生成代理对象，用了我自己写的Plugin工具类
intercept是增加拦截逻辑，invocation.proceed()是执行目标对象的目标方法，前文说过了哈，这里我们只对输出做了改变

第二个插件和第一个插件类似

```java
public class SecondInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) {
        try {
            return "plugin2 " + invocation.proceed() + " plugin2";
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```
用一个容器保存插件，这里用到了责任链模式
```java
public class InterceptorChain {

    /** 放拦截器 */
    private final List<Interceptor> interceptors = new ArrayList<Interceptor>();

    public Object pluginAll(Object target) {
        for (Interceptor interceptor : interceptors) {
            target = interceptor.plugin(target);
        }
        return target;
    }

    public void addInterceptor(Interceptor interceptor) {
        interceptors.add(interceptor);
    }
}
```
pluginAll方法是精髓，为每个插件一层一层的生成代理对象，就像套娃娃一样。

验证一下

```java
public class Main {

    public static void main(String[] args) {

        // 配置插件
        InterceptorChain interceptorChain = new InterceptorChain();
        interceptorChain.addInterceptor(new FirstInterceptor());
        interceptorChain.addInterceptor(new SecondInterceptor());

        // 获得代理对象
        IGetStr getStr = new GetStrImpl();
        getStr = (IGetStr) interceptorChain.pluginAll(getStr);

        String result = getStr.getStrZero();
        // plugin2 plugin1 0 plugin1 plugin2
        System.out.println(result);

        result = getStr.getStrOne();
        // 1
        System.out.println(result);
    }
}
```
大功告成，可以看到先定义的插件先执行。

类有点多，如果看的有点晕，多看几次，你就很容易理解了，我这里还是精简了很多。

一个InvocationHandler接口被大佬玩出了新境界，果然编程这件事还得靠想象力