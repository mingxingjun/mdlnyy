# UniFlow（优流备考）

> 大学生 AI 多智能体期末备考平台 —— 5 Agent + 1 协调器，状态机驱动 DAG 调度

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0080?logo=framer)](https://www.framer.com/motion/)
[![Zustand](https://img.shields.io/badge/Zustand-5-433E3F)](https://zustand.docs.pmnd.rs/)

---

## 核心特性

### 设计原则

- **Agent 即能力边界**：每个 Agent 拥有严格的输入/输出契约，不可越界
- **协同即状态机**：多 Agent 协作由学习状态机驱动 DAG 调度
- **MVP 即最小闭环**：单学科单用户闭环优先

### 5 Agent + 1 协调器

| Agent | 角色 | 输入契约 | 输出契约 |
|-------|------|---------|---------|
| 🎯 **协调器 Orchestrator** | 任务路由与状态机驱动 | 用户意图 + 学习状态 | DAG 任务图 + 下一步指令 |
| 📄 **内容摘要 Content** | 教材/PDF 摘要与考点提取 | 原始材料（PDF/Markdown/文本） | 结构化考点大纲 + 知识图谱 |
| ❓ **智能出题 Question** | 题目生成与变体扩展 | 考点大纲 + 难度 + 题型 | 题目集合（含答案与解析） |
| 📊 **诊断评估 Diagnoser** | IRT/BKT 能力诊断 | 作答记录 + 题目元数据 | 掌握度向量 + 薄弱点报告 |
| 📅 **学习规划 Planner** | CP-SAT 约束求解排程 | 薄弱点 + 截止日期 + 可用时间 | 复习计划（按日任务） |
| 💡 **教学助理 Tutor** | 苏格拉底式启发教学 | 学生提问 + 当前掌握度 | 引导式问答 + 概念澄清 |

### 三大协同模式

| 模式 | 说明 | 典型场景 |
|------|------|---------|
| **Pipeline 流水线** | 单向数据流，前序 Agent 输出作为后序输入 | 完整复习闭环（摘要→出题→诊断→规划） |
| **FeedbackLoop 反馈环** | 诊断结果回流，驱动下一轮出题/教学 | 弱点专项突破 |
| **HumanInTheLoop 人在环** | 关键节点需用户确认后继续 | 计划确认、目标设定 |

### 学习状态机

```
Onboarded → MaterialReady → KnowledgeReady → Practicing
                                              ↓
ExamReady ← Reviewing ← Planned ← Diagnosed
```

协调器根据当前学习状态与用户意图，路由到合适的 DAG 任务图。

### 三大 DAG 任务图

- **FULL_REVIEW_DAG**：完整复习闭环（5 Agent 流水线）
- **EXAM_SPRINT_DAG**：考前冲刺（出题→诊断→规划）
- **TUTOR_LOOP_DAG**：导师循环（Tutor + Diagnoser 反馈环）

### AI 模型配置

- **DeepSeek V4 Pro**（默认）— 高性价比中文大模型
- **Ollama 本地模型** — 支持 qwen2.5 / llama 等本地部署，零成本零延迟
- **OpenAI Compatible** — 支持 GPT-4o-mini 等
- **自定义端点** — 任意 OpenAI 兼容 API
- **Token 优化**：响应缓存 + Prompt 压缩 + 用量统计

### 六大功能模块

| 模块 | 功能 |
|------|------|
| **复习手册（Dashboard）** | 资料上传与 Agent 解析、复习活动入口、学习进度统计 |
| **开始练习** | 基于知识点出题，即时判定对错并讲解 |
| **题库管理** | 查看、编辑、新增题目，按文件筛选练习 |
| **错题本** | 回顾错题、步骤化讲解与薄弱点分析 |
| **记忆卡片** | SM-2 间隔重复，巩固长期记忆 |
| **学习报告** | 进度看板、薄弱点与复习建议 |

### 复古纸张拼贴视觉

- **三层纸张背景**：暖米黄渐变 + 重复线条纹理 + 径向光晕 + SVG 噪点
- **Canvas 动态粒子**：飘落纸片 + 墨水晕染，纯 Canvas 2D 实现，尊重 `prefers-reduced-motion`
- **鼠标视差**：装饰元素随鼠标微弱平移，营造层次感
- **手绘 SVG 插画**：羽毛笔 / 墨水溅 / 书堆 / 花瓣等拼贴装饰
- **二次元点睛**：仪表盘学习少女立绘，融入纸张暖色调
- **印章红 + 古金 + 沙绿配色**，毛笔体 / 衬线体 / 等宽数字三套字体体系

### 研究技巧引擎

- **SM-2 间隔重复算法**：基于艾宾浩斯曲线自动计算复习间隔
- **主动回忆**：5 种实践方法（闭卷回忆/自问自答/教学讲解/思维导图/空白测试）
- **IRT 项目反应理论**：题目难度与能力估计
- **BKT 贝叶斯知识追踪**：知识点掌握度动态更新
- **CP-SAT 约束求解**：复习计划排程优化

### 数据持久化

- Zustand + LocalStorage 持久化，刷新不丢数据
- 学习状态机持久化，跨会话保持进度
- 全局 Toast 通知反馈
- 空状态引导设计

---

## 技术栈

```
React 18 · TypeScript · Vite 6
Tailwind CSS 3 · Framer Motion 11
Zustand 5 · React Router 7
Lucide React (图标) · Recharts (图表)
pdfjs-dist (PDF 解析) · mammoth (Word 解析) · turndown (HTML→MD)
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

启动后点击页面右上角 **设置** 按钮打开模型配置面板，填入 API Key：

- **DeepSeek**：前往 [platform.deepseek.com](https://platform.deepseek.com) 获取 API Key
- **Ollama**：本地安装 `ollama pull qwen2.5:7b`，无需 Key
- **OpenAI**：前往 [platform.openai.com](https://platform.openai.com) 获取 API Key

---

## 项目结构

```
src/
├── lib/
│   ├── agents/
│   │   ├── types.ts            # Agent 契约 + 学习状态机 + DAG 类型
│   │   └── definitions.ts      # 5+1 Agent 身份 + 3 DAG + 路由函数
│   ├── models/
│   │   ├── types.ts            # 模型配置类型
│   │   └── api.ts              # API 调用 + 缓存 + Token 管理
│   ├── study/techniques.ts     # 间隔重复 + 费曼技巧 + 闪卡生成
│   ├── fileParser.ts           # PDF / Word / Markdown 文本提取
│   ├── webglSupport.ts         # WebGL 能力检测
│   └── utils.ts                # cn 等工具函数
├── components/
│   ├── Layout.tsx              # 顶部导航 + 视图路由容器
│   ├── VintageNav.tsx          # 复古风导航栏
│   ├── ThreeLayerBackground.tsx# 三层纸张背景 + 视差 + 装饰
│   ├── PaperParticlesCanvas.tsx# Canvas 飘落纸片 + 墨水晕染
│   ├── AnimeMascot.tsx         # 二次元立绘（文生图）
│   ├── PaperCard.tsx           # 纸张卡片
│   ├── IntroAnimation.tsx      # 开场纸片聚拢动画
│   ├── ModelSettingsModal.tsx  # 模型配置弹窗
│   └── Toast.tsx               # 全局通知
├── pages/
│   ├── Dashboard.tsx           # 复习手册（资料上传 + 活动入口 + 进度）
│   ├── Practice.tsx            # 开始练习
│   ├── QuestionBank.tsx        # 题库管理
│   ├── Wrongbook.tsx           # 错题本
│   ├── MemoryCards.tsx         # 记忆卡片
│   └── Supervisor.tsx          # 学习报告
├── hooks/                      # useCountUp / useTheme
└── store/useAppStore.ts        # Zustand 全局状态 + 学习状态机
```

---

## License

MIT
