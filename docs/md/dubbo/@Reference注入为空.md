---
layout: post
title: Reference注入为空
lock: need
---

# 生产问题：Reference注入为空
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210610200327302.jpg?)
## 线上发生事故了
有一次我负责的系统和收银系统同时上线一波（用的是Dubbo）。然后很神奇的事情发生了，收银系统用@Reference注解注入我的接口，然后这个接口的实现类居然为空。

其实我们当时没排查出来是什么原因？

**重启了一下就好了，毕竟重启大法好。** 但本着不能给用户充钱的路上造成阻碍，还是要排查一波这个代理对象为空是如何造成的。

**线上dubbo的版本为2.8.9，注意包名是（com.alibaba）**

为了方便大家理解我说的内容，简单说一下RPC框架的执行流程。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210610202248540.png?)
1. Server将服务信息注册到Registry，Client从Registry拉取Server的信息。
2. Client通过代理对象（Client Stub）发送发送网络请求，Server通过代理对象（Server Stub）执行本地方法
3. 网络传输过程中有编解码和序列化的过程

**在Dubbo中Client Stub和Server Stub都是Invoker对象**

我们继续，注入的接口实现类居然能为空？我就看了一下他写的代码，只用了一个@Reference注解，没有设置任何属性。

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.ANNOTATION_TYPE})
public @interface Reference {

    // 省略其他属性
    boolean check() default true;

}
```
那么check=true，即没有服务提供者的时候，服务消费者都不能正常启动，因为会抛出IllegalStateException异常。既然能正常启动，那这个代理对象正常创建了啊，不可能为null啊

```java
// 2.8.9版本
// ReferenceConfig#createProxy
Boolean c = check;
if (c == null && consumer != null) {
    c = consumer.isCheck();
}
if (c == null) {
    c = true; // default true
}
if (c && !invoker.isAvailable()) {
    throw new IllegalStateException("Failed to check the status of the service " + interfaceName + ". No provider available for the service " + (group == null ? "" : group + "/") + interfaceName + (version == null ? "" : ":" + version) + " from the url " + invoker.getUrl() + " to the consumer " + NetUtils.getLocalHost() + " use dubbo version " + Version.getVersion());
}
```

**然后我同事说有没有可能是客户端先启动，没有服务提供者导致代理对象为空的？**

我说不可能的，客户端先启动，check属性为true，不可能启动成功的！再说每次上线，新服务正常启动后，才会关闭旧服务的，服务提供者一定会有的。

**为什么会发生这种情况，是真心搞不懂，只能google “@Reference 注入对象为null”**

答案基本一致，没有服务提供者导致代理对象为空的，只要把@Reference的check属性设置为false即可，至于原因没一篇文章说过

**接下来就是验证网上的方法了**
1. 先启动producer，再启动consumer，正常调用
2. 先启动consumer（check=true），再启动producer，代理对象为空，完美复现
3. 先启动consumer（check=false），再启动producer，正常调用

**和我的想法不一致，学dubbo的时候没听过必须先启动producer再启动consumer才能正常调用啊？**

我就拿出我学dubbo时用的例子测试了一波，dubbo的版本为2.7.3注意包名是（org.apache）

1. 先启动producer，再启动consumer，正常调用
2. 先启动consumer（check=true），此时没有producer，启动失败
3. 先启动consumer（check=false），再启动producer，正常调用

**这才符合我的想法啊**

## 揭秘真相
既然@Reference注入的对象为null，那说明Spring Bean的生命周期中属性赋值阶段有问题
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210610211328522.png?)
再来分析一下@Reference注解的注入逻辑，和@Autowired，@Resource之类的注入逻辑基本差不多。

当你加入Dubbo的spring boot starter时，会往容器中注入ReferenceAnnotationBeanPostProcessor，看一下这个类的继承关系

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210610212501997.png?)
其中最主要的部分你只需要知道这个类重写了
InstantiationAwareBeanPostProcessor#postProcessPropertyValues（这个方法在后面的版本中被postProcessProperties方法替代），而这个方法正是用来属性赋值的，看上面的Bean生命周期图

```java
public class ReferenceAnnotationBeanPostProcessor {

	// 省略了继承类和方法
    // 这个方法给@Reference属性赋值
    @Override
    public PropertyValues postProcessPropertyValues(
            PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName) throws BeanCreationException {

        InjectionMetadata metadata = findReferenceMetadata(beanName, bean.getClass(), pvs);
        try {
            metadata.inject(bean, beanName, pvs);
        } catch (BeanCreationException ex) {
            throw ex;
        } catch (Throwable ex) {
            throw new BeanCreationException(beanName, "Injection of @Reference dependencies failed", ex);
        }
        return pvs;
    }

}
```
接着执行到ReferenceFieldElement#inject方法，@Reference引入的对象会被包转为ReferenceBean
```java
private class ReferenceFieldElement extends InjectionMetadata.InjectedElement {


