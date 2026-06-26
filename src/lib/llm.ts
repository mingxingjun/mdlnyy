import type { ModelConfig, ModelRoleConfig, GeneratedQuestion, LLMConfig } from '@/store/useAppStore';

export const PRESET_BASE_URLS = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  { id: 'kimi', name: 'Kimi 月之暗面', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  { id: 'zhipu', name: '智谱清言', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
  { id: 'custom', name: '自定义', baseUrl: '', defaultModel: '' },
] as const;

const SUBJECT_IDS = ['math', 'english', 'linear', 'programming', 'physics'] as const;
const SUBJECT_NAMES: Record<string, string> = {
  math: '高等数学',
  english: '大学英语',
  linear: '线性代数',
  programming: '程序设计',
  physics: '大学物理',
};

export interface ParseResult {
  subjectId: string;
  subjectName: string;
  knowledgePoints: string[];
  questions: GeneratedQuestion[];
}

export interface DocumentParseResult {
  subjectId: string;
  subjectName: string;
  knowledgePoints: { name: string; summary: string }[];
  structuredOutline: string;
}

export interface FullParseResult {
  subjectId: string;
  subjectName: string;
  knowledgePoints: string[];
  questions: GeneratedQuestion[];
}

async function callLLM(
  config: ModelConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.7,
  };

  if (options?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API请求失败(${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API返回内容为空');
  }

  return content;
}

function getModelForRole(
  role: keyof ModelRoleConfig,
  roles: ModelRoleConfig,
  modelConfigs: ModelConfig[]
): ModelConfig | null {
  const modelId = roles[role];
  if (modelId) {
    const model = modelConfigs.find((m) => m.id === modelId && m.enabled && m.apiKey.trim() !== '');
    if (model) return model;
  }

  const allRoles: Array<keyof ModelRoleConfig> = ['document', 'quiz', 'explanation'];
  for (const otherRole of allRoles) {
    if (otherRole === role) continue;
    const otherModelId = roles[otherRole];
    if (otherModelId) {
      const model = modelConfigs.find((m) => m.id === otherModelId && m.enabled && m.apiKey.trim() !== '');
      if (model) return model;
    }
  }

  const anyEnabled = modelConfigs.find((m) => m.enabled && m.apiKey.trim() !== '');
  if (anyEnabled) return anyEnabled;

  return null;
}

function parseJSONResponse(content: string): any {
  let jsonStr = content.trim();

  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // ignore
      }
    }

    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e3) {
        // ignore
      }
    }

    throw new Error('AI返回格式解析失败，请重试');
  }
}

export async function parseDocument(
  fileContent: string,
  fileName: string,
  model: ModelConfig
): Promise<DocumentParseResult> {
  const truncatedContent = fileContent.length > 8000
    ? fileContent.slice(0, 8000) + '\n...(内容已截断)'
    : fileContent;

  const systemPrompt = `你是一位大学课程助教，负责分析复习资料。请阅读以下资料片段，完成结构化分析。

要求：
1. 判断学科：从 math(高等数学)/english(大学英语)/linear(线性代数)/programming(程序设计)/physics(大学物理) 中选最匹配的
2. 提取5-8个核心知识点，每个知识点附1句话摘要
3. 整理章节结构大纲

必须严格返回JSON格式：
{
  "subjectId": "math",
  "knowledgePoints": [
    {"name": "知识点名称", "summary": "一句话摘要"}
  ],
  "structuredOutline": "章节结构的纯文本描述"
}`;

  const userPrompt = `文件名：${fileName}\n\n复习资料内容：\n${truncatedContent}`;

  const content = await callLLM(
    model,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.3, jsonMode: true }
  );

  let parsed;
  try {
    parsed = parseJSONResponse(content);
  } catch (e) {
    throw new Error('文档解析失败：AI返回格式无法解析');
  }

  let subjectId = parsed.subjectId;
  if (!subjectId || !SUBJECT_IDS.includes(subjectId)) {
    subjectId = 'math';
  }

  let knowledgePoints = parsed.knowledgePoints;
  if (!Array.isArray(knowledgePoints)) {
    knowledgePoints = [];
  }
  knowledgePoints = knowledgePoints
    .filter((kp: any) => kp && typeof kp.name === 'string')
    .map((kp: any) => ({
      name: String(kp.name).slice(0, 50),
      summary: String(kp.summary || '').slice(0, 200),
    }));

  const structuredOutline = String(parsed.structuredOutline || '').slice(0, 2000);

  return {
    subjectId,
    subjectName: SUBJECT_NAMES[subjectId] || '综合',
    knowledgePoints,
    structuredOutline,
  };
}

