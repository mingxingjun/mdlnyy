/**
 * 多 Agent 协同复习平台 - 类型定义
 *
 * 架构：5 个核心 Agent + 1 个 Orchestrator 协调器
 * - Orchestrator：任务总控，不直接生成内容
 * - Content Agent：内容摘要（输入：原始资料 → 输出：知识图谱）
 * - Question Agent：智能出题（输入：知识点+难度+错题 → 输出：题目集）
 * - Diagnoser Agent：诊断评估（输入：答题记录+图谱 → 输出：薄弱点报告）
 * - Planner Agent：学习规划（输入：考试日历+掌握度 → 输出：日级计划）
 * - Tutor Agent：教学助理（输入：单题/知识点 → 输出：解题思路+追问）
 *
 * 每个 Agent 有严格的输入/输出契约和不可越界的职责。
 */

/* ═══════════════════════════════════════════════════════
   Agent 身份与契约
   ═══════════════════════════════════════════════════════ */

export type AgentRole =
  | 'orchestrator'
  | 'content'
  | 'question'
  | 'diagnoser'
  | 'planner'
  | 'tutor';

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
  | 'extract_knowledge'
  | 'build_graph'
  | 'generate_questions'
  | 'diagnose_weakness'
  | 'generate_plan'
  | 'adjust_plan'
  | 'tutor_explain'
  | 'tutor_followup'
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
   学习状态机
   ═══════════════════════════════════════════════════════ */

/**
 * 学习状态机 - Orchestrator 路由决策的依据
 *
 * 状态转移图：
 *   Onboarded → MaterialReady → KnowledgeReady → Practicing
 *            → Diagnosed → Planned → Reviewing → ExamReady
 */
export type LearningState =
  | 'Onboarded'        // 已登录，未上传资料
  | 'MaterialReady'    // 已上传资料，未提取知识
  | 'KnowledgeReady'   // 知识图谱已构建，可出题
  | 'Practicing'       // 正在答题练习
  | 'Diagnosed'        // 已诊断薄弱点
  | 'Planned'          // 已生成复习计划
  | 'Reviewing'        // 正在按计划复习
  | 'ExamReady';       // 复习完成，准备考试

/* ═══════════════════════════════════════════════════════
   协同模式与 DAG
   ═══════════════════════════════════════════════════════ */

/**
 * 三种协同模式（替代原方案的笼统"顺序/迭代/人机混合"）
 * - Pipeline：单向数据流，无循环（Content→Question→Diagnoser）
 * - FeedbackLoop：周期性闭环（Planner→执行→Diagnoser→Planner）
 * - HumanInTheLoop：学生反馈触发新任务（Tutor→"没听懂"→Question）
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
   诊断与规划输出结构（用于 Agent 间数据传递）
   ═══════════════════════════════════════════════════════ */

/** 知识点掌握度向量（Diagnoser 输出） */
export interface MasteryVector {
  knowledgePointId: string;
  /** 0-1 的掌握概率，基于 BKT/IRT 估算 */
  mastery: number;
  /** 最近一次答题时间戳 */
  lastAttempted?: number;
  /** 该知识点连续答对次数 */
  streak?: number;
}

/** 薄弱点报告（Diagnoser 输出） */
export interface WeaknessReport {
  masteryVectors: MasteryVector[];
  /** 掌握度低于阈值的知识点 id */
  weakPoints: string[];
  /** 建议强化的题型 */
  suggestedQuestionTypes: string[];
  /** 自然语言总结，由 LLM 翻译自统计结果 */
  summary: string;
}

/** 日级复习计划项（Planner 输出） */
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

/** 日级复习计划（Planner 输出） */
export interface ReviewPlan {
  items: PlanItem[];
  /** 计划生成依据的自然语言说明 */
  rationale: string;
  /** 总复习时长（分钟） */
  totalMinutes: number;
}