    @Override
    protected void inject(Object bean, String beanName, PropertyValues pvs) throws Throwable {

        Class<?> referenceClass = field.getType();

        // 获取 referenceBean 的逻辑在这
        referenceBean = buildReferenceBean(reference, referenceClass);

        ReflectionUtils.makeAccessible(field);

		// 通过反射注入对象
        field.set(bean, referenceBean.getObject());

    }

}
```
经过一系列方法调用执行到如下方法
```java
// AbstractAnnotationConfigBeanBuilder#build
public final B build() throws Exception {

    checkDependencies();

    B bean = doBuild();

    configureBean(bean);

    if (logger.isInfoEnabled()) {
        logger.info(bean + " has been built.");
    }

    return bean;

}
```
此时日志中会打印ReferenceBean对象，这个对象继承了AbstractConfig，所以会执行AbstractConfig#toString方法
```java
public abstract class AbstractConfig implements Serializable {

    @Override
    public String toString() {
        try {
            StringBuilder buf = new StringBuilder();
            buf.append("<dubbo:");
            buf.append(getTagName(getClass()));
            Method[] methods = getClass().getMethods();
            for (Method method : methods) {
                try {
                    String name = method.getName();
                    if ((name.startsWith("get") || name.startsWith("is"))
                            && !"getClass".equals(name) && !"get".equals(name) && !"is".equals(name)
                            && Modifier.isPublic(method.getModifiers())
                            && method.getParameterTypes().length == 0
                            && isPrimitive(method.getReturnType())) {
                        int i = name.startsWith("get") ? 3 : 2;
                        String key = name.substring(i, i + 1).toLowerCase() + name.substring(i + 1);
                        Object value = method.invoke(this, new Object[0]);
                        if (value != null) {
                            buf.append(" ");
                            buf.append(key);
                            buf.append("=\"");
                            buf.append(value);
                            buf.append("\"");
                        }
                    }
                } catch (Exception e) {
                    logger.warn(e.getMessage(), e);
                }
            }
            buf.append(" />");
            return buf.toString();
        } catch (Throwable t) {
            logger.warn(t.getMessage(), t);
            return super.toString();
        }
    }

}
```

**好家伙，打印的时候把get方法全执行了一遍，然后执行ReferenceBean#getObject方法异常了（就是那个没有服务提供者抛出的异常），但是被try Catch了**

因为ReferenceBean是一个FactoryBean，所以需要调用getObject方法才能获取创建的对象

```java
private class ReferenceFieldElement extends InjectionMetadata.InjectedElement {


    @Override
    protected void inject(Object bean, String beanName, PropertyValues pvs) throws Throwable {

        Class<?> referenceClass = field.getType();

        // 获取 referenceBean 的逻辑在这
        referenceBean = buildReferenceBean(reference, referenceClass);

        ReflectionUtils.makeAccessible(field);

		// 通过反射注入对象
        field.set(bean, referenceBean.getObject());

    }

}
```
**接着调用ReferenceBean#getObject方法，好了，这就是服务导出的逻辑了！** 不细说了，后续单开文章写，会执行到ReferenceConfig#get方法

```java
// ReferenceConfig#get
public synchronized T get() {
    if (destroyed) {
        throw new IllegalStateException("Already destroyed!");
    }
    if (ref == null) {
        init();
    }
    return ref;
}
```
**此时代理对象为null，执行init方法，initialized默认为false，执行一次变为true（AbstractConfig执行toString方法的时候哈），所以第二次执行，直接return，此时代理对象为null，完事！**

```java
private void init() {
    if (initialized) {
        return;
    }
    initialized = true;
    // 省略部分代码
}
```

**我学习用的版本为什么能正常工作？**

```java
public final C build() throws Exception {

    checkDependencies();

    C configBean = doBuild();

    configureBean(configBean);

    if (logger.isInfoEnabled()) {
        logger.info("The configBean[type:" + configBean.getClass().getSimpleName() + "] has been built.");
    }

    return configBean;

}
```
就是打印的时候不会执行getObject方法了

**为什么@Reference的check属性设置为false就能正常调用？**

当check属性设置为false时，第一次调用成功执行完ReferenceBean#getObject方法，ref能正常赋值为代理对象了，因为不会在校验过程中抛出IllegalStateException异常

```java
// 2.8.9版本
// ReferenceConfig#createProxy
Boolean c = check;
if (c == null && consumer != null) {
    c = consumer.isCheck();
}
if (c == null) {
    c = true; // default true
}
if (c && !invoker.isAvailable()) {
    throw new IllegalStateException("Failed to check the status of the service " + interfaceName + ". No provider available for the service " + (group == null ? "" : group + "/") + interfaceName + (version == null ? "" : ":" + version) + " from the url " + invoker.getUrl() + " to the consumer " + NetUtils.getLocalHost() + " use dubbo version " + Version.getVersion());
}
```
第二次执行就能将这个代理对象返回

```java
// ReferenceConfig#get
public synchronized T get() {
    if (destroyed) {
        throw new IllegalStateException("Already destroyed!");
    }
    if (ref == null) {
        init();
    }
    return ref;
}
```
至于我们的线上系统为什么没获取到服务提供者，我估计很大概率是由于网络的原因
## 解决方案
1. @Reference注解的check属性设置为false（默认为true），因为当你的check属性为true并且没有服务提供者时，不会起任何作用，只会注入一个空对象，后续当有服务提供者可用时，这个对象始终为空。当check为false时，会注入一个代理对象，当有服务提供者时，这个代理对象会刷新，就能正常发起调用
2. 选择能正常执行的版本