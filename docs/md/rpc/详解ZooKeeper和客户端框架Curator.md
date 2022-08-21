---
layout: post
title: 详解ZooKeeper和客户端框架Curator
lock: need
---

# 手写RPC框架：详解ZooKeeper和客户端框架Curator

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201115224400929.jpg?)
## Zookeeper介绍
zookeeper的数据模型和文件系统类似，每一个节点称为znode，是zookeeper中的最小数据单元，每一个znode上可以报存数据和挂载子节点，从而构成一个层次化的属性结构

**zookeeper可以创建如下几种类型节点**

| 节点类型 | 解释 |
|--|--|
| 持久节点 |  将节点创建为持久节点，数据会一直存储在zookeeper服务器上，即使创建该节点的客户端与服务端的会话关闭了，该节点依然不会被删除|
| 持久顺序节点|在持久节点的基础上增加了节点有序的特性|
| 临时节点 | 将节点创建为临时节点，数据不会一直存储在zookeeper服务器上，当创建该临时节点的客户端会话关闭时，该节点在相应的zookeeper服务器上被删除 |
|临时顺序节点|在临时节点的基础上增加了节点有序的特性|

简单演示一下常用的命令

```java
create [-s] [-e] path data acl
```
-s : 创建顺序节点
-e : 创建临时节点
path : 路径
data : 数据
acl : 权限

create默认创建的是持久化节点

```java
create /level-1 123
create /level-1/level-1-2 456
get /level-1（获取节点level-1的值，输出123）
ls /level-1 （获取节点level-1的子节点，输出[level-1-2]）
// 创建一个顺序节点
create -s /nodes 123（输出nodes0000000003）
create -s /nodes 456（输出nodes0000000004）
```
执行完上述命令后，数据结构如下所示

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201115222416830.png?)

这里简单说一下顺序节点的特性。每次创建顺序节点时，zk都会在路径后面自动添加上10位的数字（计数器），例如 < path >0000000001，< path >0000000002，……这个计数器可以保证在同一个父节点下是唯一的。在zk内部使用了4个字节的有符号整形来表示这个计数器，也就是说当计数器的大小超过2147483647时，将会发生溢出，每次在父节点下创建一个临时节点时，大小加1，如上图的3到4

## Zookeeper图形工具
当我们想看zookeeper上的节点信息时，输命令很麻烦，也不直观，介绍一个可视化的客户端ZooInspector

**下载地址：https://issues.apache.org/jira/secure/attachment/12436620/ZooInspector.zip**

解压后进入build目录执行命令

```shell
java -jar zookeeper-dev-ZooInspector.jar
```

输入连接地址，即可看到zookeeper的节点值，权限信息，还是很方便的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200605222416358.PNG?)
## Curator的使用
Curator是netflix公司开源的一套zookeeper客户端。它能帮我们简化对zookeeper的操作。解决了很多底层的问题，如包括接连重连、反复注册Watcher和NodeExistsException等。

此外Curator还提供了Zookeeper的各种应用场景：Recipe、共享锁服务、Master选举机制和分布式计数器等

Curator分为如下几个模块
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201115223311557.png?)
我们最常用的是curator-framework（对zookeeper api的封装，例如增加了连接管理，重试机制等）和curator-recipes（zookeeper典型应用场景的实现），curator-client（zookeeper client的封装）

我们使用时候只要加入如下依赖就行

```xml
<dependency>
  <groupId>org.apache.curator</groupId>
  <artifactId>curator-recipes</artifactId>
  <version>4.0.1</version>
</dependency>
```

演示一下Curator Api的基本使用

```java
@Slf4j
public class ApiDemo {

    private CuratorFramework client;

    /**
     * RetryPolicy 是重试策略接口
     * https://www.cnblogs.com/qingyunzong/p/8666288.html
     */
    @Test
    @Before
    public void connect() {
        String connectString = "myhost:2181";
        // 重试3次，每次间隔1000ms
        RetryPolicy retryPolicy = new ExponentialBackoffRetry(1000, 3);
        client = CuratorFrameworkFactory.newClient(connectString, retryPolicy);
        client.start();
    }

    /**
     * 创建一个持久节点
     */
    @Test
    public void createPersistent() throws Exception {
        // 创建一个内容为空的节点
        client.create().forPath("/persistent");
        // 创建包含内容的节点
        client.create().forPath("/persistentContent", "我是内容".getBytes());
    }

    /**
     * 创建临时节点
     */
    @Test
    public void createEphemeral() throws Exception {
        // 创建一个内容为空的节点
        client.create().withMode(CreateMode.EPHEMERAL).forPath("Ephemeral");
        // 创建包含内容的节点
        client.create().withMode(CreateMode.EPHEMERAL).forPath("/ephemeralContent", "我是内容".getBytes());
    }

    /**
     * 获取值
     */
    @Test
    public void getData() throws Exception {
        client.getData().forPath("/persistentContent");
    }

    /**
     * 更新值
     */
    @Test
    public void setData() throws Exception {
        client.setData().forPath("/persistentContent", "新内容".getBytes());
    }

    /**
     * 删除
     */
    @Test
    public void delete() throws Exception {
        client.delete().forPath("/persistent");
    }
}
```
## 事件详解
zookeeper提供了分布式数据发布/订阅，允许客户端向服务端注册一个watcher监听，当服务端的一些指定事件触发了这个watcher，那么就会向指定客户端发送一个事件通知来实现分布式的通知功能。

