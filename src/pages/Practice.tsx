import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, X, Lightbulb, RefreshCw, Home,
  ChevronRight, BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Question, WrongQuestion } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { useCountUp } from '@/hooks/useCountUp';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { getAgent, compressPrompt } from '@/lib/agents/definitions';
import type { ExplanationStyle } from '@/lib/agents/types';
import { cn } from '@/lib/utils';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import PaperSpinner from '@/components/PaperSpinner';
import QuizResultPage from '@/components/QuizResultPage';

/* ═══════════════════════════════════════════════════════
   常量与映射
   ═══════════════════════════════════════════════════════ */

const QUESTIONS_PER_SESSION = 5;
/** 知识点模式：每个知识点至少出 1 题，最多 2 题；单批最多 8 题防 token 溢出 */
const KP_QUESTIONS_PER_BATCH = 8;
const KP_MAX_PER_POINT = 2;
/** 题库模式：单批最多 10 题，太多则分节点 */
const BANK_QUESTIONS_PER_BATCH = 10;

const QTYPE_LABEL: Record<Question['type'], string> = {
  choice: '选择题',
  fill: '填空题',
  short: '简答题',
  calculation: '计算题',
};

const DIFFICULTY_LABEL: Record<number, string> = {
  1: '入门',
  2: '简单',
  3: '中等',
  4: '较难',
  5: '困难',
};

const EXPLANATION_STYLES: { value: ExplanationStyle; label: string }[] = [
  { value: 'concise', label: '简洁' },
  { value: 'detailed', label: '详细' },
  { value: 'feynman', label: '费曼' },
  { value: 'socratic', label: '苏格拉底' },
];

type Phase = 'setup' | 'generating' | 'quiz' | 'summary';

interface ParsedExplanation {
  style: string;
  errorLocation: string;
  steps: { content: string; rationale: string }[];
  pitfalls: string[];
  knowledgePointIds: string[];
  followupQuestions: string[];
}

interface JudgedResult {
  isCorrect: boolean;
  userAnswer: string;
}

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

/** 检查出题/讲解任务（chat 路由）的 provider 是否已配置 API Key */
function isApiKeyConfigured(): boolean {
  try {
    const settings = loadModelSettings();
    return isTaskConfigured(settings, 'chat');
  } catch {
    return false;
  }
}

/** 剥离 markdown 代码块围栏并截取最外层 JSON 大括号 */
function stripCodeFence(content: string): string {
  let cleaned = content.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    cleaned = fence[1].trim();
  } else {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }
  return cleaned;
}

const VALID_QTYPES = ['choice', 'fill', 'short', 'calculation'] as const;

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

function coerceType(t: unknown): Question['type'] {
  if (typeof t === 'string' && (VALID_QTYPES as readonly string[]).includes(t)) {
    return t as Question['type'];
  }
  return 'short';
}

interface RawQuestion {
  type?: unknown;
  difficulty?: unknown;
  stem?: unknown;
  options?: unknown;
  answer?: unknown;
  explanation?: unknown;
  knowledgePointIds?: unknown;
}

/** 从出题 Agent 返回内容中解析题目 JSON，容错处理代码块与多余文本 */
function parseQuestionsResponse(content: string, materialId: string): Question[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    return [];
  }
  if (typeof parsed !== 'object' || parsed === null) return [];
  const rawQs = (parsed as { questions?: unknown }).questions;
  if (!Array.isArray(rawQs)) return [];

  return rawQs
    .filter((q): q is RawQuestion => typeof q === 'object' && q !== null)
    .map((q, i): Question => {
      const options = Array.isArray(q.options)
        ? q.options.filter((o): o is string => typeof o === 'string')
        : undefined;
      const kpIds = Array.isArray(q.knowledgePointIds)
        ? q.knowledgePointIds.filter((k): k is string => typeof k === 'string')
        : [];
      return {
        id: crypto.randomUUID(),
        materialId,
        knowledgePointIds: kpIds,
        type: coerceType(q.type),
        difficulty: coerceDifficulty(q.difficulty),
        stem: String(typeof q.stem === 'string' ? q.stem : '').trim(),
        options: options && options.length > 0 ? options : undefined,
        answer: String(typeof q.answer === 'string' ? q.answer : '').trim(),
        explanation: String(typeof q.explanation === 'string' ? q.explanation : '').trim(),
        source: 'ai',
        createdAt: Date.now() + i,
      };
    })
    .filter((q) => q.stem.length > 0 && q.answer.length > 0);
}

/** 从讲解 Agent 返回内容中解析步骤化讲解 JSON */
function parseExplanationResponse(content: string): ParsedExplanation | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
  const steps = stepsRaw
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      content: String(typeof s.content === 'string' ? s.content : '').trim(),
      rationale: String(typeof s.rationale === 'string' ? s.rationale : '').trim(),
    }))
    .filter((s) => s.content.length > 0);
  const pitfalls = Array.isArray(obj.pitfalls)
    ? obj.pitfalls
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];
  const followup = Array.isArray(obj.followupQuestions)
    ? obj.followupQuestions
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
    : [];
  const kpIds = Array.isArray(obj.knowledgePointIds)
    ? obj.knowledgePointIds.filter((k): k is string => typeof k === 'string')
    : [];
  return {
    style: String(typeof obj.style === 'string' ? obj.style : '').trim(),
    errorLocation: String(typeof obj.errorLocation === 'string' ? obj.errorLocation : '').trim(),
    steps,
    pitfalls,
    knowledgePointIds: kpIds,
    followupQuestions: followup,
  };
}

