---
layout: post
title: 假如你在项目中定义一个String类，程序用jdk的还是你定义的？
lock: need
---

# 面试官：假如你在项目中定义一个String类，程序用jdk的还是你定义的？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210228194640259.jpg?)

## 前言
我原来面试的时候被问过一个这样的问题，**如果在你项目中建一个java.lang.String的类，那系统中用的String类是你定义的String类，还是原生api中的String类？**

你可以试一下，发现最终系统中用的还是原生api中的String类，为什么会出现这种情况呢？这还得从类的加载过程说起。

![在这里插入图片描述](https://img-blog.csdn.net/20180919115820370?)

我们都知道Java是跨平台的，是因为不同平台下的JVM能将字节码文件解释为本地机器指令，JVM是怎么加载字节码文件的？答案就是ClassLoader，先来打印看一下ClassLoader对象

```java
public class ClassLoaderDemo1 {

    public static void main(String[] args) {
        // null
        System.out.println(String.class.getClassLoader());
        ClassLoader loader = ClassLoaderDemo1.class.getClassLoader();
        while (loader != null) {
            // sun.misc.Launcher$AppClassLoader@58644d46
            // sun.misc.Launcher$ExtClassLoader@7ea987ac
            System.out.println(loader);
            loader = loader.getParent();
        }
    }
}
```
### 双亲委派模型

要理解这个输出，我们就得说一下双亲委派模型，**如果一个类加载器收到了类加载请求，它并不会自己先去加载，而是把这个请求委托给父类的加载器去执行，如果父类加载器还存在其父类加载器，则进一步向上委托，依次递归，请求最终将到达顶层的启动类加载器，如果父类加载器可以完成类加载任务，就成功返回，倘若父类加载器无法完成此加载任务，子加载器才会尝试自己去加载，这就是双亲委派模式**，即每个儿子都很懒，每次有活就丢给父亲去干，直到父亲说这件事我也干不了时，儿子自己想办法去完成。**双亲委派模式中的父子关系并非通常所说的类继承关系，而是采用组合关系来复用父类加载器的相关代码**。

采用双亲委派模式的是好处是Java类随着它的类加载器一起具备了一种带有优先级的层次关系，通过这种层级关可以**避免类的重复加载**，当父亲已经加载了该类时，就没有必要子ClassLoader再加载一次。

**其次是考虑到安全因素，java核心api中定义类型不会被随意替换**，假设通过网络传递一个名为java.lang.Integer的类，通过双亲委托模式传递到启动类加载器，而启动类加载器在核心Java API发现这个名字的类，发现该类已被加载，并不会重新加载网络传递的过来的java.lang.Integer，而直接返回已加载过的Integer.class，这样便可以防止核心API库被随意篡改。

检查和加载过程以及系统提供的ClassLoader的作用如下图。文章一开始的问题，用双亲加载来解释就很容易理解用的是原生api中的String类

![在这里插入图片描述](https://img-blog.csdn.net/20180919003434512?)

类加载器的关系如下：

 1. 启动类加载器，由C++实现，没有父类。
 2. 拓展类加载器(ExtClassLoader)，由Java语言实现，父类加载器为null
 4. 应用程序类加载器(AppClassLoader)，由Java语言实现，父类加载器为ExtClassLoader系统类加载器(AppClassLoader)，由Java语言实现，父类加载器为ExtClassLoader
 5. 用户自定义类加载器，父类加载器肯定为AppClassLoader。自定义类加载器，父类加载器肯定为AppClassLoader。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210712164736333.jpg)

### 破坏双亲委派模型
**但是由于加载范围的限制，顶层的ClassLoader无法访问底层的ClassLoader所加载的类。所以此时需要破坏双亲委派模型**，以JDBC为例，讲一下为什么要破坏双亲委派模型

#### 不使用Java SPI
当我们刚开始用JDBC操作数据库时，你一定写过如下的代码。先加载驱动实现类，然后通过DriverManager获取数据库链接
```java
Class.forName("com.mysql.jdbc.Driver");
Connection conn = DriverManager.getConnection("jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false", "test", "test");
```

```java
public class Driver extends NonRegisteringDriver implements java.sql.Driver {
    public Driver() throws SQLException {
    }

    static {
        try {
            DriverManager.registerDriver(new Driver());
        } catch (SQLException var1) {
            throw new RuntimeException("Can't register driver!");
        }
    }
}
```
在Driver类中向DriverManager注册对应的驱动实现类
#### 使用Java SPI
在JDBC4.0以后，开始支持使用SPI的方式来注册这个Driver，具体做法就是在mysql的jar包中的META-INF/services/java.sql.Driver 文件中指明当前使用的Driver是哪个。

**SPI就是策略模式，根据配置来决定运行时接口的实现类是哪个**

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210712182749503.png?)

