---
layout: post
title: 各种类型Handler的注册和查找
lock: need
---

# Spring MVC源码解析：各种类型Handler的注册和查找
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020051722281216.jpg?)
## 为什么要有HandlerMapping和HandlerAdapter这2个组件？
在学习Spring MVC的时候，我们会经常看到如下的流程图。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200425215924315.png?)
其中有2个非常重要的组件，HandlerMapping和HandlerAdapter

**HandlerMapping是根据请求的url找到对应的handler
HandlerAdapter则是根据找到的handler执行对应的方法，然后返回ModelAndView**

我当时看到这2个类的时候就觉得这2个类是不是叫ControllerMapping和ControllerAdapter更合适一点，毕竟我们的所有逻辑都是写在Controller上的。

直到我后来入职了一家公司，所有的web请求类上即没有@Controller，方法上也没有@RequestMapping。然后看了一波文档，原来映射规则是这样做的，有如下一个处理web请求的类

```java
@View
public class UserApi {
	
	public String index() {
		return "index";
	}
	
	public String test() {
		return "test";
	}
}
```
用@View注解来表明这是一个处理web请求的类
当访问http://userApi/index.json的时候调用的是UserApi类的index方法
当访问http://userApi/test.json的时候调用的是UserApi类的test方法

即映射规则是类名+方法名+.json，姿势确实够骚。

**此时我才突然明白为什么要叫HandlerMapping和HandlerAdapter了，并不是所有的web请求类都是用@Controller和@RequestMapping实现的，所以叫HandlerMapping和HandlerAdapter显然更合适**

先来分析一下Spring MVC原生的映射规则是怎么做到的，搞懂了Spring MVC原生的映射规则，再骚的映射规则照样能看懂。

**Spring MVC将Handler的查找和执行分开了**，你觉得哪个不好用，就把它替换一下

