(window.webpackJsonp=window.webpackJsonp||[]).push([[224],{622:function(s,t,v){"use strict";v.r(t);var a=v(56),r=Object(a.a)({},(function(){var s=this,t=s.$createElement,v=s._self._c||t;return v("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[v("h1",{attrs:{id:"redis实战-单线程的redis为什么能支持10w-的qps"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#redis实战-单线程的redis为什么能支持10w-的qps"}},[s._v("#")]),s._v(" Redis实战：单线程的Redis为什么能支持10w+的QPS?")]),s._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210130141613187.jpg?",alt:"在这里插入图片描述"}})]),s._v(" "),v("h2",{attrs:{id:"单线程为什么能支持10w-的qps"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#单线程为什么能支持10w-的qps"}},[s._v("#")]),s._v(" 单线程为什么能支持10w+的QPS？")]),s._v(" "),v("p",[s._v("我们经常听到Redis是一个单线程程序。准确的说Redis是一个多线程程序，只不过请求处理的部分是用一个线程来实现的。")]),s._v(" "),v("p",[s._v("阿里云对Redis QPS的测试结果如下所示")]),s._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/2021022721212118.png?",alt:"在这里插入图片描述"}})]),s._v(" "),v("p",[v("strong",[s._v("Redis是如何用单线程来实现每秒10w+的QPS的呢？")])]),s._v(" "),v("ol",[v("li",[s._v("使用IO多路复用")]),s._v(" "),v("li",[s._v("非CPU密集型任务")]),s._v(" "),v("li",[s._v("高效的数据结构")]),s._v(" "),v("li",[s._v("纯内存操作")])]),s._v(" "),v("h2",{attrs:{id:"io多路复用"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#io多路复用"}},[s._v("#")]),s._v(" IO多路复用")]),s._v(" "),v("p",[v("strong",[s._v("当使用IO多路复用时我们可以使用一个线程来处理多个客户端的连接")])]),s._v(" "),v("p",[s._v("当我们使用阻塞IO（Java中的BIO），调用read函数，传入参数n，表示读取n个字节后线程才会返回，不然就一直阻塞。write方法一般不会阻塞，除非写缓冲区被写满，write才会被阻塞，直到缓冲区中有空间被释放出来。")]),s._v(" "),v("p",[s._v("当我们使用IO多路复用技术时，当没有数据可读或者可写，客户端线程会直接返回，并不会阻塞。这样Redis就可以用一个线程来监听多个Socket，当一个Socket可读或可写的时候，Redis去读取请求，操作内存中数据，然后返回。")]),s._v(" "),v("h2",{attrs:{id:"非cpu密集型任务"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#非cpu密集型任务"}},[s._v("#")]),s._v(" 非CPU密集型任务")]),s._v(" "),v("p",[v("strong",[s._v("当采用单线程时，就无法使用多核CPU，但Redis中大部分命令都不是CPU密集型任务，所以CPU并不是Redis的瓶颈，Redis瓶颈主要是在内存和网络带宽")]),s._v("。")]),s._v(" "),v("p",[v("strong",[s._v("所以Redis采用单线程就已经能处理海量的请求，因此就没必要使用多线程")]),s._v("。除此之外，"),v("strong",[s._v("使用单线程还有如下好处")])]),s._v(" "),v("ol",[v("li",[s._v("没有了线程切换的性能开销")]),s._v(" "),v("li",[s._v("各种操作不用加锁（如果采用多线程，则对共享资源的访问需要加锁，增加开销）")]),s._v(" "),v("li",[s._v("方便调试，可维护性高")])]),s._v(" "),v("h2",{attrs:{id:"高效的数据结构"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#高效的数据结构"}},[s._v("#")]),s._v(" 高效的数据结构")]),s._v(" "),v("p",[v("strong",[s._v("Redis所有的数据结构都是在内存占用和执行效率之间找一个比较好的均衡点，不一味的节省内存，也不一味的提高执行效率。")])]),s._v(" "),v("p",[v("strong",[s._v("Redis一种数据类型并不是固定用一种数据结构来存储，而是在不同数据结构之间进行切换")]),s._v("。优先使用占用内存少的数据结构，当效率比较低时再转为执行效率比较高的数据结构")]),s._v(" "),v("p",[v("img",{attrs:{src:"https://img-blog.csdnimg.cn/125bbeaaf4c0453cbe0ad6b6030c04fd.png",alt:"在这里插入图片描述"}})]),s._v(" "),v("h2",{attrs:{id:"纯内存操作"}},[v("a",{staticClass:"header-anchor",attrs:{href:"#纯内存操作"}},[s._v("#")]),s._v(" 纯内存操作")]),s._v(" "),v("p",[v("strong",[s._v("Redis是一个内存数据库，各种命令的读写操作都是基于内存完成的")]),s._v("。大家都知道操作内存和操作磁盘效率相差好几个数量级。虽然Redis的效率很高，但还是有一些慢操作需要大家避免")])])}),[],!1,null,null,null);t.default=r.exports}}]);