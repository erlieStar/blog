(window.webpackJsonp=window.webpackJsonp||[]).push([[144],{544:function(t,s,e){"use strict";e.r(s);var a=e(56),n=Object(a.a)({},(function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"面试官-生产环境发生问题-你一般怎么排查-网络篇"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#面试官-生产环境发生问题-你一般怎么排查-网络篇"}},[t._v("#")]),t._v(" 面试官：生产环境发生问题，你一般怎么排查？（网络篇）")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/b39a07641be5492888da7097e4bfc79c.jpg?",alt:"请添加图片描述"}})]),t._v(" "),e("h2",{attrs:{id:"网络篇"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#网络篇"}},[t._v("#")]),t._v(" 网络篇")]),t._v(" "),e("h3",{attrs:{id:"tcp报文格式"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#tcp报文格式"}},[t._v("#")]),t._v(" TCP报文格式")]),t._v(" "),e("p",[t._v("TCP协议包的格式如下所示，从第4行可以看到有6个标记位。这6个标记位的含义如下")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/0a10f1ebb68e4bf29ea624fc3a6fbd0f.png?",alt:"在这里插入图片描述"}})]),t._v(" "),e("p",[t._v("【源端口】-16bit")]),t._v(" "),e("p",[t._v("【目的端口】-16bit")]),t._v(" "),e("p",[t._v("【序号】- 32bit")]),t._v(" "),e("p",[t._v("每一个TCP报文段都会有一个序号，序号字段的值为本报文段所发送的数据的第一个字节的序号。这是因为TCP是面向连接的可靠服务，其每一个字节都会对应一个序号，通过序号来确保服务的可靠性和有序性。例如一段报文序号seq是201，报文长度为100，则下一个报文段的序号为301（201+100）")]),t._v(" "),e("p",[t._v("【确认号】- 32bit")]),t._v(" "),e("p",[t._v("确认号，是期望收到对方的下一个报文段的数据的第一个字节的序号。")]),t._v(" "),e("p",[t._v("【数据偏移】- 4bit")]),t._v(" "),e("p",[t._v("其实它本质上就是“首部长度”，表示报文数据距离报文起始位置的长度。\n数据偏移总共占4bit，因此最大能表示的数值为15。而数据偏移的单位是“4字节”，此处的设计和IP数据报的设计是完全相同的，所以说TCP报文段首部的长度最长为15×4=60字节，且首部长度必须为4字节的整数倍。\n一个TCP报文前20个字节是必有的，后40个字节根据情况可能有可能没有。如果TCP报文首部是20个字节，则该位应是20/4=5")]),t._v(" "),e("p",[t._v("【保留字段】- 6bit")]),t._v(" "),e("p",[t._v("这6bit在标准中是保留字段")]),t._v(" "),e("p",[e("strong",[t._v("接着是数据状态标志位，分为如下6种（1是开启，0是关闭）")])]),t._v(" "),e("p",[t._v("【紧急字段URG】- 1bit\n当URG=1时，表示报文段中有紧急数据，应尽快传送。")]),t._v(" "),e("p",[t._v("【确认字段ACK】- 1bit\n当ACK=1时，表示确认，且确认号有效；当ACK=0时，确认号字段无效。")]),t._v(" "),e("p",[t._v("【推送字段PSH】- 1bit\n当PSH=1时，则报文段会被尽快地交付给目的方，不会对这样的报文段使用缓存策略。")]),t._v(" "),e("p",[t._v("【复位字段RST】- 1bit\n当RST为1时，表明TCP连接中出现了严重的差错，必须释放连接，然后再重新建立连接。")]),t._v(" "),e("p",[t._v("【同步字段SYN】- 1bit\n当SYN=1时，表示发起一个连接请求。")]),t._v(" "),e("p",[t._v("【终止字段FIN】- 1bit\n用来释放连接。当FIN=1时，表明此报文段的发送端的数据已发送完成，并要求释放连接。")]),t._v(" "),e("p",[t._v("【窗口字段】- 16bit\n此字段用来控制对方发送的数据量，单位为字节。\n一般TCP连接的其中一端会根据自身的缓存空间大小来确定自己的接收窗口大小，然后告知另一端以确定另一端的发送窗口大小。")]),t._v(" "),e("p",[t._v("【校验和字段】- 16bit\n这个校验和是针对首部和数据两部分的。")]),t._v(" "),e("p",[t._v("【紧急指针字段】- 16bit\n紧急指针是一个正的偏移量，和顺序号字段中的值相加表示紧急数据最后一个字节的序号")]),t._v(" "),e("p",[t._v("【选项】- 长度可变\n可选的。最常见的可选字段是最长报文大小")]),t._v(" "),e("p",[t._v("【填充】\n填充是为了使TCP首部为4字节（32bit）的整数倍")]),t._v(" "),e("p",[t._v("【TCP数据部分】\n可选的，当连接建立或中止时，报文段只有TCP首部")]),t._v(" "),e("h3",{attrs:{id:"发送速率"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#发送速率"}},[t._v("#")]),t._v(" 发送速率")]),t._v(" "),e("p",[t._v("通过发送速率我们就能确定系统的流量大小。如果还需要计算发送数据量的大小，就需要换算一下。一般情况下我们不需要精确计算数据传输的大小，单位相同直接除8即可")]),t._v(" "),e("p",[e("strong",[t._v("常用数据量单位")]),t._v("\n一个比特就是二进制数据中的一个1或0\n1Byte = 8 bit\nKB = 2^10^B\nMB = K"),e("em",[t._v("KB = 2^20^B\nGB = K")]),t._v("MB = 2^30^B\nTB = K*GB = 2^40^B")]),t._v(" "),e("p",[e("strong",[t._v("常用速率单位")]),t._v("\nkb/s = 10^3^b/s (bps) (一秒传输1000个比特)\nMb/s = k"),e("em",[t._v("kb/s = 10^6^b/s (bps)\nGb/s = k")]),t._v("Mb/s = 10^9^b/s (bps)\nTb/s = k*Gb/s = 10^12^b/s (bps)")]),t._v(" "),e("p",[t._v("有一个待发送的数据块，大小为100MB，网卡的发送速率为100Mbps，则网卡发送完该数据需要多长时间")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/c6c9d724abaa4c40949ff6569ba35f99.png",alt:"在这里插入图片描述"}})]),t._v(" "),e("p",[t._v("8mbps=1mb（每秒传输的大小为1mb）\n8gbps=1gb（每秒传输的大小为1gb）")]),t._v(" "),e("h3",{attrs:{id:"三次握手"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#三次握手"}},[t._v("#")]),t._v(" 三次握手")]),t._v(" "),e("p",[t._v("三次握手的过程其实在我们生活中经常遇到，尤其是打电话，下面这个场景非常常见")]),t._v(" "),e("p",[t._v("A： 你好，我是A，你能听到我说话吗？\nB：你好A，我是B，你能听到我说话吗？\nA：可以的")]),t._v(" "),e("p",[e("strong",[t._v("三次握手能让Server和Client都确认双方发送和接收正常")])]),t._v(" "),e("p",[t._v("第一次握手：Client什么都不能确认，Server确认自己接收正常，对方发送正常")]),t._v(" "),e("p",[t._v("第二次握手：Client确认了自己发送和接收正常，对方发送和接收正常。Server确认了自己接收正常，对方发送正常")]),t._v(" "),e("p",[t._v("第三次握手：Client确认了自己发送和接收正常，对方发送和接收正常。Server端确了自己发送和接收正常，对方发送和接收正常")]),t._v(" "),e("p",[e("strong",[t._v("二次握手可以吗？")])]),t._v(" "),e("p",[t._v("不可以，因为Server端无法确认自己发送正常和对方接收正常")]),t._v(" "),e("p",[e("strong",[t._v("四次握手可以吗？")])]),t._v(" "),e("p",[t._v("当然可以，但是没必要。保证Server和Client都正常发送和接收就可以了")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/d6c9c0e5c7654925b6dfd0368030392d.png?",alt:"请添加图片描述"}})]),t._v(" "),e("p",[e("strong",[t._v("TCP的三次握手流程如下")])]),t._v(" "),e("ol",[e("li",[t._v("启动服务端，然后服务端主动监听某个端口，处于LISTEN（监听）状态")]),t._v(" "),e("li",[t._v("第一次握手，客户端向服务端发送请求连接包文，报文首部SYN标志位为1，同时设置序列号seq=x（随机数）；发出后，客户端进入SYN_SENT（SYN报文不携带数据）")]),t._v(" "),e("li",[t._v("第二次握手，服务端收到客户端的请求后，需要进行确认，将响应报文中ACK标志位设置为1，将确认号ack设置为第一步请求序列号seq+1(ack=x+1)，将SYN标志位设置为1，即SYN+ACK包，包序号seq=y，服务端进入SYN_RCVD状态")]),t._v(" "),e("li",[t._v("第三次握手，客户端收到来自服务端的SYN+ACK包，发送一个ACK确认包，ACK=1，seq=x+1（第一步的序号x递增），ack=y+1（序号为y及之前的数据已收到，期待收到序号y+1之后的数据）")])]),t._v(" "),e("h3",{attrs:{id:"tcp队列溢出"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#tcp队列溢出"}},[t._v("#")]),t._v(" TCP队列溢出")]),t._v(" "),e("p",[t._v("在三次握手的过程中，有2个重要的队列，"),e("strong",[t._v("syns queue（半连接队列）和accept queue（全连接队列）")])]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/2c920e600a0042e69945f57e54794495.png?",alt:"在这里插入图片描述"}})]),t._v(" "),e("ol",[e("li",[t._v("server端接收syn请求，创建socket存储于syns queue，并向客户端返回syn+ack")]),t._v(" "),e("li",[t._v("server端接收到第三次握手的ack，socket状态更新为ESTABLISHED，同时将socket移动到accept queue，等待应用程序执行accept()")])]),t._v(" "),e("p",[t._v("我们可以通过netstat或者ss命令查看socket信息")]),t._v(" "),e("ol",[e("li",[t._v("当socket处于LISTEN状态时，Send-Q为accept queue的最大长度，Recv-Q为accept queue中等待应用程序accept()的socket数目")]),t._v(" "),e("li",[t._v("当socket处于ESTABLISHED状态时，Send-Q与Recv-Q分别表示socket发送缓冲区与接收缓冲区数据大小")])]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/2e9b8141d9764f4aace3de0704509b1b.png?",alt:"请添加图片描述"}})]),t._v(" "),e("p",[t._v("当我们通过tcp发送数据的时候，数据并不是直接通过网络发送完就完事了，而是先将数据发送到发送缓冲区，然后再发送到对方的接收缓冲区。当相应的数据返回ack后才会从发送缓冲区中删除（这里涉及到滑动窗口协议，有兴趣的小伙伴可以参考一下其他书籍）当发送缓冲区满时，发送端将会阻塞，不能发送数据。如果接收端一直不读取数据，不发送ack，也会导致发送方无法发送数据")]),t._v(" "),e("p",[e("strong",[t._v("所以当请求处理比较慢时，可以看一下Send-Q和Recv-Q是否有大量积压。")])]),t._v(" "),e("p",[e("strong",[t._v("socket处于ESTABLISHED状态")])]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("root@VM-0-14-centos ~"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# ss")]),t._v("\nNetid State      Recv-Q Send-Q                                     Local Address:Port                                                      Peer Address:Port                \nu_str ESTAB      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("                                                      * "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("179546845")]),t._v("                                                            * "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("179546846")]),t._v("            \nu_str ESTAB      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("                                                      * "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("60692020")]),t._v("                                                             * "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("   \n")])])]),e("p",[e("strong",[t._v("socket处于LISTEN状态")])]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("root@VM-0-14-centos ~"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# ss -lnt")]),t._v("\nState       Recv-Q Send-Q                                         Local Address:Port                                                        Peer Address:Port              \nLISTEN      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("50")]),t._v("                                                         *:3306                                                                   *:*                  \nLISTEN      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("      "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("128")]),t._v("                                                        *:80                                                                     *:*   \n")])])]),e("p",[e("strong",[t._v("当我们机器的并发量很高时，accept queue可能会出现不够用的情况，这时就有可能出现类似connection reset 或 connection timeout 异常")]),t._v("，这个取决于机器上"),e("strong",[t._v("tcp_abort_on_overflow")]),t._v("的设置，不同的值服务端有不同的处理策略")]),t._v(" "),e("p",[t._v("tcp_abort_on_overflow为0：全连接队列满时，server端扔掉client发过来的ack，那么client会重新发送ack，直到超时，这时客户端就会看到connection timeout的错误")]),t._v(" "),e("p",[t._v("tcp_abort_on_overflow为1：全连接队列满时，server端发送一个reset包给client，表示连接出现错误，这时客户端就会看到\nconnection reset 的错误")]),t._v(" "),e("p",[e("strong",[t._v("查看服务器处理accept queue队列满时的处理机制")])]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("root@VM-0-14-centos ~"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# cat /proc/sys/net/ipv4/tcp_abort_on_overflow")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("\n")])])]),e("p",[e("strong",[t._v("如何设置sync queue和accept queue的大小")])]),t._v(" "),e("p",[t._v("sync queue 队列长度由 /proc/sys/net/ipv4/tcp_max_syn_backlog 指定")]),t._v(" "),e("p",[t._v("accept queue 队列长度 为 min(somaxconn, backlog)")]),t._v(" "),e("p",[t._v("somaxconn 的值可以在配置文件/proc/sys/net/core/somaxconn中直接修改\nbacklog 的值是在创建socket时传入的")]),t._v(" "),e("div",{staticClass:"language-java extra-class"},[e("pre",{pre:!0,attrs:{class:"language-java"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 在java中的设置方式如下")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("ServerSocket")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" port"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" backlog"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])])]),e("p",[e("strong",[t._v("如何查看queue的溢出情况？")])]),t._v(" "),e("p",[t._v("查看syns queue溢出")]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("root@VM-0-14-centos ~"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# netstat -s | grep LISTEN")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("190")]),t._v(" SYNs to LISTEN sockets dropped\n")])])]),e("p",[t._v("查看accept queue溢出")]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("root@VM-0-14-centos ~"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# netstat -s | grep TCPBacklogDrop")]),t._v("\n    TCPBacklogDrop: "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("23")]),t._v("\n")])])]),e("h3",{attrs:{id:"rst异常"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#rst异常"}},[t._v("#")]),t._v(" RST异常")]),t._v(" "),e("p",[e("strong",[t._v("TCP断开连接的方式有两种")])]),t._v(" "),e("ol",[e("li",[t._v("连接正常关闭时双方会发送FIN，然后经历四次挥手的过程")]),t._v(" "),e("li",[t._v("通过RST包异常退出，不会对RST响应ACK")])]),t._v(" "),e("p",[t._v("当收到RST包时，表示连接异常关闭，应用中可能会报大量的connection reset / connection reset by peer错误。\n"),e("strong",[t._v("当在一个已经关闭的连接上读操作时，会报connection reset。当在一个已关闭的连接上写操作时，会报 connection reset by peer")])]),t._v(" "),e("p",[e("strong",[t._v("那么什么时候会发送RST包呢？")])]),t._v(" "),e("ol",[e("li",[t._v("端口不存在，向不存在的端口发送syn请求时，服务端发现这个端口不存在则直接发送一个RST包")]),t._v(" "),e("li",[t._v("服务端或客户端发生异常（比如程序奔溃了，上面提到的TCP队列溢出），向对端发送RST包，告知另一方连接关闭")]),t._v(" "),e("li",[t._v("新接收到的tcp报文不在已知的连接中。比如一方网络太差，tcp报文没有到达。此时另一端关闭了连接，然后收到了这个迟迟没有到达的报文，但由于对应的tcp连接已经不存在，就会直接发送一个RST包")]),t._v(" "),e("li",[t._v("一方长期未收到另一方的确认报文，在一定时间或重传次数后发出RST报文")])]),t._v(" "),e("h3",{attrs:{id:"四次挥手"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#四次挥手"}},[t._v("#")]),t._v(" 四次挥手")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/e8e60504ac4742a8ad8d8a0eb6d90f55.png?",alt:"请添加图片描述"}})]),t._v(" "),e("ol",[e("li",[t._v("客户端发送FIN释放连接报文，表示结束连接，seq=u，此时客户端进入FIN_WAIT_1状态")]),t._v(" "),e("li",[t._v("服务端收到释放连接报文，发出确认报文ACK=1,ack=u+1，seq=v，此时服务端进入CLOSE_WAIT状态，客户端向服务端方向发送的通道关闭了，但是此时服务端若发送数据，客户端依然要接收")]),t._v(" "),e("li",[t._v("客户端收到服务端的确认请求后，客户端进入FIN_WAIT_2状态，等待服务端发送连接释放报文")]),t._v(" "),e("li",[t._v("服务端发完最后的数据，向客户端发送FIN连接释放报文，此时序列号seq=u（有可能中间发送了一部分数据)，ack和回复ACK报文一致，即ack=u+1，此时服务端进入LAST_ACK状态")]),t._v(" "),e("li",[t._v("客户端收到服务端的连接释放报文后，发出确认报文ACK=1，ack=w+1，seq=u+1，此时客户端进入TIME_WAIT状态。此时tcp连接还没有释放，必须经过2个MSL（最长报文段寿命）的时间后，当客户端撤销相应的TCB后，才进入CLOSED状态")]),t._v(" "),e("li",[t._v("服务端只要收到客户端发出的确认，立即进入CLOSED状态，同样，撤销TCB后，就结束了这次的TCP连接。")])]),t._v(" "),e("p",[e("strong",[t._v("为什么有一个TIME_WAIT（时间等待状态）？")])]),t._v(" "),e("p",[t._v("当客户端在FIN_WAIT_2阶段发送ack丢失后，服务端在LAST_ACK阶段会不断重试，导致连接不能正常关闭。如果此时客户端已经关闭则会导致服务端不能正常关闭。如果有一个TIME_WAIT阶段，则可以使本次连接持续时间内所产生的所有报文段从网络中消失")]),t._v(" "),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/34b987920b1a42169c9655f52843e7cb.png?",alt:"在这里插入图片描述"}})]),t._v(" "),e("h3",{attrs:{id:"time-wait和close-wait"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#time-wait和close-wait"}},[t._v("#")]),t._v(" TIME_WAIT和CLOSE_WAIT")]),t._v(" "),e("p",[t._v("我们经常使用如下命令来查看服务器的连接状态")]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("netstat")]),t._v(" -n "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("awk")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'/^tcp/ {++S[$NF]} END {for(a in S) print a, S[a]}'")]),t._v("\n")])])]),e("p",[t._v("它会显示如下信息")]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[t._v("TIME_WAIT "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("689")]),t._v("\nCLOSE_WAIT "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),t._v("\nFIN_WAIT1 "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\nESTABLISHED "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("291")]),t._v("\nSYN_RECV "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),t._v("\nLAST_ACK "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\n")])])]),e("p",[e("img",{attrs:{src:"https://img-blog.csdnimg.cn/bf0180b4d57447db8a0927c55d3c102a.png?",alt:"在这里插入图片描述"}})]),t._v(" "),e("p",[t._v("常用的三个状态是：ESTABLISHED表示正在通信 、TIME_WAIT表示主动关闭、CLOSE_WAIT表示被动关闭")]),t._v(" "),e("p",[e("strong",[t._v("当服务器保持了大量的TIME_WAIT和CLOSE_WAIT状态的连接，就需要格外注意一下，主动关闭的一方会经过TIME_WAIT阶段，被动关闭的一方会经过CLOSE_WAIT阶段")])]),t._v(" "),e("p",[t._v("因为在Linux中进程每打开一个文件（linux下一切皆文件，包括socket），都会消耗一点的内存资源，所以Linux在多个位置都限制了可打开文件描述符的数量，包括系统级，用户级，进程级。")]),t._v(" "),e("p",[t._v("系统级：当前系统可打开的最大数量，通过fs.file-max参数可修改\n用户级：指定用户可打开的最大数量，修改/etc/security/limits.conf\n进程级：单个进程可打开的最大数量，通过fs.nr_open参数可修改")]),t._v(" "),e("p",[e("strong",[t._v("一旦文件描述符达到上限，新的请求就无法被处理了，接着就是大量Too Many Open Files异常")])]),t._v(" "),e("p",[e("strong",[t._v("TIME_WAIT")])]),t._v(" "),e("p",[t._v("前面已经提到过，TIME_WAIT一方面是为了丢失的包被后面的连接复用，二是为了在2MSL的时间范围内正常关闭连接，TIME_WAIT的存在会大大减少RST包的出现。")]),t._v(" "),e("p",[t._v("当出现大量TIME_WAIT状态的连接时（一般情况下也比较高，因为有一个2MSL时长），解决思路也很简单，就是让服务器能够快速回收和重用那些TIME_WAIT的资源。我们可以修改一下服务端的内核参数")]),t._v(" "),e("div",{staticClass:"language-shell extra-class"},[e("pre",{pre:!0,attrs:{class:"language-shell"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("#表示开启重用。允许将TIME-WAIT sockets重新用于新的TCP连接，默认为0，表示关闭")]),t._v("\nnet.ipv4.tcp_tw_reuse "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("#表示开启TCP连接中TIME-WAIT sockets的快速回收，默认为0，表示关闭")]),t._v("\nnet.ipv4.tcp_tw_recycle "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\n")])])]),e("p",[e("strong",[t._v("CLOSE_WAIT")])]),t._v(" "),e("p",[t._v("当CLOSE_WAIT状态的连接很多时，说明没有在ACK后再次发起FIN报文，这种情况往往是由于应用程序写的有问题，如短连接模式，忘记close连接，就不会发出FIN包")]),t._v(" "),e("h3",{attrs:{id:"三次握手后连接已经建立-但是客户端突然奔溃了怎么办"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#三次握手后连接已经建立-但是客户端突然奔溃了怎么办"}},[t._v("#")]),t._v(" 三次握手后连接已经建立，但是客户端突然奔溃了怎么办？")]),t._v(" "),e("p",[t._v("首先，从协议设计角度来讲，客户端如果出现故障，服务端肯定不能一直死等客户端，所以考虑这种情况的存在，TCP 协议中服务端有个计时器，每次收到客户端的响应报文都会重置这个计时器，服务端有个超时时间，通常是2个小时，2个小时没收到客户端的数据，服务端会每隔75秒发送探测报文段，连续10次探测报文没响应，认为客户端出现问题，服务器会关闭这个连接。一般程序设计者不会依赖这个机制，2个小时实在太长，框架里面都会自己做连接的检查，无效连接的关闭。")]),t._v(" "),e("p",[t._v("当你使用Netty的时候，可以使用IdleStateHandler来定义心跳策略，设置读超时时间和写超时时间，当相应的时间到了还没收到消息，则会触发相应事件，此时你就可以选择关闭这个连接等策略")])])}),[],!1,null,null,null);s.default=n.exports}}]);