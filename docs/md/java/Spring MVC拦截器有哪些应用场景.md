---
layout: post
title: Spring MVC拦截器有哪些应用场景？
lock: need
---

# 面试官：Spring MVC拦截器有哪些应用场景？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190825231001137.jpg?)
## 自定义拦截器
最近接手了一个web项目，功能先不说哈，安保措施写的挺好的，分享一下这个项目是怎么用拦截器的。我们要写自己的拦截器一般有两种方式。

1. 实现HandlerInterceptor接口
2. 继承HandlerInterceptorAdapter抽象类

我就直接继承了HandlerInterceptorAdapter抽象类，按需重写部分实现即可（框架老套路了哈，接口一般都会提供一个对应的抽象类）

HandlerInterceptor有如下3个方法

```java
public interface HandlerInterceptor {

    // 在controller执行之前调用，返回false则后面的拦截器不会执行，也不会执行controller方法
    default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        return true;
    }

    // controller执行之后，且页面渲染之前调用
    default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
            @Nullable ModelAndView modelAndView) throws Exception {
    }

    // 页面渲染之后调用，一般用于资源清理操作
    default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            @Nullable Exception ex) throws Exception {
    }

}
```

先定义一下返回值，因为这是一个微服务项目，最好把项目的返回值都统一成一个对象，这样序列化和反序列化都比较方便，而且前端解析也很方便。

```java
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServerResponse {

    // 状态码
    private int code;
    // 描述
    private String desc;
    // 具体存数据的值
    private List<Object> data;

    public enum GlobalStatus {

        SUCCESS(0, "成功"),
        FAILED(1, "失败"),
        ERROR(2, "错误");

        private final int code;
        private final String desc;

        private GlobalStatus(int code, String desc) {
            this.code = code;
            this.desc = desc;
        }
    }

    public ServerResponse(GlobalStatus status, String desc) {
        this.code = status.code;
        this.desc = desc;
    }

    public ServerResponse(GlobalStatus status) {
        this.code = status.code;
        this.desc = status.desc;
    }

    public void addObject(Object da) {
        if (this.data == null)
            this.data = new ArrayList<Object>();
        this.data.add(da);
    }

    public <T>void setData(List<T> data) {
        this.data = (List)data;
    }
}
```

### 记录接口响应时间
```java
@Slf4j
public class SystemInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        request.setAttribute("request-starttime", System.currentTimeMillis());
        log.info("request enter:{}", request.getRequestURI());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        Long startTime = (Long) request.getAttribute("request-starttime");
        if (startTime != null) {
            long cost = System.currentTimeMillis() - startTime;
            log.info("request cost:[" + request.getRequestURI() + ", "
                    + request.getQueryString() + "] " + cost);
        }
    }
}
```
**注意结束时间要在afterCompletion中计算**

这个拦截器记录了每个接口的响应时间，还有接口的路径及参数，有了路径，参数，响应时间这3个指标，排查问题应该很方便了。

## 判断用户是否登录
登录接口为

```java
@RequestMapping("login")
public ServerResponse login(HttpSession session, String username) {
    session.setAttribute("username" ,username);
    return new ServerResponse(ServerResponse.GlobalStatus.SUCCESS);
}
```
登录成功会设置session的属性值。

```java
public class LoginInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession httpSession = request.getSession();
        String username = (String) httpSession.getAttribute("username");
        if (username == null) {
            // 用户没有登录
            ServerResponse serverResponse = new ServerResponse(ServerResponse.GlobalStatus.ERROR, "请登录");
            ResponseWrite.writeResult(response, serverResponse);
            return false;
        } else {
            // 往request放一下用户的属性
            request.setAttribute("userInfo", username);
            return true;
        }
    }
}
```
可以看到当从session中取不到相应的用户信息时，说明用户没有登录，应该提示登录
。当用户已经登录时会调用request.setAttribute方法，设置一下用户的信息，方便记录操作人之类的。后面会演示到。

这里用了一个工具类，来重写返回的json

```java
@Slf4j
public class ResponseWrite {

    public static void writeResult(HttpServletResponse response, ServerResponse serverResponse) {
        try {
            response.reset();
            response.setContentType("application/json;charset=UTF-8");
            response.setCharacterEncoding("utf-8");
            response.getWriter().write(JsonUtil.obj2String(serverResponse));
        } catch (Exception e) {
            log.error("http response write exception, result is: {}", JsonUtil.obj2String(serverResponse));
        }
    }
}
```
JsonUtil是我写的将对象转为json的工具类

没有登录显示

```json
{
    "code": 2,
    "desc": "请登录"
}
```

登录成功显示
```json
{
    "code": 0,
    "desc": "成功"
}
```
## 判断用户的权限
这个项目的权限是基于RBAC（Role-Based Access Control，基于角色的访问控制）来做的，简答来说需要五张表。

