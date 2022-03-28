---
layout: post
title: 从浏览器输入URL到页面展示出来，中间发生了什么？
lock: need
---

# 面试官：从浏览器输入URL到页面展示出来，中间发生了什么？
![请添加图片描述](https://img-blog.csdnimg.cn/8e5d33710590492da38f8c1b1f4b457d.jpg?)
## 前言
这应该算是一个很经典的面试题了，前端工程师，后端工程师，包括网络工程师都有可能被问到。开放度很高，每个人都可以针对自己熟悉的部分，进行深入的讲解。

总体来说，分为如下几个部分

1.DNS解析
2.建立TCP连接，发送HTTP请求
3.服务端处理请求并返回HTTP响应
4.浏览器解析渲染页面
5.关闭连接

## DNS解析
DNS解析就是获取服务器IP地址的过程。互联网上每一台计算机的唯一标识是它的IP地址，但是IP地址并不方便记忆。用户更喜欢用方便记忆的网址去寻找互联网上的其它计算机，例如www.baidu.com，www.taobao.com。所以互联网设计者需要在用户的方便性与可用性方面做一个权衡，这个权衡就是一个网址到IP地址的转换，这个过程就是DNS解析。它实际上充当了一个翻译的角色，实现了网址到IP地址的转换。网址到IP地址转换的过程是如何进行的?

**DNS的解析方式有两种**

1.递归解析
 当局部DNS服务器自己不能回答客户机的DNS查询时，它就需要向其他DNS服务器进行查询。此时有两种方式，如图所示的是递归方式。局部DNS服务器自己负责向其他DNS服务器进行查询，一般是先向该域名的根域服务器查询，再由根域名服务器一级级向下查询。最后得到的查询结果返回给局部DNS服务器，再由局部DNS服务器返回给客户端。
 
 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908140809333.png)
 
2.迭代解析
当局部DNS服务器自己不能回答客户机的DNS查询时，也可以通过迭代查询的方式进行解析，如图所示。局部DNS服务器不是自己向其他DNS服务器进行查询，而是把能解析该域名的其他DNS服务器的IP地址返回给客户端DNS程序，客户端DNS程序再继续向这些DNS服务器进行查询，直到得到查询结果为止。也就是说，迭代解析只是帮你找到相关的服务器而已，而不会帮你去查。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908140817514.png?)

再放一个详细的流程图

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908141352990.png?)

为了提高查找的效率，DNS服务器会进行缓存。具体的缓存策略如下：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908184338232.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

1.浏览器缓存

浏览器会先检查是否在缓存中，没有则调用系统库函数进行查询。

2 操作系统缓存

操作系统也有自己的 DNS缓存，但在这之前，会向检查域名是否存在本地的 Hosts 文件里，没有则向 DNS 服务器发送查询请求。
Linux在/etc/hosts文件中
windows在C:\Windows\System32\drivers\etc\hosts文件中

3.路由器缓存

路由器也有自己的缓存。

4.ISP DNS 缓存

ISP DNS 就是在客户端电脑上设置的首选 DNS 服务器，它们在大多数情况下都会有缓存。
## 建立TCP连接
http协议是基于tcp/ip协议的，整个数据的发送和接收流程如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019090818492829.png?)

TCP/IP的建议需要经历三次握手

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908185457495.jpg?)

TCP的三次握手还是经常被问到的，这里概述一下

第一次握手：客户端A将标志位SYN置为1,随机产生一个值为seq=J（J的取值范围为=1234567）的数据包到服务器，客户端A进入SYN_SENT状态，等待服务端B确认；

第二次握手：服务端B收到数据包后由标志位SYN=1知道客户端A请求建立连接，服务端B将标志位SYN和ACK都置为1，ack=J+1，随机产生一个值seq=K，并将该数据包发送给客户端A以确认连接请求，服务端B进入SYN_RCVD状态。

第三次握手：客户端A收到确认后，检查ack是否为J+1，ACK是否为1，如果正确则将标志位ACK置为1，ack=K+1，并将该数据包发送给服务端B，服务端B检查ack是否为K+1，ACK是否为1，如果正确则连接建立成功，客户端A和服务端B进入ESTABLISHED状态，完成三次握手，随后客户端A与服务端B之间可以开始传输数据了。

如图所示：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908185840162.png?)

## 服务端处理请求并返回HTTP响应
服务端拿到Http请求处理后，再返回HttP响应，这里主要涉及到一部分Http的常见知识点，如各种状态码，各种Header的含义。把常见的状态码，常见的Header了解一下就行了。Http相关的知识前面的文章已经介绍过了，就不重复介绍了。
## 浏览器解析渲染页面
这部分内容偏前端一点。大家可以参考相关博问，后端几乎很少问。
## 关闭连接
这里要注意的一点是一个TCP连接是可以发送多个Http请求的，不是发送一次Http请求TCP连接就断了。默认情况下建立 TCP 连接不会断开，只有在请求报头中声明 Connection: close 才会在请求完成后关闭连接。这里又涉及到TCP四次挥手

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190908191826833.png?)

第一次挥手：Client发送一个FIN，用来关闭Client到Server的数据传送，Client进入FIN_WAIT_1状态。


第二次挥手：Server收到FIN后，发送一个ACK给Client，确认序号为收到序号+1（与SYN相同，一个FIN占用一个序号），Server进入CLOSE_WAIT状态。
第三次挥手：Server发送一个FIN，用来关闭Server到Client的数据传送，Server进入LAST_ACK状态。


第四次挥手：Client收到FIN后，Client进入TIME_WAIT状态，接着发送一个ACK给Server，确认序号为收到序号+1，Server进入CLOSED状态，完成四次挥手。