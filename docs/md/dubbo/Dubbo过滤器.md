---
layout: post
title: Dubbo过滤器
lock: need
---

# Dubbo源码解析：Dubbo过滤器
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201122210331774.jpg?)
## Filter有啥用
![请添加图片描述](https://img-blog.csdnimg.cn/1bd1039c07c24a26b9b98beb368e6e40.png)
我们先看一下Dubbo Filter在哪个环节起作用，当我们调用远程方法的时候，实际上是通过代理对象调用的，将调用信息通过网络发送到服务端，服务端也是通过代理对象来接收请求的，然后根据请求调用服务端的方法，并返回结果。

**而Dubbo Filter的作用则可以让用户在发送请求之前或者执行本地方法之前执行用户自定义的逻辑，增加可扩展性**

## 自定义Filter
我们先手动定义一个Filter，用来统计服务端每个接口的执行时间。

1. 实现Filter接口
2. 在resources/META-INF/dubbo文件夹下新建org.apache.dubbo.rpc.Filter文件
3. 在org.apache.dubbo.rpc.Filter文件中写上Filter的路径

```java
@Slf4j
@Activate(group = PROVIDER)
public class CostFilter implements Filter {

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        long start = System.currentTimeMillis();
        Result result = invoker.invoke(invocation);
        long cost = System.currentTimeMillis() - start;
        log.info("request cost " + invocation.getMethodName() + " " + cost);
        return result;
    }
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201031173850813.jpeg?)
org.apache.dubbo.rpc.Filter文件中的内容
```java
cost=com.javashitang.producer.conf.CostFilter
```

日志输出
```java
INFO  c.j.producer.conf.CostFilter - request cost interface com.javashitang.api.service.UserService hello 5
INFO  c.j.producer.conf.CostFilter - request cost interface com.javashitang.api.service.UserService hello 0
```

可以看到我在CostFilter上用@Activate(group = PROVIDER)声明了过滤器所属的分组，当我们不用@Activate声明所属于的分组的时候，可以通过如下配置方式声明所属的分组

application.yaml
```yaml
dubbo:
  provider:
    filter: cost
```
filter的配置有很多约定的规则，如下所示
1. 用户自定义 filter 默认在内置 filter 之后。
2. 特殊值 default，表示缺省扩展点插入的位置。比如：filter="xxx,default,yyy"，表示 xxx 在缺省 filter 之前，yyy 在缺省 filter 之后。
3. 特殊符号 -，表示剔除。比如：filter="-foo1"，剔除添加缺省扩展点 foo1。比如：filter="-default"，剔除添加所有缺省扩展点。
4. provider 和 service 同时配置的 filter 时，累加所有 filter，而不是覆盖。比如：<dubbo:provider filter="xxx,yyy"/> 和 <dubbo:service filter="aaa,bbb" />，则 xxx,yyy,aaa,bbb 均会生效。如果要覆盖，需配置：<dubbo:service filter="-xxx,-yyy,aaa,bbb" />

后续分析实现的时候，我们就能看到这些规则是如何生效的
## Filter是如何工作的？
Web开发的时候我们经常和Servlet Filter（过滤器）和 Spring MVC Interceptor（拦截器）打交道，在一个请求前后做一些增加的操作，**过滤器和拦截器是用责任链模式实现的**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201123225622814.png?)
Dubbo Filter同样是对请求的过程进行增强，不过和Servlet Filter不同的是，**Dubbo Filter是基于装饰者模式实现的**。Dubbo的开发者是真爱用装饰者模式

### Filter在服务提供方是怎样起作用的？
服务导出时需要根据具体的协议导出Invoker，导出的时候。由于Dubbo Aop的作用，导出的过程会执行ProtocolFilterWrapper#export方法，最初的Invoker被不断装饰
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020112221291331.png#pic_center)

```java
// ProtocolFilterWrapper
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    // 暴露远程服务，registry协议不会执行filter链
    if (Constants.REGISTRY_PROTOCOL.equals(invoker.getUrl().getProtocol())) {
        return protocol.export(invoker);
    }
    return protocol.export(buildInvokerChain(invoker, Constants.SERVICE_FILTER_KEY, Constants.PROVIDER));
}
```
最初的Invoke被不断装饰，服务提供者和调用者都是用这个方法来装饰最初的Invoker
```java
private static <T> Invoker<T> buildInvokerChain(final Invoker<T> invoker, String key, String group) {
    Invoker<T> last = invoker;
    // 获取自动激活的扩展类
    List<Filter> filters = ExtensionLoader.getExtensionLoader(Filter.class).getActivateExtension(invoker.getUrl(), key, group);
    if (!filters.isEmpty()) {
        for (int i = filters.size() - 1; i >= 0; i--) {
            final Filter filter = filters.get(i);
            final Invoker<T> next = last;
            last = new Invoker<T>() {

                @Override
                public Class<T> getInterface() {
                    return invoker.getInterface();
                }

                @Override
                public URL getUrl() {
                    return invoker.getUrl();
                }

                @Override
                public boolean isAvailable() {
                    return invoker.isAvailable();
                }

                @Override
                public Result invoke(Invocation invocation) throws RpcException {
                    Result result = filter.invoke(next, invocation);
                    if (result instanceof AsyncRpcResult) {
                        AsyncRpcResult asyncResult = (AsyncRpcResult) result;
                        asyncResult.thenApplyWithContext(r -> filter.onResponse(r, invoker, invocation));
                        return asyncResult;
                    } else {
                        return filter.onResponse(result, invoker, invocation);
                    }
                }

                @Override
                public void destroy() {
                    invoker.destroy();
                }

                @Override
                public String toString() {
                    return invoker.toString();
                }
            };
        }
    }
    return last;
}
```

从服务端调用的过程可以看到具体的装饰者，一个装饰执行一个Filter
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201123230734379.png?)
大概就是这样的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210609210031172.png?)

### Filter在服务调用方是怎样起作用的？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201123235746299.png#pic_center)
服务调用方也是在ProtocolFilterWrapper中对原始的Invoker进行装饰，用装饰类来执行Filter


![在这里插入图片描述](https://img-blog.csdnimg.cn/2020112615102696.png?)
实际调用的时候先经过了多个Filter最终才调用到了DubboInvoker#doInvoke方法
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210617141257914.png?)
## Dubbo中常见的过滤器
|常用过滤器 | 介绍 |使用方|
|--|--|--|
| ActiveLimitFilter |限制消费端对服务端最大并行调用数 |消费端|
| ExecuteLimitFilter | 限制服务端的最大并行调用数 |服务端|
| AccessLogFilter | 打印请求的访问日志 |服务端|
|TokenFilter | 服务端提供令牌给消费端，防止消费端绕过注册中心直接调用服务端 |服务端|
| MonitorFilter | 监控并统计所有接口的调用情况，如成功，失败，耗时，后续把数据发送到Dubbo-Monitor服务器上 |消费端+服务端|

分析几个常见的过滤器把，套路都差不多

### ActiveLimitFilter
限制消费端对服务端最大并行调用数
```java
@Activate(group = Constants.CONSUMER, value = Constants.ACTIVES_KEY)
public class ActiveLimitFilter implements Filter {

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        URL url = invoker.getUrl();
        String methodName = invocation.getMethodName();
        // 获取设置的actives的值
        int max = invoker.getUrl().getMethodParameter(methodName, Constants.ACTIVES_KEY, 0);
        RpcStatus count = RpcStatus.getStatus(invoker.getUrl(), invocation.getMethodName());
        if (!count.beginCount(url, methodName, max)) {
            // 超过并发限制，超时时间默认为0
            long timeout = invoker.getUrl().getMethodParameter(invocation.getMethodName(), Constants.TIMEOUT_KEY, 0);
            long start = System.currentTimeMillis();
            long remain = timeout;
            synchronized (count) {
                while (!count.beginCount(url, methodName, max)) {
                    try {
                        // 等待过程中会被notify()，如果等待了remain毫秒，则下面一定会抛出异常
                        count.wait(remain);
                    } catch (InterruptedException e) {
                        // ignore
                    }
                    long elapsed = System.currentTimeMillis() - start;
                    remain = timeout - elapsed;
                    // 超时了还不能正常调用，抛出异常
                    if (remain <= 0) {
                        throw new RpcException("Waiting concurrent invoke timeout in client-side for service:  "
                                + invoker.getInterface().getName() + ", method: "
                                + invocation.getMethodName() + ", elapsed: " + elapsed
                                + ", timeout: " + timeout + ". concurrent invokes: " + count.getActive()
                                + ". max concurrent invoke limit: " + max);
                    }
                }
            }
        }
        // 没有超过并发限制
        boolean isSuccess = true;
        long begin = System.currentTimeMillis();
        try {
            return invoker.invoke(invocation);
        } catch (RuntimeException t) {
            isSuccess = false;
            throw t;
        } finally {
            count.endCount(url, methodName, System.currentTimeMillis() - begin, isSuccess);
            if (max > 0) {
                synchronized (count) {
                    count.notifyAll();
                }
            }
        }
    }
}
```

### ContextFilter
ContextFilter是用来实现隐式传参的

## Filter是如何加载的？
调用getActivateExtension获取自动激活的扩展类
```java
// ProtocolFilterWrapper#buildInvokerChain
List<Filter> filters = ExtensionLoader.getExtensionLoader(Filter.class).getActivateExtension(invoker.getUrl(), key, group);
```

根据url中获取key对应的值，其实就是获取用户配置的filter，当用户没有配置时会传入null
```java
// ExtensionLoader
public List<T> getActivateExtension(URL url, String key, String group) {
    String value = url.getParameter(key);
    // 用逗号分隔的key
    return getActivateExtension(url, StringUtils.isEmpty(value) ? null : Constants.COMMA_SPLIT_PATTERN.split(value), group);
}
```

```java
// ExtensionLoader
public List<T> getActivateExtension(URL url, String[] values, String group) {
    List<T> exts = new ArrayList<>();
	// 用户配置的filter，没有配置则为空数组
    List<String> names = values == null ? new ArrayList<>(0) : Arrays.asList(values);
    // url的参数中传入了-default，所有的默认@Activate都不会被激活
    // 这里加载的是默认的
    if (!names.contains(Constants.REMOVE_VALUE_PREFIX + Constants.DEFAULT_KEY)) {
        // 遇到了标记了@Activate注解的SPI实现类，会把name和实例放到cachedActivates中
        getExtensionClasses();
        for (Map.Entry<String, Object> entry : cachedActivates.entrySet()) {
            String name = entry.getKey();
            Object activate = entry.getValue();

            String[] activateGroup, activateValue;

            // 如果有注解@Activate，则获取注解的group和value值
            if (activate instanceof Activate) {
                activateGroup = ((Activate) activate).group();
                activateValue = ((Activate) activate).value();
            } else if (activate instanceof com.alibaba.dubbo.common.extension.Activate) {
                activateGroup = ((com.alibaba.dubbo.common.extension.Activate) activate).group();
                activateValue = ((com.alibaba.dubbo.common.extension.Activate) activate).value();
            } else {
                continue;
            }
            // 如果当前实现的组与我们传递的group匹配，则返回true
            // group为空也会返回true
            if (isMatchGroup(group, activateGroup)) {
                T ext = getExtension(name);
                // 1. 如果用户自己定义了系统的filter，则这里排除，这里不排除，后面加载用户自定义的又会加载，导致加载了2次
                // 2. 用户自定的排除了
        		// 3. 根据@Activate指定的value值再次过滤
                if (!names.contains(name)
                        && !names.contains(Constants.REMOVE_VALUE_PREFIX + name)
                        && isActive(activateValue, url)) {
                    exts.add(ext);
                }
            }
        }
        // 根据@Activate中配置的before,after,order等参数进行排序
        exts.sort(ActivateComparator.COMPARATOR);
    }
    // 这里加载的是用户自己定义的
    List<T> usrs = new ArrayList<>();
    for (int i = 0; i < names.size(); i++) {
        String name = names.get(i);
        // 不是排除的
        if (!name.startsWith(Constants.REMOVE_VALUE_PREFIX)
                && !names.contains(Constants.REMOVE_VALUE_PREFIX + name)) {
            // name 为 default
            if (Constants.DEFAULT_KEY.equals(name)) {
                // 把用户自定义的放在系统之前
                if (!usrs.isEmpty()) {
                    exts.addAll(0, usrs);
                    usrs.clear();
                }
            } else {
                T ext = getExtension(name);
                usrs.add(ext);
            }
        }
    }
    if (!usrs.isEmpty()) {
        exts.addAll(usrs);
    }
    return exts;
}
```
从源码可以很清楚的看到，@Activate的2个属性都是用来过滤的
**group通过传入的组来过滤，value通过判断url是否有指定的key来过滤**