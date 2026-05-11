---
layout: post
title: mcp指南
lock: need
---

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e6db5a7435b348929af33f9d257d8493.png)
# 什么是mcp

mcp，全称 **Model Context Protocol（模型上下文协议）**

它是一个让大模型能够统一接入外部工具、数据和能力的标准协议



有很多mcp广场

https://modelscope.cn/mcp（魔搭社区，mcp广场）

https://mcpmarket.com/zh（mcp market）



找了一个操作redis的mcp

https://modelscope.cn/mcp/servers/@modelcontextprotocol/redis

直接让 claude code 帮我配置

```json
帮我配置一下这个mcp
{
  "mcpServers": {
    "redis": {
      "args": [
        "-y",
        "@modelcontextprotocol/server-redis",
        "redis://127.0.0.1:6379"
      ],
      "command": "npx"
    }
  }
}
```

重启claude服务，执行/mcp命令，看到mcp服务正常，mcp配置到/Users/li/demo/.mcp.json这个文件中

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ea98f135c0044111b74b44453e76d7ec.png)


使用一下这个mcp服务

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6d2845142db4457ea045848968698c7a.png)


举个例子，当我们需要大模型排查问题时，大模型可能需要某些数据才能更精确的定位问题，比如数据库中的数据，配置中心的配置，相关的日志，有了mcp之后，大模型就可以按需调用mcp工具获取数据，提高了排查问题的效率



mcp有如下几种传输方式

| 传输方式            | 本地/远程 | 特点        |
| --------------- | ----- | --------- |
| stdio           | 本地    | 最简单       |
| sse             | 远程    | 早期方案，逐渐减少 |
| streamable http | 远程    | 官方推荐的新方案  |

npx表明这是一个node写的mcp server，如果是nvx则表明是python写的mcp server

# 如何开发一个mcp

我们用python开发一个mcp服务

```shell
// 安装 mcp sdk
pip3 install mcp
```

server.py

```python
import base64

from mcp.server.fastmcp import FastMCP

# 创建 MCP Server
mcp = FastMCP("crypto-mcp")

@mcp.tool()
def encrypt(text: str) -> str:
    """
    对文本进行加密
    """
    encoded = base64.b64encode(
        text.encode("utf-8")
    ).decode("utf-8")

    return encoded


@mcp.tool()
def decrypt(cipher_text: str) -> str:
    """
    对密文进行解密
    """
    decoded = base64.b64decode(
        cipher_text.encode("utf-8")
    ).decode("utf-8")

    return decoded


if __name__ == "__main__":
    # stdio 模式启动
    mcp.run()
```

我们手动修改一下/Users/li/demo/.mcp.json，加入相关配置

```json
{
  "mcpServers": {
    "redis": {
      "args": [
        "-y",
        "@modelcontextprotocol/server-redis",
        "redis://127.0.0.1:6379"
      ],
      "command": "npx"
    },
    "crypto": {
      "command": "python3",
      "args": [
        "/Users/li/demo/server.py"
      ]
    }
  }
}
```

重启一下claude code，输入/mcp可以看到加解密服务正常启动了

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d2ff3a856eed4c56826e7497441578d5.png)

我们测试一下加密，可以看到用了我们写的mcp工具，输出结果为aGVsbG8=

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/717a3e217b924fc7af9e80b399409a08.png)

我们再测试一下解密

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0448f438ee08407091654960a43c2568.png)

解密结果为hello，符合预期



