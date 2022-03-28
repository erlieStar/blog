---
layout: post
title: Servlet Filter和Spring MVC Interceptor有哪些区别？
lock: need
---

# 30.面试官：Servlet Filter和Spring MVC Interceptor有哪些区别？

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020091218131664.jpg?)
## 介绍
做Web开发，我们经常要和Servlet Filter，Spring MVC Interceptor打交道，它们都能对请求进行拦截，那么它们有哪些区别呢？
## Servlet Filter
## Filter的使用
可能很多小伙伴没怎么用过Filter，我就简单演示一下

**1.在web.xml中配置2个Filter**

```xml
<filter-mapping>
    <filter-name>logFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
<filter-mapping>
    <filter-name>imageFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```
**2.实现如下，略去了init方法和destroy方法**
```java
@WebFilter(filterName = "logFilter")
public class LogFilter implements Filter {

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        System.out.println("LogFilter execute");
        chain.doFilter(request, response);
    }
}
```

```java
@WebFilter(filterName = "imageFilter")
public class ImageFilter implements Filter {

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        System.out.println("ImageFilter execute");
        chain.doFilter(request, response);
    }
}
```
**3.然后你访问任意一个servlet方法，LogFilter和ImageFilter的doFilter方法都会执行**

如果你在一个Filter方法后不加**chain.doFilter(request, response)**
则后续的Filter和Servlet都不会执行，这是为什么呢？看完我手写的Demo你一下就明白了

可以看到Filter可以在请求到达Servlet之前做处理，如

1. 请求编码
2. 敏感词过滤等

有兴趣的小伙伴可以看看相关的源码
## 手写Filter的实现
Servlet接口，任何一个web请求都会调用service方法
```java
public interface Servlet {
    public void service();
}
```

```java
public class MyServlet implements Servlet {
    @Override
    public void service() {
        System.out.println("MyServlet的service方法执行了");
    }
}
```

拦截器接口
```java
public interface Filter {
    public void doFilter(FilterChain chain);
}
```

```java
public class LogFilter implements Filter {
    @Override
    public void doFilter(FilterChain chain) {
        System.out.println("LogFilter执行了");
        chain.doFilter();
    }
}
```

```java
public class ImageFilter implements Filter {
    @Override
    public void doFilter(FilterChain chain) {
        System.out.println("ImageFilter执行了");
        chain.doFilter();
    }
}
```

拦截器链对象
```java
public interface FilterChain {
    public void doFilter();
}
```

```java
public class ApplicationFilterChain implements FilterChain {

    private Filter[] filters = new Filter[10];
    private Servlet servlet = null;

    // 总共的Filter数目
    private int n;

    // 当前执行完的filter数目
    private int pos;

    @Override
    public void doFilter() {
        if (pos < n) {
            Filter curFilter = filters[pos++];
            curFilter.doFilter(this);
            return;
        }
        servlet.service();
    }

    public void addFilter(Filter filter) {
        // 这里源码有动态扩容的过程，和ArrayList差不多
        // 我就不演示了，直接赋数组大小为10了
        filters[n++] = filter;
    }

    public void setServlet(Servlet servlet) {
        this.servlet = servlet;
    }
}
```
测试例子
```java
public class Main {

    public static void main(String[] args) {
        // 在tomcat源码中，会将一个请求封装为一个ApplicationFilterChain对象
        // 然后执行ApplicationFilterChain的doFilter方法
        ApplicationFilterChain applicationFilterChain = new ApplicationFilterChain();
        applicationFilterChain.addFilter(new LogFilter());
        applicationFilterChain.addFilter(new ImageFilter());
        applicationFilterChain.setServlet(new MyServlet());

        // LogFilter执行了
        // ImageFilter执行了
        // MyServlet的service方法执行了
        applicationFilterChain.doFilter();
    }
}
```
如果任意一个Filter方法的最后不加上chain.doFilter()，则后面的拦截器及Servlet都不会执行了。相信你看完ApplicationFilterChain类的doFilter方法一下就明白了，就是一个简单的递归调用
## Spring MVC Interceptor
## Interceptor的使用
以前写过一篇拦截器应用的文章，有想了解使用方式的小伙伴可以看一下

