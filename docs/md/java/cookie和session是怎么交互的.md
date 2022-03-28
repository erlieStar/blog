---
layout: post
title: cookie和session是怎么交互的？
lock: need
---

# 面试官：cookie和session是怎么交互的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020090322095990.png?)

## 介绍
Http协议使用的是无状态连接，这样会造成什么问题呢？看如下Demo

```java
@RestController
public class LoginController {

    @RequestMapping("login")
    public String login(HttpServletRequest request, @RequestParam("username") String username) {
        request.setAttribute("username", username);
        return "success";
    }

    @RequestMapping("shoppingcar")
    public String showProduct(HttpServletRequest request) {
        String usename = (String)request.getAttribute("username");
        return "username is " + usename;
    }
}
```
测试

![在这里插入图片描述](https://img-blog.csdnimg.cn/1e0683fb42ef48a99f657a2768b7c917.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/473b4d8f320b4c1e866b17f844e2dc96.png)

HttpServletRequest对象代表客户端的请求，当客户端通过HTTP协议访问服务器时，HTTP请求头中的所有信息都封装在这个对象中，当在一个请求中时HttpServletRequest中的信息可以共享，而在不同的请求中HttpServletRequest并不能共享，这样就会造成用户确实进行过登录操作，但是跳到购物车页面时发现并没有东西，因为应用并不知道访问这个页面的用户是谁

我们可以用一个HttpSession对象保存跨多个请求的会话状态，上面的例子就是保存用户名，看下图理解为什么HttpSession可以跨请求保存状态

![在这里插入图片描述](https://img-blog.csdnimg.cn/1b9b157528614d93bca5c1e79f3db61f.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/1db75883dc0548a2b07680dec76dce9d.png)

对客户的第一个请求，容器会生成一个唯一的会话ID，并通过响应把它返回给客户。客户再在以后的每一个请求中发回这个会话ID。容器看到ID后，就会找到匹配的会话，并把这个会话与请求关联

将上面代码改成如下，再测试

```java
@RestController
public class LoginController {

    @RequestMapping("login")
    public String login(HttpSession session, @RequestParam("username") String username) {
        session.setAttribute("username", username);
        return "success";
    }

    @RequestMapping("shoppingcar")
    public String showProduct(HttpSession session) {
        String usename = (String)session.getAttribute("username");
        return "username is " + usename;
    }
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/c9eaf98f7b724d85bf7490e13288a22d.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/d3fe607622904acea2d50ede962dd68c.png)

果然能保存会话状态了，客户和容器如何交换会话ID信息呢？其实是通过cookie实现的

![在这里插入图片描述](https://img-blog.csdnimg.cn/c9c53968c9f34e75b2e29ae28ced742d.png)

![在这里插入图片描述](https://img-blog.csdnimg.cn/4ea094ddcbfc44d8a3cbc5912a35a232.png)

看上面能保存会话的代码，我们并没有对cookie进行操作啊，其实是容器几乎会做cookie的所有工作，从最开始的Servlet开始讲这些操作是如何实现的，先看一下Servlet执行过程

 1. 用户点击页面发送请求->Web服务器应用（如Apache）->Web容器应用（如tomcat）
 2. 容器创建两个对象HttpServletRequest和HttpServletResponse
 3. 根据URL找到servlet，并为请求创建或分配一个线程，将请求和响应对象传递给这个servlet线程
 4. 容器调用Servlet的service()方法，根据请求的不同类型，service()方法会调用doGet()和doPost()方法，假如请求是HTTP GET请求
 5. doGet()方法生成动态页面，并把这个对象塞到响应对象里。容器有响应对象的一个引用
 6. 线程结束，容器把响应对象装换为一个HTTP请求，把它发回给客户，然后删除请求和响应对象


Spring MVC框架其实在Servlet上面封装了一层，当我们自己用Servlet编写程序时，可以从HttpServletRequest中获取HttpSession，如下

```java
public class LoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doPost(req, resp);
    }
}
```
## 在响应中发送一个会话cookie

```java
HttpSession session = req.getSession();
```
我们只需要写上述一行代码即可，来看看容器帮我们做了哪些事情

 1. 建立一个新的HttpSession对象
 2. 生成唯一的会话ID
 3. 建立新的Cookie对象
 4. 把会话Id放到cookie中
 5. 在响应中设置cookie
## 从请求得到会话ID
```java
HttpSession session = req.getSession();
```
与响应生成会话ID和cookie时用的方法一样

```java
if (请求包含一个会话ID cookie) {
    找到与该ID匹配的会话
} else if (没有会话Id cookie OR 没有与此会话ID匹配的当前会话) {
    创建一个新会话
}
```
如上面用的方法，我们并没有直接从HttpServletRequest 中获取HttpSession
```java
public String login(HttpSession session, @RequestParam("username") String username)
```
能直接获取到HttpSession，其实是框架帮我们执行了HttpSession session = req.getSession()，然后设置进来的。我们可以设置session的过期时间，以保证用户登录后长期不操作需要重新登录

tomcat是用如下结构来保存session的

```java
protected Map<String, Session> sessions = new ConcurrentHashMap<String, Session>()
```

值为会话id，session对象是保存一个会话的各种属性，就是你调用类似代码的时候

```java
session.setAttribute("username", username);
```
可以设置很多个啊，你应该也猜到了，在tomcat中保存会话属性是用map来保存的

```java
protected Map<String, Object> attributes = new ConcurrentHashMap<String, Object>();
```

如果我们不自己new cookie而通过req.getSession()来设置cookie，那么cookie的名字为

JSESSIONID，值为会话id，前面图片中有哈。

第一次登陆，reponse设置一个cookie（ JSESSIONID=会话id）

以后每次登陆带着这个cookie，通过key为JSESSIONID拿到会话id，cookie可以设置很多个哈。

通过JSESSIONID就能拿到session了，拿到session你就能拿出来登陆设置的各种属性了哈，就能判断出来这个是哪个用户了。