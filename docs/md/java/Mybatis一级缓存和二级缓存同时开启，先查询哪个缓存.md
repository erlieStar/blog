---
layout: post
title: Mybatis一级缓存和二级缓存同时开启，先查询哪个缓存？
lock: need
---

# 面试官：Mybatis一级缓存和二级缓存同时开启，先查询哪个缓存？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227142357820.jpg?)
## 介绍
要想回答这个问题，必须把一级缓存和二级缓存的实现搞明白，详细介绍一下

我们知道Mybatis有一级缓存和二级缓存，底层都是用HashMap实现的
key为CacheKey对象（后续说原因），value为从数据库中查出来的值。

Mybatis的二级缓存模块是装饰器的典型实现，不清楚装饰者模式的看如下文章

面试官：说一下装饰者模式的作用，以及哪些地方用到了装饰者模式吧

画一个简易的装饰者模式类图

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200226191009333.png?)

Component（组件）：组件接口或抽象类定义了全部组件实现类以及所有装饰器实现的行为。

ConcreteComponent（具体组件实现类）：具体组件实现类实现了Component接口或抽象类。通常情况下，具体组件实现类就是被装饰器装饰的原始对象，该类提供了Component接口中定义的最基本的功能，其他高级功能或后序添加的新功能，都是通过装饰器的方式添加到该类的对象之上的。

ConcreteDecorator（具体的装饰器）：该实现类要向被装饰对象添加某些功能

mybatis中caceh模块的类图

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200226191704624.png?)

其中只有PerpetualCache是具组件实现类，提供了Cache接口的基本实现。而FifoCache
，LoggingCache等都是具体装饰者，在具体实现上加额外功能

## 测试一级缓存
**测试的具体过程引用自参考博客**

github地址：https://github.com/kailuncen/mybatis-cache-demo

接下来通过实验，了解MyBatis一级缓存的效果，每个单元测试后都请恢复被修改的数据。

首先是创建示例表student，创建对应的POJO类和增改的方法，具体可以在entity包和mapper包中查看。

```sql
CREATE TABLE `student` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `age` tinyint(3) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```
在以下实验中，id为1的学生名称是凯伦

### 实验1
开启一级缓存，范围为会话级别，调用三次getStudentById，代码如下所示：

```java
public void getStudentById() throws Exception {
        SqlSession sqlSession = factory.openSession(true); // 自动提交事务
        StudentMapper studentMapper = sqlSession.getMapper(StudentMapper.class);
        System.out.println(studentMapper.getStudentById(1));
        System.out.println(studentMapper.getStudentById(1));
        System.out.println(studentMapper.getStudentById(1));
    }
```
执行结果：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227102515212.png?)
我们可以看到，只有第一次真正查询了数据库，后续的查询使用了一级缓存。

### 实验2
增加了对数据库的修改操作，验证在一次数据库会话中，如果对数据库发生了修改操作，一级缓存是否会失效。

```java
@Test
public void addStudent() throws Exception {
        SqlSession sqlSession = factory.openSession(true); // 自动提交事务
        StudentMapper studentMapper = sqlSession.getMapper(StudentMapper.class);
        System.out.println(studentMapper.getStudentById(1));
        System.out.println("增加了" + studentMapper.addStudent(buildStudent()) + "个学生");
        System.out.println(studentMapper.getStudentById(1));
        sqlSession.close();
}
```

执行结果：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227102548389.png?)
我们可以看到，在修改操作后执行的相同查询，查询了数据库，一级缓存失效。

### 实验3
开启两个SqlSession，在sqlSession1中查询数据，使一级缓存生效，在sqlSession2中更新数据库，验证一级缓存只在数据库会话内部共享。（**这个实验在原文上略有修改**）

```java
@Test
public void testLocalCacheScope() throws Exception {
	SqlSession sqlSession1 = factory.openSession(true); // 自动提交事务
	SqlSession sqlSession2 = factory.openSession(true); // 自动提交事务

    StudentMapper studentMapper1 = sqlSession1.getMapper(StudentMapper.class);
    StudentMapper studentMapper2 = sqlSession2.getMapper(StudentMapper.class);

	System.out.println("studentMapper1读取数据: " + studentMapper1.getStudentById(1));
	System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));
	System.out.println("studentMapper2更新了" + studentMapper2.updateStudentName("小岑",1) + "个学生的数据");
	System.out.println("studentMapper1读取数据: " + studentMapper1.getStudentById(1));
	System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));

}
```
输出如下

