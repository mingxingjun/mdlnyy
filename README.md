# UniFlow（优流备考）

> 大学生 AI 多智能体期末备考平台 —— 5 Agent + 1 协调器，状态机驱动 DAG 调度

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r173-000000?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
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

### 四大功能模块

| 模块 | 功能 |
|------|------|
| **高光仪表盘** | 考试倒计时、科目进度追踪、Agent 协同可视化 |
| **AI 冲刺核** | 5+1 Agent 控制台 + DAG 工作流 + 模型配置 |
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
│   ├── agents/
│   │   ├── types.ts         # Agent 契约 + 学习状态机 + DAG 类型
│   │   └── definitions.ts   # 5+1 Agent 身份 + 3 DAG + 路由函数
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
│   ├── AIEngine.tsx         # Agent 控制台 + DAG 工作流 + 模型配置
│   ├── Dashboard.tsx        # 考试仪表盘 + Agent 协同可视化
│   ├── MyNotes.tsx          # 笔记管理
│   └── FlowChamber.tsx      # 番茄钟 + 白噪音 + 自习室
└── store/
    └── useAppStore.ts       # Zustand 全局状态 + 学习状态机
```

---

## License

MIT
