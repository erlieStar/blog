---
layout: post
title: 各种类型Handler的执行
lock: need
---

# Spring MVC源码解析：各种类型Handler的执行
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021040317265481.jpg?)
## HandlerAdapter执行handler
在上一节文章我们提到，HandlerMapping和HandlerAdapter并不是一一对应的，所有当HandlerMapping找出handler时，我们要遍历所有的HandlerAdapter，看看当前的HandlerAdapter能执行handler不？能就执行，否则就尝试下一个
![在这里插入图片描述](https://img-blog.csdnimg.cn/3f185977712b495991100657d82cbc77.png?)
所以HandlerAdapter接口定义如下

```java
public interface HandlerAdapter {

	// 该适配器是否能支持指定处理器
	boolean supports(Object handler);

	// 执行处理逻辑，返回 ModelAndView
	@Nullable
	ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception;

	// 请求的目标资源最近一次的修改时间
	long getLastModified(HttpServletRequest request, Object handler);

}
```

DispatcherServlet有一个成员变量

```java
private List<HandlerAdapter> handlerAdapters;
```
当通过HandlerMapping找到Handler后，会依次调用handlerAdapters的supports方法，找到第一个返回true的HandlerAdapter，然后调用HandlerAdapter的handle方法，完成执行。

常用的HandlerAdapter如下

|类名| 作用 |
|--|--|
|HttpRequestHandlerAdapter  |执行实现了HttpRequestHandler接口的Handler  |
|SimpleControllerHandlerAdapter|执行实现了Controller接口的Handler|
|RequestMappingHandlerAdapter|执行Handler类型是HandlerMethod及其子类的Handler，RequestMappingHandlerMapping返回的Handler是HandlerMethod类型|

接着我们来看一下每种HandlerAdapter是如何执行handler的

## HttpRequestHandlerAdapter
![在这里插入图片描述](https://img-blog.csdnimg.cn/3ab321f343d2444d944470f1c2b7891b.png?)

强转为HttpRequestHandler然后调用handleRequest方法，最后返回null，当ModelAndView为null的时候，ViewResolver查找View，并且View进行渲染的过程会被省略

## SimpleControllerHandlerAdapter
![在这里插入图片描述](https://img-blog.csdnimg.cn/a1268b7c5ac94c818da81d06e3422620.png?)
直接强转然后调用handleRequest方法

## RequestMappingHandlerAdapter
可以看到HttpRequestHandlerAdapter和SimpleControllerHandlerAdapter的执行策略还是非常简单的，直接强转为对应的接口，然后调用接口的方法。

而RequestMappingHandlerAdapter的执行策略还是比较复杂的。RequestMappingHandlerAdapter自成体系，包含了大量组件对请求进行处理。

一些常用的组件如下
| 组件名 | 作用 |
|--|--|
| HandlerMethodArgumentResolver | 参数解析器 ，解析@RequestParam，@RequestBody对应的参数|
|  HandlerMethodReturnValueHandler| 返回值处理器，处理handler的返回值 |
| HttpMessageConverter | 消息转换器，用来进行报文和对象的转换|
| HandlerExceptionResolver | 异常解析器，统一处理handler执行时发生的异常 |
|ViewResolver|根据视图名字返回对应的视图对象|

![在这里插入图片描述](https://img-blog.csdnimg.cn/5c44598a584f475a8429b27569dc5185.png?)
RequestMappingHandlerAdapter的继承关系如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/baf91a1c215044f2a08569d034b04351.png?)
RequestMappingHandlerAdapter的handler函数在父类AbstractHandlerMethodAdapter中，定义如下

AbstractHandlerMethodAdapter#supports
![在这里插入图片描述](https://img-blog.csdnimg.cn/19d276533a03401ebc26f0e0fc6e83b0.png)
其中RequestMappingHandlerAdapter重写了supportsInternal方法，永远返回true，即RequestMappingHandlerAdapter支持Handler类型是HandlerMethod的Handler

而RequestMappingHandlerMapping返回的Handler类型就是HandlerMethod，因此可以知道@RequestMapping对应的HandlerMapping是RequestMappingHandlerMapping，对应的HandlerAdapter是RequestMappingHandlerAdapter

HandlerMethod的定义也很简单，封装了要执行方法所对应的类，方法，参数。这样直接就能通过反射来执行。

```java
public class HandlerMethod {

	// 封装的handler的类
	private final Object bean;

	// 封装的handler的方法
	private final Method bridgedMethod;

	// 封装方法的参数
	private final MethodParameter[] parameters;
	
}
```

```java
method.invoke(obj, args);
```


所以我们就重点看一下RequestMappingHandlerAdapter的执行过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/d9a70157d10745d08328f936341b396f.png?)
### 初始化组件
构造函数初始化了HttpMessageConverter，**HttpMessageConverter主要用来支持@RequestBody和@ResponseBody中Java对象的序列化和反序列化**
![在这里插入图片描述](https://img-blog.csdnimg.cn/ddaf1339362c4a9c8e7361e92bc0a4fa.png?)
RequestMappingHandlerAdapter实现了InitializingBean接口，并重写了afterPropertiesSet方法。即在Bean生命周期的初始化阶段，又设置了HandlerMethodArgumentResolver等
默认情况下argumentResolvers等都为空

RequestMappingHandlerAdapter#afterPropertiesSet
![在这里插入图片描述](https://img-blog.csdnimg.cn/f1c890bd92324d40b32fb2fc9c02bb33.png?)
**其中HandlerMethodArgumentResolverComposite和HandlerMethodReturnValueHandlerComposite都是典型的组合模式的实现**
![在这里插入图片描述](https://img-blog.csdnimg.cn/459141214bb24a42b2858d1366fc88da.png?)

添加默认实现的时候还会把用户自定义的实现也添加进去。我们可以通过实现WebMvcConfigurer#addArgumentResolvers方法，来添加用户自定义的实现。其他组件也都是类似的套路

initBinderArgumentResolvers是用来设置@InitBinder方法的参数，这个注解基本上不用，就不分析了

![在这里插入图片描述](https://img-blog.csdnimg.cn/326f0a00038648af99dd7d9540991e57.png?)
因为handler可以返回多种类型的返回值，例如加了@ResponseBody，ModelAndView，String等。针对不同类型的返回值需要调用不同的HandlerMethodReturnValueHandler
### 执行Handler并返回ModelAndView
AbstractHandlerMethodAdapter#handle
![在这里插入图片描述](https://img-blog.csdnimg.cn/d974cee5b06e4c3ab797aac0ee0dc496.png)
AbstractHandlerMethodAdapter#handle
RequestMappingHandlerAdapter#handleInternal
RequestMappingHandlerAdapter#invokeHandlerMethod

RequestMappingHandlerAdapter#invokeHandlerMethod（删除部分方法）
![在这里插入图片描述](https://img-blog.csdnimg.cn/a2350241acc64c7d8d704075f9c2f353.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/60d6ea781e2e4c79886e16bf638a122a.png?)
RequestMappingHandlerAdapter#getModelAndView
![在这里插入图片描述](https://img-blog.csdnimg.cn/ac66815d7e934ac8a4161537a988689a.png?)
当处理完返回值的时候，会调用RequestMappingHandlerAdapter#getModelAndView获取ModelAndView，如果mavContainer.isRequestHandled()=true，表明请求已经被处理好了，返回null，后续就不会进行视图渲染，当方法上加了@ResponseBody，mavContainer.isRequestHandled()=true

### 异常处理和视图解析
当handler执行发生异常时，需要交给HandlerExceptionResolver来处理，具体的处理策略我们单开一章来分享把。

DispatcherServlet#processDispatchResult
![在这里插入图片描述](https://img-blog.csdnimg.cn/8ef2e60b1d91464483cb9e158b8d7703.png?)
当返回的ModelAndView为null时，就不会进行视图解析的部分，因为要返回的报文在之前已经处理好了，比如当方法上加了@ResponseBody时，返回的ModelAndView就为null。
![在这里插入图片描述](https://img-blog.csdnimg.cn/922a0cafa31846099e352b13f7ce3a77.png?)
当返回的ModelAndView不为null时，如果视图名不为空，则先利用ViewResolver将视图名转为View对象，执行View#render给视图添加数据后，返回给用户页面


当返回的ModelAndView为null时，就不会进行视图解析的部分，因为要返回的报文在之前已经处理好了，比如当方法上加了@ResponseBody时，返回的ModelAndView就为null。
当返回的ModelAndView不为null时，如果视图名不为空，则先利用ViewResolver将视图名转为View对象，执行View#render给视图添加数据后，返回给用户页面

**因为在微服务项目中，早就实现了前后端分离，方法上都加了@ResponseBody注解，所有ViewResolver基本上不会用到，就不多做解析了**