[用Spring MVC拦截器做好web应用的安保措施](https://blog.csdn.net/zzti_erlie/article/details/100051565?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522158666501719726869050684%2522%252C%2522scm%2522%253A%252220140713.130056874..%2522%257D&request_id=158666501719726869050684&biz_id=0&utm_source=distribute.pc_search_result.none-task-blog-blog_SOOPENSEARCH-1)

今天就来分析一下拦截器是怎么实现的？可以通过以下方式实现拦截器

1. 实现HandlerInterceptor接口
2. 继承HandlerInterceptorAdapter抽象类，按需重写部分实现即可，（HandlerInterceptorAdapter也实现了HandlerInterceptor接口）

总而言之拦截器必须必须实现了HandlerInterceptor接口

HandlerInterceptor有如下3个方法

boolean preHandler()：在controller执行之前调用
void postHandler()：controller执行之后，且页面渲染之前调用
void afterCompletion()：页面渲染之后调用，一般用于资源清理操作

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200412193302886.PNG?)
这个图应该很好的显示了一个请求可以被拦截的地方

1. Servlet Filter是对一个请求到达Servlet的过程进行拦截
2. 而HandlerInterceptor是当请求到达DispatcherServlet后，在Controller的方法执行前后进行拦截

## 手写Interceptor的实现
我来手写一个Demo，你一下就能明白了

拦截接口，为了方便我这里就只定义了一个方法
```java
public interface HandlerInterceptor {
    boolean preHandle();
}
```
定义如下2个拦截器
```java
public class CostInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle() {
        // 这里可以针对传入的参数做一系列事情，我这里就简单返回true了;
        System.out.println("CostInterceptor 执行了");
        return true;
    }
}
```

```java
public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle() {
        System.out.println("LoginInterceptor 执行了");
        return true;
    }
}
```
存放拦截器的容器
```java
public class HandlerExecutionChain {

    private List<HandlerInterceptor> interceptorList = new ArrayList<>();

    public void addInterceptor(HandlerInterceptor interceptor) {
        interceptorList.add(interceptor);
    }

    public boolean applyPreHandle() {
        for (int i = 0; i < interceptorList.size(); i++) {
            HandlerInterceptor interceptor = interceptorList.get(i);
            if (!interceptor.preHandle()) {
                return false;
            }
        }
        return true;
    }
}
```
演示DispatcherServlet的调用过程
```java
public class Main {

    public static void main(String[] args) {
        // Spring MVC会根据请求返回一个HandlerExecutionChain对象
        // 然后执行HandlerExecutionChain的applyPreHandle方法，controller中的方法
        HandlerExecutionChain chain = new HandlerExecutionChain();
        chain.addInterceptor(new CostInterceptor());
        chain.addInterceptor(new LoginInterceptor());

        // 只有拦截器都返回true，才会调用controller的方法
        // CostInterceptor 执行了
        // LoginInterceptor 执行了
        if (!chain.applyPreHandle()) {
            return;
        }
        result();
    }

    public static void result() {
        System.out.println("这是controller的方法");
    }
}
```

**如果任意一个Interceptor返回false，则后续的Interceptor和Controller中的方法都不会执行**原因在Demo中显而易见

当想对请求增加新的过滤逻辑时，只需要定义一个拦截器即可，完全符合开闭原则。

不知道你意识到没有**Servlet Filter和Spring MVC Interceptor都是用责任链模式实现的**

来看看DispatcherServlet是怎么做的？和我们上面写的demo一模一样

我们用servlet写web应用时，一个请求地址写一个Servlet类。
而用了spring mvc后，整个应用程序只有一个Servlet即DispatcherServlet，所有的请求都发送到DispatcherServlet，然后通过方法调用的方式执行controller的方法

DispatcherServlet的doDispatch方法源码如下，省略了一部分逻辑（所有的请求都会执行这个方法）
```java
protected void doDispatch() {

	// 执行所有HandlerInterceptor的preHandle方法
	if (!mappedHandler.applyPreHandle(processedRequest, response)) {
		return;
	}

	// 执行controller中的方法
	mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

	// 执行所有HandlerInterceptor的postHandle方法
	mappedHandler.applyPostHandle(processedRequest, response, mv);
}
```

Interceptor可以有如下用处

1. 记录接口响应时间
2. 判断用户是否登陆
3. 权限校验等

## 总结
1. Servlet Filter和Spring MVC Interceptor都能对请求进行拦截，只不过时机不同，Servlet Filter在请求到达Servlet之前拦截，Spring MVC Interceptor在请求到达DispatcherServlet之后拦截
2. Servlet Filter是Servlet的规范，而Spring MVC Interceptor只能在Spring MVC中使用