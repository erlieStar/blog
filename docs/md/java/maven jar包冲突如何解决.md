---
layout: post
title: maven jar包冲突如何解决？
lock: need
---

# 面试官：maven jar包冲突如何解决？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011231824152.png?)

## 依赖仲裁
依赖仲裁就是当项目中引入的jar包，groupId （公司域名倒过来）和artifactId （功能命令）一样，但是version不一样，应该选用哪一个version？也经常被人叫做依赖冲突

**最短路径原则**

假如说我们现在的项目依赖关系如图？那么maven会选用st-common-lib的那个版本呢？
答案是1.1这个版本，st-web到st-common-lib(1.1)的距离为1，到st-web到st-common-lib(1.0)的距离为2，选择距离短的，即最短路径原则

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190512174423147.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

如何看依赖的距离关系呢？前文说过，执行如下命令打印出全局的依赖树，层级关系特别清楚

```shell
mvn dependency:tree > show.txt 
```
**声明优先原则**

项目依赖如图，路径一样？会选用st-common-lib的哪个版本呢？这就得看你在pom文件中先声明是哪个依赖，如果在pom.xml中，st-remote-invoker写在前面，就会用1.0这个版本，如果st-dal写在前面，则会用1.1这个版本

![在这里插入图片描述](https://img-blog.csdnimg.cn/20190512175053355.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)

有时候明明引入对应的包了，但是类找不到，就有可能是因为版本冲突后，选择了错误的版本
## 依赖排除
去掉间接引入的jar包

如不想用spring boot默认提供的log，想集成第三方的log时
或者说上面依赖仲裁的第二个例子中，只想用st-common-lib的1.1版本，就可以把1.0版本排除掉

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter</artifactId>
	<exclusions>
		<exclusion>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-logging</artifactId>
		</exclusion>
	</exclusions>
</dependency>
```
## 实用插件Maven Helper
可以在Idea中下载一个插件，Maven Helper，用来分析依赖冲突超级方便

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201220103808175.png?)

点击pom文件，选中下面的Dependency Analyzer即可看到冲突的依赖

可以看到有三个单选框，依次为
1. Conflicts，显示项目中的所有冲突的依赖
2. All Dependencies as List，以列表的形式显示所有的依赖
3. All Dependencies as Tree，以树型的形式显示所有的依赖

右侧还有搜索框，这样就能查看部分依赖，当需要排除某个依赖的时候，只需要右键排除即可

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201220103823784.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020122010383893.png?)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201220105019267.png?)