**Zookeeper定义了Watcher接口来表示一个标准的事件处理器，内部包含了
KeeperState和EventType两个枚举类，来表示通知状态和事件类型**

KeeperState和EventType关系如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020111523370616.png?)
对服务端的事件监听，是客户端操作服务器的一项重要工作。在curator的api中，事件监听有两种模式

1. 标准的观察模式，只能监听一次（即Zookeeper中的Watcher接口，为了能抛出异常，curator重新定义了一个CuratorWatcher接口）
2. 缓存监听模式，可以监听多次

缓存监听模式，可以理解为本地缓存视图和远程zookeeper视图的对比过程，当感知到zk集群的znode状态变化时，会触发事件，注册的监听器会处理这些事件。

缓存监听类型有如下三种

| 监听类型 | 解释 |
|--|--|
| Node Cache | 监听ZNode节点 |
| Path Cache | 监听ZNode子节点 |
| Tree Cache |  监听ZNode节点及其子节点|

还是直接上例子

```java
@Test
public void watcher() throws Exception {
    Watcher watcher = new Watcher() {
        @Override
        public void process(WatchedEvent event) {
            // 只输出一次
            // /watchDemo SyncConnected NodeDataChanged
            System.out.println(event.getPath() + " " + event.getState() + " " + event.getType());
        }
    };

    String path = "/watchDemo";
    if (client.checkExists().forPath(path) == null) {
        client.create().forPath(path);
    }
    client.getData().usingWatcher(watcher).forPath(path);

    client.setData().forPath(path, "第一个变更的内容".getBytes());
    client.setData().forPath(path, "第二个变更的内容".getBytes());

    TimeUnit.SECONDS.sleep(3);
}
```

```java
@Test
public void curatorWatcher() throws Exception {
    CuratorWatcher watcher = new CuratorWatcher() {
        @Override
        public void process(WatchedEvent event) throws Exception {
            // 只输出一次
            // /watchDemo SyncConnected NodeDataChanged
            System.out.println(event.getPath() + " " + event.getState() + " " + event.getType());
        }
    };

    String path = "/watchDemo";
    if (client.checkExists().forPath(path) == null) {
        client.create().forPath(path);
    }
    client.getData().usingWatcher(watcher).forPath(path);

    client.setData().forPath(path, "第一个变更的内容".getBytes());
    client.setData().forPath(path, "第二个变更的内容".getBytes());

    TimeUnit.SECONDS.sleep(3);
}
```
**可以看到不管是zookeeper中的Watcher接口，还是curator中的CuratorWatcher接口，只能监听一次事件**

```java
@Test
public void treeCacheListener() throws Exception {

    String bossPath = "/treeCache";
    String workerPath = "/treeCache/id-";

    if (client.checkExists().forPath(bossPath) == null) {
        client.create().forPath(bossPath);
    }

    TreeCache treeCache = new TreeCache(client, bossPath);
    TreeCacheListener listener = ((CuratorFramework client, TreeCacheEvent event) -> {
        String path = null;
        String content = null;
        switch (event.getType()) {
            case NODE_ADDED:
                log.info("节点增加");
                path = event.getData().getPath();
                content = new String(event.getData().getData());
                break;
            case NODE_UPDATED:
                log.info("节点更新");
                path = event.getData().getPath();
                content = new String(event.getData().getData());
                break;
            case NODE_REMOVED:
                log.info("节点移除");
                path = event.getData().getPath();
                content = new String(event.getData().getData());
                break;
            default:
                break;
        }
        // 事件类型为: NODE_ADDED, 路径为: /treeCache, 内容为: 192.168.97.69
        // 事件类型为: INITIALIZED, 路径为: null, 内容为: null
        // 事件类型为: NODE_ADDED, 路径为: /treeCache/id-0, 内容为: 0
        // 事件类型为: NODE_ADDED, 路径为: /treeCache/id-1, 内容为: 1
        // 事件类型为: NODE_REMOVED, 路径为: /treeCache/id-0, 内容为: 0
        // 事件类型为: NODE_REMOVED, 路径为: /treeCache/id-1, 内容为: 1
        // 事件类型为: NODE_REMOVED, 路径为: /treeCache, 内容为: 192.168.97.69
        log.info("事件类型为: {}, 路径为: {}, 内容为: {}", event.getType(), path, content);
    });
    treeCache.getListenable().addListener(listener);
    treeCache.start();

    // 创建2个子节点
    for (int i = 0; i < 2; i++) {
        client.create().forPath(workerPath + i, String.valueOf(i).getBytes());
    }

    // 删除2个子节点
    for (int i = 0; i < 2; i++) {
        client.delete().forPath(workerPath + i);
    }

    // 删除当前节点
    client.delete().forPath(bossPath);

    TimeUnit.SECONDS.sleep(3);
}
```
可以看到，**缓存监听模式可以重复注册**

zookeeper其他的内容就不多做介绍了，了解了zookeeper和curator api，看Dubbo注册中心模块中的zookeeper相关代码就没有多大问题了
## 参考博客
[1]https://www.cnblogs.com/crazymakercircle/p/10228385.html