(window.webpackJsonp=window.webpackJsonp||[]).push([[123],{520:function(t,v,a){"use strict";a.r(v);var _=a(56),r=Object(_.a)({},(function(){var t=this,v=t.$createElement,a=t._self._c||v;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"面试官-分布式事务的解决方案有哪些"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#面试官-分布式事务的解决方案有哪些"}},[t._v("#")]),t._v(" 面试官：分布式事务的解决方案有哪些？")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/028600d233db447fae72f9853882a1ae.jpg?",alt:"在这里插入图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"二阶段提交协议"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#二阶段提交协议"}},[t._v("#")]),t._v(" 二阶段提交协议")]),t._v(" "),a("p",[a("strong",[t._v("分布式事务我单独写了一个专栏《seata源码解析》，对分布式事务介绍的比较详细，加我微信zztierlie领取哈")])]),t._v(" "),a("p",[t._v("为了解决分布式事务的问题，出现了很多协议，如2PC（二阶段提交协议）、3PC（三阶段提交协议）")]),t._v(" "),a("p",[a("strong",[t._v("在二阶段提交协议中有一个事务管理器和多个资源管理器。事务管理器分两阶段协调资源管理器。")])]),t._v(" "),a("p",[t._v("一阶段：事务管理器告诉资源管理器准备执行事务，并锁住需要的资源。当准备完成后，资源管理器向事务管理器报告已准备就绪。\n二阶段：如果所有资源管理器都准备成功，第二阶段事务管理器回要求所有的资源管理器执行提交操作。如果任一资源管理器在第一阶段返回准备失败，那么事务管理器回要求所有的资源管理器在第二阶段执行回滚操作。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/454901b7f2a04c7b8b05cbf3194e4cd1.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("二阶段看起来能提供原子性操作，但是不幸的是，二阶段提交还是有几个缺点的")]),t._v(" "),a("ol",[a("li",[a("strong",[t._v("2PC是一个同步阻塞协议")]),t._v("，资源管理器在执行的过程中会锁定资源。其他第三方节点想访问这些资源的时候不得不处于阻塞状态")]),t._v(" "),a("li",[t._v("一阶段有超时机制，在第一阶段事务管理器没有收到资源管理的响应，或者资源管理器挂了。超时就会判端事务失效，向所有资源管理器发送回滚命令。但二阶段只能不断重试")]),t._v(" "),a("li",[t._v("事务管理器存在单点风险，如果发生故障，则资源管理器会一直阻塞下去。")])]),t._v(" "),a("p",[t._v("基于2PC的问题，人们又提出了3PC的概念，但是很少被使用，没研究过，大家可以看看其他文章")]),t._v(" "),a("h2",{attrs:{id:"xa规范"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#xa规范"}},[t._v("#")]),t._v(" XA规范")]),t._v(" "),a("p",[a("strong",[t._v("XA规范是X/Open 组织针对二阶段提交协议的实现做的规范。目前几乎所有的主流数据库都对XA规范提供了支持")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/c5f0aa060ab44e3abdebc574d56fbe63.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("XA规范的特点是：")]),t._v(" "),a("ol",[a("li",[t._v("对代码无侵入，开发比较快速")]),t._v(" "),a("li",[t._v("对资源进行了长时间的锁定，并发程度比较低")])]),t._v(" "),a("h2",{attrs:{id:"tcc"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#tcc"}},[t._v("#")]),t._v(" TCC")]),t._v(" "),a("p",[t._v("TCC这种方案应该是在企业中应用最广泛的一种方案，"),a("strong",[t._v("在业务层面实现分布式事务")]),t._v("。TCC是Try、Confirm、Cancel三个词语的缩写。")]),t._v(" "),a("p",[t._v("TCC主要分为3个操作。\nTry：一阶段，负责业务资源检查和预留\nConfirm：二阶段提交操作，所有的Try都成功了，则执行Confirm操作。Confirm真正执行业务，使用Try预留的资源\nCancel：二阶段回滚操作，只有一个Try失败了，则走到Cancel操作。Cancel释放Try预留的资源")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/5d28f1c000154c3a920edb7d616e9293.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("TCC的特点为：")]),t._v(" "),a("ol",[a("li",[t._v("并发程度高，在业务层面锁定资源")]),t._v(" "),a("li",[t._v("开发量大，一个业务员需要提供Try/Confirm/Cancel三个方法")])]),t._v(" "),a("h2",{attrs:{id:"saga"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#saga"}},[t._v("#")]),t._v(" SAGA")]),t._v(" "),a("p",[t._v("SAGA是一种补偿协议，在SAGA模式下，分布式事务有多个参与者。在分布式事务的执行过程中，依次执行各参与者的正向操作，如果所有正向操作都执行成功，那么分布式事务提交。如果任何一个正向操作失败，则会执行前面各参与者的回滚操作，将事务状态回到初始状态")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/008461ca58a444b3b44774049e59be8a.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("SAGA特点为")]),t._v(" "),a("ol",[a("li",[t._v("并发度高，不需要长期锁定资源")]),t._v(" "),a("li",[t._v("开发量大，需要定义正向操作和补偿操作")]),t._v(" "),a("li",[t._v("不能保证隔离型")])]),t._v(" "),a("h2",{attrs:{id:"本地消息表"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#本地消息表"}},[t._v("#")]),t._v(" 本地消息表")]),t._v(" "),a("p",[t._v("本地消息表这个解决方案是eBay 的系统架构师丹 · 普利切特（Dan Pritchett）在 2008 年发表于 ACM 的论文中提出的")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/9b93d8cd0a4a4db7b6aa9c4c33e7eead.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("我们以买书为例说一下大致流程")]),t._v(" "),a("ol",[a("li",[t._v("账号服务扣减账户余额，同时写入一条消息（状态为进行中），注意扣减账户余额和写消息在一个本地事务中")]),t._v(" "),a("li",[t._v("账号服务轮询消息表，将进行中的消息发送到消息队列")]),t._v(" "),a("li",[t._v("仓库服务收到消息后，扣减相应的库存。扣减完成后将结果通过给账号服务，账号服务将消息的状态更新为已完成（或者删除）")]),t._v(" "),a("li",[t._v("当消息发送失败，或者消息消费失败时，会不断重试，因此仓库服务要保证消费的幂等性。")])]),t._v(" "),a("p",[a("strong",[t._v("通过这种方案就能达到事务的最终一致性，这种不断重试的思路，也体现了我们后面要提到的最大努力通知")])]),t._v(" "),a("p",[t._v("本地消息表特点为：")]),t._v(" "),a("ol",[a("li",[t._v("需要创建额外的消息表，不断对消息表轮询")])]),t._v(" "),a("h2",{attrs:{id:"rocketmq事务消息"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#rocketmq事务消息"}},[t._v("#")]),t._v(" RocketMQ事务消息")]),t._v(" "),a("p",[t._v("在本地消息表方案中，生产者需要额外创建本地消息表，还要对本地消息进行轮询。RocketMQ在4.3之后的版本正式支持事务消息，"),a("strong",[t._v("该事务消息的本质是把本地消息表放在RocketMQ上，解决生产端消息发送和本地事务执行的原子性问题")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/e9b68cf9eb7c4e8cbf667845ee8070ae.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("RocketMQ实现分布式事务的流程如下")])]),t._v(" "),a("ol",[a("li",[t._v("producer向mq server发送一个半消息")]),t._v(" "),a("li",[t._v("mq server将消息持久化成功后，向发送方确认消息已经发送成功，此时消息并不会被consumer消费")]),t._v(" "),a("li",[t._v("producer开始执行本地事务逻辑")]),t._v(" "),a("li",[t._v("producer根据本地事务执行结果向mq server发送二次确认，mq收到commit状态，将消息标记为可投递，consumer会消费该消息。mq收到rollback则删除半消息，consumer将不会消费该消息，如果收到unknow状态，mq会对消息发起回查")]),t._v(" "),a("li",[t._v("在断网或者应用重启等特殊情况下，步骤4提交的2次确认有可能没有到达mq server，经过固定时间后mq会对该消息发起回查")]),t._v(" "),a("li",[t._v("producer收到回查后，需要检查本地事务的执行状态")]),t._v(" "),a("li",[t._v("producer根据本地事务的最终状态，再次提交二次确认，mq仍按照步骤4对半消息进行操作")])]),t._v(" "),a("p",[a("strong",[t._v("看到这，可能有人会问了，我们先执行本地事务，执行成功后再发送消息，这样不也可以保证生产端消息发送和本地事务执行的原子性？")])]),t._v(" "),a("p",[t._v("其实这样做还是有可能会造成数据不一致的问题。假如本地事务执行成功，发送消息，由于网络延迟，消息发送成功，但是回复超时了，抛出异常，本地事务回滚。但是消息其实投递成功并被消费了，此时就会造成数据不一致的情况")]),t._v(" "),a("p",[a("strong",[t._v("那消息投递到mq server，consumer消费失败怎么办？")])]),t._v(" "),a("p",[t._v("如果是消费超时，重试即可。如果是由于代码等原因真的消费失败了，此时就得人工介入，重新手动发送消息，达到最终一致性。")]),t._v(" "),a("h2",{attrs:{id:"最大努力通知"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#最大努力通知"}},[t._v("#")]),t._v(" 最大努力通知")]),t._v(" "),a("p",[t._v("做过微信充值或者支付宝充值的小伙伴对这个方案应该比较熟悉，因为最大努力通知这种方案在充值系统中经常被使用。充值系统通过不断的重试将充值结果推送给账户系统。因此账户系统接收充值结果的系统要保持幂等。另外充值充值系统还要提供回查接口，让账户系统主动校验充值的状态。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/8d94d738ae64462cbdf564d26d3e84f1.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("从微信支付的开发文档就可以看到微信支付用到了最大努力通知\nhttps://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=9_7")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/a9e4e6bba5fc4c3587b230fa3bfac21f.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"seata-at模式"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#seata-at模式"}},[t._v("#")]),t._v(" Seata AT模式")]),t._v(" "),a("p",[t._v("这是阿里开源的事务框架Seata中主推的事务模式。Seata AT是一种无侵入的事务解决方案。事务的一阶段和二阶段均由框架自动生成。"),a("strong",[t._v("用户SQL作为分布式事务的一阶段，而二阶段由框架自动生成提交/回滚操作")]),t._v("。和XA模式很类似")]),t._v(" "),a("p",[t._v("Seata AT模式特点：")]),t._v(" "),a("ol",[a("li",[t._v("对代码无侵入，开发速度较快")]),t._v(" "),a("li",[t._v("需要用全局锁来保证隔离性，并发程度较低")])])])}),[],!1,null,null,null);v.default=r.exports}}]);