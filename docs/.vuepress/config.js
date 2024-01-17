module.exports = {
    dest: "site",
    title: 'Java识堂', // 显示在左上角的网页名称以及首页在浏览器标签显示的title名称
    description: 'Java识堂', // meta 中的描述文字，用于SEO
    // 注入到当前页面的 HTML <head> 中的标签
    head: [
        ['link',
            { rel: 'icon', href: '/egg.png' }
            //浏览器的标签栏的网页图标，第一个'/'会遍历public文件夹的文件
        ],
        ['script', {},
            `
                var _hmt = _hmt || [];
                (function() {
                    var hm = document.createElement("script");
                    hm.src = "https://hm.baidu.com/hm.js?0784d635689a6d6b5b6c15db0b223263";
                    var s = document.getElementsByTagName("script")[0]; 
                    s.parentNode.insertBefore(hm, s);
                })();
            `
        ],
        ['meta', { id: 'referrer', name: 'referrer', content: 'never' }]
    ],
    base: '/blog/',
    themeConfig: {
        docsRepo: "erlieStar/javashitang",
        // 编辑文档的所在目录
        docsDir: 'docs',
        // 文档放在一个特定的分支下：
        docsBranch: 'master',
        //logo: "/logo.png",
        editLinks: true,
        sidebarDepth: 0,
        //smoothScroll: true,
        locales: {
            "/": {
                label: "简体中文",
                selectText: "Languages",
                editLinkText: "在 GitHub 上编辑此页",
                lastUpdated: "上次更新",
                nav: [
                    {
                        text: '导读', link: '/md/other/guide.md'
                    },
                    {
                        text: '算法', link: '/md/algorithm/开篇：拒绝盲目刷题，如何更高效的学习算法.md'
                    },
                    {
                        text: 'Java',
                        items: [
                            {
                                text: 'Java面试',
                                link: '/md/java/说一下八种基本数据类型及其包装类吧.md'
                            },
                            {
                                text: 'Java并发',
                                link: '/md/concurrent/Synchronized底层实现，锁升级原理.md'
                            },
                        ]
                    },
                    {
                        text: 'JVM', link: '/md/jvm/常见的垃圾回收算法有哪些.md'
                    },
                    {
                        text: 'Spring', link: '/md/spring/Spring容器启动流程.md'
                    },
                    {
                        text: 'Mybatis', link: '/md/mybatis/JDBC用法一览.md'
                    },
                    {
                        text: 'Redis', link: '/md/redis/Redis数据结构为什么既省内存又高效.md'
                    },
                    {
                        text: 'MySQL', link: '/md/mysql/数据是如何进行存储和查询的.md'
                    },
                    {
                        text: 'MQ',
                        items: [
                            {
                                text: 'RabbitMq',
                                link: '/md/rabbitmq/消息中间件的诸侯征战史.md'
                            },
                            {
                                text: 'RocketMq',
                                link: '/md/rocketmq/架构及特性一览.md'
                            },
                        ]

                    },
                    {
                        text: '分布式事务',
                        items: [
                            {
                                text: '解决方案',
                                link: '/md/transaction/01.7种常见解决方案汇总.md'
                            },
                            {
                                text: 'Seata',
                                link: '/md/seata/01.seata和spring是如何整合的.md'
                            },
                        ]
                    },
                    {
                        text: 'RPC',
                        items: [
                            {
                                text: '手写RPC',
                                link: '/md/rpc/如何手写一个RPC框架.md'
                            },
                            {
                                text: 'Dubbo',
                                link: '/md/dubbo/Dubbo的前世今生.md'
                            },
                        ]
                    }
                ],
                sidebar: {
                    "/md/mybatis/": mybatis(),
                    "/md/java/": java(),
                    "/md/jvm/": jvm(),
                    "/md/concurrent/": concurrent(),
                    "/md/dubbo/": dubbo(),
                    "/md/rpc/": rpc(),
                    "/md/spring/": spring(),
                    "/md/rocketmq/": rocketmq(),
                    "/md/algorithm/": algorithm(),
                    "/md/rabbitmq/": rabbitmq(),
                    "/md/transaction/": transaction(),
                    "/md/seata/": seata(),
                    "/md/algorithm/": algorithm(),
                    "/md/redis/": redis(),
                    "/md/mysql/": mysql()
                }
            }
        }
    }
}

