---
layout: post
title: Spring声明式事务在那些情况下会失效？
lock: need
---

# 面试官：Spring声明式事务在那些情况下会失效？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210411164521872.jpg?)
## 编程式事务
在Spring中事务管理的方式有两种，编程式事务和声明式事务。先详细介绍一下两种事务的实现方式

配置类

```java
@Configuration
@EnableTransactionManagement
@ComponentScan("com.javashitang")
public class AppConfig {

    @Bean
    public DruidDataSource dataSource() {
        DruidDataSource ds = new DruidDataSource();
        ds.setDriverClassName("com.mysql.jdbc.Driver");
        ds.setUrl("jdbc:mysql://localhost:3306/test?characterEncoding=utf8&useSSL=true");
        ds.setUsername("test");
        ds.setPassword("test");
        ds.setInitialSize(5);
        return ds;
    }

    @Bean
    public DataSourceTransactionManager dataSourceTransactionManager() {
        return new DataSourceTransactionManager(dataSource());
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public TransactionTemplate transactionTemplate() {
        return new TransactionTemplate(dataSourceTransactionManager());
    }
}
```

```java
public interface UserService {
    void addUser(String name, String location);
    default void doAdd(String name) {};
}
```

```java
@Service
public class UserServiceV1Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private TransactionTemplate transactionTemplate;

    @Override
    public void addUser(String name, String location) {
        transactionTemplate.execute(new TransactionCallbackWithoutResult() {

            @Override
            protected void doInTransactionWithoutResult(TransactionStatus status) {
                try {
                    String sql = "insert into user (`name`) values (?)";
                    jdbcTemplate.update(sql, new Object[]{name});
                    throw new RuntimeException("保存用户信息失败");
                } catch (Exception e) {
                    e.printStackTrace();
                    status.setRollbackOnly();
                }
            }
        });
    }
}
```
可以看到编程式事务的方式并不优雅，因为业务代码和事务代码耦合到一块，当发生异常的时候还得需要手动回滚事务（比使用JDBC方便多类，JDBC得先关闭自动自动提交，然后根据情况手动提交或者回滚事务）

如果让你优化事务方法的执行？你会如何做？

**其实我们完全可以用AOP来优化这种代码，设置好切点，当方法执行成功时提交事务，当方法发生异常时回滚事务，这就是声明式事务的实现原理**

使用AOP后，当我们调用事务方法时，会调用到生成的代理对象，代理对象中加入了事务提交和回滚的逻辑。

## 声明式事务
Spring aop动态代理的方式有如下几种方法
1. JDK动态代理实现（基于接口）（JdkDynamicAopProxy）
2. CGLIB动态代理实现（动态生成子类的方式）（CglibAopProxy）
3. AspectJ适配实现

spring aop默认只会使用JDK和CGLIB来生成代理对象
### @Transactional可以用在哪里？
@Transactional可以用在类，方法，接口上

1. 用在类上，该类的所有public方法都具有事务
2. 用在方法上，方法具有事务。当类和方法同时配置事务的时候，方法的属性会覆盖类的属性
3. 用在接口上，一般不建议这样使用，因为只有基于接口的代理会生效，如果Spring AOP使用cglib来实现动态代理，会导致事务失效（因为注解不能被继承）

### @Transactional失效的场景
1. @Transactional注解应用到非public方法（除非特殊配置，例如使用AspectJ 静态织入实现 AOP）
2. 自调用，因为@Transactional是基于动态代理实现的
3. 异常在代码中被你自己try catch了
4. 异常类型不正确，默认只支持RuntimeException和Error，不支持检查异常
5. 事务传播配置不符合业务逻辑
### @Transactional注解应用到非public方法
**为什么只有public方法上的@Transactional注解才会生效？**

首相JDK动态代理肯定只能是public，因为接口的权限修饰符只能是public。cglib代理的方式是可以代理protected方法的（private不行哈，子类访问不了父类的private方法）如果支持protected，可能会造成当切换代理的实现方式时表现不同，增大出现bug的可能醒，所以统一一下。

