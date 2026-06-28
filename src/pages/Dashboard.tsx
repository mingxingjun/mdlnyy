import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Trash2, Loader2, Clock, RefreshCw,
  AlertCircle, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { StudyMaterial, KnowledgePoint, Question } from '@/store/useAppStore';
import type { LearningState } from '@/lib/agents/types';
import { useToastStore } from '@/components/Toast';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { extractFileText } from '@/lib/fileParser';
import PaperCard from '@/components/PaperCard';
import type { PaperCardStatus } from '@/components/PaperCard';
import VintageTag from '@/components/VintageTag';
import StickyNote from '@/components/StickyNote';

/* ═══════════════════════════════════════════════════════
   常量与映射
   ═══════════════════════════════════════════════════════ */

const LEARNING_STATE_LABEL: Record<LearningState, string> = {
  Onboarded: '已注册',
  MaterialReady: '资料已上传',
  KnowledgeReady: '知识点就绪',
  Practicing: '练习中',
  WeaknessAnalyzed: '薄弱已分析',
  Reviewed: '复习完成',
  ExamReady: '备考就绪',
};

const LEARNING_STATE_TAG_COLOR: Record<LearningState, 'worn' | 'ink' | 'gold' | 'seal' | 'green'> = {
  Onboarded: 'worn',
  MaterialReady: 'ink',
  KnowledgeReady: 'gold',
  Practicing: 'seal',
  WeaknessAnalyzed: 'seal',
  Reviewed: 'green',
  ExamReady: 'green',
};

/** 知识点提取系统提示词（内联，用于解析上传资料） */
const KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = `你是「知识点提取器」，从学习资料中提取结构化知识点。

【输入】学习资料的纯文本（可能含杂乱字符）
【输出】严格 JSON，遵循以下 schema：
{
  "knowledgePoints": [
    {
      "name": "知识点名称（不超过 20 字）",
      "description": "知识点描述（不超过 100 字）",
      "priority": 3,
      "tags": ["标签1", "标签2"]
    }
  ]
}

【提取原则】
- 每个知识点原子化，只表达一个概念或公式
- priority：5 = 核心公式 / 高频考点；3 = 重要概念；1 = 辅助了解
- tags：从题型、章节、难度等维度打标签，不超过 4 个
- 不臆造资料中没有的内容
- 若资料为乱码或无意义文本，返回 { "knowledgePoints": [] }

【输出约束】
- 仅输出 JSON，不要任何 markdown 代码块标记、不要解释文字
- 中文输出`;

/** 题库提取系统提示词：从资料中识别并结构化题目，填空题主动挖空 */
const QUESTION_BANK_EXTRACTION_SYSTEM_PROMPT = `你是「题库解析器」，从学习资料中识别并结构化抽取所有题目。

【输入】可能含题目的学习资料纯文本（含题干、选项、标准答案、解析等）
【输出】严格 JSON，遵循以下 schema：
{
  "questions": [
    {
      "type": "choice | fill | short | calculation",
      "difficulty": 1-5,
      "stem": "题干（填空题必须挖空，见下方【填空题挖空规则】）",
      "options": ["A. ...", "B. ..."],
      "answer": "标准答案（填空题填挖出的答案；原文缺失则留空字符串）",
      "explanation": "原文解析（无则留空字符串）",
      "hasStandardAnswer": true | false
    }
  ]
}

【题目识别规则——务必宽松识别，宁可多抽不可漏抽】
- 凡是"以提问/指令形式要求作答"的文本都算题目，包括但不限于：
  · 编号题（1. 2. 3. / 一、二、三、 / (1)(2)(3)）
  · 问号结尾的句子（"什么是...？" "如何计算...？"）
  · 含"试证明/求/计算/简述/论述/列举/分析/比较"等指令词的句子
  · 选择题（含 A/B/C/D 选项）
  · 填空题（含下划线 ___ 或空格待填）
  · 判断题（对/错）
- 即使题目散落在正文段落中，只要符合上述特征就抽取
- 只要资料中能找到 ≥1 道题，就必须抽取，不要返回空数组

【填空题挖空规则——最重要，务必严格执行】
很多资料是"答案版"：填空题的答案直接夹在下划线/空格里。你必须把答案剥离到 answer 字段，题干对应位置统一用 6 个下划线 ______ 占位，绝不能让答案残留在题干中。

识别"答案版"填空题的模式（答案被包裹）：
  · 双下划线包裹：__答案__  例如"数字信号具有__离散__性"
  · 多下划线包裹：___答案___  例如"8421BCD 码是___00010110___"
  · 下划线+答案：___答案  或  答案___  例如"用___1___表示高电平"
  · 括号包裹答案：（答案） 【答案】 等

处理示例：
原文"十进制数 16 的 8421BCD 码是__00010110__。"
  → stem: "十进制数 16 的 8421BCD 码是______。"
  → answer: "00010110"
  → hasStandardAnswer: true

原文"通常用___1___表示高电平，用___0___表示低电平。"
  → stem: "通常用______表示高电平，用______表示低电平。"
  → answer: "1；0"   （多空用「；」分隔，按出现顺序）
  → hasStandardAnswer: true

原文"-78 的原码___11001110___，反码___10110001___，补码___10110010___。"
  → stem: "-78 的原码______，反码______，补码______。"
  → answer: "11001110；10110001；10110010"
  → hasStandardAnswer: true

原文"8421BCD 码是一种___有权___码（填 \\"有权\\" 或 \\"无权\\"）。"
  → stem: "8421BCD 码是一种______码（填 \\"有权\\" 或 \\"无权\\"）。"
  → answer: "有权"
  → hasStandardAnswer: true
  （注意：括号里的"有权""无权"是提示语不是答案，只有下划线间的才是答案）

若原文已是"空题版"（下划线间无答案，如"______ 表示高电平"），answer 填空字符串，hasStandardAnswer=false。

【抽取原则】
- 选项、解析尽量保留原文表述，不臆造、不补全
- 填空题必须按上方规则挖空，这是唯一允许改写题干的情况
- 若原文在题干外另给答案（如"答案：B""参考答案：xxx"），answer 填该答案，hasStandardAnswer=true
- type 推断：含 A/B/C/D 选项为 choice，含下划线/空格填空为 fill，含"计算/求解/求/证明"为 calculation，其余为 short
- difficulty：原文标注则用，否则按题干复杂度估 1-5
- 只有当资料确实是纯概念论述、完全不含任何题目时，才返回 { "questions": [] }

【输出约束】
- 仅输出 JSON，不要任何 markdown 代码块标记、不要解释文字
- 中文输出`;

