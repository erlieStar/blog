---
layout: post
title: 基于Servlet手写一个Spirng MVC
lock: need
---

# Spring MVC源码解析：基于Servlet手写一个Spirng MVC
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210403141724297.jpg?)
## Spring MVC执行流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/2b23dceb08fd43f881291dc860a9fec0.png?)

Spirng MVC的执行流程是一个非常重要的知识点，它可以让我们很清楚的了解Spring MVC是如何工作的，后面我们会通过源码的方式整个流程以及涉及到的组件。再开始分析之前，我打算基于Servlet手写一个Spirng MVC，这样你就能明白大概的执行流程，不至于在看源码的时候太晕。

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

## 定义中央控制器
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
![在这里插入图片描述](https://img-blog.csdnimg.cn/ecdac9f0b1db4512b16c3a2e29ba7466.png?)

github代码：https://github.com/erlieStar/servlet-learning
v3分支
