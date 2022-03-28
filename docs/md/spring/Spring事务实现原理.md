---
layout: post
title: Spring事务实现原理
lock: need
---

# Spring AOP源码解析：Spring事务实现原理
![请添加图片描述](https://img-blog.csdnimg.cn/a02092f1ae01427a890e515656eda15f.png?)
## 不用Spring管理事务？
让我们先来看一下不用spring管理事务时，各种框架是如何管理事务的

使用JDBC来管理事务

![在这里插入图片描述](https://img-blog.csdnimg.cn/61656637c4d5403bb541799c0afc3ed7.png)

使用Hibernate来管理事务

![在这里插入图片描述](https://img-blog.csdnimg.cn/ac4ada2704a348b899c7d608581f65f6.png)

业务逻辑和事务代码是耦合到一块的，并且和框架的具体api绑定了。当我们换一种框架来实现时，里面对事务控制的代码就要推倒重写，并不一定能保证替换后的api和之前的api有相同的行为。

基于这些问题，Spring抽象了一些事务相关的顶层接口，我们面向接口编程，换框架时只要换具体的实现即可。有点像JDBC API的味道了

![在这里插入图片描述](https://img-blog.csdnimg.cn/fadb4885510447e5bcdafe54ec22c87b.png?)
| 常用api | 接口 |
|--|--|
| PlatformTransactionManager | 对事务进行管理 |
| TransactionDefinition | 定义事务的相关属性，例如隔离级别，传播行为 |
| TransactionStatus | 保存事务状态 |

针对不同的数据访问技术，使用不用的PlatformTransactionManager类即可
| 数据访问技术 | PlatformTransactionManager实现类 |
|--|--|
| JDBC/Mybatis | DataSourceTransactionManager |
|  Hibernate | HibernateTransactionManager |
| Jpa | JpaTransactionManager |
| Jms | JmsTransactionManager |
## 编程式事务管理
### 使用PlatformTransactionManager
![在这里插入图片描述](https://img-blog.csdnimg.cn/9e99691a970f416c87fba9779cb3037f.png?)
![在这里插入图片描述](https://img-blog.csdnimg.cn/7d42a7ec876a43859456c55b3b6c980a.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/14ca404fb896445db39ecfd916bec54a.png?)
### 使用TransactionTemplate
当我们直接使用PlatformTransactionManager来管理事务时，有很多模版代码。例如业务代码正常执行，提交事务，否则回滚事务。我们可以把这部分模版代码封装成一个模版类，这样使用起来就很方便了，如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/81222190a9904baea5d7fcc02e4d6f96.png?)
如下图所示，TransactionTemplate#execute方法就是一个典型的模版方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/f466e918eb61458f8aa46d50e9702c38.png?)
我们可以传入如下2个接口的实现类来执行业务逻辑，TransactionCallback（需要返回执行结果）或TransactionCallbackWithoutResult（不需要返回结果）
## 声明式事务管理
为了让使用更加简洁，Spring直接把事务代码的执行放到切面中了，我们只需要在业务代码方法上加上一个@Transactional注解即可，这种方式我们最常用哈
### 使用@Transactional注解
此时事务相关的定义我们就可以通过@Transactional注解来设置了
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
![在这里插入图片描述](https://img-blog.csdnimg.cn/38a1beb6e1c142c9a18021f92f6183c3.png?)
## 源码解析
我们需要在配置类上加上@EnableTransactionManagement注解，来开启spring事务管理功能，**@EnableTransactionManagement最主要的功能就是注入一个TransactionInterceptor拦截器，来控制事务开启，提交或者回滚**

ProxyTransactionManagementConfiguration
![在这里插入图片描述](https://img-blog.csdnimg.cn/471a7950f2b64115964ec3a681402868.png)
TransactionInterceptor#invoke
![在这里插入图片描述](https://img-blog.csdnimg.cn/44e40d0f948444c992c6890b5fb831cc.png?)
TransactionAspectSupport#invokeWithinTransaction
![在这里插入图片描述](https://img-blog.csdnimg.cn/3d3dd0f04d754710adfb8d8a3f7610e6.png?)
TransactionAspectSupport#createTransactionIfNecessary
![在这里插入图片描述](https://img-blog.csdnimg.cn/c1f5ca6b3d874d59908990ae8fe192f6.png?)
当开启事务的时候，可以看到各种传播属性的行为

AbstractPlatformTransactionManager#getTransaction
![在这里插入图片描述](https://img-blog.csdnimg.cn/18b9ecad8c8843439b2b9df85dff91b3.png?)

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