function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractChoiceLetter(s: string): string {
  const m = s.trim().match(/^([A-Da-d])/);
  return m ? m[1].toUpperCase() : s.trim();
}

/** 判对错：选择题按字母精确匹配，其余题型归一化后大小写不敏感包含检查 */
function judgeAnswer(question: Question, userAnswer: string): boolean {
  const u = userAnswer.trim();
  if (!u) return false;
  if (question.type === 'choice') {
    return extractChoiceLetter(u) === extractChoiceLetter(question.answer);
  }
  const un = normalizeText(u);
  const cn = normalizeText(question.answer);
  if (!un || !cn) return false;
  if (un === cn) return true;
  return cn.includes(un) || un.includes(cn);
}

/**
 * AI 判题兜底：当本地字符串匹配判定为「错」时（尤其中文简答/填空/计算题），
 * 调用出题 Agent 用语义判断用户答案是否与标准答案等价，避免因表述差异误判。
 * 返回 true 表示 AI 认为答对；失败或超时按 false 处理（保持本地判定结果）。
 */
async function judgeAnswerWithAI(
  question: Question,
  userAnswer: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const agent = getAgent('question-agent');
  if (!agent) return false;
  try {
    const settings = loadModelSettings();
    if (!isTaskConfigured(settings, 'chat')) return false;

    const optionsBlock =
      question.options && question.options.length > 0
        ? `【选项】\n${question.options.join('\n')}\n`
        : '';
    const input = `请判定以下学生答案的对错，输出判定结果 JSON。

【题干】${question.stem}
${optionsBlock}【学生答案】${userAnswer}
【标准答案】${question.answer}
【题目原解析】${question.explanation || '（无）'}

【判定原则】
- 选择题：字母一致即对
- 填空/简答/计算题：语义等价即对（含同义表达、单位等价、公式等价、计算结果一致）
- 仅输出 JSON，不要 markdown 代码块

【输出 JSON Schema】
{
  "correct": true,
  "userAnswer": "${userAnswer.slice(0, 50)}",
  "correctAnswer": "...",
  "brief": "判定依据一句话"
}`;

    const userMessage = compressPrompt(agent, input);
    const { content } = await callModelForTask(
      settings, 'chat', agent.systemPrompt, userMessage, signal,
      { temperature: 0.2, maxTokens: 512 },
    );
    const cleaned = stripCodeFence(content);
    const parsed = JSON.parse(cleaned) as { correct?: unknown };
    return parsed?.correct === true;
  } catch {
    return false;
  }
}

/** 将讲解结构序列化为错题本的 stepBreakdown 字符串 */
function formatStepBreakdown(exp: ParsedExplanation): string {
  const lines: string[] = [];
  if (exp.errorLocation) lines.push(`错因定位：${exp.errorLocation}`);
  exp.steps.forEach((s, i) => {
    lines.push(`步骤 ${i + 1}：${s.content}${s.rationale ? `（依据：${s.rationale}）` : ''}`);
  });
  if (exp.pitfalls.length > 0) lines.push(`易错点：${exp.pitfalls.join('；')}`);
  if (exp.followupQuestions.length > 0) lines.push(`引导追问：${exp.followupQuestions.join('；')}`);
  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════
   小型展示组件
   ═══════════════════════════════════════════════════════ */

const StatCard = memo(function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-paper border border-ink-600/10 bg-paper-100/50 px-3 py-3 text-center">
      <p className="text-xs text-ink-500 font-sans mb-1">{label}</p>
      <p className={cn('font-serif text-2xl font-bold leading-none', color)}>{value}</p>
    </div>
  );
});

interface ExplanationPanelProps {
  selectedStyle: ExplanationStyle;
  onStyleChange: (s: ExplanationStyle) => void;
  loading: boolean;
  explanation: ParsedExplanation | null;
  onGoWrongbook: () => void;
  autoRecorded: boolean;
}

