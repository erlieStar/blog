---
layout: post
title: 5分钟极速入门Dubbo使用
lock: need
---

# Dubbo实战：5分钟极速入门Dubbo使用

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210527193642348.jpg?)
## 介绍
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210527110204216.png)

在使用Dubbo开发时，我们一般将项目分为如下3个模块

api：将服务提供者和服务消费者都需要用到的接口放在api层
consumer：服务消费者
producer：服务提供者

假如有如下一个场景，我们需要查询用户的信息，用户请求发送到consumer这个服务，然后consumer这个服务调用producer这个服务获取到用户信息，并返回给用户

## Api模块实现
用户信息封装到UserInfo类中，因为需要网络传输，所以需要实现序列化接口
```java
public class UserInfo implements Serializable {

    private String userId;
    private String phoneNum;
    private String userAddress;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPhoneNum() {
        return phoneNum;
    }

    public void setPhoneNum(String phoneNum) {
        this.phoneNum = phoneNum;
    }

    public String getUserAddress() {
        return userAddress;
    }

    public void setUserAddress(String userAddress) {
        this.userAddress = userAddress;
    }
}
```
用户信息接口，producer模块写这个接口的实现，consumer模块写这个接口的调用
```java
public interface UserService {

    UserInfo hello(String userId);
}
```

## producer模块实现
我们只需要引入对应的starter和zookeeper模块即可方便的使用dubbo

```xml
<dependency>
  <groupId>org.apache.dubbo</groupId>
  <artifactId>dubbo-spring-boot-starter</artifactId>
  <version>2.7.3</version>
</dependency>
<dependency>
  <groupId>org.apache.dubbo</groupId>
  <artifactId>dubbo-dependencies-zookeeper</artifactId>
  <version>2.7.6</version>
  <type>pom</type>
  <exclusions>
    <exclusion>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-log4j12</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```
producer模块写接口的实现即可
```java
@Service
public class UserServiceImpl implements UserService {

    @Override
    public UserInfo hello(String username) {
        UserInfo userInfo = new UserInfo();
        userInfo.setUserId("10");
        userInfo.setPhoneNum("15810554635");
        userInfo.setUserAddress("北京昌平");
        return userInfo;
    }
}
```
**需要注意的一点是@Service注解是dubbo中的，初学者容易导入成spring框架的@Service，导致服务导出失败**

```java
import org.apache.dubbo.config.annotation.Service;
```
启动类上需要加上@EnableDubbo注解

```java
@EnableDubbo
@SpringBootApplication
public class ProducerApp {
    public static void main(String[] args) {
        SpringApplication.run(ProducerApp.class, args);
    }
}
```
application.yaml

```yaml
server:
  port: 8081

spring:
  application:
    name: springboot-dubbo-producer

dubbo:
  registry:
    # 注册中心地址及协议
    address: zookeeper://myhost:2181
```
在application.yaml指定服务启动的端口，服务名字和注册中心的地址
## consumer模块实现

consumer端只需要在需要调用的接口上加上@Reference注解，即可调用到producer端
```java
@RestController
public class UserController {

    @Reference(check = false)
    private UserService userService;

    @RequestMapping("hello")
    public UserInfo hello(@RequestParam("id") String id) {
        return userService.hello(id);
    }

}
```
**@Reference中check=false表示启动的时候不去管UserService服务是否能正常提供服务，这个值默认为true，表示当UserService不能提供服务时，会导致consumer端启动失败**

application.yaml
```yaml
server:
  port: 8080

spring:
  application:
    name: springboot-dubbo-consumer

dubbo:
  registry:
    protocol: zookeeper
    address: myhost:2181
```
同样在application.yaml指定服务启动的端口，服务名字和注册中心的地址

```java
curl http://localhost:8080/hello
```

```json
{
  "userId": "10",
  "phoneNum": "158****4635",
  "userAddress": "北京昌平"
}
```
可以看到使用RPC框架后，调用远程方法和调用本地方法一样简单

本文github地址：https://github.com/erlieStar/dubbo-learning