---
layout: post
title: Resource和Autowired有啥区别？
lock: need
---

# 面试官：@Resource和@Autowired有啥区别？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210329213951423.jpg?)
## 自动绑定（Autowiring）模式
| 模式 | 说明 |
|--|--|
| no | 默认值，未激活 Autowiring，需要手动执行依赖注入对象|
| byName | 根据被注入属性的名称作为Bean名称进行依赖查找，并将对象设置到该属性 |
|  byType|  根据被注入属性的类型作为依赖类型进行查找，并将对象设置到该属性|
| constructor | 特殊的byType类型，用户构造器参数 |

@Autowired是Spring中的注解，@Resource是JSR-250中提供的注解，即Java提供的注解，从包名就可以看出来

Autowired：org.springframework.beans.factory.annotation.Autowired

Resource：javax.annotation.Resource
## @Autowired
@Autowired的依赖注入过程是由AutowiredAnnotationBeanPostProcessor支持的

具体的注入逻辑在DefaultListableBeanFactory#doResolveDependency

@Autowired的注入逻辑如下
1. 找到所有类型符合的bean
2. 如果没有类型符合的bean，则看@Autowired的required属性是否为true，是则抛出异常，否则返回null
3. 如果只有一个，则将这个bean注入
4. 如果有多个bean
    4.1 选择其中带有Primary注解的bean，如果只有一个直接注入，如果有多个bean带有Primary注解则报错，如果不存在就下一步
    4.2 选择其中优先级最高的bean(优先级使用javax.annotation.Priority表明)，如果只有一个直接注入，如果有多个bean的优先级并列最高则报错，如果不存在就下一步
    4.3 选择beanName和当前要注入的属性名相同的bean进行注入，有则注入，没有则报错
## @Resource
@Resource的依赖注入过程是由CommonAnnotationBeanPostProcessor支持的

具体的注入逻辑在CommonAnnotationBeanPostProcessor#autowireResource

@Resource的注入逻辑如下
1. 如果@Resource指定了name，则只会按照name进行查找，当找不到时抛出异常，找到将bean注入
2. 如果@Resource没有指定name，则把属性名作为名字进行查找，找到将bean注入，当按照名字查找不到时，按照类型进行查找

**注意：@Resource按照类型查找的逻辑和@Autowired的一样，因为都是调用了DefaultListableBeanFactory#doResolveDependency方法**

## 总结

@Autowired：先byType再byName

@Resource：先byName再byType（当指定@Resource name属性时，只会byName）
