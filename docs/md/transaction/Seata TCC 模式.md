# 分布式事务解决方案：Seata TCC 模式
![请添加图片描述](https://img-blog.csdnimg.cn/fea846f71e2547a8bc5870e2dc4f7a96.jpg?)
## 介绍
开源的TCC框架有很多，比如，hmily，EasyTransaction，ByteTCC，TCC-Transaction等。其实我刚开始是用hmily学习tcc的，后续我也看了一下hmily的源码，但是，hmily对各种异常流程的处理没有seata优雅。所以本篇就用seata tcc模式写一个转账demo，seata-tcc-tm项目向seata-tcc-rm项目转账
## seata-tcc-tm

application.yaml
```yaml
server:
  port: 30002

spring:
  application:
    name: seata-tcc-tm
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    url : jdbc:mysql://myhost:3306/db_account_2?useUnicode=true&characterEncoding=utf8
    username: test
    password: test
    type: com.alibaba.druid.pool.DruidDataSource

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
@MapperScan("com.javashitang.dao")
@SpringBootApplication
public class SeataTccTmAccount {

    public static void main(String[] args) {
        SpringApplication.run(SeataTccTmAccount.class, args);
    }
}
```

```java
@RestController
@RequestMapping("account")
public class AccountController {

    @Resource
    private TmTccService tmTccService;
    @Resource
    private RmAccountClient rmAccountClient;


    @GlobalTransactional
    @RequestMapping("transfer")
    public String transfer(@RequestParam("fromUserId") String fromUserId,
                           @RequestParam("toUserId") String toUserId,
                           @RequestParam("money") Integer money) {
        boolean ret = tmTccService.prepare(null, fromUserId, toUserId, money);
        if (!ret) {
            throw new RuntimeException("预扣款失败");
        }
        String rmRet = rmAccountClient.transfer(fromUserId, toUserId, money);
        if ("fail".equals(rmRet)) {
            throw new RuntimeException("预收款失败");
        }
        return "success";
    }
}
```

```java
@FeignClient(value = "seata-tcc-rm", url = "http://127.0.0.1:30001")
public interface RmAccountClient {

    @RequestMapping("account/transfer")
    String transfer(@RequestParam("fromUserId") String fromUserId,
                    @RequestParam("toUserId") String toUserId,
                    @RequestParam("money") Integer money);

}
```

```java
@LocalTCC
public interface TmTccService {

    @TwoPhaseBusinessAction(name = "TmTccService", commitMethod = "commit", rollbackMethod = "cancel")
    boolean prepare(BusinessActionContext context,
                    @BusinessActionContextParameter(paramName = "fromUserId") String fromUserId,
                    @BusinessActionContextParameter(paramName = "toUserId") String toUserId,
                    @BusinessActionContextParameter(paramName = "money") Integer money);

    /**
     * 确认方法，可以重命名，但要和commitMethod保持一致
     */
    boolean commit(BusinessActionContext context);

    /**
     * 取消方法，可以重命名，但要和rollbackMethod保持一致
     */
    boolean cancel(BusinessActionContext context);
}
```
**注意：@TwoPhaseBusinessAction的name属性在分布式应用中必须全局唯一**，因为name属性在TCC模式中是资源管理器的唯一标识resourceId，而在at和xa模式中resourceId都为数据库连接url

我们可以用@BusinessActionContextParameter修饰入参让参数加到BusinessActionContext中，这样在后续的commit方法或者cancel方法中就能从BusinessActionContext中获取到这些参数

```java
@Slf4j
@Service
public class TmTccServiceImpl implements TmTccService {

    @Resource
    private AccountInfoMapper accountInfoMapper;

    @Override
    public boolean prepare(BusinessActionContext context, String fromUserId, String toUserId, Integer money) {
        log.info("prepare");
        int result = accountInfoMapper.updateMoney(fromUserId, money * -1);
        return result == 1;
    }

    @Override
    public boolean commit(BusinessActionContext context) {
        log.info("commit");
        return true;
    }

    @Override
    public boolean cancel(BusinessActionContext context) {
        log.info("cancel");
        String fromUserId = String.valueOf(context.getActionContext("fromUserId"));
        Integer money = (Integer) context.getActionContext("money");
        accountInfoMapper.updateMoney(fromUserId, money);
        return true;
    }
}
```

```java
public interface AccountInfoMapper {

    @Update("update account_info set balance = balance + #{money} where balance + #{money} > 0 and user_id = #{userId}")
    int updateMoney(@Param("userId") String userId, @Param("money") Integer money);
}
```
## seata-tcc-rm
application.yaml
```yaml
server:
  port: 30001

spring:
  application:
    name: seata-tcc-rm
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    url : jdbc:mysql://myhost:3306/db_account_1?useUnicode=true&characterEncoding=utf8
    username: test
    password: test
    type: com.alibaba.druid.pool.DruidDataSource

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
@MapperScan("com.javashitang.dao")
@SpringBootApplication
public class SeataTccRmAccount {

    public static void main(String[] args) {
        SpringApplication.run(SeataTccRmAccount.class, args);
    }
}
```

```java
@RestController
@RequestMapping("account")
public class AccountController {

    @Resource
    private RmTccService rmTccService;

    @RequestMapping("transfer")
    public String transfer(@RequestParam("fromUserId") String fromUserId,
                           @RequestParam("toUserId") String toUserId,
                           @RequestParam("money") Integer money) {
        boolean flag = rmTccService.prepare(null, fromUserId, toUserId, money);
        return flag ? "success" : "fail";
    }
}
```

```java
@LocalTCC
public interface RmTccService {

    @TwoPhaseBusinessAction(name = "RmTccService", commitMethod = "commit", rollbackMethod = "cancel")
    boolean prepare(BusinessActionContext context,
                    @BusinessActionContextParameter(paramName = "fromUserId") String fromUserId,
                    @BusinessActionContextParameter(paramName = "toUserId") String toUserId,
                    @BusinessActionContextParameter(paramName = "money") Integer money);

    /**
     * 确认方法，可以重命名，但要和commitMethod保持一致
     */
    boolean commit(BusinessActionContext context);

    /**
     * 取消方法，可以重命名，但要和rollbackMethod保持一致
     */
    boolean cancel(BusinessActionContext context);
}
```


```java
@Slf4j
@Service
public class RmTccServiceImpl implements RmTccService {

    @Resource
    private AccountInfoMapper accountInfoMapper;

    @Override
    public boolean prepare(BusinessActionContext context, String fromUserId, String toUserId, Integer money) {
        log.info("prepare");
        int result = accountInfoMapper.selectByUserId(toUserId);
        return result == 1;
    }

    @Override
    public boolean commit(BusinessActionContext context) {
        log.info("commit");
        String toUserId = String.valueOf(context.getActionContext("toUserId"));
        Integer money = (Integer) context.getActionContext("money");
        accountInfoMapper.updateMoney(toUserId, money);
        return true;
    }

    @Override
    public boolean cancel(BusinessActionContext context) {
        log.info("cancel");
        return true;
    }
}
```

```java
public interface AccountInfoMapper {

    @Update("update account_info set balance = balance + #{money} where balance + #{money} > 0 and user_id = #{userId}")
    int updateMoney(@Param("userId") String userId, @Param("money") Integer money);

    @Select("select count(*) from account_info where user_id = #{userId}")
    int selectByUserId(@Param("userId") String userId);
}
```