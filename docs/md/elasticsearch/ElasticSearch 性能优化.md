---
layout: post
title: ElasticSearch 性能优化
lock: need
---

# ElasticSearch 性能优化

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200222092345247.jpg?)
## 提升写入性能
### 使用 bulk 接口批量写入
1. 节省重复创建连接的网络开销
2. 通过进行基准测试来找到最佳的批处理数量

### 延长 refresh 的时间间隔
1. 通过延长 refresh（刷新）的时间间隔可以降低段合并的频率，段合并十分耗费资源
2. 默认的刷新频率为1s，对 index 修改 index.refresh_interval 即可立即生效

### 初始化性能的大量写入
1. 比如 reindex 或是导入基础数据这种一次性批量索引操作
2. 可以配置成不刷新，并且把副本数也配置成0，完了之后再设置成正常值

### 关闭操作系统的 swapping
1. 操作系统会自动把不常用的内存交换到磁盘（虚拟内存），关闭后就不会进行交换

### 使用自动生成的id
1. 指明文档 id 时，es 需要先判断一下这个 id 对应的文档是否已经存在，以做一些合并或者更新操作。如果使用自生成的 id，可以跳过这个步骤，加快索引速度

### 合理设置字段 mapping
1. 不需要分析的字段就不用分析
### 合理设置分片和副本数量

1. 副本数量越多，写入越慢
## 提升查询性能
### 用过滤器上下文替代查询上下文
1. 过滤器上下文，不计算得分可以减少资源消耗，过滤器结果可以缓存
### 避免使用脚本
1. 脚本非常耗性能，因为每次计算且无法缓存
2. 如果非用不可，就用 painless 或者 expressions

### 提前索引字段

假如有如下的文档
```json
PUT index/_doc/1
{
  "designation": "spoon",
  "price": 13
}
```

经常进行如下的范围查询
```json
GET index/_search
{
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 10 },
          { "from": 10, "to": 100 },
          { "from": 100 }
        ]
      }
    }
  }
}
```

索引的时候可以增加一个 price_range 字段，用来存储范围
```json
PUT index
{
  "mappings": {
    "properties": {
      "price_range": {
        "type": "keyword"
      }
    }
  }
}

PUT index/_doc/1
{
  "designation": "spoon",
  "price": 13,
  "price_range": "10-100"
}
```

最开始的分组方式就可以改成如下形式
```json
GET index/_search
{
  "aggs": {
    "price_ranges": {
      "terms": {
        "field": "price_range"
      }
    }
  }
}
```

### 合理 mapping
1. 数值数据可以映射为 numeric 类型或者keyword类型
2. 数字类型适合范围查询
3. keyword 类型适合精确查询（精确查询时搜索 keywrod 比搜索 numeric 更快）

比如产品id或者 ISBN（一种用于唯一标识图书的国际标准）基本上是用在精确查询的场景中，我们就可以映射为 keyword 类型

### 使用更轻量的查询语句
1. 通配符查询很费性能，尤其是通配符放在前面
### 不要使用关联关系
1. 不管是嵌套还是父子，都会使查询量倍增
### 增加副本数量
1. 查询时会查询主分片或副本分片，因此增加副本数量可以提高系统吞吐量
### 按时间查询时对时间进行四舍五入
1. 这样可以更好的利用缓存

在可以接受的前提下，可以从方式一改为方式二

方式一：查询当前时间减去1小时到当前时间，精确到秒的时间范围
```json
GET index/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "range": {
          "my_date": {
            "gte": "now-1h",
            "lte": "now"
          }
        }
      }
    }
  }
}
```

方式二：和方式一相比，多了/m，表示这是一个精确到分钟的相对时间范围
```json
GET index/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "range": {
          "my_date": {
            "gte": "now-1h/m",
            "lte": "now/m"
          }
        }
      }
    }
  }
}
```

### 如果 index 不再写入可以合并分段
1. 分段越少，查询越快，每次查询都要拆到所有分段去处理，再合并结果，有 _forcemerge 接口，可以把分段数设为1
2. 甚至可以合并分片，reindex 或 shink

```json
POST /my-index-000001/_forcemerge
```
### 给文件系统（filesystem cache）预留足够内存
1. es 非常依赖操作系统的文件缓存来提高查询速度
2. 预留至少一半的内存给文件系统缓存

### 使用 ssd 磁盘而且别用远程磁盘
1. es需要频繁读取磁盘

### 路由优化

## 节省磁盘空间
### 关闭不需要的特性
1. 不被用来查询的字段，不索引
2. 不做全文检索，不分词
3. 不关注文档相关性，关闭 norms
4. 不需要短语搜索，关闭位置索引
### 不要使用自动 mapping
1. 默认会对 string 字段做两次索引（text 和 keyword）

###  禁用 _source 字段
1. _source字段存储了文档原始的 json 格式，如果不需要访问，可以禁用
### 配置压缩存储
### 分段合并
1. 段里面的数据是逻辑删除的，段合并的时候会将这些数据真正删除
### 数字类型用最小数字类型
1. 尽量选择占用空间较小的数组类型，byte < short < integer < long

