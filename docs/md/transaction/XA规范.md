# 分布式事务解决方案：XA规范

![请添加图片描述](https://img-blog.csdnimg.cn/2f7c5d770943484ebaff94feaf938981.jpg?)

## XA规范
**二阶段提交协议是一个协议，而XA规范是X/Open 组织针对二阶段提交协议的实现做的规范。目前几乎所有的主流数据库都对XA规范提供了支持。**

这样做的好处是方便多个资源（如数据库，应用服务器，消息队列等）在同一个事务中访问。你可以类比JDBC

我们这篇文章就以MySQL XA为例演示一下XA怎么玩？

MySQL XA常用的命令如下
| 命令 | 解释 |
|--|--|
| XA START xid | 开启一个事务，并将事务置于ACTIVE状态，此后执行的SQL语句都将置于该事务中 |
|XA END xid  | 将事务置于IDLE状态，表示事务内的SQL操作完成 |
| XA PREPARE xid | 实现事务提交的准备工作，事务状态置于PREPARED状态。事务如果无法完成提交前的准备操作，该语句会执行失败 |
|XA COMMIT xid  | 事务最终提交，完成持久化 |
| XA ROLLBACK xid | 事务回滚终止 |
|XA RECOVER  | 查看MySQL中存在的PREPARED状态的xa事务 |

我们在db_account_1和db_account_2都建一个account_info表并初始化2条记录

```sql
CREATE TABLE `account_info`
(
    `id`      INT(11)      NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `user_id` VARCHAR(255) NOT NULL COMMENT '用户id',
    `balance` INT(11)      NOT NULL DEFAULT 0 COMMENT '用户余额',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;

INSERT INTO account_info (id, user_id, balance)
VALUES (1, '1001', 10000);
INSERT INTO account_info (id, user_id, balance)
VALUES (2, '1002', 10000);
```
我们以用户1001向1002转账200元为例
```sql
mysql> XA START "transfer_money";
Query OK, 0 rows affected (0.01 sec)
 
mysql> update account_info set balance = balance - 200 where user_id = '1001';
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0
mysql> XA END "transfer_money";
Query OK, 0 rows affected (0.01 sec)
 
mysql> XA PREPARE "transfer_money";
Query OK, 0 rows affected (0.01 sec)
 
mysql> XA COMMIT "transfer_money";
Query OK, 0 rows affected (0.01 sec)
```
在XA START执行后所有资源将会被锁定，直到执行了XA PREPARE或者XA COMMIT才会释放。

如果在这个时间段内另外一个事务执行如下语句则会一直被阻塞

```sql
update account_info set balance = balance - 200 where user_id = '1001';
```
**这就是XA规范这种解决方案很少被使用的原因，因为中间过程会锁定资源，很难支持高并发**

我们也可以将一个 IDLE 状态的 XA 事务可以直接提交或者回滚
```sql
mysql> XA COMMIT "transfer_money";
1399 - XAER_RMFAIL: The command cannot be executed when global transaction is in the  IDLE state
mysql> XA COMMIT "transfer_money" ONE PHASE;
Query OK, 0 rows affected (0.01 sec)
 
mysql> XA START "transfer_money";
Query OK, 0 rows affected (0.01 sec)
 
mysql> update account_info set balance = balance - 200 where user_id = '1001';
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0
mysql> XA END "transfer_money";
Query OK, 0 rows affected (0.01 sec)
 
mysql> XA COMMIT "transfer_money" ONE PHASE;
Query OK, 0 rows affected (0.01 sec)
```
XA事务变化图

![在这里插入图片描述](https://img-blog.csdnimg.cn/9365e4acb0154923979a62775989ebd4.png?)
## JTA
**JTA(Java Transaction API)，是J2EE的编程接口规范，它是XA规范的Java实现**相关的接口有如下2个

javax.transaction.TransactionManager（事务管理器的接口）：定义了有关事务的开始、提交、撤回等操作。
javax.transaction.xa.XAResource（满足XA规范的资源定义接口）：一种资源如果要支持JTA事务，就需要让它的资源实现该XAResource接口，并实现该接口定义的两阶段提交相关的接口

在Java中有很多框架都对XA规范进行了实现，我就演示一下最常用的实现atomikos和seata

**atomikos只能用在单个应用对多个库进行操作的场景。而seata所有的分布式事务场景都能用**
是什么造成这种差异呢？看Demo

## Atomikos实现XA规范
先加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jta-atomikos</artifactId>
    <version>2.1.14.RELEASE</version>
</dependency>
```
配置2个数据源
```yaml
spring:
  jta:
    atomikos:
      datasource:
        primary:
          borrow-connection-timeout: 10000.0
          max-lifetime: 20000.0
          max-pool-size: 25.0
          min-pool-size: 3.0
          unique-resource-name: test1
          xa-data-source-class-name: com.mysql.jdbc.jdbc2.optional.MysqlXADataSource
          xa-properties:
            password: test
            url: jdbc:mysql://myhost:3306/db_account_1
            user: test
        secondary:
          borrow-connection-timeout: 10000.0
          max-lifetime: 20000.0
          max-pool-size: 25.0
          min-pool-size: 3.0
          unique-resource-name: test2
          xa-data-source-class-name: com.mysql.jdbc.jdbc2.optional.MysqlXADataSource
          xa-properties:
            password: test
            url: jdbc:mysql://myhost:3306/db_account_2
            user: test
    enabled: true
```

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.jta.atomikos.datasource.primary")
    public DataSource primaryDataSource() {
        return new AtomikosDataSourceBean();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.jta.atomikos.datasource.secondary")
    public DataSource secondaryDataSource() {
        AtomikosDataSourceBean ds = new AtomikosDataSourceBean();
        return ds;
    }

    @Bean
    public JdbcTemplate primaryJdbcTemplate(
            @Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public JdbcTemplate secondaryJdbcTemplate(
            @Qualifier("secondaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

```java
@Service
public class AccountService {

    @Resource
    @Qualifier("primaryJdbcTemplate")
    private JdbcTemplate primaryJdbcTemplate;

    @Resource
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate secondaryJdbcTemplate;

    @Transactional(rollbackFor = Exception.class)
    public void tx1() {
        Integer money = 100;
        String sql = "update account_info set balance = balance + ? where user_id = ?";
        primaryJdbcTemplate.update(sql, new Object[]{-money, 1001});
        secondaryJdbcTemplate.update(sql, new Object[]{money, 1002});
    }

    @Transactional(rollbackFor = Exception.class)
    public void tx2() {
        Integer money = 100;
        String sql = "update account_info set balance = balance + ? where user_id = ?";
        primaryJdbcTemplate.update(sql, new Object[]{-money, 1001});
        secondaryJdbcTemplate.update(sql, new Object[]{money, 1002});
        throw new RuntimeException();
    }
}
```

```cpp
@RunWith(SpringRunner.class)
@SpringBootTest
public class AtomikosAtApplicationTests {

    @Resource
    private AccountService accountService;

	// 正常执行
    @Test
    public void test1() {
        accountService.tx1();
    }
    
    // 异常回滚
    @Test
    public void test2() {
        accountService.tx2();
    }
}
```
