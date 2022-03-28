---
layout: post
title: 如何查看/etc目录下包含abc字符串的文件？
lock: need
---

# 面试官：如何查看/etc目录下包含abc字符串的文件？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011232535900.png?)
## 介绍
其实这种需求在工作中用的还是很多的，例如进行数据库迁移的时候，就得知道哪些项目用了指定的数据库，如果一个一个查看配置文件还是很费时间的。
我想到的有2种写法

第一种写法

```shell
find /etc -type f | xargs grep -l 'abc'
```
第二种写法 

```shell
grep -rl abc /etc
```

find命令还是挺强大的，我打算重开一篇好好分享一下，今天就先分享一下grep egrep的使用

## 用法
使用一般有如下两种形式

**第一种形式**
grep [option] [pattern] [file1,file2]

如查找show.txt里面包含content的行

```shell
grep content show.txt
```

**第二种形式**
command | grep [option] [pattern]

如查看某个服务信息

```shell
ps -ef | grep mongo
```
如查找show.txt里面包含content的行

```shell
cat show.txt | grep content
```

## 必须掌握的选项
| 选项 | 含义                                       |
| ---- | ------------------------------------------ |
| -v   | 显示不匹配行信息（反向搜索）               |
| -i   | 搜索时忽略大小写                           |
| -n   | 显示行号（文件中的行号）                   |
| -r   | 递归搜索（搜索文件夹）                     |
| -E   | 支持扩展正则表达式                         |
| -F   | 不按正则表达式匹配，按照字符串字面意思匹配 |

show.txt文件中的内容如下

```txt
a
b
c
d
py*
i love python
```

-v 选项
```shell
grep -v a show.txt
 
b
c
d
*py
i love python
```
-n选项

```shell
grep -n a show.txt 

1:a
```
 -r选项
查找/etc/myconfig及其子目录下，打印出包含content字符串所在行的内容
```shell
 grep -r content /etc/myconfig
```
-F选项

```shell
grep py* show.txt 

py*
i love python
```
py*被当成正则表达式处理，我就想搜索py*这个内容，就可以用到-F选项

```shell
grep -F py* show.txt

py*
```
## 了解的选项
| 选项 | 含义                                     |
| ---- | ---------------------------------------- |
| -c   | 只输出匹配行的数量，不显示具体内容       |
| -w   | 匹配整词                                 |
| -x   | 匹配整行                                 |
| -l   | 只列出匹配的文件名，不显示具体匹配行内容 |
| -a   | 将二进制文件转为文本                     |

show.txt的文件内容如下

```txt
love 
lovelove
i love
i love a
```
-w选项（lovelove这个词没有显示出来，因为love前后得有空格或者tab才会认为是一个单词）

```shell
grep -w love show.txt

love 
i love
i love a
```
-x 选项（匹配行，行的内容只能是i love a）

```shell
grep -x "i love a" show.txt
i love a
```

这些选项可以混着用，例如
**查找/etc/myconfig及其子目录下，打印出包含content字符串所在文件的文件名**

```shell
grep -rl mad81 /etc/myconfig
```

-r：递归搜索（搜索文件夹）
-l：只列出匹配的文件名，不显示具体匹配行内容、

当然用find也是可以的，只不过麻烦一点
```java
find /etc/myconfig -type f | xargs grep -l 'abc' 
```
## 查看日志常用的选项
| 选项 | 含义                  |
| ---- | --------------------- |
| -C n | 显示匹配行及其前后5行 |
| -B n | 显示匹配行及其前5行   |
| -A n | 显示匹配行及其后5行   |

show.txt内容如下

```shell
1
2
3
4
5
6
7
```
查找4及其上下2行
```shell
cat show.txt | grep -C 2 4
2
3
4
5
6
```
查找4及其前2行
```shell
grep -B 2 4 show.txt 
2
3
4
```

## grep和egrep的区别和联系

grep默认不支持扩展正则表达式，只支持基础正则表达式
使用grep -E 可以支持扩展正则表达式
使用egrep可以支持扩展正则表达式，与grep -E等价