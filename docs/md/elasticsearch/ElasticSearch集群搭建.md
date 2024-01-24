---
layout: post
title: ElasticSearch 集群搭建
lock: need
---

# ElasticSearch 集群搭建

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

启动 es 不能使用 root 用户，所以创建一个其他用户

https://www.elastic.co/cn/downloads/past-releases/elasticsearch-8-1-0
注意要选对版本，不然 java 命令执行会报错

以下命令同时在 3 台服务器执行
```shell
mkdir /opt/soft
cd /opt/soft
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.1.0-linux-aarch64.tar.gz
tar -xvf elasticsearch-8.1.0-linux-aarch64.tar.gz
# 创建数据文件目录
mkdir /opt/soft/elasticsearch-8.1.0/data
# 创建证书目录
mkdir /opt/soft/elasticsearch-8.1.0/config/certs
# 新增 es 用户
useradd es
# 修改文件拥有者
chown -R es:es /opt/soft/elasticsearch-8.1.0
```
## 生成安全证书

在第一台服务器节点生成安全证书
```shell
# 切换用户
su es
cd /opt/soft/elasticsearch-8.1.0
# 签发 ca 证书，过程中需按两次回车键
bin/elasticsearch-certutil ca
# 用 ca 证书签发节点证书，过程中需按三次回车键
bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12
# 将生成的证书移动到 config/certs 目录中
mv elastic-stack-ca.p12 elastic-certificates.p12 config/certs
```
## 生成 http 证书
在第一台服务器节点生成集群多节点 http 证书

```shell
bin/elasticsearch-certutil http
```

一些需要操作的部分如下所示
```shell
Generate a CSR? [y/N]n
Use an existing CA? [y/N]y
CA Path: certs/elastic-stack-ca.p12
Password for elastic-stack-ca.p12:
For how long should your certificate be valid? [5y] 5y
Generate a certificate per node? [y/N]n
When you are done, press <ENTER> once more to move on to the next step.
s1
s2
s3
Is this correct [Y/n]y
When you are done, press <ENTER> once more to move on to the next step.
s1的ip地址
s2的ip地址
s3的ip地址
Is this correct [Y/n]y
Do you wish to change any of these options? [y/N]n
Provide a password for the "http.p12" file:  [<ENTER> for none]
What filename should be used for the output zip file? [/opt/soft/elasticsearch-8.1.0/elasticsearch-ssl-http.zip]
```
```shell
unzip elasticsearch-ssl-http.zip
mv elasticsearch/http.p12 kibana/elasticsearch-ca.pem config/certs
```
## 配置节点
配置第一个节点

elasticsearch.yml
```yml
cluster.name: es-cluster
node.name: node-1

path.data: /opt/soft/elasticsearch-8.1.0/data
path.logs: /opt/soft/elasticsearch-8.1.0/logs

network.host: s1
http.port: 9200

discovery.seed_hosts: ["s1"]


# 安全认证
xpack.security.enabled: true
xpack.security.enrollment.enabled: true

xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.keystore.path: /opt/soft/elasticsearch-8.1.0/config/certs/http.p12
xpack.security.http.ssl.truststore.path: /opt/soft/elasticsearch-8.1.0/config/certs/http.p12

xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: /opt/soft/elasticsearch-8.1.0/config/certs/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: /opt/soft/elasticsearch-8.1.0/config/certs/elastic-certificates.p12

# node-1 为上面配置的节点名称
cluster.initial_master_nodes: ["node-1"]

http.host: [_local_, _site_]
ingest.geoip.downloader.enabled: false
xpack.security.http.ssl.client_authentication: none
```

```shell
# 前台启动
bin/elasticsearch
# 后台启动
bin/elasticsearch -d
```

