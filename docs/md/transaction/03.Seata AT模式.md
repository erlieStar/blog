# 分布式事务解决方案：Seata AT模式

 ![请添加图片描述](https://img-blog.csdnimg.cn/1e49be1cc26545aa8c59621dc4811606.jpg?)
## Seata AT模式的demo
Seata AT和XA模式的代码基本上一摸一样，就是开启数据源代理的时候不用在指定模式了，因为默认为AT模式

我们以seata-at-tm项目向seata-at-rm项目转账为例演示一下seata at模式的使用，seata at模式更多的细节我们在后续的源码分析文章中介绍哈

另外还需要在db_account_1和db_account_2库中建如下两张表，seata框架会用到
```sql
CREATE TABLE `undo_log`
(
    `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
    `branch_id`     bigint(20)   NOT NULL,
    `xid`           varchar(100) NOT NULL,
    `context`       varchar(128) NOT NULL,
    `rollback_info` longblob     NOT NULL,
    `log_status`    int(11)      NOT NULL,
    `log_created`   datetime     NOT NULL,
    `log_modified`  datetime     NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;
```
### seata-at-tm
application.yaml

```yaml
server:
  port: 30002

spring:
  application:
    name: seata-at-tm
  datasource:
    driverClassName: com.mysql.jdbc.Driver
    url : jdbc:mysql://myhost:3306/db_account_1?useUnicode=true&characterEncoding=utf8
    username: test
    password: test

seata:
  enabled: true
  application-id: ${spring.application.name}
  tx-service-group: my_test_tx_group
  service:
    vgroup-mapping:
      my_test_tx_group: default
    grouplist:
      default: myhost:18091
    disable-global-transaction: false
  config:
    type: file
    file:
      name: file.conf
  registry:
    type: file
    file:
      name: file.conf
```

```java
@EnableFeignClients
@SpringBootApplication
@EnableAutoDataSourceProxy
public class SeataAtTm {

    public static void main(String[] args) {
        SpringApplication.run(SeataAtTm.class, args);
    }

```

```java
@RestController
@RequestMapping("account")
public class AccountController {

    @Resource
    private JdbcTemplate jdbcTemplate;
    @Resource
    private RmAccountClient rmAccountClient;

    @GlobalTransactional
    @RequestMapping("transfer")
    public String transfer(@RequestParam("fromUserId") String fromUserId,
                           @RequestParam("toUserId") String toUserId,
                           @RequestParam("money") Integer money,
                           @RequestParam(value = "flag", required = false) Boolean flag) {
        String sql = "update account_info set balance = balance + ? where user_id = ?";
        jdbcTemplate.update(sql, new Object[]{-money, fromUserId});
        String result = rmAccountClient.transfer(fromUserId, toUserId, money);
        if ("fail".equals(result)) {
            throw new RuntimeException("转账失败");
        }
        if (flag != null && flag) {
            throw new RuntimeException("测试同时回滚");
        }
        return "success";
    }
}
```
老规矩，直接指定服务地址，就不用注册中心了哈
```java
@FeignClient(value = "seata-at-rm", url = "http://127.0.0.1:30001")
public interface RmAccountClient {

    @RequestMapping("account/transfer")
    String transfer(@RequestParam("fromUserId") String fromUserId,
                    @RequestParam("toUserId") String toUserId,
                    @RequestParam("money") Integer money);

}
```
### seata-at-rm
application.yaml

```yaml
server:
  port: 30001

spring:
  application:
    name: seata-at-rm
  datasource:
    driverClassName: com.mysql.jdbc.Driver
    url : jdbc:mysql://myhost:3306/db_account_2?useUnicode=true&characterEncoding=utf8
    username: test
    password: test

seata:
  enabled: true
  application-id: ${spring.application.name}
  tx-service-group: my_test_tx_group
  service:
    vgroup-mapping:
      my_test_tx_group: default
    grouplist:
      default: myhost:18091
    disable-global-transaction: false
  config:
    type: file
    file:
      name: file.conf
  registry:
    type: file
    file:
      name: file.conf
```

```java
@SpringBootApplication
@EnableAutoDataSourceProxy
public class SeataAtRm {

    public static void main(String[] args) {
        SpringApplication.run(SeataAtRm.class, args);
    }
}
```

```java
@RestController
@RequestMapping("account")
public class AccountController {

    @Resource
    private JdbcTemplate jdbcTemplate;

    @RequestMapping("transfer")
    public String transfer(@RequestParam("fromUserId") String fromUserId,
                           @RequestParam("toUserId") String toUserId,
                           @RequestParam("money") Integer money) {
        String sql = "update account_info set balance = balance + ? where user_id = ?";
        int result = jdbcTemplate.update(sql, new Object[]{money, toUserId});
        if (result == 0) {
            return "fail";
        }
        return "success";
    }
}
```