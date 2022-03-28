---
layout: post
title: 如何手写一个Spring Boot starter?
lock: need
---

# 面试官：如何手写一个Spring Boot starter

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325224055116.jpg?)
## 蛮荒的年代
最近用了一些spring-boot-starter-data的组件（redis，mongodb，jpa，elasticsearch等），才意识到Spring Boot真是极大的简化了开发的流程。以演进的视角来分享一下spring boot是如何通过自动装配来简化开发的
### XML配置
Spring是一个容器，里面保存了你所需要的对象和对象之间的依赖关系。当我们需要对象A时，不用从头开始new，只需要告诉Spring把A给我，Spring就会把对象A给你，即IOC。刚开始这些对象以及对象之间的依赖关系是配置在XML文件中的

applicationContext.xml
```xml
<bean id="knight" class="com.st.part1.BraveKnight">
    <constructor-arg ref="weapon"/>
</bean>

<bean id="weapon" class="com.st.part1.Weapon">
    <property name="type" value="knife"/>
</bean>
```
Weapon类

```java
package com.st.part1;

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
BraveKnight类

```java
package com.st.part1;

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
如果你学过SSM框架的话，应该对这些配置不陌生

```java
public class Main {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
        // 获得注册到spring容器中bean的名字，即前面配置文件中的id属性
        String names[] = context.getBeanDefiniionNames();
        for (int i = 0; i < names.length; i++) {
            // knight
            // weapon
            System.out.println(names[i]);
        }
        BraveKnight knight = context.getBean(BraveKnight.class);
        // knife
        System.out.println(knight.getWeapon().getType());
        context.close();
    }
}
```
用XML形式可以在配置文件中，配置我们自己写的类和外部jar包的类，Spring通过反射把这些类都创建出来，并由Spring管理，在你需要的时候给你

可以看到Weapon和BraveKnight对象都被注入到spring 容器中了，而且获取BraveKnight对象时，它的weapon属性已经被设值了，即DI（依赖注入）

### 注解
我们不仅可以用XML来设置对象，以及对象和对象之间的关系，还可以用注解和JavaConfig

用注解的方式改造一下上面的代码
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

```java
@Configuration
// 如果不配置扫描的路径，默认扫描配置类所在的包及其子包下面的所有类
@ComponentScan
public class MyConfig {
}
```
测试类

```java
public class Main {

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(MyConfig.class);
        String names[] = context.getBeanDefinitionNames();
        for (int i = 0; i < names.length; i++) {
            // myConfig
            // braveKnight
            // weapon
            System.out.println(names[i]);
        }
        BraveKnight knight = context.getBean(BraveKnight.class);
        // knife
        System.out.println(knight.getWeapon().getType());
        context.close();
    }
}
```
可以看到和上面用XML配置效果一样
### JavaConfig
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
## 写一个Spring Boot Starter
从上面可以看到，当我们想使用某些类时，我们必须先对类进行配置，让Spring来管理这些类，才能使用。

spring boot可以非常方便的和第三方框架整合，只需要引入一个starter依赖，就可以直接使用（省去了配置的过程），因为spring boot会自动注入我们所需要类。先来自己写一个starter。artifactId如何命名呢？Spring 官方 starter通常命名为spring-boot-starter-{name} 如 spring-boot-starter-web，Spring官方建议非官方starter命名应遵循{name}-spring-boot-starter的格式。来写一个自己的starter，这里我建了一个多模块项目，一个是starter项目，一个是测试项目

### starter项目
1.pom文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.1.RELEASE</version>
    </parent>

    <groupId>com.javashitang</groupId>
    <artifactId>demo-service-spring-boot-starter</artifactId>
    <version>1.0</version>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
    </dependencies>

</project>
```

2.供其他模块使用的服务类
```java
public class DemoService {

    private String host;
    private int port;
    
    public DemoService() {

    }

    public DemoService(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public String sayHello() {
        return "hello, " + host + " " + port;
    }
    
    // 省略get和set方法
}
```
3.用@ConfigurationProperties将application.xml中的属性映射为配置类
```java
@ConfigurationProperties(prefix = "demo.service")
public class DemoServicePropeties {

    private String host;
    private int port;
    
    // 省略get和set方法
}
```
4.自动配置类
```java
@Configuration
@ConditionalOnClass(DemoService.class)
@EnableConfigurationProperties(DemoServicePropeties.class)
public class DemoServiceAutoConfiguration {

    @Bean
    public DemoService demoService(DemoServicePropeties propeties) {
        return new DemoService(propeties.getHost(), propeties.getPort());
    }
}
```

@ConditionalOnClass：判断当前classpath下是否存在指定类，若存在则将当前的配置载入spring容器
@EnableConfigurationProperties：把使用 @ConfigurationProperties 的类注入到容器中
@ConfigurationProperties：将properties 配置文件中的属性转为Bean

5.在src->main->java->resource目录下建META-INF文件夹，放spring.factories文件，文件内容如下

```java
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.st.demoservice.DemoServiceAutoConfiguration
```

## 测试类项目
1.在pom文件中引入依赖

```xml
<dependency>
    <groupId>com.javashitang</groupId>
    <artifactId>demo-service-spring-boot-starter</artifactId>
    <version>1.0</version>
</dependency>
```
2.application.properties中配置属性

```xml
demo.service.host=127.0.0.1
demo.service.port=8080
```

3.测试类

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class TestStarterApplicationTests {

    @Autowired
    DemoService demoService;

    @Test
    public void contextLoads() {
        String str = demoService.sayHello();
        // hello, 127.0.0.1 8080
        System.out.println(str);
    }
}
```
可以看到，我们在用DemoService这个类的时候，Spring Boot已经自动帮我们注入进来了，我们并没有做任何配置，非常方便。

我这里顺便演示了一下@ConfigurationProperties的用法，如果你觉得不用额外进行配置，则直接在DemoServiceAutoConfiguration注入需要的Bean即可

**总结一下实现的大概步骤**
1. 引入spring-boot-autoconfigure依赖
2. 在META-INF/spring.factories文件中配置需要注入的类，注意key的名字为org.springframework.boot.autoconfigure.EnableAutoConfiguration
3. 在配置类中往容器中注入starter需要的bean

## Spring Boot自动装配的原理
Spring Boot自动装配是怎么实现的呢？

众所周知，所有的Spring Boot启动类上都有一个@SpringBootApplication注解。@SpringBootApplication是一个复合注解，它包含的其中一个注解为@EnableAutoConfiguration，而@EnableAutoConfiguration会导入AutoConfigurationImportSelector这个类，这个类会加载jar包里面META-INF/spring.factories配置文件里面填写的配置类。

以我们的上面写的starter为例，加载的顺序如下

META-INF/spring.factories
DemoServiceAutoConfiguration
DemoServicePropeties（读取application.properties配置文件）
DemoService

所有的starter实现都是这个套路