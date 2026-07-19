---
layout: post
title: 如何优化慢SQL？
lock: need
---
# MySQL实战：如何优化慢SQL？

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8a67547627cd40bca1cbee6df9349ded.jpeg)
## 第一步：精准定位与分析
在动手改代码之前，先要找到问题的根源。
### 发现慢SQL

**开启慢查询日志**： 捕获执行时间超过阈值（如 long_query_time = 1 秒）的 SQL。

**APM 工具监测**： 使用 SkyWalking、Prometheus 或数据库自带的性能监控面板（如 MySQL Performance Schema、AWS Performance Insights）
### 使用 EXPLAIN 分析慢SQL

在慢 SQL 前面加上 EXPLAIN 关键字执行，重点关注以下几个关键列：

**type（连接类型）**： 性能从好到差依次为 system > const > eq_ref > ref > range > index > ALL。如果出现 ALL（全表扫描）或 index（全索引扫描），通常需要优化

**key（实际使用的索引）**： 如果为 NULL，说明没有用到索引

**rows（预估扫描行数）**： 数值越大，意味着需要扫描的数据越多，性能越差

**Extra（额外信息）**

- Using filesort：说明需要额外进行排序，非常消耗性能，通常需要建组合索引优化
- Using temporary：使用了临时表，常见于 GROUP BY 或 DISTINCT，开销极大
## 第二步：常见的慢 SQL 优化策略
大部分慢 SQL 都可以通过以下四个维度来解决：
### 1. 索引优化（ROI 最高）
**全表扫描变索引扫描**： 为 WHERE、JOIN、ORDER BY、GROUP BY 后面的字段建立索引。

**最左匹配原则**： 如果建立了联合索引 (a, b, c)，查询条件必须从 a 开始，跳过 a 直接用 b 或 c 索引会失效。

**覆盖索引**： 尽量让索引包含所有需要查询的字段（即 SELECT 的字段都在索引里），避免回表（先查索引再查聚簇索引）。

防止索引失效：

- 避免在索引列上做任何操作（计算、函数、类型转换），如 WHERE YEAR(create_time) = 2026 会导致索引失效，应改为 WHERE create_time >= '2026-01-01'。
- 尽量不要使用 LIKE '%abc'（左模糊），这会导致全表扫描。
- 字符串字段查询时一定要加单引号，否则隐式类型转换会导致索引失效。
### 2. SQL 语句重构

**精简 SELECT**： 严禁使用 SELECT *，只查需要的列。减少网络传输和内存开销，并为覆盖索引创造条件。

**小表驱动大表**： 在 JOIN 操作中，用小表（数据量小的表）作为驱动表去连接大表。

**优化 LIMIT 深分页**：
- LIMIT 1000000, 10 会扫描前 100 万条数据然后丢弃，非常慢。
- 优化方案（延迟关联）： 先通过索引查出主键 ID，再用 ID 去关联原表获取其他列。

```sql
SELECT * FROM table t JOIN (SELECT id FROM table ORDER BY id LIMIT 1000000, 10) x ON t.id = x.id
```
### 3. 表结构设计与分布式优化

**字段类型优化**： 尽量使用更小的数据类型（如能用 INT 就不用 BIGINT，用 VARCHAR 代替 CHAR），尽量设计为 NOT NULL。

**反范式设计（冗余字段）**： 如果某两个表经常需要 JOIN 且核心字段很少变，可以考虑在主表冗余该字段，以空间换时间。

**分库分表（Sharding）**： 当单表数据量达到千万级（MySQL 业界经验值通常在 2000 万左右）或单库瓶颈时，考虑水平分表或垂直分库。

### 4. 架构与缓存
**读写分离**： 主库负责写，从库负责读，将读压力分摊到多个从库上。

**引入缓存**： 针对高频、低频变动的数据，直接在应用层用 Redis 进行缓存，不走数据库。

**搜索引擎（ES）**： 针对复杂的多维组合动态筛选、模糊搜索，数据同步到 Elasticsearch 中处理。