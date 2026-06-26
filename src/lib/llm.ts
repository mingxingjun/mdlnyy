import type { LLMConfig, GeneratedQuestion } from '@/store/useAppStore';

export interface ParseResult {
  subjectId: string;
  subjectName: string;
  knowledgePoints: string[];
  questions: GeneratedQuestion[];
}

const SUBJECT_IDS = ['math', 'english', 'linear', 'programming', 'physics'] as const;
const SUBJECT_NAMES: Record<string, string> = {
  math: '高等数学',
  english: '大学英语',
  linear: '线性代数',
  programming: '程序设计',
  physics: '大学物理',
};

const SYSTEM_PROMPT = `你是一位大学期末复习助手。根据学生上传的复习资料片段，分析学科内容，提取核心知识点，并生成5道四选一选择题。

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

export async function parseMaterialAndGenerateQuestions(
  fileContent: string,
  fileName: string,
  config: LLMConfig
): Promise<ParseResult> {
  const truncatedContent = fileContent.length > 3000
    ? fileContent.slice(0, 3000) + '\n...(内容已截断)'
    : fileContent;

  const userPrompt = `文件名：${fileName}\n\n复习资料内容：\n${truncatedContent}`;

  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
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

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
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
      steps: Array.isArray(q.steps) ? q.steps.slice(0, 5).map((s: any) => String(s).slice(0, 200)) : ['仔细审题', '运用相关知识', '得出答案'],
      mistakes: Array.isArray(q.mistakes) ? q.mistakes.slice(0, 3).map((m: any) => String(m).slice(0, 100)) : [],
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    })) as GeneratedQuestion[];

  if (validQuestions.length === 0) {
    throw new Error('AI生成的题目格式无效，请重试');
  }

  return {
    subjectId: parsed.subjectId,
    subjectName: SUBJECT_NAMES[parsed.subjectId] || '综合',
    knowledgePoints: parsed.knowledgePoints.slice(0, 10).map((k: any) => String(k).slice(0, 30)),
    questions: validQuestions.slice(0, 5),
  };
}