function java() {
    return [
        {
            title: "Java面试通关",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "如何准备面试.md",
                "说一下八种基本数据类型及其包装类吧.md",
                "说一下String StringBuffer StringBuilder的区别.md",
                "同样是等待，说一下sleep和wait的区别.md",
                "HashMap是怎么实现的.md",
                "说一下Http请求的报文格式及常用状态码.md",
                "线上服务CPU飙高怎么排查.md",
                "MySQL索引为什么要用B+树实现.md",
                "JVM运行时数据区包含哪几部分？作用是啥.md",
                "索引优化策略有哪些.md",
                "写一下单例模式吧，知道单例模式有几种写法吗.md",
                "垃圾回收中GC Root对象有哪几种.md",
                "说一下构造函数，静态代码块，构造代码块等的加载顺序.md",
                "ThreadLocal的应用场景和注意事项有哪些.md",
                "你知道zookeeper有哪些作用吗.md",
                "既然你用了原子类，那你知道CAS的工作原理是啥吗.md",
                "MyBatis你只写了接口为啥就能执行sql啊.md",
                "如何查看端口被哪个应用程序占用.md",
                "Redis的基本数据类型都有哪些应用场景啊.md",
                "说一下缓存雪崩，缓存穿透，缓存击穿出现的原因及解决方案.md",
                "画一下Java中线程状态转换图把，越详细越好.md",
                "能手写一个简易版的线程池吗.md",
                "如果我一直往线程池里面放任务，会发生什么.md",
                "如何控制多线程执行顺序.md",
                "Spring AOP是怎么实现的.md",
                "如何用explain分析sql执行性能.md",
                "cookie和session是怎么交互的.md",
                "Spring如何解决循环依赖.md",
                "你知道的限流算法有哪些.md",
                "多个线程执行完毕后，才执行另一个线程，该怎么做.md",
                "Servlet Filter和Spring MVC Interceptor有哪些区别.md",
                "说一下常见的垃圾收集器及其适用场景.md",
                "常见的垃圾回收算法有哪些.md",
                "Spring事务的传播行为有几种.md",
                "说一下你对数据库事务四大特性的理解.md",
                "HashMap死循环形成的原因是什么.md",
                "高并发下如何保证接口的幂等性.md",
                "volatile关键字用过吧？说一下作用和实现吧.md",
                "让你写一个单点登陆组件，你会怎么实现.md",
                "说一下装饰者模式的作用，以及哪些地方用到了装饰者模式吧",
                "说一下NIO和BIO的区别.md",
                "如何查看etc目录下包含abc字符串的文件.md",
                "vim中如何跳到文件的开头，第n行，最后一行.md",
                "你们项目中是怎么解决跨域的.md",
                "我想把Spring Boot项目放在tomcat中运行，该怎么配置.md",
                "maven jar包冲突如何解决.md",
                "如何实现一个RPC框架.md",
                "说一下Spring MVC的执行流程，为什么要这么设计.md",
                "说一下Mybatis插件的实现原理.md",
                "Mybatis一级缓存和二级缓存同时开启，先查询哪个缓存.md",
                "Redis中过期的key是怎么被删除的.md",
                "说一下Synchronized底层实现，锁升级的具体过程.md",
                "Synchronized和Lock接口有哪些区别.md",
                "String类为什么被设计为不可变的.md",
                "让你写一个爬虫系统，如何对url进行去重.md",
                "同样是注册中心，Zookeeper和Eureka有哪些区别.md",
                "MVCC是如何实现的.md",
                "脏读，不可重复读，幻读是如何发生的.md",
                "索引为什么会失效.md",
                "怎么查找etc目录下大于1M的文件.md",
                "一张千万级别数据的表想做分页，如何优化.md",
                "ConcurrentHashMap1.7和1.8有哪些区别啊.md",
                "final关键字有哪些作用.md",
                "Get和Post的区别是什么.md",
                "假如你在项目中定义一个String类，程序用jdk的还是你定义的.md",
                "Object类有哪些方法.md",
                "单线程的Redis为什么能支持10w+的QPS.md",
                "内存泄漏，内存溢出如何排查.md",
                "AQS有啥作用啊.md",
                "如何快速定位慢SQL.md",
                "Spring MVC拦截器有哪些应用场景.md",
                "Spring Boot 自动装配是如何实现的.md",
                "如何手写一个Spring Boot starter.md",
                "说一下Spring MVC的启动流程呗.md",
                "说一下Spring Boot的启动过程把.md",
                "说一下Spring容器启动流程.md",
                "说一下Spring Bean的生命周期呗.md",
                "@Resource和@Autowired有啥区别.md",
                "BeanFactory和FactoryBean有哪些区别.md",
                "Spring声明式事务在那些情况下会失效.md",
                "Spring有几种配置方式，每种配置方式的应用场景是啥.md",
                "说一下类加载的过程.md",
                "说说常用的排序算法呗.md",
                "生产环境发生问题，你一般怎么排查-网络篇.md",
                "生产环境发生问题，你一般怎么排查-JVM命令行监控工具篇.md",
                "生产环境发生问题，你一般怎么排查-Linux工具篇.md",
                "分布式ID的生成策略有哪些.md",
                "从浏览器输入URL到页面展示出来，中间发生了什么.md",
                "RocketMQ如何保证消息的可靠性投递.md",
                "分布式事务的解决方案有哪些.md"
            ]
        }
    ]
}

