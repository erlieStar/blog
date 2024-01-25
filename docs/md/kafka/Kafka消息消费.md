# Kafka 消息消费 

![在这里插入图片描述](https://img-blog.csdnimg.cn/b1be379f003f4fcc8bb1dc2c4812e0ed.png)
## 消息消费流程

我们会通过创建 KafkaConsumer 对象来进行消息消费，KafkaConsumer 有两个线程。
第一个线程：创建 kafka consumer 的线程，被称为用户主线程，管理多个 socket 连接，读取多个 topic 的多个分区的消息。消费者组执行 rebalance，消息获取，位移提交等操作都在用户主线程中执行
第二个线程：向 Coordinator 发送心跳消息

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/c8bd834c266049999d3c8e665f41c7fb.png)
Kafka Consumer 会和 broker 建立 socket 连接来拉取消息，拉取到的消息会被放到 completedFetches 中，这是一个队列，起到了一个暂存的作用，因为拉取到的消息不会一次性消费，每次消费的消息个数通过 max.poll.records 来控制。

所以每次消费消息时，先看一下 completedFetches 是否为空，不为空的话先消费 completedFetches 中的消息，为空的则通过 scoket 从 broker 拉取

https://kafka.apache.org/0110/documentation.html
| 参数名 | 描述 | 默认值|
|--|--|--|
|max.poll.records  |  一次poll返回消息的最大条数| 500|
| fetch.max.bytes | 单个请求返回的最大字节数 |50m |
|fetch.min.bytes|单个请求返回的最小字节数|1字节|
|fetch.max.wait.ms|拉取消息时等待的最大时间|500ms|
|connections.max.idle.ms|关闭空闲 socket 连接的时间，如果不在乎这些 socket 资源开销<br>可以设置为-1，即不关闭这些空闲连接|9分钟|
### Coordinator

上面我们提到了 Coordinator，我们接着了解一下 Coordinator
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/1060a2a78c66477aafa6e656600d3f12.png)
**Coordinator（协调者）有什么作用？**

每个 Consumer Group 都会选择要一个 Broker 作为 Coordinator，负责监控消费组里各个消费者的心跳，以及判断是否宕机，是否开启 rebalance（重平衡）

**如何确定 Coordinator？**

首先对 groupId 进行 hash，接着对 __consumer_offsets 的分区数量取模，默认是50，找到分区对应的 leader 所在的 broker，这个 broker 就是 consumer group 的 Coordinator，接着就会维护一个 socket 跟这个 broker 进行通信

**Coordinator 和 Consumer Leadr 如何协作制定分区方案？**

1. 每个 consumer 都发送 JoinGroup 请求到 Coordinator，然后 Coordinator 从 consumer group 中选择一个 consumer 作为 leader，把 consumer group 情况发送给这个 leader
2. 接着这个 leader 会负责制定分区方案，通过发送 SyncGroup 请求发送到 Coordinator
3. 接着 Coordinator 就把分区方案下发给各个 consumer，他们会从指定分区的 leader broker 消费消息

**Consumer Leader 制定分区分配的策略有哪些？**

**RangeAssignor**：针对每个 topic 而言，对同一个 topic 里面的分区按照序号排序，对消费者按照字母顺序进行排序。通过 partition数 / cosumer数 来决定每个消费者应该消费几个分区，如果除不尽，前面的消费者多消费1个分区

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/1f419a7c7c5745369f4b55a10573b225.png)


![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/955183a154204697a7c79815201b5f3e.png)

**RoundRobinAssignor**：针对集群中所有 topic 而言，把所有的 partition 和 所有的 consumer 都列出来，然后按照 hashcode 进行排序，最后通过轮询算法将 partition 分配给各个消费者

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ed957e8d839141c585a25929550ff088.png)

**StickyAssignor**：黏性分区分配策略，首先尽量均衡的进行分配，在分配的过程中尽量保持原有的分配不变化

分区策略
| 参数名 | 描述 | 默认值|
|--|--|--|
|partition.assignment.strategy|分区分配策略|class org.apache.kafka.clients.consumer.RangeAssignor|

重新制定分区分配的过程叫做重平衡

**什么情况下会导致 Consumer Group 的重平衡？**

1. consumer 宕机
2. 动态给 topic 增加了分区
3. 消费组订阅了更多的 topic

**Coordinator 如何感知 consumer 宕机了？**

每个 consumer 都会和 coordinator 保持心跳（默认3s），一旦超时（默认10s），该消费者会被移除，并触发重平衡，消费者处理消息时间过长（默认5分钟），也会触发重平衡

相关参数如下

