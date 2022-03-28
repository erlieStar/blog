---
layout: post
title: 我想把Spring Boot项目放在tomcat中运行，该怎么配置？
lock: need
---

# 面试官：我想把Spring Boot项目放在tomcat中运行，该怎么配置？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011230812501.png?)
## 介绍
1. 继承SpringBootServletInitializer并重写configure方法
2. spring-boot-starter-tomcat的scope改为provided
3. 打包方式改为war

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-tomcat</artifactId>
  <scope>provided</scope>
</dependency>
```

```xml
<packaging>war</packaging>
```

**一般问这个问题是看你是否熟悉scope及其作用。只要答出来scope就行了**

下面简单介绍一下maven的相关知识

## 没有Maven之前的日子
个人的一个小感受，学习一个新技术，应该以历史的眼光开看待这个新技术出现的原因，以及帮我们解决了什么问题。我们来回忆一下没有Maven的日子是怎么样的？

1. 开发一个项目，需要用别人写好的jar包，我们先把开源的jar包下载下来放到项目的lib目录下，并把这个目录添加到CLASSPATH（告诉Java执行环境，在哪些目录下可以找到你要执行的Java程序需要的类或者包）
2. 我们下载了a.jar发现a.jar还需要依赖b.jar，结果又去把b.jar包下载下来开始运行
3. 如果运气够好，我们的项目在添加完所有的依赖后，能正产运行了。如果运气差点，还会遇到版本的问题，例如a.jar在调用b.jar的时候发现b.jar根本没有这个方法，在别的版本中才有，现在好了，光找依赖和适配版本就能花上不少时间
4. 而且我们往git上上传代码的时候，还必须把这些lib都上传上去。别人下载我们的代码时也必须把lib下载下来，这个真心耗费时间

这时候Maven作为Java世界的包管理工具出现了，当然Java世界还有其他包管理工具，例如gradle等。就像yum是Linux世界的包管理工具，webpack是前端世界的包管理工具一样

## Maven仓库的种类
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190501225326523.png)

Maven找jar包的过程是这样的，先在本地仓库找，找不到再去私服（如果配置了的话），再找不到去中央仓库（http://repo1.maven.org/maven2/，maven团队负责维护）

从中央仓库找到后，会在私服和本地仓库放一份，从私服找到后也会在本地仓库放一份

当你安装在好了Maven以后，在conf目录下有个settings.xml文件，这个里面配置的项很多，后文会详细介绍这个配置文件。

```xml
<!-- localRepository
| The path to the local repository maven will use to store artifacts.
|
| Default: ${user.home}/.m2/repository
<localRepository>/path/to/local/repo</localRepository>
-->
```
在这个配置文件下有这一段话，说了Maven默认的本地仓库地址为${user.home}/.m2/repository（当然你可以重新设置本地仓库的地址，上面就是模板），我是window电脑，来看看这个目录

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190501231040402.PNG?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

看到有很多jar包被存到本地，当然如果你想配置私服也是在settings.xml上进行配置，随便一搜很多教程，不再赘述

搭建私服好处多多，在一个公司内部可以开发一些公共的基础组件放到私服上，方便其他同事使用
## Maven的默认配置
一个Maven的项目的整体结构是这样的

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190501144848666.PNG)

为什么一个Maven项目的文件结构是这种的呢？
这就不得不说到Maven的一个特性，约定优于配置。

Maven默认配置了${project.basedir}/src/main/java为项目的源代码目录
${project.basedir}/src/main/test为项目的测试代码目录
${project.basedir}/target为项目的编译输出目录等

Spring Boot就是约定优于配置的体现，想想我们用spring mvc的时候还得配置视图解析器，包的自动扫描，而用了spring boot框架，我们就完全不用再配置了

## Maven项目详解
安装还是挺简单的，我就不再介绍，我也没有单独下载，一般就用了Idea自带的Maven了，下载完后目录结构如下：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190108000916336.PNG)

**bin目录：**
该目录包含了mvn运行的脚本，这些脚本用来配置java命令，准备好classpath和相关的Java系统属性，然后执行Java命令。

**boot目录:**
该目录只包含一个文件，该文件为plexus-classworlds-2.5.2.jar。plexus-classworlds是一个类加载器框架，相对于默认的java类加载器，它提供了更加丰富的语法以方便配置，Maven使用该框架加载自己的类库。

**conf目录:**
该目录包含了一个非常重要的文件settings.xml。直接修改该文件，就能在机器上全局地定制maven的行为，即对所有用户都生效。一般情况下，我们更偏向于复制该文件至\~/.m2/目录下（\~表示用户家目录，windows下~就是C:\Users\Peng，Peng是小编的用户名），然后修改该文件，在用户级别定制Maven的行为。

**lib目录:**
该目录包含了所有Maven运行时需要的Java类库，Maven本身是分模块开发的，因此用户能看到诸如maven-core-3.0.jar、maven-model-3.0.jar之类的文件，此外这里还包含一些Maven用到的第三方依赖如commons-cli-1.2.jar、commons-lang-2.6.jar等等。、

## settings.xml配置文件详解

我们来详细说一下settings.xml这个文件，这个文件可以定制Maven的行为，上面已经说到settings.xml可以放在2个位置，~/.m2/setting.xml（默认没有，需要我们自己复制）和${maven.home}/conf/setting.xml

这2个配置文件的加载顺序为~/.m2/setting.xml>${maven.home}/conf/setting.xml，为了不影响他人，所以我们将conf下的settings.xml复制到家目录，在用户级别定制Maven的行为。

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019050123591391.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

这个和配置环境变量有点类似，Windos和Linux都可以配置系统级别的环境变量和用户级别的环境变量，这里单说一下Linux的吧，在/etc/profile里面配置的就是系统级别的环境变量，在~/.bash_profile里面配置的就是用户级别的环境变量

各种配置项还是挺多的，设置镜像仓库（国内用阿里云的比较多），设置代理，不再赘述

## maven常用命令
| 命令                | 描述                                                      |
| ------------------- | --------------------------------------------------------- |
| mvn -version        | 显示版本信息                                              |
| mvn clean           | 删除target目录                                            |
| mvn compile         | 编译src/main/java下的源代码                               |
| mvn package         | 打包，在target下生成jar包或者war包                        |
| mvn test            | 执行src/test/java下以Test开头或者以Test结尾的类的测试用例 |
| mvn install         | 打包，并把jar包或者war包复制到本地仓库，供其他模块使用    |
| mvn deploy          | 将打包的文件发布到私服                                    |
| mvn dependency:tree | 打印出项目的整个依赖树                                    |

当然也可以连着使用
mvn clean package 清理打包
mvn clean package -DskipTests=true 清理打包，并跳过测试用例
mvn clean install 清理打包，并将jar包或者war包复制到本地仓库

运行单测的时候也没必要一个一个点测试方法，mvn test 一个命令跑完所有测试用例，
要注意的是只会执行以Test开头或者结尾的测试类，也没必要自己写测试类，我在推荐阅读第一篇文章中演示了快速生成测试类的方法，可以去看看，生成的测试类都是以Test结尾的

mvn dependency:tree > show.txt 将依赖输出重定向到文件中，方便查看
## pom.xml详解
groupId 公司域名倒过来
artifactId 功能命令
version 版本号

这三个维度确定一个jar包，就像用（x，y，z）坐标在三维空间中唯一确定一个点。

packaging 打包方式，jar，war，maven-plugin（开发maven插件）

### scope详解

|参数| 解释 |是否会被打入最终的jar包|
|--|--|--|
| compile |默认的scope |是|
| test |测试使用 |否|
| provided|编译需要|否|
| runtime|编译不需要，运行时需要（接口与实现分离） |是|
| system|加载本地jar |否|

类似如下这种，没有指定scope，说明scope是compile
```xml
<dependency>
	<groupId>org.mybatis.spring.boot</groupId>
	<artifactId>mybatis-spring-boot-starter</artifactId>
	<version>1.3.2</version>
