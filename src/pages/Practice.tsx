import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, X, Lightbulb, RefreshCw, Home,
  ChevronRight, BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Question, WrongQuestion } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { getAgent, compressPrompt } from '@/lib/agents/definitions';
import type { ExplanationStyle } from '@/lib/agents/types';
import { cn } from '@/lib/utils';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';

/* ═══════════════════════════════════════════════════════
   常量与映射
   ═══════════════════════════════════════════════════════ */

const QUESTIONS_PER_SESSION = 5;

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

function PaperSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-seal"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.15, 0.7] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="font-serif text-sm text-ink-600">{text}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-paper border border-ink-600/10 bg-paper-100/50 px-3 py-3 text-center">
      <p className="text-xs text-ink-500 font-sans mb-1">{label}</p>
      <p className={cn('font-serif text-2xl font-bold leading-none', color)}>{value}</p>
    </div>
  );
}

interface ExplanationPanelProps {
  selectedStyle: ExplanationStyle;
  onStyleChange: (s: ExplanationStyle) => void;
  loading: boolean;
  explanation: ParsedExplanation | null;
  onAddWrongbook: () => void;
  added: boolean;
}

function ExplanationPanel({
  selectedStyle, onStyleChange, loading, explanation, onAddWrongbook, added,
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

      {/* 加入错题本 */}
      <div className="mt-4 pt-3 border-t border-ink-600/10">
        <VintageButton
          variant={added ? 'secondary' : 'primary'}
          size="sm"
          disabled={added || loading}
          onClick={onAddWrongbook}
        >
          {added ? '已加入错题本' : '加入错题本'}
          {!added && <BookOpen size={14} className="ml-1.5" />}
        </VintageButton>
      </div>
    </PaperCard>
  );
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function Practice() {
  const knowledgePoints = useAppStore((s) => s.knowledgePoints);
  const addQuestions = useAppStore((s) => s.addQuestions);
  const addAnswerRecord = useAppStore((s) => s.addAnswerRecord);
  const addWrongQuestion = useAppStore((s) => s.addWrongQuestion);
  const incrementQuestions = useAppStore((s) => s.incrementQuestions);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { addToast } = useToastStore();

  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [judged, setJudged] = useState<JudgedResult | null>(null);
  const [explanation, setExplanation] = useState<ParsedExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ExplanationStyle>('detailed');
  const [addedToWrongbook, setAddedToWrongbook] = useState(false);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean }[]>([]);

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
    setExplanation(null);
    setExplanationLoading(false);
    setAddedToWrongbook(false);
    setSelectedStyle('detailed');
    questionStartRef.current = Date.now();
  }, []);

  const fetchExplanation = useCallback(
    async (style: ExplanationStyle) => {
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
        );
        if (controller.signal.aborted) return;
        const parsed = parseExplanationResponse(content);
        if (parsed) {
          setExplanation(parsed);
        } else {
          addToast('warning', '讲解内容解析失败，显示原文');
          setExplanation({
            style,
            errorLocation: '',
            steps: [{ content: content.trim() || '（无内容）', rationale: '' }],
            pitfalls: [],
            knowledgePointIds: [],
            followupQuestions: [],
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        addToast('error', `讲解失败：${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        if (!controller.signal.aborted) setExplanationLoading(false);
      }
    },
    [sessionQuestions, currentIndex, userAnswer, addToast],
  );

  const startSession = useCallback(async () => {
    if (knowledgePoints.length === 0) {
      addToast('warning', '尚无知识点，请先上传资料');
      return;
    }
    if (!isApiKeyConfigured()) {
      addToast('warning', '请先配置 AI 模型 API Key');
      return;
    }
    const agent = getAgent('question-agent');
    if (!agent) {
      addToast('error', '出题 Agent 未就绪');
      return;
    }

    const materialId = knowledgePoints[0]?.materialId ?? '';
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('generating');
    setSessionQuestions([]);
    setCurrentIndex(0);
    setResults([]);

    const kpList = knowledgePoints
      .map((kp, i) => `${i + 1}. ${kp.name}（优先级 ${kp.priority}）[id:${kp.id}]：${kp.description}`)
      .join('\n');
    const nonce = Math.floor(Math.random() * 1000000);
    const input = `请基于以下知识点列表生成 ${QUESTIONS_PER_SESSION} 道练习题，难度梯度为 简单30% / 中等50% / 困难20%，题型混合选择/填空/简答/计算。

【出题种子】${nonce}
【知识点列表】
${kpList}

【要求】
- 每题必须关联至少 1 个知识点 id（从上方列表的 [id:...] 中选取）
- 选择题 options 形如 ["A. ...", "B. ...", "C. ...", "D. ..."]，answer 为字母（如 "B"）
- 干扰项必须合理，答案唯一确定
- 仅输出 JSON，不要 markdown 代码块标记

【输出 JSON Schema】
{
  "questions": [
    { "type": "choice", "difficulty": 3, "stem": "题干", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B", "explanation": "简短解析", "knowledgePointIds": ["kp_xxx"] }
  ]
}`;

    try {
      const settings = loadModelSettings();
      const userMessage = compressPrompt(agent, input);
      const { content } = await callModelForTask(
        settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
      );
      if (controller.signal.aborted) return;
      const qs = parseQuestionsResponse(content, materialId);
      if (qs.length === 0) {
        addToast('error', '未能解析出题目，请重试');
        setPhase('setup');
        return;
      }
      setSessionQuestions(qs);
      addQuestions(qs);
      setCurrentIndex(0);
      setResults([]);
      resetQuestionState();
      setPhase('quiz');
      addToast('success', `已生成 ${qs.length} 道题目，开始练习`);
    } catch (err) {
      if (controller.signal.aborted) return;
      addToast('error', `出题失败：${err instanceof Error ? err.message : '未知错误'}`);
      setPhase('setup');
    }
  }, [knowledgePoints, addQuestions, addToast, resetQuestionState]);

  const handleSubmit = useCallback(() => {
    const q = sessionQuestions[currentIndex];
    if (!q) return;
    const ua = userAnswer.trim();
    if (!ua) {
      addToast('warning', '请先作答');
      return;
    }
    const isCorrect = judgeAnswer(q, ua);
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
    if (!isCorrect) {
      void fetchExplanation('detailed');
    }
  }, [sessionQuestions, currentIndex, userAnswer, addAnswerRecord, incrementQuestions, addToast, fetchExplanation]);

  const handleStyleChange = useCallback(
    (style: ExplanationStyle) => {
      if (style === selectedStyle) return;
      void fetchExplanation(style);
    },
    [selectedStyle, fetchExplanation],
  );

  const handleAddToWrongbook = useCallback(() => {
    const q = sessionQuestions[currentIndex];
    if (!q || !judged) return;
    const exp = explanation;
    const stepBreakdown = exp ? formatStepBreakdown(exp) : '';
    const explanationText = exp?.errorLocation || q.explanation || '';
    const wq: WrongQuestion = {
      id: crypto.randomUUID(),
      questionId: q.id,
      stem: q.stem,
      userAnswer: judged.userAnswer,
      correctAnswer: q.answer,
      explanation: explanationText,
      knowledgePointIds: q.knowledgePointIds,
      tags: [q.type],
      explanationStyle: selectedStyle,
      stepBreakdown: stepBreakdown || undefined,
      createdAt: Date.now(),
      reviewCount: 0,
      isResolved: false,
    };
    addWrongQuestion(wq);
    setAddedToWrongbook(true);
    addToast('success', '已加入错题本');
  }, [sessionQuestions, currentIndex, judged, explanation, selectedStyle, addWrongQuestion, addToast]);

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
  const noKnowledgePoints = knowledgePoints.length === 0;
  const noApiKey = !isApiKeyConfigured();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* 页头 */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackHome}
            title="返回首页"
            className="inline-flex items-center justify-center w-9 h-9 rounded-paper border border-ink-600/20 bg-paper-100 text-ink-700 hover:bg-paper-200 hover:text-seal transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-handwritten text-sm text-ink-500 leading-none">出题 · 作答 · 讲解</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">练习</h1>
          </div>
        </div>

        {phase === 'quiz' && sessionQuestions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <VintageTag color="ink">第 {currentIndex + 1} / {sessionQuestions.length} 题</VintageTag>
            <VintageTag color="green">对 {correctCount}</VintageTag>
            {wrongCount > 0 && <VintageTag color="seal">错 {wrongCount}</VintageTag>}
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

      {/* ── Setup ── */}
      {phase === 'setup' && (
        <PaperCard status="active" className="p-6 md:p-8">
          <div className="text-center space-y-4">
            <span className="text-4xl">✍️</span>
            {noKnowledgePoints ? (
              <>
                <h2 className="font-serif text-xl text-ink-900 font-bold">尚无知识点</h2>
                <p className="text-sm text-ink-600 font-sans max-w-md mx-auto">
                  请先上传复习资料，由 Agent 提取知识点后再开始练习。
                </p>
                <VintageButton variant="primary" size="lg" onClick={handleBackHome}>
                  <ArrowLeft size={16} className="mr-1.5" /> 返回首页上传资料
                </VintageButton>
              </>
            ) : noApiKey ? (
              <>
                <h2 className="font-serif text-xl text-ink-900 font-bold">未配置模型 API Key</h2>
                <p className="text-sm text-ink-600 font-sans max-w-md mx-auto">
                  练习需要调用 AI 出题与讲解，请先在设置中配置模型 API Key。
                </p>
                <VintageButton variant="primary" size="lg" onClick={handleBackHome}>
                  <Home size={16} className="mr-1.5" /> 返回首页
                </VintageButton>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl text-ink-900 font-bold">准备开始练习</h2>
                <p className="text-sm text-ink-600 font-sans">
                  当前共 <span className="font-serif text-seal font-bold">{knowledgePoints.length}</span> 个知识点，将生成 {QUESTIONS_PER_SESSION} 道题目。
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
                  {knowledgePoints.slice(0, 6).map((kp) => (
                    <VintageTag key={kp.id} color="gold">{kp.name}</VintageTag>
                  ))}
                  {knowledgePoints.length > 6 && (
                    <VintageTag color="worn">+{knowledgePoints.length - 6}</VintageTag>
                  )}
                </div>
                <VintageButton variant="primary" size="lg" onClick={() => void startSession()}>
                  开始练习 <ChevronRight size={16} className="ml-1.5" />
                </VintageButton>
              </>
            )}
          </div>
        </PaperCard>
      )}

      {/* ── Generating ── */}
      {phase === 'generating' && (
        <PaperCard status="active" className="p-6 md:p-8">
          <PaperSpinner text="正在出题，请稍候..." />
        </PaperCard>
      )}

      {/* ── Quiz ── */}
      {phase === 'quiz' && currentQuestion && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <PaperCard status="active" className="p-5 md:p-6">
            {/* 题型 / 难度 */}
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
                    <VintageButton
                      key={idx}
                      variant="secondary"
                      className={cn('w-full justify-start text-left h-auto py-2.5 whitespace-normal', optCls)}
                      onClick={() => {
                        if (!judged) {
                          setSelectedOptionIdx(idx);
                          setUserAnswer(opt);
                        }
                      }}
                    >
                      <span className="font-serif text-sm">{opt}</span>
                      {judged && isCorrectOpt && <Check size={15} className="ml-auto flex-shrink-0" />}
                      {judged && isWrongPick && <X size={15} className="ml-auto flex-shrink-0" />}
                    </VintageButton>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={judged != null}
                placeholder="请输入你的答案..."
                aria-label="输入你的答案"
                title="输入你的答案"
                rows={currentQuestion.type === 'short' || currentQuestion.type === 'calculation' ? 3 : 2}
                className="w-full bg-paper-50 border border-ink-600/20 rounded-paper px-3 py-2 font-serif text-ink-800 text-sm focus:outline-none focus:border-seal focus:ring-1 focus:ring-seal/30 resize-none disabled:opacity-70"
              />
            )}

            {/* 提交 / 反馈 */}
            {!judged ? (
              <div className="mt-4">
                <VintageButton
                  variant="primary"
                  size="lg"
                  disabled={!userAnswer.trim()}
                  onClick={handleSubmit}
                  className="w-full sm:w-auto"
                >
                  提交作答
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
                    onAddWrongbook={handleAddToWrongbook}
                    added={addedToWrongbook}
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
      )}

      {/* ── Summary ── */}
      {phase === 'summary' && (
        <PaperCard status="completed" className="p-6 md:p-8">
          <div className="text-center space-y-5">
            <span className="text-4xl">{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '📚' : '💪'}</span>
            <h2 className="font-serif text-2xl text-ink-900 font-bold">练习完成</h2>
            <p className="text-sm text-ink-600 font-sans">
              本组共作答 {totalAnswered} 题，正确率 <span className="font-serif text-gold-dark font-bold">{accuracy}%</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
              <StatCard label="总题数" value={totalAnswered} color="text-ink-800" />
              <StatCard label="答对" value={correctCount} color="text-sage-dark" />
              <StatCard label="答错" value={wrongCount} color="text-terracotta-dark" />
              <StatCard label="正确率" value={`${accuracy}%`} color="text-gold-dark" />
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <VintageButton variant="primary" size="lg" onClick={handleRetry}>
                <RefreshCw size={16} className="mr-1.5" /> 再来一组
              </VintageButton>
              <VintageButton variant="ghost" size="lg" onClick={handleBackHome}>
                <Home size={16} className="mr-1.5" /> 返回首页
              </VintageButton>
            </div>
          </div>
        </PaperCard>
      )}
    </div>
  );
}