![在这里插入图片描述](https://img-blog.csdnimg.cn/e4a47e5dd27e4327a1592e45c8aeb4d0.png?)
## Handler的三种实现方式
**在Spring MVC中，Handler常见的实现方式有三种**，虽然一般我们只用@RequestMapping注解

**实现Controller接口**

```java
@Component("/index")
public class IndexController implements Controller {

	@Override
	public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) throws Exception {
		response.getWriter().write("IndexController");
		return null;
	}
}
```
访问http://localhost:8080/index，页面输出IndexController，这里需要说明的有2点

1. 当Handler放回的ModelAndView为null时，后续ViewResolver查找View，View进行渲染的过程会被省略
2. @Component注解的value值必须以/开头，后续会说原因

**实现HttpRequestHandler接口**

```java
@Component("/address")
public class AddressController implements HttpRequestHandler {
	@Override
	public void handleRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.getWriter().write("AddressController");
	}
}
```
访问http://localhost:8080/address，页面输出AddressController

**使用@RequestMapping注解**

这种方式大家应该很熟悉了，就不再介绍了

## HandlerMapping
HandlerMapping接口定义如下
```java
public interface HandlerMapping {

	// 根据请求获取HandlerExecutionChain
	@Nullable
	HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception;

}
```
HandlerExecutionChain的定义也很简单，是对Handler和这个Handler执行前后要执行的拦截器的封装

```java
public class HandlerExecutionChain {

	private final Object handler;
	
	@Nullable
	private List<HandlerInterceptor> interceptorList;

}
```
DispatcherServlet有一个成员变量

```java
private List<HandlerMapping> handlerMappings;
```
当通过请求找Handler时，会依次调用handlerMappings的handler方法，找到第一个不为null的handler则返回，继续后面的流程，如果遍历完handlerMappings，handler还为null，则报404的错误。

Spring MVC有三种映射策略

|映射策略| 实现类 |
|--|--|
| 简单url映射 | SimpleUrlHandlerMapping|
|BeanName映射|BeanNameUrlHandlerMapping|
|@RequestMapping映射 |RequestMappingHandlerMapping|


各自的实现我就不放源码了，说一下主要思路，思路理解了，追着看源码就很容易理解了

在开始分析源码之前我们需要明确，handler的映射关系是存在哪的？

![请添加图片描述](https://img-blog.csdnimg.cn/ac6dd28315094a1789be061b7bf85bbe.png?)
**实现Controller接口和实现HttpRequestHandler接口方式的Handler会把映射关系存在AbstractUrlHandlerMapping中**

**使用@RequestMapping注解的Handler会把映射关系存在AbstractHandlerMethodMapping中**

### BeanNameUrlHandlerMapping

上面演示Handler的三种写法的时候已经演示了BeanNameUrlHandlerMapping的作用了@Componet注解的值和请求的url相同，这种映射关系还挺简单的哈，当然支持统配符哈

**注册**

在Spring启动过程中，会拿到所有以/开头的BeanName，并注册到AbstractUrlHandlerMapping类的成员变量handlerMap 中，注册的时候key重复会报异常

```java
// AbstractUrlHandlerMapping
Map<String, Object> handlerMap = new LinkedHashMap<>();
```
其中key为@Component的value值，value为@Component修饰的类

**查找**

查找的时候分为如下几步，因为要考虑统配符的存在，所以不可能是简单的get

1. 先直接从handlerMap中，如果不为空则直接返回
2. 遍历handlerMap，调用AntPathMatcher的匹配方法，看请求的路径和注册的路径是否有匹配的。如果有多个匹配，则对匹配的路径进行排序。选出最优的，返回对应的Handler
3. 如果还是没有找到，则返回null

这个查找的逻辑我举个例子

```java
@Test
public void test1() {
	AntPathMatcher pathMatcher = new AntPathMatcher();
	Assert.assertTrue(pathMatcher.match("index/user", "index/user"));
	Assert.assertTrue(pathMatcher.match("index/**", "index/product/a"));
	Assert.assertTrue(pathMatcher.match("index/**/a", "index/product/a"));
}
```
如果有如下3个handler

```java
@Component("/index/user")
public class AController implements Controller
@Component("/index/**")
public class BController implements Controller
@Component("/index/**/a")
public class CController implements Controller
```
则初始化完后handlerMap为

```java
"/index/user" -> AController
"/index/**" -> BController 
"/index/**/a" -> CController 
```
当访问/index/user，能直接从map中取出AController然后返回

当访问index/product/a，直接从map中拿不到，就开始遍历key做路径匹配，结果发现有2个路径index\/\*\*和/index\/**a匹配

因为有2个路径符合，所以排序，排序后得到的最优路径为index\/**/a，取出CController，然后执行
### SimpleUrlHandlerMapping
这个其实和BeanNameUrlHandlerMapping差不多，只是需要设置Handler对应的路径，而不是把BeanName作为路径

还是以上面的IndexController和AddressController为例，不用@Component指定BeanName，则默认为类名，首字母小写

```java
@Component
public class IndexController implements Controller
@Component
public class AddressController implements HttpRequestHandler
```

增加如下配置类

```java
@Configuration
public class HandlerMappingConfig {

	@Autowired
	private AddressController addressController;

	@Bean
	public SimpleUrlHandlerMapping simpleUrlHandlerMapping() {
		SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
		Map<String, Object> urlMap = new HashMap<>();
		urlMap.put("/indexV2", "indexController");
		urlMap.put("/addressV2", addressController);
		mapping.setUrlMap(urlMap);
		return mapping;
	}
}
```
访问http://localhost:8080/indexV2，输出IndexController 
访问http://localhost:8080/addressV2，输出AddressController 

**注册**

注册的逻辑和BeanNameUrlHandlerMapping相似，也是将映射关系存在AbstractUrlHandlerMapping类的成员变量handlerMap 中

```java
// AbstractUrlHandlerMapping
Map<String, Object> handlerMap = new LinkedHashMap<>();
```
key为SimpleUrlHandlerMapping的urlMap中指定的路径，value为urlMap中指定的Handler，当然如果urlMap中指定的Handler为一个String，则会从容器中找到相应的实现类注册进去

**查找**

查找的逻辑和BeanNameUrlHandlerMapping的逻辑一样，因为2个类的映射关系都存在
AbstractUrlHandlerMapping中，并且各自没有重新查找的逻辑

### RequestMappingHandlerMapping

@RequestMapping的对应的RequestMappingHandlerMapping和RequestMappingHandlerAdapter应该是Spring MVC中最复杂的部分了。因为RequestMappingHandlerMapping和RequestMappingHandlerAdapter各成体系，包含了大量组件来协同工作，单开一篇来分享把。这篇就只分享映射关系的注册，查找过程

**注册**

之前的映射关系，是直接存在Map中，而RequestMappingHandlerMapping的映射关系是存在AbstractHandlerMethodMapping的内部类MappingRegistry的成员变量中的

```java
class MappingRegistry {

	// 从RequestMappingInfoHandlerMapping类上可以看到T为RequestMappingInfo
	// RequestMappingInfo -> HandlerMethod
	private final Map<T, HandlerMethod> mappingLookup = new LinkedHashMap<>();

	// 不包含通配符的url -> List<RequestMappingInfo>
	// 这里为什么是一个List呢？因为一个url有可能对应多个方法
	// 即这些方法的@RequestMapping注解path属性一样，但是其他属性不一样
	private final MultiValueMap<String, T> urlLookup = new LinkedMultiValueMap<>();
}
```
我只放2个分析用到的属性，其余的属性就不分析了

1. spring容器在启动的时候，会拿到所有的bean，判断这个bean上是否有Controller或者RequestMapping注解，如果有则执行后面的步骤
2. 解析类上的@RequestMapping注解，将其信息封装为RequestMappingInfo
3. 将RequestMappingInfo及其对应的HandlerMethod注册到mappingLookup中
4. 如果@RequestMapping指定的url没有通配符，则将url -> RequestMappingInfo注册到urlLookup中

举个例子，假如有如下一个Controller

```java
@RestController
@RequestMapping("manage")
public class ProductController {

	@RequestMapping("product/*")
	public String index() {
		return "product";
	}

	@RequestMapping(value = "user", method = {RequestMethod.GET})
	public String userByGet() {
		return "userByGet";
	}

	@RequestMapping(value = "user", method = {RequestMethod.POST})
	public String userByPost() {
		return "userByPost";
	}
}
```
初始化完成后2个Map的值为
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200517194235286.PNG?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200517194251398.png)

**查找**

查找的过程还是和上面提到的2个Map有关

**urlLookup**
key=不包含通配符的url
value=List\<RequestMappingInfo>

**mappingLookup**
key=RequestMappingInfo
value=HandlerMethod

1. 先根据url从urlLookup中查找对应的RequestMappingInfo，如果找到的List<RequestMappingInfo>不为空，则判断其他匹配条件是否符合
2. 如果其他条件也有符合的（params，headers等），则不再遍历所有的RequestMappingInfo，否则遍历所有的RequestMappingInfo，因为考虑到有通配符形式的url所以必须遍历所有的RequestMappingInfo才能找出来符合条件的
3. 如果最终找到的RequestMappingInfo有多个，则按照特定的规则找出一个最匹配的，再从mappingLookup返回其对应的HandlerMethod

可能有小伙伴有很多疑惑，为什么一个不含通配符的url会有多个handler。
因为用@RequestMapping标记后，请求时不只要路径匹配就可以，还有很多其他条件。
上面不就演示了一个因为方法不同，导致了一个url会有多个handler吗？

如果找到多个符合条件的Handler，返回最优Handler的过程也比较麻烦，不再像之前的SimpleUrlHandlerMapping只考虑路径就可以了，还要考虑其他的条件，比较复杂，就不再分析了

**总之注册和查找的过程主要和这2个map打交道，总体来说也不复杂**

## 总结
**Spring MVC为什么要搞这么多HandlerMapping和HandlerAdapter呢？**

主要还是为了适应不同的场景，静态资源的请求用SimpleUrlHandlerMapping是不是特别方便，逻辑清晰还容易调试。而RequestMappingHandlerMapping则比较适合写业务，因为能适应复杂多变的场景

**最开始提到的映射规则如何实现？**

其实很简单，写一个HandlerMapping的实现类，返回HandlerMethod，这样只改变了查找过程，后续执行的过程没有改变，因此各种参数注解@RequestParam，@RequestBody，@PathVariable等都可以使用