```sql
DEBUG [main] - Cache Hit Ratio [mapper.StudentMapper]: 0.0
DEBUG [main] - ==>  Preparing: SELECT id,name,age FROM student WHERE id = ? 
DEBUG [main] - ==> Parameters: 1(Integer)
TRACE [main] - <==    Columns: id, name, age
TRACE [main] - <==        Row: 1, 凯伦, 16
DEBUG [main] - <==      Total: 1
studentMapper1读取数据: StudentEntity{id=1, name='凯伦', age=16, className='null'}
DEBUG [main] - Cache Hit Ratio [mapper.StudentMapper]: 0.0
DEBUG [main] - ==>  Preparing: SELECT id,name,age FROM student WHERE id = ? 
DEBUG [main] - ==> Parameters: 1(Integer)
TRACE [main] - <==    Columns: id, name, age
TRACE [main] - <==        Row: 1, 凯伦, 16
DEBUG [main] - <==      Total: 1
studentMapper2读取数据: StudentEntity{id=1, name='凯伦', age=16, className='null'}
DEBUG [main] - ==>  Preparing: UPDATE student SET name = ? WHERE id = ? 
DEBUG [main] - ==> Parameters: 小岑(String), 1(Integer)
DEBUG [main] - <==    Updates: 1
studentMapper2更新了1个学生的数据
DEBUG [main] - Cache Hit Ratio [mapper.StudentMapper]: 0.0
studentMapper1读取数据: StudentEntity{id=1, name='凯伦', age=16, className='null'}
DEBUG [main] - Cache Hit Ratio [mapper.StudentMapper]: 0.0
DEBUG [main] - ==>  Preparing: SELECT id,name,age FROM student WHERE id = ? 
DEBUG [main] - ==> Parameters: 1(Integer)
TRACE [main] - <==    Columns: id, name, age
TRACE [main] - <==        Row: 1, 小岑, 16
DEBUG [main] - <==      Total: 1
studentMapper2读取数据: StudentEntity{id=1, name='小岑', age=16, className='null'}
```
sqlSession1和sqlSession2读的时相同的数据，但是都查询了数据库，说明了**一级缓存只在数据库会话层面共享**

sqlSession2更新了id为1的学生的姓名，从凯伦改为了小岑，但sqlSession1之后的查询中，id为1的学生的名字还是凯伦，出现了脏数据，也证明了之前的设想，一级缓存只在数据库会话层面共享

## 一级缓存
一级缓存的生命周期与SqlSession相同，如果你对SqlSession不熟悉，你可以把它类比为JDBC编程中的Connection，即数据库的一次会话。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227125936919.png?)

要想了解缓存，就必须得了解一下Executor，这个Executor是干嘛的呢？你可以理解为要执行的SQL都会经过这个类的方法，在这个类的方法中调用StatementHandler最终执行SQL

Executor的实现也是一个典型的装饰者模式

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200226193855498.png?)

我相信你已经看出来，SimpleExecutor，BatchExecutor是具体组件实现类，而CachingExecutor是具体的装饰器。可以看到具体组件实现类有一个父类BaseExecutor，而这个父类是一个模板模式的典型应用，操作一级缓存的操作都在这个类中，而具体的操作数据库的功能则让子类去实现。

至此终于搞明白了，一级缓存的所有操作都在BaseExecutor这个类中啊，看看具体操作

query方法

```java
  @Override
  public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
    BoundSql boundSql = ms.getBoundSql(parameter);
    CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
    return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
 }
```
当执行select操作，会先生成一个CacheKey，如果根据CacheKey能从HashMap中拿到值则放回，如果拿不到值则先查询数据库，从数据库中查出来后再放到HashMap中。追一下
query方法就知道了，代码就不贴了，比较简单

update方法

```java
  @Override
  public int update(MappedStatement ms, Object parameter) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing an update").object(ms.getId());
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    clearLocalCache();
    return doUpdate(ms, parameter);
  }
```
当执行update操作时，可以看到会调用clearLocalCache()方法，而这个方法则会清空一级缓存，即清空HashMap

## 总结
1. MyBatis一级缓存的生命周期和SqlSession一致。
2. MyBatis一级缓存内部设计简单，只是一个没有容量限定的HashMap，在缓存的功能性上有所欠缺。
3. MyBatis的一级缓存最大范围是SqlSession内部，有多个SqlSession或者分布式的环境下，数据库写操作会引起脏数据，建议设定缓存级别为Statement，即进行如下配置