function concurrent() {
    return [
        {
            title: "并发理论",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "画一个线程状态转换图.md",
                "如何优雅的停止线程.md",
                "InterruptedException有啥用.md",
                "如何解决死锁.md"
            ]
        },
        {
            title: "并发关键字",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Synchronized底层实现，锁升级原理.md",
                "volatile如何保证可见性和有序性.md"
            ]
        },
        {
            title: "并发原子类",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "用原子类来保证可见性和原子性.md",
                "都有了AtomicLong，为什么还要提供LongAdder.md"
            ]
        },
        {
            title: "并发工具类",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "AQS有哪些作用？（一）.md",
                "AQS有哪些作用？（二）.md",
                "ReentrantLock的效率为什么这么高.md",
                "CountDownLatch有哪些用处.md",
                "CyclicBarrier，一不小心，锁就不能重用了.md",
                "用Semaphore实现限流.md",
                "ReadWriteLock是如何做到读读并行的.md",
                "如何手写一个线程池.md",
                "使用线程池有什么好处.md"
            ]
        },
        {
            title: "并发容器",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "ThreadLocal为什么会内存泄漏.md",
                "读多写少？试试CopyOnWriteArrayList.md",
                "HashMap-1.7.md",
                "HashMap-1.8.md",
                "ConcurrentHashMap-1.7.md",
                "ConcurrentHashMap-1.8.md"
            ]
        },
    ]
}

function jvm() {
    return [
        {
            title: "JVM",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "常见的垃圾回收算法有哪些.md",
                "垃圾收集器及其适用场景.md",
                "哪些区域会发生内存溢出.md",
                "使用MAT进行内存溢出排查.md",
                "618核心服务内存溢出排查实战.md"
            ]
        }
    ]
}

function mysql() {
    return [
        {
            title: "MySQL",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "数据是如何进行存储和查询的.md",
                "三种日志都有啥用.md",
                "MVCC是如何实现的.md",
                "如何快速定位慢SQL.md",
                "explain详解-1.md",
                "explain详解-2.md",
                "join 语句怎么优化.md",
                "order by 语句怎么优化.md"
            ]
        }
    ]
}

