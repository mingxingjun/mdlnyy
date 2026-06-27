/**
 * 多 Agent 协同复习平台 - 类型定义
 *
 * 架构：5 个核心 Agent + 1 个 Orchestrator 协调器（期末复习模式 MVP）
 * - Orchestrator：中央路由，不直接生成内容
 * - Question Agent（出题）：按难度梯度出题、判对错并分发
 * - Explanation Agent（讲解）：错题步骤化讲解，支持 4 种讲解风格
 * - Wrongbook Agent（错题本）：收集错题、分类标签、分析薄弱知识点
 * - Memorycard Agent（记忆卡片）：SM-2 间隔重复，依据薄弱点优先生成卡片
 * - Supervisor Agent（督学）：跟踪复习进度、生成报告与进度看板
 *
 * 每个 Agent 有严格的输入/输出契约和不可越界的职责。
 */

/* ═══════════════════════════════════════════════════════
   Agent 身份与契约
   ═══════════════════════════════════════════════════════ */

export type AgentRole =
  | 'orchestrator'
  | 'question'
  | 'explanation'
  | 'wrongbook'
  | 'memorycard'
  | 'supervisor';

export interface AgentIdentity {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  avatar: string;
  color: string;
  description: string;
  /** 输入契约：该 Agent 接收什么 */
  inputContract: string;
  /** 输出契约：该 Agent 产出什么 */
  outputContract: string;
  /** 不可越界：该 Agent 不能做什么 */
  boundaries: string;
  systemPrompt: string;
  skills: AgentSkill[];
  temperature: number;
  maxTokens: number;
}