```xml
<setting name="localCacheScope" value="STATEMENT"/>
```
原因也很简单，看BaseExecutor的query()方法，当配置成STATEMENT时，每次查询完都会清空缓存

```java
   if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
	// issue #482
	clearLocalCache();
  }
```

mybatis和spring整合的一些注意事项

1. 在未开启事物的情况之下，每次查询，spring都会关闭旧的sqlSession而创建新的sqlSession，因此此时的一级缓存是没有起作用的
2. 在开启事物的情况之下，spring使用threadLocal获取当前资源绑定同一个sqlSession，因此此时一级缓存是有效的
## CacheKey
前面说到缓存的key是CacheKey对象，因为Mybatis中涉及动态SQL等多方面的因素，缓存的key不能仅仅通过String来表示，而是通过一个updateList，只有updateList的元素完全相同，则认为这2个CacheKey相同

```java
public class CacheKey implements Cloneable, Serializable {

  // 参与hash计算的乘数
  private final int multiplier;
  // CacheKey的hash值，在update函数中实时运算出来的，这些值都是为了方便更快的比较，具体可以看equals函数
  private int hashcode;
  // 校验和，hash值的和
  private long checksum;
  // updateList中的元素个数
  private int count;
  // 将判等的对象放到这个list中
  private List<Object> updateList;
}
```
CacheKey的其他属性都是为了加快比较的速度，具体可以看这个类的equals函数

CacheKey的updateList放置了如下几个对象

1. mappedStatment的id
2. 指定查询结构集的范围
3. 查询所使用SQL语句
4. 用户传递给SQL语句的实际参数值


怎么知道CacheKey是这些对象呢？你可以参考BaseExecutor的createCacheKey方法

```java
  @Override
  public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql) {
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    CacheKey cacheKey = new CacheKey();
    cacheKey.update(ms.getId());
    cacheKey.update(rowBounds.getOffset());
    cacheKey.update(rowBounds.getLimit());
    cacheKey.update(boundSql.getSql());
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    TypeHandlerRegistry typeHandlerRegistry = ms.getConfiguration().getTypeHandlerRegistry();
    // mimic DefaultParameterHandler logic
    for (ParameterMapping parameterMapping : parameterMappings) {
      if (parameterMapping.getMode() != ParameterMode.OUT) {
        Object value;
        String propertyName = parameterMapping.getProperty();
        if (boundSql.hasAdditionalParameter(propertyName)) {
          value = boundSql.getAdditionalParameter(propertyName);
        } else if (parameterObject == null) {
          value = null;
        } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
          value = parameterObject;
        } else {
          MetaObject metaObject = configuration.newMetaObject(parameterObject);
          value = metaObject.getValue(propertyName);
        }
        cacheKey.update(value);
      }
    }
    if (configuration.getEnvironment() != null) {
      // issue #176
      cacheKey.update(configuration.getEnvironment().getId());
    }
    return cacheKey;
  }
```
## 测试二级缓存
**测试的具体过程引用自参考博客**

二级缓存是基于namespace实现的，即一个mapper映射文件用一个缓存

在本实验中，id为1的学生名称初始化为点点。

### 实验1
测试二级缓存效果，不提交事务，sqlSession1查询完数据后，sqlSession2相同的查询是否会从缓存中获取数据。

```java
@Test
public void testCacheWithoutCommitOrClose() throws Exception {
        SqlSession sqlSession1 = factory.openSession(true); 
        SqlSession sqlSession2 = factory.openSession(true); 
        
        StudentMapper studentMapper = sqlSession1.getMapper(StudentMapper.class);
        StudentMapper studentMapper2 = sqlSession2.getMapper(StudentMapper.class);

        System.out.println("studentMapper读取数据: " + studentMapper.getStudentById(1));
        System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));
}
```
执行结果：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227103940325.png?)

我们可以看到，当sqlsession没有调用commit()方法时，二级缓存并没有起到作用。

### 实验2
测试二级缓存效果，当提交事务时，sqlSession1查询完数据后，sqlSession2相同的查询是否会从缓存中获取数据。

