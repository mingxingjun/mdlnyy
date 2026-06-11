# UniFlow（优流备考）

> 大学生 AI 多智能体期末备考平台 —— 6 大独立 AI Agent 助你高效复习

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r173-000000?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5-433E3F)](https://zustand.docs.pmnd.rs/)

---

## 预览

<img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20study%20dashboard%20with%20neon%20blue%20and%20purple%20colors%2C%20floating%203D%20geometric%20particles%2C%20glass%20morphism%20cards%2C%20dark%20theme%2C%20AI%20assistant%20interface%2C%20futuristic%20UI%20design%2C%20highest%20quality&image_size=landscape_16_9" alt="UniFlow Preview" width="100%">

## 核心特性

### 6 大 AI Agent

每个 Agent 拥有独立身份、系统提示词和专属技能，可接入 DeepSeek / Ollama / OpenAI 等多种模型：

| Agent | 身份 | 核心能力 |
|-------|------|---------|
| 🧠 **智识** | 知识提取专家 | 从教材/PDF 中提取核心考点和知识框架 |
| 🃏 **卡片师** | 闪卡生成大师 | 基于主动回忆原理自动生成 Q&A 记忆闪卡 |
| 🔍 **搜知** | 全网搜索官 | 搜索 B站/知乎/CSDN 等平台整合学习资源 |
| 📅 **艾宾** | 复习规划师 | 基于艾宾浩斯遗忘曲线制定科学复习计划 |
| 👨‍🏫 **考官** | 模拟考试教练 | 生成模拟试卷、批改答案、分析薄弱环节 |
| 💡 **费曼** | 费曼学习导师 | 用最简单的话解释复杂概念，发现知识盲区 |

### AI 模型配置

- **DeepSeek V4 Pro**（默认）— 高性价比中文大模型
- **Ollama 本地模型** — 支持 qwen2.5 / llama 等本地部署，零成本零延迟
- **OpenAI Compatible** — 支持 GPT-4o-mini 等
- **自定义端点** — 任意 OpenAI 兼容 API
- **Token 优化**：响应缓存 + Prompt 压缩 + 用量统计

### 四大功能模块

| 模块 | 功能 |
|------|------|
| **高光仪表盘** | 考试倒计时、科目进度追踪、盲区热力图 |
| **AI 冲刺核** | 6 Agent 控制台 + 模型配置 + 对话管理 |
| **我的笔记** | 笔记上传/编辑/标签管理，Markdown 内容支持 |
| **沉浸流空间** | 番茄钟计时器、6 种白噪音、虚拟自习室 |

### 3D 赛博朋克视觉

- 800 粒子数据雨动态背景（Three.js + R3F）
- 浮动线框几何体（八面体/二十面体/环面）
- 霓虹光晕 + 毛玻璃卡片 + 便当盒布局
- 深色主题极客风格

### 研究技巧引擎

- **SM-2 间隔重复算法**：基于艾宾浩斯曲线自动计算复习间隔
- **主动回忆**：5 种实践方法（闭卷回忆/自问自答/教学讲解/思维导图/空白测试）
- **费曼学习法**：自动生成费曼式解释 Prompt
- **模拟考题生成**：选择题+简答题自动出卷

### 数据持久化

- Zustand + LocalStorage 持久化，刷新不丢数据
- 全局 Toast 通知反馈
- 空状态引导设计

---

## 技术栈

```
React 18 · TypeScript · Vite 6
Three.js · React Three Fiber · @react-three/drei
Tailwind CSS 3 · Framer Motion
Zustand · React Router v6
Lucide React (图标)
```

---

## 本地运行

```bash
# 克隆仓库
git clone https://github.com/mingxingjun/mdlnyy.git
cd mdlnyy

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 配置 AI 模型

启动后在 **AI 冲刺核 → 模型配置** 标签页中填入 API Key：

- **DeepSeek**：前往 [platform.deepseek.com](https://platform.deepseek.com) 获取 API Key
- **Ollama**：本地安装 `ollama pull qwen2.5:7b`，无需 Key
- **OpenAI**：前往 [platform.openai.com](https://platform.openai.com) 获取 API Key

---

## 项目结构

```
src/
├── lib/
│   ├── agents/              # 多智能体系统
│   │   ├── types.ts         # Agent 类型定义
│   │   └── definitions.ts   # 6 Agent 身份 + 系统提示词 + 技能
│   ├── models/
│   │   ├── types.ts         # 模型配置类型
│   │   └── api.ts           # API 调用 + 缓存 + Token 管理
│   └── study/
│       └── techniques.ts    # 间隔重复 + 费曼技巧 + 闪卡生成
├── components/
│   ├── Layout.tsx           # 侧边栏导航
│   ├── ThreeBackground.tsx  # 3D 赛博朋克粒子背景
│   └── Toast.tsx            # 全局通知组件
├── pages/
│   ├── AIEngine.tsx         # Agent 控制台 + 模型配置
│   ├── Dashboard.tsx        # 考试仪表盘
│   ├── MyNotes.tsx          # 笔记管理
│   └── FlowChamber.tsx      # 番茄钟 + 白噪音 + 自习室
└── store/
    └── useAppStore.ts       # Zustand 全局状态
```

---

## License

MIT