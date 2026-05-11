---
layout: post
title: claude code 使用教程
lock: need
---
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/31357a700dda4a1fb6028292d68cc01a.png)
# 常用操作
输入cluade命令即可打开

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c138d4ea54c44f34a1b104ba30fb1e88.png)

? for shortcuts 代表处于默认模式

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e60d6c199020451fa2da11bd9e67af2c.png)


生成完毕会有如下选项

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b6426c5c9d2a4968acac3590201b29b9.png)

1. 创建，后续的每次创建还需要询问
2. 创建，后续的创建操作不需要询问
3. 不创建

我们选2，创建完毕，注意下面的提示词变了

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f565540620be423d9462c243a2a1941b.png)

这就不得不提到 Claude code有三种模式，我们可以使用shift +tab在三种模式间循环

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b88cba4471994f53b33d0ae47007edeb.png)

我们可以输入!，然后再输入命令，就可以直接执行shell命令

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/330c4ef95df9471d8c8e3bbcfba83021.png)

五子棋游戏我们现在生成好了

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/eaaa75bd7b964efaa3c390a4235e72cf.png)

我们切换到规划模式，修改一下这个游戏

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/671a55b29d2f4a6b8af0036a2c5d3313.png)

如何在claude code输入框中换行？

1. shift + enter 换行
2. 行末加 \ 然后按 enter


给我们输出方案后需要我们确认一下

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6fba7e780c424862aedb0d8dd1843270.png)


1. 执行计划，后续修改文件不用再询问用户了
2. 执行计划，后续会使用默认的模式，即后续每次修改文件都需要询问用户
3. 继续修改计划

可以看到目前的修改已经符合预期了

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8bf96d34cc3a4dcbba659a3487f31f10.png)


我们如果想回滚到某个版本应该怎么办呢？

Claude code对我们的每次操作都会创建一个回滚点

我们可以按2下esc，选择对应的回滚点，即可回滚

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/36b158af1ed14d2ab2dff7fe81e33962.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/da09c66b44c94376805075bdb7ffa0cb.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7eba8cea4772478d879577ba0ad6d708.png)


1. 回滚代码和会话
2. 只回滚会话
3. 只回滚代码
4. 从当前位置开始，对对话或代码进行总结（用于生成摘要或减少上下文长度）
5. 什么都不做



我们选择1，此时再打开页面就没有回合，步数和时间的显示了

# 常用命令

| 命令            | 作用                                                                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /mcp          | 列出安装的mcp                                                                                                                                                                                                                                                                                                                                |
| /skills       | 列出安装的skill                                                                                                                                                                                                                                                                                                                              |
| /plugin       | 进入插件管理器                                                                                                                                                                                                                                                                                                                                 |
| /compact      | 对上下文进行压缩                                                                                                                                                                                                                                                                                                                                |
| /clear        | 清空所有上下文内容                                                                                                                                                                                                                                                                                                                               |
| /init         | 在当前文件夹写生成一个CLAUDE.md文件<br />（CLAUDE.md文件用来存希望claude每次读取的信息）                                                                                                                                                                                                                                                                             |
| /memory<br /> | 打开CLAUDE.md文件，有2个级别用户级别和项目级别<br />如果都配置的话，都会生效<br />内容不冲突，都生效<br />内容冲突，项目级覆盖用户级![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0d0126599a05434e86770c75de6d8b99.png)                                                                                                                                                                                                                                                                                                                          
# plugin

将一系列的skill subagent hook等能力打包在一起，可以一键安装

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ffca509826d346c89d2baf84abd10261.png)

| 标题           | 作用     |
| ------------ | ------ |
| discover     | 发现新插件  |
| installed    | 已安装的插件 |
| marketplaces | 插件市场   |

