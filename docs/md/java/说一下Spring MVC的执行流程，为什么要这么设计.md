---
layout: post
title: 说一下Spring MVC的执行流程，为什么要这么设计？
lock: need
---


# 面试官：说一下Spring MVC的执行流程，为什么要这么设计？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011164055432.jpg?)
## 手写一个Spring MVC
我们先手写一个Spring MVC，让你对Spring MVC的整体实现有一个基本的认识

github代码：https://github.com/erlieStar/servlet-learning
v3分支

用的是servlet 3.0所以就不用web.xml了，全程注解

## 定义注解

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Controller {
    String value() default "";
}
```

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequestMapping {
    String value() default "";
}
```

### 定义中央控制器
基本上所有的逻辑都在这个类中，主要流程如下

1. 创建DispatcherServlet的时候，tomcat会调用init()方法，在里面初始化url和对应的处理方法的映射关系
2. 当有请求来的时候，从uriInvokeInfoMap中拿对应的方法，如果有对应的方法，反射调用方法，拿到页面名字，拼接页面地址，转发到相应的页面，否则返回404

```java
@WebServlet(urlPatterns="/", loadOnStartup = 1)
public class DispatcherServlet extends HttpServlet {

    // 保存所有的handler
    private List<Object> beanList = new ArrayList<>();
    // 保存 uri 和 handler 的映射关系
    private Map<String, HandlerMethod> uriHandlerMethodMap = new HashMap<>();

    private static final String SLASH = "/";

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String uri = req.getRequestURI();
        String contextPath = req.getContextPath();
        // 去掉项目路径
        uri = uri.replace(contextPath, "");
        System.out.println(uri);
        if (uri == null) {
            return;
        }
        HandlerMethod handlerMethod = uriHandlerMethodMap.get(uri);
        if (handlerMethod == null) {
            resp.getWriter().write("404");
            return;
        }
        String pageName = (String)methodInvoke(handlerMethod.getBean(), handlerMethod.getMethod());
        viewResolver(pageName, req, resp);
    }

    // 视图解析器
    public void viewResolver(String pageName, HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String prefix = "/";
        String suffix = ".jsp";
        req.getRequestDispatcher(prefix + pageName + suffix).forward(req, resp);
    }

    // 反射执行方法
    private Object methodInvoke(Object object, Method method) {
        try {
            return method.invoke(object);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public void init() throws ServletException {
        // 获取指定包下的Class对象
        List<Class<?>> classList = ClassUtil.getAllClassByPackageName("com.javashitang.controller");
        // 找到所有标注了@Controller的类
        findAllConrollerClass(classList);
        // 初始化 uri 和 handler 的映射关系
        handlerMapping();
    }


    public void findAllConrollerClass(List<Class<?>> list) {
        list.forEach(bean -> {
            // 将被@Controller注解修饰的类放到beanList
            if (bean.isAnnotationPresent(Controller.class)) {
                try {
                    beanList.add(bean.newInstance());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    // 根据url找到相应的处理类
    public void handlerMapping() {
        for (Object bean : beanList) {
            Class<? extends Object> classInfo = bean.getClass();
            // 获取类上的@RequestMapping信息
            RequestMapping beanRequestMapping = classInfo.getDeclaredAnnotation(RequestMapping.class);
            String baseUrl = beanRequestMapping != null ? beanRequestMapping.value() : "";
            Method[] methods = classInfo.getDeclaredMethods();
            for (Method method : methods) {
                System.out.println(method.getName());
                // 获取方法上的@RequestMapping信息
                RequestMapping methodRequestMapping = method.getDeclaredAnnotation(RequestMapping.class);
                if (methodRequestMapping != null) {
                    String requestUrl = SLASH + baseUrl + SLASH + methodRequestMapping.value();
                    // 为了处理@Controller和@RequestMapping value 中加了 / 前缀的情况
                    requestUrl = requestUrl.replaceAll("/+", "/");
                    HandlerMethod handlerMethod = new HandlerMethod(bean, method);
                    uriHandlerMethodMap.put(requestUrl, handlerMethod);
                }
            }
        }
    }
}
```
将方法及其对应的类做了一下封装

```java
public class HandlerMethod {

    private Object bean;
    private Method method;

    public HandlerMethod(Object bean, Method method) {
        this.bean = bean;
        this.method = method;
    }
}
```
## 开始测试

```java
@Controller
@RequestMapping("index")
public class IndexController {

    @RequestMapping("user")
    public String user() {
        return "user";
    }
}
```
访问如下连接，页面正常显示
```shell
http://localhost:8080/show/index/user
```