export interface AgentSkill {
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

/* ═══════════════════════════════════════════════════════
   对话与任务
   ═══════════════════════════════════════════════════════ */

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export type TaskType =
  | 'parse_material'
  | 'generate_questions'
  | 'judge_answer'
  | 'explain_wrong'
  | 'collect_wrong'
  | 'analyze_weakness'
  | 'generate_cards'
  | 'review_card'
  | 'track_progress'
  | 'generate_report'
  | 'route'
  | 'summarize';

export interface AgentTask {
  id: string;
  agentId: string;
  type: TaskType;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  createdAt: number;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  tasks: AgentTask[];
  createdAt: number;
}

/* ═══════════════════════════════════════════════════════
   学习状态机（期末复习模式）
   ═══════════════════════════════════════════════════════ */

/**
 * 学习状态机 - Orchestrator 路由决策的依据
 *
 * 状态转移图：
 *   Onboarded → MaterialReady → KnowledgeReady → Practicing
 *            → WeaknessAnalyzed → Reviewed → ExamReady
 */
export type LearningState =
  | 'Onboarded'          // 已登录，未上传资料
  | 'MaterialReady'      // 已上传资料，未解析
  | 'KnowledgeReady'     // 资料已解析为知识点，可出题
  | 'Practicing'         // 正在答题练习
  | 'WeaknessAnalyzed'   // 已分析薄弱知识点
  | 'Reviewed'           // 已完成复习（含卡片复习）
  | 'ExamReady';         // 复习完成，准备考试

/* ═══════════════════════════════════════════════════════
   协同模式与 DAG
   ═══════════════════════════════════════════════════════ */

/**
 * 三种协同模式
 * - Pipeline：单向数据流，无循环（期末复习完整流程）
 * - FeedbackLoop：周期性闭环（错题强化 → 出题 → 再错题）
 * - HumanInTheLoop：学生反馈触发新任务（卡片复习触发进度更新）
 */
export type CollaborationPattern =
  | 'pipeline'
  | 'feedback_loop'
  | 'human_in_the_loop';

/** DAG 节点：一个 Agent 执行单元 */
export interface DagNode {
  id: string;
  agentId: string;
  taskType: TaskType;
  label: string;
  /** 依赖的前置节点 id 列表 */
  dependsOn: string[];
  /** 输入构造器：从前置节点输出聚合成本节点输入 */
  inputBuilder?: (prevOutputs: Record<string, string>) => string;
}

/** DAG：一次协同任务的执行图 */
export interface TaskDag {
  id: string;
  pattern: CollaborationPattern;
  nodes: DagNode[];
  /** 触发该 DAG 所需的前置学习状态 */
  requiredState?: LearningState;
  /** 执行完成后将学习状态迁移到 */
  nextState?: LearningState;
}

/* ═══════════════════════════════════════════════════════
   讲解风格
   ═══════════════════════════════════════════════════════ */

/**
 * 讲解风格 - Explanation Agent 支持 4 种风格
 * - concise：简洁，直击要点
 * - detailed：详细，逐步推导
 * - feynman：费曼技巧，像教 12 岁孩子
 * - socratic：苏格拉底式，追问引导
 */
export type ExplanationStyle = 'concise' | 'detailed' | 'feynman' | 'socratic';

/* ═══════════════════════════════════════════════════════
   诊断与规划输出结构（用于 Agent 间数据传递）
   ═══════════════════════════════════════════════════════ */

/** 知识点掌握度向量（Wrongbook Agent 输出） */
export interface MasteryVector {
  knowledgePointId: string;
  /** 0-1 的掌握概率，基于答题正确率估算 */
  mastery: number;
  /** 最近一次答题时间戳 */
  lastAttempted?: number;
  /** 该知识点连续答对次数 */
  streak?: number;
}

/** 薄弱点报告（Wrongbook Agent 输出） */
export interface WeaknessReport {
  masteryVectors: MasteryVector[];
  /** 掌握度低于阈值的知识点 id */
  weakPoints: string[];
  /** 建议强化的题型 */
  suggestedQuestionTypes: string[];
  /** 自然语言总结，由 LLM 翻译自统计结果 */
  summary: string;
}

/** 日级复习计划项（Supervisor Agent 输出） */
export interface PlanItem {
  date: string;
  subjectId: string;
  knowledgePointIds: string[];
  taskType: 'review' | 'practice' | 'mock_exam';
  /** 预计耗时（分钟） */
  durationMinutes: number;
  /** 优先级：1-5，5 最高 */
  priority: number;
}

/** 日级复习计划（Supervisor Agent 输出） */
export interface ReviewPlan {
  items: PlanItem[];
  /** 计划生成依据的自然语言说明 */
  rationale: string;
  /** 总复习时长（分钟） */
  totalMinutes: number;
}

/* ═══════════════════════════════════════════════════════
   新增领域结构（错题 / 记忆卡片 / 督学进度）
   ═══════════════════════════════════════════════════════ */

/** 错题（Wrongbook Agent 收集与持久化） */
export interface WrongQuestion {
  id: string;
  /** 关联的题目 id */
  questionId: string;
  /** 题干（便于离线展示） */
  stem: string;
  /** 学生作答 */
  userAnswer: string;
  /** 正确答案 */
  correctAnswer: string;
  /** 解析（由 Explanation Agent 提供） */
  explanation: string;
  /** 关联知识点 id 列表 */
  knowledgePointIds: string[];
  /** 分类标签（如：易错点 / 计算题 / 概念混淆） */
  tags: string[];
  /** 首次入错题本时间戳 */
  createdAt: number;
  /** 最近复习时间戳（未复习为 undefined） */
  reviewedAt?: number;
}

/** 记忆卡片（Memorycard Agent 使用 SM-2 算法调度） */
export interface MemoryCard {
  id: string;
  /** 关联知识点 id */
  knowledgePointId: string;
  /** 卡片正面（问题 / 提示） */
  front: string;
  /** 卡片背面（答案 / 解释） */
  back: string;
  /** SM-2 易度因子（默认 2.5，最低 1.3） */
  easeFactor: number;
  /** 当前间隔天数 */
  interval: number;
  /** 连续答对次数（用于阶段判定） */
  repetitions: number;
  /** 下次复习日期（ISO 字符串） */
  nextReviewDate: string;
  /** 最近一次复习时间戳 */
  lastReviewedAt?: number;
}

/** 督学进度（Supervisor Agent 跟踪） */
export interface StudyProgress {
  /** 累计作答题目数 */
  totalQuestions: number;
  /** 累计答对数 */
  correctCount: number;
  /** 累计答错数 */
  wrongCount: number;
  /** 连续学习天数 */
  streakDays: number;
  /** 最近学习日期（ISO 字符串） */
  lastStudyDate: string;
  /** 今日已学习分钟数 */
  studyMinutesToday: number;
  /** 当前薄弱知识点 id 列表（来自 Wrongbook） */
  weakPoints: string[];
}
