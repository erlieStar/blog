---
layout: post
title: Redis持久化策略详解（二）
lock: need
---

# Redis源码解析：Redis持久化策略详解（二）

![在这里插入图片描述](https://img-blog.csdnimg.cn/eff3251be82c459499b2e6cc1f8ab839.png)
## RDB
上一节我们提到了，Redis持久化方式有RDB和AOF，本节我们深入了解一下这2种持久化方式

### 生成RDB文件的时机
![在这里插入图片描述](https://img-blog.csdnimg.cn/0f269cf68c484daca90331539e9b8130.png)

生成rdb文件的相关配置如下

redis.conf

```conf
# 900秒内执行一次set操作 则持久化1次  
save 900 1

# 300秒内执行10次set操作,则持久化1次
save 300 10

# 60秒内执行10000次set操作,则持久化1次
save 60 10000
```

**从图中可以看出执行bgsave命令会通过生成子进程的方式进行持久化。而执行save命令则直接通过当前进程执行持久化，会影响后续命令的处理，因此我们要避免使用save命令**
### 生成RDB文件的过程
![在这里插入图片描述](https://img-blog.csdnimg.cn/682fd198e5d3426cb2219780e57953fa.png)
1. 首先判断一下是否有其他子进程生成rdb文件或者执行aof重写，有则直接退出
2. 没有的话fork产生子进程，让子进程生成rdb文件
3. 父进程正常响应其他命令
4. 当子进程生成rdb文件后，通过信号通知父进程，父进程做后续操作（即执行rdb.c/backgroundSaveDoneHandler方法）

### RDB文件格式
我们来看一下RDB文件是如何存储数据的
```shell
# 清空redis服务器的所有数据
./redis-cli flushall

# 登陆redis
./redis-clit
```
```shell
127.0.0.1:6379> set testKey testValue
OK
127.0.0.1:6379> save
OK
127.0.0.1:6379>
save
```

查看生成的rdb文件，是一个二进制文件
```shell
od -A x -t x1c -v dump.rdb
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/f9ae3da2c0f34d07b4ea18e92bf1063c.png?)

命令显示的结果中第一行是用十六进制显示的dump.rdb文件的内容，第二行是每个字节对应的ascii字符，后面的行以此类推

rdb文件的详细格式就不分析了，简单介绍一下标红的地方
redis为魔数，0009为rdb版本，FF为rdb文件结束符号，FF后面的内容为rdb文件的crc64校验码

rdb文件的大概组成如下所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/ebdaac6c8db94481b4ca3f65f5596e66.png)

## AOF
当redis执行命令的时候，会先把命令写入aof_buf缓冲区中，后续通过一定的持久化策略将aof_buf中的内容持久化到文件

![在这里插入图片描述](https://img-blog.csdnimg.cn/834c63cb300a40de89bc20c53c7e0028.png)

持久化的策略有如下三种

![在这里插入图片描述](https://img-blog.csdnimg.cn/71a382d0dd2d47f8bff731b34ba531c5.png)

持久化策略的执行时机如下所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/33c015a7da5b4b31862d5af3040cf385.png)

everysec策略是通过定时任务来实现的。

而always策略则和我们想的不太一样，他并不是在每次处理完命令就进行持久化，而是在每次处理事件之前进行持久化，因为事件处理的时间间隔很短，所以差别不大

## AOF重写
**当aof文件越来越大时，我们可以通过aof重写来从内存中读取数据重新生成更短的aof文件**
### AOF重写时机
![在这里插入图片描述](https://img-blog.csdnimg.cn/53ceb05adc464ee08769f4d1e4bd731a.png)
配置文件中关系aof重写相关的配置如下

redis.conf
```conf
# 是否开启 aof
appendonly yes

# aof 文件名
appendfilename "appendonly.aof"

# aof文件持久化策略，可选值为always，everysec，no
appendfsync everysec

# 是否开启 aof 文件重写
no-appendfsync-on-rewrite no

# aof 重写策略
# 超过上次 aof 文件的百分比后才进行持久化操作
auto-aof-rewrite-percentage 100
# 执行 aof 重写时，文件要达到的最小大小
auto-aof-rewrite-min-size 64mb
```

### AOF重写过程

![在这里插入图片描述](https://img-blog.csdnimg.cn/05c4a42339a24be3a63cda9263a4df59.png)

1. 首先判断一下是否有其他子进程生成rdb文件或者执行aof重写，有则直接退出
2. 父进程fork产生子进程，让子进程进行aof重写
3. 父进程在子进程进行aof重写的期间，把命令放入aof_buf的同时，将命令放入aof_rewrite_buf
4. 子进程读取内存中的数据，生成新的aof文件，生成完毕，信号通知父进程执行后续操作（即执行aof.c/backgroundRewriteDoneHandler方法）
5. 父进程将aof_rewite_buf中的内容写入新的aof文件，并替换原来的aof文件

当aof_rewrite_buf中有较多数据时，怕缓冲区溢出，因此通过管道进行了优化，即在aof_rewite_buf中的数据会实时传递给子进程，最后父进程收到信号后再将aof_rewite_buf中剩余的内容写入新的aof文件（理解大概就行，不深究了）
## 重启后数据加载流程
当redis启动后需要从持久化文件中恢复数据，因为Redis的持久化方式有如下3种，RDB，AOF，混合持久化。因此加载数据的过程也主要分为三种情况（加载源码在server.c/loadDataFromDisk）

![在这里插入图片描述](https://img-blog.csdnimg.cn/b4c6a6ae946b47589e5aa3dfee530d7e.png)