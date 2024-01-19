---
layout: post
title: ElasticSearch 文档操作
lock: need
---

# ElasticSearch 文档操作

![请添加图片描述](https://img-blog.csdnimg.cn/2c7c1a0d25244db2981d150c2c3987ba.jpg?)
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
## 创建文档

指定id
```json
// 无则插入，有则覆盖（覆盖的逻辑是先删除，再插入）
PUT /<target>/_doc/<_id>
// 无则插入，有则覆盖
POST /<target>/_doc/<_id>
// 无则插入，有则报错
PUT /<target>/_create/<_id>
// 无则插入，有则报错
POST /<target>/_create/<_id>
```
不指定id

```json
// 正常插入
POST /<target>/_doc
// 报错
POST /<target>/_create
// 报错
PUT /<target>/_create
// 报错
PUT /<target>/_doc
```

```json
PUT user/_doc/5
{
  "name": "张三(5)",
  "age": 10,
  "email": "1.qq.com",
  "address": "北京朝阳"
}
```

## 删除文档

```json
// 根据 id 删除
DELETE /<index>/_doc/<_id>
// 根据查询删除
POST /<target>/_delete_by_query
```

删除 id 为1的数据
```json
DELETE user/_doc/1
```

删除全部数据
```json
POST user/_delete_by_query
{
  "query": {
    "match_all": {}
  }
}
```
## 更新文档

```json
// 根据 id 更新
POST /<index>/_update/<_id>
// 根据查询更新
POST /<target>/_update_by_query
```
将 id 为1的数据的 name 修改为张三(修改后)
```json
POST user/_update/1
{
  "doc": {
    "name": "张三(修改后)"
  }
}
```
将 id 为1,2的数据 age 修改为70
```json
POST user/_update_by_query
{
  "query": {
    "ids": {
      "values": [1, 2]
    }
  },
  "script": {
    "source": "ctx._source.age = 70"
  }
}
```
## 索引重建（reindex）

索引在使用一段时间后，如果想修改索引的静态设置，比如主分片的数目，分词器等（这些设置无法直接修改），此时就可以使用索引重建

```json
POST _reindex
{
  "source": {
    "index": "my-index-000001"
  },
  "dest": {
    "index": "my-new-index-000001"
  }
}
```
## 并发控制
当进行并发控制时通常有乐观锁和悲观锁两种方式：

**乐观锁**：适用于读多写少的情况，冲突比较少，可以提高系统的吞吐量
**悲观锁**：适用于读少写多的情况，经常会产生冲突，如果使用乐观锁，应用会不断的重试，会降低性能

ElasticSearch 使用乐观锁的形式来进行并发控制，即 if_primary_term 参数和 if_seq_no 参数

| 参数 | 作用 |
|--|--|
| if_primary_term | 数据在哪个分片 |
| if_seq_no | 版本号，每次修改都会增加 |

插入一条数据
```json
POST user/_doc/5
{
  "name": "张三(5)",
  "age": 10,
  "email": "1.qq.com",
  "address": "北京朝阳"
}
```

```json
{
  "_index" : "user",
  "_id" : "5",
  "_version" : 12,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 38,
  "_primary_term" : 2
}
```
查询插入的数据
```json
GET user/_doc/5
```

```json
{
  "_index" : "user",
  "_id" : "5",
  "_version" : 12,
  "_seq_no" : 38,
  "_primary_term" : 2,
  "found" : true,
  "_source" : {
    "name" : "张三(5)",
    "age" : 10,
    "email" : "1.qq.com",
    "address" : "北京朝阳"
  }
}
```

当 _seq_no=38 时，执行如下请求报错，加if_seq_no改为38时正常执行
```json
POST user/_doc/5?if_primary_term=2&if_seq_no=30
{
  "name": "张三(5)",
  "age": 10,
  "email": "1.qq.com",
  "address": "北京朝阳"
}
```
**创建，更新，删除文档等操作的 api 都可以使用这2个参数**
## 批量操作

批量操作对json有严格的要求，每个json串不能换行，只能放在同一行，相邻的json串之间必须要有换行。每个操作必须是一对json串（delete语法除外）
```json
{ action: { metadata }}
{ request body        }
{ action: { metadata }}
{ request body        }
```

| 操作类型 | 介绍 |
|--|--|
| create | 文档id不存在则创建，不存在则报错 |
| index | 文档id不存在则创建，存在则更新文档 |
| update | 根据文档id更新文档，不存在则返回错误 |
| delete | 根据文档id删除文档，不存在则返回错误 |

批量新增
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

