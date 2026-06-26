import type { AgentIdentity, LearningState, TaskDag } from './types';

/* ═══════════════════════════════════════════════════════
   5 个核心 Agent + 1 个 Orchestrator
   ═══════════════════════════════════════════════════════ */

export const AGENTS: AgentIdentity[] = [
  /* ───────────── Orchestrator 协调器 ───────────── */
  {
    id: 'orchestrator',
    role: 'orchestrator',
    name: '协调器',
    title: '任务总控',
    avatar: '🎯',
    color: '#635BFF',
    description: '中央协调器，接收用户意图并路由到子 Agent，不直接生成内容',
    inputContract: '用户意图 + 当前学习状态',
    outputContract: '任务 DAG + 路由决策',
    boundaries: '不直接生成学习内容，不替代子 Agent 执行',
    systemPrompt: `你是「协调器」，多 Agent 系统的中央调度者。

【职责】
- 解析用户意图（上传资料 / 练习 / 答疑 / 制定计划 / 诊断错题）
- 根据当前学习状态机路由到合适的子 Agent
- 编排任务 DAG，决定执行顺序与依赖关系
- 不直接生成学习内容

【学习状态机】
Onboarded → MaterialReady → KnowledgeReady → Practicing
         → Diagnosed → Planned → Reviewing → ExamReady

【路由规则】
- 用户上传资料 → Content Agent
- 请求练习且 KnowledgeReady → Question Agent
- 请求练习且 Diagnosed → Question Agent（带薄弱点上下文）
- 请求计划 → Diagnoser 聚合 + Planner 生成
- 单题答疑 → Tutor Agent

【输出格式】
1. 识别的意图
2. 当前学习状态
3. 路由到的 Agent 与执行顺序
4. 简短说明（不超过 50 字）`,
    skills: [
      {
        name: '意图识别',
        description: '解析用户请求并路由',
        icon: '🧭',
        prompt: '请识别以下用户请求的意图，并路由到合适的 Agent：',
      },
      {
        name: '状态查询',
        description: '查看当前学习状态',
        icon: '📊',
        prompt: '请基于以下信息判断当前学习状态：',
      },
    ],
    temperature: 0.2,
    maxTokens: 1024,
  },

  /* ───────────── Content Agent 内容摘要 ───────────── */
  {
    id: 'content-agent',
    role: 'content',
    name: '摘要',
    title: '内容摘要专家',
    avatar: '📚',
    color: '#7C5CFF',
    description: '从教材/PDF/笔记中提取知识图谱与结构化摘要',
    inputContract: '原始资料（PDF / PPT / Markdown / 文本）',
    outputContract: '结构化知识图谱 JSON（节点 + 关系 + 置信度）',
    boundaries: '不出题、不评价掌握度、不生成复习计划',
    systemPrompt: `你是「摘要」，内容摘要专家。

【输入】原始学习资料（PDF / PPT / 笔记 / 文本）
【输出】结构化知识图谱 JSON

【能力】
- OCR + Layout 解析多模态资料
- 抽取候选知识点与关系（is-a / prerequisite / part-of）
- 为每个抽取结果标注置信度（0-1）
- 生成章节摘要与思维导图

【输出 JSON Schema】
{
  "subject": "科目名",
  "nodes": [
    { "id": "kp_1", "name": "知识点名", "confidence": 0.9, "priority": 5 }
  ],
  "edges": [
    { "from": "kp_1", "to": "kp_2", "type": "prerequisite", "confidence": 0.8 }
  ],
  "summary": "整体摘要（不超过 200 字）"
}

【原则】
- 置信度 < 0.6 的节点必须标记，进入待审核队列
- 不臆造资料中没有的知识点
- 不出题、不评价、不规划`,
    skills: [
      {
        name: '知识提取',
        description: '从资料抽取知识点与关系',
        icon: '🔬',
        prompt: '请从以下资料中提取知识点与关系，输出知识图谱 JSON：',
      },
      {
        name: '章节摘要',
        description: '生成章节级摘要',
        icon: '📝',
        prompt: '请为以下内容生成不超过 200 字的章节摘要：',
      },
      {
        name: '思维导图',
        description: '构建层次化知识结构',
        icon: '🗺️',
        prompt: '请基于以下资料构建层次化思维导图：',
      },
    ],
    temperature: 0.3,
    maxTokens: 4096,
  },

  /* ───────────── Question Agent 智能出题 ───────────── */
  {
    id: 'question-agent',
    role: 'question',
    name: '出题',
    title: '智能出题专家',
    avatar: '📝',
    color: '#4FD1C5',
    description: '基于知识点与历史错题生成个性化题目，支持难度控制',
    inputContract: '知识点列表 + 目标难度 + 历史错题（可选）',
    outputContract: '题目集（题干 / 选项 / 答案 / 解析 / 知识点标签 / 难度）',
    boundaries: '不诊断掌握度、不生成复习计划、不答疑解题',
    systemPrompt: `你是「出题」，智能出题专家。

【输入】知识点列表 + 目标难度 + 历史错题（可选）
【输出】题目集 JSON

【出题策略】
- RAG 检索种子题库 + LLM 模板生成
- 难度梯度：简单 30% / 中等 50% / 困难 20%
- 题型：选择题 / 填空题 / 简答题 / 计算题
- 个性化：若有历史错题，优先出同类题型强化
- 去重：与已有题库向量相似度 > 0.85 的拒绝生成

【输出 JSON Schema】
{
  "questions": [
    {
      "id": "q_1",
      "type": "choice",
      "difficulty": 3,
      "stem": "题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "解析（不超过 100 字）",
      "knowledgePointIds": ["kp_1"]
    }
  ]
}

【原则】
- 每题必须关联至少 1 个知识点
- 干扰项必须有合理性，不能明显错误
- 不诊断、不规划、不答疑`,
    skills: [
      {
        name: '生成选择题',
        description: '生成 4 选项选择题',
        icon: '✅',
        prompt: '请基于以下知识点生成 5 道选择题（含答案与解析）：',
      },
      {
        name: '生成简答题',
        description: '生成简答题与参考答案',
        icon: '✍️',
        prompt: '请基于以下知识点生成 3 道简答题（含参考答案）：',
      },
      {
        name: '错题强化',
        description: '针对错题出同类题',
        icon: '🎯',
        prompt: '请基于以下错题记录，生成 5 道同类强化题：',
      },
    ],
    temperature: 0.5,
    maxTokens: 4096,
  },

  /* ───────────── Diagnoser Agent 诊断评估 ───────────── */
  {
    id: 'diagnoser-agent',
    role: 'diagnoser',
    name: '诊断',
    title: '诊断评估专家',
    avatar: '🔍',
    color: '#FFB800',
    description: '基于 IRT/BKT 模型定位知识薄弱点，LLM 仅翻译统计结果',
    inputContract: '答题记录 + 知识图谱',
    outputContract: '薄弱点报告（掌握度向量 + 薄弱点列表 + 建议题型）',
    boundaries: '不出题、不直接生成复习计划、不答疑',
    systemPrompt: `你是「诊断」，诊断评估专家。

【输入】答题记录 + 知识图谱
【输出】薄弱点报告 JSON

【核心方法】
- IRT（项目反应理论）估算题目难度与学生能力
- BKT（贝叶斯知识追踪）估算知识点掌握概率
- LLM 仅负责把统计结果翻译成学生可理解的自然语言

【输出 JSON Schema】
{
  "masteryVectors": [
    { "knowledgePointId": "kp_1", "mastery": 0.35, "streak": 0 }
  ],
  "weakPoints": ["kp_1", "kp_3"],
  "suggestedQuestionTypes": ["choice", "calculation"],
  "summary": "用学生能懂的话总结薄弱点（不超过 150 字）"
}

【原则】
- 掌握度阈值：mastery < 0.6 视为薄弱
- 不臆造学生未答过的知识点的掌握度
- 不出题、不规划、不答疑
- 统计结果优先于 LLM 直觉`,
    skills: [
      {
        name: '薄弱点分析',
        description: '分析答题记录定位薄弱点',
        icon: '📉',
        prompt: '请分析以下答题记录，输出薄弱点报告 JSON：',
      },
      {
        name: '掌握度评估',
        description: '估算各知识点掌握概率',
        icon: '📊',
        prompt: '请基于以下答题数据估算各知识点的掌握度：',
      },
      {
        name: '学习效果对比',
        description: '对比前后测验效果',
        icon: '📈',
        prompt: '请对比以下两次测验结果，评估学习增益：',
      },
    ],
    temperature: 0.3,
    maxTokens: 2048,
  },

  /* ───────────── Planner Agent 学习规划 ───────────── */
  {
    id: 'planner-agent',
    role: 'planner',
    name: '规划',
    title: '学习规划专家',
    avatar: '📅',
    color: '#FF3D00',
    description: '基于约束满足求解生成日级复习计划，LLM 仅润色说明',
    inputContract: '考试日历 + 掌握度向量 + 每日可用时长',
    outputContract: '日级复习计划（可执行任务清单 + 理由说明）',
    boundaries: '不评价答题质量、不出题、不答疑',
    systemPrompt: `你是「规划」，学习规划专家。

【输入】考试日历 + 掌握度向量 + 每日可用时长
【输出】日级复习计划 JSON

【核心算法】
- 约束满足问题（CSP）建模
- 决策变量：x[i][j][t] = 学生 i 在时段 t 是否复习科目 j
- 约束：
  · 每日总时长 ≤ 学生申报可用时长
  · 每科时长 ≥ 掌握度缺口 × 权重
  · 考试日前必须完成 N 轮复习
  · 相邻时段不切换科目（减少上下文切换）
- 目标：最大化 Σ(掌握度提升 × 重要性) - λ × 偏离偏好
- 求解器：CP-SAT（单次 < 2 秒）

【输出 JSON Schema】
{
  "items": [
    {
      "date": "2026-06-21",
      "subjectId": "subj_1",
      "knowledgePointIds": ["kp_1", "kp_2"],
      "taskType": "review",
      "durationMinutes": 90,
      "priority": 5
    }
  ],
  "rationale": "计划生成依据（不超过 200 字）",
  "totalMinutes": 540
}

【原则】
- 计划必须可执行、可调整、可复算
- 不评价答题质量、不出题、不答疑
- 学生手动调整后应能基于反馈重算`,
    skills: [
      {
        name: '生成计划',
        description: '生成日级复习计划',
        icon: '📋',
        prompt: '请基于以下信息生成日级复习计划 JSON：',
      },
      {
        name: '动态调整',
        description: '根据进度调整计划',
        icon: '🔄',
        prompt: '请基于以下进度反馈动态调整复习计划：',
      },
      {
        name: '考前冲刺',
        description: '生成考前冲刺计划',
        icon: '🚀',
        prompt: '请基于以下考试日历生成考前 7 天冲刺计划：',
      },
    ],
    temperature: 0.3,
    maxTokens: 2048,
  },

  /* ───────────── Tutor Agent 教学助理 ───────────── */
  {
    id: 'tutor-agent',
    role: 'tutor',
    name: '导师',
    title: '教学助理',
    avatar: '💡',
    color: '#00D924',
    description: '苏格拉底式答疑，引导思考而非直接给答案',
    inputContract: '单题 / 单知识点 + 学生上下文（掌握度、近期错题）',
    outputContract: '解题思路 + 追问引导（不直接给完整答案）',
    boundaries: '不替代 Question Agent 出题、不诊断、不规划',
    systemPrompt: `你是「导师」，教学助理。

【输入】单题 / 单知识点 + 学生上下文
【输出】解题思路 + 追问引导

【核心方法】
- 苏格拉底式追问：通过提问引导学生自己思考
- 不直接给完整答案，先给思路线索
- 结合学生掌握度调整解释深度
- 若学生标记"没听懂"，触发 Question Agent 出同类题验证

【输出格式】
1. 思路线索（不超过 100 字，不给答案）
2. 关键追问 1-2 个
3. 相关知识点链接
4. 若学生反复表示不懂，建议出同类题练习

【原则】
- 不替代 Question Agent 出题
- 不诊断、不规划
- 用学生能懂的语言，避免堆砌术语
- 鼓励学生自己得出结论`,
    skills: [
      {
        name: '思路引导',
        description: '给解题思路不给答案',
        icon: '🧭',
        prompt: '请对以下题目给出解题思路线索（不给完整答案）：',
      },
      {
        name: '概念解释',
        description: '用费曼技巧解释概念',
        icon: '💡',
        prompt: '请用费曼技巧解释以下概念（像教 12 岁孩子）：',
      },
      {
        name: '盲区检测',
        description: '通过追问发现盲区',
        icon: '🔦',
        prompt: '请通过追问检测我对以下概念的理解盲区：',
      },
    ],
    temperature: 0.7,
    maxTokens: 2048,
  },
];

