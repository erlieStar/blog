---
layout: post
title: 说一下Mybatis插件的实现原理？
lock: need
---

# 面试官：说一下Mybatis插件的实现原理？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200222092345247.jpg?)
## 介绍
我之前有篇文章大概写了一下mybatis插件的实现原理

面试官：MyBatis你只写了接口为啥就能执行sql啊？

**Mybaits插件的实现主要用了责任链模式和动态代理**

动态代理可以对SQL语句执行过程中的某一点进行拦截，当配置多个插件时，责任链模式可以进行多次拦截，责任链模式的UML图如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200220221357373.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3p6dGlfZXJsaWU=,size_16,color_FFFFFF,t_70)
可以看到在一条责任链中，每个Handler对象都包含对下一个Handler对象的引用，一个Handler对象处理完消息会把请求传给下一个Handler对象继续处理，以此类推，直至整条责任链结束。这时我们可以改变Handler的执行顺序，增加或者删除Handler，符合开闭原则

## 写一个Mybatis插件
mybatis可以拦截如下方法的调用
1. Executor（update，query，flushStatements，commit，rollback，getTransaction，close，isClosed）
2. ParameterHandler（getParameterObject，setParameters）
3. ResultSetHandler（handleResultSets，handleOutputParameters）
4. StatementHandler（prepare，parameterize，batch，update，query）

至于为什么是这些对象，后面会提到

写一个打印SQL执行时间的插件

```java
@Intercepts({@Signature(type = StatementHandler.class, method = "query", args = { Statement.class, ResultHandler.class }),
        @Signature(type = StatementHandler.class, method = "update", args = { Statement.class }),
        @Signature(type = StatementHandler.class, method = "batch", args = { Statement.class })})
public class SqlCostTimeInterceptor implements Interceptor {

    public static final Logger logger = LoggerFactory.getLogger(SqlCostTimeInterceptor.class);

    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        long start = System.currentTimeMillis();
        try {
            // 执行被拦截的方法
            return invocation.proceed();
        } finally {
            BoundSql boundSql = statementHandler.getBoundSql();
            String sql = boundSql.getSql();
            long end = System.currentTimeMillis();
            long cost = end - start;
            logger.info("{}, cost is {}", sql, cost);
        }
    }

    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    public void setProperties(Properties properties) {

    }
}
```
在mybatis配置文件中配置插件

```java
<plugins>
	<plugin interceptor="com.javashitang.part1.plugins.SqlCostTimeInterceptor"></plugin>
</plugins>
```
此时就可以打印出执行的SQL和耗费的时间，效果如下

```sql
select id, role_name as roleName, note from role where id = ?, cost is 35
```

## 原理分析
**前面说过Mybatis是通过动态代理的方式来额外增加功能的，因此调用目标对象的方法后走的是代理对象的方法而不是原方法**

说到这你可以能意识到拦截器只需要实现InvocationHandler接口就行了，先对指定对象生成一个代理类，然后在InvocationHandler的invoke方法中对指定方法进行增强。

但继承InvocationHandler后，生成代理类，并对指定方法进行增强这不是个累活么，框架完全可以再帮你封装一下啊

于是就有了@Intercepts注解，里面主要放多个@Signature注解，而@Signature注解则定义了要拦截的类和方法、

并且提供了Interceptor接口和Plugin类方便你实现动态代理，来看看他们怎么配合使用的吧

我们先从Interceptor接口来分析，因为要插件必须要实现Interceptor接口

```java
public interface Interceptor {

  /** 执行拦截逻辑的方法,Invocation只是将动态代理中获取到的一些参数封装成一个对象 */
  Object intercept(Invocation invocation) throws Throwable;

  /**
   * target是被拦截的对象，它的作用是给被拦截对象生成一个代理对象，并返回它。
   * 为了方便，可以直接使用Mybatis中org.apache.ibatis.plugin.Plugin类的wrap方法（是静态方法）生成代理对象
   */
  Object plugin(Object target);

  /** 根据配置初始化Interceptor对象 */
  void setProperties(Properties properties);

}
```

其中plugin方法就是生成代理对象的，一般的做法是直接调用Plugin.wrap(target, this);方法来生成代理对象，到Plugin类里面看看，主要的方法如下

```java
public class Plugin implements InvocationHandler {

  /** 目标对象 */
  private final Object target;
  /** Interceptor对象 */
  private final Interceptor interceptor;
  /** 记录了@Signature注解中的信息 */
  /** 被拦截的type->被拦截的方法 */
  private final Map<Class<?>, Set<Method>> signatureMap;

  private Plugin(Object target, Interceptor interceptor, Map<Class<?>, Set<Method>> signatureMap) {
    this.target = target;
    this.interceptor = interceptor;
    this.signatureMap = signatureMap;
  }

  public static Object wrap(Object target, Interceptor interceptor) {
    // 拿到拦截器要拦截的类及其方法
    Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
    // 取得要改变行为的类 (ParameterHandler | ResultSetHandler | StatementHandler | Executor)
    Class<?> type = target.getClass();
    // 拿到被代理对象的拦截方法，所实现的接口
    Class<?>[] interfaces = getAllInterfaces(type, signatureMap);
    // 如果当前传入的Target的接口中有@Intercepts注解中定义的接口，那么为之生成代理，否则原Target返回
    if (interfaces.length > 0) {
      return Proxy.newProxyInstance(
          type.getClassLoader(),
          interfaces,
          new Plugin(target, interceptor, signatureMap));
    }
    return target;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    try {
      // 获取当前方法所在类或接口中，可被当前 Interceptor 拦截的方法
      Set<Method> methods = signatureMap.get(method.getDeclaringClass());
      // 如果当前调用的方法需要被拦截，则调用interceptor.intercept()方法进行拦截处理
      if (methods != null && methods.contains(method)) {
        return interceptor.intercept(new Invocation(target, method, args));
      }
      // 如果当前调用的方法不能被拦截，则调用target对象的相应方法
      return method.invoke(target, args);
    } catch (Exception e) {
      throw ExceptionUtil.unwrapThrowable(e);
    }
  }
}
```
到现在为止，实现代理类和拦截特定方法用一个Plugin.wrap()方法就搞定了，贼方便。

