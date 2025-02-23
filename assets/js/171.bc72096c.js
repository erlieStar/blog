(window.webpackJsonp=window.webpackJsonp||[]).push([[171],{568:function(s,t,a){"use strict";a.r(t);var e=a(56),r=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"面试官-高并发下如何保证接口的幂等性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#面试官-高并发下如何保证接口的幂等性"}},[s._v("#")]),s._v(" 面试官：高并发下如何保证接口的幂等性？")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20200622235023337.jpg?",alt:"在这里插入图片描述"}})]),s._v(" "),a("h2",{attrs:{id:"介绍"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#介绍"}},[s._v("#")]),s._v(" 介绍")]),s._v(" "),a("p",[s._v("幂等性就是同一个操作执行多次，产生的效果一样。如http的get请求，数据库的select请求就是幂等的")]),s._v(" "),a("p",[s._v("在分布式系统中，保证接口的幂等性非常重要，如提交订单，扣款等接口都要保证幂等性，不然会造成重复创建订单，重复扣款，那么如何保证接口的幂等性呢？")]),s._v(" "),a("h2",{attrs:{id:"前端保证幂等性的方法"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#前端保证幂等性的方法"}},[s._v("#")]),s._v(" 前端保证幂等性的方法")]),s._v(" "),a("p",[a("strong",[s._v("按钮只能点击一次")]),s._v("\n用户点击按钮后将按钮置灰，或者显示loading状态")]),s._v(" "),a("p",[a("strong",[s._v("RPG模式")]),s._v("\n即Post-Redirect-Get，当客户提交表单后，去执行一个客户端的重定向，转到提交成功页面。避免用户按F5刷新导致的重复提交，也能消除按浏览器后退键导致的重复提交问题。目前绝大多数公司都是这样做的，比如淘宝，京东等")]),s._v(" "),a("h2",{attrs:{id:"后端保证幂等性的方法"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#后端保证幂等性的方法"}},[s._v("#")]),s._v(" 后端保证幂等性的方法")]),s._v(" "),a("p",[a("strong",[s._v("使用唯一索引")]),s._v("\n对业务唯一的字段加上唯一索引，这样当数据重复时，插入数据库会抛异常")]),s._v(" "),a("p",[a("strong",[s._v("状态机幂等")]),s._v("\n如果业务上需要修改订单状态，例如订单状态有待支付，支付中，支付成功，支付失败。设计时最好只支持状态的单向改变。这样在更新的时候就可以加上条件，多次调用也只会执行一次。例如想把订单状态更新为支持成功，则之前的状态必须为支付中")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("update")]),s._v(" table_name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("set")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" 支付成功 "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("where")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" 支付中\n")])])]),a("p",[a("strong",[s._v("乐观锁实现幂等")])]),s._v(" "),a("ol",[a("li",[s._v("查询数据获得版本号")]),s._v(" "),a("li",[s._v("通过版本号去更新，版本号匹配则更新，版本号不匹配则不更新")])]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("-- 假如查询出的version为1")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("select")]),s._v(" version "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("from")]),s._v(" table_name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("where")]),s._v(" userid "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("-- 给用户的账户加10")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("update")]),s._v(" table_name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("set")]),s._v(" money "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" money "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" version "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" version "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("where")]),s._v(" userid "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("and")]),s._v(" version "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v("\n")])])]),a("p",[s._v("也可以通过条件来实现乐观锁，如库存不能超卖，数量不能小于0")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("update")]),s._v(" table_name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("set")]),s._v(" num "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" num "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("where")]),s._v(" num "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v("\n")])])]),a("p",[a("strong",[s._v("防重表")]),s._v("\n增加一个防重表，业务唯一的id作为唯一索引，如订单号，当想针对订单做一系列操作时，可以向防重表中插入一条记录，插入成功，执行后续操作，插入失败，则不执行后续操作。本质上可以看成是基于MySQL实现的分布式锁。根据业务场景决定执行成功后，是否删除防重表中对应的数据")]),s._v(" "),a("p",[a("strong",[s._v("分布式锁实现幂等")]),s._v("\n执行方法时，先根据业务唯一的id获取分布式锁，获取成功，则执行，失败则不执行。分布式锁可以基于redis，zookeeper，mysql来实现，分布式锁的细节就不介绍了")]),s._v(" "),a("p",[a("strong",[s._v("select+insert")]),s._v("\n先查询一下有没有符合要求的数据，如果没有再执行插入。没有并发的系统中可以保证幂等性，高并发下不要用这种方法，也会造成数据的重复插入。"),a("strong",[s._v("我一般做消息幂等的时候就是先select，有数据直接返回，没有数据加分布式锁进行insert操作")])]),s._v(" "),a("p",[a("strong",[s._v("全局唯一号实现幂等")]),s._v("\n通过source（来源）+ seq（序列号）来判断请求是否重复，重复则直接返回请求重复提交，否则执行。如当多个三方系统调用服务的时候，就可以采用这种方式")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20200714223302607.jpg",alt:"在这里插入图片描述"}})])])}),[],!1,null,null,null);t.default=r.exports}}]);