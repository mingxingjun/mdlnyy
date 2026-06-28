import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, RefreshCw, Check, BookOpen,
  ChevronDown, ChevronUp, Lightbulb, Home, AlertCircle, Target,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { WrongQuestion } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { getAgent, compressPrompt } from '@/lib/agents/definitions';
import { cn } from '@/lib/utils';
import PaperCard from '@/components/PaperCard';
import type { PaperCardStatus } from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import PaperSpinner from '@/components/PaperSpinner';
import { useCountUp } from '@/hooks/useCountUp';

/* ═══════════════════════════════════════════════════════
   类型与常量
   ═══════════════════════════════════════════════════════ */

type StatusFilter = 'all' | 'unresolved' | 'resolved';
type AnalysisState = 'idle' | 'loading' | 'done' | 'error';

interface MasteryVector {
  knowledgePointId: string;
  mastery: number;
  streak?: number;
  lastAttempted?: number;
}

interface WeaknessReport {
  masteryVectors: MasteryVector[];
  weakPoints: string[];
  suggestedQuestionTypes: string[];
  summary: string;
}

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function coerceOptNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
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

/** 从错题本 Agent 返回内容中解析薄弱点报告 JSON，严格类型守卫 */
function parseWeaknessReport(content: string): WeaknessReport | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    return null;
  }
  if (!isObject(parsed)) return null;

  const mvRaw = parsed.masteryVectors;
  const masteryVectors: MasteryVector[] = Array.isArray(mvRaw)
    ? mvRaw
        .filter(isObject)
        .map((m) => ({
          knowledgePointId: String(
            typeof m.knowledgePointId === 'string' ? m.knowledgePointId : '',
          ),
          mastery:
            typeof m.mastery === 'number' && Number.isFinite(m.mastery)
              ? Math.max(0, Math.min(1, m.mastery))
              : 0,
          streak: coerceOptNumber(m.streak),
          lastAttempted: coerceOptNumber(m.lastAttempted),
        }))
        .filter((m) => m.knowledgePointId.length > 0)
    : [];

  return {
    masteryVectors,
    weakPoints: coerceStringArray(parsed.weakPoints),
    suggestedQuestionTypes: coerceStringArray(parsed.suggestedQuestionTypes),
    summary: String(typeof parsed.summary === 'string' ? parsed.summary : '').trim(),
  };
}

/** 检查薄弱点分析任务（chat 路由）的 provider 是否已配置 API Key */
function isApiKeyConfigured(): boolean {
  try {
    const settings = loadModelSettings();
    return isTaskConfigured(settings, 'chat');
  } catch {
    return false;
  }
}

