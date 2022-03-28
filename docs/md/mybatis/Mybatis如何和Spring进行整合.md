---
layout: post
title: Mybatis如何和Spring进行整合？
lock: need
---
# Mybatis源码解析：Mybatis如何和Spring进行整合？

![请添加图片描述](https://img-blog.csdnimg.cn/ccdc187697c7412a9ec67d8040ff089f.jpg?)
## Mybatis整合Spring比较重要的几个类
当我们整合spring和mybatis的时候，只需要在pom文件中增加如下依赖即可
```xml
<dependency>
  <groupId>org.mybatis</groupId>
  <artifactId>mybatis-spring</artifactId>
  <version>1.3.1</version>
</dependency>
```
然后增加一个配置类，手动注入SqlSessionTemplate和SqlSessionFactory即可，然后用@MapperScan指定mapper类所在的包名
```java
@Configuration
@MapperScan("com.javashitang.blog.dao")
public class MybatisConfig {

    @Bean
    public DataSource dataSource() {
        DruidDataSource ds = new DruidDataSource();
        ds.setDriverClassName("com.mysql.jdbc.Driver");
        ds.setUrl("jdbc:mysql://myhost:3306/test?characterEncoding=utf8&useSSL=true");
        ds.setUsername("test");
        ds.setPassword("test");
        return ds;
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource());
        sessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mappers/*.xml"));
        return sessionFactory.getObject();
    }
}
```
这几个类是如何整合的呢？我们来分析一下
### SqlSessionFactoryBean
单独使用mybatis时，SqlSessionFactoryBuilder会通过解析mybatis-config.xml，mapper.xml文件的内容，得到Configuration对象，然后创建SqlSessionFactory对象。

mybatis整合spring后，SqlSessionFactoryBean从application.yaml配置文件中加载mybatis相关的配置，并创建SqlSessionFactory对象
### SqlSessionTemplate

单独使用mybatis的时候，我们可以使用DefaultSqlSession或者SqlSessionManager来执行sql，当和spring集成时我们用SqlSessionTemplate来执行sql

DefaultSqlSession是线程不安全的，即DefaultSqlSession不能是单例的
而SqlSessionTemplate是线程安全的，那它是如何保证线程的呢？

SqlSessionTemplate执行sql的时候会交给sqlSessionProxy这个代理类来执行

SqlSessionTemplate#selectOne
![在这里插入图片描述](https://img-blog.csdnimg.cn/33abf8b473fa4285bd5030ddde118725.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/64605af381794154a901d04cceb6c8a7.png?)
所以当通过SqlSessionTemplate执行方法时，会调用到SqlSessionInterceptor#invoke方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/64d57bb6b3644f8187284f3e5746ec1c.png?)
执行过程也比较清晰，首先获取sqlSession，然后调用sqlSession的方法，最后关闭sqlSession

获取sqlSession分为如下2种情况
1. 如果要执行的方法不在事务中，则每次创建新的SqlSession
2. 如果要执行的方法在事务中，则会先从TransactionSynchronizationManager中获取（如果没有的话，先创建SqlSession，然后放到TransactionSynchronizationManager中，你可以把TransactionSynchronizationManager类比为ThreadLocal），这样就能保证一个事务中用到的SqlSession是同一个

因此当mybatis和spring整合的时候，如果没有事务，一级缓存会失效，如果有事务，一级缓存不会失效
![在这里插入图片描述](https://img-blog.csdnimg.cn/72b49cf86fc741e7952b582a883abc20.png?)
当执行完成，关闭sqlSession的时候

如果sqlSession在事务中，只会减少引用的数量，并不会关闭sqlSession，当事务都执行完毕才会关闭sqlSession
如果sqlSession不在事务中，则会关闭sqlSession
### @MapperScan
当我们不使用@MapperScan注解的时候，需要手动往容器中注入mapper实现类
```java
@Bean
public BlogUserMapper blogUserMapper(SqlSessionTemplate sqlSessionTemplate) {
    return sqlSessionTemplate.getMapper(BlogUserMapper.class);
}
```
当用了@MapperScan注解后，就可以指定包名，然后自动注入，每个mapper接口的实现类会被封装为MapperFactoryBean类
### MapperFactoryBean
MapperFactoryBean实现了FactoryBean接口，所以会调用getObject方法获取工厂生产的对象，可以看到和我们手动注入的方式没什么差别

![在这里插入图片描述](https://img-blog.csdnimg.cn/6a4f6eac08644db48f28b3424094ebaa.png)