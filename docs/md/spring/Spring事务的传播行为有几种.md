---
layout: post
title: Spring事务的传播行为有几种？
lock: need
---

# Spring AOP源码解析：Spring事务的传播行为有几种？

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/deb6a8236459c1a44db4eb3af6563610.jpeg)
## @Transactional注解属性

Spring事务支持两种方式，**编程式事务**和**声明式事务**，下面的例子使用**声明式事务**，即@Transactional注解的方式

| 属性名 | 类型 |描述|默认值|
|--|--|--|--|
|value（和transactionManager互为别名）|  String| 当在配置文件中有多个PlatformTransactionManager ，用该属性指定选择哪个事务管理器|空字符串""|
| propagation |枚举：Propagation| 事务的传播行为|REQUIRED|
| isolation |枚举：Isolation| 事务的隔离度 |DEFAULT|
| timeout | int|事务的超时时间。如果超过该时间限制但事务还没有完成，则自动回滚事务 |-1|
|readOnly | boolean| 指定事务是否为只读事务|false|
|rollbackFor  | Class[] |需要回滚的异常|空数组{}|
| rollbackForClassName |String[] |需要回滚的异常类名|空数组{}|
|noRollbackFor |Class[] |不需要回滚的异常  |空数组{}|
|noRollbackForClassName  | String[] |不需要回滚的异常类名|空数组{}|

## @Transactional可以用在哪里？
@Transactional可以用在**类，方法，接口**上

1. 用在类上，该类的所有public方法都具有事务
2. 用在方法上，方法具有事务。当类和方法同时配置事务的时候，方法的属性会覆盖类的属性
3. 用在接口或者接口方法上（不推荐），因为只有在使用基于接口的 JDK 动态代理时才会生效，如果使用cglib来实现动态代理，会导致@Transactional注解失效
## @Transactional失效的场景

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/32ad27eb593f4795b416d37701b1de32.png)
## Spring事务的传播行为

**Spring事务的传播行为定义了当一个事务方法被另一个事务方法调用时，该如何处理事务的边界**

Spring事务的传播行为在Propagation枚举类中定义了如下几种选择

**支持当前事务**

- REQUIRED（默认） ：如果当前存在事务，则加入该事务。如果当前没有事务，则创建一个新的事务
- SUPPORTS：如果当前存在事务，则加入该事务 。如果当前没有事务， 则以非事务的方式继续运行
- MANDATORY  ：如果当前存在事务，则加入该事务 。如果当前没有事务，则抛出异常

**不支持当前事务**

- REQUIRES_NEW ：创建一个新事务，如果当前存在事务，则把当前事务挂起
- NOT_SUPPORTED ： 以非事务方式运行，如果当前存在事务，则把当前事务挂起
- NEVER ： 以非事务方式运行，如果当前存在事务，则抛出异常

**其他情况**

- NESTED ：如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来执行 。如果当前没有事务，则该取值等价于REQUIRED

以NESTED启动的事务内嵌于外部事务中 （如果存在外部事务的话），此时内嵌事务并不是一个独立的事务，它依赖于外部事务。只有通过外部事务的提交，才能引起内部事务的提交，嵌套的子事务不能单独提交

## 事务传播行为解决的三个痛点

假设我们有一个下单流程，包含三个步骤：

1. 创建订单（OrderService.create()）
2. 扣减库存（StockService.deduct()）
3. 记录日志（LogService.saveLog()）

这三个方法各自都有 @Transactional 注解，因为它们都可以被单独调用。现在，我们用一个大方法把它们组合起来：

```java
@Transactional
public void placeOrder() {
    orderService.create(); // 步骤 1
    stockService.deduct(); // 步骤 2
    logService.saveLog();   // 步骤 3
}
```

当外层的 placeOrder 被调用时，由于传播行为的存在，Spring 才能精确控制以下几种不同的业务核心诉求

### 痛点一：如何做到数据一致性

**诉求**：如果库存扣减失败（库存不足），那么已经创建的订单必须取消。

**传播行为的解决方案**：默认的 REQUIRED。

**原理**：当 placeOrder 开启事务后，后面的 create() 和 deduct() 发现外层已经有事务了，就会主动加入这个事务。它们合为一体，只要任何一个地方报错，整个大事务全部回滚。保证了“订单”和“库存”的数据一致性
### 痛点二：如何做到非核心业务隔离
**诉求**：日志记录（步骤3）只是为了审计，不能因为日志系统报错导致用户订单下单失败；反过来，哪怕下单由于库存不足回滚了，购买失败的日志也必须成功写入数据库

**传播行为的解决方案**：REQUIRES_NEW

**原理**：如果给 saveLog() 配置了 REQUIRES_NEW，当程序运行到这一步时，Spring 会把 placeOrder 的事务暂时挂起，为日志单独开辟一个全新的事务。日志事务提交后，再恢复主事务。这样，日志和下单就彻底解耦了，互不影响
### 痛点三：如何做到局部回滚
**诉求**：下单时会给用户发一张优惠券（额外福利）。如果发券由于网络超时失败了，下单不应该失败；但如果下单本身失败了，券肯定不能发。

**传播行为的解决方案**：NESTED（嵌套事务）。

**原理**：发券方法作为“子事务”运行。如果发券失败，主事务可以捕获异常，只让发券的操作回滚到 Savepoint（保存点），下单依然可以正常提交。但如果下单失败，主事务回滚，子事务也会被连带回滚
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