const ExplanationPanel = memo(function ExplanationPanel({
  selectedStyle, onStyleChange, loading, explanation, onGoWrongbook, autoRecorded,
}: ExplanationPanelProps) {
  return (
    <PaperCard status="default" className="mt-3 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={16} className="text-gold-dark" />
        <h4 className="font-serif text-base text-ink-900 font-bold">讲解</h4>
      </div>

      {/* 讲解风格切换 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {EXPLANATION_STYLES.map((s) => (
          <VintageButton
            key={s.value}
            variant={selectedStyle === s.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onStyleChange(s.value)}
          >
            {s.label}
          </VintageButton>
        ))}
      </div>

      {loading ? (
        <PaperSpinner text="正在讲解..." />
      ) : explanation ? (
        <div className="space-y-3">
          {explanation.errorLocation && (
            <div className="rounded-paper border border-terracotta/20 bg-terracotta/5 px-3 py-2">
              <p className="text-xs text-terracotta-dark font-serif mb-0.5">错因定位</p>
              <p className="text-sm text-ink-800 font-serif">{explanation.errorLocation}</p>
            </div>
          )}

          {explanation.steps.length > 0 && (
            <div>
              <p className="text-xs text-ink-500 font-serif mb-1.5">步骤拆解</p>
              <ol className="space-y-1.5">
                {explanation.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-800 font-serif">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-seal/10 text-seal text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">
                      {s.content}
                      {s.rationale && (
                        <span className="block text-xs text-ink-500 mt-0.5 font-sans">依据：{s.rationale}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {explanation.pitfalls.length > 0 && (
            <div>
              <p className="text-xs text-ink-500 font-serif mb-1.5">易错点提示</p>
              <ul className="space-y-1">
                {explanation.pitfalls.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-700 font-serif">
                    <span className="text-gold-dark flex-shrink-0">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.followupQuestions.length > 0 && (
            <div className="rounded-paper border border-gold/20 bg-gold/5 px-3 py-2">
              <p className="text-xs text-gold-dark font-serif mb-1">引导追问</p>
              <ul className="space-y-1">
                {explanation.followupQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-ink-800 font-serif">? {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-500 font-serif">暂无讲解内容</p>
      )}

      {/* 错题已自动收录，提供跳转错题本入口 */}
      <div className="mt-4 pt-3 border-t border-ink-600/10 flex items-center justify-between gap-2">
        {autoRecorded ? (
          <span className="inline-flex items-center gap-1 text-xs font-serif text-sage-dark">
            <Check size={13} /> 已自动收录至错题本
          </span>
        ) : (
          <span className="text-xs font-serif text-ink-500">答对无需收录</span>
        )}
        <VintageButton
          variant="ghost"
          size="sm"
          disabled={!autoRecorded}
          onClick={onGoWrongbook}
        >
          查看错题本
          <BookOpen size={14} className="ml-1.5" />
        </VintageButton>
      </div>
    </PaperCard>
  );
});

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function Practice() {
  const knowledgePoints = useAppStore((s) => s.knowledgePoints);
  const bankQuestions = useAppStore((s) => s.questions);          // 题库题（source='bank'）
  const materials = useAppStore((s) => s.materials);             // 用于文件筛选
  const addQuestions = useAppStore((s) => s.addQuestions);
  const addAnswerRecord = useAppStore((s) => s.addAnswerRecord);
  const addWrongQuestion = useAppStore((s) => s.addWrongQuestion);
  const updateWrongQuestion = useAppStore((s) => s.updateWrongQuestion);
  const incrementQuestions = useAppStore((s) => s.incrementQuestions);
  const studyProgress = useAppStore((s) => s.studyProgress);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const addToast = useToastStore((s) => s.addToast);

  /** 出题模式：auto=自动选(有题库走题库，否则走知识点) / bank=题库 / knowledge=知识点 */
  const [genMode, setGenMode] = useState<'auto' | 'bank' | 'knowledge'>('auto');
  /** 题库模式：选中的文件筛选（'all' = 全部文件） */
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [judged, setJudged] = useState<JudgedResult | null>(null);
  /** AI 语义判题进行中（非选择题本地匹配为「错」时触发兜底） */
  const [judging, setJudging] = useState(false);
  const [explanation, setExplanation] = useState<ParsedExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ExplanationStyle>('detailed');
  const [addedToWrongbook, setAddedToWrongbook] = useState(false);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  /** 当前 session 已收录的错题 id → wrongQuestionId 映射，避免重复入库 */
  const [wrongRecordedIds, setWrongRecordedIds] = useState<Set<string>>(new Set());
  /** 当前题对应的错题本条目 id（用于切换讲解风格时回填） */
  const [currentWrongQId, setCurrentWrongQId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // 卸载时取消进行中的请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetQuestionState = useCallback(() => {
    abortRef.current?.abort();
    setUserAnswer('');
    setSelectedOptionIdx(null);
    setJudged(null);
    setJudging(false);
    setExplanation(null);
    setExplanationLoading(false);
    setAddedToWrongbook(false);
    setSelectedStyle('detailed');
    setCurrentWrongQId(null);
    questionStartRef.current = Date.now();
  }, []);

  const fetchExplanation = useCallback(
    async (style: ExplanationStyle, wrongQuestionId?: string) => {
      const q = sessionQuestions[currentIndex];
      if (!q) return;
      const agent = getAgent('explanation-agent');
      if (!agent) {
        addToast('error', '讲解 Agent 未就绪');
        return;
      }
      if (!isApiKeyConfigured()) {
        addToast('warning', '请先配置 AI 模型 API Key');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSelectedStyle(style);
      setExplanation(null);
      setExplanationLoading(true);

      const optionsBlock =
        q.options && q.options.length > 0 ? `【选项】\n${q.options.join('\n')}\n` : '';
      const input = `请对以下错题进行步骤化讲解（讲解风格：${style}）。

【题干】${q.stem}
${optionsBlock}【学生答案】${userAnswer}
【正确答案】${q.answer}
【题目原解析】${q.explanation || '（无）'}

【输出 JSON Schema】
{
  "style": "${style}",
  "errorLocation": "错因一句话",
  "steps": [{ "index": 1, "content": "步骤内容", "rationale": "依据" }],
  "pitfalls": ["易错点1"],
  "knowledgePointIds": [],
  "followupQuestions": []
}`;

      try {
        const settings = loadModelSettings();
        const userMessage = compressPrompt(agent, input);
        const { content } = await callModelForTask(
          settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
          { temperature: agent.temperature, maxTokens: agent.maxTokens },
        );
        if (controller.signal.aborted) return;
        const parsed = parseExplanationResponse(content);
        let finalExp: ParsedExplanation;
        if (parsed) {
          setExplanation(parsed);
          finalExp = parsed;
        } else {
          addToast('warning', '讲解内容解析失败，显示原文');
          finalExp = {
            style,
            errorLocation: '',
            steps: [{ content: content.trim() || '（无内容）', rationale: '' }],
            pitfalls: [],
            knowledgePointIds: [],
            followupQuestions: [],
          };
          setExplanation(finalExp);
        }
        // 讲解完成后回填 stepBreakdown 到已入库的错题（错题本可立即看到结构化讲解）
        if (wrongQuestionId) {
          const stepBreakdown = formatStepBreakdown(finalExp);
          updateWrongQuestion(wrongQuestionId, {
            stepBreakdown: stepBreakdown || undefined,
            explanation: finalExp.errorLocation || q.explanation || '',
            explanationStyle: style,
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        addToast('error', `讲解失败：${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        if (!controller.signal.aborted) setExplanationLoading(false);
      }
    },
    [sessionQuestions, currentIndex, userAnswer, addToast, updateWrongQuestion],
  );

  /** 题库模式：从已导入题库抽取原题，分批出完。支持按文件筛选 */
  const startBankSession = useCallback(async (controller: AbortController): Promise<Question[]> => {
    // 过滤：题库题 + 有答案 + 文件筛选（'all' = 全部）
    const bankQs = bankQuestions.filter((q) => {
      if (q.source !== 'bank' || !q.answer) return false;
      if (selectedMaterialId !== 'all' && q.materialId !== selectedMaterialId) return false;
      return true;
    });
    if (bankQs.length === 0) return [];

    // 一次性出全部，但分批写入 sessionQuestions（前端展示）。这里先返回第一批，后续题已在 store。
    // 实际"出完所有题"语义：sessionQuestions 取全部题库题，UI 分页展示。
    // 但为避免单次练习过长，取 BANK_QUESTIONS_PER_BATCH 为一批，由用户做完后继续下一批。
    const firstBatch = bankQs.slice(0, BANK_QUESTIONS_PER_BATCH);
    return firstBatch;
  }, [bankQuestions, selectedMaterialId]);

  /** 知识点模式：覆盖所有知识点出题，按 priority 分配题量，分批生成 */
  const startKnowledgeSession = useCallback(async (controller: AbortController): Promise<Question[]> => {
    if (knowledgePoints.length === 0) return [];
    const agent = getAgent('question-agent');
    if (!agent) return [];

    // 按 priority 排序，优先出核心知识点；高 priority 出 2 题，低的出 1 题
    const sorted = [...knowledgePoints].sort((a, b) => b.priority - a.priority);
    // 单批最多 KP_QUESTIONS_PER_BATCH 题，按比例分配
    let allocated = 0;
    const targetCount = Math.min(KP_QUESTIONS_PER_BATCH, sorted.length * KP_MAX_PER_POINT);
    const pointsForThisBatch: typeof sorted = [];
    for (const kp of sorted) {
      if (allocated >= targetCount) break;
      pointsForThisBatch.push(kp);
      allocated += kp.priority >= 4 ? KP_MAX_PER_POINT : 1;
    }

    // 薄弱点强化：若 weakPointIds 非空，把它们置顶并保证出题
    const weakIds = new Set(studyProgress.weakPointIds);
    const weakPoints = sorted.filter((kp) => weakIds.has(kp.id));
    const merged = [...weakPoints, ...pointsForThisBatch.filter((kp) => !weakIds.has(kp.id))];
    // 去重
    const seen = new Set<string>();
    const finalPoints = merged.filter((kp) => {
      if (seen.has(kp.id)) return false;
      seen.add(kp.id);
      return true;
    }).slice(0, KP_QUESTIONS_PER_BATCH);

    const materialId = finalPoints[0]?.materialId ?? knowledgePoints[0]?.materialId ?? '';
    const kpList = finalPoints
      .map((kp, i) => `${i + 1}. ${kp.name}（优先级 ${kp.priority}${weakIds.has(kp.id) ? '，薄弱点强化' : ''}）[id:${kp.id}]：${kp.description}`)
      .join('\n');
    const nonce = Math.floor(Math.random() * 1000000);
    const input = `请基于以下知识点列表生成 ${finalPoints.length} 道练习题，每题覆盖一个知识点，难度梯度为 简单30% / 中等50% / 困难20%，题型混合选择/填空/简答/计算。

【出题种子】${nonce}
【知识点列表】
${kpList}

【要求】
- 必须覆盖上述所有知识点，每题关联至少 1 个知识点 id（从 [id:...] 中选取）
- 薄弱点强化题优先出，难度可适当提高
- 选择题 options 形如 ["A. ...", "B. ...", "C. ...", "D. ..."]，answer 为字母（如 "B"）
- 干扰项必须合理，答案唯一确定
- 仅输出 JSON，不要 markdown 代码块标记

【输出 JSON Schema】
{
  "questions": [
    { "type": "choice", "difficulty": 3, "stem": "题干", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B", "explanation": "简短解析", "knowledgePointIds": ["kp_xxx"] }
  ]
}`;

    const settings = loadModelSettings();
    const userMessage = compressPrompt(agent, input);
    const { content } = await callModelForTask(
      settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
      { temperature: agent.temperature, maxTokens: agent.maxTokens },
    );
    if (controller.signal.aborted) return [];
    return parseQuestionsResponse(content, materialId);
  }, [knowledgePoints, studyProgress.weakPointIds]);

  const startSession = useCallback(async () => {
    // 题库筛选：auto/bank 模式下应用文件筛选
    const filteredBank = bankQuestions.filter((q) => {
      if (q.source !== 'bank' || !q.answer) return false;
      if (selectedMaterialId !== 'all' && q.materialId !== selectedMaterialId) return false;
      return true;
    });
    const hasBank = filteredBank.length > 0;
    // 决定实际模式：auto 时有题库走题库，否则走知识点
    const mode = genMode === 'auto' ? (hasBank ? 'bank' : 'knowledge') : genMode;

    if (mode === 'knowledge' && knowledgePoints.length === 0) {
      addToast('warning', '尚无知识点，请先上传资料');
      return;
    }
    if (mode === 'bank' && !hasBank) {
      addToast('warning', selectedMaterialId !== 'all'
        ? '所选文件下无可练题库题，请换个文件或上传题库'
        : '尚无题库题，请先以「题库」类型上传资料');
      return;
    }
    if (mode === 'knowledge' && !isApiKeyConfigured()) {
      addToast('warning', '请先配置 AI 模型 API Key');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('generating');
    setSessionQuestions([]);
    setCurrentIndex(0);
    setResults([]);
    setWrongRecordedIds(new Set());

    try {
      let qs: Question[] = [];
      if (mode === 'bank') {
        qs = await startBankSession(controller);
      } else {
        qs = await startKnowledgeSession(controller);
      }
      if (controller.signal.aborted) return;
      if (qs.length === 0) {
        addToast('error', mode === 'bank' ? '题库无可练题目（答案缺失）' : '未能解析出题目，请重试');
        setPhase('setup');
        return;
      }
      setSessionQuestions(qs);
      // 知识点模式的题是 AI 新生成的，写入 store；题库题已在 store，不重复写
      if (mode === 'knowledge') addQuestions(qs);
      setCurrentIndex(0);
      setResults([]);
      resetQuestionState();
      setPhase('quiz');
      const remainHint = mode === 'bank' && bankQuestions.length > qs.length
        ? `（本次 ${qs.length} 题，题库共 ${bankQuestions.length} 题，做完可继续）`
        : '';
      addToast('success', `已生成 ${qs.length} 道题目，开始练习${remainHint}`);
    } catch (err) {
      if (controller.signal.aborted) return;
      addToast('error', `出题失败：${err instanceof Error ? err.message : '未知错误'}`);
      setPhase('setup');
    }
  }, [genMode, bankQuestions, selectedMaterialId, knowledgePoints, startBankSession, startKnowledgeSession, addQuestions, addToast, resetQuestionState]);

  const handleSubmit = useCallback(async () => {
    const q = sessionQuestions[currentIndex];
    if (!q) return;
    const ua = userAnswer.trim();
    if (!ua) {
      addToast('warning', '请先作答');
      return;
    }

    // 本地判定：选择题精确匹配（权威）；非选择题用归一化包含匹配
    let isCorrect = judgeAnswer(q, ua);

    // AI 语义判题兜底：非选择题且本地判为「错」时，调用 AI 复核是否语义等价，
    // 避免因同义表述、单位写法、公式变形等差异误判为错。
    if (!isCorrect && q.type !== 'choice' && isApiKeyConfigured()) {
      setJudging(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const aiSaysCorrect = await judgeAnswerWithAI(q, ua, controller.signal);
        if (controller.signal.aborted) return;
        if (aiSaysCorrect) isCorrect = true;
      } finally {
        if (!controller.signal.aborted) setJudging(false);
      }
    }

    const timeSpentMs = Date.now() - questionStartRef.current;
    addAnswerRecord({
      questionId: q.id,
      userAnswer: ua,
      isCorrect,
      answeredAt: Date.now(),
      timeSpentMs,
    });
    incrementQuestions(isCorrect);
    setJudged({ isCorrect, userAnswer: ua });
    setResults((prev) => [...prev, { questionId: q.id, isCorrect }]);

    // 错题自动入库：判错即写入 store，不再依赖手动按钮
    if (!isCorrect) {
      const wqId = crypto.randomUUID();
      const wq: WrongQuestion = {
        id: wqId,
        questionId: q.id,
        stem: q.stem,
        userAnswer: ua,
        correctAnswer: q.answer,
        explanation: q.explanation || '',
        knowledgePointIds: q.knowledgePointIds,
        tags: [q.type, q.source === 'bank' ? '题库题' : 'AI题'],
        explanationStyle: 'detailed',
        createdAt: Date.now(),
        reviewCount: 0,
        isResolved: false,
      };
      addWrongQuestion(wq);
      setWrongRecordedIds((prev) => new Set(prev).add(q.id));
      setAddedToWrongbook(true);
      setCurrentWrongQId(wqId);
      // 异步拉讲解，完成后回填 stepBreakdown 到已入库的错题
      void fetchExplanation('detailed', wqId);
    }
  }, [sessionQuestions, currentIndex, userAnswer, addAnswerRecord, incrementQuestions, addWrongQuestion, addToast, fetchExplanation]);

  const handleStyleChange = useCallback(
    (style: ExplanationStyle) => {
      if (style === selectedStyle) return;
      void fetchExplanation(style, currentWrongQId ?? undefined);
    },
    [selectedStyle, fetchExplanation, currentWrongQId],
  );

  /** 错题已自动入库，此按钮改为跳转错题本查看 */
  const handleGoWrongbook = useCallback(() => {
    setActiveView('wrongbook');
  }, [setActiveView]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= sessionQuestions.length) {
      setPhase('summary');
    } else {
      setCurrentIndex((i) => i + 1);
      resetQuestionState();
    }
  }, [currentIndex, sessionQuestions.length, resetQuestionState]);

  const handleRetry = useCallback(() => {
    void startSession();
  }, [startSession]);

  const handleBackHome = useCallback(() => {
    setActiveView('dashboard');
  }, [setActiveView]);

  /* ── 派生数据 ── */
  const currentQuestion = sessionQuestions[currentIndex];
  const totalAnswered = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = totalAnswered - correctCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  // P2-1 页头数字递增动画
  const animatedCurrentIndex = useCountUp(currentIndex + 1);
  const animatedCorrectCount = useCountUp(correctCount);
  const animatedWrongCount = useCountUp(wrongCount);
  const noKnowledgePoints = knowledgePoints.length === 0;
  const noApiKey = !isApiKeyConfigured();
  /** 题库题所在的文件列表（用于文件筛选器） */
  const bankMaterials = useMemo(
    () => {
      const ids = new Set(bankQuestions.map((q) => q.materialId).filter(Boolean));
      return materials.filter((m) => ids.has(m.id));
    },
    [bankQuestions, materials],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* 页头 */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackHome}
            title="返回首页"
            aria-label="返回首页"
            className="inline-flex items-center justify-center w-9 h-9 rounded-paper border border-ink-600/20 bg-paper-100 text-ink-700 hover:bg-paper-200 hover:text-seal transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div>
            <p className="font-handwritten text-sm text-ink-500 leading-none">出题 · 作答 · 讲解</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">练习</h1>
          </div>
        </div>

        {phase === 'quiz' && sessionQuestions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <VintageTag color="ink">第 {animatedCurrentIndex} / {sessionQuestions.length} 题</VintageTag>
            <VintageTag color="green">对 {animatedCorrectCount}</VintageTag>
            {wrongCount > 0 && <VintageTag color="seal">错 {animatedWrongCount}</VintageTag>}
          </div>
        )}
      </header>

      {/* 进度条 */}
      {phase === 'quiz' && sessionQuestions.length > 0 && (
        <div className="h-1 rounded-full bg-paper-300/60 overflow-hidden">
          <motion.div
            className="h-full bg-seal"
            initial={{ width: 0 }}
            animate={{ width: `${(totalAnswered / sessionQuestions.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
      {/* ── Setup ── */}
      {phase === 'setup' && (
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        <PaperCard status="active" className="p-6 md:p-8">
          <div className="text-center space-y-4">
            <span className="text-4xl">✍️</span>
            {noKnowledgePoints && bankQuestions.filter((q) => q.source === 'bank' && q.answer).length === 0 ? (
              <>
                <h2 className="font-serif text-xl text-ink-900 font-bold">尚无练习内容</h2>
                <p className="text-sm text-ink-600 font-sans max-w-md mx-auto">
                  请先上传复习资料（知识点）或题库，由 Agent 拆解/抽题后再开始练习。
                </p>
                <VintageButton variant="primary" size="lg" onClick={handleBackHome}>
                  <ArrowLeft size={16} className="mr-1.5" /> 返回首页上传资料
                </VintageButton>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl text-ink-900 font-bold">准备开始练习</h2>

                {/* 出题模式选择 */}
                <div className="text-left max-w-md mx-auto" role="radiogroup" aria-label="选择出题模式">
                  <span className="block text-xs font-serif text-ink-600 mb-1.5">出题模式</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { v: 'auto', label: '自动', desc: '有题库走题库' },
                      { v: 'bank', label: '题库', desc: '原题原答' },
                      { v: 'knowledge', label: '知识点', desc: 'AI 现场出题' },
                    ] as const).map((opt) => {
                      const disabled = opt.v === 'bank' && bankQuestions.filter((q) => q.source === 'bank' && q.answer).length === 0;
                      const selected = genMode === opt.v;
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled}
                          onClick={() => setGenMode(opt.v)}
                          className={`relative px-2 py-2 rounded-[3px] text-xs font-serif border transition-colors text-center ${
                            selected
                              ? 'bg-seal text-paper-50 border-seal'
                              : disabled
                                ? 'bg-paper-100 text-ink-300 border-ink-600/10 cursor-not-allowed'
                                : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50'
                          }`}
                        >
                          {selected && <motion.div layoutId="modeHighlight" className="absolute inset-0 bg-seal/10 rounded-paper pointer-events-none" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                          <div className="relative z-10">
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-[10px] opacity-80 mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 当前内容概览 */}
                <div className="text-sm text-ink-600 font-sans space-y-1">
                  {knowledgePoints.length > 0 && (
                    <p>知识点 <span className="font-serif text-seal font-bold">{knowledgePoints.length}</span> 个
                      {studyProgress.weakPointIds.length > 0 && (
                        <span className="text-terracotta-dark">（含 {studyProgress.weakPointIds.length} 个薄弱点将强化出题）</span>
                      )}
                    </p>
                  )}
                  {bankQuestions.filter((q) => q.source === 'bank').length > 0 && (
                    <p>题库题 <span className="font-serif text-seal font-bold">{bankQuestions.filter((q) => q.source === 'bank').length}</span> 道
                      <span className="text-ink-500">（其中 AI 补答 {bankQuestions.filter((q) => q.source === 'bank' && q.aiFilled).length} 道）</span>
                    </p>
                  )}
                </div>

                {/* 文件筛选器（仅当题库题来自多个文件时显示） */}
                {bankMaterials.length > 1 && genMode !== 'knowledge' && (
                  <div className="text-left max-w-md mx-auto">
                    <span className="block text-xs font-serif text-ink-600 mb-1.5">出题文件范围</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMaterialId('all')}
                        className={`px-2.5 py-1.5 rounded-[3px] text-xs font-serif border transition-colors ${
                          selectedMaterialId === 'all'
                            ? 'bg-seal text-paper-50 border-seal'
                            : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50'
                        }`}
                      >
                        全部 ({bankQuestions.filter((q) => q.source === 'bank' && q.answer).length})
                      </button>
                      {bankMaterials.map((m) => {
                        const cnt = bankQuestions.filter((q) => q.materialId === m.id && q.source === 'bank' && q.answer).length;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMaterialId(m.id)}
                            title={m.name}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] text-xs font-serif border transition-colors max-w-[200px] ${
                              selectedMaterialId === m.id
                                ? 'bg-seal text-paper-50 border-seal'
                                : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50'
                            }`}
                          >
                            <span className="truncate">{m.name}</span>
                            <span className="opacity-70 flex-shrink-0">({cnt})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {genMode === 'knowledge' && noApiKey && (
                  <p className="text-xs text-terracotta-dark font-serif">知识点模式需调用 AI 出题，请先配置 API Key</p>
                )}

                <VintageButton
                  variant="primary"
                  size="lg"
                  disabled={genMode === 'knowledge' && noApiKey}
                  onClick={() => void startSession()}
                >
                  开始练习 <ChevronRight size={16} className="ml-1.5" />
                </VintageButton>
              </>
            )}
          </div>
        </PaperCard>
        </motion.div>
      )}

      {/* ── Generating ── */}
      {phase === 'generating' && (
        <motion.div
          key="generating"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        <PaperCard status="active" className="p-6 md:p-8">
          <PaperSpinner text="正在出题，请稍候..." />
        </PaperCard>
        </motion.div>
      )}

      {/* ── Quiz ── */}
      {phase === 'quiz' && currentQuestion && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <PaperCard status="active" className="p-5 md:p-6">
            {/* 题型 / 难度 / 来源 */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <VintageTag color="ink">{QTYPE_LABEL[currentQuestion.type]}</VintageTag>
              <VintageTag
                color={
                  currentQuestion.difficulty >= 4 ? 'seal'
                    : currentQuestion.difficulty <= 2 ? 'green' : 'gold'
                }
              >
                {DIFFICULTY_LABEL[currentQuestion.difficulty] ?? '中等'} · {currentQuestion.difficulty}/5
              </VintageTag>
              {currentQuestion.source === 'bank' && (
                <VintageTag color={currentQuestion.aiFilled ? 'worn' : 'seal'}>
                  {currentQuestion.aiFilled ? '题库·AI补答' : '题库原题'}
                </VintageTag>
              )}
            </div>

            {/* 题干 */}
            <p className="font-serif text-base md:text-lg text-ink-900 leading-relaxed mb-4 whitespace-pre-wrap">
              {currentQuestion.stem}
            </p>

            {/* 作答区 */}
            {currentQuestion.type === 'choice' && currentQuestion.options ? (
              <div className="space-y-2">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = extractChoiceLetter(opt);
                  const correctLetter = extractChoiceLetter(currentQuestion.answer);
                  const isSelected = selectedOptionIdx === idx;
                  const isCorrectOpt = judged != null && letter === correctLetter;
                  const isWrongPick = judged != null && isSelected && letter !== correctLetter;
                  let optCls = '';
                  if (judged) {
                    if (isCorrectOpt) optCls = 'border-sage bg-sage/15 text-sage-dark';
                    else if (isWrongPick) optCls = 'border-terracotta bg-terracotta/15 text-terracotta-dark';
                    else optCls = 'opacity-55';
                  } else if (isSelected) {
                    optCls = 'border-seal bg-seal/10 text-ink-800';
                  }
                  return (
                    <motion.div
                      key={idx}
                      // 判错时错误选项摇头反馈
                      animate={isWrongPick ? { x: [-3, 3, -3, 3, 0] } : { x: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                    <VintageButton
                      variant="secondary"
                      className={cn('w-full justify-start text-left h-auto py-2.5 whitespace-normal', optCls)}
                      onClick={() => {
                        if (!judged && !judging) {
                          setSelectedOptionIdx(idx);
                          setUserAnswer(opt);
                        }
                      }}
                    >
                      <span className="font-serif text-sm">{opt}</span>
                      {judged && isCorrectOpt && (
                        <motion.span
                          className="ml-auto flex-shrink-0"
                          initial={{ scale: 2, rotate: -12, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                        >
                          <Check size={15} />
                        </motion.span>
                      )}
                      {judged && isWrongPick && <X size={15} className="ml-auto flex-shrink-0" />}
                    </VintageButton>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={judged != null || judging}
                placeholder="请输入你的答案..."
                aria-label="输入你的答案"
                title="输入你的答案"
                rows={currentQuestion.type === 'short' || currentQuestion.type === 'calculation' ? 3 : 2}
                className="w-full bg-paper-50 border border-ink-600/20 rounded-paper px-3 py-2 font-serif text-ink-800 text-sm focus:outline-none focus:border-seal/50 focus:shadow-[0_0_0_3px_rgba(139,37,0,0.08)] resize-none disabled:opacity-70"
              />
            )}

            {/* 提交 / 反馈 */}
            {!judged ? (
              <div className="mt-4">
                <VintageButton
                  variant="primary"
                  size="lg"
                  disabled={!userAnswer.trim() || judging}
                  onClick={() => void handleSubmit()}
                  className="w-full sm:w-auto"
                >
                  {judging ? 'AI 判定中…' : '提交作答'}
                </VintageButton>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div
                  className={cn(
                    'rounded-paper border px-3 py-2.5',
                    judged.isCorrect ? 'border-sage/30 bg-sage/10' : 'border-terracotta/30 bg-terracotta/10',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {judged.isCorrect ? (
                      <>
                        <Check size={16} className="text-sage-dark" />
                        <VintageTag color="green">答对了</VintageTag>
                      </>
                    ) : (
                      <>
                        <X size={16} className="text-terracotta-dark" />
                        <VintageTag color="seal">答错了</VintageTag>
                      </>
                    )}
                  </div>
                  {!judged.isCorrect && (
                    <p className="text-sm text-ink-800 font-serif">
                      正确答案：<span className="text-sage-dark font-bold">{currentQuestion.answer}</span>
                    </p>
                  )}
                  {currentQuestion.explanation && (
                    <p className="text-xs text-ink-600 font-sans mt-1">{currentQuestion.explanation}</p>
                  )}
                </div>

                {!judged.isCorrect && (
                  <ExplanationPanel
                    selectedStyle={selectedStyle}
                    onStyleChange={handleStyleChange}
                    loading={explanationLoading}
                    explanation={explanation}
                    onGoWrongbook={handleGoWrongbook}
                    autoRecorded={addedToWrongbook}
                  />
                )}

                <div className="flex justify-end">
                  <VintageButton variant="primary" size="lg" onClick={handleNext}>
                    {currentIndex + 1 >= sessionQuestions.length ? '查看总结' : '下一题'}
                    <ChevronRight size={16} className="ml-1.5" />
                  </VintageButton>
                </div>
              </div>
            )}
          </PaperCard>
        </motion.div>
        </AnimatePresence>
        </motion.div>
      )}

      {/* ── Summary ── */}
      {phase === 'summary' && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        <QuizResultPage
          session={{
            id: crypto.randomUUID(),
            subjectId: null,
            mode: 'practice',
            totalQuestions: totalAnswered,
            correctCount,
            wrongCount,
            accuracy,
            durationSeconds: 0,
          }}
          onReviewWrong={() => { handleBackHome(); /* 跳转错题本由 App 层路由处理，这里先回首页 */ }}
          onRetry={handleRetry}
          onGoHome={handleBackHome}
        />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