在Plugin.invoke()方法中，最终调用了Interceptor接口的intercept方法，并把目标类，目标方法，参数封装成一个Invocation对象


```java
return interceptor.intercept(new Invocation(target, method, args));
```

接着看Invocation的定义

```cpp
/**
 * @author Clinton Begin
 * 将要调用的类，方法，参数封装成一个对象，方便传递给拦截器
 */
public class Invocation {

  private final Object target;
  private final Method method;
  private final Object[] args;

  public Invocation(Object target, Method method, Object[] args) {
    this.target = target;
    this.method = method;
    this.args = args;
  }

  public Object getTarget() {
    return target;
  }

  public Method getMethod() {
    return method;
  }

  public Object[] getArgs() {
    return args;
  }

  /** 这个方法是给拦截器调用的，拦截器最后会调用这个方法来执行本来要执行的方法，这样就可以在方法前后加上拦截的逻辑了 */
  public Object proceed() throws InvocationTargetException, IllegalAccessException {
    return method.invoke(target, args);
  }

}
```

只有一个方法proceed()方法，而proceed()只是执行被拦截的方法，这时清楚了应该在Interceptor对象的intercept方法中做哪些操作了，只需要写增强的逻辑，最后调用Invocation对象的proceed()方法即可

至此我们已经大概理解了插件的工作原理，只差最后一步了，给目标对象生成代理对象，我们从Mybatis初始化找答案

在配置文件中配置插件的格式如下，interceptor填全类名，下面可以写多个key和value值，实现了Interceptor接口后，会有一个setProperties方法，会把这些属性值封装成一个Properties对象，设置进来
```java
<plugin interceptor="">
	<property name="" value=""/>
	<property name="" value=""/>
</plugin>
```

mybatis配置文件的解析在XMLConfigBuilder的parseConfiguration方法中，这里我们只看一下插件的解析过程

```java
pluginElement(root.evalNode("plugins"));
```

```java
  private void pluginElement(XNode parent) throws Exception {
    if (parent != null) {
      for (XNode child : parent.getChildren()) {
        String interceptor = child.getStringAttribute("interceptor");
        // 解析拦截器中配置的属性，并封装成一个Properties对象
        Properties properties = child.getChildrenAsProperties();
        // 通过类名示例化一个Interceptor对象
        Interceptor interceptorInstance = (Interceptor) resolveClass(interceptor).newInstance();
        // 可以给拦截器的Properties属性赋值
        interceptorInstance.setProperties(properties);
        configuration.addInterceptor(interceptorInstance);
      }
    }
  }
```

实例化好的Interceptor对象，会被放到InterceptorChain对象的interceptors属性中
```java
public class InterceptorChain {

  private final List<Interceptor> interceptors = new ArrayList<Interceptor>();

  /** 这里有个特别有意思的地方，先添加的拦截器最后才会执行，因为代理是一层一层套上去的，就像这个函数f(f(f(x))) */
  public Object pluginAll(Object target) {
    for (Interceptor interceptor : interceptors) {
      target = interceptor.plugin(target);
    }
    return target;
  }

  public void addInterceptor(Interceptor interceptor) {
    interceptors.add(interceptor);
  }
  
  public List<Interceptor> getInterceptors() {
    return Collections.unmodifiableList(interceptors);
  }

}
```
InterceptorChain对象的pluginAll方法不就是用来生成代理对象的吗？看看在哪调用了

```cpp
parameterHandler = (ParameterHandler) interceptorChain.pluginAll(parameterHandler);
resultSetHandler = (ResultSetHandler) interceptorChain.pluginAll(resultSetHandler);
statementHandler = (StatementHandler) interceptorChain.pluginAll(statementHandler);
executor = (Executor) interceptorChain.pluginAll(executor);
```
这不就是前面提到的mybatis只能拦截特定类的原因吗？因为只对这些类做了代理。

至此Mybatis插件的原理就分析完了，还是挺简单的，但是要写一个实用的Mybatis插件并不容易，因为你要明白ParameterHandler等类的方法做了哪些事情，应该如何进行增强

最后总结一下，@Signature注解主要用来定义要拦截的类及其方法，而Interceptor接口和Plugin来配合为指定对象生成代理对象，并拦截指定方法，这样就能在其前后做一些额外操作