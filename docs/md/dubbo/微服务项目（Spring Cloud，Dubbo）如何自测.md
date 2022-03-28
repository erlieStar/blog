---
layout: post
title: 微服务项目（Spring Cloud，Dubbo）如何自测?
lock: need
---

# Dubbo实战：微服务项目（Spring Cloud，Dubbo）如何自测?

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210527102008237.jpg?)
## 前言
**一个单体项目的自测还是很方便的。那如果是一个微服务项目，该如何自测呢?**

毕竟一个方法中有可能调用好多服务，而且调用的服务有可能好没写好，如果等别人的项目写好再开始联调的话，中途可能会耗费很长时间，因为调用的服务和自己的服务都有可能出问题，只有在联调的时候才能暴露出来。

**那有没有更简洁的方法呢?**

其实我们可以把我们调用的服务，期待返回的结果全mock出来，然后跑单测，就能保证我们自己这边的服务没有问题。

**mock别人的返回很耗时间，不值得把?**

并不需要所有的接口都mock，一些重要业务节点的方法mock一下就行了。可能第一次比较耗时间，但是后续改动，你只需要执行一下单测就行了，保证了接口的稳定性。所以说微服务的单测还是很有必要的

测试框架有很多，Junit，EasyMock，PowerMock，TestNG，DBUnit等。

建议重要的业务流程写单测，使用Junit，EasyMock测试框架
假如业务类为A，单测类的命名方式为ATest，ATest类和A类的包结构保持一致，测试的方法名保持一致
## IDEA快速生成Test类
所在类按快捷键
Win：Ctrl + Shift + T
Mac：⇧ + command  + T
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200822130732463.png?)
选中要单测的方法点击OK即可
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200822130828377.png?)
## EasyMock
看名字就能看出来，PowerMock更强大，EasyMock比较简单。我平时也是用EasyMock最后，就分享一下这个框架的使用

假如有一个ManageService，依赖另一个服务的UserService

```java
@Service
public class ManageService {

    @Autowired
    private UserService userService;
    
    public String getUsername() {
        return userService.getUsername();
    }
    
    public boolean saveUserInfo(UserInfo userInfo) {
        return userService.saveUserInfo(userInfo);
    }
}
```

```java
public interface UserService {
    String getUsername();
    boolean saveUserInfo(UserInfo userInfo);
}
```

```java
@Data
public class UserInfo {
    private String name;
    private Integer age;
}
```

可以按照如下方式写单测

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = AppConfig.class)
public class ManageServiceTest {

    @Autowired
    private ManageService manageService;
    private UserService userService;
    
    @Test
    public void getUsername() throws Exception {
        // 创建mock对象
        userService = EasyMock.createMock(UserService.class);
        // 调用userService.getUsername()方法时，返回test
        EasyMock.expect(userService.getUsername()).andReturn("test");
        // 将mock好的userService设置到manageService中
        Field userServiceField = manageService.getClass().getDeclaredField("userService");
        userServiceField.setAccessible(true);
        userServiceField.set(manageService, userService);
        EasyMock.replay(userService);

		// 开始测试manageService
        String username = manageService.getUsername();
        System.out.println(username);
        assertEquals(username, "test");
    }
    
    @Test
    public void saveUserInfo() throws Exception {
        userService = EasyMock.createMock(UserService.class);
        // 传入任意的对象，都会返回true
        EasyMock.expect(userService.saveUserInfo(EasyMock.anyObject())).andReturn(true);
        Field userServiceField = manageService.getClass().getDeclaredField("userService");
        userServiceField.setAccessible(true);
        userServiceField.set(manageService, userService);
        EasyMock.replay(userService);
        
        boolean flag = manageService.saveUserInfo(EasyMock.anyObject());
        System.out.println(flag);
        assertTrue(flag);
    }
    
}
```
上面的例子中我用了一个对象EasyMock.anyObject()，表示不管传入的对象是啥，都会返回true，EasyMock中还有很多类似的方法。

```java
 EasyMock.anyBoolean();
 EasyMock.anyString();
 EasyMock.anyObject();
```
如果我想针对不同的参数，返回不同的结果，mock2次即可。假如userService有这样一个方法getUsername(String param)。你期待传入1，返回100。传入2，返回200

```java
EasyMock.expect(userService.getUsername(1)).andReturn(100);
EasyMock.expect(userService.getUsername(2)).andReturn(200);
```
注意，当你传入1，2之外的数字，会报错，因为框架并不知道应该返回啥。