启动报错
```shell
ERROR: [3] bootstrap checks failed. You must address the points described in the following [3] lines before starting Elasticsearch.
bootstrap check failure [1] of [3]: max file descriptors [4096] for elasticsearch process is too low, increase to at least [65535]
bootstrap check failure [2] of [3]: max number of threads [2723] for user [es] is too low, increase to at least [4096]
bootstrap check failure [3] of [3]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

前面2个报错
```shell
# 在root用户下追加配置
vim /etc/security/limits.conf 
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
```

第3个报错

```shell
# 在root用户下追加配置
vim /etc/sysctl.conf
vm.max_map_count = 262144
```
重新加载 /etc/sysctl.conf 配置

```shell
sysctl -p
```
9300端口为es集群组件的通信端口，9200端口为浏览器访问的 http 协议的restful端口，防火墙打开9200和9300端口
```shell
/sbin/iptables -I INPUT -p tcp --dport 9200 -j ACCEPT
/sbin/iptables -I INPUT -p tcp --dport 9300 -j ACCEPT
```

访问 https://s1:9200，能正常访问即可，用户名和密码在启动日志中

将加密文件和配置文件分发到其他机器
```shell
scp -r /opt/soft/elasticsearch-8.1.0/config/certs s2:/opt/soft/elasticsearch-8.1.0/config
scp -r /opt/soft/elasticsearch-8.1.0/config/certs s3:/opt/soft/elasticsearch-8.1.0/config
scp -r /opt/soft/elasticsearch-8.1.0/config/elasticsearch.yml s2:/opt/soft/elasticsearch-8.1.0/config/elasticsearch.yml
scp -r /opt/soft/elasticsearch-8.1.0/config/elasticsearch.yml s3:/opt/soft/elasticsearch-8.1.0/config/elasticsearch.yml
```

配置其他节点，将 node.name 和 network.host 改成对应的值即可

```shell
node.name: node-2
network.host: s2
```
## Kibana 安装

```shell
wget https://artifacts.elastic.co/downloads/kibana/kibana-8.1.0-linux-aarch64.tar.gz
tar -xvf kibana-8.1.0-linux-aarch64.tar.gz
```

给 Kibana 生成证书文件

```shell
cd /opt/soft/elasticsearch-8.1.0
bin/elasticsearch-certutil csr -name kibana -dns s1
unzip csr-bundle.zip
mv kibana/kibana.csr kibana/kibana.key /opt/soft/kibana-8.1.0/config
cd /opt/soft/kibana-8.1.0/config
```

```shell
# 安装 openssl
yum install -y openssl openssl-devel
openssl x509 -req -in kibana.csr -signkey kibana.key -out kibana.crt
```
生成账号密码
```shell
bin/elasticsearch-reset-password -u kibana
# 密码如下
New value: *iBewlzbzMK3X0eH3Ffy
```

kibnana.yml

```shell
server.port: 5601
server.host: "s1"
i18n.locale: "zh-CN"

elasticsearch.hosts: ["https://s1:9200"]
elasticsearch.username: "kibana"
elasticsearch.password: "*iBewlzbzMK3X0eH3Ffy"

elasticsearch.ssl.verificationMode: none

elasticsearch.ssl.certificateAuthorities: [ "/opt/soft/elasticsearch-8.1.0/config/certs/elasticsearch-ca.pem" ]
server.ssl.enabled: true
server.ssl.certificate: /opt/soft/kibana-8.1.0/config/kibana.crt
server.ssl.key: /opt/soft/kibana-8.1.0/config/kibana.key
```

```shell
chown -R es:es /opt/soft/kibana-8.1.0
```

启动

```shell
su es
bin/kibana
```
访问 https://s1:5601

## 安装 IK 分词器
https://github.com/medcl/elasticsearch-analysis-ik

下载并解压到 plugins/ik 文件夹
```shell
cd /opt/soft/elasticsearch-8.1.0/plugins && mkdir ik
cd ik
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.1.0/elasticsearch-analysis-ik-8.1.0.zip
```

分发到其他节点
```shell
scp -r /opt/soft/elasticsearch-8.1.0/plugins/ik/elasticsearch-analysis-ik-8.1.0.zip s2:/opt/soft/elasticsearch-8.1.0/plugins/ik
scp -r /opt/soft/elasticsearch-8.1.0/plugins/ik/elasticsearch-analysis-ik-8.1.0.zip s3:/opt/soft/elasticsearch-8.1.0/plugins/ik
```
重启集群，能正常分词即可

```json
POST _analyze
{
  "analyzer": "ik_smart",
  "text": "测试分词效果"
}
```