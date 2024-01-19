---
layout: post
title: ElasticSearch 聚合统计
lock: need
---

# ElasticSearch 聚合统计

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707140945668.jpg?)
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

## 聚合统计
度量聚合：求字段的平均值，最小值，最大值，总和等
桶聚合：将文档分成不同的桶，桶的划分可以根据字段的值，范围，日期间隔
管道聚合：在桶聚合的结果上执行进一步计算

进行聚合的语法如下

```json
{
  "aggs": {
    "<agg_name>": {
      "<agg_type>": {
        "field": "<field_name>"
      }
    }
  }
}
```
聚合也可以进行嵌套

```json
{
  "aggs": {
    "<agg_name>": {
      "<agg_type>": {
        "field": "<field_name>"
      },
      "aggs": {
        "<agg_child_name>": {
          "<agg_type>": {
            "field": "<field_name>"
          }
        }
      }
    }
  }
}
```

## 度量聚合（Metrics aggregations）
### 平均值聚合

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {"avg_age": {"avg": {"field": "age"}}}
}
```
在 ElasticSearch 中进行聚合统计时，默认情况下会返回原始文档和聚合结果，如果只想获取聚合结果而不需要原始文档，可以通过设置 size 参数为 0 来实现

```json
POST user/_search
{
  "size": 0,
  "query": {
    "match_all": {}
  },
  "aggs": {"avg_age": {"avg": {"field": "age"}}}
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ebeb7797986e4a198e6d74c7a9788333.png)
### 最小值 / 最大值 聚合

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {"max_age": {"max": {"field": "age"}}}
}
```

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {"min_age": {"min": {"field": "age"}}}
}
```
### 求和聚合

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {"sum_age": {"sum": {"field": "age"}}}
}
```

## 桶聚合（Bucket aggregations）
### 词条聚合（Terms aggregation）

按照某个字段的值进行聚合

```json
POST user/_search
{
  "size": 0,
  "query": {
    "match_all": {}
  },
  "aggs": {"group_by_age": {"terms": {"field": "age"}}}
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/7d73c930cb5842838d02c9ebe70b1fac.png)
### 范围聚合（Range aggregation）

按照某个字段的范围进行聚合，from提供区间下界（包括），to提供区间上界（不包括）

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "age_ranges":{
      "range": {
        "field": "age",
        "ranges": [
          { "to": 10 },
          { "from": 10, "to": 20 },
          { "from": 20 }
        ]
      }
    }
  }
}
```
## 管道聚合（Pipeline aggregations）
### 平均桶聚合（Average bucket aggregation）

```json
POST user/_search
{
  "size": 0,
  "query": {
    "match_all": {}
  },
  "aggs": {
    "age_ranges": {
      "range": {
        "field": "age",
        "ranges": [
          { "to": 10 }, { "from": 10, "to": 20 }, { "from": 20 }
        ]
      },
      "aggs": {
        "age_avg": {"avg": {"field": "age"}}
      }
    },
    "range_avg": {
      "avg_bucket": {"buckets_path": "age_ranges>age_avg"}
    }
  }
}
```
对年龄分组，并求分组后的平均值，然后对分组的平均值再求平均值

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/42aed62af14649738bb5fa2434de5d38.png)
### 求和桶聚集（Sum bucket aggregation）

```json
POST user/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "age_ranges": {
      "range": {
        "field": "age",
        "ranges": [
          { "to": 10 }, { "from": 10, "to": 20 }, { "from": 20 }
        ]
      },
      "aggs": {
        "age_sum": { "sum": {"field": "age"} }
      }
    },
    "range_sum": {
      "sum_bucket": { "buckets_path": "age_ranges>age_sum" }
    }
  }
}
```
对年龄分组，并求分组后的和，然后对分组的和再求和