function rpc() {
    return [
        {
            title: "RPC",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "如何手写一个RPC框架.md",
                "极简版.md",
                "5分钟极速入门Netty的使用.md",
                "Netty高性能的秘密是.md",
                "详解ZooKeeper和客户端框架Curator.md",
                "Spring Bean 生命周期详解.md",
                "可扩展性神器 Java SPI.md",
                "基于Java SPI的可扩展版.md",
                "基于RPC框架封装一个spring-boot-starter.md"
            ]
        }
    ]
}

function mybatis() {
    return [
        {
            title: "Mybatis",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "JDBC用法一览.md",
                "MyBatis用法一览.md",
                "聊聊那些实用的工具类.md",
                "配置解析流程.md",
                "SQL解析流程.md",
                "SQL执行流程.md",
                "为什么一级缓存和二级缓存都不建议使用.md",
                "参数处理器是如何兼容这么多种类型的参数.md",
                "动态代理让sql执行更安全高效.md",
                "强大的插件是如何工作的.md",
                "Mybatis如何和Spring进行整合.md",
                "事务管理.md",
                "Mybatis是如何兼容这么多日志框架的.md"
            ]
        }
    ]
}

function rabbitmq() {
    return [
        {
            title: "RabbitMq",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "消息中间件的诸侯征战史.md",
                "RabbitMQ的安装及图形界面的使用.md",
                "RabbitMQ最全特性一览及Java Api的使用.md",
                "RabbitMQ整合Spring Boot.md",
                "RabbitMQ如何保证消息的可靠投递.md",
                "如何处理消费过程中的重复消息.md"
            ]
        }
    ]
}

function transaction() {
    return [
        {
            title: "分布式事务解决方案",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "01.7种常见解决方案汇总.md",
                "02.XA规范.md",
                "03.Seata AT模式.md",
                "04.TCC设计思想及其可能遇到的问题.md",
                "05.Seata TCC 模式.md",
                "06.RocketMQ事务消息.md",
            ]
        }
    ]
}

function seata() {
    return [
        {
            title: "seata源码解析",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "01.seata和spring是如何整合的.md",
                "02.只需一个注解就能开启分布式事务.md",
                "03.TM RM 客户端的初始化过程.md",
                "04.全局事务id是如何传递的.md",
                "05.seata-server启动时都做了哪些操作.md",
                "06.seata server各种消息处理流程.md",
                "07.事务状态及全局锁的存储.md",
                "08.分支事务的提交或回滚.md",
                "09.seata AT模式是如何实现的.md",
                "10.seata是如何支持TCC模式的.md"
            ]
        }
    ]
}

function dubbo() {
    return [
        {
            title: "Dubbo实战",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Dubbo的前世今生.md",
                "5分钟极速入门Dubbo使用.md",
                "如何高效的测试Dubbo接口.md",
                "微服务项目（Spring Cloud，Dubbo）如何自测.md"
            ]
        },
        {
            title: "Dubbo源码解析",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "5分钟了解 Dubbo SPI 的特性.md",
                "Dubbo SPI是如何实现 AOP，IOC，自适应，自动激活的.md",
                "基于XML配置原理解析.md",
                "基于注解配置原理解析.md",
                "Dubbo服务导出过程.md",
                "服务提供方接收请求及返回结果.md",
                "线程模型和线程池策略.md",
                "BeanFactory，封装复杂Bean的创建过程.md",
                "Dubbo服务引入过程.md",
                "服务目录和路由.md",
                "注册中心.md",
                "客户端服务调用过程.md",
                "Dubbo是如何同时支持同步调用和异步调用的.md",
                "详解集群容错和负载均衡策略.md",
                "Dubbo过滤器.md",
                "从头走一遍Dubbo的执行流程.md"
            ]
        },
        {
            title: "Dubbo面试",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "高频面试题汇总.md",
                "Dubbo中用到了哪些设计模式.md"
            ]
        },
        {
            title: "Dubbo生产问题",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "线程池被打满.md",
                "@Reference注入为空.md"
            ]
        },
    ]
}