export async function generateQuestions(
  knowledgePoints: { name: string; summary: string }[],
  subjectId: string,
  model: ModelConfig,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const subjectName = SUBJECT_NAMES[subjectId] || '综合';

  const kpList = knowledgePoints
    .map((kp) => `• ${kp.name} - ${kp.summary}`)
    .join('\n');

  const systemPrompt = `你是一位大学期末命题老师。根据以下知识点，生成${count}道四选一选择题。

知识点：
${kpList}

学科：${subjectName}

要求：
1. 共${count}道题，难度分布：easy 2道、medium 2道、hard 1道
2. 选项要有迷惑性，错误选项要像模像样
3. 每道题包含：
   - question: 题目内容
   - options: 4个选项字符串
   - correctIndex: 0-3
   - explanation: 简洁解释
   - steps: 2-4个解题步骤
   - mistakes: 1-2个常见易错点
   - difficulty: easy|medium|hard
4. 用中文出题

返回严格JSON：
{
  "questions": [
    { "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "...", "steps": ["..."], "mistakes": ["..."], "difficulty": "easy" }
  ]
}`;

  const content = await callLLM(
    model,
    [{ role: 'system', content: systemPrompt }],
    { temperature: 0.7, jsonMode: true }
  );

  let parsed;
  try {
    parsed = parseJSONResponse(content);
  } catch (e) {
    throw new Error('题目生成失败：AI返回格式无法解析');
  }

  let questions = parsed.questions;
  if (!Array.isArray(questions)) {
    throw new Error('AI未生成有效题目');
  }

  const validQuestions = questions
    .filter((q: Partial<GeneratedQuestion>) =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === 'number' &&
      q.correctIndex >= 0 && q.correctIndex < 4
    )
    .map((q: any) => ({
      question: String(q.question).slice(0, 300),
      options: q.options.map((o: any) => String(o).slice(0, 200)),
      correctIndex: Math.min(3, Math.max(0, q.correctIndex)),
      explanation: String(q.explanation || '').slice(0, 500) || '解析略',
      steps: Array.isArray(q.steps)
        ? q.steps.slice(0, 5).map((s: any) => String(s).slice(0, 200))
        : ['仔细审题', '运用相关知识', '得出答案'],
      mistakes: Array.isArray(q.mistakes)
        ? q.mistakes.slice(0, 3).map((m: any) => String(m).slice(0, 100))
        : [],
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty)
        ? q.difficulty
        : 'medium') as 'easy' | 'medium' | 'hard',
    })) as GeneratedQuestion[];

  if (validQuestions.length < 2) {
    throw new Error('AI生成的有效题目不足，请重试');
  }

  return validQuestions.slice(0, 5);
}