export const AGENT_MAP = new Map(AGENTS.map((a) => [a.id, a]));

/** 子 Agent 列表（不含 Orchestrator） */
export const SUB_AGENTS = AGENTS.filter((a) => a.role !== 'orchestrator');

/** Orchestrator 单独引用 */
export const ORCHESTRATOR = AGENTS.find((a) => a.role === 'orchestrator')!;

export function getAgent(id: string): AgentIdentity | undefined {
  return AGENT_MAP.get(id);
}

export function getAgentSkillPrompt(agentId: string, skillName: string): string {
  const agent = getAgent(agentId);
  if (!agent) return '';
  const skill = agent.skills.find((s) => s.name === skillName);
  return skill?.prompt || '';
}

export function compressPrompt(agent: AgentIdentity, input: string): string {
  // Returns the user-side prompt only; systemPrompt is passed separately to the model API.
  let prompt = `【任务】${input}\n\n`;
  prompt += `【输出要求】严格遵循 ${agent.name} 的输出契约（${agent.outputContract}），简洁、结构化、突出重点。`;
  return prompt;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.5);
}

/* ═══════════════════════════════════════════════════════
   任务 DAG 预定义 - 三种协同模式
   ═══════════════════════════════════════════════════════ */

/**
 * Pipeline 模式：完整复习流程
 * Content → Question → Diagnoser → Planner
 * 单向数据流，无循环
 */