function spring() {
    return [
        {
            title: "Spring IOC",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Spring容器启动流程.md",
                "Spring Bean生命周期详解（一）.md",
                "Spring Bean生命周期详解（二）.md",
                "@Resource和@Autowired有啥区别.md",
            ]
        },
        {
            title: "Spring AOP",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "详解Spring AOP的前世今生.md",
                "解析切面.md",
                "生成代理对象.md",
                "执行切面.md",
                "Spring处理循环依赖只使用二级缓存可以吗.md",
                "Spring事务实现原理.md"
            ]
        },
        {
            title: "Spring Core",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "事件实现及注意事项.md",
                "Enable**注解是如何实现的.md"
            ]
        },
        {
            title: "Spring MVC",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "你需要了解的Servlet.md",
                "基于Servlet手写一个Spirng MVC.md",
                "Spring MVC启动流程.md",
                "各种类型Handler的注册和查找.md",
                "各种类型Handler的执行.md",
                "参数解析器，简化参数取值过程.md",
                "返回值处理器，处理多种返回值类型.md",
                "异常解析器，统一处理处理请求中发生的异常.md",
                "自定义组件的注入方式有多少种.md"
            ]
        },
        {
            title: "Spring Boot",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Spring 和 Spring Boot 有哪些区别.md",
                "详解Spring Boot启动流程.md",
                "Spring Boot 自动装配是如何实现的.md",
                "Condition注解.md"
            ]
        },
    ]
}

function rocketmq() {
    return [
        {
            title: "随笔",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "消息发送和消费核心流程汇总.md",
                "消息消费异常如何排查.md"
            ]
        },
        {
            title: "源码",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "架构及特性一览.md",
                "如何在IDEA中调试RocketMQ源码.md",
                "NameServer是如何存路由信息的.md",
                "消息发送流程.md",
                "RocketMQ是如何存储消息的.md",
                "高性能存储策略.md",
                "同步刷盘和异步刷盘的实现.md",
                "主从同步和读写分离实现.md",
                "如何快速查找消息.md",
                "消息拉取和消费流程.md",
                "消息过滤是如何实现的.md",
                "长轮询是如何实现的.md",
                "消息消费失败后的重试逻辑.md",
                "延时消息是如何实现的.md",
                "事务消息是如何实现的.md"
            ]
        }
    ]
}

function redis() {
    return [
        {
            title: "Redis",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Redis数据结构为什么既省内存又高效.md",
                "单线程的Redis为什么能支持10w+的QPS.md",
                "Redis持久化策略详解（一）.md",
                "Redis持久化策略详解（二）.md",
                "如何实现分布式锁.md",
                "详解Redis超实用工具类库Redisson.md",
                "Redis哨兵机制.md",
                "缓存淘汰策略.md",
                "Redis有哪些慢操作.md"
            ]
        }
    ]
}

function algorithm() {
    return [
        {
            title: "开篇词",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "开篇：拒绝盲目刷题，如何更高效的学习算法.md"
            ]
        },
        {
            title: "数据结构篇",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "复杂度分析：如何进行时间复杂度和空间复杂度分析.md",
                "排序：十大经典排序算法有哪些应用.md",
                "排序：如何手写堆排序.md",
                "栈：从普通栈到单调栈.md",
                "队列：从普通队列到单调队列.md",
                "树：熟练手写树的四种遍历方式.md",
                "链表：指针操作有点乱？这些技巧要记好.md",
                "哈希：更高效的查找.md",
            ]
        },
        {
            title: "算法篇",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "位操作：省时间，省空间，提效率.md",
                "递推和递归：一个自下而上，一个自上而下.md",
                "贪心：每次都选局部最优解.md",
                "二分查找：如何优雅的确定搜索区间.md",
                "回溯：就是一个遍历决策树的过程.md",
                "搜索：DFS和BFS遍历图的方式有哪些不同.md",
                "动态规划：更高效的穷举.md",
            ]
        }
    ]
}