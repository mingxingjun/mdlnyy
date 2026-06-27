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

/** 题库提取系统提示词：从资料中识别并结构化题目，严格保留原题与标准答案 */
const QUESTION_BANK_EXTRACTION_SYSTEM_PROMPT = `你是「题库解析器」，从学习资料中识别并结构化抽取所有题目。

【输入】可能含题目的学习资料纯文本（含题干、选项、标准答案、解析等）
【输出】严格 JSON，遵循以下 schema：
{
  "questions": [
    {
      "type": "choice | fill | short | calculation",
      "difficulty": 1-5,
      "stem": "题干原文（一字不改）",
      "options": ["A. ...", "B. ..."],     // 仅选择题有
      "answer": "标准答案（原文已有则原样保留；原文缺失则留空字符串）",
      "explanation": "原文解析（无则留空字符串）",
      "hasStandardAnswer": true | false
    }
  ]
}

【抽取原则】
- 严格按原文出题，题干、选项、答案一字不改，不臆造、不补全、不简化
- 若原文明确给出答案（如"答案：B"或参考答案区），answer 字段填标准答案，hasStandardAnswer=true
- 若原文未给答案（仅题干），answer 填空字符串 ""，hasStandardAnswer=false（后续由 AI 补答）
- type 推断：含 A/B/C/D 选项为 choice，含下划线/空格填空为 fill，含"计算/求解/求"为 calculation，其余为 short
- difficulty：原文标注则用，否则按题干复杂度估 1-5
- 识别全文所有题目，不要遗漏；若资料非题库（纯概念论述），返回 { "questions": [] }

【输出约束】
- 仅输出 JSON，不要任何 markdown 代码块标记、不要解释文字
- 中文输出`;

/** 自动识别系统提示词：判断资料是"知识点型"还是"题库型" */
const MATERIAL_KIND_DETECTION_SYSTEM_PROMPT = `你是「资料类型识别器」，判断学习资料属于哪种类型。

【输出】严格 JSON：
{ "kind": "knowledge" | "bank", "reason": "简短理由" }

【判断规则】
- bank：资料以"题目+作答"为主体，含大量题干、选项、答案、解析（如历年真题、习题集、试卷）
- knowledge：资料以"概念论述/知识点讲解"为主体（如教材章节、笔记、讲义）
- 若题干占比 > 40% 判为 bank，否则 knowledge

【输出约束】仅输出 JSON，不要 markdown 代码块标记`;
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

/** 提取首个完整 JSON 片段（对象或数组），剥离 markdown 代码围栏与多余文本 */
function extractJson(content: string): string {
  let cleaned = content.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // 优先尝试整体解析
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  const start = startObj === -1 ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr));
  if (start < 0) return cleaned;
  // 按起始括号类型寻找匹配的结束括号
  const openCh = cleaned[start];
  const closeCh = openCh === '[' ? ']' : '}';
  const end = cleaned.lastIndexOf(closeCh);
  if (end > start) return cleaned.slice(start, end + 1);
  return cleaned.slice(start);
}

/** 兼容多种字段名读取字符串 */
function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
}