const LEGACY_SYSTEM_PROMPT = `你是一位大学期末复习助手。根据学生上传的复习资料片段，分析学科内容，提取核心知识点，并生成5道四选一选择题。

要求：
1. 判断最可能的学科，从以下选择：math(高等数学)、english(大学英语)、linear(线性代数)、programming(程序设计)、physics(大学物理)
2. 提取5-8个核心知识点
3. 生成5道选择题，覆盖不同难度：easy 2道、medium 2道、hard 1道
4. 每道题有4个选项，只有1个正确答案
5. 每道题包含：简短解释(explanation)、2-4个解题步骤(steps)、1-2个易错点(mistakes)
6. 所有内容用中文回答

必须严格返回以下JSON格式（不要添加markdown代码块标记，直接返回JSON字符串）：
{
  "subjectId": "math|english|linear|programming|physics",
  "knowledgePoints": ["知识点1", "知识点2", "..."],
  "questions": [
    {
      "question": "题目内容",
      "options": ["A选项内容", "B选项内容", "C选项内容", "D选项内容"],
      "correctIndex": 0,
      "explanation": "简短解释为什么选这个答案",
      "steps": ["步骤1", "步骤2"],
      "mistakes": ["易错点1"],
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

async function singleModelParseAndGenerate(
  fileContent: string,
  fileName: string,
  model: ModelConfig
): Promise<FullParseResult> {
  const truncatedContent = fileContent.length > 3000
    ? fileContent.slice(0, 3000) + '\n...(内容已截断)'
    : fileContent;

  const userPrompt = `文件名：${fileName}\n\n复习资料内容：\n${truncatedContent}`;

  const content = await callLLM(
    model,
    [
      { role: 'system', content: LEGACY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7, jsonMode: true }
  );

  let parsed;
  try {
    parsed = parseJSONResponse(content);
  } catch (e) {
    throw new Error('AI返回格式解析失败，请重试');
  }

  if (!parsed.subjectId || !SUBJECT_IDS.includes(parsed.subjectId)) {
    parsed.subjectId = 'math';
  }
  if (!Array.isArray(parsed.knowledgePoints)) parsed.knowledgePoints = [];
  if (!Array.isArray(parsed.questions)) throw new Error('AI未生成有效题目');

  const validQuestions = parsed.questions
    .filter((q: Partial<GeneratedQuestion>) =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === 'number' &&
      q.correctIndex >= 0 && q.correctIndex < 4
    )
    .map((q: any) => ({
      question: String(q.question).slice(0, 300),
      options: q.options.map((o: any) => String(o).slice(0, 200)),
      correctIndex: Math.min(3, Math.max(0, q.correctIndex)),
      explanation: String(q.explanation || '').slice(0, 500) || '解析略',
      steps: Array.isArray(q.steps)
        ? q.steps.slice(0, 5).map((s: any) => String(s).slice(0, 200))
        : ['仔细审题', '运用相关知识', '得出答案'],
      mistakes: Array.isArray(q.mistakes)
        ? q.mistakes.slice(0, 3).map((m: any) => String(m).slice(0, 100))
        : [],
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty)
        ? q.difficulty
        : 'medium') as 'easy' | 'medium' | 'hard',
    })) as GeneratedQuestion[];

  if (validQuestions.length < 2) {
    throw new Error('AI生成的有效题目不足，请重试');
  }

  return {
    subjectId: parsed.subjectId,
    subjectName: SUBJECT_NAMES[parsed.subjectId] || '综合',
    knowledgePoints: parsed.knowledgePoints.slice(0, 10).map((k: any) => String(k).slice(0, 30)),
    questions: validQuestions.slice(0, 5),
  };
}

export async function parseAndGenerateQuiz(
  fileContent: string,
  fileName: string,
  roles: ModelRoleConfig,
  modelConfigs: ModelConfig[]
): Promise<FullParseResult> {
  const docModel = getModelForRole('document', roles, modelConfigs);
  const quizModel = getModelForRole('quiz', roles, modelConfigs);

  if (!docModel && !quizModel) {
    throw new Error('请先配置AI模型');
  }

  if (docModel && quizModel && docModel.id === quizModel.id) {
    return singleModelParseAndGenerate(fileContent, fileName, docModel);
  }

  if (docModel && !quizModel) {
    return singleModelParseAndGenerate(fileContent, fileName, docModel);
  }

  if (!docModel && quizModel) {
    return singleModelParseAndGenerate(fileContent, fileName, quizModel);
  }

  if (docModel && quizModel) {
    const docResult = await parseDocument(fileContent, fileName, docModel);
    const questions = await generateQuestions(
      docResult.knowledgePoints,
      docResult.subjectId,
      quizModel
    );

    return {
      subjectId: docResult.subjectId,
      subjectName: docResult.subjectName,
      knowledgePoints: docResult.knowledgePoints.map((kp) => kp.name),
      questions,
    };
  }

  throw new Error('请先配置AI模型');
}

export async function parseMaterialAndGenerateQuestions(
  fileContent: string,
  fileName: string,
  config: LLMConfig
): Promise<ParseResult> {
  const tempModelConfig: ModelConfig = {
    id: 'temp-legacy',
    name: 'Legacy Model',
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    enabled: true,
  };

  const roles: ModelRoleConfig = {
    document: 'temp-legacy',
    quiz: 'temp-legacy',
    explanation: 'temp-legacy',
  };

  const result = await parseAndGenerateQuiz(
    fileContent,
    fileName,
    roles,
    [tempModelConfig]
  );

  return {
    subjectId: result.subjectId,
    subjectName: result.subjectName,
    knowledgePoints: result.knowledgePoints,
    questions: result.questions,
  };
}