function getCardStatus(wq: WrongQuestion): PaperCardStatus {
  if (wq.isResolved) return 'completed';
  if (wq.reviewCount > 0) return 'has-reward';
  return 'default';
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return '今天';
  const days = Math.floor(diff / day);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

/* ═══════════════════════════════════════════════════════
   小型展示组件
   ═══════════════════════════════════════════════════════ */

function MasteryBar({ name, mastery }: { name: string; mastery: number }) {
  const clamped = Math.max(0, Math.min(1, mastery));
  const pct = Math.round(clamped * 100);
  const fill = clamped < 0.4 ? 'bg-seal' : clamped < 0.7 ? 'bg-gold' : 'bg-sage';
  const textColor = clamped < 0.4 ? 'text-seal' : clamped < 0.7 ? 'text-gold-dark' : 'text-sage-dark';
  const label = clamped < 0.4 ? '薄弱' : clamped < 0.7 ? '待巩固' : '较熟';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-serif text-sm text-ink-800 truncate">{name}</span>
        <span className={cn('font-serif text-xs font-bold flex-shrink-0 ml-2', textColor)}>
          {pct}% · {label}
        </span>
      </div>
      <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', fill)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function FilterChip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center px-2.5 py-1 rounded-paper font-serif text-xs border transition-colors',
        active
          ? 'bg-seal/10 text-seal border-seal/30 shadow-stamp'
          : 'bg-paper-100 text-ink-600 border-ink-600/15 hover:border-seal/40 hover:text-seal',
      )}
    >
      {active && (
        <motion.div
          layoutId="filterHighlight"
          className="absolute inset-0 bg-seal/10 rounded-paper"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   错题卡片
   ═══════════════════════════════════════════════════════ */

interface WrongQuestionCardProps {
  wq: WrongQuestion;
  kpNameMap: Map<string, string>;
  index: number;
}

function WrongQuestionCard({ wq, kpNameMap, index }: WrongQuestionCardProps) {
  const markWrongResolved = useAppStore((s) => s.markWrongResolved);
  const incrementWrongReview = useAppStore((s) => s.incrementWrongReview);
  const addToast = useToastStore((s) => s.addToast);

  const [stemExpanded, setStemExpanded] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const status = getCardStatus(wq);
  const kpNames = wq.knowledgePointIds
    .map((id) => kpNameMap.get(id))
    .filter((n): n is string => !!n);
  const explanationText = wq.stepBreakdown || wq.explanation || '';

  const handleResolve = () => {
    if (wq.isResolved) return;
    markWrongResolved(wq.id);
    addToast('success', '已标记为掌握');
  };

  const handleReview = () => {
    incrementWrongReview(wq.id);
    setExplanationOpen(true);
    addToast('info', '已记录一次复习');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, rotate: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <PaperCard status={status} className="p-4 md:p-5">
        {/* 已掌握印章：盖章弹入动效 */}
        {wq.isResolved && (
          <motion.div
            className="absolute top-2 right-2 pointer-events-none z-10"
            initial={{ scale: 2.5, rotate: -42, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
              <circle cx="30" cy="30" r="26" fill="none" stroke="#8B2500" strokeWidth="2" opacity="0.7" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#8B2500" strokeWidth="1" opacity="0.5" />
              <text x="30" y="36" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#8B2500" opacity="0.85" fontFamily="serif">已掌握</text>
            </svg>
          </motion.div>
        )}

        {/* 顶部：状态 / 复习次数 / 标签 */}
        <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {wq.isResolved ? (
              <VintageTag color="green">已掌握</VintageTag>
            ) : (
              <VintageTag color="seal">待复习</VintageTag>
            )}
            {wq.reviewCount > 0 && (
              <VintageTag color="gold">已复习 {wq.reviewCount} 次</VintageTag>
            )}
            <VintageTag color="worn">{formatRelativeTime(wq.createdAt)}</VintageTag>
          </div>
          {wq.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {wq.tags.map((t, i) => (
                <VintageTag key={`${t}-${i}`} color="ink">{t}</VintageTag>
              ))}
            </div>
          )}
        </div>

        {/* 题干（可展开/收起） */}
        <button
          type="button"
          onClick={() => setStemExpanded((v) => !v)}
          className="block w-full text-left group"
          title="点击展开/收起题干"
        >
          {!stemExpanded && (
            <p className="font-serif text-base text-ink-900 leading-relaxed whitespace-pre-wrap line-clamp-2">
              {wq.stem}
            </p>
          )}
          <AnimatePresence initial={false}>
            {stemExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <p className="font-serif text-base text-ink-900 leading-relaxed whitespace-pre-wrap">
                  {wq.stem}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="inline-block mt-1 text-xs text-seal font-serif group-hover:underline">
            {stemExpanded ? '收起题干' : '展开题干'}
          </span>
        </button>

        {/* 我的答案 vs 正确答案 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <div className="rounded-paper border border-terracotta/25 bg-terracotta/5 px-3 py-2">
            <p className="text-xs text-terracotta-dark font-serif mb-0.5">我的答案</p>
            <p className="text-sm text-ink-800 font-serif break-words whitespace-pre-wrap">
              {wq.userAnswer || '（未作答）'}
            </p>
          </div>
          <div className="rounded-paper border border-sage/25 bg-sage/5 px-3 py-2">
            <p className="text-xs text-sage-dark font-serif mb-0.5">正确答案</p>
            <p className="text-sm text-ink-800 font-serif break-words whitespace-pre-wrap">
              {wq.correctAnswer}
            </p>
          </div>
        </div>

        {/* 知识点链接 */}
        {kpNames.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <BookOpen size={13} className="text-ink-400 flex-shrink-0" />
            {kpNames.map((name, i) => (
              <span
                key={`${wq.id}-kp-${i}`}
                className="inline-flex items-center px-2 py-0.5 rounded-paper bg-paper-200/60 text-ink-700 font-serif text-xs border border-ink-600/10"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* 讲解（折叠） */}
        {explanationText && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExplanationOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-gold-dark font-serif hover:underline"
            >
              <Lightbulb size={14} />
              {explanationOpen ? '收起讲解' : '查看讲解'}
              {explanationOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence initial={false}>
              {explanationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-paper border border-gold/20 bg-gold/5 px-3 py-2.5">
                    <p className="text-sm text-ink-800 font-serif whitespace-pre-wrap leading-relaxed">
                      {explanationText}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 操作 */}
        <div className="mt-4 pt-3 border-t border-ink-600/10 flex items-center gap-2 flex-wrap">
          <VintageButton
            variant={wq.isResolved ? 'secondary' : 'primary'}
            size="sm"
            disabled={wq.isResolved}
            onClick={handleResolve}
          >
            <Check size={13} className="mr-1" />
            {wq.isResolved ? '已掌握' : '标记已掌握'}
          </VintageButton>
          <VintageButton variant="ghost" size="sm" onClick={handleReview}>
            <RefreshCw size={13} className="mr-1" />
            复习一次
          </VintageButton>
        </div>
      </PaperCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function Wrongbook() {
  const wrongQuestions = useAppStore((s) => s.wrongQuestions);
  const knowledgePoints = useAppStore((s) => s.knowledgePoints);
  const updateKnowledgePointMastery = useAppStore((s) => s.updateKnowledgePointMastery);
  const updateStudyProgress = useAppStore((s) => s.updateStudyProgress);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const addToast = useToastStore((s) => s.addToast);

  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [kpFilter, setKpFilter] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisResult, setAnalysisResult] = useState<WeaknessReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const kpNameMap = useMemo(() => {
    const m = new Map<string, string>();
    knowledgePoints.forEach((kp) => m.set(kp.id, kp.name));
    return m;
  }, [knowledgePoints]);

  /** 全部唯一标签（用于筛选 chips） */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    wrongQuestions.forEach((wq) => wq.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [wrongQuestions]);

  /** 被错题引用的知识点（用于筛选下拉） */
  const relevantKps = useMemo(() => {
    const ids = new Set<string>();
    wrongQuestions.forEach((wq) => wq.knowledgePointIds.forEach((id) => ids.add(id)));
    return knowledgePoints.filter((kp) => ids.has(kp.id));
  }, [wrongQuestions, knowledgePoints]);

  const total = wrongQuestions.length;
  const resolvedCount = wrongQuestions.filter((wq) => wq.isResolved).length;
  const unresolvedCount = total - resolvedCount;

  const animatedTotal = useCountUp(wrongQuestions.length);
  const animatedUnresolved = useCountUp(wrongQuestions.filter((wq) => !wq.isResolved).length);
  const animatedResolved = useCountUp(wrongQuestions.filter((wq) => wq.isResolved).length);

  /** 筛选 + 排序：未解决优先，再按入册时间倒序 */
  const filtered = useMemo(() => {
    return wrongQuestions
      .filter((wq) => {
        if (statusFilter === 'unresolved' && wq.isResolved) return false;
        if (statusFilter === 'resolved' && !wq.isResolved) return false;
        if (tagFilter && !wq.tags.includes(tagFilter)) return false;
        if (kpFilter && !wq.knowledgePointIds.includes(kpFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
        return b.createdAt - a.createdAt;
      });
  }, [wrongQuestions, statusFilter, tagFilter, kpFilter]);

  const clearFilters = useCallback(() => {
    setTagFilter(null);
    setStatusFilter('all');
    setKpFilter(null);
  }, []);

  const handleBackHome = useCallback(() => {
    setActiveView('dashboard');
  }, [setActiveView]);

  const handleGoPractice = useCallback(() => {
    setActiveView('practice');
  }, [setActiveView]);

  const runAnalysis = useCallback(async () => {
    if (wrongQuestions.length === 0) {
      addToast('warning', '暂无错题，无法分析薄弱点');
      return;
    }
    if (!isApiKeyConfigured()) {
      addToast('warning', '请先配置 AI 模型 API Key');
      setAnalysisState('error');
      setAnalysisError('未配置 AI 模型 API Key，无法调用错题本 Agent。');
      setAnalysisResult(null);
      return;
    }
    const agent = getAgent('wrongbook-agent');
    if (!agent) {
      addToast('error', '错题本 Agent 未就绪');
      setAnalysisState('error');
      setAnalysisError('错题本 Agent 未就绪');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAnalysisState('loading');
    setAnalysisResult(null);
    setAnalysisError('');

    const wrongList = wrongQuestions
      .map((wq, i) => {
        const kpIds = wq.knowledgePointIds.join(', ') || '（无）';
        const tags = wq.tags.join(', ') || '（无）';
        return [
          `${i + 1}. 题干：${wq.stem}`,
          `   学生答案：${wq.userAnswer}`,
          `   正确答案：${wq.correctAnswer}`,
          `   知识点ids：[${kpIds}]`,
          `   标签：[${tags}]`,
        ].join('\n');
      })
      .join('\n');

    const kpList = knowledgePoints.length > 0
      ? knowledgePoints
          .map(
            (kp, i) =>
              `${i + 1}. [id:${kp.id}] ${kp.name}（当前掌握度：${kp.mastery.toFixed(2)}）：${kp.description}`,
          )
          .join('\n')
      : '（暂无知识点列表，请依据错题关联的知识点 id 推断）';

    const input = `请基于以下错题本与知识点列表分析薄弱知识点（mastery<0.6 视为薄弱），输出薄弱点报告 JSON。

【错题本】（共 ${wrongQuestions.length} 题）
${wrongList}

【知识点列表】
${kpList}

【输出要求】
- masteryVectors：给出每个被错题覆盖的知识点的掌握度向量（0-1）
- weakPoints：掌握度低于 0.6 的知识点 id 列表
- suggestedQuestionTypes：建议强化的题型（choice / fill / short / calculation）
- summary：用学生能听懂的话总结薄弱点（不超过 150 字）
- 仅输出 JSON，不要 markdown 代码块标记

【输出 JSON Schema】
{
  "masteryVectors": [{ "knowledgePointId": "kp_xxx", "mastery": 0.35, "streak": 0, "lastAttempted": 1719500000000 }],
  "weakPoints": ["kp_xxx"],
  "suggestedQuestionTypes": ["choice", "calculation"],
  "summary": "..."
}`;

    try {
      const settings = loadModelSettings();
      const userMessage = compressPrompt(agent, input);
      const { content } = await callModelForTask(
        settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
        { temperature: agent.temperature, maxTokens: agent.maxTokens },
      );
      if (controller.signal.aborted) return;
      const parsed = parseWeaknessReport(content);
      if (!parsed) {
        addToast('error', '薄弱点报告解析失败');
        setAnalysisState('error');
        setAnalysisError('薄弱点报告解析失败，请重试');
        return;
      }

      // 反馈到 store：逐个更新掌握度，并写入薄弱点列表供出题 Agent 定向练习
      parsed.masteryVectors.forEach((mv) => {
        updateKnowledgePointMastery(mv.knowledgePointId, mv.mastery);
      });
      updateStudyProgress({ weakPointIds: parsed.weakPoints });

      setAnalysisResult(parsed);
      setAnalysisState('done');
      addToast('success', `薄弱点分析完成，识别 ${parsed.weakPoints.length} 个薄弱点`);
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : '未知错误';
      addToast('error', `分析失败：${msg}`);
      setAnalysisState('error');
      setAnalysisError(msg);
    }
  }, [wrongQuestions, knowledgePoints, updateKnowledgePointMastery, updateStudyProgress, addToast]);

  const masteryMap = useMemo(() => {
    const m = new Map<string, number>();
    analysisResult?.masteryVectors.forEach((mv) => m.set(mv.knowledgePointId, mv.mastery));
    return m;
  }, [analysisResult]);

  /** 薄弱知识点展示列表（仅已知知识点，按掌握度升序） */
  const weakKpList = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.weakPoints
      .map((id) => {
        const kp = knowledgePoints.find((k) => k.id === id);
        if (!kp) return null;
        const mastery = masteryMap.get(id) ?? kp.mastery ?? 0;
        return { id, name: kp.name, mastery };
      })
      .filter((x): x is { id: string; name: string; mastery: number } => x !== null)
      .sort((a, b) => a.mastery - b.mastery);
  }, [analysisResult, knowledgePoints, masteryMap]);

  const hasActiveFilter = tagFilter !== null || statusFilter !== 'all' || kpFilter !== null;

  /* ── 空状态 ── */
  if (total === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
        <header className="flex items-center gap-3">
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
            <p className="font-handwritten text-sm text-ink-500 leading-none">收集 · 归类 · 分析</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">错题本</h1>
          </div>
        </header>
        <PaperCard status="default" className="p-8 md:p-12">
          <div className="text-center space-y-4">
            <motion.span
              className="text-5xl block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              📕
            </motion.span>
            <p className="font-handwritten text-2xl text-ink-700">还没有错题，去练习吧</p>
            <p className="text-sm text-ink-500 font-sans max-w-md mx-auto">
              答错的题目会自动收入错题本，在此回顾讲解、分析薄弱知识点，再回到练习针对性强化。
            </p>
            <VintageButton variant="primary" size="lg" onClick={handleGoPractice}>
              <ArrowRight size={16} className="mr-1.5" /> 去练习
            </VintageButton>
          </div>
        </PaperCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* 1. 页头 */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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
            <p className="font-handwritten text-sm text-ink-500 leading-none">收集 · 归类 · 分析</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">错题本</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VintageTag color="ink">总错题 {animatedTotal}</VintageTag>
          <VintageTag color="seal">未解决 {animatedUnresolved}</VintageTag>
          <VintageTag color="green">已解决 {animatedResolved}</VintageTag>
          <VintageButton
            variant="primary"
            size="sm"
            disabled={analysisState === 'loading'}
            onClick={() => void runAnalysis()}
          >
            <Target size={13} className="mr-1" />
            {analysisState === 'done' ? '重新分析' : '分析薄弱点'}
          </VintageButton>
        </div>
      </header>

      {/* 2. 筛选栏 */}
      <PaperCard status="default" className="p-4">
        <div className="space-y-3">
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif text-xs text-ink-500 mr-1">标签</span>
              <FilterChip active={tagFilter === null} onClick={() => setTagFilter(null)}>全部</FilterChip>
              {allTags.map((t) => (
                <FilterChip key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>
                  {t}
                </FilterChip>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-xs text-ink-500 mr-1">状态</span>
            <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>全部</FilterChip>
            <FilterChip active={statusFilter === 'unresolved'} onClick={() => setStatusFilter('unresolved')}>未解决</FilterChip>
            <FilterChip active={statusFilter === 'resolved'} onClick={() => setStatusFilter('resolved')}>已解决</FilterChip>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-serif text-xs text-ink-500">知识点</span>
              <select
                value={kpFilter ?? ''}
                onChange={(e) => setKpFilter(e.target.value || null)}
                aria-label="按知识点筛选错题"
                title="按知识点筛选"
                className="bg-paper-50 border border-ink-600/20 rounded-paper px-2.5 py-1 font-serif text-sm text-ink-800 focus:outline-none focus:border-seal focus:ring-1 focus:ring-seal/30 max-w-[180px]"
              >
                <option value="">全部知识点</option>
                {relevantKps.map((kp) => (
                  <option key={kp.id} value={kp.id}>{kp.name}</option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 font-sans">匹配 {filtered.length} 题</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-seal font-serif hover:underline"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      </PaperCard>

      {/* 3. 薄弱点分析面板 */}
      {analysisState !== 'idle' && (
        <PaperCard status="active" className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-seal" />
            <h2 className="font-serif text-base text-ink-900 font-bold">薄弱点分析</h2>
            <VintageTag color="seal">错题本 Agent</VintageTag>
          </div>

          {analysisState === 'loading' && (
            <PaperSpinner text="正在分析薄弱知识点..." />
          )}

          {analysisState === 'error' && (
            <div className="rounded-paper border border-terracotta/25 bg-terracotta/5 px-3 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle size={15} className="text-terracotta-dark" />
                <p className="font-serif text-sm text-terracotta-dark font-bold">分析失败</p>
              </div>
              <p className="text-sm text-ink-700 font-sans mb-3">{analysisError}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <VintageButton variant="primary" size="sm" onClick={() => void runAnalysis()}>
                  <RefreshCw size={13} className="mr-1" /> 重试
                </VintageButton>
                <VintageButton variant="ghost" size="sm" onClick={handleBackHome}>
                  <Home size={13} className="mr-1" /> 返回首页
                </VintageButton>
              </div>
            </div>
          )}

          {analysisState === 'done' && analysisResult && (
            <div className="space-y-4">
              {analysisResult.summary && (
                <div className="rounded-paper border border-ink-600/15 bg-paper-100/50 px-3 py-2.5">
                  <p className="font-serif text-sm text-ink-800 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
              )}

              {weakKpList.length > 0 ? (
                <div>
                  <p className="font-serif text-sm text-ink-700 mb-2 flex items-center gap-1.5">
                    薄弱知识点
                    <span className="text-xs text-ink-500 font-sans">（{weakKpList.length}）</span>
                  </p>
                  <div className="space-y-2.5">
                    {weakKpList.map((kp) => (
                      <MasteryBar key={kp.id} name={kp.name} mastery={kp.mastery} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-serif text-sm text-ink-600">
                  未识别到明显的薄弱知识点，继续保持。
                </p>
              )}

              {analysisResult.suggestedQuestionTypes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-serif text-xs text-ink-500">建议强化题型</span>
                  {analysisResult.suggestedQuestionTypes.map((t, i) => (
                    <VintageTag key={`${t}-${i}`} color="gold">{t}</VintageTag>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-ink-600/10 flex items-center gap-2 flex-wrap">
                <VintageButton variant="primary" size="sm" onClick={handleGoPractice}>
                  <Target size={13} className="mr-1" /> 去针对性练习
                </VintageButton>
                <VintageButton variant="ghost" size="sm" onClick={() => void runAnalysis()}>
                  <RefreshCw size={13} className="mr-1" /> 重新分析
                </VintageButton>
              </div>
            </div>
          )}
        </PaperCard>
      )}

      {/* 4. 错题列表 */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-ink-900 font-bold">错题列表</h2>
          <span className="text-xs text-ink-500 font-sans">{filtered.length} 题</span>
        </div>
        {filtered.length === 0 ? (
          <PaperCard status="default" className="p-6">
            <div className="text-center space-y-2">
              <motion.span
                className="text-3xl block"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔍
              </motion.span>
              <p className="font-serif text-sm text-ink-600">没有符合条件的错题</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-seal font-serif hover:underline"
              >
                清除筛选
              </button>
            </div>
          </PaperCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
            {filtered.map((wq, i) => (
              <WrongQuestionCard key={wq.id} wq={wq} kpNameMap={kpNameMap} index={i} />
            ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