**这样当使用不同的驱动时，我们不需要手动通过Class.forName加载驱动类，只需要引入相应的jar包即可**。于是上面的代码就可以改成如下形式

```java
Connection conn = DriverManager.getConnection("jdbc:mysql://myhost/test?useUnicode=true&characterEncoding=utf-8&useSSL=false", "test", "test");
```
**那么对应的驱动类是何时加载的呢？**
1. 我们从META-INF/services/java.sql.Driver文件中获取具体的实现类“com.mysql.jdbc.Driver”
2. 通过Class.forName("com.mysql.jdbc.Driver")将这个类加载进来

DriverManager是在rt.jar包中，所以DriverManager是通过启动类加载器加载进来的。而Class.forName()加载用的是调用者的ClassLoader，所以如果用启动类加载器加载com.mysql.jdbc.Driver，肯定加载不到（**因为一般情况下启动类加载器只加载rt.jar包中的类哈**）。

**如何解决呢？**

想让顶层的ClassLoader加载底层的ClassLoader，只能破坏双亲委派机制。来看看DriverManager是怎么做的

DriverManager加载时，会执行静态代码块，在静态代码块中，会执行loadInitialDrivers方法。
而这个方法中会加载对应的驱动类。

```java
public class DriverManager {

    static {
        loadInitialDrivers();
        println("JDBC DriverManager initialized");
    }

    private static void loadInitialDrivers() {

        // 省略部分代码
        AccessController.doPrivileged(new PrivilegedAction<Void>() {
            public Void run() {

                // 根据配置文件加载驱动实现类
                ServiceLoader<Driver> loadedDrivers = ServiceLoader.load(Driver.class);
                Iterator<Driver> driversIterator = loadedDrivers.iterator();

                try{
                    while(driversIterator.hasNext()) {
                        driversIterator.next();
                    }
                } catch(Throwable t) {
                // Do nothing
                }
                return null;
            }
        });

        // 省略部分代码
    }

}
```
我们就看他使用的是哪种类型的ClassLoader，可以看到通过执行Thread.currentThread().getContextClassLoader()获取了线程上下文加载器

**线程上下文类加载器可以通过Thread.setContextClassLoader()方法设置，默认是应用程序类加载器（AppClassLoader）**

```java
// ServiceLoader#load
public static <S> ServiceLoader<S> load(Class<S> service) {
    ClassLoader cl = Thread.currentThread().getContextClassLoader();
    return ServiceLoader.load(service, cl);
}
```

ExtClassLoader和AppClassLoader都是通过Launcher类来创建的，在Launcher类的构造函数中我们可以看到线程上下文类加载器默认是AppClassLoader
```java
public class Launcher {

    public Launcher() {
        Launcher.ExtClassLoader var1;
        try {
            var1 = Launcher.ExtClassLoader.getExtClassLoader();
        } catch (IOException var10) {
            throw new InternalError("Could not create extension class loader", var10);
        }

        try {
            this.loader = Launcher.AppClassLoader.getAppClassLoader(var1);
        } catch (IOException var9) {
            throw new InternalError("Could not create application class loader", var9);
        }

        // 设置线程上下文类加载器为AppClassLoader
        Thread.currentThread().setContextClassLoader(this.loader);

        // 省略部分代码

    }
}    
```

**很明显，线程上下文类加载器让父类加载器能通过调用子类加载器来加载类，这打破了双亲委派模型的原则**

## 自定义类加载器
### 为什么要自定义类加载器？

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210712154926158.jpg?)

### ClassLoader实现
**Java提供了抽象类java.lang.ClassLoader，所有用户自定义的类加载器都应该继承ClassLoader类**，所以我们先看一下ClassLoader的逻辑，看一下它加载类的主要逻辑

**我截取了3个重要的方法**

1. loaderClass：实现双亲委派
2. findClass：用来复写加载，即根据传入的类名，返回对应的Class对象
3. defineClass：本地方法，最终加载类只能通过defineClass
```java
// 从这方法开始加载
public Class<?> loadClass(String name) throws ClassNotFoundException {
    return loadClass(name, false);
}
```
```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // First, check if the class has already been loaded
        // 先从缓存查找该class对象，找到就不用重新加载
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                if (parent != null) {
                    // 如果加载不到，委托父类去加载   
                    // 这里体现了自底向上检查类是否已经加载                   
                    c = parent.loadClass(name, false);
                } else {
                    // 如果没有父类，委托启动加载器去加载
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // 这里体现了自顶向下尝试加载类，当父类加载加载不到时
                // 会抛出ClassNotFoundException
                // from the non-null parent class loader
            }

            if (c == null) {
                // If still not found, then invoke findClass in order
                // to find the class.
                long t1 = System.nanoTime();
                // 如果都没有找到，通过自己的实现的findClass去加载
                // findClass方法没有找到会抛出ClassNotFoundException
                c = findClass(name);

                // this is the defining class loader; record the stats
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        // 是否需要在加载时进行解析
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```
findClass用来复写加载
```java
protected Class<?> findClass(String name) throws ClassNotFoundException {
    throw new ClassNotFoundException(name);
}
```
### 如何自定义类加载器？

