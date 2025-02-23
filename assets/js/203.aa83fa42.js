(window.webpackJsonp=window.webpackJsonp||[]).push([[203],{599:function(t,o,_){"use strict";_.r(o);var r=_(56),s=Object(r.a)({},(function(){var t=this,o=t.$createElement,_=t._self._c||o;return _("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[_("h1",{attrs:{id:"mysql实战-三种日志都有啥用"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#mysql实战-三种日志都有啥用"}},[t._v("#")]),t._v(" MySQL实战：三种日志都有啥用？")]),t._v(" "),_("p",[_("img",{attrs:{src:"https://img-blog.csdnimg.cn/2021051611270127.jpg?",alt:"在这里插入图片描述"}})]),t._v(" "),_("h2",{attrs:{id:"详解三种日志"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#详解三种日志"}},[t._v("#")]),t._v(" 详解三种日志")]),t._v(" "),_("p",[t._v("一个更新语句的大概流程如下图所示\n"),_("img",{attrs:{src:"https://img-blog.csdnimg.cn/direct/8c7d185b99964198b315cc5b88420217.png",alt:"在这里插入图片描述"}})]),t._v(" "),_("table",[_("thead",[_("tr",[_("th",[t._v("日志")]),t._v(" "),_("th",[t._v("作用")])])]),t._v(" "),_("tbody",[_("tr",[_("td",[t._v("redolog")]),t._v(" "),_("td",[t._v("InnoDB产生的物理日志，保证持久化")])]),t._v(" "),_("tr",[_("td",[t._v("undolog")]),t._v(" "),_("td",[t._v("InnoDB产生的逻辑日志，保证隔离性，原子性")])]),t._v(" "),_("tr",[_("td",[t._v("binlog")]),t._v(" "),_("td",[t._v("server层产生的逻辑日志，用来进行数据复制")])])])]),t._v(" "),_("h2",{attrs:{id:"redolog-系统宕机了-如何避免数据丢失"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#redolog-系统宕机了-如何避免数据丢失"}},[t._v("#")]),t._v(" redolog：系统宕机了，如何避免数据丢失？")]),t._v(" "),_("p",[_("strong",[t._v("在前面的章节中我们引出了脏页这个概念，如果对应的脏页还没有被刷到磁盘中，数据库就宕机了，那我们的更改不久丢失了？")])]),t._v(" "),_("p",[t._v("为了解决这个问题，我们需要把内存所做的修改写入到 redolog buffer中，这是内存里的一个缓冲区，用来存在redo日志。")]),t._v(" "),_("p",[t._v("rodo log记录了你对数据所做的修改，如“将id=1这条数据的name从a变为abc”，物理日志哈，后面会再提一下。")]),t._v(" "),_("p",[_("strong",[t._v("redo log是顺序写所以比随机写效率高")])]),t._v(" "),_("p",[_("strong",[t._v("InnoDB的redo log是固定大小的")]),t._v("，比如可以配置为一组 4 个文件，每个文件的大小是 1GB，那么总大小为4GB。从头开始写，写到末尾就又回到开头循环写，如下面这个图所示。")]),t._v(" "),_("p",[_("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210516163121535.png?",alt:"在这里插入图片描述"}}),t._v("\nwrite pos是当前要写的位置，checkpoint是要擦除的位置，擦除前要把对应的脏页刷回到磁盘中。write pos和checkpoint中间的位置是可以写的位置。")]),t._v(" "),_("p",[_("strong",[t._v("当我们的系统能支持的并发比较低时，可以看看对应的redo log是不是设置的太小了。太小的话会导致频繁的刷脏页，影响并发，可以通过工具监控redo log的大小")])]),t._v(" "),_("p",[t._v("redolog的大小 = innodb_log_file_size * innodb_log_files_in_group（默认为2）\n"),_("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210516162854582.png?",alt:"在这里插入图片描述"}})]),t._v(" "),_("p",[_("strong",[t._v("接下来我们详细聊聊，redolog是如何避免数据丢失的")])]),t._v(" "),_("p",[t._v("事务未提交，MySQL宕机，这种情况BufferPool中的数据丢失，并且redolog buffer中的日志也会丢失，不会影响数据")]),t._v(" "),_("p",[t._v("提交事务成功，redolog buffer中的数据没有刷到磁盘，此时会导致事务提交的数据丢失。")]),t._v(" "),_("p",[_("strong",[t._v("鉴于这种情况，我们可以通过设置innodb_flush_log_at_trx_commit来决定redo log的刷盘策略")])]),t._v(" "),_("p",[t._v("查看innodb_flush_log_at_trx_commit的配置")]),t._v(" "),_("div",{staticClass:"language-sql extra-class"},[_("pre",{pre:!0,attrs:{class:"language-sql"}},[_("code",[_("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("SHOW")]),t._v(" "),_("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("GLOBAL")]),t._v(" VARIABLES "),_("span",{pre:!0,attrs:{class:"token operator"}},[t._v("LIKE")]),t._v(" "),_("span",{pre:!0,attrs:{class:"token string"}},[t._v("'innodb_flush_log_at_trx_commit'")]),t._v("\n")])])]),_("table",[_("thead",[_("tr",[_("th",[t._v("innodb_flush_log_at_trx_commit值")]),t._v(" "),_("th",[t._v("作用")])])]),t._v(" "),_("tbody",[_("tr",[_("td",[t._v("0")]),t._v(" "),_("td",[t._v("提交事务时，不会将redo log buffer中的数据写入os buffer，而是每秒写入os buffer并刷到磁盘")])]),t._v(" "),_("tr",[_("td",[t._v("1")]),t._v(" "),_("td",[t._v("提交事务时，必须把redo log从内存刷入到磁盘文件中")])]),t._v(" "),_("tr",[_("td",[t._v("2")]),t._v(" "),_("td",[t._v("提交事务时，将rodo log写入os buffer中，默认每隔1s将os buffer中的数据刷入磁盘")])])])]),t._v(" "),_("p",[t._v("应为0和2都可能会造成事务更新丢失，所以一般系统中innodb_flush_log_at_trx_commit的值都为1，你可以看看你们的系统用的哪个值？")]),t._v(" "),_("h2",{attrs:{id:"undolog-如何让更新的数据可以回滚"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#undolog-如何让更新的数据可以回滚"}},[t._v("#")]),t._v(" undolog：如何让更新的数据可以回滚？")]),t._v(" "),_("p",[t._v("当执行更改操作时，比如id=1的记录的name从王昭君改为西施，会把原来的记录写入到undo log中。当事务回滚时，就可以通过undolog将数据恢复为原来的模样。\n"),_("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210516162158834.png?",alt:"在这里插入图片描述"}}),t._v("\n此外，undolog在mvcc的实现中也扮演了重要的作用")]),t._v(" "),_("h2",{attrs:{id:"binlog-主从库之间如何同步数据"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#binlog-主从库之间如何同步数据"}},[t._v("#")]),t._v(" binlog：主从库之间如何同步数据？")]),t._v(" "),_("p",[t._v("当我们把mysql主库的数据同步到从库，或者其他数据源时，如es，bi库时，只需要订阅主库的binlog即可。")]),t._v(" "),_("p",[_("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210516190342449.png?",alt:"在这里插入图片描述"}})]),t._v(" "),_("p",[_("strong",[t._v("为什么要弄2种日志呢？")])]),t._v(" "),_("p",[t._v("其实这都是由历史原因决定的")]),t._v(" "),_("p",[t._v("MySQL刚开始用binlog实现归档的功能，但是binlog没有crash-safe的能力，所以后来InnoDB引擎加了redo log来实现crash-safe。假如MySQL中只有一个InnoDB引擎，说不定就能用redo log来实现归档了，此时就可以将redo log和 binlog合并到一块了")]),t._v(" "),_("p",[_("strong",[t._v("这两种日志的区别如下：")])]),t._v(" "),_("ol",[_("li",[t._v("redo log是InnoDB存储引擎特有，binglog是MySQL的server层实现的，所有引擎都可以使用")]),t._v(" "),_("li",[t._v("redo log是物理日志，记录的是数据页上的修改。binlog是逻辑日志，记录的是语句的原始逻辑，如给id=2的这一行的c字段加1")]),t._v(" "),_("li",[t._v("redo log是固定空间，循环写。binlog是追加写，当binlog文件写到一定大小后会切换到下一个，并不会覆盖以前的日志")])]),t._v(" "),_("p",[_("strong",[t._v("我们可以通过设置sync_binlog来决定binlog的刷盘策略")])]),t._v(" "),_("table",[_("thead",[_("tr",[_("th",[t._v("sync_binlog值")]),t._v(" "),_("th",[t._v("作用")])])]),t._v(" "),_("tbody",[_("tr",[_("td",[t._v("0")]),t._v(" "),_("td",[t._v("不立即刷盘，将binlog写入os buffer，由操作系统决定何时刷盘 ，有可能会丢失多个事务的数据")])]),t._v(" "),_("tr",[_("td",[t._v("1")]),t._v(" "),_("td",[t._v("将binlog写入os buffer，每n个事务提交后，将os buffer的数据刷盘")])])])]),t._v(" "),_("p",[t._v("一般情况下将sync_binlog的值设为1即可")]),t._v(" "),_("p",[_("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210516202921205.jpg?",alt:"在这里插入图片描述"}})])])}),[],!1,null,null,null);o.default=s.exports}}]);