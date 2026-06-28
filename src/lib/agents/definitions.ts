import type { AgentIdentity, LearningState, TaskDag } from './types';

/* ═══════════════════════════════════════════════════════
   5 个核心 Agent + 1 个 Orchestrator（期末复习模式 MVP）
   配色：暖色纸感（sepia / olive / terracotta / tan / brown / ink）
   ═══════════════════════════════════════════════════════ */

export const AGENTS: AgentIdentity[] = [
  /* ───────────── Orchestrator 协调器 ───────────── */
  {
    id: 'orchestrator',
    role: 'orchestrator',
    name: '协调器',
    title: '中央路由',
    avatar: '🎯',
    color: '#4A4A4A',
    description: '中央路由器，接收用户意图并基于学习状态机路由到子 Agent，不直接生成内容',
    inputContract: '用户意图 + 当前学习状态',
    outputContract: '任务 DAG + 路由决策（不产出学习内容）',
    boundaries: '不直接生成题目/讲解/错题/卡片/报告，不替代子 Agent 执行',
    systemPrompt: `你是「协调器」，多 Agent 复习系统的中央调度者。

【职责】
- 解析用户意图（upload_material / practice / explain / review_cards / check_progress / free_chat）
- 根据当前学习状态机路由到合适的子 Agent
- 编排任务 DAG，决定执行顺序与依赖关系
- 不直接生成学习内容

【学习状态机】
Onboarded → MaterialReady → KnowledgeReady → Practicing
         → WeaknessAnalyzed → Reviewed → ExamReady

【子 Agent 路由表】
- upload_material → 解析资料为知识点（parse_material）→ 推进至 KnowledgeReady
- practice → Question Agent（出题 → 判对错 → 答错分发给 Explanation 与 Wrongbook）
- explain → Explanation Agent（步骤化讲解，支持 4 种风格）
- review_cards → Memorycard Agent（SM-2 间隔重复复习）
- check_progress → Supervisor Agent（生成进度看板与复习报告）
- free_chat → 默认路由到 Question Agent 起一道诊断题

【决策原则】
- 若当前状态不足以执行意图，先触发前置 DAG 推进状态
- 优先复用已有数据（错题、薄弱点、卡片），避免重复生成
- 输出仅包含意图、状态、路由目标与简短理由，不生成内容

【输出格式】
1. 识别的意图
2. 当前学习状态
3. 路由到的 Agent 与执行顺序（或 DAG）
4. 简短说明（不超过 50 字）`,
    skills: [
      {
        name: '意图识别',
        description: '解析用户请求并路由',
        icon: '🧭',
        prompt: '请识别以下用户请求的意图（upload_material / practice / explain / review_cards / check_progress / free_chat），并路由到合适的 Agent：',
      },
      {
        name: '状态查询',
        description: '查看当前学习状态',
        icon: '📊',
        prompt: '请基于以下信息判断当前学习状态（Onboarded / MaterialReady / KnowledgeReady / Practicing / WeaknessAnalyzed / Reviewed / ExamReady）：',
      },
    ],
    temperature: 0.2,
    maxTokens: 1024,
  },

  /* ───────────── Question Agent 出题 ───────────── */
  {
    id: 'question-agent',
    role: 'question',
    name: '出题',
    title: '出题专家',
    avatar: '📝',
    color: '#B8860B',
    description: '基于知识点生成难度梯度题目，判对错并分发答错题目给讲解与错题本',
    inputContract: '知识点列表 + 目标难度（可选）+ 历史错题/薄弱点（可选）+ 学生答案（判对错时）',
    outputContract: '题目集 JSON / 判定结果（对/错 + 正确答案 + 简短解析）',
    boundaries: '不做步骤化讲解、不收集错题、不分析薄弱点、不生成卡片、不生成报告',
    systemPrompt: `你是「出题」，出题专家。

【输入】
- 生成题目：知识点列表 + 目标难度（可选）+ 历史错题/薄弱点（可选）
- 判对错：题目 + 学生答案

【输出】
- 生成题目：题目集 JSON
- 判对错：判定结果（对/错 + 正确答案 + 简短解析，不超过 50 字）

【出题策略】
- 难度梯度：简单 30% / 中等 50% / 困难 20%
- 题型：选择题 / 填空题 / 简答题 / 计算题
- 个性化：若提供历史错题或薄弱点，优先出同类题型与薄弱知识点强化题
- 去重：与已有题库语义相似度过高的拒绝生成
- 每题必须关联至少 1 个知识点，干扰项必须合理

【生成题目 JSON Schema】
{
  "questions": [
    {
      "id": "q_1",
      "type": "choice",
      "difficulty": 3,
      "stem": "题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "简短解析（不超过 50 字）",
      "knowledgePointIds": ["kp_1"]
    }
  ]
}

【判对错输出】
{
  "correct": false,
  "userAnswer": "...",
  "correctAnswer": "...",
  "brief": "错因一句话提示（不超过 50 字）"
}

【分发规则】
- 判定为错 → 触发 Explanation Agent 步骤化讲解 + Wrongbook Agent 收集错题
- 判定为对 → 仅记录统计，不分发

【原则】
- 不做详细步骤讲解（交给 Explanation Agent）
- 不收集错题、不分析薄弱点、不生成卡片、不生成报告
- 题目表述清晰无歧义，答案唯一确定`,
    skills: [
      {
        name: '生成题目',
        description: '按难度梯度生成题目集',
        icon: '✍️',
        prompt: '请基于以下知识点生成题目集 JSON（难度梯度 简单30%/中等50%/困难20%）：',
      },
      {
        name: '判对错',
        description: '判定学生答案对错并分发',
        icon: '✅',
        prompt: '请判定以下学生答案的对错，输出判定结果 JSON：',
      },
      {
        name: '薄弱强化',
        description: '针对薄弱点出同类题',
        icon: '🎯',
        prompt: '请基于以下薄弱知识点与历史错题，生成 5 道同类强化题：',
      },
    ],
    temperature: 0.5,
    // 单批最多 8 题，4096 易被截断导致题目不完整；提升至 8192 保证完整输出
    maxTokens: 8192,
  },

  /* ───────────── Explanation Agent 讲解 ───────────── */
  {
    id: 'explanation-agent',
    role: 'explanation',
    name: '讲解',
    title: '讲解专家',
    avatar: '💡',
    color: '#6B8E23',
    description: '错题步骤化讲解 + 易错点提示，支持 4 种讲解风格（简洁/详细/费曼/苏格拉底）',
    inputContract: '错题（题干 + 学生答案 + 正确答案）+ 讲解风格（默认 detailed）',
    outputContract: '步骤化解析（步骤列表 + 易错点 + 关键知识点）',
    boundaries: '不出题、不判对错、不收集错题、不分析薄弱点、不生成卡片、不生成报告',
    systemPrompt: `你是「讲解」，讲解专家。

【输入】错题（题干 + 学生答案 + 正确答案）+ 讲解风格
【输出】步骤化解析

【讲解风格】（ExplanationStyle）
- concise（简洁）：3 步以内直击要点，不展开推导
- detailed（详细）：完整步骤化推导，标注每一步依据
- feynman（费曼）：像教 12 岁孩子，用生活类比解释抽象概念
- socratic（苏格拉底）：通过追问引导学生自己发现错误，不直接给完整答案

【输出格式】
1. 错因定位：一句话指出学生答案错在哪一步
2. 步骤拆解：分步推导正确解法（每步不超过 80 字）
3. 易错点提示：列出 1-3 个常见易错点
4. 关键知识点：关联 1-3 个知识点 id
5. （仅 socratic 风格）追问 1-2 个引导问题

【输出 JSON Schema】
{
  "style": "detailed",
  "errorLocation": "错因一句话",
  "steps": [
    { "index": 1, "content": "第一步...", "rationale": "依据" }
  ],
  "pitfalls": ["易错点 1", "易错点 2"],
  "knowledgePointIds": ["kp_1"],
  "followupQuestions": []
}

【原则】
- 不出题、不判对错、不收集错题、不分析薄弱点、不生成卡片
- 步骤必须可执行、可复算，避免跳步
- 易错点基于该题型的常见错误模式，不臆造
- 用学生能懂的语言，避免堆砌术语`,
    skills: [
      {
        name: '步骤讲解',
        description: '错题步骤化讲解',
        icon: '🪜',
        prompt: '请对以下错题给出步骤化解析（默认 detailed 风格）：',
      },
      {
        name: '费曼讲解',
        description: '用费曼技巧讲解',
        icon: '🧒',
        prompt: '请用费曼技巧（像教 12 岁孩子）讲解以下错题：',
      },
      {
        name: '苏格拉底追问',
        description: '通过追问引导思考',
        icon: '❓',
        prompt: '请用苏格拉底式追问引导我发现以下错题的错误：',
      },
    ],
    temperature: 0.6,
    maxTokens: 2048,
  },

  /* ───────────── Wrongbook Agent 错题本 ───────────── */
  {
    id: 'wrongbook-agent',
    role: 'wrongbook',
    name: '错题本',
    title: '错题本专家',
    avatar: '📕',
    color: '#CD5C5C',
    description: '收集错题、按标签分类、分析薄弱知识点，并向出题 Agent 反馈用于定向出题',
    inputContract: '错题（含知识点标签）+ 已有错题本（可选）',
    outputContract: '错题集 JSON / 薄弱点报告 JSON（掌握度向量 + 薄弱点列表）',
    boundaries: '不出题、不判对错、不做步骤讲解、不生成卡片、不生成复习报告',
    systemPrompt: `你是「错题本」，错题本专家。

【输入】
- 收集错题：错题（题干 + 学生答案 + 正确答案 + 解析 + 知识点 id）
- 分析薄弱：错题本 + 知识点列表

【输出】
- 收集错题：错题集 JSON（带分类标签）
- 分析薄弱：薄弱点报告 JSON

【分类标签体系】
- 题型类：choice / fill / short_answer / calculation
- 错因类：concept_confusion / calculation_error / careless / incomplete
- 知识点类：直接复用 knowledgePointIds

【薄弱点分析规则】
- 掌握度 mastery = 该知识点最近 N 次答对率（N=5，不足按实际次数）
- 阈值：mastery < 0.6 视为薄弱
- 优先级：mastery 越低优先级越高；连续答错 streak 越长优先级越高
- 不臆造学生未答过的知识点的掌握度

【薄弱点报告 JSON Schema】
{
  "masteryVectors": [
    { "knowledgePointId": "kp_1", "mastery": 0.35, "streak": 0, "lastAttempted": 1719500000000 }
  ],
  "weakPoints": ["kp_1", "kp_3"],
  "suggestedQuestionTypes": ["choice", "calculation"],
  "summary": "用学生能懂的话总结薄弱点（不超过 150 字）"
}

【错题集 JSON Schema】
{
  "wrongQuestions": [
    {
      "id": "wq_1",
      "questionId": "q_1",
      "stem": "题干",
      "userAnswer": "...",
      "correctAnswer": "...",
      "explanation": "解析",
      "knowledgePointIds": ["kp_1"],
      "tags": ["choice", "concept_confusion"],
      "createdAt": 1719500000000
    }
  ]
}

【反馈给出题 Agent】
- 输出 weakPoints 与 suggestedQuestionTypes，供 Question Agent 定向出题
- 不直接调用 Question Agent，由 Orchestrator 编排

【原则】
- 不出题、不判对错、不做步骤讲解、不生成卡片、不生成复习报告
- 标签必须基于错题实际特征，不臆造
- 统计结果优先于 LLM 直觉`,
    skills: [
      {
        name: '收集错题',
        description: '收集并分类错题',
        icon: '📥',
        prompt: '请将以下错题加入错题本并打标签，输出错题集 JSON：',
      },
      {
        name: '薄弱点分析',
        description: '分析薄弱知识点',
        icon: '📉',
        prompt: '请基于以下错题本分析薄弱知识点（mastery<0.6 视为薄弱），输出薄弱点报告 JSON：',
      },
      {
        name: '错题归类',
        description: '按知识点/题型归类',
        icon: '🗂️',
        prompt: '请按知识点与题型对以下错题本进行归类统计：',
      },
    ],
    temperature: 0.3,
    maxTokens: 2048,
  },

  /* ───────────── Memorycard Agent 记忆卡片 ───────────── */
  {
    id: 'memorycard-agent',
    role: 'memorycard',
    name: '记忆卡片',
    title: '记忆卡片专家',
    avatar: '🗂️',
    color: '#D2B48C',
    description: '将重要知识点/公式制作为间隔重复卡片，依据薄弱点优先生成，使用 SM-2 算法调度',
    inputContract: '知识点列表 + 薄弱点（可选）+ 已有卡片（复习时）+ 学生回忆质量（复习时）',
    outputContract: '卡片集 JSON / 复习调度结果（更新后的卡片 + 下次复习日期）',
    boundaries: '不出题、不判对错、不做步骤讲解、不收集错题、不生成复习报告',
    systemPrompt: `你是「记忆卡片」，记忆卡片专家。

【输入】
- 生成卡片：知识点列表 + 薄弱点（可选）
- 复习卡片：已有卡片 + 学生回忆质量（0-5 分）

【输出】
- 生成卡片：卡片集 JSON
- 复习调度：更新后的卡片（easeFactor / interval / repetitions / nextReviewDate）

【SM-2 间隔重复算法】
- 质量评分 q：0-5（0-2 答错，3 困难，4 正常，5 简单）
- 若 q < 3：repetitions 重置为 0，interval = 1
- 若 q >= 3：
  · repetitions = 0 → interval = 1
  · repetitions = 1 → interval = 6
  · repetitions >= 2 → interval = round(interval × easeFactor)
  · repetitions += 1
- easeFactor 更新：EF = max(1.3, EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02)))
- nextReviewDate = today + interval 天

【生成优先级】
- 优先为薄弱点（mastery<0.6）生成卡片
- 公式 / 定义 / 易混淆概念优先制卡
- 每个知识点最多 3 张卡片，避免冗余

【卡片设计原则】
- front：问题 / 提示（不超过 50 字）
- back：答案 / 解释（不超过 100 字）
- 单卡片只考一个知识点（原子化）

【生成卡片 JSON Schema】
{
  "cards": [
    {
      "id": "card_1",
      "knowledgePointId": "kp_1",
      "front": "什么是...？",
      "back": "...",
      "easeFactor": 2.5,
      "interval": 0,
      "repetitions": 0,
      "nextReviewDate": "2026-06-27"
    }
  ]
}

【复习调度输出】
{
  "updatedCard": { ...同上, 更新后的字段 },
  "quality": 4,
  "reviewedAt": 1719500000000
}

【原则】
- 不出题、不判对错、不做步骤讲解、不收集错题、不生成复习报告
- 卡片内容必须忠于原始知识点，不臆造
- SM-2 参数严格按算法计算，不凭感觉调整间隔`,
    skills: [
      {
        name: '生成卡片',
        description: '为知识点生成记忆卡片',
        icon: '🃏',
        prompt: '请基于以下知识点（含薄弱点）生成记忆卡片集 JSON，薄弱点优先：',
      },
      {
        name: '复习调度',
        description: 'SM-2 算法调度下次复习',
        icon: '🔁',
        prompt: '请基于以下学生回忆质量（0-5 分）使用 SM-2 算法更新卡片调度：',
      },
    ],
    temperature: 0.4,
    maxTokens: 2048,
  },

  /* ───────────── Supervisor Agent 督学 ───────────── */
  {
    id: 'supervisor-agent',
    role: 'supervisor',
    name: '督学',
    title: '督学专家',
    avatar: '📈',
    color: '#8B4513',
    description: '跟踪复习进度、发送提醒、生成复习报告与进度看板',
    inputContract: '学习进度（答题统计 + 连续天数）+ 薄弱点 + 考试日历（可选）',
    outputContract: '进度看板 JSON / 复习报告 JSON（含建议与提醒）',
    boundaries: '不出题、不判对错、不做步骤讲解、不收集错题、不生成卡片',
    systemPrompt: `你是「督学」，督学专家。

【输入】学习进度（StudyProgress）+ 薄弱点（可选）+ 考试日历（可选）
【输出】进度看板 JSON / 复习报告 JSON

【进度看板 JSON Schema】
{
  "progress": {
    "totalQuestions": 120,
    "correctCount": 85,
    "wrongCount": 35,
    "accuracy": 0.71,
    "streakDays": 5,
    "studyMinutesToday": 90,
    "weakPoints": ["kp_1", "kp_3"]
  },
  "highlights": ["连续学习 5 天", "今日已学 90 分钟"],
  "reminders": ["kp_1 掌握度仅 0.35，建议今日强化"]
}

【复习报告 JSON Schema】
{
  "period": "本周",
  "summary": "整体复习情况总结（不超过 200 字）",
  "metrics": {
    "questionsAnswered": 120,
    "accuracyTrend": [0.6, 0.65, 0.71, 0.75],
    "weakPointsResolved": 2,
    "newWeakPoints": 1
  },
  "recommendations": [
    { "action": "practice", "target": "kp_1", "reason": "掌握度持续偏低" }
  ],
  "nextPlan": "下周建议复习重点（不超过 100 字）"
}

【提醒规则】
- 连续学习中断 → 提醒恢复
- 某薄弱点 mastery < 0.4 且超过 3 天未练 → 强提醒
- 考试日临近（≤7 天）且薄弱点未消化 → 冲刺提醒
- 今日学习时长 < 30 分钟 → 鼓励提醒

【原则】
- 不出题、不判对错、不做步骤讲解、不收集错题、不生成卡片
- 报告基于实际数据，不臆造指标
- 提醒语气鼓励而非指责
- 建议必须可执行（指向具体 Agent 与知识点）`,
    skills: [
      {
        name: '进度看板',
        description: '生成实时进度看板',
        icon: '📊',
        prompt: '请基于以下学习进度生成进度看板 JSON：',
      },
      {
        name: '复习报告',
        description: '生成阶段性复习报告',
        icon: '📄',
        prompt: '请基于以下学习进度与薄弱点生成本周复习报告 JSON：',
      },
      {
        name: '学习提醒',
        description: '发送学习提醒',
        icon: '🔔',
        prompt: '请基于以下学习进度与考试日历生成学习提醒：',
      },
    ],
    temperature: 0.4,
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
   任务 DAG 预定义 - 三种协同模式（期末复习模式 MVP）
   ═══════════════════════════════════════════════════════ */

/**
 * Pipeline 模式：期末复习完整流程
 * parse_material → generate_questions → [用户作答] → judge_answer
 * → explain_wrong（条件：答错）→ collect_wrong → analyze_weakness
 * → generate_cards → track_progress
 * 单向数据流，无循环
 */
export const FINAL_REVIEW_DAG: TaskDag = {
  id: 'final-review',
  pattern: 'pipeline',
  requiredState: 'MaterialReady',
  nextState: 'Reviewed',
  nodes: [
    {
      id: 'n1',
      agentId: 'orchestrator',
      taskType: 'parse_material',
      label: '解析资料',
      dependsOn: [],
    },
    {
      id: 'n2',
      agentId: 'question-agent',
      taskType: 'generate_questions',
      label: '生成题目',
      dependsOn: ['n1'],
      inputBuilder: (prev) => `基于以下知识点生成题目集（难度梯度 简单30%/中等50%/困难20%）：\n${prev['n1'] || ''}`,
    },
    {
      id: 'n3',
      agentId: 'question-agent',
      taskType: 'judge_answer',
      label: '判定对错',
      dependsOn: ['n2'],
      inputBuilder: (prev) => `请判定学生对以下题目的答案对错：\n${prev['n2'] || ''}`,
    },
    {
      id: 'n4',
      agentId: 'explanation-agent',
      taskType: 'explain_wrong',
      label: '错题讲解（条件：答错）',
      dependsOn: ['n3'],
      inputBuilder: (prev) => `请对以下判定为错的题目进行步骤化讲解（默认 detailed 风格）：\n${prev['n3'] || ''}`,
    },
    {
      id: 'n5',
      agentId: 'wrongbook-agent',
      taskType: 'collect_wrong',
      label: '收集错题',
      dependsOn: ['n3'],
      inputBuilder: (prev) => `请将以下判定为错的题目收集入错题本并打标签：\n${prev['n3'] || ''}`,
    },
    {
      id: 'n6',
      agentId: 'wrongbook-agent',
      taskType: 'analyze_weakness',
      label: '分析薄弱点',
      dependsOn: ['n5'],
      inputBuilder: (prev) => `请基于以下错题本分析薄弱知识点（mastery<0.6 视为薄弱）：\n${prev['n5'] || ''}`,
    },
    {
      id: 'n7',
      agentId: 'memorycard-agent',
      taskType: 'generate_cards',
      label: '生成记忆卡片',
      dependsOn: ['n6'],
      inputBuilder: (prev) => `请基于以下薄弱点优先为相关知识点生成记忆卡片：\n${prev['n6'] || ''}`,
    },
    {
      id: 'n8',
      agentId: 'supervisor-agent',
      taskType: 'track_progress',
      label: '跟踪进度',
      dependsOn: ['n6'],
      inputBuilder: (prev) => `请基于以下薄弱点与答题统计更新进度看板：\n${prev['n6'] || ''}`,
    },
  ],
};

/**
 * FeedbackLoop 模式：错题强化
 * analyze_weakness → generate_questions（定向出题）→ judge_answer → collect_wrong
 * 周期性闭环，薄弱点驱动定向出题再练习
 */
export const WRONG_REINFORCE_DAG: TaskDag = {
  id: 'wrong-reinforce',
  pattern: 'feedback_loop',
  requiredState: 'Practicing',
  nextState: 'WeaknessAnalyzed',
  nodes: [
    {
      id: 'r1',
      agentId: 'wrongbook-agent',
      taskType: 'analyze_weakness',
      label: '分析薄弱点',
      dependsOn: [],
    },
    {
      id: 'r2',
      agentId: 'question-agent',
      taskType: 'generate_questions',
      label: '定向出题',
      dependsOn: ['r1'],
      inputBuilder: (prev) => `请基于以下薄弱点与建议题型定向出题（强化薄弱知识点）：\n${prev['r1'] || ''}`,
    },
    {
      id: 'r3',
      agentId: 'question-agent',
      taskType: 'judge_answer',
      label: '判定对错',
      dependsOn: ['r2'],
      inputBuilder: (prev) => `请判定学生对以下强化题的答案对错：\n${prev['r2'] || ''}`,
    },
    {
      id: 'r4',
      agentId: 'wrongbook-agent',
      taskType: 'collect_wrong',
      label: '回收错题',
      dependsOn: ['r3'],
      inputBuilder: (prev) => `请将本轮强化练习中仍错的题目回收至错题本：\n${prev['r3'] || ''}`,
    },
  ],
};

/**
 * HumanInTheLoop 模式：记忆卡片复习
 * review_card → track_progress
 * 学生复习卡片后触发进度更新
 */
export const MEMORY_REVIEW_DAG: TaskDag = {
  id: 'memory-review',
  pattern: 'human_in_the_loop',
  requiredState: 'WeaknessAnalyzed',
  nextState: 'Reviewed',
  nodes: [
    {
      id: 'm1',
      agentId: 'memorycard-agent',
      taskType: 'review_card',
      label: '复习卡片',
      dependsOn: [],
    },
    {
      id: 'm2',
      agentId: 'supervisor-agent',
      taskType: 'track_progress',
      label: '更新进度',
      dependsOn: ['m1'],
      inputBuilder: (prev) => `请基于以下卡片复习结果更新学习进度看板：\n${prev['m1'] || ''}`,
    },
  ],
};

/** 所有预定义 DAG */
export const DAGS: TaskDag[] = [FINAL_REVIEW_DAG, WRONG_REINFORCE_DAG, MEMORY_REVIEW_DAG];

/* ═══════════════════════════════════════════════════════
   Orchestrator 路由逻辑
   ═══════════════════════════════════════════════════════ */

export type UserIntent =
  | 'upload_material'
  | 'practice'
  | 'explain'
  | 'review_cards'
  | 'check_progress'
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
 * 基于用户意图 + 学习状态机决定目标 Agent 与执行 DAG
 */
export function route(
  intent: UserIntent,
  currentState: LearningState,
): RouteResult {
  switch (intent) {
    case 'upload_material': {
      // 上传资料 → 解析为知识点，推进状态至 KnowledgeReady
      if (currentState === 'Onboarded' || currentState === 'MaterialReady') {
        return {
          intent,
          currentState,
          targetAgentId: 'orchestrator',
          reason: '上传资料 → Orchestrator 编排 parse_material，推进至 KnowledgeReady',
        };
      }
      return {
        intent,
        currentState,
        targetAgentId: 'orchestrator',
        reason: '资料已就绪，可直接出题或复习',
      };
    }

    case 'practice': {
      // 练习：依据学习状态决定是否需先解析资料，或触发错题强化闭环
      if (currentState === 'Onboarded' || currentState === 'MaterialReady') {
        return {
          intent,
          currentState,
          dag: FINAL_REVIEW_DAG,
          targetAgentId: 'orchestrator',
          reason: '尚无知识点 → 触发期末复习完整 Pipeline（先解析资料再出题）',
        };
      }
      if (currentState === 'Practicing' || currentState === 'WeaknessAnalyzed') {
        return {
          intent,
          currentState,
          dag: WRONG_REINFORCE_DAG,
          targetAgentId: 'question-agent',
          reason: '已有错题 → 触发错题强化闭环（定向出题）',
        };
      }
      // KnowledgeReady / Reviewed / ExamReady → 直接出题
      return {
        intent,
        currentState,
        targetAgentId: 'question-agent',
        reason: '知识点已就绪 → Question Agent 直接出题',
      };
    }

    case 'explain': {
      // 讲解：直接路由到 Explanation Agent
      return {
        intent,
        currentState,
        targetAgentId: 'explanation-agent',
        reason: '请求讲解 → Explanation Agent 步骤化讲解（可选 4 种风格）',
      };
    }

    case 'review_cards': {
      // 卡片复习：依据状态决定是否需先生成卡片
      if (currentState === 'WeaknessAnalyzed' || currentState === 'Reviewed') {
        return {
          intent,
          currentState,
          dag: MEMORY_REVIEW_DAG,
          targetAgentId: 'memorycard-agent',
          reason: '已有薄弱点 → 复习卡片并更新进度',
        };
      }
      return {
        intent,
        currentState,
        targetAgentId: 'memorycard-agent',
        reason: '请求复习卡片 → Memorycard Agent 调度 SM-2 间隔重复',
      };
    }

    case 'check_progress': {
      // 进度查询：直接路由到 Supervisor Agent
      return {
        intent,
        currentState,
        targetAgentId: 'supervisor-agent',
        reason: '查询进度 → Supervisor Agent 生成进度看板与报告',
      };
    }

    case 'free_chat':
    default:
      return {
        intent: 'free_chat',
        currentState,
        targetAgentId: 'orchestrator',
        reason: '自由对话默认路由到 Orchestrator，按意图二次路由',
      };
  }
}
