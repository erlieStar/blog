# Kafka 消息发送

![在这里插入图片描述](https://img-blog.csdnimg.cn/635da81e8eaf4300b227fb346d5bc18e.png)
## 消息发送流程
我们通过创建 KafkaProducer 对象来发送消息，KafkaProducer有两个线程
Producer主线程：把消息发送到内存缓冲区
Sender线程：把内存缓冲区的消息发送到 broker
### Producer主线程
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/55cb6aea1d434f8297f5b70bb06575ed.png)
Producer 主线程的的流程如图所示

拉取元数据：每个 topic 有多个分区，需要知道对应的broker地址
序列化器：将 Java 对象转为字节数组
分区器：决定消息发送到哪个分区？

消息不会实时发送，消息会缓存在 RecordAccumlator，发送的消息会被聚合成 ProducerBatch，ProducerBatch 的大小默认为 16k（可以通过 batch.size 设置 ProducerBatch 的大小）

**当 ProducerBatch 满了的话会被 Sender 线程发送出去，超过 linger.ms 指定的时间，如果 ProducerBatch 还没满，也会被发送出去**

ProducerBatch 底层就是 ByteBuffer，每次创建和销毁 ByteBuffer 可能会耗费大量的时间，所以一个 BufferPool，提前创建了一堆 ByteBuffer 让用户来使用，用的时候从 BufferPool 里面取，用完再还回来，这样就提高了吞吐量。如果创建的 ByteBuffer 大于16k，则不从 BufferPool 中取，实时创建


BufferPool有两个比较重要的参数
buffer.memory：设置 buffer pool 的大小
max.block.ms：buffer pool 没有剩余空间时，producer 阻塞等待的时间。当 buffer pool 都没用完时，send方法是会阻塞等待的。
### Sender线程
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b55f581767044f08b2ccdecead26fe5e.png)

Sender线程 不断获取可以发送的 ProducerBatch，并在 broker 维度进行聚合
把多个 ProducerBatch 再聚合成一个 request，最终发送的是 request
要发送的请求都会放到 inFightRequest 队列中，然后通过 Sender 发送到 broker，当 inFightRequest 中的请求收到响应后会从队列中删除，并删除对应的 ProducerBatch

https://kafka.apache.org/0110/documentation.html

|参数名 | 描述 |默认值|
|--|--|--|
| acks | 可选值为[all, -1, 0, 1] | 1|
| batch.size | batch的大小，默认为16kb，如果batch太小，会导致频繁网络请求，吞吐量下降，如果batch太大，会导致一条消息需要等待很久才能被发送出去 | 16k|
| linger.ms | 超过linger.ms指定的时间，batch还没满，也会被发送出去，避免消息的延迟太长 | 0 |
| max.request.size | 限制发送出去的消息大小 | 1m| 
| request.timeout.ms | 消息发送的超时时间，默认30s，如果30s内收不到响应，会抛出 TimeoutException| 30s |
|buffer.memory|buffer pool的大小|30m|
|max.block.ms|buffer pool没有剩余空间时，producer阻塞等待的时间|60s|
|max.in.flight.requests.per.connection|单个连接最大可以允许发送中的请求数|5|

应答acks：
| 数字 | 含义 |
|--|--|
| 0 | 生产者发送过来的数据，不需要等待数据落盘 |
| 1 | leader 收到数据后应答 |
| -1 | leader 和 isr 队列里面的所有节点收到数据后应答。-1 和 all 等价 |
## Producer 开发

```java
public class KafkaProperties {

    public static final String SERVER_URL = "s1:9092";
    public static final String TOPIC = "quickstart";
    public static final String TOPIC2 = "user";
    public static final String GROUP_ID = "quickstartGroup";
}
```

```java
public class QuickstartProducer {

    public static void main(String[] args) throws Exception {
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaProperties.SERVER_URL);
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        KafkaProducer<String, String> producer = new KafkaProducer<>(properties);

        for (int i = 0; i < 5; i++) {
            RecordMetadata metadata = producer.send(new ProducerRecord<>(KafkaProperties.TOPIC, "test" + i)).get();
            System.out.printf("topic: %s, partition: %s, offset: %s %n", metadata.topic(), metadata.partition(), metadata.offset());
        }

        producer.close();
    }
}
```