</dependency>
```
test是指在运行测试用例的时候才会用到，没必要打入到最后的jar里面，所以你看到的测试框架的scope基本上都是test

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-test</artifactId>
	<scope>test</scope>
</dependency>
```
provided，编译的时候会用到，但不会被打入最后的jar包
例如想把spring boot项目以war包的形式放在tomcat中运行，首先得加入如下依赖

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-tomcat</artifactId>
	<scope>provided</scope>
</dependency>
```
或者你写了一个放在Storm集群或者Flink集群上运行的任务，最后都要把Storm的依赖或者Flink的依赖设置成provided，因为集群上已经都有这些环境的jar包、

如果你用到lombok插件的话，你会发现lombok的Maven是如下形式，说明它只会编译的时候会用到。

```xml
<dependency>
	<groupId>org.projectlombok</groupId>
	<artifactId>lombok</artifactId>
	<version>1.16.6</version>
	<scope>provided</scope>
</dependency>
```
我写了如下一个测试类
```java
@Data
public class Test {

    private String name;
    private int age;
}
```
生成的class文件反编译后的如下，验证了我们的想法，编译之后确实没有必要再用lombok这个jar包
```java
public class Test {
    private String name;
    private int age;

    public Test() {
    }

    public String getName() {
        return this.name;
    }

    public int getAge() {
        return this.age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

runtime，运行时才会用到。例如，如果你的项目有对数据库的操作，但没有加入相应的JDBC的实现jar包，如mysql-connector-java，是可以编译成功的，只有运行时才会报错。所以你看到的JDBC实现的jar包scope为runtime，表明这个jar包在运行时才会用到

```xml
<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
	<version>5.1.35</version>
	<scope>runtime</scope>
</dependency>
```

system，本地加载jar，当你和第三方公司合作，他们只是给了你一个jar包时，你可以有三种选择

1. mvn install到本地仓库
2. mvn deploy到私服
3. 指定jar包路径，从本地加载，例如如下pom形式

```xml
 <dependency>
	<groupId>com.tievd.third</groupId>
	<artifactId>arcvideo</artifactId>
	<version>1.0</version>
	<scope>system</scope>
	<systemPath>${basedir}/lib/face-api-1.0.jar</systemPath>
</dependency>
```
前文已经说到scope为system的依赖不会被打入最终的jar包，得通过配置插件等方式将依赖打入最终的jar包，所以这种方式一般很少使用。

### 依赖传递
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190512174210685.png)

假设我们现在有一个多模块项目，依赖关系如图，我们在st-web模块中引入st-dal依赖时，st-common-lib这个依赖也会被我们引入，这个就是依赖传递，下表中列出了scope在依赖过程中发生的变化，列标题为被依赖的模块，每行为要依赖的模块
|          | compile  | test | provided | runtime  |
| -------- | -------- | ---- | -------- | -------- |
| compile  | compile  | -    | -        | runtime  |
| test     | test     | -    | -        | test     |
| provided | provided | -    | provided | provided |
| runtime  | runtime  | -    | -        | runtime  |