/** 活动入口卡片配置 */
interface ActivityCardConfig {
  view: 'practice' | 'wrongbook' | 'memory' | 'supervisor';
  icon: string;
  title: string;
  description: string;
}

const ACTIVITY_CARDS: ActivityCardConfig[] = [
  { view: 'practice', icon: '✍️', title: '开始练习', description: '基于知识点出题，即时判定对错并讲解。' },
  { view: 'wrongbook', icon: '📕', title: '错题本', description: '回顾错题、步骤化讲解与薄弱点分析。' },
  { view: 'memory', icon: '🃏', title: '记忆卡片', description: 'SM-2 间隔重复，巩固长期记忆。' },
  { view: 'supervisor', icon: '📊', title: '学习报告', description: '进度看板、薄弱点与复习建议。' },
];

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getExamCountdown(examDate?: string): { days: number; passed: boolean; label: string } {
  if (!examDate) return { days: 0, passed: false, label: '未设置考试日期' };
  const target = new Date(`${examDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return { days: 0, passed: false, label: '未设置考试日期' };
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, passed: true, label: '考试已过' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, passed: false, label: `距考试 ${days} 天` };
}

function detectMaterialType(file: File): StudyMaterial['type'] {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'word';
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'ppt';
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
  return 'text';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 检查文档解析任务的 provider 是否已配置 API Key（ollama 无需 key） */
function isApiKeyConfigured(): boolean {
  try {
    const settings = loadModelSettings();
    return isTaskConfigured(settings, 'doc_parse');
  } catch {
    return false;
  }
}

/** 提取首个完整 JSON 片段（对象或数组），剥离 markdown 代码围栏与多余文本，并做常见容错 */
function extractJson(content: string): string {
  let cleaned = content.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    cleaned = fence[1].trim();
  } else {
    const startObj = cleaned.indexOf('{');
    const startArr = cleaned.indexOf('[');
    const start = startObj === -1 ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr));
    if (start < 0) return cleaned;
    const openCh = cleaned[start];
    const closeCh = openCh === '[' ? ']' : '}';
    const end = cleaned.lastIndexOf(closeCh);
    if (end > start) {
      cleaned = cleaned.slice(start, end + 1);
    } else {
      cleaned = cleaned.slice(start);
    }
  }
  // 容错 1：尾随逗号（] 或 } 前的逗号）
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // 容错 2：控制字符（保留 \n \t）
  cleaned = cleaned.replace(/[\x00-\x1f]/g, (m) => (m === '\n' || m === '\t' ? m : ' '));

  // 策略：中文引号（U+201C/201D）在 JSON 字符串值内部是合法字符，不应无脑转成英文双引号，
  // 否则会把题干里原本合法的 "有权" 破坏成会断 JSON 的 "有权"。
  // 因此先尝试「不转换中文引号」直接解析；失败再转换 + 状态机修复。
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // 失败：可能是 LLM 用中文引号作 JSON 结构字符，转成英文引号再试
    let converted = cleaned
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    try {
      JSON.parse(converted);
      return converted;
    } catch {
      // 仍失败：修复字符串值内部的未转义双引号
      return escapeUnescapedQuotesInStrings(converted);
    }
  }
}

/**
 * 修复 JSON 字符串值内部的未转义双引号。
 * LLM 常把题干里的引号直接写成 " 而不转义，导致 JSON.parse 失败。
 * 策略：状态机遍历，识别字符串边界（"..."），字符串内遇到非转义的 " 时补 \。
 */
function escapeUnescapedQuotesInStrings(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
      i++;
      continue;
    }
    // 在字符串内
    if (ch === '\\') {
      // 转义序列，原样保留两个字符
      result += ch;
      if (i + 1 < json.length) {
        result += json[i + 1];
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    if (ch === '"') {
      // 判断这个 " 是字符串结束，还是字符串内部的未转义引号
      // 启发式：看后面紧跟的字符。若是 , } ] : 空白 换行，视为字符串结束；否则视为内部引号需转义
      const nextCh = json[i + 1];
      if (nextCh === undefined || nextCh === ',' || nextCh === '}' || nextCh === ']' || nextCh === ':' || nextCh === ' ' || nextCh === '\n' || nextCh === '\r' || nextCh === '\t') {
        result += '"';
        inString = false;
        i++;
      } else {
        // 字符串内部的引号，转义
        result += '\\"';
        i++;
      }
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

/** 兼容多种字段名读取字符串 */
function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
}

/** 从对象数组中定位列表字段，兼容 knowledgePoints / questions / points / items / data 等键，以及裸数组 */
function locatePointsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== 'object' || parsed === null) return [];
  const obj = parsed as Record<string, unknown>;
  const candidateKeys = [
    'knowledgePoints', 'knowledge_points', 'points', 'items', 'list', 'data', 'result', 'results',
    'questions',  // 题库解析返回 { questions: [...] }
    'answers',    // AI 补答返回 { answers: [...] }
  ];
  for (const k of candidateKeys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  // 嵌套：{ data: { points: [...] } }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = locatePointsArray(v);
      if (nested.length > 0) return nested;
    }
  }
  return [];
}

function normalizePoint(p: unknown, materialId: string): KnowledgePoint | null {
  // 裸字符串 → 仅名称
  if (typeof p === 'string') {
    const name = p.trim();
    if (!name) return null;
    return {
      id: crypto.randomUUID(), materialId,
      name: name.slice(0, 60), description: '',
      priority: 3, mastery: 0, relatedIds: [], tags: [],
      createdAt: Date.now(),
    };
  }
  if (typeof p !== 'object' || p === null) return null;
  const o = p as Record<string, unknown>;
  const name = pickString(o, ['name', 'title', 'point', 'topic', 'concept', 'label', 'keyword']);
  if (!name) return null;
  const description = pickString(o, ['description', 'desc', 'detail', 'details', 'content', 'summary', 'explain', 'explanation']);
  const priorityRaw = typeof o.priority === 'number'
    ? o.priority
    : (typeof o.importance === 'number' ? o.importance : (typeof o.level === 'number' ? o.level : 3));
  const priority = Math.max(1, Math.min(5, Math.round(priorityRaw)));
  const tagsRaw = Array.isArray(o.tags)
    ? o.tags
    : (Array.isArray(o.labels) ? o.labels : []);
  return {
    id: crypto.randomUUID(), materialId,
    name: name.slice(0, 60),
    description: description.slice(0, 240),
    priority, mastery: 0, relatedIds: [],
    tags: tagsRaw.filter((t) => typeof t === 'string' || typeof t === 'number').map((t) => String(t)).slice(0, 4),
    createdAt: Date.now(),
  } satisfies KnowledgePoint;
}

/** 从 LLM 返回内容中解析知识点 JSON，容错处理代码块、裸数组、嵌套结构与字段名差异 */
function parseKnowledgePointsResponse(content: string, materialId: string): KnowledgePoint[] {
  if (!content || !content.trim()) return [];
  const jsonStr = extractJson(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // 退化：尝试从文本中正则提取 name 字段（兜底，避免完全静默失败）
    return [];
  }
  const rawPoints = locatePointsArray(parsed);
  if (rawPoints.length === 0) return [];
  const points: KnowledgePoint[] = [];
  for (const p of rawPoints) {
    const np = normalizePoint(p, materialId);
    if (np) points.push(np);
  }
  return points;
}

/* ── 题库解析 ────────────────────────────────────────── */

const VALID_QTYPES = ['choice', 'fill', 'short', 'calculation'] as const;

function coerceQType(t: unknown): Question['type'] {
  if (typeof t === 'string' && (VALID_QTYPES as readonly string[]).includes(t)) {
    return t as Question['type'];
  }
  return 'short';
}

function coerceDifficulty(n: unknown): Question['difficulty'] {
  if (typeof n === 'number' && Number.isFinite(n)) {
    const r = Math.round(n);
    if (r >= 1 && r <= 5) return r as Question['difficulty'];
  }
  if (typeof n === 'string') {
    const r = parseInt(n, 10);
    if (r >= 1 && r <= 5) return r as Question['difficulty'];
  }
  return 3;
}

/**
 * 从填空题题干中剥离"答案版"答案：识别 ___答案___ / __答案__ 模式，
 * 把夹在连续下划线之间的答案挖出，题干只保留空格 ______。
 * 同时收集所有挖出的答案（多空填空用「；」拼接）。
 *
 * 场景：用户上传的是"答案版"练习册，原文如
 *   "数字信号具有__离散__性" / "8421BCD 码是一种___有权___码"
 * LLM 常把答案连题干一起塞进 stem 字段，导致答案直接暴露。
 *
 * @returns { stem: 挖空后的题干, answers: 挖出的答案数组 }
 */
function extractBlanksFromStem(stem: string): { stem: string; answers: string[] } {
  if (!stem) return { stem, answers: [] };
  const answers: string[] = [];
  let cleaned = stem;
  // 模式 1：闭合下划线 ___答案___ / __答案__（2+ 下划线 + 1~40 字内容 + 2+ 下划线）
  // 内容可含中文引号、字母、数字、小数点、负号等，但不含下划线和换行
  const closedRe = /_{2,}([^_\n]{1,40}?)_{2,}/g;
  cleaned = cleaned.replace(closedRe, (_, content: string) => {
    const ans = content.trim();
    if (ans) answers.push(ans);
    return '______';
  });
  // 模式 2：半边下划线 ___答案（无闭合，答案紧跟在下划线后到标点/空格/句末）
  // 仅在模式 1 没挖到答案时启用，避免误伤。匹配：下划线 + 非空白非下划线内容 + 边界（标点/空格/句末）
  if (answers.length === 0) {
    const openRe = /_{2,}([^\s_,，。；：、!?！？\n]{1,40})/g;
    const remaining = cleaned.replace(openRe, (_, content: string) => {
      const ans = content.trim();
      if (ans) answers.push(ans);
      return '______';
    });
    if (answers.length > 0) cleaned = remaining;
  }
  return { stem: cleaned, answers };
}

/** 从题库解析 LLM 返回中提取题目列表，严格保留原文，区分有/无标准答案 */
function parseQuestionBankResponse(content: string, materialId: string): Question[] {
  if (!content || !content.trim()) return [];
  const jsonStr = extractJson(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[题库解析] JSON.parse 失败：', err instanceof Error ? err.message : err, '\n清理后内容前 300 字：', jsonStr.slice(0, 300));
    // 最终兜底：用正则逐题提取，尽可能挽救题目
    const fallback = extractQuestionsByRegex(content, materialId);
    if (fallback.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[题库解析] JSON.parse 失败，正则兜底提取到 ${fallback.length} 道题`);
    }
    return fallback;
  }
  const rawQs = locatePointsArray(parsed);
  if (rawQs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[题库解析] locatePointsArray 未找到数组，parsed 类型：', typeof parsed, parsed instanceof Array ? 'Array' : '');
    // 兜底：正则提取
    return extractQuestionsByRegex(content, materialId);
  }

  return rawQs
    .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
    .map((q, i): Question => {
      // 字段名兼容：LLM 可能用不同键名
      const stem = pickString(q, ['stem', 'question', 'content', 'title', 'problem', 'body', 'text', '题干']);
      const answer = pickString(q, ['answer', 'solution', 'ans', 'response', 'correct_answer', 'correctAnswer', 'key', '标准答案', '答案']);
      const explanation = pickString(q, ['explanation', 'analysis', '解析', '解答', '分析', 'reason', 'explain']);
      const typeStr = pickString(q, ['type', 'questionType', '题型']);
      // options 兼容多种键名
      const optsRaw = q.options ?? q.choices ?? q['选项'];
      const options = Array.isArray(optsRaw)
        ? optsRaw.filter((o): o is string => typeof o === 'string')
        : undefined;
      const answerStr = answer;
      const hasStd = q.hasStandardAnswer === true || q.hasStandardAnswer === 'true' || answerStr.length > 0;
      // 后处理：从题干剥离"答案版"答案 ___答案___ → 题干留空，答案写入 answer
      // 仅当挖出的答案非空且原 answer 为空时才覆盖（避免覆盖 LLM 已正确填写的答案）
      const { stem: blankedStem, answers: blankAnswers } = extractBlanksFromStem(stem);
      let finalStem = stem;
      let finalAnswer = answerStr;
      let finalHasStd = hasStd;
      if (blankAnswers.length > 0) {
        finalStem = blankedStem;
        const blankAnsStr = blankAnswers.join('；');
        // 原 answer 为空 → 用挖出的答案；原 answer 非空 → 优先原答案，但保留挖空后的题干
        if (!answerStr) {
          finalAnswer = blankAnsStr;
          finalHasStd = true;
        }
      }
      return {
        id: crypto.randomUUID(),
        materialId,
        knowledgePointIds: [],
        type: coerceQType(typeStr || q.type),
        difficulty: coerceDifficulty(q.difficulty),
        stem: finalStem,
        options: options && options.length > 0 ? options : undefined,
        answer: finalAnswer,
        explanation,
        source: 'bank',
        bankId: materialId,
        aiFilled: !finalHasStd,
        createdAt: Date.now() + i,
      };
    })
    .filter((q) => q.stem.length > 0);
}

