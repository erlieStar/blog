(window.webpackJsonp=window.webpackJsonp||[]).push([[207],{603:function(s,t,a){"use strict";a.r(t);var e=a(56),r=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"mysql实战-监控"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#mysql实战-监控"}},[s._v("#")]),s._v(" MySQL实战：监控")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/direct/8a97fc8421af4ed2b17e61aac25856ec.png",alt:"在这里插入图片描述"}})]),s._v(" "),a("h2",{attrs:{id:"监控指标"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#监控指标"}},[s._v("#")]),s._v(" 监控指标")]),s._v(" "),a("p",[s._v("性能类指标")]),s._v(" "),a("table",[a("thead",[a("tr",[a("th",[s._v("名称")]),s._v(" "),a("th",[s._v("说明")])])]),s._v(" "),a("tbody",[a("tr",[a("td",[s._v("QPS")]),s._v(" "),a("td",[s._v("数据库每秒处理的请求数量")])]),s._v(" "),a("tr",[a("td",[s._v("TPS")]),s._v(" "),a("td",[s._v("数据库每秒处理的事务数量")])]),s._v(" "),a("tr",[a("td",[s._v("并发数")]),s._v(" "),a("td",[s._v("数据库实例当前并行处理的会话数量")])]),s._v(" "),a("tr",[a("td",[s._v("连接数")]),s._v(" "),a("td",[s._v("连接到数据库会话的数量")])]),s._v(" "),a("tr",[a("td",[s._v("缓存命中率")]),s._v(" "),a("td",[s._v("Innodb的缓存命中率")])])])]),s._v(" "),a("p",[s._v("功能类指标")]),s._v(" "),a("table",[a("thead",[a("tr",[a("th",[s._v("名称")]),s._v(" "),a("th",[s._v("说明")])])]),s._v(" "),a("tbody",[a("tr",[a("td",[s._v("可用性")]),s._v(" "),a("td",[s._v("数据库是否正常对外提供服务")])]),s._v(" "),a("tr",[a("td",[s._v("阻塞")]),s._v(" "),a("td",[s._v("当前是否有阻塞的会话")])]),s._v(" "),a("tr",[a("td",[s._v("死锁")]),s._v(" "),a("td",[s._v("当前事务是否产生了死锁")])]),s._v(" "),a("tr",[a("td",[s._v("慢查询")]),s._v(" "),a("td",[s._v("实时慢查询监控")])]),s._v(" "),a("tr",[a("td",[s._v("主从延迟")]),s._v(" "),a("td",[s._v("数据库主从延迟时间")])]),s._v(" "),a("tr",[a("td",[s._v("主从状态")]),s._v(" "),a("td",[s._v("数据库主从复制链路是否正常")])])])]),s._v(" "),a("h3",{attrs:{id:"qps"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#qps"}},[s._v("#")]),s._v(" QPS")]),s._v(" "),a("p",[s._v("各种请求的数量")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("like")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'com%'")]),s._v("\n")])])]),a("p",[s._v("各种请求的和")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("like")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'queries'")]),s._v("\n")])])]),a("p",[s._v("qps = (queries2- queries1) / 时间间隔")]),s._v(" "),a("h3",{attrs:{id:"tps"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#tps"}},[s._v("#")]),s._v(" TPS")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("where")]),s._v(" variable_name "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("in")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'con_insert'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'com_delete'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'com_update'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n")])])]),a("p",[s._v("tc = com_insert + com_delete + com_update")]),s._v(" "),a("p",[s._v("tps = (tc2 - tc1) / (time2 - time1)")]),s._v(" "),a("h3",{attrs:{id:"数据库并发数"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#数据库并发数"}},[s._v("#")]),s._v(" 数据库并发数")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("like")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'threads_running'")]),s._v("\n")])])]),a("h3",{attrs:{id:"数据库连接数"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#数据库连接数"}},[s._v("#")]),s._v(" 数据库连接数")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("like")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'threads_connected'")]),s._v("\n")])])]),a("p",[s._v("报警阈值：threads_connected / max_connections > 0.8")]),s._v(" "),a("h3",{attrs:{id:"innodb缓存命中率"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#innodb缓存命中率"}},[s._v("#")]),s._v(" Innodb缓存命中率")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("show")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("global")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("status")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("like")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'innodb_buffer_pool_read%'")]),s._v("\n")])])]),a("p",[s._v("(Innodb_buffer_pool_read_requests - Innodb_buffer_pool_reads) / （Innodb_buffer_pool_read_requests） *100%")]),s._v(" "),a("p",[s._v("Innodb_buffer_pool_read_requests：从缓存池中读取的次数\nInnodb_buffer_pool_reads：从物理磁盘读取的次数")]),s._v(" "),a("h3",{attrs:{id:"数据库可用性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#数据库可用性"}},[s._v("#")]),s._v(" 数据库可用性")]),s._v(" "),a("p",[s._v("周期性的连接数据库并执行select @@version")]),s._v(" "),a("h3",{attrs:{id:"监控慢查询"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#监控慢查询"}},[s._v("#")]),s._v(" 监控慢查询")]),s._v(" "),a("p",[s._v("通过慢查询日志监控")]),s._v(" "),a("h3",{attrs:{id:"死锁"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#死锁"}},[s._v("#")]),s._v(" 死锁")]),s._v(" "),a("p",[s._v("查看最近一次死锁信息")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SHOW")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ENGINE")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("INNODB")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("STATUS")]),s._v("\n")])])]),a("p",[s._v("使用pt-deadlock-logger工具")])])}),[],!1,null,null,null);t.default=r.exports}}]);