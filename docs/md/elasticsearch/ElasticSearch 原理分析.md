---
layout: post
title: ElasticSearch 原理分析
lock: need
---

# ElasticSearch 原理分析

![在这里插入图片描述](https://img-blog.csdnimg.cn/c1a0738272624facaa201c77785cce1b.png#pic_center)
## ElasticSearch 的应用场景
### 适用的场景

全文检索：快速而准确的检索大规模文本数据，适用于搜索引擎，电子商务网站等
日志和事件数据分析：处理各种日志和事件数据，很多公司用es来存储，搜索和分析日志
应用性能监控：通过与各种apm工具集成，可以实时追踪，分析和可视化应用程序的性能指标，帮助开发人员发现潜在问题并进行优化

### 不适用的场景
不支持事物：如果有强一致的业务场景，比如银行交易，ElasticSearch 不是最佳选择
多表关联有限：尽管 es 有 nested join，但要实现类似 mysql join 几乎不可能或者性能非常差
不支持准实时：refresh_interval（默认1s）决定，近实时而非准实时

### ElasticSearch 对标 MySQL 基础概念

| ElasticSearch | MySQL |
|--|--|
| Index | Table |
| Document | Row |
| Field | Column |
| Mapping | Schema |
| Query DSL | SQL |
| aggregations | group by，avg，sum |
| cardinality | 去重 distinct |
| reindex |数据迁移  |

### 倒排索引
正排索引用来保存文档id和文档内容之间的映射关系
| 文档id | 文档内容 |
|--|--|
| 1 | ElasticSearch 实战 |
| 2 | ElasticSearch 开发 |
| 3 | ElasticSearch 服务器开发 |

倒排索引用来保存单词到文档id的映射关系
| 关键词 | 文档id |
|--|--|
| ElasticSearch  | 1，2，3|
| 实战 | 1 |
| 开发 | 2，3|
| 服务器 |3  |

使用倒排索引这一个结构，可以通过关键词快速查询内容
## ElasticSearch 存储
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/f7e36a27b3674c95b536379492238c16.png)

ElasticSearch 中的一个索引由一个或多个分片组成，每个分片包含多个 segment（分段），每一个分段都是一个倒排索引。一个分片就是一个 lucene 索引，分片越多搜索越慢

lucene索引会再分割成分段（segment），分段越多搜索越慢，分段不会被修改，分段会持续的被合并。

更新文档，segment 创建之后不能修改，文档更新实际上是创建了一条新的然后删掉旧的。删除也不是真删，而是加上一条删除标记，分段合并的时候才会彻底删除

删除文档，可以通过id删除单个，也可以通过条件批量删除。删除只是标记为删除，搜索的时候还要检查一遍命中的文档是否已经被删除，分段合并的时候才会彻底删除

## ElasticSearch 集群
ElasticSearch作为一个分布式搜索引擎，为了保证高性能，会把索引分成几个分片存储在不同的节点上，这些分片叫做**主分片**
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/152a0a5c725a4a9fa125c6013a298432.png)
同时为了保证高可用，对每个分片还会进行备份，叫做**副本分片**，主分片和对应的副本分片会尽量避免在同一个节点

如下图圆形代表主分片，正方形代表副本分片，主分片P0对应的副本分片为R1，以此类推
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/7dbccb791cce4447afed922196532737.png)
一个 ElasticSearch 集群除了存储数据的节点外还有很多种其他类型的节点

| 节点类型 | 作用 |
|--|--|
| master | 集群的管理节点，负责集群的元数据操作，例如创建或删除索引，管理分片分配 |
| coordinating | 协调节点，接收请求并将它们分发到相关的 data 节点 |
| ingest | 执行数据转换和预处理操作 |
| data | 存储索引数据 |

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/0574a11a58b84a66862a78b8baed1916.png)
集群形成的大概流程如下

初始化配置：通过 cluster.initial_master_nodes 配置主候选节点，discovery.seed_hosts 指定了在节点发现中的种子主机列表，这个参数告诉节点在加入集群时从哪些主机获取集群配置信息
选举主节点：主候选节点发起主节点的选举，超过一半的主候选节点达成一致表示选举成功
提供服务：当所有节点都发现完毕，集群启动完毕就可以对外提供服务
## 文档写入流程