/**
 * 正则兜底提取：当 JSON.parse 彻底失败时，用正则从原始文本中逐题提取。
 * 匹配形如 "stem": "..." 的键值对，兼容字段名变体。
 */
function extractQuestionsByRegex(content: string, materialId: string): Question[] {
  const questions: Question[] = [];
  // 匹配每个题目对象：从 { 开始到下一个 { 或数组结束
  const objRegex = /\{[^{}]*\}/g;
  const matches = content.match(objRegex) ?? [];

  matches.forEach((objStr, i) => {
    // 从对象字符串中提取各字段值（匹配 "key": "value" 或 "key":"value"）
    const getField = (keys: string[]): string => {
      for (const k of keys) {
        const re = new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
        const m = objStr.match(re);
        if (m && m[1]) return m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
      }
      return '';
    };
    const stem = getField(['stem', 'question', 'content', 'title', 'problem', 'body', 'text', '题干']);
    if (!stem) return;
    const answer = getField(['answer', 'solution', 'ans', 'correct_answer', 'correctAnswer', '标准答案', '答案']);
    const explanation = getField(['explanation', 'analysis', '解析', '解答', '分析']);
    const typeStr = getField(['type', 'questionType', '题型']);
    // options 正则提取
    const optsMatch = objStr.match(/"options"\s*:\s*\[([^\]]*)\]/i);
    let options: string[] | undefined;
    if (optsMatch && optsMatch[1]) {
      options = (optsMatch[1].match(/"([^"]*)"/g) ?? [])
        .map((s) => s.replace(/^"|"$/g, '').trim())
        .filter((s) => s.length > 0);
      if (options.length === 0) options = undefined;
    }
    const hasStd = answer.length > 0;
    // 同样剥离题干中的"答案版"答案
    const { stem: blankedStem, answers: blankAnswers } = extractBlanksFromStem(stem);
    let finalStem = stem;
    let finalAnswer = answer;
    let finalHasStd = hasStd;
    if (blankAnswers.length > 0) {
      finalStem = blankedStem;
      if (!answer) {
        finalAnswer = blankAnswers.join('；');
        finalHasStd = true;
      }
    }
    questions.push({
      id: crypto.randomUUID(),
      materialId,
      knowledgePointIds: [],
      type: coerceQType(typeStr),
      difficulty: 3,
      stem: finalStem,
      options,
      answer: finalAnswer,
      explanation,
      source: 'bank',
      bankId: materialId,
      aiFilled: !finalHasStd,
      createdAt: Date.now() + i,
    });
  });
  return questions;
}

