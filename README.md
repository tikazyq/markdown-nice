<div align="center">
<a href="https://mdnice.com">
<img width="500" src="https://files.mdnice.com/logo.svg"/>
</a>
</div>
<h1 align="center">Markdown Nice</h1>

## 简介

- 支持自定义样式的 Markdown 编辑器
- 支持微信公众号、知乎和稀土掘金
- 欢迎[在线使用](https://mdnice.com/)
- 有疑问请参考 [如何有效的解决 mdnice 相关问题？](https://github.com/mdnice/markdown-nice/issues/163)

## CLI 和 API

除了在线编辑器，还提供了命令行工具和 API 服务器：

**命令行工具（CLI）**
```bash
# 转换 Markdown 文件为微信公众号 HTML
node cli.js input.md -o output.html

# 转换为知乎格式
node cli.js input.md -p zhihu -o output.html

# 查看帮助
node cli.js --help
```

**API 服务器**
```bash
# 启动 API 服务器
npm run api-server

# 使用 API 转换
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello", "platform": "wechat"}'
```

详细文档请参考 [API.md](./API.md)

## 主题

[Markdown Nice 主题列表](https://product.mdnice.com/themes/)

> 欢迎提交主题，提供更多文章示例~~

## 关于

`mdnice`组建了**推文群**，欢迎反馈意见和公众号大佬们一起交流，关注公众号回复「排版」拉你入群。

| 入群码                                                                                           |
| ------------------------------------------------------------------------------------------------ |
| <img width="360px" src="https://files.mdnice.com/pic/cd3ca20c-896f-4cfc-9bdd-c4c58e69ba26.jpg"/> |

## 友情链接

- [BlogHelper](https://github.com/ystcode/BlogHelper)：一键发布本地文章到主流博客平台的托盘助手
- [qrbtf](https://github.com/ciaochaos/qrbtf)：艺术二维码生成器
- [编程如画](https://draw.mdnice.com/)：「编程如画」博客