export const FULL_REVIEW_DAG: TaskDag = {
  id: 'full-review',
  pattern: 'pipeline',
  requiredState: 'MaterialReady',
  nextState: 'Planned',
  nodes: [
    {
      id: 'n1',
      agentId: 'content-agent',
      taskType: 'extract_knowledge',
      label: '知识提取',
      dependsOn: [],
    },
    {
      id: 'n2',
      agentId: 'question-agent',
      taskType: 'generate_questions',
      label: '生成题目',
      dependsOn: ['n1'],
      inputBuilder: (prev) => `基于以下知识图谱生成题目：\n${prev['n1'] || ''}`,
    },
    {
      id: 'n3',
      agentId: 'diagnoser-agent',
      taskType: 'diagnose_weakness',
      label: '诊断薄弱',
      dependsOn: ['n2'],
      inputBuilder: (prev) => `基于以下题目与答题情况诊断薄弱点：\n${prev['n2'] || ''}`,
    },
    {
      id: 'n4',
      agentId: 'planner-agent',
      taskType: 'generate_plan',
      label: '生成计划',
      dependsOn: ['n3'],
      inputBuilder: (prev) => `基于以下薄弱点报告生成复习计划：\n${prev['n3'] || ''}`,
    },
  ],
};

/**
 * Pipeline 模式：考前冲刺
 * Content → Question（高难度）→ Diagnoser → Planner（冲刺节奏）
 */