/**
 * 正则兜底提取 AI 补答返回的 answers 数组。
 * 当 JSON.parse 失败时，用正则从原始文本中逐项提取 { index, answer, explanation }。
 */
function extractAnswersByRegex(
  content: string,
): Array<{ index?: number; answer?: string; explanation?: string }> {
  const results: Array<{ index?: number; answer?: string; explanation?: string }> = [];
  // 匹配每个对象 { ... }（不含嵌套花括号）
  const objRegex = /\{[^{}]*\}/g;
  const matches = content.match(objRegex) ?? [];

  matches.forEach((objStr) => {
    // 提取字符串字段：兼容字段名变体
    const getField = (keys: string[]): string => {
      for (const k of keys) {
        const re = new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
        const m = objStr.match(re);
        if (m && m[1]) return m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
      }
      return '';
    };
    // 提取数字字段 index
    const indexMatch = objStr.match(/"index"\s*:\s*(-?\d+(?:\.\d+)?)/i);
    const index = indexMatch ? Math.trunc(Number(indexMatch[1])) : undefined;
    const answer = getField(['answer', 'solution', 'ans', 'correct_answer', 'correctAnswer', '答案']);
    const explanation = getField(['explanation', 'analysis', '解析', '解答', '分析']);
    // 至少要有 answer 或 explanation 才算有效项
    if (answer === '' && explanation === '' && index === undefined) return;
    results.push({ index, answer, explanation });
  });
  return results;
}