当数据量较大时，一个索引会设置多个分片，数据会按照如下规则决定数据应该被保存到哪个分片上

```shell
shard_num = hash(_routing) % num_primary_shards
```
_routing的值是文档的_id值，如果允许主分片数量发生改变，就意味着所有的数据需要重新路由，因此 ElasticSearch 禁止在索引建立以后修改主分片的数量。_routing值可以由用户指定

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/982e7dbf40b94dc7850887cf22af1e83.png)

1. 客户端向 node1 发送写数据请求，此时 node1 便充当协调节点的角色
2. 节点 node1 使用文档的 _id 确定文档属于分片0，请求会被转发到 node3，因为分片0的主分片被分配到 node3
3. node3 在主分片上执行写入操作，如果写入成功，将请求并行转发到 node1 和 node2 的副本分片。一旦所有副本分片都响应写入成功，node3 将向协调节点响应写入成功，协调节点向客户端响应写入成功

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/711bec8f330542c8b814c51f6d97d3b9.png)

write：一个新文档过来，会存储在 Memory Buffer 和 Transaction Log 中（事物日志，简写为Translog，默认写入磁盘），此时数据还没到段中，是搜不到新文档的
refresh（刷新）：Memory Buffer 中的文档写入新的段中，此时文档可以被搜索到。接着清空 Memory Buffer，注意 Translog 没有被清空
flush（冲洗）：每隔一段时间将文档写入磁盘
clear：文档写入磁盘后，删除对应的Translog

refresh_interval 的默认值为1秒，所以 ElasticSearch 是一个近实时的系统

**段合并**：因为 refresh 默认间隔为1s，所以每秒会创建一个新的段，es 会运行一个任务检测当前磁盘中的段，对符合条件的段进行合并操作，提高查询速度，合并过程也是文档删除和更新操作后，旧的文档真正被删除的时候，我们可以手动调用段合并相关的 api 来主动触发合并
## 文档搜索流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/e7aecf2495a84cc0a187717d676245ed.png)

索引写入时总要先寻找主分片，搜索则不然，一个搜索既可以使用主分片，也可以使用副本分片。ElasticSearch 中文档的搜索过程分为两个部分（query 和 fetch）
### query 阶段

1. 客户端向 node1 发送查询请求，此时 node1 便充当协调节点的角色，该 node 会创建一个 priority queue，长度为 from + size
2. node1 根据负载均衡算法将请求分发到每个分片对应 primary shard 或 replica shard，每个 shard 在本地创建一个同样大小的 priority queue，长度为 from + size，用于存储该 shard 执行查询的结果
3. 每个 shard 将各自 priority queue 中的元素返回给 node1，注意元素只包含文档的 id 和排序值，node1 将合并所有的元素到自己的 priority queue，根据 from 和 size 获取对应的文档 id
### fetch 阶段

在完成 query 阶段后，node1已经得到了查询的列表，但是列表中的元素只有文档的 id 和排序值，并无实际的内容值，所以 fetch 阶段就是根据文档 id，取到完整文档对象的过程，当所有的 shard 都返回了结果，node1 将结果返回给客户端

注意事项：使用 from 和 size 进行分页时，每个 shard 都会创建一个 from + size 长度的队列，当 from 值特别大时，会带来极大的资源浪费，因此不要使用深分页

## 好用的插件
我们可以在Chrome 应用商店安装一下 ElasticSearch Head 这个插件非常好用，有很多实用的功能

比如下图我们可以看到 user 这个索引只有一个主分片，一个副本分片，主分片在 node-1 这个节点，副本分片在 node -2 这个分片

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/eb0dd4e117d446f2b36141d1f7a067fc.png)
我们可以很明显的看到这个集群的状态为绿色

| 颜色 | 含义 |
|--|--|
| green | 主分片和副本分片都正常工作 |
| yellow | 主分片都正常工作，至少一个副本分片不能正常工作 |
| red | 至少一个主分片以及它的全部副本分片都不能正常工作 |
