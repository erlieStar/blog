---
layout: post
title: 同样是注册中心，Zookeeper和Eureka有哪些区别？
lock: need
---

# 面试官：同样是注册中心，Zookeeper和Eureka有哪些区别？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101111443137.jpg?)
## CAP定理
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101143654933.png?)

在分布式系统的发展中，影响最大的莫过于CAP定理了，是分布式系统发展的理论基石。

1. 2000年，加州大学的计算机科学家 Eric Brewer提出了CAP猜想
2. 2002 年，麻省理工学院的 Seth Gilbert 和 Nancy Lynch 从理论上证明了 CAP 猜想，CAP猜想成为了CAP定理

**CAP定理，简单来说就是分布式系统不可能同时满足Consistency 一致性、Availability 可用性、Partition Tolerance 分区容错性三个要素**

### Consistency 一致性
一致性的含义为，在节点的任意时刻，访问任意节点返回的数据是一致的。即Client端写入一个数据后，Server端将数据同步到整个系统，从而保证系统的数据都相同

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101120326201.png?)

### Availability 可用性
可用性的含义为，集群能够对用户的请求给予响应。

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021010112114646.png?)

### Partition Tolerance 分区容错性

分区容错的含义为，当出现分区故障时，系统仍要对外提供服务。分布式系统中，每个服务节点都是不可靠的，当某些节点出现异常时，或者节点之间的通讯产生异常时，整个系统就产生了分区问题，分布式系统中分区问题是客观存在的。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101122220618.png?)

## CAP权衡
### CA
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101143926522.png?)

系统选择CA，即不支持分区容错，只支持一致性和可用性。意味着不允许出现分区异常，网络一致处于理想状态。但是分布式系统之间网络异常是客观存在的，如果避免了P，只能把分布式系统退回到单实例系统。

### CP
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101144035978.png?)

因为分布式系统P是客观存在的，所以我们要在CP和AP之间进行抉择。

**当选择CP时，相当于放弃系统的可用性，换取一致性**。zookeeper是选择了CP的系统

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101151124839.png?)

在zookeeper集群中，有如下三种角色
| 角色     | 作用                                                        |
| -------- | ----------------------------------------------------------- |
| Leader   | 事务请求的唯一调度者和处理者 （事务请求为除查询之外的请求） |
| Follower | 处理非事务请求，参与Leader选举投票                          |
| Observer | 处理非事务请求，不参与选举投票                              |

在Leader服务器失效时，会重新从Follower服务器中选举一个新的服务器作为Leader服务器。**在重新选举Leader服务器的过程中，事务请求会被挂起，选举完Leader服务器之后才会执行这些请求**。即为了保证一致性，放弃了系统的可用性

### AP
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101144131352.png?)

**当选择AP时，相当于放弃系统一致性，换取可用性**。eureka是选择了AP的系统

和zookeeper集群中有三种角色不同的是，eureka集群中每个节点扮演相同的角色，他们通过互相注册的方式来感知对方的存在，当有注册信息时，他们会同步给集群内的其他节点。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101151402844.png?)

下面我从源码角度分析一下eureka是如何放弃一致性来保证可用性的（放心，不会放源码的，说一下大概思路）

eureka注册中心的信息保存在AbstractInstanceRegistry类的成员变量中

```java
// AbstractInstanceRegistry
private final ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>> registry
	= new ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>>();
```
就是一个双层map，这个双层map也很好理解。最外层是服务名，里面是一个具体的实例名

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210101154955519.png?)

当有服务往eureka上注册时，注册信息会被保存在map中，同时会把信息同步给其他的节点。此时有可能有些节点不可用了，或者网络故障，并没有收到信息，此时集群节点内的信息可能是不一致的。

当客户端从某个eureka节点获取信息失败，或者注册失败，会自动切换到另一个eureka节点。只要有一台eureka节点可用，就能保证注册服务可用。

## Zookeeper和Eureka的区别

最后总结一下两者的区别
|          | Zookeeper                                      | Eureka                       |
| -------- | ---------------------------------------------- | ---------------------------- |
| 设计原则 | CP                                             | AP                           |
| 优点     | 数据最终一致                                   | 服务高可用                   |
| 缺点     | 网络分区会影响leader选举，超过阈值后集群不可用 | 服务节点间的数据可能不一致   |
| 适用场景 | 对数据一致性要求较高                           | 对注册中心服务可用性要求较高 |