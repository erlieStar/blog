(window.webpackJsonp=window.webpackJsonp||[]).push([[219],{617:function(s,t,a){"use strict";a.r(t);var e=a(56),r=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"redis实战-redis哨兵机制"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#redis实战-redis哨兵机制"}},[s._v("#")]),s._v(" Redis实战：Redis哨兵机制")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/7c4ed1ba25ff4a92b4f7c8a0464ac436.png",alt:"请添加图片描述"}})]),s._v(" "),a("h2",{attrs:{id:"手写一个监控程序"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#手写一个监控程序"}},[s._v("#")]),s._v(" 手写一个监控程序")]),s._v(" "),a("p",[s._v("我是个苦逼的运维，最近公司的redis主从服务不太稳定，主节点老是无缘无故挂掉，害得我老是半夜起来手动切换主节点，这样下去可不行，我得写个监控脚本帮我干这个活")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4c52ebe120e24869b92b94b5fd478ce5.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[s._v("首先我先连上所有的主从节点，每隔1s发送ping命令")]),s._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[s._v("redis-cli -h "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10.25")]),s._v(".0.0 -p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),s._v("\nredis-cli -h "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10.25")]),s._v(".0.1 -p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),s._v("\nredis-cli -h "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10.25")]),s._v(".0.2 -p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),s._v("\nredis-cli -h "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10.25")]),s._v(".0.3 -p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),s._v("\n")])])]),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4e8b979091a84c71915f922bb7729c95.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/3a10a6b79de34f2687b8c10d92734f44.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[s._v("如果主节点没有响应，我就随便挑一个从节点执行 "),a("strong",[s._v("slaveof no one")]),s._v(" 命令，就 10.25.0.1 这个节点吧。")]),s._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10.232")]),s._v(".0.3:637"),a("span",{pre:!0,attrs:{class:"token operator"}},[a("span",{pre:!0,attrs:{class:"token file-descriptor important"}},[s._v("9")]),s._v(">")]),s._v(" info\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("..")]),s._v(".\nrole:master\n")])])]),a("p",[s._v("然后执行info命令，当info命令显示这个节点的角色为master时，依次对其他从节点执行 "),a("strong",[s._v("slaveof 10.25.0.1")]),s._v(" 让其从 10.25.0.1 复制数据")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4478ed74a2d540c98a0d95dd4426b8f0.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[s._v("当然挂掉的主节点不能不管不顾，当它复活的时候，也要对其执行 "),a("strong",[s._v("slaveof 10.25.0.1")]),s._v(" 让其从 10.25.0.1 复制数据，不愧是我")]),s._v(" "),a("p",[s._v("于是这个监控就开始愉快的运行了，终于可以踏实的睡几天觉了。")]),s._v(" "),a("p",[s._v("过了几天，没想到主节点挂了之后没能正常切换，"),a("strong",[s._v("原来是我的监控程序挂了")]),s._v("。")]),s._v(" "),a("p",[s._v("又过了几天，服务又不稳定了，监控程序老是频繁的切换主节点，但是主节点并没有问题，"),a("strong",[s._v("原来是我这个监控程序和主节点的网络不太稳定，让监控程序误认为主节点挂了")]),s._v("。")]),s._v(" "),a("p",[a("strong",[s._v("面对大家对Redis主从节点自动切换的需求越来越强烈，Redis官方也坐不下去了，索性自己写了一个监控程序，并且把这个监控程序叫做哨兵！")])]),s._v(" "),a("h2",{attrs:{id:"redis中的哨兵是如何工作的"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#redis中的哨兵是如何工作的"}},[s._v("#")]),s._v(" Redis中的哨兵是如何工作的？")]),s._v(" "),a("p",[s._v("作为一个官方的程序，上面我们遇到的问题肯定都会被解决，我们来看看哨兵是如何解决的")]),s._v(" "),a("h3",{attrs:{id:"监测流程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#监测流程"}},[s._v("#")]),s._v(" 监测流程")]),s._v(" "),a("p",[a("strong",[s._v("首先为了解决哨兵宕机不能正常进行切换的问题，我们可以对哨兵搭建一个集群，每个哨兵都监测主从节点，当主节点不可用时，选一个正常的哨兵进行主从切换")])]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/06739e9a9cc34f49b2124df947ec7552.png#pic_center",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[s._v("master端的info信息")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/90a7a1a70ff048c9864c441a0f6cfe2f.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[s._v("slave端的info信息")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/a14044128d5a4856941f0d901728a639.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("h3",{attrs:{id:"故障转移流程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#故障转移流程"}},[s._v("#")]),s._v(" 故障转移流程")]),s._v(" "),a("p",[s._v("上面我们自己写的监测程序与Redis节点网络不稳定时，会频繁进行切换。为了解决这个问题，Redis引入了2个概念")]),s._v(" "),a("p",[s._v("主观下线：当前哨兵程序认为主节点宕机了，具有很强的主观性，有可能是因为网络的问题")]),s._v(" "),a("p",[s._v("客观下线：大多数哨兵程序认为主节点宕机了，那主节点很大概率宕机了，应该进行主从切换了")]),s._v(" "),a("p",[a("strong",[s._v("当有多个哨兵程序时，应该让哪个哨兵程序来执行主从切换呢？")])]),s._v(" "),a("p",[s._v("多个哨兵会根据分布式共识协议，Raft协议，来选出领头哨兵，让其执行主从切换")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/b161848d164c40779ec831afb937a207.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("p",[a("strong",[s._v("当选择主节点的时候，并不是随便选择一个从节点让其变成主节点，而是通过一定的策略筛选出来的，筛选策略主要分为2个阶段")])]),s._v(" "),a("p",[a("strong",[s._v("淘汰阶段")]),s._v("：去掉网络状况不好的从节点，例如断开连接，上一次正常回复ping距当前时间超过5s等")]),s._v(" "),a("p",[a("strong",[s._v("筛选阶段")]),s._v("：在剩下的从节点中先选优先级小的（在redis.conf给每台机器配置了优先级），优先级相同选复制偏移量大的，复制偏移量相同，选runId小的（每个redis实例启动都会分配一个全局唯一的runId）")]),s._v(" "),a("p",[s._v("具体筛选淘汰策略参见sentinel.c/sentinelSelectSlave")])])}),[],!1,null,null,null);t.default=r.exports}}]);