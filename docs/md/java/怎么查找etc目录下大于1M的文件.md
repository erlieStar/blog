---
layout: post
title: 怎么查找/etc目录下大于1M的文件？
lock: need
---

# 面试官：怎么查找/etc目录下大于1M的文件？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201122100354368.jpg?)
## 介绍

**find命令应该是Linux下进行搜索最常用的一个命令了，功能强大，可以按照各种条件来搜索。**

怎么查找/etc目录下大于1M的文件？

```shell
find /etc -size +1M
```

下面我们来看具体的语法格式

```shell
find [路径] [选项] [操作]
```
| 选项                 | 含义                                   |
| -------------------- | -------------------------------------- |
| -name                | 根据文件名进行查找                     |
| -perm                | 根据文件权限进行查找                   |
| -prune               | 排除 查找目录                          |
| -user                | 根据文件属主查找                       |
| -group               | 根据文件属组查找                       |
| -mtime -n \| +n      | 根据文件更改时间查找                   |
| -nogroup             | 查找无有效数组的文件                   |
| -nouser              | 查找无有效属主的文件                   |
| -newer file1 ! file2 | 查找更新时间比file1新但比file2旧的文件 |
| -type                | 按照文件类型查找                       |
| -size -n +n          | 按文件大小查找                         |
| -mindepth n          | 从n级子目录开始搜索                    |
| -maxdepth n          | 最后搜索到n级子目录                    |

### 常见选项
**-type选项**
搜索当前目录下的文件

```shell
find . -type f
```
搜索当前目录下的链接文件

```shell
find . -type l
```

| 类型 | 解释         |
| ---- | ------------ |
| f    | 文件         |
| d    | 目录         |
| c    | 字符设备文件 |
| b    | 块设备文件   |
| l    | 链接文件     |
| p    | 管道文件     |

**-size选项**
| 类型 | 解释            |
| ---- | --------------- |
| -n   | 大小小于n的文件 |
| +n   | 大小大于n的文件 |
| n    | 大小等于n的文件 |

查找/etc目录下小于10000字节的文件

```shell
find /etc -size -10000c
```
查找/etc目录下大于1M的文件

```shell
find /etc -size +1M
```
**-mtime选项**
| 类型 | 解释              |
| ---- | ----------------- |
| -n   | n天以内修改的文件 |
| +n   | n天以外修改的文件 |
| n    | 正好n天修改的文件 |

查找etc目录下5天之内修改且以conf结尾的文件

```shell
find /etc -mtime -5 -name '*.conf'
```
查找etc目录下10天之前修改且属主为root的文件

```shell
find /etc -mtime +10 -user root
```
**-mmin选项**
| 类型 | 解释                |
| ---- | ------------------- |
| -n   | n分钟以内修改的文件 |
| +n   | n分钟以外修改的文件 |

查找/etc目录下30分钟之前修改的文件

```shell
find /etc/ -mmin + 30
```
查找/etc目录下30分钟之内修改的目录

```shell
find /etc -mmin -30 -type d
```
**-mindepth n 选项**
表示从n级子目录开始搜索

在/etc下的3级子目录开始搜索
```shell
find /etc -mindepth 3
```
**-maxdepth n 选项**
表示最多搜索到n级子目录

查找当前文件夹下的普通文件
```shell
find . -maxdepth 1 -type f
```
### 了解选项
## 操作
-print 打印输出（默认输出，不加也行）

-exec 对搜索到的文件执行特定的操作，格式为-exec 'command' {} \;

搜索/etc下的文件（非目录），文件名以conf结尾，且大于10k，然后将其删除

```shell
find /etc/ -type f -name '*.conf' -size +10k -exec rm -f {} \;
```
将/var/log目录下以log结尾的文件，且更改时间在7天以上的删除

```shell
find /var/log/ -name '*.log' -mtime +7 -exec rm -rf {} \;
```
搜索/etc下的文件（非目录），文件名以conf结尾，且大于10k，将其复制到/root/conf目录下

```shell
find /etc/ -type f  -name '*.conf' -size +10k exec cp  {} /root/conf/ \;
```
**逻辑运算符**
| 符号 | 含义 |
| ---- | ---- |
| -a   | 与   |
| -o   | 或   |
| -not | !    |

-ok 和exec功能一样，只是每次操作都会给用户提示
查找当前目录下，属主不是hdfs的所有文件

```shell
find . -not -user hdfs | find . ! -user hdfs
```
查找当前目录下，属主属于hdfs，且大小大于300字节的文件

```shell
find . -type f -a -user hdfs -a -size +300c
```
查找当前目录下属主为hdfs或者以xml结尾的普通文件

```shell
find . -type f -a \(-user hdfs -o -name '*.xml'\)
```