```java
@Test
public void testCacheWithCommitOrClose() throws Exception {
        SqlSession sqlSession1 = factory.openSession(true); 
        SqlSession sqlSession2 = factory.openSession(true); 
        
        StudentMapper studentMapper = sqlSession1.getMapper(StudentMapper.class);
        StudentMapper studentMapper2 = sqlSession2.getMapper(StudentMapper.class);

        System.out.println("studentMapper读取数据: " + studentMapper.getStudentById(1));
        sqlSession1.commit();
        System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227104027877.png?)

从图上可知，sqlsession2的查询，使用了缓存，缓存的命中率是0.5。

### 实验3
测试update操作是否会刷新该namespace下的二级缓存。

```java
@Test
public void testCacheWithUpdate() throws Exception {
        SqlSession sqlSession1 = factory.openSession(true); 
        SqlSession sqlSession2 = factory.openSession(true); 
        SqlSession sqlSession3 = factory.openSession(true); 
        
        StudentMapper studentMapper = sqlSession1.getMapper(StudentMapper.class);
        StudentMapper studentMapper2 = sqlSession2.getMapper(StudentMapper.class);
        StudentMapper studentMapper3 = sqlSession3.getMapper(StudentMapper.class);
        
        System.out.println("studentMapper读取数据: " + studentMapper.getStudentById(1));
        sqlSession1.commit();
        System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));
        
        studentMapper3.updateStudentName("方方",1);
        sqlSession3.commit();
        System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentById(1));
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227104059760.png?)

我们可以看到，在sqlSession3更新数据库，并提交事务后，sqlsession2的StudentMapper namespace下的查询走了数据库，没有走Cache。

### 实验4
验证MyBatis的二级缓存不适应用于映射文件中存在多表查询的情况。

```sql
CREATE TABLE `student` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `age` tinyint(3) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


INSERT INTO `student` (`id`, `name`, `age`) 
VALUES (1,'点点',16),(2,'平平',16),(3,'美美',16),(4,'团团',16);

CREATE TABLE `class` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO `class` (`id`, `name`) VALUES (1,'一班'),(2,'二班');

CREATE TABLE `classroom` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO `classroom` (`id`, `class_id`, `student_id`)
VALUES (1,1,1),(2,1,2),(3,2,3),(4,2,4);

```
getStudentByIdWithClassInfo的定义如下
```sql
<select id="getStudentByIdWithClassInfo" parameterType="int" resultType="entity.StudentEntity">
	SELECT  s.id,s.name,s.age,class.name as className
	FROM classroom c
	JOIN student s ON c.student_id = s.id
	JOIN class ON c.class_id = class.id
	WHERE s.id = #{id};
</select>
```

通常我们会为每个单表创建单独的映射文件，由于MyBatis的二级缓存是基于namespace的，多表查询语句所在的namspace无法感应到其他namespace中的语句对多表查询中涉及的表进行的修改，引发脏数据问题。

```java
@Test
public void testCacheWithDiffererntNamespace() throws Exception {
    SqlSession sqlSession1 = factory.openSession(true); 
    SqlSession sqlSession2 = factory.openSession(true); 
    SqlSession sqlSession3 = factory.openSession(true); 
    
    StudentMapper studentMapper = sqlSession1.getMapper(StudentMapper.class);
    StudentMapper studentMapper2 = sqlSession2.getMapper(StudentMapper.class);
    ClassMapper classMapper = sqlSession3.getMapper(ClassMapper.class);
        
    System.out.println("studentMapper读取数据: " + studentMapper.getStudentByIdWithClassInfo(1));
    sqlSession1.close();
    System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentByIdWithClassInfo(1));

    classMapper.updateClassName("特色一班",1);
    sqlSession3.commit();
    System.out.println("studentMapper2读取数据: " + studentMapper2.getStudentByIdWithClassInfo(1));
}
```

执行结果：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227104138169.png?)

在这个实验中，我们引入了两张新的表，一张class，一张classroom。class中保存了班级的id和班级名，classroom中保存了班级id和学生id。我们在StudentMapper中增加了一个查询方法getStudentByIdWithClassInfo，用于查询学生所在的班级，涉及到多表查询。在ClassMapper中添加了updateClassName，根据班级id更新班级名的操作。

当sqlsession1的studentmapper查询数据后，二级缓存生效。保存在StudentMapper的namespace下的cache中。当sqlSession3的classMapper的updateClassName方法对class表进行更新时，updateClassName不属于StudentMapper的namespace，所以StudentMapper下的cache没有感应到变化，没有刷新缓存。当StudentMapper中同样的查询再次发起时，从缓存中读取了脏数据。

### 实验5
为了解决实验4的问题呢，可以使用Cache ref，让ClassMapper引用StudenMapper命名空间，这样两个映射文件对应的SQL操作都使用的是同一块缓存了。

