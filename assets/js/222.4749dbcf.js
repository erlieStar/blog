(window.webpackJsonp=window.webpackJsonp||[]).push([[222],{620:function(t,s,a){"use strict";a.r(s);var n=a(56),_=Object(n.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"redis实战-redis数据结构为什么既省内存又高效"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#redis实战-redis数据结构为什么既省内存又高效"}},[t._v("#")]),t._v(" Redis实战：Redis数据结构为什么既省内存又高效？")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/53f4a45050f3438f8c18ff0072c17e93.png",alt:"请添加图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"底层存储"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#底层存储"}},[t._v("#")]),t._v(" 底层存储")]),t._v(" "),a("p",[t._v("当其他人问你Redis是如何用单线程来实现每秒10w+的QPS，你会如何回答呢？")]),t._v(" "),a("ol",[a("li",[t._v("使用IO多路复用")]),t._v(" "),a("li",[t._v("非CPU密集型任务")]),t._v(" "),a("li",[t._v("纯内存操作")]),t._v(" "),a("li",[t._v("巧妙的数据结构")])]),t._v(" "),a("p",[t._v("我们今天就来盘盘Redis数据结构到底有多巧妙！")]),t._v(" "),a("p",[a("strong",[t._v("Redis所有的数据结构都是在内存占用和执行效率之间找一个比较好的均衡点，不一味的节省内存，也不一味的提高执行效率")])]),t._v(" "),a("p",[t._v("Redis底层就是一个大map，key是字符串，value可能是字符串，哈希，列表等。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/7055107c22ad4fe1a989749b918d482e.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("如何记录这个value的类型呢？我们定义一个类用一个type字段表示类型的种类不就行了？")]),t._v(" "),a("p",[t._v("在Redis中这个对象就是redisObject（在C语言中对象叫结构体哈）")]),t._v(" "),a("p",[a("strong",[t._v("Redis中的每个对象底层的数据结构都是redisObject结构体")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/abec9577035146638e2045bb0b35c480.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("可以看到除了type属性外，还有其他属性，那么其他属性有什么作用呢？")]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("属性")]),t._v(" "),a("th",[t._v("作用")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("type")]),t._v(" "),a("td",[t._v("记录redis的对象类型")])]),t._v(" "),a("tr",[a("td",[t._v("encoding")]),t._v(" "),a("td",[t._v("记录底层编码，即使用哪种数据结构保存数据")])]),t._v(" "),a("tr",[a("td",[t._v("lru")]),t._v(" "),a("td",[t._v("和缓存淘汰相关")])]),t._v(" "),a("tr",[a("td",[t._v("refcount")]),t._v(" "),a("td",[t._v("对象被引用的次数")])]),t._v(" "),a("tr",[a("td",[t._v("ptr")]),t._v(" "),a("td",[t._v("指向底层数据结构的指针")])])])]),t._v(" "),a("p",[a("strong",[t._v("type：对应于type命令，记录redis的对象类型")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/f293290dafeb4b8ca082b5ae8e5dbe5e.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" setbit login "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("type")]),t._v(" login\nstring\n\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("set")]),t._v(" cache a\nOK\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("type")]),t._v(" cache\nstring\n\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" xadd mystream * msg1 value1 msg2 value2\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1643183760501")]),t._v("-0\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("type")]),t._v(" mystream\nstream\n\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" rpush numbers "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("3")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("3")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("type")]),t._v(" numbers\nlist\n")])])]),a("p",[a("strong",[t._v("encoding：对应于object encoding命令，记录了对象使用的底层数据结构。不同的场景同一个对象可能使用不同的底层编码")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/a4b248fe9a7244c6aa351263e24389bc.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("来看一下上面对象的编码")]),t._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" object encoding numbers\nquicklist\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" object encoding cache\nembstr\n"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" object encoding login\nraw\n")])])]),a("p",[a("strong",[t._v("每种对象类型，有可能使用了多种编码类型，具体的对应关系如下")])]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("对象类型")]),t._v(" "),a("th",[t._v("编码类型")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("string")]),t._v(" "),a("td",[t._v("raw int embstr")])]),t._v(" "),a("tr",[a("td",[t._v("list")]),t._v(" "),a("td",[t._v("quicklist")])]),t._v(" "),a("tr",[a("td",[t._v("hash")]),t._v(" "),a("td",[t._v("dict ziplist")])]),t._v(" "),a("tr",[a("td",[t._v("set")]),t._v(" "),a("td",[t._v("intset dict")])]),t._v(" "),a("tr",[a("td",[t._v("zset")]),t._v(" "),a("td",[t._v("ziplist skiplist+dict")])])])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/7c0754b8308e42589846a887902b63cb.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("这个图在后面的内容中，会多次出现为的就是加深大家的记忆")]),t._v(" "),a("p",[a("strong",[t._v("Redis并没有为每种对象类型固定一种编码实现，而是在不同场景下使用不同的编码，在内存占用和执行效率之间做一个比较好的均衡")])]),t._v(" "),a("p",[t._v("ptr：指向底层数据结构实现的指针，这些数据结构由对象的encoding属性决定")]),t._v(" "),a("p",[t._v("当我们在Redis中创建一个键值对时，至少会创建2个对象。一个对象用于键值对中的键（键对象），一个对象用于键值对中的值（值对象）")]),t._v(" "),a("p",[t._v("当执行如下命令时，msg为一个对象，hello world为一个对象")]),t._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[a("span",{pre:!0,attrs:{class:"token number"}},[t._v("127.0")]),t._v(".0.1:637"),a("span",{pre:!0,attrs:{class:"token operator"}},[a("span",{pre:!0,attrs:{class:"token file-descriptor important"}},[t._v("9")]),t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[t._v("set")]),t._v(" msg "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"hello world"')]),t._v("\nOK\n")])])]),a("p",[t._v("接着我们来看每种数据类型的底层数据结构")]),t._v(" "),a("h2",{attrs:{id:"string"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#string"}},[t._v("#")]),t._v(" string")]),t._v(" "),a("h3",{attrs:{id:"_3-0版本及以前"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-0版本及以前"}},[t._v("#")]),t._v(" 3.0版本及以前")]),t._v(" "),a("p",[t._v("首先总结了一下Redis中出现的数据类型，及其占用的字节数，便于我们后面分析")]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("类型")]),t._v(" "),a("th",[t._v("占用字节数")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("uint8_t")]),t._v(" "),a("td",[t._v("1")])]),t._v(" "),a("tr",[a("td",[t._v("uint16_t")]),t._v(" "),a("td",[t._v("2")])]),t._v(" "),a("tr",[a("td",[t._v("uint32_t")]),t._v(" "),a("td",[t._v("4")])]),t._v(" "),a("tr",[a("td",[t._v("uint64_t")]),t._v(" "),a("td",[t._v("8")])]),t._v(" "),a("tr",[a("td",[t._v("unsigned char")]),t._v(" "),a("td",[t._v("1")])]),t._v(" "),a("tr",[a("td",[t._v("char")]),t._v(" "),a("td",[t._v("1")])]),t._v(" "),a("tr",[a("td",[t._v("unsigned int")]),t._v(" "),a("td",[t._v("4")])])])]),t._v(" "),a("p",[t._v("是不是发现自己不认识uint8_t，uint16_t等，这是个什么类型？学c语言的时候没学过啊。")]),t._v(" "),a("p",[t._v("发现不认识的数据类型，一猜就是用typedef重命名了，全局搜一下，果然是")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/f20764fd221c466babc5ed377211aa14.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("在Redis3.0版本及以前字符串的数据结构如下所示")]),t._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("sdshdr")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// buf数组中已使用字符的数量")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" len"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// buf数组中未使用字符的数量")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" free"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 字符数组，用来保存字符串")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" buf"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/07af4f7278244f3fadf1dba0b54a368f.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("free：free为0，表示未使用的空间\nlen：这个sds保存了5字节长的字符串\nbuf：char类型的数组，前5个字节是字符串，后一个字节是\\0，表示结尾，\\0不计入总长度")]),t._v(" "),a("p",[t._v("当要存的字符串变大或者变小的时候，会造成频繁的内存分配，进而影响性能。所以Redis通过"),a("strong",[t._v("空间预分配")]),t._v("和"),a("strong",[t._v("惰性空间释放")]),t._v("策略来避免内存的频繁分配")]),t._v(" "),a("p",[a("strong",[t._v("空间预分配")])]),t._v(" "),a("p",[t._v("当sds的内容变大时，程序不仅会为sds分配修改所需要的空间，还会为sds分配额外的未使用的空间。就是多分配一点，省得一会又分配")]),t._v(" "),a("p",[a("strong",[t._v("惰性空间释放")])]),t._v(" "),a("p",[t._v("当sds内容变小时，程序并不会释放缩短后剩余的空间，只是修改free属性，将未使用字符数量记录下来，等以后使用")]),t._v(" "),a("p",[t._v("目前看起来使用效率已经很高了，但是变态的redis还是进行了优化。"),a("strong",[t._v("能用位存储变量的值绝不用基本数据类型，能用字节数少的基本数据类型，绝不用字节数多的数据类型")])]),t._v(" "),a("h3",{attrs:{id:"_3-0版本以后"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-0版本以后"}},[t._v("#")]),t._v(" 3.0版本以后")]),t._v(" "),a("p",[t._v("如果让你优化上述的结构，你会如何优化呢？")]),t._v(" "),a("p",[t._v("当字符串很小的时候，我们还得额外的使用8个字节（len和free各占4个字节），感觉有点太浪费了。"),a("strong",[t._v("元数据比实际要存储的数据都大")])]),t._v(" "),a("p",[t._v("我们是否可以根据字符串的长度，来决定len和free占用的字节数呢？比如短字符串len和free的长度为1字节就够了。长字符串，用2字节或4字节，更长的字符串，用8字节。于是提供了5种类型的sds")]),t._v(" "),a("p",[a("strong",[t._v("就是根据字符的长度决定属性值用哪种数据类型")])]),t._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("__attribute__")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("__packed__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("sdshdr5")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" flags"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* 3 lsb of type, and 5 msb of string length */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" buf"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("__attribute__")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("__packed__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("sdshdr8")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint8_t")]),t._v(" len"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* used */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint8_t")]),t._v(" alloc"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* excluding the header and null terminator */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" flags"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* 3 lsb of type, 5 unused bits */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" buf"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("__attribute__")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("__packed__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("sdshdr16")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint16_t")]),t._v(" len"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* used */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint16_t")]),t._v(" alloc"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* excluding the header and null terminator */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" flags"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("/* 3 lsb of type, 5 unused bits */")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("char")]),t._v(" buf"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[t._v("根据字符串的长度还使用不同的数据结构来存储，如果标识不同的数据结构呢？就来加一个flags字段把。其他的属性和之前版本的类似")]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("属性")]),t._v(" "),a("th",[t._v("作用")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("len")]),t._v(" "),a("td",[t._v("字符串长度")])]),t._v(" "),a("tr",[a("td",[t._v("alloc")]),t._v(" "),a("td",[t._v("分配的空间长度，可以通过alloc-len计算出剩余空间的大小")])]),t._v(" "),a("tr",[a("td",[t._v("flags")]),t._v(" "),a("td",[t._v("标识类型")])]),t._v(" "),a("tr",[a("td",[t._v("buf")]),t._v(" "),a("td",[t._v("字符数组")])])])]),t._v(" "),a("p",[a("strong",[t._v("sdshdr8和sdshdr16属性看着还比较正常，sdshdr5怎么少了len和alloc这2个属性了？")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/d4c8ba4821f14de3a398e46d5b1b2813.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("在sdshdr5中将类型放到了flags的前3个字节中（3个字节能保存6种类型，所以3个字节足够了），后5个字节用来保存字符的长度。因为sdshdr5取消了alloc字段，因此也不会进行空间预分配")])]),t._v(" "),a("p",[t._v("这还不够，sds在减少内存分配，减少内存碎片的目标上还做了其他努力，当字符串是long类型的整数时，直接用整数来保存这个字符串")]),t._v(" "),a("p",[t._v("当字符串的长度小于等于44字节时，redisObject和sds一起分配内存。当字符串大于44字节时，才对redisObject分配一次内存，对sds分配一次内存")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/6abc7173ae9f43dfb601d6818db07213.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("为什么以44字节为界限？")])]),t._v(" "),a("p",[t._v("redisObject：16个字节\nSDS：sdshdr8（3个字节）+ SDS 字符数组（N字节 + \\0结束符 1个字节）")]),t._v(" "),a("p",[t._v("Redis规定嵌入式字符串最大以64字节存储，所以N=64-16-3-1=44")]),t._v(" "),a("p",[a("strong",[t._v("为什么嵌入式字符串最大以64字节存储？")])]),t._v(" "),a("p",[t._v("因为在x86体系下，一般的缓存行大小是63字节，redis能一次加载完成")]),t._v(" "),a("h2",{attrs:{id:"list"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#list"}},[t._v("#")]),t._v(" list")]),t._v(" "),a("h3",{attrs:{id:"_3-0版本及以前-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-0版本及以前-2"}},[t._v("#")]),t._v(" 3.0版本及以前")]),t._v(" "),a("p",[t._v("在redis 3.0版本及以前，采用压缩链表（ziplist）以及双向链表（linkedlist）作为list的底层实现。当元素少时用ziplist，当元素多时用linkedlist")]),t._v(" "),a("p",[a("strong",[t._v("linkedlist比较好理解，我们来看一下什么是ziplist？")])]),t._v(" "),a("p",[t._v("ziplist并不是一个用结构体定义的数据结构，而是一块连续的内存，在这块内存中按照一定的格式存储值")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/cd4bb671b09b4b6f83d123176fc23c06.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("属性")]),t._v(" "),a("th",[t._v("类型")]),t._v(" "),a("th",[t._v("长度")]),t._v(" "),a("th",[t._v("用途")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("zlbytes")]),t._v(" "),a("td",[t._v("uint32_t")]),t._v(" "),a("td",[t._v("4字节")]),t._v(" "),a("td",[t._v("整个压缩列表占用字节数")])]),t._v(" "),a("tr",[a("td",[t._v("zltail")]),t._v(" "),a("td",[t._v("uint32_t")]),t._v(" "),a("td",[t._v("4字节")]),t._v(" "),a("td",[t._v("最后一个元素距离压缩列表起始位置的偏移量，用于快速定位最后一个元素")])]),t._v(" "),a("tr",[a("td",[t._v("zllen")]),t._v(" "),a("td",[t._v("uint16_t")]),t._v(" "),a("td",[t._v("2字节")]),t._v(" "),a("td",[t._v("压缩列表的节点数量，值小于UINT16_MAX（65535）时，这个属性值就是压缩列表包含节点的数量，值等于UINT16_MAX，节点的数量需要遍历整个压缩列表才能计算得出")])]),t._v(" "),a("tr",[a("td",[t._v("entry")]),t._v(" "),a("td",[t._v("不定")]),t._v(" "),a("td",[t._v("不定")]),t._v(" "),a("td",[t._v("元素内容，可以是字节数组，也可以是整数")])]),t._v(" "),a("tr",[a("td",[t._v("zlend")]),t._v(" "),a("td",[t._v("uint8_t")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("压缩列表结束标志，值恒为0xFF（十进制255）")])])])]),t._v(" "),a("p",[t._v("下图是压缩列表的示意图")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210109205035355.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("zlbytes的值为0x50（十进制80），表示压缩列表的总长度为80字节\nzltail的值为0x3c（十进制60），entry3元素距离列表起始位置的偏移量为60，起始位置的指针加上60就能算出表尾节点entry3的地址\nzllen的值为0x3（十进制3），表示压缩列表包含3个节点")]),t._v(" "),a("p",[t._v("每个元素的存储形式如下图所示")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/f18cdbaf11bf44b6b3c7c4d82ce5ec8f.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("属性")]),t._v(" "),a("th",[t._v("用途")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("previous_entry_length")]),t._v(" "),a("td",[t._v("保存了前一个节点的长度，这样就可以倒着进行遍历")])]),t._v(" "),a("tr",[a("td",[t._v("encoding")]),t._v(" "),a("td",[t._v("标明content存的是字节数组还是整数")])]),t._v(" "),a("tr",[a("td",[t._v("content")]),t._v(" "),a("td",[t._v("保存节点的值，可以是字符串，也可以是整数")])])])]),t._v(" "),a("p",[a("strong",[t._v("当encoding的最高2位为11时，按照整数进行读取，否则按照字节数组进行读取")]),t._v("。按照字节数组读取时，没有长度怎么办？")]),t._v(" "),a("p",[a("strong",[t._v("当按照字节数组进行存储的时候，字节数组的长度放到encoding中的位中了，编码格式如下所示")])]),t._v(" "),a("p",[a("strong",[t._v("字节数组编码")])]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("编码")]),t._v(" "),a("th",[t._v("编码长度")]),t._v(" "),a("th",[t._v("content属性保存的值")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("00xxxxxx")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("长度小于等于63的字节数组（2^6^-1）。前2个位标识类型，后6个字节标识长度")])]),t._v(" "),a("tr",[a("td",[t._v("01xxxxxx xxxxxxxx")]),t._v(" "),a("td",[t._v("2字节")]),t._v(" "),a("td",[t._v("长度小于16383的字节数组（2^14^-1）。前2个位标识类型，后14个字节标识长度")])]),t._v(" "),a("tr",[a("td",[t._v("10xxxxxx aaaaaaaa bbbbbbbb cccccccc dddddddd")]),t._v(" "),a("td",[t._v("5字节")]),t._v(" "),a("td",[t._v("长度小于2^32^-1的字节数组。前2个位标识类型，第一个字节剩下的6个位不使用， 剩下的32个位标识长度")])])])]),t._v(" "),a("p",[a("strong",[t._v("整数编码")])]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("编码")]),t._v(" "),a("th",[t._v("编码长度")]),t._v(" "),a("th",[t._v("content属性保存的值")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("11000000")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("int16_t类型的数")])]),t._v(" "),a("tr",[a("td",[t._v("11010000")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("int32_t类型的数")])]),t._v(" "),a("tr",[a("td",[t._v("11100000")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("int64_t类型的数")])]),t._v(" "),a("tr",[a("td",[t._v("11110000")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("int24类型的数")])]),t._v(" "),a("tr",[a("td",[t._v("11111110")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("int8类型的数")])]),t._v(" "),a("tr",[a("td",[t._v("1111xxxx")]),t._v(" "),a("td",[t._v("1字节")]),t._v(" "),a("td",[t._v("0-12之间的数字，没有content")])])])]),t._v(" "),a("p",[t._v("画图演示一下ziplist增加和删除的过程")]),t._v(" "),a("p",[a("strong",[t._v("增加的过程")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/19034df05fa44685857e91a8b08d973e.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("删除的过程")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/9182a4e3613344ab9111a6814df3db12.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("看着没啥问题，效率也比较高，奈何previous_entry_length是个变长字段")])]),t._v(" "),a("p",[a("strong",[t._v("previous_entry_length以字节为单位，记录了压缩列表中前一个节点的长度，这样主要为了方便倒着遍历。通过zltail属性直接定位压缩列表的最后一个节点，然后通过previous_entry_length定位前一个节点")])]),t._v(" "),a("ol",[a("li",[t._v("如果前一个节点的长度小与254字节，那么previous_entry_length属性的长度为1字节（1个字节可以表示的最大长度为28-1=255，但是255被设置为压缩列表的结束标志了，所以为254）")]),t._v(" "),a("li",[t._v("如果前一个节点的长度大于等于254字节，那么previous_entry_length属性的长度为5字节。属性的第一字节会被设置成0xFE（十进制为254），而之后的四个字节则用于保存前一字节的长度")])]),t._v(" "),a("p",[a("strong",[t._v("由于这个变长字段导致ziplist有可能会发生连锁更新")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/0fb1cd7cc7bc46829f328b4af2f7ea80.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("由于插入了一个字段，却导致了后面的元素都得再重新分配一次内存，看起来对效率影响比较大啊")]),t._v(" "),a("p",[a("strong",[t._v("幸运的是，发生连锁更新的概率还是比较低的，因为压缩列表得有多个连续长度介于250到253的字节，不然下一个字节的previous_entry_length都不用更新")])]),t._v(" "),a("p",[t._v("ziplist虽然节省了内存，但他也引入了如下2个代价")]),t._v(" "),a("ol",[a("li",[t._v("ziplist不能保存太多的元素，不然访问性能会降低")]),t._v(" "),a("li",[t._v("ziplist不能保存太大的元素，不然会导致内存重新分配，甚至可能引发连锁更新")])]),t._v(" "),a("p",[t._v("因此当list中的元素较多时，会用双向链表来存储")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/45d10eaf1ad24c9382f1853ae58a3b2f.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("但是双向链表需要的附加指针太大，比较浪费空间，而且会加重内存的碎片化")]),t._v("，所以在redis3.版本以后直接使用quicklist作为list的底层实现")]),t._v(" "),a("h3",{attrs:{id:"_3-0版本以后-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-0版本以后-2"}},[t._v("#")]),t._v(" 3.0版本以后")]),t._v(" "),a("p",[t._v("quicklist是一个双向链表，链表中每个节点是一个ziplist，好家伙，结合了2个数据结构的优点")]),t._v(" "),a("p",[a("strong",[t._v("假如说一个quicklist包含4个quickListNode，每个节点的ziplist包含3个元素，则这里list中存的值为12个。")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/d68f614438944190968a880fd62f731a.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("quicklist为什么要这样设计呢？大概是基于空间和效率的一个折中")])]),t._v(" "),a("ol",[a("li",[t._v("双向链表方便在表两端执行push和pop操作。但是内存开销比较大，除了要保存数据，还要保存前后节点的指针。并且每个节点是单独的内存块，容易造成内存碎片")]),t._v(" "),a("li",[t._v("ziplist是一块连续的内存，不用前后项指针，节省内存。但是当进行修改操作时，会发生级联更新，降低性能")])]),t._v(" "),a("p",[a("strong",[t._v("于是结合两者优点的quicklist诞生了，但这又会带来新的问题，每个ziplist存多少元素比较合适呢？")])]),t._v(" "),a("ol",[a("li",[t._v("ziplist越短，内存碎片增多，影响存储效率。当一个ziplist只存一个元素时，quicklist又退化成双向链表了")]),t._v(" "),a("li",[t._v("ziplist越长，为ziplist分配大的连续的内存空间难度也就越大，会造成很多小块的内存空间被浪费，当quicklist只有一个节点，元素都存在一个ziplist上时，quicklist又退化成ziplist了")])]),t._v(" "),a("p",[a("strong",[t._v("所以我们可以在redis.conf中通过如下参数list-max-ziplist-size来决定ziplist能存的节点元素")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/d034e4082b294d28b17c85136732aaa6.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"hash"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#hash"}},[t._v("#")]),t._v(" hash")]),t._v(" "),a("p",[a("strong",[t._v("元素比较少时用ziplist来存储，当元素比较多时用hash来存储")])]),t._v(" "),a("p",[a("strong",[t._v("当用ziplist来存储时，数据结构如下")])]),t._v(" "),a("p",[t._v("key值在前，value值在后")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4f23e76e87a643eeaba8605b7f62ffbf.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("当用dict来存储时，数据结构如下")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/e1a3aac6b3154886b0ef1f1f879e6c7d.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("redis中的dict和Java中的HashMap实现差不多，都是数组加链表（只不过redis中的dict用了2个数组，一般情况下也只会用一个，至于原因可以参考其他文章）")]),t._v(" "),a("h2",{attrs:{id:"set"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#set"}},[t._v("#")]),t._v(" set")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/7c0754b8308e42589846a887902b63cb.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("当元素不多，且元素都为整数时，set的底层实现为intset，否则为dict")])]),t._v(" "),a("p",[a("strong",[t._v("intset和ziplist都是一块完整的内存")])]),t._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("typedef")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("intset")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 编码方式")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint32_t")]),t._v(" encoding"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 元素数量")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("uint32_t")]),t._v(" length"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 保存元素的数组")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("int8_t")]),t._v(" contents"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" intset"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[a("strong",[t._v("一看就是老套路哈，用encoding来标识contents数组的数据类型，尽量用占用字节数少的类型")])]),t._v(" "),a("p",[t._v("当encoding为INTSET_ENC_INT16，contents为一个int16_t类型的数组，数组中的每一项都是int16_t类型\n当encoding为INTSET_ENC_INT32，contents为一个int32_t类型的数组，数组中的每一项都是int32_t类型\n当encoding为INTSET_ENC_INT64，contents为一个int64_t类型的数组，数组中的每一项都是int64_t类型")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/0b3a302c46a645a3b492852e477fcd4c.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("需要注意的是放入到contents中的数字是从小到大哈，这样就能通过二分查找提高查询的效率")])]),t._v(" "),a("p",[t._v("当放入的元素超过目前数组元素能表示的最大值，就会进行升级的过程。")]),t._v(" "),a("p",[t._v("假设原来的数组中只有1，3，10这3个数组，此时数据类型为int16_t就可以表示。放入一个新元素65535，int16_t类型表示不了了，所以得用int32_t来表示，数组中的其他元素也要升级为int32_t，下图演示了升级的详细过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/d573f51d401f4e4b9f4388cce15def29.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("ol",[a("li",[t._v("假设原来的数组中只有1，3，10这3个数组，此时数据类型为int16_t就可以表示")]),t._v(" "),a("li",[t._v("放入一个新元素65535，int16_t类型表示不了了，所以得用int32_t来表示，数组中的其他元素也要升级为int32_t")]),t._v(" "),a("li",[t._v("原先数组的大小为3（个数）*2（每个元素占用字节数）=6字节，升级后的数组为4（个数）*4（每个元素占用字节数）=16字节，在元素数组的后面申请10字节的空间")]),t._v(" "),a("li",[t._v("然后将原来数组中的元素从大到小依次移动到扩容后数组正确的位置上。例如原先10的起始位置为2（下标） * 2（大小）=4字节，结束位置为3 * 2=6字节。则现在10的位置为2 （下标）* 4（大小）=8字节，结束位置为3 * 4=12字节")]),t._v(" "),a("li",[t._v("将新添加的元素放到扩容后的数组上")])]),t._v(" "),a("p",[a("strong",[t._v("插入和删除的过程和ziplist类似，不画图了，需要注意intset目前只能升级不能降级")])]),t._v(" "),a("p",[a("strong",[t._v("set底层实现为intset时")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/08100a3ecad14c0090265bfab0b1dc53.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("元素会从小到大来放哈，这样就能用到二分查找，提高查询效率")]),t._v(" "),a("p",[a("strong",[t._v("set底层实现是dict时")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/031710b707f04b38b01ead6f6bd991d0.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"zset"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#zset"}},[t._v("#")]),t._v(" zset")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/7c0754b8308e42589846a887902b63cb.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("zset当元素较少时会使用ziplist来存储，当放置的时候member在前，score在后，并且按照score值从小到大排列")]),t._v("。如下图所示")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/e8dd995fbe43494aa18fd514288c32fa.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("zset当元素较多时使用dict+skiplist来存储")])]),t._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("typedef")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("zset")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    dict "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("*")]),t._v("dict"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    zskiplist "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("*")]),t._v("zsl"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" zset"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[a("strong",[t._v("dict保存了数据到分数的映射关系")]),t._v(" "),a("strong",[t._v("skiplist用来根据分数查询数据")])]),t._v(" "),a("p",[t._v("dict就不用说了，skiplist的实现比较复杂，用一小节来概述一下")]),t._v(" "),a("h3",{attrs:{id:"skiplist详解"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#skiplist详解"}},[t._v("#")]),t._v(" skiplist详解")]),t._v(" "),a("p",[t._v("skiplist（跳表）是一种为了加速查找而设计的一种数据结构。它是在"),a("strong",[t._v("有序链表")]),t._v("的基础上发展起来的。注意是"),a("strong",[t._v("有序链表")])]),t._v(" "),a("p",[t._v("如下图是一个有序链表（最左侧的灰色节点为一个空的头节点），当我们要插入某个元素的时候，需要从头开始遍历直到找到该元素，或者找到第一个比给定元素大的数据（没找到），时间复杂度为O(n)")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/62135baed42d43789a89924c6f7272c0.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("假如我们每隔一个节点，增加一个新指针，指向下下个节点，如下图所示。这样新增加的指针又组成了一个新的链表，但是节点数只有原来的一半。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/de9e4928c6e04001b9dec26906d2eef0.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("如下为查找23的过程，查找的过程为图中红色箭头指向的方向")]),t._v(" "),a("ol",[a("li",[t._v("23首先和7比较，然后和19比较，都比他们大，接着往下比。23和26比较，比26小。然后从19这节点回到原来的链表")]),t._v(" "),a("li",[t._v("和22比较，比22大，继续和下一个节点26比，比26小，说明23在跳表中不存在")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4ab268a3f2654f139f84623dc0f3ec87.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("利用上面的思路，我们可以在新链表的基础每隔一个节点再生成一个新的链表。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/b1d4e4890c81446dae127c246aa01ccd.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("skiplist就是按照这种思想设计出来的，当然你可以每隔3，4等向上抽一层节点。但是这样做会有一个问题，如果你严格保持上下两层的节点数为1：2，那么当新增一个节点，后续的节点都要进行调整，会让时间复杂度退化到O（n），删除数据也有同样的问题。")]),t._v(" "),a("p",[t._v("skiplist为了避免这种问题的产生，并不要求上下两层的链表个数有着严格的对应关系，而用随机函数得到每个节点的层数。比如一个节点随机出的层数为3，那么把他插入到第一层到第三层这3层链表中。为了方便理解，下图演示了一个skiplist的生成过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/253670cd7a4f4c5287f22b3da5a8bf7b.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("由于层数是每次随机出来的，所以新插入一个节点并不会影响其他节点的层数。插入一个节点只需要修改节点前后的指针即可，降低了插入的复杂度。")]),t._v(" "),a("p",[t._v("刚刚创建的skiplist包含4层链表，假设我们依然查找23，查找路径如下。插入的过程也需要经历一个类似查找的过程，确定位置后，再进行插入操作")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/3bdc0061bdf243bcb77c94964b19f549.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("Redis中跳表的定义如下")]),t._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("typedef")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("zskiplistNode")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 字符串类型的member值")]),t._v("\n    sds ele"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 分值")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("double")]),t._v(" score"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 后向指针")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("zskiplistNode")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("*")]),t._v("backward"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("zskiplistLevel")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    \t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 前向指针")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("struct")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("zskiplistNode")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("*")]),t._v("forward"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 跨度")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("unsigned")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("long")]),t._v(" span"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" level"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" zskiplistNode"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[t._v("可以看到在原始的跳表基础上做了如下2个改动")]),t._v(" "),a("ol",[a("li",[t._v("链表节点增加了后向指针")]),t._v(" "),a("li",[t._v("节点保存了和下一个节点的跨度")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/f5e9c26f4fe949739dd1980c3b01aa55.png#pic_center",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("后向指针用来实现按照score倒序输出等功能")]),t._v(" "),a("p",[t._v("跨度则用来查询元素的排名，按照排名查询数据等（查找元素经过的跨度加起来就是排名哈）")]),t._v(" "),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),a("ol",[a("li",[t._v("能用位存储变量的值绝不用基本数据类型，能用字节数少的数据类型，绝不用字节数多的数据类型（例如各种属性，保存的数据等，为了记录底层数据结构是以什么形式存的，所以大多数数据结构都有编码的概念）")]),t._v(" "),a("li",[t._v("当要保存的内容较少时甚至会将内容字段放到属性中，即属性字段的前几位表示属性，后几位表示内容（sdshdr5）")]),t._v(" "),a("li",[t._v("优先使用内存紧凑的数据结构，这样内存利用率高，内存碎片少（例如hash和zset优先用ziplist，set优先用intset）")]),t._v(" "),a("li",[t._v("在内存使用和执行效效率之间做一个比较好的均衡。当元素少时，优先使用内存占用少的数据结构，元素少对执行效率影响较小。当元素较多原有的数据结构执行效率降低时，才转为更复杂的数据结构。")]),t._v(" "),a("li",[t._v("字符串能转为整数存储的话，则以整数的形式进行存储（string用int编码存储，intset存储元素时，会先尝试转为整数存储）")])]),t._v(" "),a("p",[t._v("在最新的github代码中redis又设计出个listpack的数据结构来取代ziplist，一代比一代高效了，如果你觉得现有的数据类型不能满足应用的需求，你也可以增加新的类型（redis支持这方面的扩展哈）")]),t._v(" "),a("p",[a("strong",[t._v("最后对源码实现感兴趣的可以看《Redis设计与实现》，全书没有一行源码，却把Redis讲的很清楚")])])])}),[],!1,null,null,null);s.default=_.exports}}]);