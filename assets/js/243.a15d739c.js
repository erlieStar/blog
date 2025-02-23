(window.webpackJsonp=window.webpackJsonp||[]).push([[243],{641:function(_,t,v){"use strict";v.r(t);var s=v(56),r=Object(s.a)({},(function(){var _=this,t=_.$createElement,v=_._self._c||t;return v("ContentSlotsDistributor",{attrs:{"slot-key":_.$parent.slotKey}},[v("h1",{attrs:{id:"rocketmq源码解析-消息丢失如何排查"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#rocketmq源码解析-消息丢失如何排查"}},[_._v("#")]),_._v(" RocketMQ源码解析：消息丢失如何排查？")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/4ded5215615d4e22b51411924bcd4481.png",alt:"请添加图片描述"}})]),_._v(" "),v("h2",{attrs:{id:"消息丢失如何排查"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#消息丢失如何排查"}},[_._v("#")]),_._v(" 消息丢失如何排查？")]),_._v(" "),v("p",[_._v("当我们在使用mq的时候，经常会遇到消息消费异常的问题，原因有很多种，比如")]),_._v(" "),v("ol",[v("li",[_._v("producer发送失败")]),_._v(" "),v("li",[_._v("consumer消费异常")]),_._v(" "),v("li",[_._v("consumer根本就没收到消息")])]),_._v(" "),v("p",[v("strong",[_._v("那么我们该如何排查了?")])]),_._v(" "),v("p",[_._v("其实借助RocketMQ-Dashboard就能高效的排查，里面有很多你想象不到的功能")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/6ef2962193f342e89c6c06d86033d7e9.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[_._v("首先我们先查找期望消费的消息，查找的方式有很多种，根据消息id，时间等")]),_._v(" "),v("p",[v("strong",[_._v("消息没找到？")])]),_._v(" "),v("p",[_._v("说明proder发送异常，也有可能是消息过期了，因为rocketmq的消息默认保存72h，此时到producer端的日志进一步确认即可")]),_._v(" "),v("p",[v("strong",[_._v("消息找到了！")])]),_._v(" "),v("p",[_._v("接着看消息的消费状态，如下图消息的消费状态为NOT_ONLINE")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/88ec2f123ee847a0a811ee9ce40e0d9b.png#pic_center",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[v("strong",[_._v("NOT_ONLINE代表什么含义呢？")])]),_._v(" "),v("p",[_._v("别着急，我们一步步来分析，先看看TrackType到底有多少种状态")]),_._v(" "),v("div",{staticClass:"language-java extra-class"},[v("pre",{pre:!0,attrs:{class:"language-java"}},[v("code",[v("span",{pre:!0,attrs:{class:"token keyword"}},[_._v("public")]),_._v(" "),v("span",{pre:!0,attrs:{class:"token keyword"}},[_._v("enum")]),_._v(" "),v("span",{pre:!0,attrs:{class:"token class-name"}},[_._v("TrackType")]),_._v(" "),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v("{")]),_._v("\n    CONSUMED"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v(",")]),_._v("\n    CONSUMED_BUT_FILTERED"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v(",")]),_._v("\n    PULL"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v(",")]),_._v("\n    NOT_CONSUME_YET"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v(",")]),_._v("\n    NOT_ONLINE"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v(",")]),_._v("\n    UNKNOWN\n"),v("span",{pre:!0,attrs:{class:"token punctuation"}},[_._v("}")]),_._v("\n")])])]),v("p",[_._v("每种类型的解释如下")]),_._v(" "),v("table",[v("thead",[v("tr",[v("th",[_._v("类型")]),_._v(" "),v("th",[_._v("解释")])])]),_._v(" "),v("tbody",[v("tr",[v("td",[_._v("CONSUMED")]),_._v(" "),v("td",[_._v("消息已经被消费")])]),_._v(" "),v("tr",[v("td",[_._v("CONSUMED_BUT_FILTERED")]),_._v(" "),v("td",[_._v("消息已经投递但被过滤")])]),_._v(" "),v("tr",[v("td",[_._v("PULL")]),_._v(" "),v("td",[_._v("消息消费的方式是拉模式")])]),_._v(" "),v("tr",[v("td",[_._v("NOT_CONSUME_YET")]),_._v(" "),v("td",[_._v("目前没有被消费")])]),_._v(" "),v("tr",[v("td",[_._v("NOT_ONLINE")]),_._v(" "),v("td",[_._v("CONSUMER不在线")])]),_._v(" "),v("tr",[v("td",[_._v("UNKNOWN")]),_._v(" "),v("td",[_._v("未知错误")])])])]),_._v(" "),v("p",[v("strong",[_._v("怎么判定消息已经被消费？")])]),_._v(" "),v("p",[_._v("上一节我们讲到，broker会用一个map来保存每个queue的消费进度，"),v("strong",[_._v("如果queue的offset大于被查询消息的offset则消息被消费，否则没有被消费")]),_._v("（NOT_CONSUME_YET）")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/af584df82ddc4898957a7a15365a8e2a.png",alt:"是不是一下就能知道问题在哪了？"}})]),_._v(" "),v("p",[_._v("我们在RocketMQ-Dashboard上其实就能看到每个队列broker端的offset（代理者位点）以及消息消费的offset（消费者位点），差值就是没有被消费的消息")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/b9226ba6ba314b8bae5a39fcc63552fa.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[_._v("当消息都被消费时，差值为0，如下图所示")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/4578096363364fea8093ac0a33fb56cb.png#pic_center",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[v("strong",[_._v("CONSUMED_BUT_FILTERED表示消息已经投递，但是已经被过滤掉了")]),_._v("。例如producer发的是topicA，tagA，但是consumer订阅的却是topicA，tagB")]),_._v(" "),v("p",[v("strong",[_._v("CONSUMED_BUT_FILTERED（消息已经被投递但被过滤）是怎么发生的呢？")])]),_._v(" "),v("p",[_._v("这个就不得不提到RocketMQ中的一个概念，"),v("strong",[_._v("消息消费要满足订阅关系一致性，即一个consumerGroup中的所有消费者订阅的topic和tag必须保持一致，不然就会造成消息丢失")])]),_._v(" "),v("p",[_._v("如下图场景，发送了4条消息，consumer1订阅了topica-taga，而consumer2订阅了topica-tab。consumer1消费q0中的数据，consumer2消费q1中的数据")]),_._v(" "),v("p",[_._v("投递到q0的msg-1和msg-3只有msg-1能被正常消费，而msg-3则是CONSUMED_BUT_FILTERED。因为msg-3被投递到q0，但是consumer1不消费tagb的消息导致消息被过滤，造成消息丢失")]),_._v(" "),v("p",[_._v("同理msg-2这条消息也会丢失\n"),v("img",{attrs:{src:"https://img-blog.csdnimg.cn/d87b2ff5f56a4dfe806bbaaa0de70d9f.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[v("strong",[_._v("注意，还有一个非常重要的点")])]),_._v(" "),v("p",[_._v("虽然消息消费失败了，但是消息的offset还会正常提交，即 "),v("strong",[_._v("消息消费失败了，但是状态也会是CONSUMED")])]),_._v(" "),v("p",[v("strong",[_._v("RocketMQ认为消息消费失败需要重试的场景有哪些？")])]),_._v(" "),v("ol",[v("li",[_._v("返回ConsumeConcurrentlyStatus.RECONSUME_LATER")]),_._v(" "),v("li",[_._v("返回null")]),_._v(" "),v("li",[_._v("主动或被动抛出异常")])]),_._v(" "),v("p",[v("strong",[_._v("那么消费失败的消息去哪了呢？")])]),_._v(" "),v("p",[_._v("当消息消费失败，会被放到重试队列中，Topic名字为%RETRY% + consumerGroup")]),_._v(" "),v("p",[v("strong",[_._v("Consumer没订阅这个topic啊，怎么才能消费到重试消息？")])]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/ba837972e85e4581a50e9e40a76943cb.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[_._v("其实在Consumer启动的时候，框架内部帮你订阅了这个topic，所以重试消息能被消费到")]),_._v(" "),v("p",[v("strong",[_._v("另外消息不是一直重试，而是每隔1段时间进行重试")])]),_._v(" "),v("table",[v("thead",[v("tr",[v("th",[_._v("第几次重试")]),_._v(" "),v("th",[_._v("与上次重试的间隔时间")]),_._v(" "),v("th",[_._v("第几次重试")]),_._v(" "),v("th",[_._v("与上次重试的间隔时间")])])]),_._v(" "),v("tbody",[v("tr",[v("td",[_._v("1")]),_._v(" "),v("td",[_._v("10 秒")]),_._v(" "),v("td",[_._v("9")]),_._v(" "),v("td",[_._v("7 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("2")]),_._v(" "),v("td",[_._v("30 秒")]),_._v(" "),v("td",[_._v("10")]),_._v(" "),v("td",[_._v("8 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("3")]),_._v(" "),v("td",[_._v("1 分钟")]),_._v(" "),v("td",[_._v("11")]),_._v(" "),v("td",[_._v("9 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("4")]),_._v(" "),v("td",[_._v("2 分钟")]),_._v(" "),v("td",[_._v("12")]),_._v(" "),v("td",[_._v("10 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("5")]),_._v(" "),v("td",[_._v("3 分钟")]),_._v(" "),v("td",[_._v("13")]),_._v(" "),v("td",[_._v("20 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("6")]),_._v(" "),v("td",[_._v("4 分钟")]),_._v(" "),v("td",[_._v("14")]),_._v(" "),v("td",[_._v("30 分钟")])]),_._v(" "),v("tr",[v("td",[_._v("7")]),_._v(" "),v("td",[_._v("5 分钟")]),_._v(" "),v("td",[_._v("15")]),_._v(" "),v("td",[_._v("1 小时")])]),_._v(" "),v("tr",[v("td",[_._v("8")]),_._v(" "),v("td",[_._v("6 分钟")]),_._v(" "),v("td",[_._v("16")]),_._v(" "),v("td",[_._v("2 小时")])])])]),_._v(" "),v("p",[_._v("当消息超过最大消费次数16次，会将消息投递到死信队列中，死信队列的topic名为%DLQ% + consumerGroup。")]),_._v(" "),v("p",[v("strong",[_._v("因此当你发现消息状态为CONSUMED，但是消费失败时，去重试队列和死信队列中找就行了")])]),_._v(" "),v("h2",{attrs:{id:"消息消费异常排查实战"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#消息消费异常排查实战"}},[_._v("#")]),_._v(" 消息消费异常排查实战")]),_._v(" "),v("p",[_._v("这个问题发生的背景是这样的，就是我们有2个系统，中间通过mq来保证数据的一致性，结果有一天数据不一致了，那肯定是consumer消费消息有问题，或者producer发送消息有问题")]),_._v(" "),v("p",[_._v("先根据时间段找到了消息，确保了发送没有问题，接着看消息的状态为NOT_CONSUME_YET，说明consumer在线但是没有消息")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/ded9d9093b214b6faf01e691be47a9e0.png",alt:"请添加图片描述"}})]),_._v(" "),v("p",[v("strong",[_._v("NOT_CONSUME_YET表明消息没有被消费")]),_._v("，但是消息发送都过了好长时间了，consumer不应该没消费啊，查日志consumer确实没有消费。")]),_._v(" "),v("p",[_._v("用RocketMQ-Dashboard查看一下代理者位点和消费者位点，0队列正常消费，其他队列没有被消费")]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/ce56bbfa8d124293b8fab3140fe0ffb7.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[v("strong",[_._v("感觉这个负载均衡策略有点问题啊，怎么0队列这么多消息，别的队列都怎么没消息，问一波中间件的同学，是不是又改负载均衡策略了？")])]),_._v(" "),v("p",[_._v("确实改了！测试环境下，采用队列纬度区分多环境，0是基准环境，我们团队目前还没有用多环境，所以收发消息都会在队列0上，其他队列不会用到（"),v("strong",[_._v("你可以简单认为测试环境发送和消费消息只会用到0队列")]),_._v("）")]),_._v(" "),v("p",[v("strong",[_._v("那么问题来了！")])]),_._v(" "),v("p",[_._v("首先消息的状态是NOT_CONSUME_YET，说明消息肯定被投递到0队列之外了，但是中间件的小伙伴却说消息不会被投递到0队列")]),_._v(" "),v("p",[_._v("要想验证我的想法首先需要证明没有被消费的消息确实被投递到0队列之外的队列了")]),_._v(" "),v("p",[_._v("中间走的弯路就不说了，直到我看了看RocketMQ-Dashboard的源码，"),v("strong",[_._v("发现Dashboard其实返回了消息的很多信息，但是并没有在页面展示出来，直接看接口返回")])]),_._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/98617d8582924651ba2a12c93e8806be.png",alt:"在这里插入图片描述"}})]),_._v(" "),v("p",[_._v("乖乖，发现了新世界，消息的所有属性都在这了，看到queuId为14，果然验证了我的想法。")]),_._v(" "),v("p",[_._v("再看bornHost居然是我们办公室的网段")]),_._v(" "),v("p",[v("strong",[_._v("难道本地启动的负载均衡策略和测试环境的负载均衡策略不一样？")])]),_._v(" "),v("p",[_._v("本地debug一波代码，果然是本地的producer会往所有的队列发送消息，并且consumer也会消费所有队列的消息")]),_._v(" "),v("p",[v("strong",[_._v("至此找出问题了！")])]),_._v(" "),v("p",[_._v("producer在本地启了一个服务，注册到测试环境的zk，测试环境的部分请求打到本地，往0队列之外的队列发了消息，但是测试环境的consumer只会消费0队列中的消息，导致消息迟迟没有被消费")])])}),[],!1,null,null,null);t.default=r.exports}}]);