mapper文件中的配置如下

```xml
<cache-ref namespace="mapper.StudentMapper"/>
```

执行结果：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227104158923.png?)

不过这样做的后果是，缓存的粒度变粗了，多个Mapper namespace下的所有操作都会对缓存使用造成影响。
## 二级缓存的实现
前面说了一级缓存的实现在BaseExecutor中，那么二级缓存的实现在哪呢？提示一下，前面提到的Executor。没错，就是CachingExecutor。下面详细介绍一下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200227125734570.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

二级缓存的相关配置有如下3个

**1.mybatis-config.xml**

```java
<settings>
	<setting name="cacheEnabled" value="true"/>
</settings>
```
这个是二级缓存的总开关，只有当该配置项设置为true时，后面两项的配置才会有效果

从Configuration类的newExecutor方法可以看到，当cacheEnabled为true，就用缓存装饰器装饰一下具体组件实现类，从而让二级缓存生效
```java
// 开启二级缓存，用装饰器模式装饰一下
if (cacheEnabled) {
  executor = new CachingExecutor(executor);
}
```


**2.mapper映射文件中**
mapper映射文件中如果配置了\<cache\>和\<cache-ref\>中的任意一个标签，则表示开启了二级缓存功能，没有的话表示不开启

```xml
<cache type="" eviction="FIFO" size="512"></cache>
```

二级缓存的部分配置如上，type就是填写一个全类名，你看我上面画的图，二级缓存是用Cache表示的，一级缓存是用HashMap表示的。这就说明二级缓存的实现类你可以可以自己提供的，不一定得用默认的HashMap（**对，二级缓存默认是用HashMap实现的**），Mybatis能和Redis，ehcache整合的原因就在这

这个eviction表示缓存清空策略，可填选项如下
| 选项 | 解释                                                    | 装饰器类  |
| ---- | ------------------------------------------------------- | --------- |
| LRU  | 最近最少使用的:移除最长时间不被使用的对象               | LruCache  |
| FIFO | 先进先出:按对象进入缓存的顺序来移除它们                 | FifoCache |
| SOFT | 软引用:移除基于垃圾回收器状态和软引用规则的对象         | SoftCache |
| WEAK | 弱引用:更积极地移除基于垃圾收集器状态和弱引用规则的对象 | WeakCache |

可以看到在Mybatis中换缓存清空策略就是换装饰器。还有就是如果面试官让你写一个FIFO算法或者LRU算法，这不就是现成的实现吗？

**3.\<select\>节点中的useCache属性**

该属性表示查询产生的结果是否要保存的二级缓存中，useCache属性的默认值为true，这个配置可以将二级缓存细分到语句级别

CachingExecutor利用了2个组件TransactionalCacheManager和TransactionalCache来管理二级缓存，为什么要多这2个组件呢？因为二级缓存不像一级缓存那样查询完直接放入一级缓存，而是要等事务提交时才会将查询出来的数据放到二级缓存中。

**因为如果事务1查出来直接放到二级缓存，此时事务2从二级缓存中拿到了事务1缓存的数据，但是事务1回滚了，此时事务2不就发生了脏读了吗？**

二级缓存的具体实现也不难，追一下CachingExecutor，TransactionalCacheManager，TransactionalCache就明白了，可以参考《Mybatis技术内幕一书》

## 总结
1. MyBatis的二级缓存相对于一级缓存来说，实现了SqlSession之间缓存数据的共享
2. MyBatis在多表查询时，极大可能会出现脏数据，有设计上的缺陷，安全使用二级缓存的条件比较苛刻
3. 在分布式环境下，由于默认的MyBatis Cache实现都是基于本地的，分布式环境下必然会出现读取到脏数据，需要使用集中式缓存将MyBatis的Cache接口实现，有一定的开发成本，直接使用Redis、Memcached等分布式缓存可能成本更低，安全性也更高。

## 问题回答
1. **一级缓存和二级缓存的生命周期分别是？**
 一级缓存的生命周期是会话级别，因为一级缓存是存在Sqlsession的成员变量Executor的成员变量localCache中的。而二级缓存的生命周期是整个应用级别，因为二级缓存是存在Configuration对象中，而这个对象在应用启动后一直存在

2. **同时配置一级缓存和二级缓存后，先查询哪个缓存？**
当然是先查询二级缓存再查询一级缓存啊，因为一级缓存的实现在BaseExecutor，而二级缓存的实现在CachingExecutor，CachingExecutor是BaseExecutor的装饰器