---
layout: post
title: 如何高效的测试Dubbo接口
lock: need
---

# Dubbo实战：如何高效的测试Dubbo接口

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210531230158796.jpg?)
## Dubbo Admin 使用
**我们可以用新版的Dubbo Amind来测试Dubbo接口**

我们在本地启动一个Dubbo Admin来演示一下用法

github地址：
https://github.com/apache/dubbo-admin

```shell
git clone https://github.com/apache/dubbo-admin
cd dubbo-admin
mvn clean package -DskipTests=true
cd dubbo-admin-distribution/target
java -jar dubbo-admin-0.3.0-SNAPSHOT.jar
```

如果注册中心的地址不是本地的话，修改application.properties文件中的配置即可

dubbo-admin/dubbo-admin-server/src/main/resources/application.properties

访问 http://localhost:8080即可看到所有的服务
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602152736658.png?)
点击服务对应的测试按钮，即可跳转到测试页面
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602153159271.png?)
点击方法输入需要的参数即可测试对应的方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602153052780.png?)
Dubbo Admin还有很多其他实用的功能，有兴趣的可以摸索一下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602153406445.png?)
需要注意的是服务提供者要想使用这个功能，Dubbo版本必须在2.7以上，因为这个功能的实现依赖元数据中心，同时我们需要在application.yaml中配置元数据中心地址

application.yaml
```yaml
dubbo:
  registry:
    # 注册中心地址及协议
    address: zookeeper://myhost:2181
  metadata-report:
    address: zookeeper://myhost:2181
```

注意：dubbo admin和dubbo版本要对应，不然会有各种问题
dubbo admin 0.2.0版本能支持2.7.0版本，不能支持2.7.3版本
dubbo admin 0.3.0-SNAPSHOT版本，能支持2.7.3版本

## 原理
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210602154025919.png?)
服务端在运行的时候会将服务的元数据信息注册到元数据中心，然后dubbo admin通过泛化调用的方式调用接口

## 通过反射来执行Dubbo接口
我们可以直接通过反射的形式来调用dubbo接口，首先封装一个调用对象
```java
@Data
public class InvokeInfo {

    private String className;

    private String methodName;

    private List<String> params;
}
```
写一个controller接口，这样就能通过http的方式调用dubbo接口
```java
@Slf4j
@RestController
@RequestMapping("dubbo")
public class DubboInvokerController {

    @Resource
    private ApplicationContext context;

    @RequestMapping("invoke")
    public Object invoke(@RequestBody InvokeInfo invokeInfo) {
        try {
            Class clazz = Class.forName(invokeInfo.getClassName());
            Object object = context.getBean(clazz);
            Method[] declaredMethods = clazz.getDeclaredMethods();
            for (Method method : declaredMethods) {
                if (!Objects.equals(method.getName(), invokeInfo.getMethodName())) {
                    continue;
                }
                Class[] paramTypes = method.getParameterTypes();
                if (paramTypes.length != invokeInfo.getParams().size()) {
                    continue;
                }
                List<Object> paramObjs = new ArrayList<>();
                List<String> params = invokeInfo.getParams();
                for (int i = 0; i < paramTypes.length; i++) {
                    String param = params.get(i);
                    Object paramObj = JSONObject.parseObject(param, paramTypes[i]);
                    paramObjs.add(paramObj);
                }
                return method.invoke(object, paramObjs.toArray());
            }
        } catch (Exception e) {
            log.error("invoke error", e);
            return "fail";
        }
        return "fail";
    }

}
```
我们测试一下，UserServiceImpl为Dubbo Service的实现
```java
@Service
public class UserServiceImpl implements UserService {

    @Override
    public UserInfo hello(String username) {
        UserInfo userInfo = new UserInfo();
        userInfo.setUserId("10");
        userInfo.setPhoneNum("158****4635");
        userInfo.setUserAddress("北京昌平");
        return userInfo;
    }

    @Override
    public UserInfo save(UserInfo userInfo) {
        return userInfo;
    }
}
```
调用hello方法，注意类名为全类名，支持多个参数，所以params入参是列表形式

```json
{
    "className": "com.javashitang.producer.service.UserServiceImpl",
    "methodName": "hello",
    "params": [
        "10"
    ]
}
```

调用save方法，当入参是一个对象时，将对象转为json字符串即可
```json
{
    "className": "com.javashitang.producer.service.UserServiceImpl",
    "methodName": "save",
    "params": [
        "{\"userId\":\"20\",\"phoneNum\":\"158****4635\",\"userAddress\":\"北京昌平\"}"
    ]
}
```