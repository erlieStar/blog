---
layout: post
title: Get和Post的区别是什么?
lock: need
---

# 面试官：Get和Post的区别是什么？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210228194007968.jpg?)
## 介绍
1. 对参数的数据类型，GET只接受ASCII字符，而POST没有限制，允许二进制。

2. GET在浏览器回退/刷新时是无害的，而POST会再次提交请求。

3. GET请求只能进行url编码(application/x-www-form-urlencoded)，而POST支持多种编码方式(application/x-www-form-urlencoded 或 multipart/form-data)，可以为二进制使用多重编码。

4. POST 比 GET 更安全，因为GET参数直接暴露在URL上，POST参数在HTTP消息主体中，而且不会被保存在浏览器历史或 web 服务器日志中。

5. 浏览器对URL的长度有限制，所以GET请求不能代替POST请求发送大量数据

6. GET请求会被浏览器主动缓存，POST不会，除非手动设置。

7. GET请求参数会被完整保留在浏览器历史记录里，而POST中的参数不会被保留。

8. GET请求可被收藏为书签，POST不能。

9. GET请求是幂等的

**幂等：从定义上看HTTP方法的幂等性是指一次和多次请求某一个资源应该具有同样的副作用。post不是幂等的**