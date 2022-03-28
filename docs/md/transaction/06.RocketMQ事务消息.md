# 分布式事务解决方案：RocketMQ事务消息

![请添加图片描述](https://img-blog.csdnimg.cn/990ba2250035408c998766fd5db77f57.jpg?)
## 用RocketMQ事务消息实现分布式事务

![在这里插入图片描述](https://img-blog.csdnimg.cn/09e65a21153f412599fe70b09fab4563.png?)

RocketMQ实现分布式事务的流程如下
1. producer向mq server发送一个半消息
2. mq server将消息持久化成功后，向发送方确认消息已经发送成功，此时消息并不会被consumer消费
3. producer开始执行本地事务逻辑
4. producer根据本地事务执行结果向mq server发送二次确认，mq收到commit状态，将消息标记为可投递，consumer会消费该消息。mq收到rollback则删除半消息，consumer将不会消费该消息，如果收到unknow状态，mq会对消息发起回查
5. 在断网或者应用重启等特殊情况下，步骤4提交的2次确认有可能没有到达mq server，经过固定时间后mq会对该消息发起回查
6. producer收到回查后，需要检查本地事务的执行状态
7. producer根据本地事务的最终状态，再次提交二次确认，mq仍按照步骤4对半消息进行操作

还是以转账的demo演示一下，在db_account_1和db_account_2这2个库中，建立如下2张表

```sql
-- 账户表
CREATE TABLE `account_info`
(
    `id`      INT(11)      NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `user_id` VARCHAR(255) NOT NULL COMMENT '用户id',
    `balance` INT(11)      NOT NULL DEFAULT 0 COMMENT '用户余额',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;

-- 账户流水表
CREATE TABLE `account_flow`
(
    `flow_id` INT(11)      NOT NULL COMMENT '流水id',
    `user_id` VARCHAR(255) NOT NULL COMMENT '用户id',
    `money`   INT(11)      NOT NULL COMMENT '变动金额' DEFAULT 0,
    `status`  INT(11)      NOT NULL COMMENT '状态，0待支付，1已完成' DEFAULT 0,
    PRIMARY KEY (`flow_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;
```

## 发送端
application.yaml
```yaml
server:
  port: 30002

spring:
  application:
    name: transaction-msg-producer
  datasource:
    driverClassName: com.mysql.jdbc.Driver
    url : jdbc:mysql://myhost:3306/db_account_2?useUnicode=true&characterEncoding=utf8
    username: test
    password: test
    type: com.alibaba.druid.pool.DruidDataSource

rocketmq:
  name-server: myhost:9876
  producer:
    group: tx_producer
    send-message-timeout: 6000
```
事务消息对象
```java
@Data
public class AccountMsg {

    private Integer flowId;

    private String fromUserId;

    private String toUserId;

    private Integer money;
}
```
转账接口
```java
@RestController
@RequestMapping("account")
public class AccountController {

    @Resource
    private AccountService accountService;

    @RequestMapping("transfer")
    private String transfer(@RequestBody AccountMsg accountMsg) {
        try {
            accountService.sendUpdateMsg(accountMsg);
        } catch (Exception e) {
            return "fail";
        }
        return "success";
    }
}
```

```java
public interface AccountService {

    void sendUpdateMsg(AccountMsg accountMsg);

    void update(AccountMsg accountMsg);
}
```
转账的时候先发送一条事务消息
```java
@Slf4j
@Service
public class AccountServiceImpl implements AccountService {

    @Resource
    private RocketMQTemplate rocketMQTemplate;
    @Resource
    private AccountMapper accountMapper;
    @Resource
    private AccountFlowMapper accountFlowMapper;

    /**
     * 需要根据流水号加幂等哈，我就不加了
     */
    @Override
    public void sendUpdateMsg(AccountMsg accountMsg) {
        log.info("sendUpdateMsg param flowId: {}", accountMsg.getFlowId());
        Message<AccountMsg> message = MessageBuilder.withPayload(accountMsg).build();
        rocketMQTemplate.sendMessageInTransaction("account_topic:account_tag", message, null);
    }

    /**
     * 更新账户
     * 增加流水
     */
    @Override
    @Transactional
    public void update(AccountMsg accountMsg) {
        log.info("update param flowId: {}", accountMsg.getFlowId());
        accountMapper.updateMoney(accountMsg.getFromUserId(), accountMsg.getMoney() * -1);
        accountFlowMapper.insertFlow(accountMsg.getFlowId(), accountMsg.getFromUserId(), accountMsg.getMoney(), 1);
    }
}
```
当事务消息发送成功后回掉RocketMQLocalTransactionListener#executeLocalTransaction方法，执行本地事务。

同时需要提供回查方法的实现，让rocketmq查询本地事务的执行状态，来决定是否投递消息
```java
@Slf4j
@Component
@RocketMQTransactionListener
public class AccountListener implements RocketMQLocalTransactionListener {

    @Resource
    private AccountService accountService;
    @Resource
    private AccountFlowMapper accountFlowMapper;

    /**
     * 事务消息发送成功回调
     */
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message message, Object o) {
        try {
            String messageStr = new String((byte[]) message.getPayload(), StandardCharsets.UTF_8);
            AccountMsg accountMsg = JSONObject.parseObject(messageStr, AccountMsg.class);
            accountService.update(accountMsg);
        } catch (Exception e) {
            log.error("executeLocalTransaction error", e);
            return RocketMQLocalTransactionState.ROLLBACK;
        }
        return RocketMQLocalTransactionState.COMMIT;
    }

    /**
     * 事务状态回查
     * 有流水说明账户更新成功，否则更新失败
     */
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message message) {
        String messageStr = new String((byte[]) message.getPayload(), StandardCharsets.UTF_8);
        AccountMsg accountMsg = JSONObject.parseObject(messageStr, AccountMsg.class);
        int result = accountFlowMapper.selectByFlowId(accountMsg.getFlowId());
        if (result == 1) {
            return RocketMQLocalTransactionState.COMMIT;
        } else {
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }
}
```

```java
public interface AccountMapper {

    @Update("update account_info set balance = balance + #{money} where balance + #{money} > 0 and user_id = #{userId}")
    int updateMoney(@Param("userId") String userId, @Param("money") Integer money);
}
```

```java
public interface AccountFlowMapper {

    @Insert("insert account_flow values (#{flowId}, #{userId}, #{money}, #{status})")
    int insertFlow(@Param("flowId") Integer flowId, @Param("userId") String userId,
                   @Param("money") Integer money, @Param("status") Integer status);

    @Select("select count(*) from account_flow where flow_id = #{flowId}")
    int selectByFlowId(@Param("flowId") Integer flowId);
}
```

## 接收端
收到消息后，增加账户余额，同时增加一条流水记录
```java
@Slf4j
@Component
@RocketMQMessageListener(consumerGroup = "tx_consumer", topic = "account_topic", selectorExpression = "account_tag")
public class AccountConsumer implements RocketMQListener<AccountMsg> {

    @Resource
    private AccountMapper accountMapper;
    @Resource
    private AccountFlowMapper accountFlowMapper;

    /**
     * 需要根据流水号加幂等，我就不加幂等代码了
     */
    @Override
    @Transactional
    public void onMessage(AccountMsg accountMsg) {
        log.info("onMessage param flowId: {}", accountMsg.getFlowId());
        accountMapper.updateMoney(accountMsg.getToUserId(), accountMsg.getMoney());
        accountFlowMapper.insertFlow(accountMsg.getFlowId(), accountMsg.getToUserId(), accountMsg.getMoney(), 1);
    }
}
```

来测试一下，第一次请求正常转账
```json
http://localhost:30002/account/transfer
```

```json
{
    "flowId": 100,
    "fromUserId": "1001",
    "toUserId": "1002",
    "money": 100
}
```
第二次请求，因为流水id已经存在（报主键冲突异常），导致发送端扣钱失败，接收端也没收到消息，2边的钱都没发生变化，测试完成