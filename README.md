# 角色应援网站

一个专为角色粉丝打造的静态应援网站，展示角色魅力、凝聚粉丝共鸣、提供应援工具。

## 🌟 功能特色

- **响应式设计** - 完美适配桌面端、平板和手机
- **现代化UI** - 美观的渐变色彩和流畅的动画效果
- **完整页面** - 首页、角色档案、名场面回顾、粉丝社区、应援资源、关于我们
- **交互丰富** - 轮播图、筛选功能、动画效果、表单验证
- **易于部署** - 纯静态页面，可直接部署到GitHub Pages

## 📁 项目结构

```
角色应援网站/
├── index.html          # 首页
├── profile.html        # 角色档案页
├── moments.html        # 名场面回顾页
├── community.html      # 粉丝社区页
├── resources.html      # 应援资源页
├── about.html          # 关于我们页
├── css/
│   ├── style.css       # 全局样式
│   ├── profile.css     # 角色档案页样式
│   ├── moments.css     # 名场面回顾页样式
│   ├── community.css   # 粉丝社区页样式
│   ├── resources.css   # 应援资源页样式
│   └── about.css       # 关于我们页样式
├── js/
│   ├── script.js       # 全局JavaScript
│   ├── moments.js      # 名场面回顾页脚本
│   ├── community.js    # 粉丝社区页脚本
│   ├── resources.js    # 应援资源页脚本
│   └── about.js        # 关于我们页脚本
└── README.md           # 项目说明文档
```

## 🚀 部署到GitHub Pages

### 方法一：通过GitHub网页界面

1. 在GitHub上创建新仓库
2. 将所有文件上传到仓库
3. 进入仓库设置 (Settings)
4. 找到 "Pages" 选项
5. 在 "Source" 中选择 "Deploy from a branch"
6. 选择 "main" 分支和 "/ (root)" 文件夹
7. 点击 "Save"
8. 等待几分钟，访问提供的URL

### 方法二：通过Git命令行

```bash
# 1. 初始化Git仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交文件
git commit -m "Initial commit: 角色应援网站"

# 4. 添加远程仓库（替换为你的仓库URL）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 5. 推送到GitHub
git branch -M main
git push -u origin main

# 6. 在GitHub仓库设置中启用Pages
```

## 🎨 自定义指南

### 更换角色主题

1. **颜色主题**：修改 `css/style.css` 中的CSS变量
```css
:root {
    --primary-color: #667eea;    /* 主色调 */
    --secondary-color: #764ba2;  /* 辅助色 */
    --accent-color: #f093fb;     /* 强调色 */
}
```

2. **角色信息**：修改各HTML文件中的角色相关内容
   - 角色姓名、出处、生日等基础信息
   - 角色故事时间轴
   - 名台词和名场面
   - 应援口号

3. **图片素材**：
   - 角色立绘：建议尺寸 800x1200px
   - 场景截图：建议尺寸 1920x1080px
   - 头像图片：建议尺寸 200x200px
   - 壁纸素材：提供多种尺寸

### 添加图片素材

由于这是静态页面模板，图片路径已预留，你需要：

1. 创建 `images` 文件夹
2. 添加以下类型的图片：
   - `character/` - 角色相关图片
   - `moments/` - 名场面截图
   - `community/` - 社区作品
   - `wallpapers/` - 壁纸素材
   - `avatars/` - 头像素材

3. 更新HTML文件中的图片路径

## 📱 页面功能说明

### 首页 (index.html)
- 角色展示横幅
- 角色高光卡片
- 应援动态时间轴
- 粉丝心声轮播

### 角色档案页 (profile.html)
- 角色基础信息卡
- 成长历程时间轴
- 经典台词合集
- 人物关系图

### 名场面回顾页 (moments.html)
- 场面分类筛选
- 瀑布流布局
- 场面详情展示
- 粉丝评论区

### 粉丝社区页 (community.html)
- 同人作品展示
- 作品分类筛选
- 应援口号集
- 线下活动合影

### 应援资源页 (resources.html)
- 壁纸素材下载
- 头像素材下载
- 应援模板下载
- 投票指南

### 关于我们页 (about.html)
- 网站介绍
- 团队成员
- 网站数据统计
- 联系方式和反馈

## 🛠️ 技术栈

- **HTML5** - 语义化标签
- **CSS3** - Flexbox、Grid、动画
- **JavaScript** - ES6+、DOM操作
- **Font Awesome** - 图标库
- **响应式设计** - 移动端适配

## 📄 许可证

本项目仅供学习和个人使用，请遵守相关版权法规。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系我们

如有问题或建议，请通过以下方式联系：
- 邮箱：zjz66278@gmail.com
- QQ群：123456789

---

**注意**：这是一个静态网站模板，部分功能（如表单提交、文件下载等）需要后端支持才能完全实现。当前版本提供了完整的前端交互体验。