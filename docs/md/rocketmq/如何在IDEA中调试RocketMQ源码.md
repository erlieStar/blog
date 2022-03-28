---
layout: post
title: 如何在IDEA中调试RocketMQ源码
lock: need
---

# RocketMQ源码解析：如何在IDEA中调试RocketMQ源码

![在这里插入图片描述](https://img-blog.csdnimg.cn/d5b82a8921b244e280060f5ba44f6711.jpg?)
## 配置RocketMQ运行时环境
首先从github下载rocketmq源码：https://github.com/apache/rocketmq

接着建一个RocketMQ运行时目录，/Users/peng/software/rocketmq（随意指定哈）。在这个目录下建3个文件夹，conf，logs，store。

接着从源码的distribution/conf文件夹复制broker.conf，logback_namesrv.xml，logback_broker.xml文件到conf目录

把logback_namesrv.xml，logback_broker.xml文件中的${user.home}替换为/Users/peng/software/rocketmq

在broker.conf文件中增加如下配置

```conf
# nameserver的地址
namesrvAddr = 127.0.0.1:9876
# 这是存储路径，你设置为你的rocketmq运行目录的store子目录
storePathRootDir = /Users/peng/software/rocketmq/store
# 这是commitLog的存储路径
storePathCommitLog = /Users/peng/software/rocketmq/store/commitlog
# consume queue文件的存储路径
storePathConsumeQueue = /Users/peng/software/rocketmq/store/consumequeue
# 消息索引文件的存储路径
storePathIndex = /Users/peng/software/rocketmq/store/index
# checkpoint文件的存储路径
storeCheckpoint = /Users/peng/software/rocketmq/store/checkpoint
# abort文件的存储路径
abortFile = /Users/peng/software/rocketmq/abort
```

## 启动NameServer
点击运行NamesrvStartup类，然后在Environment variables（环境变量）一栏中增加ROCKETMQ_HOME环境变量，启动即可
![在这里插入图片描述](https://img-blog.csdnimg.cn/39a02d046cdb435f894c6b3cbfed5666.png?)
## 启动Broker
点击运行BrokerStartup类，然后在Environment variables一栏中增加ROCKETMQ_HOME环境变量，在Program arguments（程序运行时参数）指定配置文件

```conf
-c /Users/peng/software/rocketmq/conf/broker.conf
```
启动即可
![在这里插入图片描述](https://img-blog.csdnimg.cn/6362ba72fe4b4f09a10e7fde22594ab7.png?)
## 测试
在org.apache.rocketmq.example.quickstart.Producer这个类中，增加一行代码指定nameserver的地址，然后就能正常发送消息

![在这里插入图片描述](https://img-blog.csdnimg.cn/4ba5f9e6aee64ec08eaca742a42581b9.png?)
在org.apache.rocketmq.example.quickstart.Consumer这个类中，增加一行代码指定nameserver的地址，然后就能正常接收消息

![在这里插入图片描述](https://img-blog.csdnimg.cn/39310a59e4544f47839536b715aa62c7.png?)
