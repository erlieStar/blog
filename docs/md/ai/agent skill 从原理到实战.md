---
layout: post
title: agent skill 从原理到实战
lock: need
---

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e010b80fa4c3421b916e7619e0b6ab65.png)
# 基本用法

Agent skill是给大模型看的说明文档，那agent是从哪个文件夹读取skill文档呢？

以cursor为例，cursor会从如下目录中加载skill文档

| 位置                                                                                 | 作用域                                |
| ---------------------------------------------------------------------------------- | ---------------------------------- |
| .agents/skills/<br />.cursor/skills/                                               | 项目级                                |
| \~/.agents/skills/<br />\~/.cursor/skills/                                         | 用户级 (全局)<br />                     |
| .claude/skills/<br />.codex/skills/<br />\~/.claude/skills/<br />\~/.codex/skills/ | 为了兼容cursor还会从claude和codex目录加载skill |

每个skill为一个包含SKILL.md文件的文件夹，文件夹的名字则是skill的名字

```plain&#x20;text
.agents/
└── skills/
    └── my-skill/
        └── SKILL.md
```

技能还可以包含脚本、参考文件和资源等可选目录，这个我们后面会介绍

```plain&#x20;text
.agents/
└── skills/
    └── deploy-app/
        ├── SKILL.md
        ├── scripts/
        │   ├── deploy.sh
        │   └── validate.py
        ├── references/
        │   └── REFERENCE.md
        └── assets/
            └── config-template.json
```



skill的执行流程如下图所示

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/53ecb83f3c674d8e9e5d2adf6819eb95.png)


我们写一个简单的skill，用来统计一段文本中出现的人物，目录结构如下

```plain&#x20;text
.claude
└── skills
    └── count
        ├── references
        │   └── info.md
        ├── scripts
        │   └── save.py
        └── SKILL.md
```

SKILL.md

````yaml
---
name: count
description: 统计出现的人数
---

# 统计出现的人数

## 简介

根据文本，统计出现的人数

如果需要获取人物的年龄信息，则读取本目录下references/info.md文件
如果需要保存，则执行本目录下的scripts/save.py

```python
python3 save.py "要保存的内容"
```

## 示例

输入：
小红和小明出去玩了

输出：
总共出现了2个人，分别为小红，小明

如果需要输出人物的年龄信息，则输出如下
总共出现了2个人，分别为小红，小明
| 名字 | 信息 |
|------|------|
| 小红 | 18岁 |
| 小明 | 20岁 |
````

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/4c7f151fe0134fee868a762e1a051b9b.png)

可以看到agent加载了需要的skill并进行了应用，当然我们可以直接指定需要的skill

/skill的名字再加上用户的输入即可

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1c1c56fada98437d84067c2a1cf0a27b.png)
# 高级用法

## references

info.md

```python
# 个人信息

| 物品 | 价格 |
|-----|-----|
| 小红 | 18岁|
| 小明 | 20岁 |
| 小白 | 20岁 |
```

可以按需读取参考文档，如下图，加载了info.md，并输出了人物的年龄信息

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9f4a3797cc2c4fe6bd6a0e06002eaca4.png)
## scripts

save.py

```python
import sys

def main():
    
    content = sys.argv[1]
    print("📝 要保存的内容为：")
    print(content)

if __name__ == '__main__':
    main()
```

还可以执行特定的脚本，这个脚本简单打印了一下要保存的内容，就不实际进行保存操作了

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/029b088c08d8446497abe4e0b1358420.png)
# 渐进式披露原则

agent并不会把一开始就把skill的所有内容都传给大模型，而是按需加载
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3034564f47774125a9f71391e72aef32.png)
# mcp 和 agent skill 的区别


| 技术          | 作用         |
| ----------- | ---------- |
| mcp         | 给大模型提供数据   |
| Agent skill | 教大模型如何处理数据 |

skill不用我们自己写也行，可以描述内容，让大模型自己生成。我们也可以安装别人写好的skill

