---
layout: post
title: Spring事务的传播行为有几种？
lock: need
---

# 面试官：Spring事务的传播行为有几种？

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020031009125057.jpg?)
## @Transactional注解属性

Spring事务支持两种方式，**编程式事务**和**声明式事务**，下面的例子使用**声明式事务**，即@Transactional注解的方式

| 属性名                                | 类型              | 描述                                                         | 默认值     |
| ------------------------------------- | ----------------- | ------------------------------------------------------------ | ---------- |
| value（和transactionManager互为别名） | String            | 当在配置文件中有多个PlatformTransactionManager ，用该属性指定选择哪个事务管理器 | 空字符串"" |
| propagation                           | 枚举：Propagation | 事务的传播行为                                               | REQUIRED   |
| isolation                             | 枚举：Isolation   | 事务的隔离度                                                 | DEFAULT    |
| timeout                               | int               | 事务的超时时间。如果超过该时间限制但事务还没有完成，则自动回滚事务 | -1         |
| readOnly                              | boolean           | 指定事务是否为只读事务                                       | false      |
| rollbackFor                           | Class[]           | 需要回滚的异常                                               | 空数组{}   |
| rollbackForClassName                  | String[]          | 需要回滚的异常类名                                           | 空数组{}   |
| noRollbackFor                         | Class[]           | 不需要回滚的异常                                             | 空数组{}   |
| noRollbackForClassName                | String[]          | 不需要回滚的异常类名                                         | 空数组{}   |

## @Transactional可以用在哪里？
@Transactional可以用在**类，方法，接口**上

 1. 用在类上，该类的所有public方法都具有事务
 2. 用在方法上，方法具有事务。当类和方法同时配置事务的时候，方法的属性会覆盖类的属性
 3. 用在接口上，一般不建议这样使用，因为如果Spring AOP使用cglib来实现动态代理，会导致@Transactional注解失效
## @Transactional失效的场景
1. @Transactional注解应用到非public方法
2. 自调用，因为@Transactional是基于动态代理实现的
3. 异常在代码中被你自己try catch了


## Spring事务的传播行为
@Transactional的其他属性都比较容易理解，详细分析一下事务的传播行为

Spring事务的传播行为在Propagation枚举类中定义了如下几种选择

**支持当前事务**

 - REQUIRED ：如果当前存在事务，则加入该事务。如果当前没有事务，则创建一个新的事务
 - SUPPORTS：如果当前存在事务，则加入该事务 。如果当前没有事务， 则以非事务的方式继续运行
 - MANDATORY  ：如果当前存在事务，则加入该事务 。如果当前没有事务，则抛出异常

**不支持当前事务**

 - REQUIRES_NEW ：创建一个新事务，如果当前存在事务，则把当前事务挂起
 - NOT_SUPPORTED ： 以非事务方式运行，如果当前存在事务，则把当前事务挂起
 - NEVER ： 以非事务方式运行，如果当前存在事务，则抛出异常

**其他情况**

 - NESTED ：如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来执行 。如果当前没有事务，则该取值等价于REQUIRED

以NESTED启动的事务内嵌于外部事务中 （如果存在外部事务的话），此时内嵌事务并不是一个独立的事务，它依赖于外部事务。只有通过外部事务的提交，才能引起内部事务的提交，嵌套的子事务不能单独提交

## 代码演示
建立如下2张表

```sql
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

```sql
CREATE TABLE `location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

```java
public interface LocationService {
    void addLocation(String location);
}
```

```java
@Component
public class LocationServiceImpl implements LocationService {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void addLocation(String location) {
        String sql = "insert into location (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{location});
        throw new RuntimeException("保存地址异常");
    }
}
```

```java
public interface UserService {
    void addUser(String name, String location);
}
```

```java
@Component
public class UserServiceImpl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private LocationService locationService;

    @Override
    public void addUser(String name, String location) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        locationService.addLocation(location);
    }
}
```
接下来我们就通过演示在addLocation和addUser方法上加不同属性的@Transactional注解来演示spring事务的传播行为
### REQUIRED

> 如果当前存在事务，则加入该事务。如果当前没有事务，则创建一个新的事务

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.REQUIRED)
addLocation(String location)
```