用户表
用户角色关联表
角色表
角色权限关联表
权限表

基于这种模型，用注解+拦截器来实现权限管理还是很容易的，大概演示一下

权限注解（在需要进行权限校验的url上加，id属性一般为权限id）
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Authority {

    int id() default 0;
}
```
如下面代码，删除用户需要id=0的权限（默认值），并且会打印出操作人是谁，request.getAttribute之所以能取到值，是因为在登录的时候已经设置了，可以看一下前面，当出现问题的时候就可以迅速排查到哪些用户做了哪些操作，能迅速找到责任人，当然我这里打印的信息很少，简单演示一下就行。
```java
@Authority
@RequestMapping("delete")
public ServerResponse delete(HttpServletRequest request) {
    String usename = (String) request.getAttribute("userInfo");
    log.info("{} delete the user", usename);
    return new ServerResponse(ServerResponse.GlobalStatus.SUCCESS,"删除用户");
}
```
拦截器如下

```java
@Component
public class AuthorityInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        Method method = handlerMethod.getMethod();
        Authority authority = method.getAnnotation(Authority.class);
        if (authority == null) {
            // 如果注解为null, 说明方法上没有Authority注解，不需要拦截, 直接放过
            return true;
        }
        // 这个是判断用户是否登录的时候设置进去的
        // 登录就会set，没有登录就不会set
        String username = (String) request.getAttribute("userInfo");
        if (username == null) {
            ServerResponse serverResponse = new ServerResponse(ServerResponse.GlobalStatus.ERROR, "请登录");
            ResponseWrite.writeResult(response, serverResponse);
            return false;
        }
        // 拿到被访问url所需要的权限
        // 再看用户是否有这个权限
        // 有就返回true，否则返回false
        // 这里省略从数据库校验的过程，直接返回true
        int value = authority.id();
        return true;
    }
}
```
这个拦截器是和登录拦截器一起使用的，不然会让用户一直登录。

## 接口权限校验
这个写起来比较长，单开一篇吧。
## 配置
配置拦截器的方法如下，注意顺序的问题，最起码本节中LoginInterceptor和AuthorityInterceptor这2个拦截器的顺序是不能颠倒的。

```java
@Configuration
public class DemoWebMvcConfigurerAdapter extends WebMvcConfigurationSupport {

    @Override
    protected void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SystemInterceptor());
        registry.addInterceptor(new LoginInterceptor()).addPathPatterns("/**").excludePathPatterns("/user/login");
        registry.addInterceptor(new AuthorityInterceptor()).addPathPatterns("/**").excludePathPatterns("/user/login");
    }
}
```
说一下拦截器的执行顺序，有2个拦截器，则执行顺序为

```java
preHandler 1
preHandler 2
postHandler 2
postHandler 1
afterCompletion 2
afterCompletion 1
```
github地址为：
https://github.com/erlieStar/interceptor-demo

## 实现过程

```java
// DispatcherServlet#doDispatch部分代码
// 依次调用 HandlerInterceptor#preHandle 方法
if (!mappedHandler.applyPreHandle(processedRequest, response)) {
    return;
}

// Actually invoke the handler.
// 反射执行Controller方法
mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

if (asyncManager.isConcurrentHandlingStarted()) {
    return;
}

applyDefaultViewName(processedRequest, mv);
// 依次调用 HandlerInterceptor#postHandle 方法
mappedHandler.applyPostHandle(processedRequest, response, mv);
```

**拦截器的实现就是典型的责任链模式**。用户自定义的拦截器会被放到一个list，然后将list转成数组，遍历数组
```java
boolean applyPreHandle(HttpServletRequest request, HttpServletResponse response) throws Exception {
    HandlerInterceptor[] interceptors = getInterceptors();
    if (!ObjectUtils.isEmpty(interceptors)) {
        for (int i = 0; i < interceptors.length; i++) {
            HandlerInterceptor interceptor = interceptors[i];
            if (!interceptor.preHandle(request, response, this.handler)) {
                triggerAfterCompletion(request, response, null);
                return false;
            }
            this.interceptorIndex = i;
        }
    }
    return true;
}
```

```java
void applyPostHandle(HttpServletRequest request, HttpServletResponse response, @Nullable ModelAndView mv)
        throws Exception {

    HandlerInterceptor[] interceptors = getInterceptors();
    if (!ObjectUtils.isEmpty(interceptors)) {
        for (int i = interceptors.length - 1; i >= 0; i--) {
            HandlerInterceptor interceptor = interceptors[i];
            interceptor.postHandle(request, response, this.handler, mv);
        }
    }
}
```
前面说过了顺序问题，其实从源码中就可以清晰的看到原因，applyPreHandle正序遍历数组，applyPostHandle和afterCompletion倒序遍历数组