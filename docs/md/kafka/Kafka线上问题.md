# Kafka 线上问题

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/2f617f4c03dd44f3989daffa1ad256a5.png)
## 订单宽表数据不同步

事情的起因是用户在 app 上查不到订单了，而订单数据是从 mysql 的 order_search 表查询的，order_search 表的数据是从 oracle 的 order 表同步过来的，查不到说明同步有问题



首先重启，同步数据，问题解决，然后查找原因。首先看日志，有如下两种情况

1. 有的容器消费消息的日志正常打印
2. 有的容器很长时间没有消费消息的日志（看着像是消息丢失，找运维确认后明确发送没问题，只能是消费的问题）

接着看容器的状况
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/092761f6b57142e18b979e670e07e3e4.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/fb0621d9917c454b8173042a29710625.png)

查看了应用重启前各个容器的 CPU 和内存情况，发现并不均匀，有如下三种情况

1. CPU一直很高（内存稳定）
2. CPU和内存一直稳定上升
3. CPU一直很低（内存稳定）

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/3284087bdfb4407486494e3a9117de9e.png)

看监控发现消息在分区中分布的也不均衡

## 问题排查

接着就按照如下现象来进行排查问题


1. 为什么消息发送不均衡
2. 为什么有的容器CPU一直很高，有的一直很低，有的持续升高（CPU飙高的机器，内存也不断上涨）

**为什么会出现这些现象？**

producer发送消息和consumer消费消息都有对应的负载均衡策略，既然消息发送不均衡，只需要看producer的负载均衡策略即可

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/7a0cda15dbc94df9a67000206358470f.png)

producer的负载均衡实现类为 DefaultPartitioner，具体实现为


1. 如果 key 为 null：消息将以轮询的方式，在所有可用分区中分别写入消息
2. 如果 key 不为 null：对 Key 值进行 Hash 计算，从所有分区中根据 Key 的 Hash 值计算出一个分区号；拥有相同 Key 值的消息被写入同一个分区；


所以推测发送的消息指定了key，看消费日志确定了猜想，key的名字为表名

这样就明确了，同一张表的数据只会被发送到同一个分区，同一个分区的数据只能被一个 Consumer 消费

接着我们查到 CPU 一直比较高的容器，消费的是合同表的数据，合同表的数据变更比较频繁，所以CPU比较高

而 CPU 持续飙升的容器，消费的是订单表的数据。



接着就是排查消费订单表的容器为什么CPU和内存持续飙升

首先用生成 dump 文件，用 Eclipse Memory Analyzer 分析一下看是否发生了内存泄露

![李立敏 > hddp-datasync 消息不同步问题排查 > image2022-10-10_20-42-27.png](https://img-blog.csdnimg.cn/direct/f980634016da440bb5470cebba420bde.png)

点击 Leak Supects 查看内存泄漏分析

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5289024e23024d44998e5b36948bc0ca.png)


总共使用了110MB内存，Thread线程占用了29M，总共创建了2686个线程，看一下这些线程是哪些？




![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/387324e465e842e68703b53e5cc8ad77.png)

线程数量最多的线程名字为datasync-execuotr-1，到代码中查看是否有类似线程

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b834edaabc994e0d9e70ab7246a75b78.png)

每消费一次订单表的数据，调用一次 asyncConfig.getAsyncExecutor()方法，就会新创建一个线程池，核心线程数为10，不断创建线程导致内存和 CPU 不断飙升，消息不能正常消费，后续消费消息改成使用一个固定的线程池后，消息正常消费