export const EXAM_SPRINT_DAG: TaskDag = {
  id: 'exam-sprint',
  pattern: 'pipeline',
  requiredState: 'MaterialReady',
  nextState: 'Planned',
  nodes: [
    {
      id: 's1',
      agentId: 'content-agent',
      taskType: 'extract_knowledge',
      label: '高频考点',
      dependsOn: [],
    },
    {
      id: 's2',
      agentId: 'question-agent',
      taskType: 'generate_questions',
      label: '押题出卷',
      dependsOn: ['s1'],
      inputBuilder: (prev) => `基于以下高频考点生成考前押题（难度 4-5）：\n${prev['s1'] || ''}`,
    },
    {
      id: 's3',
      agentId: 'diagnoser-agent',
      taskType: 'diagnose_weakness',
      label: '快速诊断',
      dependsOn: ['s2'],
      inputBuilder: (prev) => `快速诊断以下答题情况：\n${prev['s2'] || ''}`,
    },
    {
      id: 's4',
      agentId: 'planner-agent',
      taskType: 'generate_plan',
      label: '冲刺计划',
      dependsOn: ['s3'],
      inputBuilder: (prev) => `基于以下诊断生成考前 7 天冲刺计划：\n${prev['s3'] || ''}`,
    },
  ],
};

