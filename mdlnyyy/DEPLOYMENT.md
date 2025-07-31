# GitHub Pages 部署指南

## 快速部署步骤

### 1. 准备GitHub仓库

1. 在GitHub上创建一个新的仓库
2. 将此项目的所有文件上传到仓库根目录

### 2. 启用GitHub Pages

1. 进入仓库的 **Settings** 页面
2. 在左侧菜单中找到 **Pages**
3. 在 **Source** 部分选择 **Deploy from a branch**
4. 选择 **main** 分支（或 **master** 分支）
5. 选择 **/ (root)** 作为文件夹
6. 点击 **Save**

### 3. 等待部署完成

- GitHub会自动构建和部署您的网站
- 通常需要几分钟时间
- 部署完成后，您会看到一个绿色的链接，类似：`https://yourusername.github.io/repository-name`

## 自动部署（推荐）

本项目已配置了GitHub Actions自动部署：

- 每次推送到main/master分支时自动部署
- 配置文件：`.github/workflows/deploy.yml`
- 无需手动操作，推送代码即可自动更新网站

## 自定义域名（可选）

如果您有自己的域名：

1. 将 `CNAME.template` 重命名为 `CNAME`
2. 在 `CNAME` 文件中写入您的域名（如：`madeline-fansite.com`）
3. 在您的域名提供商处设置DNS记录指向GitHub Pages

## 本地开发

### 方法1：使用Python（推荐）
```bash
# Windows
start-server.bat

# Linux/Mac
./start-server.sh

# 或直接运行
python -m http.server 8000
```

### 方法2：使用Node.js
```bash
npx serve .
```

### 方法3：使用PHP
```bash
php -S localhost:8000
```

## 文件结构说明

```
├── index.html              # 网站首页
├── encyclopedia.html       # 角色百科页面
├── gallery.html           # 同人广场页面
├── guide.html             # 攻略中心页面
├── login.html             # 登录页面
├── register.html          # 注册页面
├── 404.html              # 404错误页面
├── _next/                # 静态资源目录
│   └── static/
│       ├── css/          # 样式文件
│       ├── chunks/       # JavaScript文件
│       └── media/        # 字体和媒体文件
├── *.svg, *.jpg          # 图片资源
├── README.md             # 项目说明
├── .gitignore            # Git忽略文件
├── .github/              # GitHub配置
│   └── workflows/
│       └── deploy.yml    # 自动部署配置
├── start-server.bat      # Windows启动脚本
├── start-server.sh       # Linux/Mac启动脚本
└── CNAME.template        # 自定义域名模板
```

## 常见问题

### Q: 网站显示404错误
A: 确保所有文件都在仓库根目录，并且GitHub Pages设置为从根目录部署。

### Q: 样式或图片无法加载
A: 检查文件路径是否正确，确保所有资源文件都已上传到仓库。

### Q: 自动部署失败
A: 检查 `.github/workflows/deploy.yml` 文件是否存在，并确保仓库有Pages权限。

### Q: 如何更新网站内容
A: 直接编辑HTML文件并推送到GitHub，网站会自动更新。

## 技术支持

如果遇到问题，可以：
1. 检查GitHub Actions的运行日志
2. 查看浏览器开发者工具的控制台错误
3. 确认所有文件路径和链接是否正确

## 许可证

MIT License - 您可以自由使用、修改和分发此项目。