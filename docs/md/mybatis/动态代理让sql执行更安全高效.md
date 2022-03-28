---
layout: post
title: 动态代理让sql执行更安全高效
lock: need
---

# Mybatis源码解析：动态代理让sql执行更安全高效

![请添加图片描述](https://img-blog.csdnimg.cn/fedf9e0a01de460ca897ac7d9e75ad41.jpg?)
## Mybatis为什么要使用动态代理对SqlSession进行增强？
![在这里插入图片描述](https://img-blog.csdnimg.cn/aa8e8c46c59c479280d6bf115f87903f.png?)

**在ibatis时代，是直接通过sqlSession进行调用的**
```java
SqlSession sqlSession = sqlSessionFactory.openSession(true);
UserInfo userInfo = sqlSession.selectOne("org.apache.ibatis.atest.UserInfoMapper.selectById", 1);
```
**这种方式有什么缺点呢？**

调用的方法有可能写错，实际要执行的sql并没有配置
传入的参数有可能写错，因为入参是Object类型
返回值有可能写错，因为返回值也是Object类型

**但是这些问题在编译的时候并不会暴露，只有在运行的时候才会暴露**


鉴于ibatis的这些问题，Mybatis使用了动态代理减少了错误的发生，并且让api变的更简洁易用
```java
SqlSession sqlSession = sqlSessionFactory.openSession(true);
UserInfoMapper mapper = sqlSession.getMapper(UserInfoMapper.class);
UserInfo userInfo = mapper.selectById(1);
```

代理的主要流程如下图所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/5850364bbb1c4293955d878d5596884b.png?)
## 创建代理对象
用上一节的例子来debug动态代理的过程，一步一步追

```java
SqlSession sqlSession = sqlSessionFactory.openSession(true);
UserInfoMapper mapper = sqlSession.getMapper(UserInfoMapper.class);
UserInfo userInfo = mapper.selectById(1);
```
之前的文章说过sqlSessionFactory的实现类是DefaultSqlSessionFactory，所以openSession返回的是DefaultSqlSession，追一下
DefaultSqlSession#getMapper方法

org.apache.ibatis.session.defaults.DefaultSqlSession#getMapper
![在这里插入图片描述](https://img-blog.csdnimg.cn/5d73ee2684b04a3caf64e8b414bd0f65.png)
org.apache.ibatis.session.Configuration#getMapper
![在这里插入图片描述](https://img-blog.csdnimg.cn/a70953cfdaa247ee835df962bf76c641.png)
org.apache.ibatis.binding.MapperRegistry#getMapper
![在这里插入图片描述](https://img-blog.csdnimg.cn/7793867ac12b434ea00090e4cada7a64.png?)
org.apache.ibatis.binding.MapperProxyFactory#newInstance(org.apache.ibatis.session.SqlSession)
![在这里插入图片描述](https://img-blog.csdnimg.cn/9040a2e8fb2b437487dfb25ba6455fc3.png?)
整体逻辑并不复杂，利用MapperProxyFactory生成MapperProxy，而MapperProxy实现了InvocationHandler，所以返回的代理类就是MapperProxy，所以当执行Mapper接口的返回时，会首先进入MapperProxy#invoke方法

同时MapperProxy包装了SqlSession，从这我们就能猜到，后续MapperProxy肯定是利用调用的方法，拼装sql对应的id，然后交给SqlSession来执行查询
## 执行动态代理方法
当执行Mapper接口的任何方法时，都会进入MapperProxy#invoke方法（MapperProxy实现了InvocationHandler接口）

org.apache.ibatis.binding.MapperProxy#invoke
![在这里插入图片描述](https://img-blog.csdnimg.cn/b9732dfdf3d440fcb5a7ef770b9358ca.png)

如果执行的是Object类中的方法，直接反射执行即可，否则执行cachedInvoker方法得到MapperMethodInvoker，然后调用其invoke方法

org.apache.ibatis.binding.MapperProxy#cachedInvoker
![在这里插入图片描述](https://img-blog.csdnimg.cn/e4119ef695be486caa5135bd75d20c0f.png?)
org.apache.ibatis.util.MapUtil#computeIfAbsent
![在这里插入图片描述](https://img-blog.csdnimg.cn/ad10260249424df08fccc2fbd4e1c4d6.png?)
**把要执行的方法封装为MapperMethodInvoker，并通过ConcurrentHashMap缓存下来，MapUtil#computeIfAbsent就是一个简单的工具类，利用computeIfAbsent来保证线程安全**

如果是接口的默认方法则封装为DefaultMethodInvoker
否则封装为PlainMethodInvoker（一般情况，我们都不会对接口提供default方法，所以我们看一下PlainMethodInvoker#invoke的逻辑）

![在这里插入图片描述](https://img-blog.csdnimg.cn/fa6332ff72784f7b9f23672a5b59d4e2.png?)
调用MapperMethod#execute方法，和我们之前分享的参数处理器和SqlSession的执行流程接上了哈，至此整个执行流程分析完毕