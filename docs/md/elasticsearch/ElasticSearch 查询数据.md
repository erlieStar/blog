---
layout: post
title: ElasticSearch 查询数据
lock: need
---

# ElasticSearch 查询数据

![在这里插入图片描述](https://img-blog.csdnimg.cn/6c720de10a2f4fcdb3c62b35a74ad1db.png)
## 准备数据

```json
PUT user
{
  "mappings": {
    "properties": {
      "age": {"type": "integer"},
      "email": {"type": "keyword"},
      "name": {"type": "keyword"},
      "address": {"type": "text", "analyzer": "ik_smart"}
    }
  }
}
```

```json
POST user/_bulk
{"index": {"_id": 1}}
{"name": "张三", "age": 10, "email": "1.qq.com", "address": "北京朝阳"}
{"index": {"_id": 2}}
{"name": "李四", "age": 20, "email": "2.qq.com", "address": "北京西城"}
{"index": {"_id": 3}}
{"name": "王五", "age": 30, "email": "3.qq.com", "address": "北京东城"}
{"index": {"_id": 4}}
{"name": "赵六", "age": 40, "email": "4.qq.com", "address": "北京海淀"}
```
## 查询上下文/过滤上下文

ElasticSearch 在进行搜索时分为查询上下文（query context）和过滤上下文（filter context）

查询上下文会计算匹配分值(_score)，与文档相关性有关。而过滤上下文不会计算匹配分值，只会关系结果是否满足条件

计算匹配分值，耗费性能，因为匹配分值都是实时计算，无法缓存。尽量使用过滤查询以减少性能消耗加快查询速度

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/bf24387b08904120abb06aade2029cb3.png)
## 精确查询（Term-level queries）
### 存在查询
Exists query 用于查询某个字段不为空的数据。如下所示，查询 age 不为空的 数据
```json
GET user/_search
{
  "query": {
    "exists": {
      "field": "age"
    }
  }
}
```
### 主键查询
通过 _id 字段查询数据
```json
GET user/_search
{
  "query": {
    "ids": {
      "values": ["1", "2", "3"]
    }
  }
}
```
### 前缀查询

```json
GET user/_search
{
  "query": {
    "prefix": {
      "address": {
        "values": "beijing"
      }
    }
  }
}
```

### 范围查询
```json
GET user/_search
{
  "query": {
    "range": {
      "age": {
        "gte": 10,
        "lte": 20
      }
    }
  }
}
```

| 查询参数 | 解释 |
|--|--|
| gt | > |
| gte | >= |
| lt | < |
| lte | <= |
| format | 设置时间格式 |

### 正则查询

```json
GET user/_search
{
  "query": {
    "regexp": {
      "name": "*小*"
    }
  }
}
```

### 术语查询

```json
GET user/_search
{
  "query": {
    "term": {
      "name": "小明"
    }
  }
}
```
### 多术语查询
terms query 和 term query 基本一样，terms query 允许在参数中传递多个查询词
```json
GET user/_search
{
  "query": {
    "terms": {
      "name": ["小明", "小红"]
    }
  }
}
```

### 通配符查询


```json
GET user/_search
{
  "query": {
    "wildcard": {
      "name": "*小*"
    }
  }
}
```
支持如下两个通配符
1. ？匹配单个字符
2. \* 匹配零个或多个字符，包括空字符
## 复合查询（Compound queries）
### 布尔查询

| 类型 | 说明 |
|--|--|
| must | 必须匹配，需要计算相关度得分，类似于逻辑上的 AND 操作|
| filter | 必须匹配但不影响评分，类似于 must 但更轻量 |
| should | 至少有一个条件匹配，类似于逻辑上的 OR 操作，可以用 minimum_should_match 指定至少匹配的条件数量 |
| must_not | 条件不能匹配，类似于逻辑上的 NOT 操作 |

查询年龄在20到30之间，名字为王五的用户
```json
GET user/_search
{
  "query": {
    "bool": {
      "filter": {
        "range": {"age" : { "gte": 20, "lte": 30 }}
      },
      "must": {
        "term": {"name": "王五"}
      }
    }
  }
}
```

## 查询全部（Match all query）

```shell
GET user/_search
{
  "query": {
    "match_all": {}
  }
}
```

## 全文检索（Full text queries）
### 对单个字段进行全文检索（Match query）

```json
GET user/_search
{
  "query": {
    "match": {
      "address": "朝阳"
    }
  }
}
```

## 分页
### 普通分页

```json
GET user/_search
{
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 20
}
```
from：指定从哪开始
size：指定要返回的结果数量

当 from + size 的值超过10000 的时候会报错，如果一定要使用这种方式，可以在索引配置中调大 index.max_result_window 的值。当数量超过 10000 的时候推荐使用 search after 这种方式

### search after 分页
search after 作为一种游标式的分页方法，使用排序字段的值作为游标，通过在每次请求中提供上一次结果的最后一个排序值，实现连续分页

```json
GET user/_search
{
  "size": 2,
  "query": {
    "match_all": {}
  },
  "sort": [
    {"age": "desc"}
  ]
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/e62768126cfc4538aa26801de2fc8072.png)
在第一次请求时，不需要提供 search_after 参数，但在接下来的请求中，需要将上一次结果中最后一个文档的排序值作为 search_after 的值传递给下一次请求

上面的示例中，最后一个文档的排序值为30，所以 search_after 参数的值为30
```json
GET user/_search
{
  "size": 2,
  "query": {
    "match_all": {}
  },
  "sort": [
    {"age": "desc"}
  ],
  "search_after": [30]
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/1dfe6c0ee35044bba90b6eec636aa65a.png)
## 排序
| 可选值 | 解释 |
|--|--|
| asc | 升序 |
| desc | 降序 |

先按照 age 降序再按 email 升序
```json
GET user/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    { "age": "desc" },
    { "email": "asc" }
  ]
}
```