/** AI 补答系统提示词：为无标准答案的题库题补 answer + explanation */
const AI_FILL_ANSWER_SYSTEM_PROMPT = `你是「答题补全器」，为题库中缺失标准答案的题目补答。

【输入】若干题目的 JSON 数组（每题含 type/stem/options，answer 为空）
【输出】严格 JSON：
{
  "answers": [
    { "index": 0, "answer": "答案", "explanation": "简短解析（不超过 80 字）" }
  ]
}

【原则】
- 答案必须正确且唯一（选择题填字母如 "B"，填空/简答/计算填完整答案）
- 解析简洁，说明关键步骤或依据
- 仅输出 JSON，不要 markdown 代码块标记`;

/** 批量调用 AI 为缺失答案的题库题补答，返回 {id → {answer, explanation}} 映射 */
async function fillMissingAnswers(
  settings: ReturnType<typeof loadModelSettings>,
  questions: Question[],
  signal?: AbortSignal,
): Promise<Map<string, { answer: string; explanation: string }>> {
  const result = new Map<string, { answer: string; explanation: string }>();
  const missing = questions.filter((q) => !q.answer);
  if (missing.length === 0) return result;

  // 分批：每批最多 10 题，避免 token 溢出
  const BATCH = 10;
  for (let start = 0; start < missing.length; start += BATCH) {
    if (signal?.aborted) break;
    const batch = missing.slice(start, start + BATCH);
    const userMsg = `请为以下 ${batch.length} 道题补答：

${batch.map((q, i) => JSON.stringify({
  index: i,
  type: q.type,
  stem: q.stem,
  options: q.options,
})).join('\n')}

【输出 JSON Schema】
{ "answers": [ { "index": 0, "answer": "...", "explanation": "..." } ] }`;
    try {
      const { content } = await callModelForTask(
        settings, 'chat', AI_FILL_ANSWER_SYSTEM_PROMPT, userMsg, signal,
      );
      const jsonStr = extractJson(content);
      let parsed: { answers?: Array<{ index?: number; answer?: string; explanation?: string }> };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // 容错：正则提取 answers 数组
        parsed = { answers: extractAnswersByRegex(jsonStr) };
      }
      const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
      answers.forEach((a) => {
        const idx = typeof a.index === 'number' ? a.index : -1;
        if (idx < 0 || idx >= batch.length) return;
        const ans = String(a.answer ?? '').trim();
        if (!ans) return;
        result.set(batch[idx].id, {
          answer: ans,
          explanation: String(a.explanation ?? '').trim(),
        });
      });
    } catch {
      // 单批失败不影响其他批次，缺失的题保持空 answer
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   1. 页头
   ═══════════════════════════════════════════════════════ */

function DashboardHeader() {
  const learningState = useAppStore((s) => s.learningState);
  const reviewPlan = useAppStore((s) => s.reviewPlan);
  const currentUser = useAppStore((s) => s.currentUser);

  const countdown = useMemo(() => getExamCountdown(reviewPlan?.examDate), [reviewPlan?.examDate]);

  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full bg-ink-800 text-paper-50 flex items-center justify-center font-serif text-xl shadow-paper border-2 border-ink-700"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), transparent)' }}
        >
          优
        </div>
        <div>
          <p className="font-handwritten text-sm text-ink-500 leading-none">
            {currentUser ? `${currentUser} 的` : '优流手账 ·'}
          </p>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-900 font-bold tracking-wide leading-tight">
            期末复习手册
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <VintageTag color={LEARNING_STATE_TAG_COLOR[learningState]} className="text-sm">
          {LEARNING_STATE_LABEL[learningState]}
        </VintageTag>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] border font-serif text-sm ${
            countdown.passed
              ? 'bg-ink-500/10 text-ink-600 border-ink-500/15'
              : reviewPlan?.examDate
                ? 'bg-seal/10 text-seal border-seal/20'
                : 'bg-paper-200 text-ink-500 border-ink-600/15'
          }`}
        >
          <Clock size={14} />
          <span>{countdown.label}</span>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   2. 资料上传卡片
   ═══════════════════════════════════════════════════════ */

function MaterialUploadCard() {
  const {
    materials, addMaterial, updateMaterial, removeMaterial,
    addKnowledgePoints, replaceQuestionsByMaterial,
    setLearningState, learningState,
  } = useAppStore();
  const { addToast } = useToastStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  /** 上传资料类型：knowledge=拆知识点 / bank=题库导入 / auto=AI 自动识别 */
  const [materialKind, setMaterialKind] = useState<StudyMaterial['kind']>('auto');

  /** 知识点提取流程（原有逻辑） */
  const runKnowledgeExtraction = async (materialId: string, name: string, text: string): Promise<number> => {
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return 0;
    }
    updateMaterial(materialId, { status: 'parsing' });
    try {
      const settings = loadModelSettings();
      const userPrompt = `请从以下学习资料中提取知识点 JSON：

【资料名称】${name}

【资料内容】
${text.slice(0, 6000)}`;
      const { content } = await callModelForTask(
        settings,
        'doc_parse',
        KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
      );
      const points = parseKnowledgePointsResponse(content, materialId);
      updateMaterial(materialId, { status: 'parsed', parsedText: text });

      if (points.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('[知识点提取] 解析结果为空，原始返回前 500 字：', content.slice(0, 500));
        addToast('info', '资料已上传，但未提取到知识点（请检查资料是否含有效正文）');
      } else {
        addKnowledgePoints(points);
        if (learningState === 'Onboarded' || learningState === 'MaterialReady') {
          setLearningState('KnowledgeReady');
        }
        addToast('success', `成功提取 ${points.length} 个知识点`);
      }
      return points.length;
    } catch (err) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('error', `知识点提取失败：${err instanceof Error ? err.message : '未知错误'}`);
      return 0;
    }
  };

  /** 题库导入流程：抽取题目 → AI 补答缺失答案 → 写入 store */
  const runBankExtraction = async (materialId: string, name: string, text: string, showEmptyToast = true): Promise<number> => {
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return 0;
    }
    updateMaterial(materialId, { status: 'parsing' });
    try {
      const settings = loadModelSettings();
      // 1. 抽取题目（走 doc_parse 路由，Kimi 长上下文更适合解析长题库）
      const userPrompt = `请从以下资料中识别并结构化抽取所有题目 JSON：

【资料名称】${name}

【资料内容】
${text.slice(0, 8000)}`;
      const { content } = await callModelForTask(
        settings,
        'doc_parse',
        QUESTION_BANK_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
      );
      const questions = parseQuestionBankResponse(content, materialId);
      updateMaterial(materialId, { status: 'parsed', parsedText: text });

      if (questions.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('[题库解析] 解析结果为空，原始返回前 500 字：', content.slice(0, 500));
        if (showEmptyToast) {
          addToast('info', '资料已上传，但未识别到题目（若该资料实为知识点，请改用「知识点」类型重新上传）');
        }
        return 0;
      }

      // 2. 为无标准答案的题 AI 补答（分批，走 chat 路由）
      const missingCount = questions.filter((q) => !q.answer).length;
      if (missingCount > 0) {
        // 检查 chat 路由是否可用，不可用则跳过补答（题目仍入库，答案为空）
        const chatReady = isTaskConfigured(settings, 'chat');
        if (chatReady) {
          addToast('info', `识别到 ${questions.length} 道题，其中 ${missingCount} 道无标准答案，正在 AI 补答…`);
          const fillMap = await fillMissingAnswers(settings, questions);
          if (fillMap.size > 0) {
            questions.forEach((q) => {
              const filled = fillMap.get(q.id);
              if (filled) {
                q.answer = filled.answer;
                if (!q.explanation) q.explanation = filled.explanation;
                q.aiFilled = true;
              }
            });
          }
        } else {
          addToast('info', `识别到 ${questions.length} 道题，其中 ${missingCount} 道无标准答案（未配置出题模型，跳过 AI 补答）`);
        }
      }

      // 3. 写入 store（替换该 materialId 下旧题）
      replaceQuestionsByMaterial(materialId, questions);
      if (learningState === 'Onboarded' || learningState === 'MaterialReady') {
        setLearningState('KnowledgeReady');
      }
      const aiFilled = questions.filter((q) => q.aiFilled).length;
      const stdCount = questions.length - aiFilled;
      addToast(
        'success',
        `成功导入 ${questions.length} 道题（标准答案 ${stdCount} 道${aiFilled > 0 ? `，AI 补答 ${aiFilled} 道` : ''}）`,
      );
      return questions.length;
    } catch (err) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('error', `题库解析失败：${err instanceof Error ? err.message : '未知错误'}`);
      return 0;
    }
  };

  /** 统一入口：按 materialKind 分流到知识点或题库流程；auto 采用双试策略 */
  const runExtraction = async (materialId: string, name: string, text: string, kind: StudyMaterial['kind']) => {
    if (kind === 'knowledge') {
      await runKnowledgeExtraction(materialId, name, text);
      return;
    }
    if (kind === 'bank') {
      await runBankExtraction(materialId, name, text);
      return;
    }
    // auto：双试策略——先试题库解析，0 题再试知识点提取（都走 doc_parse，不依赖 chat 路由）
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return;
    }
    addToast('info', '自动识别中：先尝试题库解析…');
    const bankCount = await runBankExtraction(materialId, name, text, false);
    if (bankCount > 0) {
      updateMaterial(materialId, { kind: 'bank' });
      return;
    }
    // 题库解析返回 0 题，回退到知识点提取
    addToast('info', '未识别到题目，改试知识点提取…');
    const kpCount = await runKnowledgeExtraction(materialId, name, text);
    if (kpCount > 0) {
      updateMaterial(materialId, { kind: 'knowledge' });
    } else {
      updateMaterial(materialId, { kind: 'knowledge' });
      addToast('warning', '既未识别到题目也未提取到知识点，请检查资料内容或手动选择「知识点/题库」类型重新上传');
    }
  };

  const handleFile = async (file: File) => {
    if (isParsing) return;

    // 1. 创建资料条目，状态置为 parsing
    const id = crypto.randomUUID();
    const material: StudyMaterial = {
      id,
      name: file.name,
      type: detectMaterialType(file),
      kind: materialKind,
      size: file.size,
      uploadedAt: Date.now(),
      status: 'parsing',
    };
    addMaterial(material);
    setIsParsing(true);

    // 2. 提取文本
    let parsedText: string;
    try {
      parsedText = await extractFileText(file);
    } catch (err) {
      updateMaterial(id, { status: 'failed' });
      addToast('error', `文件解析失败：${err instanceof Error ? err.message : '未知错误'}`);
      setIsParsing(false);
      return;
    }

    if (!parsedText || parsedText.trim().length < 20) {
      updateMaterial(id, { status: 'failed', parsedText });
      addToast('warning', '文件内容过少，无法提取');
      setIsParsing(false);
      return;
    }

    // 3. 按类型分流解析
    await runExtraction(id, file.name, parsedText, materialKind);
    setIsParsing(false);
  };

  /** 粘贴文本提取：作为 PDF/Word 等不支持格式的替代入口 */
  const handlePasteExtract = async () => {
    if (isParsing) return;
    const text = pasteText.trim();
    if (text.length < 20) {
      addToast('warning', '粘贴的内容过少，请粘贴至少 20 字的复习资料');
      return;
    }
    const id = crypto.randomUUID();
    const material: StudyMaterial = {
      id,
      name: `粘贴资料 ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      type: 'text',
      kind: materialKind,
      size: new Blob([text]).size,
      uploadedAt: Date.now(),
      status: 'parsing',
    };
    addMaterial(material);
    setIsParsing(true);
    setPasteText('');
    setShowPaste(false);
    await runExtraction(id, material.name, text, materialKind);
    setIsParsing(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // 重置 value 以允许重复选择同一文件
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleReparse = async (material: StudyMaterial) => {
    if (isParsing) return;
    if (!material.parsedText) {
      addToast('warning', '该资料无可解析文本');
      return;
    }
    setIsParsing(true);
    // 重新解析时沿用资料自身的 kind（auto 会再次识别）
    await runExtraction(material.id, material.name, material.parsedText, material.kind);
    setIsParsing(false);
  };

  const handleRemove = (material: StudyMaterial) => {
    removeMaterial(material.id);
    addToast('info', `已移除资料「${material.name}」`);
  };

  const hasMaterials = materials.length > 0;

  return (
    <PaperCard status="active" className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📥</span>
          <div>
            <h2 className="font-serif text-lg text-ink-900 font-bold leading-tight">资料上传</h2>
            <p className="text-xs text-ink-500 font-sans">上传复习资料或题库，由 Agent 拆解或抽题</p>
          </div>
        </div>
        <VintageTag color="seal">进行中</VintageTag>
      </div>

      {/* 资料类型选择器：知识点 / 题库 / 自动识别 */}
      <div className="mb-3" role="radiogroup" aria-label="选择资料处理方式">
        <span className="block text-xs font-serif text-ink-600 mb-1.5">资料处理方式</span>
        <div className="flex flex-wrap gap-1.5">
          {([
            { v: 'auto', label: '🤖 自动识别', hint: 'AI 判断' },
            { v: 'knowledge', label: '📖 知识点', hint: '拆概念' },
            { v: 'bank', label: '📝 题库', hint: '抽原题' },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              type="button"
              role="radio"
              aria-checked={materialKind === opt.v}
              onClick={() => setMaterialKind(opt.v)}
              className={`px-2.5 py-1 rounded-[3px] text-xs font-serif border transition-colors ${
                materialKind === opt.v
                  ? 'bg-seal text-paper-50 border-seal'
                  : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50'
              }`}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ink-500 font-sans mt-1">
          {materialKind === 'auto' && '先试题库解析，未识别到题目再试知识点提取'}
          {materialKind === 'knowledge' && '把资料拆成知识点，用于出题/记忆卡/督学'}
          {materialKind === 'bank' && '严格抽取原题，有标准答案优先，无答案 AI 补答'}
        </p>
      </div>

      {/* 隐藏的文件输入（作为 role=button 容器的兄弟节点，避免嵌套交互控件） */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.csv,.log,.pdf,.docx,.pptx"
        aria-label="选择复习资料文件"
        title="选择复习资料文件"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* 拖拽 / 点击上传区 */}
      <div
        role="button"
        tabIndex={0}
        aria-label="点击或拖拽上传复习资料文件"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-[4px] border-2 border-dashed transition-colors px-4 py-6 text-center ${
          isDragOver
            ? 'border-seal bg-seal/10'
            : 'border-ink-600/25 bg-paper-100/60 hover:border-seal/50 hover:bg-seal/5'
        }`}
      >
        <motion.div
          animate={isDragOver ? { y: -2 } : { y: 0 }}
          className="flex flex-col items-center gap-1.5"
        >
          <Upload size={22} className="text-ink-600" aria-hidden="true" />
          <p className="font-serif text-sm text-ink-800">
            拖拽文件到此处，或<span className="text-seal font-semibold">点击选择</span>
          </p>
          <p className="text-xs text-ink-500 font-sans">支持 TXT / MD / CSV / LOG / PDF / DOCX / PPTX（扫描件与老格式请用「粘贴文本」）</p>
        </motion.div>
      </div>

      {/* 粘贴文本入口：PDF / Word 等不支持格式的替代方案 */}
      <div className="mt-3">
        {!showPaste ? (
          <button
            type="button"
            onClick={() => setShowPaste(true)}
            className="text-xs font-serif text-seal hover:underline"
          >
            或直接粘贴文本内容 →
          </button>
        ) : (
          <div className="rounded-[4px] border border-ink-600/15 bg-paper-100/50 p-3">
            <label htmlFor="paste-text-input" className="block text-xs font-serif text-ink-600 mb-1.5">
              粘贴复习资料正文（适用于 PDF / Word 复制出来的内容）
            </label>
            <textarea
              id="paste-text-input"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="在此粘贴资料正文，至少 20 字…"
              rows={5}
              aria-label="粘贴复习资料文本"
              className="w-full bg-paper-50 border border-ink-600/20 rounded-[3px] px-3 py-2 font-sans text-sm text-ink-800 focus:outline-none focus:border-seal focus:ring-1 focus:ring-seal/30 resize-y"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-ink-500 font-sans">{pasteText.trim().length} 字</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setPasteText(''); setShowPaste(false); }}
                  className="text-xs font-serif text-ink-500 hover:text-ink-800 px-2 py-1"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void handlePasteExtract()}
                  disabled={isParsing || pasteText.trim().length < 20}
                  className="text-xs font-serif text-paper-50 bg-seal/80 hover:bg-seal px-3 py-1 rounded-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isParsing ? '解析中…' : '提取知识点'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 空状态引导（手账便签） */}
      {!hasMaterials && (
        <div className="mt-4 max-w-sm">
          <StickyNote color="yellow" rotation={-1.5}>
            <p className="font-handwritten text-base leading-relaxed">
              上传你的复习资料，让 Agent 帮你拆解成知识点 →
            </p>
          </StickyNote>
        </div>
      )}

      {/* 已上传资料列表 */}
      {hasMaterials && (
        <div className="mt-5">
          <h3 className="font-serif text-sm text-ink-700 mb-2 flex items-center gap-2">
            已上传资料
            <span className="text-xs text-ink-500 font-sans">({materials.length})</span>
          </h3>
          <ul className="space-y-2">
            {materials.map((m) => (
              <MaterialRow
                key={m.id}
                material={m}
                isParsing={isParsing}
                onReparse={() => void handleReparse(m)}
                onRemove={() => handleRemove(m)}
              />
            ))}
          </ul>
        </div>
      )}
    </PaperCard>
  );
}

function MaterialRow({
  material, isParsing, onReparse, onRemove,
}: {
  material: StudyMaterial;
  isParsing: boolean;
  onReparse: () => void;
  onRemove: () => void;
}) {
  const typeIcon = material.type === 'pdf' ? '📄' : material.type === 'word' ? '📝' : material.type === 'ppt' ? '📊' : material.type === 'markdown' ? '📑' : '📃';

  return (
    <li className="flex items-center gap-3 rounded-[3px] border border-ink-600/10 bg-paper-100/40 px-3 py-2">
      <span className="text-lg flex-shrink-0">{typeIcon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm text-ink-800 truncate">{material.name}</p>
        <p className="text-xs text-ink-500 font-sans">
          {formatFileSize(material.size)} · {new Date(material.uploadedAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <MaterialStatusBadge material={material} />

      <div className="flex items-center gap-1 flex-shrink-0">
        {(material.status === 'pending' || material.status === 'failed') && (
          <button
            type="button"
            onClick={onReparse}
            disabled={isParsing}
            title="重新解析"
            className="p-1.5 rounded-[3px] text-ink-600 hover:bg-seal/10 hover:text-seal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isParsing ? 'animate-spin' : ''} />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="移除"
          className="p-1.5 rounded-[3px] text-ink-600 hover:bg-terracotta/10 hover:text-terracotta-dark transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function MaterialStatusBadge({ material }: { material: StudyMaterial }) {
  switch (material.status) {
    case 'parsing':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gold-dark font-serif flex-shrink-0">
          <Loader2 size={12} className="animate-spin" />
          解析中
        </span>
      );
    case 'parsed':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-sage-dark font-serif flex-shrink-0">
          <CheckCircle2 size={12} />
          已解析
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-terracotta-dark font-serif flex-shrink-0">
          <AlertCircle size={12} />
          解析失败
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-ink-500 font-serif flex-shrink-0">
          <Clock size={12} />
          待解析
        </span>
      );
  }
}

/* ═══════════════════════════════════════════════════════
   3. 活动入口卡片列表
   ═══════════════════════════════════════════════════════ */

function ActivityCardList() {
  const {
    learningState, wrongQuestions, memoryCards, questions,
    setActiveView,
  } = useAppStore();

  const today = useMemo(() => todayISO(), []);
  const dueCardsCount = useMemo(
    () => memoryCards.filter((c) => c.nextReviewDate <= today).length,
    [memoryCards, today],
  );

  const practiceReady =
    learningState === 'KnowledgeReady' ||
    learningState === 'Practicing' ||
    learningState === 'WeaknessAnalyzed' ||
    learningState === 'Reviewed' ||
    learningState === 'ExamReady';

  // 每张卡片的状态 / 数量 / 状态文案
  const cardMeta: Record<ActivityCardConfig['view'], {
    status: PaperCardStatus;
    count: number | null;
    countLabel: string;
    tagText: string;
    tagColor: 'seal' | 'ink' | 'gold' | 'green' | 'worn';
  }> = {
    practice: {
      status: practiceReady ? 'active' : 'inactive',
      count: questions.length,
      countLabel: '题目',
      tagText: practiceReady ? '可练习' : '待上传资料',
      tagColor: practiceReady ? 'seal' : 'worn',
    },
    wrongbook: {
      status: wrongQuestions.length > 0 ? 'has-reward' : 'inactive',
      count: wrongQuestions.length,
      countLabel: '待复习',
      tagText: wrongQuestions.length > 0 ? '待复习' : '暂无错题',
      tagColor: wrongQuestions.length > 0 ? 'seal' : 'worn',
    },
    memory: {
      status: dueCardsCount > 0 ? 'active' : 'inactive',
      count: dueCardsCount,
      countLabel: '今日待复习',
      tagText: dueCardsCount > 0 ? '今日待复习' : (memoryCards.length > 0 ? '暂无到期' : '暂无卡片'),
      tagColor: dueCardsCount > 0 ? 'gold' : 'worn',
    },
    supervisor: {
      status: 'default',
      count: null,
      countLabel: '',
      tagText: '查看进度',
      tagColor: 'ink',
    },
  };

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900 font-bold">复习活动</h2>
        <span className="text-xs text-ink-500 font-sans">选择一项开始</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIVITY_CARDS.map((card, idx) => {
          const meta = cardMeta[card.view];
          return (
            <motion.div
              key={card.view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: 'easeOut' }}
            >
              <PaperCard
                status={meta.status}
                rotation={idx % 2 === 0 ? -0.6 : 0.8}
                onClick={() => setActiveView(card.view)}
                className="h-full"
              >
                <div className="p-4 flex flex-col h-full min-h-[150px]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl leading-none">{card.icon}</span>
                    {meta.count !== null && meta.count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-seal text-paper-50 text-xs font-serif shadow-stamp">
                        {meta.count}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-base text-ink-900 font-bold leading-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-ink-500 font-sans leading-relaxed mb-3 flex-1">
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <VintageTag color={meta.tagColor}>{meta.tagText}</VintageTag>
                    <ArrowRight size={14} className="text-ink-400" />
                  </div>
                </div>
              </PaperCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   4. 学习进度概览
   ═══════════════════════════════════════════════════════ */

function ProgressOverview() {
  const studyProgress = useAppStore((s) => s.studyProgress);

  const stats = [
    { label: '累计答题', value: studyProgress.totalQuestions, suffix: '道', color: 'text-ink-800' },
    { label: '答对', value: studyProgress.correctCount, suffix: '道', color: 'text-sage-dark' },
    { label: '答错', value: studyProgress.wrongCount, suffix: '道', color: 'text-terracotta-dark' },
    { label: '连续学习', value: studyProgress.streakDays, suffix: '天', color: 'text-gold-dark' },
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900 font-bold">学习进度</h2>
        <span className="text-xs text-ink-500 font-sans">督学 Agent 跟踪</span>
      </div>
      <PaperCard status="default" className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[3px] border border-ink-600/10 bg-paper-100/50 px-3 py-2.5 text-center"
            >
              <p className="text-xs text-ink-500 font-sans mb-1">{stat.label}</p>
              <p className={`font-serif text-2xl font-bold leading-none ${stat.color}`}>
                {stat.value}
                <span className="text-sm font-sans font-normal ml-0.5 text-ink-500">{stat.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </PaperCard>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <DashboardHeader />
      <MaterialUploadCard />
      <ActivityCardList />
      <ProgressOverview />
    </div>
  );
}