/**
 * Human-in-the-loop 模式：答疑强化
 * Tutor 答疑 → 学生标记"没听懂" → Question 出同类题验证
 */
export const TUTOR_LOOP_DAG: TaskDag = {
  id: 'tutor-loop',
  pattern: 'human_in_the_loop',
  requiredState: 'KnowledgeReady',
  nextState: 'Practicing',
  nodes: [
    {
      id: 't1',
      agentId: 'tutor-agent',
      taskType: 'tutor_explain',
      label: '思路引导',
      dependsOn: [],
    },
    {
      id: 't2',
      agentId: 'question-agent',
      taskType: 'generate_questions',
      label: '同类题验证',
      dependsOn: ['t1'],
      inputBuilder: (prev) => `学生表示未理解以下解释，请出 3 道同类题验证：\n${prev['t1'] || ''}`,
    },
  ],
};

/** 所有预定义 DAG */
export const DAGS: TaskDag[] = [FULL_REVIEW_DAG, EXAM_SPRINT_DAG, TUTOR_LOOP_DAG];

/* ═══════════════════════════════════════════════════════
   Orchestrator 路由逻辑
   ═══════════════════════════════════════════════════════ */

export type UserIntent =
  | 'upload_material'
  | 'practice'
  | 'diagnose'
  | 'review_plan'
  | 'tutor'
  | 'free_chat';

export interface RouteResult {
  intent: UserIntent;
  currentState: LearningState;
  dag?: TaskDag;
  targetAgentId: string;
  reason: string;
}

/**
 * Orchestrator 路由决策
 * 替代原方案的笼统"顺序/迭代/人机混合"描述
 */
export function route(
  intent: UserIntent,
  currentState: LearningState,
): RouteResult {
  switch (intent) {
    case 'upload_material':
      return {
        intent,
        currentState,
        dag: undefined,
        targetAgentId: 'content-agent',
        reason: '上传资料 → Content Agent 提取知识图谱',
      };

    case 'practice':
      if (currentState === 'KnowledgeReady' || currentState === 'Diagnosed' || currentState === 'Reviewing' || currentState === 'Practicing') {
        return {
          intent,
          currentState,
          targetAgentId: 'question-agent',
          reason: '已有知识图谱 → Question Agent 直接出题',
        };
      }
      return {
        intent,
        currentState,
        dag: FULL_REVIEW_DAG,
        targetAgentId: 'orchestrator',
        reason: '尚无知识图谱 → 触发完整 Pipeline',
      };

    case 'diagnose':
      return {
        intent,
        currentState,
        targetAgentId: 'diagnoser-agent',
        reason: '直接调用 Diagnoser 聚合答题记录',
      };

    case 'review_plan':
      return {
        intent,
        currentState,
        dag: {
          id: 'plan-feedback',
          pattern: 'feedback_loop',
          requiredState: 'Diagnosed',
          nextState: 'Planned',
          nodes: [
            {
              id: 'p1',
              agentId: 'diagnoser-agent',
              taskType: 'diagnose_weakness',
              label: '聚合诊断',
              dependsOn: [],
            },
            {
              id: 'p2',
              agentId: 'planner-agent',
              taskType: 'generate_plan',
              label: '生成计划',
              dependsOn: ['p1'],
              inputBuilder: (prev) => `基于以下诊断生成计划：\n${prev['p1'] || ''}`,
            },
          ],
        },
        targetAgentId: 'orchestrator',
        reason: 'Feedback Loop：Diagnoser 聚合 → Planner 生成',
      };

    case 'tutor':
      return {
        intent,
        currentState,
        dag: TUTOR_LOOP_DAG,
        targetAgentId: 'tutor-agent',
        reason: 'Human-in-the-loop：Tutor 答疑 → 可触发同类题',
      };

    case 'free_chat':
    default:
      return {
        intent: 'free_chat',
        currentState,
        targetAgentId: 'tutor-agent',
        reason: '自由对话默认路由到 Tutor',
      };
  }
}