**如果想让非public方法也生效，你可以考虑使用AspectJ**

### 自调用，因为@Transactional是基于动态代理实现的
当自调用时，方法执行不会经过代理对象，所以会导致事务失效
```java
// 事务失效
@Service
public class UserServiceV2Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void addUser(String name, String location) {
        doAdd(name);
    }

    @Transactional
    public void doAdd(String name) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        throw new RuntimeException("保存用户失败");
    }
}
```
可以通过如下方式解决

1. @Autowired注入自己，假如为self，然后通过self调用方法
2. @Autowired ApplicationContext，从ApplicationContext通过getBean获取自己

```java
// 事务生效
@Service
public class UserServiceV2Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private UserService userService;

    @Override
    public void addUser(String name, String location) {
        userService.doAdd(name);
    }

    @Override
    @Transactional
    public void doAdd(String name) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        throw new RuntimeException("保存用户失败");
    }
}
```

### 异常在代码中被你自己try catch了
这个逻辑从源码理解比较清晰，只有当执行事务抛出异常才能进入completeTransactionAfterThrowing方法，这个方法里面有回滚的逻辑，如果事务方法都没抛出异常就只会正常提交

```java
// org.springframework.transaction.interceptor.TransactionAspectSupport#invokeWithinTransaction

try {
  // This is an around advice: Invoke the next interceptor in the chain.
  // This will normally result in a target object being invoked.
  // 执行事务方法
  retVal = invocation.proceedWithInvocation();
}
catch (Throwable ex) {
  // target invocation exception
  completeTransactionAfterThrowing(txInfo, ex);
  throw ex;
}
finally {
  cleanupTransactionInfo(txInfo);
}
```

### 异常类型不正确，默认只支持RuntimeException和Error，不支持检查异常
异常体系图如下。当抛出检查异常时，spring事务不会回滚。如果抛出任何异常都回滚，可以配置rollbackFor为Exception

```java
@Transactional(rollbackFor = Exception.class)
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210410163400402.jpg?)

## 事务传播配置不符合业务逻辑
假如说有这样一个场景，用户注册，依次保存用户基本信息到user表中，用户住址信息到地址表中，当保存用户住址信息失败时，我们也要保证用户信息注册成功。

```java
public interface LocationService {
    void addLocation(String location);
}
```

```java
@Service
public class LocationServiceImpl implements LocationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void addLocation(String location) {
        String sql = "insert into location (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{location});
        throw new RuntimeException("保存地址异常");
    }
}
```

```java
@Service
public class UserServiceV3Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private LocationService locationService;

    @Override
    @Transactional
    public void addUser(String name, String location) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        locationService.addLocation(location);
    }
}
```
调用发现user表和location表都没有插入数据，并不符合我们期望，你可能会说抛出异常了，事务当然回滚了。好，我们把调用locationService的部分加上try catch

```java
@Service
public class UserServiceV3Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private LocationService locationService;

    @Override
    @Transactional
    public void addUser(String name, String location) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        try {
            locationService.addLocation(location);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```
调用发现user表和location表还是都没有插入数据。这是因为在LocationServiceImpl中事务已经被标记成回滚了，所以最终事务还会回滚。

要想最终解决就不得不提到Spring的事务传播行为了，不清楚的小伙伴看《面试官：Spring事务的传播行为有几种？》

Transactional的事务传播行为默认为Propagation.REQUIRED。
**如果当前存在事务，则加入该事务。如果当前没有事务，则创建一个新的事务**

此时我们把LocationServiceImpl中Transactional的事务传播行为改成Propagation.REQUIRES_NEW即可

**创建一个新事务，如果当前存在事务，则把当前事务挂起**

所以最终的解决代码如下

```java 
@Service
public class UserServiceV3Impl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private LocationService locationService;

    @Override
    @Transactional
    public void addUser(String name, String location) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        try {
            locationService.addLocation(location);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

```java
@Service
public class LocationServiceImpl implements LocationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void addLocation(String location) {
        String sql = "insert into location (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{location});
        throw new RuntimeException("保存地址异常");
    }
}
```