/** 从对象数组中定位知识点列表，兼容 knowledgePoints / points / items / data 等键，以及裸数组 */
function locatePointsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== 'object' || parsed === null) return [];
  const obj = parsed as Record<string, unknown>;
  const candidateKeys = [
    'knowledgePoints', 'knowledge_points', 'points', 'items', 'list', 'data', 'result', 'results',
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

interface RawBankQuestion {
  type?: unknown;
  difficulty?: unknown;
  stem?: unknown;
  options?: unknown;
  answer?: unknown;
  explanation?: unknown;
  hasStandardAnswer?: unknown;
}

/** 从题库解析 LLM 返回中提取题目列表，严格保留原文，区分有/无标准答案 */
function parseQuestionBankResponse(content: string, materialId: string): Question[] {
  if (!content || !content.trim()) return [];
  const jsonStr = extractJson(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }
  const rawQs = locatePointsArray(parsed); // 复用：兼容 questions/items/data 等键与裸数组
  if (rawQs.length === 0) return [];

  return rawQs
    .filter((q): q is RawBankQuestion => typeof q === 'object' && q !== null)
    .map((q, i): Question => {
      const options = Array.isArray(q.options)
        ? q.options.filter((o): o is string => typeof o === 'string')
        : undefined;
      const answerStr = String(typeof q.answer === 'string' ? q.answer : '').trim();
      const hasStd = q.hasStandardAnswer === true || answerStr.length > 0;
      return {
        id: crypto.randomUUID(),
        materialId,
        knowledgePointIds: [],
        type: coerceQType(q.type),
        difficulty: coerceDifficulty(q.difficulty),
        stem: String(typeof q.stem === 'string' ? q.stem : '').trim(),
        options: options && options.length > 0 ? options : undefined,
        answer: answerStr,
        explanation: String(typeof q.explanation === 'string' ? q.explanation : '').trim(),
        source: 'bank',
        bankId: materialId,
        aiFilled: !hasStd,
        createdAt: Date.now() + i,
      };
    })
    .filter((q) => q.stem.length > 0);
}

/** 解析资料类型识别结果 */
function parseMaterialKindResponse(content: string): 'knowledge' | 'bank' {
  if (!content || !content.trim()) return 'knowledge';
  const jsonStr = extractJson(content);
  try {
    const parsed = JSON.parse(jsonStr) as { kind?: unknown };
    return parsed.kind === 'bank' ? 'bank' : 'knowledge';
  } catch {
    // 兜底：正则检测
    return /"kind"\s*:\s*"bank"/i.test(content) ? 'bank' : 'knowledge';
  }
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
      const parsed = JSON.parse(jsonStr) as { answers?: Array<{ index?: number; answer?: string; explanation?: string }> };
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
  const runKnowledgeExtraction = async (materialId: string, name: string, text: string) => {
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return;
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
        console.warn('[知识点提取] 解析结果为空，原始返回：', content.slice(0, 500));
        addToast('info', '资料已上传，但未提取到知识点（请检查资料是否含有效正文）');
      } else {
        addKnowledgePoints(points);
        if (learningState === 'Onboarded' || learningState === 'MaterialReady') {
          setLearningState('KnowledgeReady');
        }
        addToast('success', `成功提取 ${points.length} 个知识点`);
      }
    } catch (err) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('error', `知识点提取失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  /** 题库导入流程：抽取题目 → AI 补答缺失答案 → 写入 store */
  const runBankExtraction = async (materialId: string, name: string, text: string) => {
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return;
    }
    updateMaterial(materialId, { status: 'parsing' });
    try {
      const settings = loadModelSettings();
      // 1. 抽取题目（题库解析走 chat 路由，因为需要更强调度）
      const userPrompt = `请从以下资料中识别并结构化抽取所有题目 JSON：

【资料名称】${name}

【资料内容】
${text.slice(0, 8000)}`;
      const { content } = await callModelForTask(
        settings,
        'chat',
        QUESTION_BANK_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
      );
      const questions = parseQuestionBankResponse(content, materialId);
      updateMaterial(materialId, { status: 'parsed', parsedText: text });

      if (questions.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('[题库解析] 解析结果为空，原始返回：', content.slice(0, 500));
        addToast('info', '资料已上传，但未识别到题目（若该资料实为知识点，请改用「知识点」类型重新上传）');
        return;
      }

      // 2. 为无标准答案的题 AI 补答（分批）
      const missingCount = questions.filter((q) => !q.answer).length;
      if (missingCount > 0) {
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
    } catch (err) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('error', `题库解析失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  /** 统一入口：按 materialKind 分流到知识点或题库流程；auto 则先 AI 识别再分流 */
  const runExtraction = async (materialId: string, name: string, text: string, kind: StudyMaterial['kind']) => {
    if (kind === 'knowledge') {
      await runKnowledgeExtraction(materialId, name, text);
      return;
    }
    if (kind === 'bank') {
      await runBankExtraction(materialId, name, text);
      return;
    }
    // auto：先 AI 识别类型
    if (!isApiKeyConfigured()) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return;
    }
    updateMaterial(materialId, { status: 'parsing' });
    try {
      const settings = loadModelSettings();
      const detectPrompt = `请判断以下资料属于「知识点型」还是「题库型」：

【资料内容】
${text.slice(0, 3000)}`;
      const { content } = await callModelForTask(
        settings, 'chat', MATERIAL_KIND_DETECTION_SYSTEM_PROMPT, detectPrompt,
      );
      const detected = parseMaterialKindResponse(content);
      // 把识别结果回写到 material 的 kind 字段
      updateMaterial(materialId, { kind: detected });
      addToast('info', `AI 识别该资料为「${detected === 'bank' ? '题库' : '知识点'}」，开始解析…`);
      // 递归走对应流程（此时 kind 已确定）
      if (detected === 'bank') {
        await runBankExtraction(materialId, name, text);
      } else {
        await runKnowledgeExtraction(materialId, name, text);
      }
    } catch (err) {
      updateMaterial(materialId, { status: 'pending', parsedText: text });
      addToast('error', `资料类型识别失败：${err instanceof Error ? err.message : '未知错误'}`);
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
          {materialKind === 'auto' && 'AI 自动判断资料是知识点型还是题库型'}
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