后续演示用到的代码参考：https://github.com/erlieStar/kafka-examples
### 拦截器

**在消息发送的流程中，序列化器和分区器是必须的，但是拦截器不是必须的**

很多框架都有拦截器这个概念，比如 Servlet Filter，Spring MVC Interceptor，Dubbo Filter。是责任链模式的典型应用，方便用户在消息发送和消息响应之前增加一些自定义的逻辑

想自定义拦截器，只需要实现 ProducerInterceptor 接口即可

```java
public class MyProducerInterceptor implements ProducerInterceptor<String, String> {

    private int errorCount = 0;
    private int successCount = 0;

    @Override
    public ProducerRecord<String, String> onSend(ProducerRecord<String, String> record) {
        System.out.println("消息发送之前被调用");
        return record;
    }

    @Override
    public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
        System.out.println("消息被发送到分区之后或者发送失败被调用");
        if (exception == null) {
            successCount++;
        } else {
            errorCount++;
        }
    }

    @Override
    public void close() {
        System.out.println("拦截器关闭时调用");
        System.out.println("success count " + successCount);
        System.out.println("error count " + errorCount);
    }

    @Override
    public void configure(Map<String, ?> configs) {
        System.out.println("拦截器实例创建后调用，用于配置拦截器");
    }
}
```
### 序列化器

```java
public class MySerialize implements Serializer<User> {

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {

    }

    @Override
    public byte[] serialize(String topic, User data) {
        return JSON.toJSONBytes(data);
    }

    @Override
    public void close() {

    }
}
```

### 分区器
producer 的默认分区器为 DefaultPartitioner，具体实现为

1. 如果 key 为 null：消息将以轮询的方式，在所有可用分区中分别写入消息
2. 如果 key 不为 null：对 Key 值进行 Hash 计算，从所有分区中根据 Key 的 Hash 值计算出一个分区号；拥有相同 Key 值的消息被写入同一个分区；

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a627b5187ff2462abb23ee0a5677ea3b.png)
当自定义分区器时，只需要实现 Partitioner 接口即可，比如下面这个例子，将所有的消息都发送到分区0

```java
public class CustomPartitioner implements Partitioner {
    
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
        return 0;
    }

    @Override
    public void close() {

    }

    @Override
    public void configure(Map<String, ?> configs) {

    }
}
```
只往分区0发送消息

## 发送方式
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5a578bf2681b4d2091ac926e53981af7.png)

|参数名 | 描述 |默认值|
|--|--|--|
|bootstrap.servers|格式为host1:port1,host2:port2,...|无|
|interceptor.classes|拦截器|无|
|key.serializer|消息key的序列化器|无|
|value.serializer|消息value的序列化器|无|
|partitioner.class|分区器|org.apache.kafka.clients.producer.internals.DefaultPartitioner|
|compression.type|是否压缩消息，默认是 none，即不压缩消息|none|
|retries|对于可重试的错误进行重试的次数|0|
|retry.backoff.ms|上次发送失败，重试的时间间隔|100|
### 单向发送

```java
for (int i = 0; i < 5; i++) {
    producer.send(new ProducerRecord<>(KafkaProperties.TOPIC, "test" + i));
}
```
### 同步发送

```java
for (int i = 0; i < 5; i++) {
    RecordMetadata metadata = producer.send(new ProducerRecord<>(KafkaProperties.TOPIC, "test" + i)).get();
    System.out.printf("topic: %s, partition: %s, offset: %s %n", metadata.topic(), metadata.partition(), metadata.offset());
}
```
### 异步发送

```java
for (int i = 0; i < 5; i++) {
    producer.send(new ProducerRecord<>(KafkaProperties.TOPIC, "test" + i), (metadata, exception) -> {
        if (metadata != null) {
            System.out.printf("topic: %s, partition: %s, offset: %s %n", metadata.topic(), metadata.partition(), metadata.offset());
        }
    });
}
```