| 参数名| 描述 |默认值|
|--|--|--|
|heartbeat.interval.ms  | 定期向 consumer coordinator（协调者） 发送心跳。心跳用于检测消费者是否还活着，如果长时间没心跳，会触发重平衡 | 3000 |
|session.timeout.ms  | 如果消费者在此时间内没有发送心跳，协调者认为消费者已经失效，会触发重平衡 | 10000 |
|max.poll.interval.ms  | 如果消费者在此指定时间内没有调用 poll 方法，则协调者认为消费者已经失效，会触发重平衡 | 300000 |
## Consumer 开发

| 参数名称 | 描述 |
|--|--|
| bootstrap.servers | kafka集群的地址 |
| key.deserializer | key的反序列化类，写全类名 |
| value.deserializer | value的反序列化类，写全类名 |
|interceptor.classes|拦截器|
| group.id | 消费者组id |

```java
public class KafkaProperties {

    public static final String SERVER_URL = "s1:9092";
    public static final String TOPIC = "quickstart";
    public static final String TOPIC2 = "user";
    public static final String GROUP_ID = "quickstartGroup";
}
```

```java
public class QuickstartConsumer {

    public static void main(String[] args) {
        Properties properties = new Properties();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaProperties.SERVER_URL);
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, KafkaProperties.GROUP_ID);
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);
        consumer.subscribe(Collections.singletonList(KafkaProperties.TOPIC));

        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(1000);
            for (ConsumerRecord<String, String> record : records) {
                System.out.println(record);
            }
        }
    }
}
```

后续演示用到的代码参考：https://github.com/erlieStar/kafka-examples
### 反序列化器

```java
@Data
@AllArgsConstructor
public class User {

    private Long id;

    private String name;
}
```

```java
public class MyDeserializer implements Deserializer<User> {

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {

    }

    @Override
    public User deserialize(String topic, byte[] data) {
        return JSON.parseObject(data, User.class);
    }

    @Override
    public void close() {

    }
}
```

### 拦截器

```java
public class MyConsumerInterceptor implements ConsumerInterceptor<String, String> {

    @Override
    public ConsumerRecords<String, String> onConsume(ConsumerRecords<String, String> records) {
        System.out.println("收到消息开始消费之前调用");
        return records;
    }

    @Override
    public void onCommit(Map<TopicPartition, OffsetAndMetadata> offsets) {
        System.out.println("提交位移之后调用");
    }

    @Override
    public void close() {
        System.out.println("拦截器关闭时调用");
    }

    @Override
    public void configure(Map<String, ?> configs) {
        System.out.println("拦截器实例创建后调用，用于配置拦截器");
    }
}
```

## 位移提交
consumer会将消费的位移信息提交到 __consumer_offsets 这个 topic，默认分区是50个

消息格式如下图所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/f8cb48247f9942c0b3471ffe4101aae1.png)
key为 group.id + topic + 分区号，value为当前offset的值
每隔一段时间，kafka内部会对这个 topic 进行压实操作（compact），也就是保留最新的那条数据

offset 相关的参数设置
| 参数名 | 描述 |默认值|
|--|--|--|
| enable.auto.commit | 是否自动提交位移 | true|
| auto.commit.interval.ms | 自动提交位移的时间间隔 | 5s|
| auto.offset.reset | 可选值为[latest, earliest, none] |latest |

auto.offset.reset 用于指定消费者没有保存偏移量或者偏移量无效的情况下（比如数据被删除）从哪开始消费消息

| 可选值 | 描述 |
|--|--|
| earliest | 从主体最早可用的消息开始消费 |
| latest | 从当前时间点开始消费，忽略之前已发布的消息 |
| none | 抛出异常 |

![在这里插入图片描述](https://img-blog.csdnimg.cn/aae22ce7b3c246579a0e360e9d74329e.png)
### 自动提交

设置自动提交为 true，并且设置自动提交的间隔即可
```java
// 是否自动提交消息 offset
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
// 自动提交的间隔时间
properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "5000");
```

在测试的例子中，为了打印出来提交位移的时机，可以配一下拦截器
```java
properties.put(ProducerConfig.INTERCEPTOR_CLASSES_CONFIG, MyConsumerInterceptor.class.getName());
```

**默认情况下 consuemr 是自动提交位移的，自动提交间隔为 5s**
### 手动提交
关闭自动提交
```java
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
```
#### 同步提交

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(1000);
    for (ConsumerRecord<String, String> record : records) {
        System.out.println(record);
    }
    consumer.commitSync();
}
```
等待位移提交结束才接着执行
#### 异步提交

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(1000);
    for (ConsumerRecord<String, String> record : records) {
        System.out.println(record);
    }
    consumer.commitAsync(((offsets, exception) -> {
        if (exception == null) {
            // 提交成功的逻辑
            System.out.println(offsets);
        } else {
            // 提交失败的逻辑
            System.out.println(exception.getMessage());
        }
    }));
}
```
提交位移后不用等待结果，接着执行，通过回调函数来处理提交位移的结果