**Java提供了抽象类java.lang.ClassLoader，所有用户自定义的类加载器都应该继承ClassLoader类**

在自定义类加载器的时候，常见的做法有如下两种

1. 重写loadClass方法
2. 重写findClass方法

**但是一般情况下重写findClass方法即可，不重写loadClass方法。** 因为loadClass是用来实现双亲委派模型的地方，修改这个方法会造成模型被破坏，容易操作问题。所以我们一般情况下重写findClass方法即可，根据传入的类名，返回对应的Class对象

下面我们就自己手写一个ClassLoader，从指定文件中加载class文件

```java
public class DemoObj {

    public String toString() {
        return "I am DemoObj";
    }

}
```
javac生成相应的class文件，放到指定目录，然后由FileClassLoader去加载
```java
public class FileClassLoader extends ClassLoader {

    // class文件的目录
    private String rootDir;

    public FileClassLoader(String rootDir) {
        this.rootDir = rootDir;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] classData = getClassData(name);
        if (classData == null) {
            throw new ClassNotFoundException();
        } else {
            return defineClass(name, classData, 0, classData.length);
        }
    }

    private byte[] getClassData(String className) {

        String path = rootDir + File.separatorChar + className.replace('.', File.separatorChar) + ".class";
        try {
            InputStream ins = new FileInputStream(path);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            int bufferSize = 4096;
            byte[] buffer = new byte[bufferSize];
            int bytesNumRead = 0;
            while ((bytesNumRead = ins.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesNumRead);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static void main(String[] args) {

        String rootDir = "/Users/peng/study-code/java-learning/src/main/java";
        FileClassLoader loader = new FileClassLoader(rootDir);

        try {
            // 传入class文件的全限定名
            Class<?> clazz = loader.loadClass("com.javashitang.classloader.DemoObj");
            // com.javashitang.classloader.FileClassLoader@1b28cdfa
            System.out.println(clazz.getClassLoader());
            // I am DemoObj
            System.out.println(clazz.newInstance().toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```
### 自定义加载器的应用
可以对class文件进行加密和揭秘，实现应用的热部署，实现应用隔离等。以Tomcat中的ClassLoader为例演示一下

在解释防止类重名作用前先抛出一个问题，**Class对象的唯一标识能否只由全限定名确定？**

答案是不能，因为你无法保证多个项目间不出现相同全限定名的类

**JVM判断2个类是否相同的条件是**

1. 全限定名相同
2. 由同一个类加载器加载

我们用上面写的FileClassLoader来验证一下
```java
String rootDir = "/Users/peng/study-code/java-learning/src/main/java";
FileClassLoader loader1 = new FileClassLoader(rootDir);
FileClassLoader loader2 = new FileClassLoader(rootDir);

Class class1 = loader1.findClass("com.javashitang.classloader.DemoObj");
Class class2 = loader2.findClass("com.javashitang.classloader.DemoObj");

// false
System.out.println(class1 == class2);
```
运行时数据区的分布如下

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210713173621996.png?)

**Tomcat中就定义了很多ClassLoader来实现应用的隔离**

在Tomcat中提供了一个Common ClassLoader，它主要负责加载Tomcat使用的类和Jar包以及应用通用的一些类和Jar包，例如CATALINA_HOME/lib目录下的所有类和Jar包。

Tomcat会为每个部署的应用创建一个唯一的类加载器，也就是WebApp ClassLoader，它负责加载该应用的WEB-INF/lib目录下的Jar文件以及WEB-INF/classes目录下的Class文件。**由于每个应用都有自己的WebApp ClassLoader，这样就可以使不同的Web应用之间相互隔离，彼此之间看不到对方使用的类文件。即使不同项目下的类全限定名有可能相等，也能正常工作**。

![在这里插入图片描述](https://img-blog.csdn.net/20180919011308851?)

而对应用进行热部署时，会抛弃原有的WebApp ClassLoader，并为应用创建新的WebApp ClassLoader。
