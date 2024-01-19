---
layout: post
title: ElasticSearch 文本分析
lock: need
---

# ElasticSearch 文本分析

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210607150159624.jpg?)
## 分析器
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/bbfe209e952b4487b185d00354d768d3.png)
| 类别 | 类别名 |介绍|
|--|--|--|
|Standard Analyzer | standard |标准分析器，按照 Unicode 文本分割算法切分单词，删除大多数标点符号并将单词转为小写形式，支持过滤停用词 |
| Simple Analyzer| simple | 简单分析器，在非字母的地方把单词切分开并将单词转为小写形式|
|Whitespace Analyzer | whitespace |空格分析器，遇到空格就切分字符，但不改变每个字符的内容 |

```json
POST _analyze
{
  "analyzer": "whitespace",
  "text":     "The quick brown fox."
}
```

结果为

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6176123738f64569bd6ddab3306ff9d1.png)
## 字符过滤器
| 类别 | 类别名 |介绍|
|--|--|--|
| HTML Strip Character Filter | html_strip | 去掉文本中的html标签|
| Mapping Character Filter |mapping  |根据提供的字段映射，把文本中的字符转换为映射的字符 |
| Pattern Replace Character Filter | pattern_replace | 根据指定的正则表达式把匹配的文本转换为指定的字符串|

```json
GET /_analyze
{
  "tokenizer": "keyword",
  "char_filter": [
    "html_strip"
  ],
  "text": "<p>I&apos;m so <b>happy</b>!</p>"
}
```
结果为
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/adfbd468215e46a1aa5c261ac1a16281.png)
## 分词器
| 类别 | 类别名 |介绍|
|--|--|--|
|Standard Tokenizer|standard|标准分词器，标准分析器采用的分词器，删除大多数标点符号，把文本切分为独立单词|
|Letter Tokenizer|letter|字母分词器，在非字母的地方把单词切分开，非字母字符会被丢弃|
|Lowercase Tokenizer|lowercase|小写分词器，在字母分词器的基础上把大写字母转为小写字母，|
|Whitespace Tokenizer|whitespace|空格分词器，是空格分析器的组成部分，在空格处把文本切分开并保持文本内容不变|
|Keyword tokenizer|keyword|将输入的整个文本当作一个词汇单元，不对文本进行拆分或处理|

```json
POST _analyze
{
  "tokenizer": "lowercase",
  "text": "The 2 QUICK Brown-Foxes"
}
```

结果为
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/bd4559d80dcd4d35a0308623062ed365.png)
## 分词过滤器
| 类别 | 类别名 |介绍|
|--|--|--|
|Stop token filter|stop|用于去除文本中常见但对分析无关紧要的停用词，比如 and that then|
|Length token filter|length|过滤掉太短或者太长的词汇|
|Stemmer token filter|stemmer|把每个分词转化为对应的原型（例如去掉，复数，时态等）|

```json
GET _analyze
{
  "tokenizer": "standard",
  "filter": [ "stemmer" ],
  "text": "the foxes jumping quickly"
}
```

结果为

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b331665895f94a7597ea13935907b157.png)
