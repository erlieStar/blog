# Kafka 集群搭建

![在这里插入图片描述](https://img-blog.csdnimg.cn/995ba2069cba4fbba92d9a250b1471df.png)
## 安装基础环境

我们用虚拟机创建出3台机器，修改主机名为s1，s2和s3

```shell
# 打开如下文件，修改主机名
vim /etc/hostname
# 重启机器
reboot
```

查看centos版本为7.9
```shell
[root@s1 ~]# cat /etc/centos-release
CentOS Linux release 7.9.2009 (AltArch)
```
下载相关命令
```shell
yum -y install vim*
yum -y install net-tools
yum -y install lsof
yum -y install wget
yum -y install unzip
```

执行ifconfig命令获取ip地址
| hostname | ip |
|--|--|
| s1 | 192.168.9.128 |
| s2 |192.168.9.129  |
| s3 | 192.168.9.130 |

在3台服务器上配置host，添加如下内容
vim /etc/hosts

```shell
192.168.9.128 s1
192.168.9.129 s2
192.168.9.130 s3
```

我们配置一下server-1到server-2和server-3的ssh登陆

```shell
# 在3台机器执行如下命令
ssh-keygen -t rsa
# 查看server-1的公钥
cat ~/.ssh/id_rsa.pub
# 将server-1的公钥放到server-1，server-2和server-3的如下文件中
vim ~/.ssh/authorized_keys
# 在server-1执行如下命令能正常调转则说明成功
ssh root@s1
ssh root@s2
ssh root@s3
```

在镜像网站下载jdk
https://repo.huaweicloud.com/java/jdk/8u151-b12/

```shell
vim /etc/profile
```

```shell
JAVA_HOME=/root/opt/soft/jdk1.8.0_151
PATH=$JAVA_HOME/bin:$PATH
CLASSPATH=$JAVA_HOME/jre/lib/ext:$JAVA_HOME/lib/tools.jar
export PATH JAVA_HOME CLASSPATH
```

重新加载profile，显示版本号则安装成功
```shell
source /etc/profile
java -version
```
将jdk分发到其他节点，并配置环境变量

```shell
scp -r /etc/profile s2:/etc/profile
scp -r /etc/profile s3:/etc/profile
scp -r /root/opt/soft/jdk1.8.0_151 s2:/root/opt/soft/jdk1.8.0_151
scp -r /root/opt/soft/jdk1.8.0_151 s3:/root/opt/soft/jdk1.8.0_151
```
## 搭建Zookeeper集群

下载zookeeper-3.8.1

```shell
wget https://archive.apache.org/dist/zookeeper/zookeeper-3.8.1/apache-zookeeper-3.8.1-bin.tar.gz
tar -xvf apache-zookeeper-3.8.1-bin.tar.gz
```

修改配置文件
```shell
cp zoo_sample.cfg zoo.cfg

vim zoo.cfg

# 添加如下内容
# 格式为 hostname:连接leader端口:leader选举端口
server.1=s1:2188:2888
server.2=s2:2188:2888
server.3=s3:2188:2888

# 修改dataDir
dataDir=/root/opt/soft/apache-zookeeper-3.8.1-bin/data

# 在dataDir目录新建myid文件，s1服务器上myid内容为1，s2服务器上myid内容为2，以此类推
echo "1" > myid
```

将zookeeper目录分发到其他节点

```shell
scp -r /root/opt/soft/apache-zookeeper-3.8.1-bin s2:/root/opt/soft/apache-zookeeper-3.8.1-bin
scp -r /root/opt/soft/apache-zookeeper-3.8.1-bin s3:/root/opt/soft/apache-zookeeper-3.8.1-bin
```

修改s2服务器上myid文件中的的值为2，s3服务器上myid文件中的的值为3

## 编写启动脚本
服务端脚本命令格式如下

```shell
zkServer.sh {start|start-foreground|stop|restart|status|upgrade|print-cmd}
```

|命令| 含义 |
|--|--|
| ./zkServer.sh start | 启动ZooKeeper |
| ./zkServer.sh status | 查看ZooKeeper运行状态 |
|./zkServer.sh stop | 关闭ZooKeeper |

通过客户端脚本连接到ZooKeeper服务端

```shell
zkCli.sh -server 127.0.0.1:2181
```
为了方便启动和关闭集群，写一个脚本zk.sh

```shell
#!/bin/bash
case $1 in
"start")
    {
        for i in s1 s2 s3; do
            echo -------------------------------- $i zookeeper 启动 ---------------------------
            ssh $i "/root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkServer.sh start"
        done
    }
    ;;
"stop")
    {
        for i in s1 s2 s3; do
            echo -------------------------------- $i zookeeper 停止 ---------------------------
            ssh $i "/root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkServer.sh stop"
        done
    }
    ;;
"status")
    {
        for i in s1 s2 s3; do
            echo -------------------------------- $i zookeeper 状态 ---------------------------
            ssh $i "/root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkServer.sh status"
        done
    }
    ;;
esac
```

```shell
# 保存退出后，修改zk.sh脚本执行权限
chmod u+x zk.sh
```
执行这个脚本报错了，需要在zkEnv.sh的第一行指定一下JAVA_HOME（3个服务器都需要）

```shell
# '--config' option in the command line.
export JAVA_HOME=/root/opt/soft/jdk1.8.0_151
ZOOBINDIR="${ZOOBINDIR:-/usr/bin}"
ZOOKEEPER_PREFIX="${ZOOBINDIR}/.."
```
同步一下
```shell
scp -r /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkEnv.sh s2:/root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkEnv.sh
scp -r /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkEnv.sh s3:/root/opt/soft/apache-zookeeper-3.8.1-bin/bin/zkEnv.sh
```
执行 zk.sh start 都正常启动了，但是执行zk.sh status 显示如下

```shell
[root@server-1 bin]# ./zk.sh status
-------------------------------- s1 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Error contacting service. It is probably not running.
-------------------------------- s2 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Error contacting service. It is probably not running.
-------------------------------- s3 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Error contacting service. It is probably not running.
```
到logs文件夹下查看日志如下
```shell
Cannot open channel to 3 at election address s3/192.168.9.130:2888
```
关闭防火墙即可
```shell
# 临时关闭
sudo systemctl stop firewalld
# 然后reboot 永久关闭
sudo systemctl disable firewalld
# 查看防火墙状态。
sudo systemctl status firewalld
```
执行./zk.sh status结果如下，表明集群启动成功
```shell
[root@server-1 bin]# ./zk.sh status
-------------------------------- s1 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: follower
-------------------------------- s2 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: leader
-------------------------------- s3 zookeeper 状态 ---------------------------
ZooKeeper JMX enabled by default
Using config: /root/opt/soft/apache-zookeeper-3.8.1-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: follower
```
## 搭建Kafka集群

```shell
wget https://archive.apache.org/dist/kafka/0.11.0.3/kafka_2.11-0.11.0.3.tgz
```
进入config目录，修改server.properties文件中的如下参数
/root/opt/soft/kafka_2.11-0.11.0.3/config/server.properties

```shell
# 修改如下参数
# broker.id ： 集群内全局唯一标识，每个节点上需要设置不同的值
broker.id=1
# 可以删除topic
delete.topic.enable=true
# listeners：这个IP地址也是与本机相关的，每个节点上设置为自己的IP地址
listeners=PLAINTEXT://s1:9092
# log.dirs ：存放kafka消息的
log.dirs=/root/opt/soft/kafka_2.11-0.11.0.3/data
# zookeeper.connect ： 配置的是zookeeper集群地址
zookeeper.connect=s1:2181,s2:2181,s3:2181
```
分发kafka目录到其他节点

```shell
scp -r /root/opt/soft/kafka_2.11-0.11.0.3 s2:/root/opt/soft/kafka_2.11-0.11.0.3
scp -r /root/opt/soft/kafka_2.11-0.11.0.3 s3:/root/opt/soft/kafka_2.11-0.11.0.3
```

分发完成后，其他集群节点都需要修改配置文件server.properties中的 broker.id 和listeners 参数

编写集群操作脚本

```shell
#!/bin/bash
case $1 in
"start")
	{
		for i in s1 s2 s3; do
			echo -------------------------------- $i kafka 启动 ---------------------------
			ssh $i "source /etc/profile && /root/opt/soft/kafka_2.11-0.11.0.3/bin/kafka-server-start.sh -daemon /root/opt/soft/kafka_2.11-0.11.0.3/config/server.properties"
		done
	}
	;;
"stop")
	{
		for i in s1 s2 s3; do
			echo -------------------------------- $i kafka 停止 ---------------------------
			ssh $i "/root/opt/soft/kafka_2.11-0.11.0.3/bin/kafka-server-stop.sh"
		done
	}
	;;
esac
```
增加操作权限
```shell
chmod u+x kafka.sh

# 启动kafka集群
./kafka.sh start

# 关闭kafka集群
./kafka.sh stop
```

测试集群是否正常搭建

```shell
# 创建topic 副本数为3 分区数位3
./kafka-topics.sh --create --zookeeper s1:2181 --replication-factor 3 --partitions 3 --topic test

# 查看topic
./kafka-topics.sh --list --zookeeper s1:2181

# 删除topic
./kafka-topics.sh --delete --zookeeper s1:2181 --topic test

# 启动生产者控制台
./kafka-console-producer.sh --broker-list s1:9092 --topic test

# 启动消费者控制台
./kafka-console-consumer.sh --bootstrap-server s1:9092 --topic test --from-beginning
```

在生产者控制台输入hello world，在消费者控制台输出hello world，则表明kafka搭建成功

## 搭建Kafka图形界面
https://www.kafka-eagle.org/

```shell
wget https://github.com/smartloli/kafka-eagle-bin/archive/v3.0.1.tar.gz
```
配置环境变量
vim /etc/profile
```shell
export KE_HOME=/root/opt/soft/kafka-eagle-bin-3.0.1/efak-web-3.0.1
export PATH=$PATH:$KE_HOME/bin
```

修改system-config.properties文件
```shell
# 去掉cluster2，监控一个集群就行了
efak.zk.cluster.alias=cluster1
# 修改zookeeper地址
cluster1.zk.list=s1:2181,s2:2181,s3:2181
#cluster2.zk.list=xdn10:2181,xdn11:2181,xdn12:2181

cluster1.efak.offset.storage=kafka
# 注释调用如下一句
#cluster2.efak.offset.storage=zk

# 放开sqllite的连接方式，并修改url地址
######################################
# kafka sqlite jdbc driver address
######################################
efak.driver=org.sqlite.JDBC
efak.url=jdbc:sqlite:/root/opt/soft/kafka-eagle-bin-3.0.1/efak-web-3.0.1/db/ke.db
efak.username=root
efak.password=www.kafka-eagle.org

# 注释调mysql的连接方式
######################################
# kafka mysql jdbc driver address
######################################
#efak.driver=com.mysql.cj.jdbc.Driver
#efak.url=jdbc:mysql://127.0.0.1:3306/ke?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull
#efak.username=root
#efak.password=123456
```
执行如下命令启动

```shell
./ke.sh start
```
访问http://192.168.9.128:8048/，输入用户名：admin，密码：123456即可

发现启动失败，原来是要连接kafka的JMX

在kafka-server-start.sh中加上export JMX_PORT="9999"，分发到各个节点，然后重启即可
![在这里插入图片描述](https://img-blog.csdnimg.cn/283ae29f8c53443ebd5e60f8ebd6bf56.png)
## 备注
我在本地mac上启动代码调试时报了如下一个错误，拉取不到元数据，搜了一下是因为本地hosts文件没有配置域名映射的关系

org.apache.kafka.common.errors.TimeoutException: Failed to update metadata after 60000 ms

因为我们上面的server.properties文件中listeners配置如下

```shell
# listeners：这个IP地址也是与本机相关的，每个节点上设置为自己的IP地址
listeners=PLAINTEXT://s1:9092
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/cb4a72af654a43cfa806dce550f0ab25.png)
上传到zk上为s3:9092，如果本地不配置域名映射，那么客户端就不知道连接哪台服务器

vim /etc/hosts

```shell
192.168.9.128 s1
192.168.9.129 s2
192.168.9.130 s3
```