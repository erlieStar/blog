---
layout: post
title: ElasticSearch 原理分析
lock: need
---

# ElasticSearch 索引操作

![在这里插入图片描述](https://img-blog.csdnimg.cn/028600d233db447fae72f9853882a1ae.jpg?)
## 动态映射

当我们使用 MySQL 中的表时，需要提前定义好表的结构，在 ElasticSearch 中却可以不用提前定义索引的结构，ElasticSearch 根据添加的数据自动识别对应的字段类型，但我们一般不使用动态映射
## 显示映射
### 创建索引
创建索引的时候提前定义好字段的类型

```json
PUT user
{
  "mappings": {
    "properties": {
      "age": {"type": "integer"},
      "email": {"type": "keyword"},
      "name": {"type": "keyword"},
      "address": {"type": "text"}
    }
  }
}
```
### 查看索引

查看所有索引

```json
GET _cat/indices?v
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ea29eae7dd2243929df0eaa1ae3a9d54.png)
pri 表示主分片数，rep 表示副本数

查看某个索引的设置

```json
GET /user/_settings
```

查看某个索引的定义

```json
GET user/_mapping
```
查看索引中某个字段的定义

```json
GET user/_mapping/field/age
```
### 更新索引

往映射中增加新的字段

```json
PUT user/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false
    }
  }
}
```
### 删除索引

```json
DELETE user
```
### 数据类型

ElasticSearch 中字段的数据类型如下所示
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/643f89da8e3245c7ba1135820a9343c1.png)

数值类型下的细分类型如下

| 类型 | 解释 |
|--|--|
| long | 有符号64位整数 |
| integer | 有符号32位整数 |
| short | 有符号16位整数 |
| byte | 有符号8位整数 |
| double | 64位双精度浮点数 |
| float | 32位单精度浮点数 |
### 设置映射时的参数

我们可以给索引和字段设置不同的参数

| 映射参数 | 作用 |
|--|--|
|dynamic  | true为默认值，启用动态映射，新增的字段会添加到映射中， false代表禁用动态映射，忽略未知字段 |
| ignore_above | 超过 ignore_above 设置的部分将不会被存储|
| analyzer | 指定文本分析器 |
|index|是否对该字段建立倒排索引，true建立，false不建立，默认值为true|

当字段用于精确匹配而不进行模糊搜索时，将index设置为false比较合适

```json
PUT user
{
  "mappings": {
    "dynamic": false,
    "properties": {
      "age": {"type": "integer"},
      "email": {"type": "keyword", "index": false, "ignore_above": 100},
      "name": {"type": "keyword"},
      "address": {"type": "text", "analyzer": "ik_smart"}
    }
  }
}
```

## 索引的状态管理
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/f1bca83f01964622a71978d75f8a4a31.png)
### 刷新索引

```json
// 刷新索引
POST user/_refresh
// 刷新全部索引
POST _refresh
```

### 冲洗索引

```json
// 冲洗索引
POST user/_flush
// 冲洗全部索引
POST _flush
```

### 关闭索引

部分索引在业务中不需要使用但是又不能直接将其直接删除，可以关闭索引，索引关闭后不再接收读写请求

```json
// 关闭索引
POST user/_close
// 开启索引
POST user/_open
```