结果：user正常插入，location没有插入

**当前有事务**
```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.REQUIRED)
addLocation(String location)
```
结果：
1. addUser在调用addLocation时加了try catch，user和location表都没有插入
2. addUser在调用addLocation时没加try catch，user和location表都没有插入

结论：因为虽然在2个方法上加了事务注解看起来像2个事务，可是在底层数据库看来是一个事务，只要有一个回滚，则都会回滚

### SUPPORTS
> 如果当前存在事务，则加入该事务 。如果当前没有事务， 则以非事务的方式继续运行

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.SUPPORTS)
addLocation(String location)
```

结果：虽然addLocation抛出异常，但是user和location都正常插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.SUPPORTS)
addLocation(String location)
```

结果：user和location都没有插入
### MANDATORY
>如果当前存在事务，则加入该事务 。如果当前没有事务，则抛出异常

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.MANDATORY)
addLocation(String location)
```

结果：addLocation抛出IllegalTransactionStateException异常，user正常插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.MANDATORY)
addLocation(String location)
```

结果：user和location都没有插入
### REQUIRES_NEW
> 创建一个新事务，如果当前存在事务，则把当前事务挂起

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.REQUIRES_NEW)
addLocation(String location)
```

结果：user正常插入，location没有插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.REQUIRES_NEW)
addLocation(String location)
```

结果:

 1. addUser调用addLocation时加了try catch，则user正常插入，location没有插入
 2. addUser调用addLocation时没加try catch，user和location都没有插入

结论：REQUIRES_NEW是创建新的事务运行，因此addUser和addLocation是2个独立的事务
### NOT_SUPPORTED 
>以非事务方式运行，如果当前存在事务，则把当前事务挂起

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.NOT_SUPPORTED)
addLocation(String location)
```

结果：user和location都正常插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.NOT_SUPPORTED)
addLocation(String location)
```

结果：
1. addUser调用addLocation时没加try catch，location正常插入，user没有插入
2. addUser调用addLocation时加了try catch，user和location都正常插入
### NEVER 
> 以非事务方式运行，如果当前存在事务，则抛出异常

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.NEVER)
addLocation(String location)
```

结果：user和location都正常插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.NEVER)
addLocation(String location)
```

结果：

1. addUser调用addLocation时没加try catch，addLocation抛出IllegalTransactionStateException，user和location都没有插入
2. addUser调用addLocation时加了try catch，addLocation抛出IllegalTransactionStateException，user正常插入，location没有插入
### NESTED 
>如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来执行 。如果当前没有事务，则该取值等价于REQUIRED

**当前没有事务**

```java
// 没有注解
addUser(String name, String location)

@Transactional(propagation = Propagation.NESTED)
addLocation(String location)
```
结果：user正常插入，location没有插入

**当前有事务**

```java
@Transactional(propagation = Propagation.REQUIRED)
addUser(String name, String location)

@Transactional(propagation = Propagation.NESTED)
addLocation(String location)
```
结果：
1. addUser调用addLocation时加了try catch，user成功插入，location没有插入
2. addUser调用addLocation时没加try catch，user和location都没有成功插入

我们把上面的代码改成如下，保存用户时发生异常。保存地址时不会发生异常

```java
@Component
public class LocationServiceImpl implements LocationService {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(propagation = Propagation.NESTED)
    public void addLocation(String location) {
        String sql = "insert into location (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{location});
    }
}
```

```java
@Component
public class UserServiceImpl implements UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private LocationService locationService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void addUser(String name, String location) {
        String sql = "insert into user (`name`) values (?)";
        jdbcTemplate.update(sql, new Object[]{name});
        locationService.addLocation(location);
        throw new RuntimeException("保存用户异常");
    }
}
```
结果：user和location都没有插入

结论：嵌套事务,  它是已经存在事务的子事务， 嵌套事务开始执行时,  它将取得一个savepoint。 如果这个嵌套事务失败, 将回滚到此savepoint。 嵌套事务是外部事务的一部分, 只有外部事务正常提交它才会被提交。使用NESTED 有限制，它只支持 JDBC，且数据库要支持 savepoint 保存点，还要 JDBC 的驱动在3.0以上