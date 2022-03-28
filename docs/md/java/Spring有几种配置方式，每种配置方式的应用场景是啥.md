---
layout: post
title: Spring有几种配置方式，每种配置方式的应用场景是啥？
lock: need
---

# 面试官：Spring有几种配置方式，每种配置方式的应用场景是啥？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201007143225139.png?)
## 前言
Spring的IOC极大的方便了我们的编程，当我们需要某个对象的时候，不在需要自己去new，只要告诉Spring一声，Spring就会把我们所需要的类准备好，就像你原来出门要穿外套时，你得先跑到衣柜前取出衣服，然后自己穿上。现在好了，你结婚了，只要跟你的另一半说一声，她就会心领神会，把衣服给你拿过来，然后帮你穿上，是不是感觉很爽？

**但是方便的前提是你需要先把对象的依赖关系提前配置好**，Spring提供了三种配置方法，这三种配置方式如何选择？先看一下这三种配置方式
## 配置文件
**我们可以将对象的依赖关系配置到文件中，Spring支持XML和properties文件**（properties文件这种形式估计用的人比较少哈），当然如果你愿意，还可以自己扩展源码，从别的类型的文件中读取这种依赖关系，我们以xml为例，演示一下用法

applicationContext.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/aop
       http://www.springframework.org/schema/aop/spring-aop.xsd">

    <bean id="knight" class="com.st.BraveKnight">
        <constructor-arg ref="weapon"/>
    </bean>

    <bean id="weapon" class="com.st.Weapon">
        <property name="type" value="knife"/>
    </bean>
</beans>
```
BraveKnight
```java
public class BraveKnight {

    private Weapon weapon;

    public BraveKnight(Weapon weapon) {
        this.weapon = weapon;
    }

    public Weapon getWeapon() {
        return weapon;
    }
}
```
Weapon

```java
public class Weapon {

    private String type;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
```

```java
public class Main {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
        BraveKnight knight = context.getBean(BraveKnight.class);
        // knife
        System.out.println(knight.getWeapon().getType());
        context.close();
    }
}
```
这样一个Spring项目就完成了，可以用spring的test模块，进行测试
```java
@RunWith(SpringJUnit4ClassRunner.class)
// 多个文件时可用locations = {"", ""}
@ContextConfiguration(locations = "classpath*:/applicationContext.xml")
public class XMLTest {

    @Autowired
    BraveKnight braveKnight;

    @Test
    public void test() {
        // knife
        System.out.println(braveKnight.getWeapon().getType());
    }
}
```
用XML形式可以在配置文件中，配置我们自己写的类和外部库的类，Spring通过反射可以把这些类都创建出来，并由Spring管理，在你需要的时候给你
## 注解
BraveKnight
```java
@Component
public class BraveKnight {

    @Autowired
    private Weapon weapon;

    public Weapon getWeapon() {
        return weapon;
    }
}
```
Weapon

```java
@Component
public class Weapon {

    @Value("knife")
    // 这个值可以从外部配置文件中通过@Value注解读取到
    private String type;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
```
MyConfig
```java
@Configuration
// 如果不配置扫描的路径，默认扫描配置类所在的包及其子包下面的所有类
@ComponentScan
public class MyConfig {
}
```

```java
public class Main {

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(MyConfig.class);
        context.refresh();
        BraveKnight knight = context.getBean(BraveKnight.class);
        // knife
        System.out.println(knight.getWeapon().getType());
        context.close();
    }
}
```

```java
@RunWith(SpringJUnit4ClassRunner.class)
// 从类中读取配置
@ContextConfiguration(classes = MyConfig.class)
public class AnnotaionTest {

    @Autowired
    BraveKnight braveKnight;

    @Test
    public void test() {
        // knife
        System.out.println(braveKnight.getWeapon().getType());
    }
}
```
## JavaConfig
在我们自己的类上，我们可以加@Component注解让Spring来管理，如果是第三方jar包的类呢？它的类上并不会加@Component啊，如果不想用XML来生成第三方jar包的类，JavaConfig在这个时候就派上用场了，接着上面的例子，假如Weapon这个类是第三方jar包的类，则可以通过如下形式让Spring管理

```java
@Configuration
// 如果不配置扫描的路径，默认扫描配置类所在的包及其子包下面的所有类
// 可以通过属性basePackages = {""}指定扫描的包
@ComponentScan()
public class MyConfig {

    // name属性默认是方法名，自己可以指定
    @Bean(name = "weapon")
    public Weapon weapon() {
        Weapon weapon = new Weapon();
        weapon.setType("knife");
        return weapon;
    }
}
```

 1. XML配置修改后不用重新编译，可以用于经常切换实现类的对象
 2. 注解用起来非常地简洁，代码量十分少，因此是项目的第一选择
 3. 当需要注入的代码是第三方jar包中的类时，这时候就需要用到Java Config