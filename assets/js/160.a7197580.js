(window.webpackJsonp=window.webpackJsonp||[]).push([[160],{558:function(t,a,s){"use strict";s.r(a);var n=s(56),e=Object(n.a)({},(function(){var t=this,a=t.$createElement,s=t._self._c||a;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"面试官-说一下spring容器启动流程"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#面试官-说一下spring容器启动流程"}},[t._v("#")]),t._v(" 面试官：说一下Spring容器启动流程")]),t._v(" "),s("p",[s("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210317224843860.jpg?",alt:"在这里插入图片描述"}})]),t._v(" "),s("h2",{attrs:{id:"基本概念"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#基本概念"}},[t._v("#")]),t._v(" 基本概念")]),t._v(" "),s("p",[s("strong",[t._v("Spring是一个IOC容器")]),t._v("\n当我们不用Spring进行开发时，我们需要在代码中设置对象的依赖关系。当我们用了Spring之后，由Spring来管理这种依赖关系，当我们想使用对象时，直接从Spring容器中获取即可")]),t._v(" "),s("p",[s("strong",[t._v("BeanDefinition")]),t._v("\n在Spring中对象被叫做Bean，因为Spring Bean在Java类的基础上增加了很多概念，比如scope（作用域），isLazyInit（是否延迟初始化），isSingleton（是否单例），此时Java类不能完整的描述，所以需要新的定义描述类，这个类就是BeanDefinition")]),t._v(" "),s("p",[s("strong",[t._v("BeanDefinitionReader")]),t._v("\nBeanDefinitionReader会将配置的bean解析成为BeanDefinition，Spring Bean的配置方式有很多种，如XML，properties，groovy，注解（可能通过properties，groovy的方式你不常用，但Spring确实支持这种方式），所以BeanDefinitionReader的实现类也很多")]),t._v(" "),s("p",[s("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210330111959746.png?",alt:"在这里插入图片描述"}})]),t._v(" "),s("p",[s("strong",[t._v("ClassPathBeanDefinitionScanner")]),t._v("\n当把Bean配置出后，得需要相应的组件把他们从资源文件中扫描出来吗，这个组件就是ClassPathBeanDefinitionScanner")]),t._v(" "),s("p",[s("strong",[t._v("BeanDefinitionRegistry")]),t._v("\nBeanDefinitionReader将配置的bean解析成为BeanDefinition，需要将BeanDefinition保存到BeanDefinitionRegistry。类似工厂把原料保存到仓库中，供后续生产产品使用")]),t._v(" "),s("p",[s("strong",[t._v("BeanFactory")]),t._v("\nBeanFactory会根据BeanDefinition将Bean生产出来，并保存下来")]),t._v(" "),s("p",[s("strong",[t._v("DefaultListableBeanFactory")]),t._v("\nDefaultListableBeanFactory在绝大多数的场景都是BeanFactory的实现类")]),t._v(" "),s("p",[s("strong",[t._v("BeanPostProcessor")]),t._v("\nBeanFactory根据BeanDefinition生成Bean的过程是一个标准化的流程，就像一个流水线一样，当然你可以在这个流水线上做一些自定义的操作。在Spring中你可以通过实现BeanPostProcessor来干预Bean的生产过程")]),t._v(" "),s("p",[s("strong",[t._v("BeanFactoryPostProcessor")]),t._v("\nSpring作为一个强大的容器，不仅能让你干预Bean的生产过程，还可以让你干预BeanFactory，例如你可以直接往BeanFactory注入一个Bean，不需要让BeanFactory自己去生产，等等")]),t._v(" "),s("h2",{attrs:{id:"容器初始化过程"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#容器初始化过程"}},[t._v("#")]),t._v(" 容器初始化过程")]),t._v(" "),s("p",[t._v("我们常用的容器有如下2种")]),t._v(" "),s("ol",[s("li",[t._v("基于xml配置Bean（ClassPathXmlApplicationContext）")]),t._v(" "),s("li",[t._v("基于注解配置Bean（AnnotationConfigApplicationContext）")])]),t._v(" "),s("p",[t._v("因为我们现在开发都是基于注解，所以分析一下AnnotationConfigApplicationContext的启动流程")]),t._v(" "),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token annotation punctuation"}},[t._v("@Repository")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("UserDao")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getUser")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token string"}},[t._v('"user"')]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token annotation punctuation"}},[t._v("@Configuration")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token annotation punctuation"}},[t._v("@ComponentScan")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v('"com.javashitang"')]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("AppConfig")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Main")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("static")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("main")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),t._v(" args"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 容器启动完毕")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("AnnotationConfigApplicationContext")]),t._v(" context "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("AnnotationConfigApplicationContext")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("AppConfig")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("UserDao")]),t._v(" userDao "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" context"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getBean")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("UserDao")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("class")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("String")]),t._v(" str "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" userDao"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getUser")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("System")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("out"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("println")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("str"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("可以看到当AnnotationConfigApplicationContext被new出来的时候，容器已经启动完毕，后续就可以直接从容器中获取Bean了。")]),t._v(" "),s("p",[t._v("构造函数主要执行了如下3个步骤，其中this和register方法主要是容器初始化的过程。refresh是刷新容器，即启动的过程，在这个里面做了很多操作，我们后面会用一个小节来分析\n"),s("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210330144835601.png?",alt:"在这里插入图片描述"}}),t._v("\n初始化的过程可以看到初始化beanFactory为DefaultListableBeanFactory。这里可以看到AnnotationConfigApplicationContext虽然本身是一个beanFactory（实现了BeanFactory接口），但是依赖查找，依赖注入的过程是依赖内部的beanFactory来实现的（"),s("strong",[t._v("典型的代理模式")]),t._v("）")]),t._v(" "),s("p",[s("strong",[t._v("另外需要注意的一点是，在容器初始化的过程中注册了6个Bean")])]),t._v(" "),s("ol",[s("li",[t._v("ConfigurationClassPostProcessor（实现了BeanFactoryPostProcessor，处理@Configuration）")]),t._v(" "),s("li",[s("strong",[t._v("AutowiredAnnotationBeanPostProcessor（实现了BeanPostProcessor，处理@Autowired，@Value等）")])]),t._v(" "),s("li",[s("strong",[t._v("CommonAnnotationBeanPostProcessor（实现了BeanPostProcessor，用来处理JSR-250规范的注解，如@Resource，@PostConstruct等）")])]),t._v(" "),s("li",[t._v("PersistenceAnnotationBeanPostProcessor（实现了BeanFactoryPostProcessor，用来支持JPA，在我们这个Demo中不会注册，因为路径中没有JPA相关的类）")]),t._v(" "),s("li",[t._v("EventListenerMethodProcessor（实现了BeanFactoryPostProcessor）")]),t._v(" "),s("li",[t._v("DefaultEventListenerFactory")])]),t._v(" "),s("p",[t._v("这几个BeanPostProcessor在Spring Bean的生命周期中发挥了很大的作用，我们在Spring Bean生命周期这篇文章中来分析。")]),t._v(" "),s("p",[s("strong",[t._v("好了，我们来看最重要的过程，容器刷新的过程，入口方法为AbstractApplicationContext#refresh")])]),t._v(" "),s("h2",{attrs:{id:"容器刷新过程"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#容器刷新过程"}},[t._v("#")]),t._v(" 容器刷新过程")]),t._v(" "),s("p",[s("strong",[t._v("容器刷新的过程可以细分为如下几个步骤")])]),t._v(" "),s("ol",[s("li",[t._v("Spring应用上下文启动准备阶段")]),t._v(" "),s("li",[t._v("BeanFactory创建阶段")]),t._v(" "),s("li",[t._v("BeanFactory准备阶段")]),t._v(" "),s("li",[t._v("BeanFactory后置处理阶段")]),t._v(" "),s("li",[t._v("BeanFactory注册BeanPostProcessor阶段")]),t._v(" "),s("li",[t._v("初始化内建Bean：MessageSource")]),t._v(" "),s("li",[t._v("初始化内建Bean：Spring事件广播器")]),t._v(" "),s("li",[t._v("Spring应用上下文刷新阶段")]),t._v(" "),s("li",[t._v("Spring事件监听器注册阶段")]),t._v(" "),s("li",[t._v("BeanFactory初始化完成阶段")]),t._v(" "),s("li",[t._v("Spring应用上下文启动完成阶段")])]),t._v(" "),s("p",[s("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210331221253736.png?",alt:"在这里插入图片描述"}})]),t._v(" "),s("h2",{attrs:{id:"spring应用上下文启动准备阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#spring应用上下文启动准备阶段"}},[t._v("#")]),t._v(" Spring应用上下文启动准备阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#prepareRefresh")]),t._v(" "),s("ol",[s("li",[t._v("记录启动时间 startupDate")]),t._v(" "),s("li",[t._v("设置标志为closed（false），active（true）")]),t._v(" "),s("li",[t._v("初始化PropertySources")]),t._v(" "),s("li",[t._v("校验Environment中必须属性")]),t._v(" "),s("li",[t._v("初始化事件监听器集合")]),t._v(" "),s("li",[t._v("初始化早期Spring事件集合")])]),t._v(" "),s("h2",{attrs:{id:"beanfactory创建阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#beanfactory创建阶段"}},[t._v("#")]),t._v(" BeanFactory创建阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#obtainFreshBeanFactory")]),t._v(" "),s("p",[t._v("刷新Spring应用上下文底层BeanFactory（refreshBeanFactory）")]),t._v(" "),s("ol",[s("li",[t._v("如果已存在BeanFactory，销毁Bean，并且关闭BeanFactory")]),t._v(" "),s("li",[t._v("创建DefaultListableBeanFactory（一般情况下都是DefaultListableBeanFactory）")]),t._v(" "),s("li",[t._v("设置BeanFactory id")]),t._v(" "),s("li",[t._v("设置BeanFactory是否允许BeanDefinition重复定义，是否允许循环引用")]),t._v(" "),s("li",[t._v("加载BeanDefinition")]),t._v(" "),s("li",[t._v("关联新建的BeanFactory到Spring应用上下文")])]),t._v(" "),s("p",[t._v("返回Spring应用上下文底层BeanFactory（getBeanFactory）")]),t._v(" "),s("h2",{attrs:{id:"beanfactory准备阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#beanfactory准备阶段"}},[t._v("#")]),t._v(" BeanFactory准备阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#prepareBeanFactory")]),t._v(" "),s("ol",[s("li",[t._v("关联ClassLoader")]),t._v(" "),s("li",[t._v("设置Bean表达式处理器")]),t._v(" "),s("li",[t._v("添加 PropertyEditorRegistrar 的实现 ResourceEditorRegistrar")]),t._v(" "),s("li",[s("strong",[t._v("注册BeanPostProcessor（ApplicationContextAwareProcessor）")]),t._v("，用来处理Aware回调接口")]),t._v(" "),s("li",[t._v("忽略Aware回调接口作为依赖注入接口")]),t._v(" "),s("li",[t._v("注册ResolvableDependency对象-BeanFactory，ResourceLoader，ApplicationEventPublisher，ApplicationContext")]),t._v(" "),s("li",[s("strong",[t._v("注册BeanPostProcessor（ApplicationListenerDetector）")]),t._v("，用来处理ApplicationListener接口")]),t._v(" "),s("li",[t._v("注册BeanPostProcessor（LoadTimeWeaverAwareProcessor），用来处理aop")]),t._v(" "),s("li",[t._v("注册单例对象（Environment，Java System Properties以及OS环境变量）")])]),t._v(" "),s("h2",{attrs:{id:"beanfactory后置处理阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#beanfactory后置处理阶段"}},[t._v("#")]),t._v(" BeanFactory后置处理阶段")]),t._v(" "),s("p",[t._v("如果想对BeanFactory进行扩展，可以通过如下2种方式")]),t._v(" "),s("ol",[s("li",[t._v("子类重写AbstractApplicationContext#postProcessBeanFactory方法")]),t._v(" "),s("li",[t._v("实现BeanFactoryPostProcessor接口")])]),t._v(" "),s("p",[t._v("AbstractApplicationContext#invokeBeanFactoryPostProcessors\n方法就是用来处理BeanFactoryPostProcessor接口的，调用的次序比较复杂，总结如下")]),t._v(" "),s("ol",[s("li",[t._v("BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（入参中的）")]),t._v(" "),s("li",[t._v("BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，并且实现了PriorityOrdered接口）")]),t._v(" "),s("li",[t._v("BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，并且实现了Ordered接口）")]),t._v(" "),s("li",[t._v("BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry（容器中的，除去第2，3步剩余的BeanDefinitionRegistryPostProcessor）")]),t._v(" "),s("li",[t._v("BeanDefinitionRegistryPostProcessor#postProcessBeanFactory（所有BeanDefinitionRegistryPostProcessor接口实现类）")]),t._v(" "),s("li",[t._v("BeanFactoryPostProcessor#postProcessBeanFactory（入参数中的）")]),t._v(" "),s("li",[t._v("BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，实现了PriorityOrdered接口）")]),t._v(" "),s("li",[t._v("BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，实现了Ordered接口）")]),t._v(" "),s("li",[t._v("BeanFactoryPostProcessor#postProcessBeanFactory（容器中的，除去7，8步剩余的BeanFactoryPostProcessor）")])]),t._v(" "),s("p",[s("strong",[t._v("注册BeanPostProcessor（ConfigurationClassPostProcessor.ImportAwareBeanPostProcessor）")])]),t._v(" "),s("p",[t._v("注册LoadTimeWeaverAwareProcessor对象")]),t._v(" "),s("h2",{attrs:{id:"beanfactory注册beanpostprocessor阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#beanfactory注册beanpostprocessor阶段"}},[t._v("#")]),t._v(" BeanFactory注册BeanPostProcessor阶段")]),t._v(" "),s("ol",[s("li",[s("strong",[t._v("注册BeanPostProcessor（PostProcessorRegistrationDelegate.BeanPostProcessorChecker）")])]),t._v(" "),s("li",[t._v("注册PriorityOrdered类型的BeanPostProcessor")]),t._v(" "),s("li",[t._v("注册Ordered类型的BeanPostProcessor")]),t._v(" "),s("li",[t._v("注册普通的BeanPostProcessor")]),t._v(" "),s("li",[t._v("注册MergedBeanDefinitionPostProcessor")]),t._v(" "),s("li",[s("strong",[t._v("注册BeanPostProcessor（ApplicationListenerDetector）")])])]),t._v(" "),s("p",[t._v("此时注册到容器中的BeanPostProcessor有如下6个，这6个BeanPostProcessor在Spring Bean的生命周期中起着重要的作用\n"),s("img",{attrs:{src:"https://img-blog.csdnimg.cn/20210322232429517.png?",alt:"在这里插入图片描述"}})]),t._v(" "),s("h2",{attrs:{id:"初始化内建bean-messagesource"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#初始化内建bean-messagesource"}},[t._v("#")]),t._v(" 初始化内建Bean：MessageSource")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#initMessageSource\n国际化相关的内容，不怎么用，不研究了")]),t._v(" "),s("h2",{attrs:{id:"初始化内建bean-spring事件广播器"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#初始化内建bean-spring事件广播器"}},[t._v("#")]),t._v(" 初始化内建Bean：Spring事件广播器")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#initApplicationEventMulticaster")]),t._v(" "),s("h2",{attrs:{id:"spring应用上下文刷新阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#spring应用上下文刷新阶段"}},[t._v("#")]),t._v(" Spring应用上下文刷新阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#onRefresh\n留给子类扩展用的")]),t._v(" "),s("h2",{attrs:{id:"spring事件监听器注册阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#spring事件监听器注册阶段"}},[t._v("#")]),t._v(" Spring事件监听器注册阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#registerListeners")]),t._v(" "),s("ol",[s("li",[t._v("添加当前应用上下文所关联的ApplicationListener对象")]),t._v(" "),s("li",[t._v("添加BeanFactory所注册的ApplicationListener")]),t._v(" "),s("li",[t._v("广播早期Spring事件")])]),t._v(" "),s("h2",{attrs:{id:"beanfactory初始化完成阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#beanfactory初始化完成阶段"}},[t._v("#")]),t._v(" BeanFactory初始化完成阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#finishBeanFactoryInitialization")]),t._v(" "),s("ol",[s("li",[t._v("conversionService如果存在的话，设置到beanFactory")]),t._v(" "),s("li",[t._v("添加 StringValueResolver 对象")]),t._v(" "),s("li",[t._v("依赖查找LoadTimeWeaverAware Bean")]),t._v(" "),s("li",[t._v("beanFactory将ClassLoader临时设置为null")]),t._v(" "),s("li",[t._v("beanFactory冻结配置")]),t._v(" "),s("li",[t._v("beanFactory初始化非延迟单例Beans")])]),t._v(" "),s("p",[s("strong",[t._v("说一个高频面试题，Spring容器在何时创建对象？")])]),t._v(" "),s("ol",[s("li",[t._v("scope=singleton，容器启动过程中创建对象")]),t._v(" "),s("li",[t._v('scope!=singleton，延迟Bean（加了@Lazy，或<bean lazy-init="true"/>），在调用getBean的同时创建对象')])]),t._v(" "),s("h2",{attrs:{id:"spring应用上下文启动完成阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#spring应用上下文启动完成阶段"}},[t._v("#")]),t._v(" Spring应用上下文启动完成阶段")]),t._v(" "),s("p",[t._v("AbstractApplicationContext#finishRefresh")]),t._v(" "),s("ol",[s("li",[t._v("清除ResoureLoader缓存")]),t._v(" "),s("li",[t._v("初始化lifecycleProcessor对象")]),t._v(" "),s("li",[t._v("调用lifecycleProcessor#onRefresh方法")]),t._v(" "),s("li",[t._v("发布应用上下文刷新事件 ContextRefreshedEvent")]),t._v(" "),s("li",[t._v("向MBeanServer托管Live Beans")])])])}),[],!1,null,null,null);a.default=e.exports}}]);