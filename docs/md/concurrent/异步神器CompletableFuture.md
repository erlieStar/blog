---
layout: post
title: 异步神器CompletableFuture
lock: need
---

# 并发工具类：异步神器CompletableFuture

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/af796e5b873a6a751a4eb6b0f4df474d.jpeg)
## 为什么需要CompletableFuture

传统的 Future 虽然可以实现异步任务，但有三大痛点：
1. 阻塞获取结果：只能通过 get() 方法阻塞线程等待结果，无法异步回调
2. 无法链式调用：当一个任务完成后，无法自动触发下一个任务
3. 无法手动完成：结果只能由计算线程设置，外部无法干预
## 创建CompletableFuture对象

| 创建方式 | 说明 |
|--|--|
| supplyAsync(Supplier) | 有返回结果的异步任务 |
| runAsync(Runnable) | 无返回结果的异步任务 |
| completedFuture(value) | 创建一个已完成状态的 Future |
|new CompletableFuture<>()|手动创建|

```java
// 有返回值
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Hello";
});

// 无返回值
CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
    System.out.println("Running...");
});
```

有时候你不需要真正的异步，只是在某些特定条件下（比如缓存命中了），需要直接返回一个已经包含结果或异常的 CompletableFuture
```java
public CompletableFuture<String> getUserData(String userId) {
    // 场景：如果缓存有数据，直接返回，不需要走异步线程池
    if (cache.containsKey(userId)) {
        return CompletableFuture.completedFuture(cache.get(userId));
    }
    // 缓存没有，再去异步查数据库
    return CompletableFuture.supplyAsync(() -> db.query(userId), myExecutor);
}
```

手动创建这种方式不是由 CompletableFuture 内部去启动线程，而是你先创建一个“空壳”，然后在未来的某个任意时间点，由某个线程手动把结果“塞”进去

这种方式非常适合将传统的基于监听器（Listener）或回调（Callback）的异步 API 包装成 CompletableFuture 风格

```java
// 1. 创建一个没有结果的空壳
CompletableFuture<String> promiseFuture = new CompletableFuture<>();

// 2. 模拟一个传统的第三方异步回调接口
thirdPartyService.queryDataAsync(new Callback() {
    @Override
    public void onSuccess(String result) {
        // 成功时，手动把结果塞给 future
        promiseFuture.complete(result);
    }

    @Override
    public void onError(Exception e) {
        // 失败时，手动把异常塞给 future
        promiseFuture.completeExceptionally(e);
    }
});

// 3. 此时你可以像使用普通的 CompletableFuture 一样使用它了
promiseFuture.thenAccept(data -> System.out.println("拿到数据: " + data));
```

## 核心特性
### 链式回调
当异步任务完成后，它会自动触发下一个动作

| 方法 | 解释 |
|--|--|
| thenApply | 拿到上一步的结果，进行转换，并返回新结果 |
| thenAccept | 拿到上一步的结果，消费掉，没有返回值 |
|thenRun  | 上一步执行完了就行，不关心结果，接着做下一件事 |
### 强大的组合能力

**AND 关系（全都要）**： thenCombine（组合两个任务的结果）或静态方法 CompletableFuture.allOf()（等待所有任务完成）

**OR 关系（谁快用谁）**： acceptEither（谁先做完就用谁的结果）或静态方法 CompletableFuture.anyOf()（任意一个完成即可）

### 优雅的异常处理

在异步线程里抛出异常很难抓？CompletableFuture 提供了类似 try-catch 的管道

| 方法名 | 描述 |
|--|--|
|exceptionally | 如果前面的步骤崩了，在这里可以提供一个兜底的默认值 |
|handle|无论成功还是失败，都会走到这一步，让你既能处理结果也能处理异常|
## 典型使用场景
### 场景一：多数据源聚合
电商首页需要展示：商品详情、评论、商家信息、推荐广告。如果串行调用，耗时就是各项之和；使用 CompletableFuture 可以并行调用，最后合并

```java
// 并行调用 3 个独立的微服务
CompletableFuture<Product> prodInfo = CompletableFuture.supplyAsync(() -> queryProduct(id));
CompletableFuture<List<Comment>> comments = CompletableFuture.supplyAsync(() -> queryComments(id));
CompletableFuture<Merchant> merchant = CompletableFuture.supplyAsync(() -> queryMerchant(id));

// 等待所有任务完成（耗时取决于最慢的那一个）
CompletableFuture.allOf(prodInfo, comments, merchant).join();

// 组装数据返回给前端
return new HomepageVO(prodInfo.join(), comments.join(), merchant.join());
```
### 场景二：有前后依赖关系的异步流水线
比如：用户下单后，系统需要：生成订单 -> 扣减库存 -> 发送通知邮件。其中扣库存依赖订单 ID，发邮件依赖扣库存的结果

```java
CompletableFuture.supplyAsync(() -> createOrder(cart)) // 1. 生成订单
    .thenApply(order -> deductStock(order))          // 2. 拿着订单去扣库存
    .thenAccept(stockResult -> sendEmail(stockResult)) // 3. 拿着库存结果发邮件
    .exceptionally(ex -> {
        log.error("流水线执行失败", ex);
        return null;
    });
```
## 注意事项

**线程池隔离**：默认的 ForkJoinPool 是整个 JVM 共享的，生产环境建议传入自定义线程池，防止任务相互影响

**异步任务中的异常必须显示处理**：如果链中某一步抛异常且未被捕获，后续的链式调用不会执行，并且异常会被吞掉，所以需要在末尾添加 exceptionally 或 handle