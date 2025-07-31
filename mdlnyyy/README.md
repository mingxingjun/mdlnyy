# 玛德蕾娜应援网站

这是一个专为玛德蕾娜粉丝打造的应援网站，包含角色百科、同人广场和攻略中心三大板块。

## 功能特色

- 🏠 **首页** - 欢迎页面和网站导航
- 📚 **角色百科** - 深入了解玛德蕾娜的背景故事和设定
- 🎨 **同人广场** - 粉丝创作作品展示
- 🎯 **攻略中心** - 游戏攻略和技巧分享
- 👤 **用户系统** - 登录注册功能

## 技术栈

- HTML5 + CSS3
- JavaScript (ES6+)
- Tailwind CSS
- 响应式设计

## 部署

本网站已配置为可直接在GitHub Pages上部署：

1. Fork 或下载此仓库
2. 在GitHub仓库设置中启用GitHub Pages
3. 选择从根目录部署
4. 访问生成的GitHub Pages URL

## 本地开发

```bash
# 启动本地服务器
python -m http.server 8000

# 或使用Node.js
npx serve .

# 访问 http://localhost:8000
```

## 文件结构

```
├── index.html          # 首页
├── encyclopedia.html   # 角色百科
├── gallery.html        # 同人广场
├── guide.html          # 攻略中心
├── login.html          # 登录页面
├── register.html       # 注册页面
├── 404.html           # 404错误页面
├── _next/             # 静态资源
│   └── static/
│       ├── css/       # 样式文件
│       ├── chunks/    # JavaScript文件
│       └── media/     # 字体文件
└── *.svg, *.jpg       # 图片资源
```

## 贡献

欢迎提交Issue和Pull Request来改进这个网站！

## 许可证

MIT License