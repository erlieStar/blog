---
layout: post
title: 说一下Http请求的报文格式及常用状态码
lock: need
---

# 面试官：说一下Http请求的报文格式及常用状态码

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200903233131290.jpg?)
## http协议详解
http协议我们应该再熟悉不过，毕竟我们每天都使用浏览器。http协议是基于tcp协议的。所以进行http通信前要建立tcp/ip的连接。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190822205305242.PNG?)
## http请求报文和响应报文的格式
**请求报文格式**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190822223354538.PNG?)
为了理解的更清楚，我用Wireshark抓包来看看到底表现形式是啥（\r\n是换行）
其中GET / HTTP/1.1是请求行。

由3个部分组成
1. 请求方法（GET）
2. 请求目标，通常是一个URI（/）
3. 版本号（HTTP/1.1）
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190822205442804.PNG?)

**响应报文格式**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190822223707561.PNG?)

为了更深入理解，同样抓包看一下。

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019082220552683.PNG)

其中HTTP/1.1 304 Not Modified是状态行

由3个部分组成
1. 版本号（HTTP/1.1）
2. 状态码（304）
3.  数字状态码补充，原因描述（Not Modified）
## 常用的头部字段
我举几个例子，你就能看懂大部分的首部字段。
看上面请求头例子，有一个为Accept，类似如下

```xml
Accept: text/html,application/xml
```
这表明客户端通过type/subtype的形式告诉服务端，我可以接收哪些文本类型
常见有的

```xml
text/html 文本
image/gif、image/jpeg、image/png 图片
video/mp4 音视频
application 数据格式不固定，由上层应用解释，如application/json，application/pdf等
```

Accept-Encoding客户端支持的压缩格式，gzip、deflate
服务端对应的属性为Content-Encoding，如下表明服务端使用的是gzip这种压缩方式

```xml
Content-Encoding: gzip
```
客户端能识别的语言为
```xml
Accept-Language: zh-CN, zh, en
```

服务端返回的语言为

```xml
Content-Language: zh-CN
```
解释完毕，还是很好理解的吧

常见的首部如下：

**通用首部字段（请求报文与响应报文都会使用的首部字段）**

Date：创建报文时间
Connection：连接的管理
Cache-Control：缓存的控制
Transfer-Encoding：报文主体的传输编码方式


**请求首部字段（请求报文会使用的首部字段）**

Host：请求资源所在服务器
Accept：可处理的媒体类型
Accept-Charset：可接收的字符集
Accept-Encoding：可接受的内容编码
Accept-Language：可接受的自然语言


**响应首部字段（响应报文会使用的首部字段）**

Accept-Ranges：可接受的字节范围
Location：令客户端重新定向到的URI
Server：HTTP服务器的安装信息


**实体首部字段（请求报文与响应报文的的实体部分使用的首部字段）**

Allow：资源可支持的HTTP方法
Content-Type：实体主类的类型
Content-Encoding：实体主体适用的编码方式
Content-Language：实体主体的自然语言
Content-Length：实体主体的的字节数
Content-Range：实体主体的位置范围，一般用于发出部分请求时使用

## 状态码的类别
状态码对识别错误非常有用，所以也经常被问到，总结如下
|      | 类别                 | 原因短语                   |
| ---- | -------------------- | -------------------------- |
| 1XX  | （信息性状态码）     | 收到的请求正在处理         |
| 2XX  | （成功状态码）       | 请求正常处理完毕           |
| 3XX  | （重定向状态码）     | 需要进行附加操作已完成请求 |
| 4XX  | （客户端错误状态码） | 服务器无法处理请求         |
| 5XX  | （服务器错误状态码） | 服务器处理请求出错         |

2XX 成功：

| 状态码 | 英文            | 解释                                       |
| ------ | --------------- | ------------------------------------------ |
| 200    | OK              | 表示从客户端发来的请求在服务器端被正确处理 |
| 204    | No content      | 表示请求成功，但响应报文不含实体的主体部分 |
| 206    | Partial Content | 进行范围请求                               |
3XX 重定向：

| 状态码 | 英文               | 解释                                                  |
| ------ | ------------------ | ----------------------------------------------------- |
| 301    | moved permanently  | 永久性重定向，表示资源已被分配了新的 URL              |
| 302    | found              | 临时性重定向，表示资源临时被分配了新的URL             |
| 303    | see other          | 表示资源存在着另一个 URL，应使用 GET 方法定向获取资源 |
| 304    | not modified       | 表示服务器允许访问资源，但因发生请求未满足条件的情况  |
| 307    | temporary redirect | 临时重定向，和302含义相同                             |
4XX 客户端错误：
| 状态码 | 英文         | 解释                                       |
| ------ | ------------ | ------------------------------------------ |
| 400    | bad request  | 请求报文存在语法错误                       |
| 401    | unauthorized | 表示发送的请求需要有通过HTTP认证的认证信息 |
| 403    | forbidden    | 表示对请求资源的访问被服务器拒绝           |
| 404    | not found    | 表示在服务器上没有找到请求的资源           |

5XX 服务器错误：
| 状态码 | 英文                 | 解释                                                 |
| ------ | -------------------- | ---------------------------------------------------- |
| 500    | internal sever error | 表示服务器在执行请求时发生了错误                     |
| 503    | service unavailable  | 表明服务器暂时处于超负载或正在停机维护，无法处理请求 |