如果你看过Spring MVC的源码，本质上也是存取map的过程

1. 启动的时候，将url和其对应的方法存到map中
2. 有请求的时候，根据url从map中找到对应的方法，执行方法返回结果

## Spring MVC执行流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200317133227811.jpg?)
上图展示了一个Spring MVC的执行流程

1. 用户发送请求到DispatcherServlet
2. DispatcherServlet从HandlerMapping中找到对应的handler
3. DispatcherServlet找到能执行handler的HandlerAdapter
4. HandlerAdapter执行Handler，并将Handler返回的ModelAndView返回给DispatcherServlet
5. DispatcherServlet将ModelAndView转交给ViewResolver
6. ViewResolver返回对应的View对象
7. DispatcherServlet根据View对象进行视图渲染（将模型数据填充到视图中）
8. DispatcherServlet将View响应给用户

## DispatcherServlet

DispatcherServlet继承关系如下图，HttpServlet类及其父类定义在javax包中，其余是定义在Spring包中
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011172928771.png?)
**可以看到DispatcherServlet本质上是一个HttpServlet**。

想想我们之前不用Spring MVC如何写一个web程序？
1. 写一个类继承HttpServlet，重写doGet或者doPost方法
2. 用@WebServlet注解定义请求的路径

可以看到以前是针对一个请求创建一个HttpServlet，现在是将所有的请求都转发到DispatcherServlet，然后由DispatcherServlet反射调用controller的方法，然后将结果返回给用户

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011180124606.jpeg?)
**这么做的目的主要是统一管理web请求的处理流程，Struts和Spring MVC都是这种设计**

当Spring容器启动或者刷新的时候，DispatcherServlet会初始化后续常用的组件，如HandlerMapping，HandlerAdapter，ViewResolver等。

## HandlerMapping
**HandlerMapping主要就是根据请求的url找到对应的handler**，看到这你可能会想，这个叫ControllerMapping是不是更好一点？并不是，之所以说Handler，是因为在Spring MVC中，Handler常见的实现方式有三种，虽然一般我们只用@RequestMapping注解

### 实现Controller接口

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

### 实现HttpRequestHandler接口

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

### 使用@RequestMapping注解
这种方式大家应该很熟悉了，就不再介绍了

**既然Handler的实现有很多种，相应的查找方式也应该有很多中**，Spring MVC中有3个HandlerMapping的实现类，对应不同的映射策略

| 映射策略            | handler实现方式                                          | 查找实现类                   |
| ------------------- | -------------------------------------------------------- | ---------------------------- |
| 简单url映射         | 实现HttpRequestHandler接口；实现Controller接口，指定路径 | SimpleUrlHandlerMapping      |
| BeanName映射        | 实现Controller接口不指定路径                             | BeanNameUrlHandlerMapping    |
| @RequestMapping映射 | 使用@RequestMapping注解                                  | RequestMappingHandlerMapping |

## HandlerAdapter
其实我刚开始就不明白为啥要有HandlerAdapter这个组件，既然已经找到的handler，直接调用handler的方法不就行了。

**知道我知道了handler的实现方式有很多种时，才意识到HandlerAdapter是必须的，因为每种handler，调用逻辑是不一样的。有了HandlerAdapter可以解耦，不然又是一堆if else**

例如，实现Controller接口的handler，调用逻辑是执行handleRequest方法，用@RequestMapping的handler，是通过反射来执行方法。

常用的HandlerAdapter如下

| 类名                           | 作用                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| HttpRequestHandlerAdapter      | 执行实现了HttpRequestHandler接口的Handler                    |
| SimpleControllerHandlerAdapter | 执行实现了Controller接口的Handler                            |
| RequestMappingHandlerAdapter   | 执行Handler类型是HandlerMethod及其子类的Handler，RequestMappingHandlerMapping返回的Handler是HandlerMethod类型 |

**Spring MVC为什么要搞这么多HandlerMapping和HandlerAdapter呢**

主要还是为了适应不同的场景，静态资源的请求用SimpleUrlHandlerMapping是不是特别方便，逻辑清晰还容易调试。而RequestMappingHandlerMapping则比较适合写业务，因为能适应复杂多变的场景

## ViewResolver和View
ViewResolver用来解析视图，View是最终返回给用户的视图。

因为现在企业项目中，前后端都做了分离。因此不再深入介绍这部分内容。

用@RequestMapping来实现handler时，当我们在类上加了@ReponseBody注解时，会直接将返回写入reponse，并且handler返回的ModelAndView为null，这样ViewResolver和View这个流程就不会走到了