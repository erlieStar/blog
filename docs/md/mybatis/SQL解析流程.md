---
layout: post
title: SQL解析流程
lock: need
---

# Mybatis源码解析：SQL解析流程

![请添加图片描述](https://img-blog.csdnimg.cn/14ee306c28444c6384263dc2aba9db4c.jpg?)
## SQL解析
上一节我们提到在解析的过程中一个比较重要的点是，对每个sql进行解析并封装为SqlSource对象
![在这里插入图片描述](https://img-blog.csdnimg.cn/35e72370dd9f49bbb4b17696a5e1f69e.png?)

sql定义的方式有很多种，比如用xml，@Select，@SelectProvider等来描述要执行的sql，针对不同的定义方式，mybatis定义了不同的SqlSource实现类
![在这里插入图片描述](https://img-blog.csdnimg.cn/bb523ece33154774b21d573fd0d4d972.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/83ff0c73d346495d8dd97ef5b2176b80.png)

SqlSource接口只有一个方法，传入sql执行的参数，获取BoundSql
![在这里插入图片描述](https://img-blog.csdnimg.cn/a14f0515bf3a40d2b33edb2c7e9ba2c9.png?)
这个BoundSql我们在参数处理器这一节再分享，你目前只需要知道BoundSql经过参数处理器处理后就能获取到可以执行的sql

常见的SqlSource实现类的作用如下
| SqlSource |  作用|
|--|--|
| DynamicSqlSource | 动态sql |
| ProviderSqlSource | @*Provider 注解 提供的 SQL ，这种注解在通用mapper中用的最多|
|RawSqlSource  | 静态sql |
| StaticSqlSource | 仅会含有?的sql |

在执行的过程中会把对应的SqlSource都转为StaticSqlSource，StaticSqlSource就是对BoundSql的一个简单封装

![在这里插入图片描述](https://img-blog.csdnimg.cn/130559b4c2b44eeebefd230f33192759.png?)

当然如果你想增加另外一种sql定义的方式，只需要实现SqlSource接口即可。

那么问题来了，既然新写了一种sql定义的方式，那么相应的解析程序也要重新实现，不然mybatis根本不知道如何把你定义的sql翻译为可以执行的sql，此时你只需要重写LanguageDriver接口即可，增加你自己的解析实现

网上就有其他大神，重写了LanguageDriver和SqlSource，利用velocity定义了一套sql的解析流程，但是用的人比较少哈。
```xml
<dependency>
    <groupId>org.mybatis.scripting</groupId>
    <artifactId>mybatis-velocity</artifactId>
    <version>2.1.0</version>
</dependency>
```
加入依赖后，写出来的sql如下所示，有兴趣的小伙伴可以玩玩。
```sql
<select id="findPerson" lang="velocity"> 
    #set( $pattern = $_parameter.name + '%' ) 
    SELECT * FROM person WHERE name LIKE @{pattern, jdbcType=VARCHAR}
</select>
```
![请添加图片描述](https://img-blog.csdnimg.cn/06374ecd63ec43ceb28e4fcc055b8572.png?)

LanguageDriver在mybatis中有两个默认实现

XMLLanguageDriver：默认的LanguageDriver，可以处理动态sql和静态sql
RawLanguageDriver：只可以处理静态sql

**那么静态sql和动态sql如何区分呢？**

举个例子，下面这段sql会被解析为如下的语法树
```sql
select id, name, age
from ${tableName}
<where>
  <if test="name != null and name != ''">
    name = #{name}
  </if>
  <if test="age != null">
    and age = #{age}
  </if>
</where>
order by id
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/85c5b9d0f9a14103a7355547ae1cc170.png?)

![请添加图片描述](https://img-blog.csdnimg.cn/5adfa427c1c94b818231431ef9053ad4.png)

在mybatis中是用SqlNode来解析标签中的内容的，每个不同的标签交给不同的SqlNode来进行解析

SqlNode的定义如下，当执行SqlNode#apply方法时，会把标签解析完的sql放到DynamicContext（当所有标签解析完后，就可以从DynamicContext或获取到只会含有#{}占位符的sql）

![在这里插入图片描述](https://img-blog.csdnimg.cn/a2680b798cc9466c981f8f261159e8f0.png)

常见的SqlNode如下，基本上就是一种标签一个SqlNode，MixedSqlNode是一个比较特殊的标签，它是多个标签的一个组合，因为一个标签下可能有很多子标签，这些子标签会被合并为一个MixedSqlNode，**典型的组合模式**
![请添加图片描述](https://img-blog.csdnimg.cn/c3c585a4c5d54a2fab3d1d935da0c8b1.png?)
一段sql描述会被解析为一个MixedSqlNode，然后基于MixedSqlNode来构建SqlSource

XMLScriptBuilder#parseScriptNode
![在这里插入图片描述](https://img-blog.csdnimg.cn/0834ba45ea624c82957890f480743437.png)

如下为将sql描述转为sql标签的过程

XMLScriptBuilder#parseDynamicTags
![在这里插入图片描述](https://img-blog.csdnimg.cn/a3c5455ff0394cf8b2a708941739d7af.png?)
对应的内容和解析成的SqlNode的对应关系如下
|内容  | 解析成的SqlNode |
|--|--|
|if标签中的内容 | IfSqlNode |
| where标签中的内容 | WhereSqlNode |
| 含有${}占位符的静态文本 | TextSqlNode |
| 纯静态文本或含有#{}占位符 | StaticTextSqlNode |

**从这个解析过程可以看出来，静态sql为纯静态文本或含有#{}占位符的sql，除此之外都是动态sql（如含有${}占位符号，含有动态sql标签）**

**静态sql会被封装为RawSqlSource，动态sql会被封装为DynamicSqlSource**
![在这里插入图片描述](https://img-blog.csdnimg.cn/b71225237e0a49d2a9756bfbec470f52.png?)
**可以看到静态sql在初始化的时候已经解析完成了**，SqlSourceBuilder会将#{}替换为？，并将#{}中的内容转为ParameterMapping对象

org.apache.ibatis.builder.SqlSourceBuilder#parse
![在这里插入图片描述](https://img-blog.csdnimg.cn/701509c640ff45cab84a3d98d7b4458e.png?)
ParameterMappingTokenHandler#handleToken
![在这里插入图片描述](https://img-blog.csdnimg.cn/076a5274979e4015b3485a65d687ef31.png)
我们一般只在#{}中写属性值，但是它其实可以设置很多属性，因此需要转为ParameterMapping对象
```java
<if test="name != null and name != ''">
  name = #{name,jdbcType=VARCHAR,typeHandler=org.apache.ibatis.type.StringTypeHandler}
</if>
```

#{}占位符中可以写的属性如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/3302933d38c546b99398cd31516d518d.png)

将#{}中的内容封装为ParameterMapping对象

![在这里插入图片描述](https://img-blog.csdnimg.cn/37e1fb79b53b4820835f2a7da24a7089.png?)

StaticSqlSource其实就是对BoundSql的一个简单封装
![在这里插入图片描述](https://img-blog.csdnimg.cn/645952457c4d44789dda1bd8a9269bab.png?)
**动态sql在执行的时候，才会执行解析**，解析的过程和静态sql类似
![在这里插入图片描述](https://img-blog.csdnimg.cn/8021b3713b584d8b87860c06efb7eaec.png?)
**分析完静态sql和动态sql，我们可以发现静态sql的执行效率比动态sql的执行效率高，因为静态sql在初始化的时候已经解析完成了，动态sql在执行的时候才会解析**
## SqlNode解析流程
最后我们挑几个典型的SqlNode来分析一下解过程

![在这里插入图片描述](https://img-blog.csdnimg.cn/b4ce85f5854d41cb97beb22a3c65f871.png)

StaticTextSqlNode为纯静态文本或含有#{}占位符的节点，所以直接把内容加到容器中就行
![在这里插入图片描述](https://img-blog.csdnimg.cn/288aebecfd1f4183ad42267108065404.png?)

if标签中的表达式为true时，才会将子节点的内容加到DynamicContext中
![在这里插入图片描述](https://img-blog.csdnimg.cn/a562be14838248baaf5d88c440de9ea5.png?)

foreach标签的解析过程比较麻烦，直接看解析后的结果
```sql
<select id="selectByIds" resultType="org.apache.ibatis.mytest.UserInfo">
  SELECT
  <include refid="Base_Column_List"/>
  FROM user_info WHERE id in
  <foreach collection="list" open="(" close=")" separator="," item="item">
    #{item}
  </foreach>
</select>
```

可以看到将foreach标签被替换为#{}占位符，后续会把sql中名字和值的映射关系放到BoundSql的additionalParameters
![在这里插入图片描述](https://img-blog.csdnimg.cn/a8e04e8e4af74cb9b8705baaa4131010.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/94fc7231414f43e6bd81d36642f23177.png?)
**foreach标签的解析流程和设置参数的流程比较耗时间，因此当你的foreach标签中的属性过多时，性能会极速下降，这个需要特别注意，此时你可以选择BatchExecutor来执行sql**