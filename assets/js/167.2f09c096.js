(window.webpackJsonp=window.webpackJsonp||[]).push([[167],{565:function(t,s,a){"use strict";a.r(s);var n=a(56),r=Object(n.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"面试官-说一下类加载的过程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#面试官-说一下类加载的过程"}},[t._v("#")]),t._v(" 面试官：说一下类加载的过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/3c4aa5ed508c6dda9ccb42c894ed399b.png",alt:"请添加图片描述"}})]),t._v(" "),a("h2",{attrs:{id:"加载"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#加载"}},[t._v("#")]),t._v(" 加载")]),t._v(" "),a("p",[t._v("当我们要使用一个类的时候，要通过ClassLoader将类加载到内存中")]),t._v(" "),a("p",[a("strong",[t._v("类加载阶段主要完成如下三件事情")])]),t._v(" "),a("ol",[a("li",[t._v("通过全类名，获取类的二进制流")]),t._v(" "),a("li",[t._v("解析类的二进制流为方法区内的数据结构")]),t._v(" "),a("li",[t._v("创建一个java.lang.Class类的实例，表示该类型，作为方法区这个类的访问入口")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/4fee6c0000c640e7943c3e4cf44167a8.png?",alt:"请添加图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("通过全类名，获取类的二进制流的方式有很多种")])]),t._v(" "),a("ol",[a("li",[t._v("从zip压缩包中获取")]),t._v(" "),a("li",[t._v("从网络中获取")]),t._v(" "),a("li",[t._v("运行时计算生成，如动态代理技术")]),t._v(" "),a("li",[t._v("...")])]),t._v(" "),a("p",[a("strong",[t._v("对于非数组类型的加载阶段，即可以使用Java虚拟机内置的类加载器去完成，也可以使用用户自定义的类加载器去完成")])]),t._v(" "),a("h2",{attrs:{id:"链接"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#链接"}},[t._v("#")]),t._v(" 链接")]),t._v(" "),a("p",[a("strong",[t._v("链接这个阶段主要分为3个部分，验证，准备，解析")])]),t._v(" "),a("h3",{attrs:{id:"验证"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#验证"}},[t._v("#")]),t._v(" 验证")]),t._v(" "),a("p",[a("strong",[t._v("验证阶段主要是确保Class文件的格式正确，运行时不会危害虚拟机的安全")])]),t._v(" "),a("p",[t._v("验证阶段的规则很多，但大致分为如下4个阶段")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/807a8b9a4c27d74a2621b2927a63e1bb.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("具体详细的内容，我就不详细解释了，可以看《深入理解Java虚拟机》，本篇文章偏向于做一个总结，把握类加载的一个整体流程，而不对细节进行阐述")])]),t._v(" "),a("h3",{attrs:{id:"准备"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#准备"}},[t._v("#")]),t._v(" 准备")]),t._v(" "),a("p",[a("strong",[t._v("准备阶段主要是为类的静态变量分配内存，并将其初始化为默认值")])]),t._v(" "),a("p",[t._v("常见的数据类型的默认值如下")]),t._v(" "),a("table",[a("thead",[a("tr",[a("th",[t._v("数据类型")]),t._v(" "),a("th",[t._v("默认值")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("byte")]),t._v(" "),a("td",[t._v("(byte)0")])]),t._v(" "),a("tr",[a("td",[t._v("short")]),t._v(" "),a("td",[t._v("(short)0")])]),t._v(" "),a("tr",[a("td",[t._v("int")]),t._v(" "),a("td",[t._v("0")])]),t._v(" "),a("tr",[a("td",[t._v("long")]),t._v(" "),a("td",[t._v("0L")])]),t._v(" "),a("tr",[a("td",[t._v("float")]),t._v(" "),a("td",[t._v("0.0f")])]),t._v(" "),a("tr",[a("td",[t._v("double")]),t._v(" "),a("td",[t._v("0.0d")])]),t._v(" "),a("tr",[a("td",[t._v("boolean")]),t._v(" "),a("td",[t._v("false")])]),t._v(" "),a("tr",[a("td",[t._v("char")]),t._v(" "),a("td",[t._v("'\\u0000'")])]),t._v(" "),a("tr",[a("td",[t._v("reference")]),t._v(" "),a("td",[t._v("null")])])])]),t._v(" "),a("p",[a("strong",[t._v("如果类静态变量的字段属性表中存在ConstantValue属性，则直接执行赋值语句")])]),t._v(" "),a("p",[t._v("那么什么情况下类静态变量的字段属性表中存在ConstantValue属性呢？")]),t._v(" "),a("ol",[a("li",[t._v("类静态变量为基本数据类型，并且被final修饰")]),t._v(" "),a("li",[t._v("类静态变量为String类型，被final修饰，并且以字面量的形式赋值")])]),t._v(" "),a("p",[t._v("为了方便查看Class文件的字节码，我在IDEA中下载了一个插件jclasslib Bytecode viewer，非常方便。用如下代码通过字节码的形式验证一下")]),t._v(" "),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Person")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" age "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("final")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" length "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("160")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("final")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" name "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"name"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("final")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" loc "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"loc"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/3780ac88b2c90fd1eb59aa4d7d423893.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("所以length和name属性在准备阶段就会赋值为ConstantValue指定的值")])]),t._v(" "),a("p",[a("strong",[t._v("那么age和loc属性会在哪个阶段赋值呢？是在初始化阶段，后面会详细介绍哈")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/c503820866950d8f6c3d4ae13469d010.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("h3",{attrs:{id:"解析"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解析"}},[t._v("#")]),t._v(" 解析")]),t._v(" "),a("p",[a("strong",[t._v("将类，接口，字段和方法的符号引用（在常量池中）转为直接引用")]),t._v("\n符号引用：用一组符号来描述所引用的目标\n直接引用；直接指向指向目标的指针")]),t._v(" "),a("p",[t._v("加入我写了一个如下的类")]),t._v(" "),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Student")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" age"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getName")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/75ebc8fd73bc8d9d4afbbb28177786f6.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("以字段为例，name和age对应的对象并不是直接指向内存地址，而是用字符串来进行描述（即符号引用）。解析阶段就是将这些描述转为直接指向目标的指针（即直接引用）")]),t._v(" "),a("h2",{attrs:{id:"初始化"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#初始化"}},[t._v("#")]),t._v(" 初始化")]),t._v(" "),a("p",[a("strong",[t._v("执行类静态成员变量赋值语句和静态代码块中的语句")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/57a890b47aa34dc8a0dac846ed262615.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("我们把上面的Student代码改成如下形式")]),t._v(" "),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Student")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" age "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("private")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" gender "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("System")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("out"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("println")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"构造代码块"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("System")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("out"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("println")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"静态代码块"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Student")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("System")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("out"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("println")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"构造函数"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getName")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),a("p",[t._v("可以看到字节码中包含了3个方法，getName方法我们知道，<init>和<clinit>方法里面执行了哪些逻辑？")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/0699ddb8ab687bf94a7b24ca109f8595.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("从字节码的角度分析一波")]),t._v(" "),a("p",[a("strong",[t._v("<init>方法")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/4fb69d0843d38bee672b7fda0db960e9.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("从字节码可以看到<init>方法的主要逻辑为")]),t._v(" "),a("ol",[a("li",[t._v("调用父类的<init>方法")]),t._v(" "),a("li",[t._v("非静态成员变量赋值")]),t._v(" "),a("li",[t._v("执行构造代码块")]),t._v(" "),a("li",[t._v("执行构造函数")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/583eda30c01f1d59da71fd5f96a25ed7.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("strong",[t._v("<clinit>方法")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/5eefba80f72c0af1ca2ddf5d475fd791.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("从字节码可以看到<clinit>方法的主要逻辑为")]),t._v(" "),a("ol",[a("li",[t._v("执行静态变量的赋值语句")]),t._v(" "),a("li",[t._v("执行静态代码块中的语句")]),t._v(" "),a("li",[t._v("需要注意的一点是，"),a("strong",[t._v("Java虚拟机会保证子类的<client>方法执行前，父类的<client>方法已经执行完毕")])])]),t._v(" "),a("p",[a("strong",[t._v("理解<clinit>和<init>方法的作用还是很有必要的，因为经常有些面试题问静态代码块，构造代码块，构造函数的执行顺序。")])]),t._v(" "),a("p",[t._v("我这里就直接总结一下结论，大家可以写demo验证一下")]),t._v(" "),a("p",[a("strong",[t._v("没有继承情况的执行顺序")])]),t._v(" "),a("ol",[a("li",[t._v("静态代码块和静态成员变量，执行顺序由编写顺序决定（只会执行一次哈）")]),t._v(" "),a("li",[t._v("构造代码块和非静态成员变量，执行顺序由编写顺序决定")]),t._v(" "),a("li",[t._v("构造函数")])]),t._v(" "),a("p",[a("strong",[t._v("有继承情况的执行顺序")])]),t._v(" "),a("ol",[a("li",[t._v("父类的静态（静态代码块，静态成员变量），子类的静态（静态代码块，静态成员变量）（只会执行一次哈）")]),t._v(" "),a("li",[t._v("父类的非静态（构造代码块，非静态成员变量），父类的构造函数")]),t._v(" "),a("li",[t._v("子类的非静态（构造代码块，非静态成员变量），子类的构造函数")])]),t._v(" "),a("h2",{attrs:{id:"卸载"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#卸载"}},[t._v("#")]),t._v(" 卸载")]),t._v(" "),a("p",[t._v("垃圾收集不仅发生在堆中，方法区上也会发生。但是对方法区的类型数据回收的条件比较苛刻")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/566b3a8d09159f3bf6e4a0759421c042.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/2ebebaa0beefaf479bd3a843aed7dadb.png",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("以下图为例，想回收方法区中的Simple类")]),t._v(" "),a("ol",[a("li",[t._v("需要保证堆中的Sample类及其子类都已经被回收")]),t._v(" "),a("li",[t._v("加载Sample类的MyClassLoader已经被回收")]),t._v(" "),a("li",[t._v("Sample类对应的Class对象已经被回收")])]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210712135403316.png?",alt:"在这里插入图片描述"}})]),t._v(" "),a("p",[t._v("可以看到对方法区的类型数据回收的条件比较苛刻，但是收效甚微，所以有些垃圾收集器不会对方法区的类型数据进行回收")]),t._v(" "),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),a("p",[t._v("类加载过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/eb43af4227d90af3ca11a1a7b6698587.png",alt:"请添加图片描述"}})]),t._v(" "),a("p",[t._v("变量的赋值过程")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/img_convert/95a4a4ef47625a12eadb6dafa35a6355.png",alt:"请添加图片描述"}})])])}),[],!1,null,null,null);s.default=r.exports}}]);