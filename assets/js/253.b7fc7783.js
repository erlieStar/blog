(window.webpackJsonp=window.webpackJsonp||[]).push([[253],{652:function(t,s,a){"use strict";a.r(s);var e=a(56),n=Object(e.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"手写rpc框架-如何手写一个rpc框架"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#手写rpc框架-如何手写一个rpc框架"}},[t._v("#")]),t._v(" 手写RPC框架：如何手写一个RPC框架？")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/2020103018110044.jpg?",alt:"在这里插入图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"介绍"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#介绍"}},[t._v("#")]),t._v(" 介绍")]),t._v(" "),a("p",[t._v("当开发一个单体项目的时候，大家肯定都写过类似的代码。即服务提供方和服务调用方在一个服务中")]),t._v(" "),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("interface")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("HelloService")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("sayHello")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" content"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("HelloServiceImpl")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("implements")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("HelloService")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token annotation punctuation"}},[t._v("@Override")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("sayHello")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" content"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"hello, "')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("+")]),t._v(" content"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Test")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("main")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),t._v(" args"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("HelloService")]),t._v(" helloService "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("HelloServiceImpl")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" msg "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" helloService"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("sayHello")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"world"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// hello world")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("System")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("out"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("println")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("msg"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("p",[t._v("但是由于单体服务的诸多弊端，现在很多公司已经将不相关的功能拆分到不同的服务中。")]),t._v(" "),a("p",[t._v("如何像调用本地服务一样调用远程服务呢？这时就不得不提RPC框架了（Remote Procedure Call，远程过程调用）。他帮我们屏蔽了网络通信，序列化等操作的实现，真正做到了调用远程服务和调用本地服务一样方便。")]),t._v(" "),a("p",[t._v("知名的RPC框架有Spring Cloud，阿里巴巴的Dubbo，Facebook的Thrift，Google grpc等")]),t._v(" "),a("h2",{attrs:{id:"rpc的调用过程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#rpc的调用过程"}},[t._v("#")]),t._v(" RPC的调用过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20201029221811338.png?",alt:"在这里插入图片描述"}}),t._v("\n一个RPC调用的过程如下")]),t._v(" "),a("ol",[a("li",[t._v("调用方发送请求后由代理类将调用的方法，参数组装成能进行网络传输的消息体")]),t._v(" "),a("li",[t._v("调用方将消息体发送到提供方")]),t._v(" "),a("li",[t._v("提供方将消息进行解码，得到调用的参数")]),t._v(" "),a("li",[t._v("提供方反射执行相应的方法，并将结果返回")])]),t._v(" "),a("p",[t._v("下面我们就分析一下rpc框架是怎么实现的？有哪些地方可以扩展。\n为了让大家有一个更形象的认识，我写了一个github项目，由简到难实现了一个rpc框架，欢迎star")]),t._v(" "),a("p",[t._v("https://github.com/erlieStar/simple-rpc")]),t._v(" "),a("h2",{attrs:{id:"生成代理类"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#生成代理类"}},[t._v("#")]),t._v(" 生成代理类")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210617201331983.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("前面我们说过，调用方执行方法后，实际上执行的是代理类的方法，代理类帮我们进行序列化和编解码操作。那么如何生成代理类呢？")]),t._v(" "),a("p",[t._v("我们看一下主流的做法。")]),t._v(" "),a("p",[t._v("Facebook的Thrift和Google的grpc都是定义一个schema文件，然后执行程序，帮你生成客户端代理类，以及接口。调用方直接用生成的代理类来请求，提供方继承生成的接口即可。")]),t._v(" "),a("p",[a("strong",[t._v("这种方式最大的优点就是能进行多语言通信")]),t._v("，即一份schema文件可以生成Java程序，也可以生成Python程序。调用方是Java程序，提供方是Python程序都能正常进行通讯。"),a("strong",[t._v("而且是二进制协议，通讯效率比较高")]),t._v("。")]),t._v(" "),a("p",[t._v("在Java中生成代理类的方式有如下几种")]),t._v(" "),a("ol",[a("li",[t._v("JDK动态代理（实现InvocationHandler接口）")]),t._v(" "),a("li",[t._v("字节码操作类库（如cglib，Javassist）")])]),t._v(" "),a("p",[t._v("在Dubbo中提供了2种生成代理类的方式，jdk动态代理和Javassist，默认是javassist，"),a("strong",[t._v("至于原因吗？当然是javassist的效率更高")])]),t._v(" "),a("h2",{attrs:{id:"协议"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#协议"}},[t._v("#")]),t._v(" 协议")]),t._v(" "),a("p",[t._v("为什么需要协议这个东西呢？Spring Cloud是通过Http协议来进行通讯的，那么Dubbo是通过哪种协议来进行通讯的？")]),t._v(" "),a("p",[a("strong",[t._v("为什么需要协议这个东西？")])]),t._v(" "),a("p",[t._v("因为数据是以二进制的形式在网络中传输中，RPC的请求数据并不是以一个整体发送到提供方的，而是可能被拆分成多个数据包发送出去，那提供方怎么识别数据呢？")]),t._v(" "),a("p",[t._v("例如一个文本ABCDEF，提供方有可能依次收到的数据为ABC DEF，也有可能为AB CD EF。提供方该怎么处理这些数据呢？")]),t._v(" "),a("p",[t._v("简单啊，定个规则就可以了。这个规则可以有很多种，这里举3个例子")]),t._v(" "),a("ol",[a("li",[a("strong",[t._v("定长协议")]),t._v("，协议内容长度固定，如读取到50个byte就开始decode操作，可以参考Netty的FixedLengthFrameDecoder")]),t._v(" "),a("li",[a("strong",[t._v("特殊结束符")]),t._v("，定义一个消息结束的分隔符，如读到\\n，表示一个数据读取完毕了，没有读到就一直读，可以参考Netty的DelimiterBasedFrameDecoder")]),t._v(" "),a("li",[a("strong",[t._v("变长协议（协议头+协议体）")]),t._v("，用一个定长来表示消息体的长度，剩下的内容为消息体，如果你愿意的话，协议头还会放一些常用的属性，Http协议的Header就是协议头，如content-type，content-length等。可以参考Netty的DelimiterBasedFrameDecoder")])]),t._v(" "),a("p",[a("strong",[t._v("Dubbo通过自定义协议来进行通讯")]),t._v("（是一种变长协议，即协议头+协议体）\n"),a("img",{attrs:{src:"https://img-blog.csdnimg.cn/202010301346551.jpg?",alt:"在这里插入图片描述"}}),t._v("\n每个位代表的含义如下\n"),a("img",{attrs:{src:"https://img-blog.csdnimg.cn/202010301351057.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("Dubbo为什么要自定义协议，而不用现成的Http协议？")])]),t._v(" "),a("p",[a("strong",[t._v("最主要的原因就是自定义协议可以提高性能")])]),t._v(" "),a("ol",[a("li",[t._v("Http协议的请求包比较大，有很多无用的内容。自定义协议可以精简很多内容")]),t._v(" "),a("li",[t._v("Http协议是无状态的，每次都要重新建立连接，响应完毕后将连接关闭")])]),t._v(" "),a("h3",{attrs:{id:"如何自定义协议"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何自定义协议"}},[t._v("#")]),t._v(" 如何自定义协议？")]),t._v(" "),a("h2",{attrs:{id:"序列化"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#序列化"}},[t._v("#")]),t._v(" 序列化")]),t._v(" "),a("p",[t._v("协议头的内容是通过位来表示的，协议体在应用程序中则会被封装成对象，如Dubbo将请求封装成Request，将响应封装成Response")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20201030095049568.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("前面我们说过网络传输的数据必须是二进制数据，但调用方的入参和提供方的返回值都是对象，因此需要序列化和反序列化的过程")]),t._v(" "),a("p",[t._v("序列化的方式有如下几种")]),t._v(" "),a("ol",[a("li",[t._v("JDK原生序列化")]),t._v(" "),a("li",[t._v("JSON")]),t._v(" "),a("li",[t._v("Protobuf")]),t._v(" "),a("li",[t._v("Kryo")]),t._v(" "),a("li",[t._v("Hessian2")]),t._v(" "),a("li",[t._v("MessagePack")])]),t._v(" "),a("p",[t._v("我们选择序列化的方式时，主要考虑如下几个因素")]),t._v(" "),a("ol",[a("li",[t._v("效率")]),t._v(" "),a("li",[t._v("空间开销")]),t._v(" "),a("li",[t._v("通用性和兼容性")]),t._v(" "),a("li",[t._v("安全性")])]),t._v(" "),a("h2",{attrs:{id:"通讯"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#通讯"}},[t._v("#")]),t._v(" 通讯")]),t._v(" "),a("p",[t._v("常见的IO模型有如下四种")]),t._v(" "),a("ol",[a("li",[t._v("同步阻塞IO（Blocking IO）")]),t._v(" "),a("li",[t._v("同步非阻塞IO（Non-blocking IO）")]),t._v(" "),a("li",[t._v("IO多路复用（IO Multiplexing）")]),t._v(" "),a("li",[t._v("异步IO（Asynchronous IO）")])]),t._v(" "),a("p",[t._v("这4种IO模型我就不分别阐述了，看如下这篇文章")]),t._v(" "),a("p",[a("a",{attrs:{href:"https://blog.csdn.net/zzti_erlie/article/details/109302172",target:"_blank",rel:"noopener noreferrer"}},[t._v("10分钟看懂， Java NIO 底层原理"),a("OutboundLink")],1)]),t._v(" "),a("p",[t._v("因为RPC一般用在高并发的场景下，因此我们选择IO多路复用这种模型，Netty的IO多路复用基于Reactor开发模式来实现，后续的文章我会分析一下这种开发模式是如何支持高并发的")]),t._v(" "),a("h2",{attrs:{id:"注册中心"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#注册中心"}},[t._v("#")]),t._v(" 注册中心")]),t._v(" "),a("p",[a("strong",[t._v("注册中心的作用和电话簿类似")]),t._v("。保存了服务名称和具体的服务地址之间的映射关系，当我们想和某个服务进行通信时，只需要根据服务名就能查到服务的地址。")]),t._v(" "),a("p",[a("strong",[t._v("更重要的是这个电话簿是动态的")]),t._v("，当某个服务的地址改变时，电话簿上的地址就会改变，当某个服务不可用时，电话簿上的地址就会消失")]),t._v(" "),a("p",[t._v("这个动态的电话簿就是注册中心。")]),t._v(" "),a("p",[t._v("注册中心的实现方式有很多种，Zookeeper，Redis，Nocas等都可以实现")]),t._v(" "),a("p",[t._v("介绍一下用Zookeeper实现注册中心的方式")]),t._v(" "),a("p",[t._v("zookeeper有两种类型的节点，"),a("strong",[t._v("持久节点和临时节点")])]),t._v(" "),a("p",[a("strong",[t._v("当我们往zookeeper上注册服务的时候，用的是临时节点")]),t._v("，这样当服务断开时，节点能被删除")]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("节点类型")]),t._v(" "),a("th",[t._v("解释")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("持久节点")]),t._v(" "),a("td",[t._v("将节点创建为持久节点，数据会一直存储在zookeeper服务器上，即使创建该节点的客户端与服务端的会话关闭了，该节点依然不会被删除")])]),t._v(" "),a("tr",[a("td",[t._v("持久顺序节点")]),t._v(" "),a("td",[t._v("在持久节点的基础上增加了节点有序的特性")])]),t._v(" "),a("tr",[a("td",[t._v("临时节点")]),t._v(" "),a("td",[t._v("将节点创建为临时节点，数据不会一直存储在zookeeper服务器上，当创建该临时节点的客户端会话关闭时，该节点在相应的zookeeper服务器上被删除")])]),t._v(" "),a("tr",[a("td",[t._v("临时顺序节点")]),t._v(" "),a("td",[t._v("在临时节点的基础上增加了节点有序的特性")])])])]),t._v(" "),a("p",[a("strong",[t._v("注册中心全部挂掉该怎么通信？")])]),t._v(" "),a("p",[t._v("当一台zookeeper挂掉后，会自动切换到另一个zookeeper。全部挂掉也没有关系，因为dubbo把映射关系保存了一份在本地，这个映射关系可以保存在Map中，也可以保存在文件中")]),t._v(" "),a("p",[a("strong",[t._v("新的服务注册到注册中心，本地缓存会更新吗？")])]),t._v(" "),a("p",[t._v("注册了监听的话，当然会更新啊。当被监听的节点或者子节点发生变化的时候，会将相应的内容推送给监听的客户端，你就可以更新本地的缓存了")]),t._v(" "),a("p",[t._v("Zookeeper中的事件如下\n"),a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20201030180243247.jpeg?",alt:"在这里插入图片描述"}}),t._v(" "),a("strong",[t._v("你可以把这个监听理解为分布式的观察者模式")])]),t._v(" "),a("h2",{attrs:{id:"负载均衡策略"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#负载均衡策略"}},[t._v("#")]),t._v(" 负载均衡策略")]),t._v(" "),a("p",[t._v("对于同一个服务我们不可能只部署一个节点，每次调用的时候我们需要选一个节点来发起调用，这就涉及到负载均衡策略了")]),t._v(" "),a("p",[t._v("常见的负载均衡策略如下：")]),t._v(" "),a("ol",[a("li",[t._v("随机")]),t._v(" "),a("li",[t._v("轮询")]),t._v(" "),a("li",[t._v("一致性hash")])]),t._v(" "),a("h2",{attrs:{id:"小结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#小结"}},[t._v("#")]),t._v(" 小结")]),t._v(" "),a("p",[t._v("当然一个成熟的RPC框架还得考虑很多内容，例如路由策略，异常重试，监控，异步调用等，和主流程相关度不大，就不多做介绍了")])])}),[],!1,null,null,null);s.default=n.exports}}]);