---
layout: post
title: 你需要了解的Servlet
lock: need
---

# Spring MVC源码解析：你需要了解的Servlet
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021040314121153.jpg?)

## Servlet的那些特性
因为Spring MVC是基于Servlet进行扩展的，为了更好的理解源码，我们需要对Servlet有一些了解，我们先来用Servlet开发一个Web应用。

```java
@WebServlet(urlPatterns="/index", initParams = {
        @WebInitParam(name = "library.name", value = "javashitang")
})
public class IndexServlet extends HttpServlet {

    private String libraryName;

    @Override
    public void init(ServletConfig config) throws ServletException {
        this.libraryName = config.getInitParameter("library.name");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/html;charset=utf-8");
        PrintWriter out = resp.getWriter();
        out.println("welcome to " + libraryName + " library");
    }
}
```

```shell
// 访问
curl http://localhost:8080/index
// 返回
welcome to javashitang library
```

**在这个例子中我用@WebInitParam设置了Servlet的初始化参数，可以从ServletConfig中获取，当然你可以把这个初始化参数配置到web.xml中，就不演示了**

当我们使用Servlet开发的时候，基本上一个是继承HttpServlet，重新对应的doGet，doPost方法即可
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210403152009334.png?)

HttpServlet在Servlet的基础上，封装了许多Http协议相关的内容（将请求封装为HttpServletRequest，将响应封装为HttpServletResponse）。

Servlet接口定义如下，其中最要的就是Servlet的三个生命周期函数
```java
public interface Servlet {
    void init(ServletConfig var1) throws ServletException;

    ServletConfig getServletConfig();

    void service(ServletRequest var1, ServletResponse var2) throws ServletException, IOException;

    String getServletInfo();

    void destroy();
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210403151905346.png?)

**和servlet配置和容器相关的配置类**

ServletConfig（获取Servlet的初始化属性）

 - 每个servlet有一个ServletConfig对象
 - 用于向servlet传递部署时信息（例如，数据库相关的配置信息），而你不想把这个信息硬编码到servlet中（servlet初始化参数）
 - 用于访问ServletContext
 - 参数在部署描述文件中配置
 
ServletContext（获取容器的初始化属性）

 - 每个Web应用有一个ServletContext
 - 用于访问Web应用参数（也在部署描述文件中配置）
 - 相当于应用中的一个公告栏，可以在这里放消息（称为属性），应用的其他部分也可以访问这些消息
 - 用于得到服务器信息，包括容器的名字和版本，以及所支持API的版本等

**用Servlet开发Web应用时，执行流程如下**

 1. 用户点击页面发送请求->Web服务器应用（如Apache）->Web容器应用（如tomcat）
 2. 容器创建两个对象HttpServletRequest和HttpServletResponse
 3. 根据URL找到servlet，并为请求创建或分配一个线程，将请求和响应对象传递给这个servlet线程
 4. 容器调用Servlet的service()方法，根据请求的不同类型，service()方法会调用doGet()和doPost()方法，假如请求是HTTP GET请求
 5. doGet()方法生成动态页面，并把这个对象塞到响应对象里。容器有响应对象的一个引用
 6. 线程结束，容器把响应对象装换为一个HTTP响应信息，把它发回给客户，然后删除请求和响应对象

## 扩展机制
当有了Servlet规范之后，你基本不用关系Socket网络通信，Http协议相关的内容，只需要实现业务逻辑即可。大家的业务逻辑千奇百怪，所以要提供扩展点，让大家可以个个性化的配置。

**Servlet规范提供了两种扩展机制，Filter和Listener**

Filter（过滤器）：允许你对接口的请求和响应做统一的定制化处理。如对请求和响应进行统一的编码，判断用户是否登陆，统计网站访问频率等.

Listener（监听器）：是基于事件的一种扩展机制，在Servlet容器提供服务的过程中会发生各种个样的事件，如容器的启动关闭等。我们可以监听这些事件来做一些定制化的事情，如监听容器启动事件，初始化数据库连接等，监听容器关闭事件，关闭数据库连接等！

## 基于maven插件运行Servlet项目
以前我们调试web项目的时候，需要在本地下载一个tomcat，为了项目的复用性，方便他人快速调试，这里演示一个用maven插件启动web项目的方法

**maven7**

在pom文件中加入如下配置

```xml
<plugins>
    <plugin>
        <groupId>org.apache.tomcat.maven</groupId>
        <artifactId>tomcat7-maven-plugin</artifactId>
        <version>2.2</version>
        <configuration>
            <port>8080</port>
            <path>/</path>
            <uriEncoding>UTF-8</uriEncoding>
            <server>tomcat7</server>
        </configuration>
    </plugin>
</plugins>
```
执行如下命令即可启动

```shell
mvn tomcat7:run
```
或者点击idea中的侧边栏

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200321151102550.PNG)

**maven8**
```xml
<pluginRepositories>
    <pluginRepository>
        <id>alfresco-public</id>
        <url>https://artifacts.alfresco.com/nexus/content/groups/public</url>
    </pluginRepository>
    <pluginRepository>
        <id>alfresco-public-snapshots</id>
        <url>https://artifacts.alfresco.com/nexus/content/groups/public-snapshots</url>
        <snapshots>
            <enabled>true</enabled>
            <updatePolicy>daily</updatePolicy>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>beardedgeeks-releases</id>
        <url>http://beardedgeeks.googlecode.com/svn/repository/releases</url>
    </pluginRepository>
</pluginRepositories>
<build>
    <finalName>servlet-learning</finalName>
    <plugins>
        <plugin>
            <groupId>org.apache.tomcat.maven</groupId>
            <artifactId>tomcat8-maven-plugin</artifactId>
            <version>3.0-r1655215</version>
            <configuration>
                <port>8080</port>
                <path>/</path>
                <uriEncoding>UTF-8</uriEncoding>
                <server>tomcat8</server>
            </configuration>
        </plugin>
    </plugins>
</build>
```

在命令行中输入如下命令

```shell
mvn tomcat8:run
```