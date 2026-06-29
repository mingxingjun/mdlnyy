import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Home, AlertCircle, RefreshCw, FileText,
  Check, Star, Calendar, Clock, Target, TrendingUp, BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ReviewPlanItem } from '@/store/useAppStore';
import { useCountUp } from '@/hooks/useCountUp';
import { useToastStore } from '@/components/Toast';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { getAgent, compressPrompt } from '@/lib/agents/definitions';
import { cn } from '@/lib/utils';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import PaperSpinner from '@/components/PaperSpinner';

/* ═══════════════════════════════════════════════════════
   常量与映射
   ═══════════════════════════════════════════════════════ */

const TASK_TYPE_LABEL: Record<ReviewPlanItem['taskType'], string> = {
  review: '复习',
  practice: '练习',
  mock_exam: '模考',
};

const TASK_TYPE_COLOR: Record<ReviewPlanItem['taskType'], 'gold' | 'seal' | 'ink'> = {
  review: 'gold',
  practice: 'seal',
  mock_exam: 'ink',
};

type ReportState = 'idle' | 'loading' | 'done' | 'error';

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function coerceString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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

interface ParsedReport {
  summary: string;
  suggestions: string[];
  nextPlan?: string;
}

/** 从督学 Agent 返回内容中解析报告 JSON，兼容 suggestions / recommendations 两种字段 */
function parseReportResponse(content: string): ParsedReport | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    return null;
  }
  if (!isObject(parsed)) return null;

  const summary = coerceString(parsed.summary);

  let suggestions: string[] = [];
  const recRaw = parsed.recommendations;
  const sugRaw = parsed.suggestions;
  if (Array.isArray(sugRaw)) {
    suggestions = coerceStringArray(sugRaw);
  } else if (Array.isArray(recRaw)) {
    // recommendations 可能是字符串数组，也可能是 { action, target, reason } 对象数组
    suggestions = recRaw
      .map((r): string => {
        if (typeof r === 'string') return r.trim();
        if (isObject(r)) {
          const reason = coerceString(r.reason);
          if (reason) return reason;
          const action = coerceString(r.action);
          const target = coerceString(r.target);
          if (action && target) return `${action} → ${target}`;
          return action || target;
        }
        return '';
      })
      .filter((s) => s.length > 0);
  }

  const nextPlan = coerceString(parsed.nextPlan);
  return {
    summary,
    suggestions,
    nextPlan: nextPlan.length > 0 ? nextPlan : undefined,
  };
}

/** 检查报告生成任务（chat 路由）的 provider 是否已配置 API Key */
function isApiKeyConfigured(): boolean {
  try {
    const settings = loadModelSettings();
    return isTaskConfigured(settings, 'chat');
  } catch {
    return false;
  }
}

function formatDateTime(ts?: number): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function priorityStars(priority: number): { filled: number; total: number } {
  const p = Math.max(1, Math.min(5, Math.round(priority)));
  return { filled: p, total: 5 };
}

/* ═══════════════════════════════════════════════════════
   小型展示组件
   ═══════════════════════════════════════════════════════ */

function StatCard({
  label, value, suffix, color, icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  icon: ReactNode;
}) {
  const animated = useCountUp(value);
  return (
    <div className="rounded-paper border border-ink-600/10 bg-paper-100/50 px-3 py-3 text-center">
      <div className="flex items-center justify-center mb-1 text-ink-500" aria-hidden="true">{icon}</div>
      <p className="text-xs text-ink-500 font-sans mb-1">{label}</p>
      <p className={cn('font-serif text-2xl font-bold leading-none', color)}>
        {animated}
        {suffix && <span className="text-sm font-sans font-normal ml-0.5 text-ink-500">{suffix}</span>}
      </p>
    </div>
  );
}

/** paper 风格进度条 */
function PaperBar({
  label, value, max, color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-serif text-sm text-ink-800">{label}</span>
        <span className="font-serif text-xs text-ink-500">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          whileHover={{ opacity: 0.85, scale: 1.02 }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   复习计划项
   ═══════════════════════════════════════════════════════ */

/** 用 motion 包裹 lucide Check，用于勾选 spring 反馈 */
const MotionCheck = motion(Check);

/** AI 报告内容 stagger 容器 variants */
const reportContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

/** AI 报告内容 stagger 子项 variants */
const reportItemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

interface PlanItemRowProps {
  item: ReviewPlanItem;
  index: number;
  kpNames: string[];
}

function PlanItemRow({ item, index, kpNames }: PlanItemRowProps) {
  const togglePlanItemCompleted = useAppStore((s) => s.togglePlanItemCompleted);
  const { filled, total } = priorityStars(item.priority);

  return (
    <li
      className="flex items-start gap-3 rounded-paper border border-ink-600/10 bg-paper-100/40 px-3 py-2.5 transition-all hover:-translate-y-px hover:border-seal/20"
    >
      <button
        type="button"
        onClick={() => togglePlanItemCompleted(item.date, index)}
        title={item.completed ? '标记为未完成' : '标记为已完成'}
        aria-label={item.completed ? '标记为未完成' : '标记为已完成'}
        className={cn(
          'flex-shrink-0 mt-0.5 w-5 h-5 rounded-paper border-2 flex items-center justify-center transition-colors',
          item.completed
            ? 'bg-sage border-sage-dark text-paper-50'
            : 'bg-paper-50 border-ink-500/40 hover:border-sage',
        )}
      >
        <AnimatePresence>
          {item.completed && (
            <MotionCheck
              size={12}
              strokeWidth={3}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <VintageTag color={TASK_TYPE_COLOR[item.taskType]}>
            {TASK_TYPE_LABEL[item.taskType]}
          </VintageTag>
          <VintageTag color="worn">
            <Clock size={11} className="mr-0.5" aria-hidden="true" />
            {item.durationMinutes} 分钟
          </VintageTag>
          <span className="inline-flex items-center gap-0.5" title={`优先级 ${filled}/${total}`}>
            {Array.from({ length: total }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < filled ? 'text-gold fill-gold' : 'text-ink-300'}
                aria-hidden="true"
              />
            ))}
          </span>
          {item.completed && <VintageTag color="green">已完成</VintageTag>}
        </div>
        {kpNames.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {kpNames.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center px-2 py-0.5 rounded-paper bg-paper-200/60 text-ink-700 font-serif text-xs border border-ink-600/10"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-serif text-xs text-ink-500 italic">未关联知识点</p>
        )}
      </div>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function Supervisor() {
  const studyProgress = useAppStore((s) => s.studyProgress);
  const wrongQuestions = useAppStore((s) => s.wrongQuestions);
  const knowledgePoints = useAppStore((s) => s.knowledgePoints);
  const reviewPlan = useAppStore((s) => s.reviewPlan);
  const updateStudyProgress = useAppStore((s) => s.updateStudyProgress);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const addToast = useToastStore((s) => s.addToast);

  const [reportState, setReportState] = useState<ReportState>('idle');
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [reportError, setReportError] = useState<string>('');

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

  /** 错题分布：按知识点统计错题数，取 Top N */
  const wrongDist = useMemo(() => {
    const counts = new Map<string, number>();
    wrongQuestions.forEach((wq) => {
      wq.knowledgePointIds.forEach((id) => {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        name: kpNameMap.get(id) ?? '（未知知识点）',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [wrongQuestions, kpNameMap]);

  /** 复习计划按日期分组 */
  const planByDate = useMemo(() => {
    if (!reviewPlan) return [] as { date: string; items: { item: ReviewPlanItem; index: number }[] }[];
    const map = new Map<string, { item: ReviewPlanItem; index: number }[]>();
    reviewPlan.items.forEach((item, index) => {
      const list = map.get(item.date) ?? [];
      list.push({ item, index });
      map.set(item.date, list);
    });
    return Array.from(map.entries())
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [reviewPlan]);

  const accuracy = studyProgress.totalQuestions > 0
    ? Math.round((studyProgress.correctCount / studyProgress.totalQuestions) * 100)
    : 0;

  const handleBackHome = useCallback(() => {
    setActiveView('dashboard');
  }, [setActiveView]);

  const handleGoPractice = useCallback(() => {
    setActiveView('practice');
  }, [setActiveView]);

  const generateReport = useCallback(async () => {
    if (!isApiKeyConfigured()) {
      addToast('warning', '请先配置 AI 模型 API Key');
      setReportState('error');
      setReportError('未配置 AI 模型 API Key，无法调用督学 Agent。');
      return;
    }
    const agent = getAgent('supervisor-agent');
    if (!agent) {
      addToast('error', '督学 Agent 未就绪');
      setReportState('error');
      setReportError('督学 Agent 未就绪');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setReportState('loading');
    setReportError('');

    const wrongSummary = wrongQuestions.length > 0
      ? wrongQuestions
          .map((wq, i) => {
            const kpNames = wq.knowledgePointIds.map((id) => kpNameMap.get(id) ?? id).join(', ') || '（无）';
            const stem = wq.stem.length > 40 ? `${wq.stem.slice(0, 40)}...` : wq.stem;
            return `${i + 1}. [${wq.isResolved ? '已掌握' : '未掌握'}] ${stem} | 知识点：${kpNames} | 复习 ${wq.reviewCount} 次`;
          })
          .join('\n')
      : '（暂无错题）';

    const kpMastery = knowledgePoints.length > 0
      ? knowledgePoints
          .map((kp) => {
            const weak = studyProgress.weakPointIds.includes(kp.id) ? '（薄弱）' : '';
            return `- ${kp.name}：掌握度 ${kp.mastery.toFixed(2)}${weak}`;
          })
          .join('\n')
      : '（暂无知识点）';

    const input = `请基于以下学习进度与薄弱点生成本周复习报告 JSON。

【学习进度】
- 累计答题：${studyProgress.totalQuestions} 道
- 答对：${studyProgress.correctCount} 道
- 答错：${studyProgress.wrongCount} 道
- 正确率：${accuracy}%
- 连续学习：${studyProgress.streakDays} 天
- 今日学习时长：${studyProgress.studyMinutesToday} 分钟
- 已复习卡片数：${studyProgress.reviewedCardCount}
- 薄弱知识点数：${studyProgress.weakPointIds.length}

【知识点掌握度】
${kpMastery}

【错题概览】（共 ${wrongQuestions.length} 题）
${wrongSummary}

【输出 JSON Schema】
{
  "summary": "整体复习情况总结（不超过 200 字，基于实际数据，鼓励语气）",
  "suggestions": ["可执行建议 1（指向具体知识点或动作）", "可执行建议 2"],
  "nextPlan": "下周建议复习重点（不超过 100 字）"
}

【要求】
- 报告基于实际数据，不臆造指标
- 建议必须可执行（指向具体知识点或动作如 practice / review_cards）
- 语气鼓励而非指责
- 仅输出 JSON，不要 markdown 代码块标记`;

    try {
      const settings = loadModelSettings();
      const userMessage = compressPrompt(agent, input);
      const { content } = await callModelForTask(
        settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
        { temperature: agent.temperature, maxTokens: agent.maxTokens },
      );
      if (controller.signal.aborted) return;
      const parsed = parseReportResponse(content);
      if (!parsed) {
        addToast('error', '报告解析失败');
        setReportState('error');
        setReportError('未能从督学 Agent 返回内容中解析出报告 JSON，请重试。');
        return;
      }
      setReport(parsed);
      setReportState('done');
      updateStudyProgress({ lastReportAt: Date.now() });
      addToast('success', '学习报告已生成');
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : '未知错误';
      addToast('error', `报告生成失败：${msg}`);
      setReportState('error');
      setReportError(msg);
    }
  }, [studyProgress, wrongQuestions, knowledgePoints, kpNameMap, accuracy, updateStudyProgress, addToast]);

  const noDataAtAll = studyProgress.totalQuestions === 0 && !reviewPlan;

  /* ── 空状态 ── */
  if (noDataAtAll) {
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
            <p className="font-handwritten text-sm text-ink-500 leading-none">进度 · 报告 · 提醒</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">学习报告</h1>
          </div>
        </header>

        <PaperCard status="default" className="p-8 md:p-12">
          <div className="text-center space-y-4">
            <span className="text-5xl block mb-4 animate-float">📊</span>
            <p className="font-handwritten text-2xl text-ink-700">还没有学习数据，去练习吧</p>
            <p className="text-sm text-ink-500 font-sans max-w-md mx-auto">
              完成一些练习后，督学 Agent 会基于你的答题统计、薄弱点与错题生成本周复习报告与进度看板。
            </p>
            <VintageButton variant="primary" size="lg" onClick={handleGoPractice}>
              <Target size={16} className="mr-1.5" aria-hidden="true" /> 去练习
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
            <p className="font-handwritten text-sm text-ink-500 leading-none">进度 · 报告 · 提醒</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">学习报告</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VintageTag color="worn">生成于 {formatDateTime(studyProgress.lastReportAt)}</VintageTag>
          <VintageButton
            variant="primary"
            size="sm"
            disabled={reportState === 'loading'}
            onClick={() => void generateReport()}
          >
            <FileText size={13} className="mr-1" aria-hidden="true" />
            {reportState === 'done' ? '重新生成' : '生成报告'}
          </VintageButton>
        </div>
      </header>

      {/* 2. 进度看板（始终可见） */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0, ease: [0.22, 1, 0.36, 1] }}
      >
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
            <BarChart3 size={16} className="text-seal" aria-hidden="true" />
            进度看板
          </h2>
          <span className="text-xs text-ink-500 font-sans">督学 Agent 跟踪</span>
        </div>
        <PaperCard status="default" className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="累计答题"
              value={studyProgress.totalQuestions}
              suffix="道"
              color="text-ink-800"
              icon={<Target size={14} />}
            />
            <StatCard
              label="正确率"
              value={accuracy}
              suffix="%"
              color={
                accuracy >= 70 ? 'text-sage-dark'
                  : accuracy >= 50 ? 'text-gold-dark'
                    : 'text-terracotta-dark'
              }
              icon={<TrendingUp size={14} />}
            />
            <StatCard
              label="连续学习"
              value={studyProgress.streakDays}
              suffix="天"
              color="text-gold-dark"
              icon={<Calendar size={14} />}
            />
            <StatCard
              label="今日时长"
              value={studyProgress.studyMinutesToday}
              suffix="分"
              color="text-seal"
              icon={<Clock size={14} />}
            />
          </div>
          <div className="space-y-2.5 pt-3 border-t border-ink-600/10">
            <PaperBar
              label="答对题数"
              value={studyProgress.correctCount}
              max={Math.max(studyProgress.totalQuestions, 1)}
              color="bg-sage"
            />
            <PaperBar
              label="答错题数"
              value={studyProgress.wrongCount}
              max={Math.max(studyProgress.totalQuestions, 1)}
              color="bg-terracotta"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="font-serif text-sm text-ink-800 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-seal" aria-hidden="true" />
                薄弱知识点数
              </span>
              <span className="font-serif text-base text-seal font-bold">
                {studyProgress.weakPointIds.length}
              </span>
            </div>
          </div>
        </PaperCard>
      </section>
      </motion.div>

      {/* 3. 复习计划 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
            <Calendar size={16} className="text-gold-dark" aria-hidden="true" />
            复习计划
          </h2>
          {reviewPlan && (
            <span className="text-xs text-ink-500 font-sans">
              共 {reviewPlan.items.length} 项 · {reviewPlan.totalMinutes} 分钟
            </span>
          )}
        </div>
        {!reviewPlan ? (
          <PaperCard status="default" className="p-5">
            <div className="text-center space-y-2">
              <span className="text-2xl block mb-4 animate-float">🗓️</span>
              <p className="font-serif text-sm text-ink-700">尚未生成复习计划</p>
              <p className="text-xs text-ink-500 font-sans">前往首页生成复习计划</p>
              <VintageButton variant="ghost" size="sm" onClick={handleBackHome}>
                <Home size={13} className="mr-1" aria-hidden="true" /> 前往首页
              </VintageButton>
            </div>
          </PaperCard>
        ) : (
          <div className="space-y-3">
            {reviewPlan.rationale && (
              <PaperCard status="default" className="p-3">
                <p className="text-xs text-ink-500 font-serif mb-1">计划依据</p>
                <p className="font-serif text-sm text-ink-800 leading-relaxed">{reviewPlan.rationale}</p>
              </PaperCard>
            )}
            {planByDate.map((group) => {
              const completedCount = group.items.filter((g) => g.item.completed).length;
              return (
                <PaperCard key={group.date} status="default" className="p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-serif text-sm text-ink-900 font-bold flex items-center gap-1.5">
                      <Calendar size={13} className="text-seal" aria-hidden="true" />
                      {group.date}
                    </h3>
                    <VintageTag color={completedCount === group.items.length ? 'green' : 'ink'}>
                      {completedCount} / {group.items.length} 完成
                    </VintageTag>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map(({ item, index }) => (
                      <PlanItemRow
                        key={`${item.date}-${index}`}
                        item={item}
                        index={index}
                        kpNames={item.knowledgePointIds
                          .map((id) => kpNameMap.get(id))
                          .filter((n): n is string => !!n)}
                      />
                    ))}
                  </ul>
                </PaperCard>
              );
            })}
          </div>
        )}
      </section>
      </motion.div>

      {/* 4. AI 学习报告 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
            <FileText size={16} className="text-seal" aria-hidden="true" />
            AI 学习报告
          </h2>
          <VintageTag color="seal">督学 Agent</VintageTag>
        </div>

        {reportState === 'idle' && !report && (
          <PaperCard status="default" className="p-5">
            <div className="text-center space-y-2">
              <span className="text-2xl">📄</span>
              <p className="font-serif text-sm text-ink-700">尚未生成 AI 报告</p>
              <p className="text-xs text-ink-500 font-sans max-w-md mx-auto">
                督学 Agent 会综合答题统计、错题分布与知识点掌握度，生成阶段性复习报告与建议。
              </p>
              <VintageButton variant="primary" size="sm" onClick={() => void generateReport()}>
                <FileText size={13} className="mr-1" aria-hidden="true" /> 生成报告
              </VintageButton>
            </div>
          </PaperCard>
        )}

        {reportState === 'loading' && (
          <PaperCard status="active" className="p-4">
            <PaperSpinner text="督学 Agent 正在生成报告..." />
          </PaperCard>
        )}

        {reportState === 'error' && (
          <PaperCard status="default" className="p-4">
            <div className="rounded-paper border border-terracotta/25 bg-terracotta/5 px-3 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle size={15} className="text-terracotta-dark" aria-hidden="true" />
                <p className="font-serif text-sm text-terracotta-dark font-bold">报告生成失败</p>
              </div>
              <p className="text-sm text-ink-700 font-sans mb-3">{reportError}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <VintageButton variant="primary" size="sm" onClick={() => void generateReport()}>
                  <RefreshCw size={13} className="mr-1" aria-hidden="true" /> 重试
                </VintageButton>
                <VintageButton variant="ghost" size="sm" onClick={handleBackHome}>
                  <Home size={13} className="mr-1" aria-hidden="true" /> 返回首页
                </VintageButton>
              </div>
            </div>
          </PaperCard>
        )}

        {reportState === 'done' && report && (
          <PaperCard status="active" className="p-5">
            <motion.div
              className="space-y-3"
              variants={reportContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={reportItemVariants} className="flex items-center gap-2 pb-2 border-b border-ink-600/10">
                <FileText size={16} className="text-seal" aria-hidden="true" />
                <h3 className="font-serif text-base text-ink-900 font-bold">本周复习报告</h3>
              </motion.div>
              {report.summary && (
                <motion.div variants={reportItemVariants} className="rounded-paper border border-ink-600/15 bg-paper-100/50 px-3 py-2.5">
                  <p className="font-serif text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
                    {report.summary}
                  </p>
                </motion.div>
              )}
              {report.suggestions.length > 0 && (
                <motion.div variants={reportItemVariants}>
                  <p className="font-serif text-sm text-ink-700 mb-1.5 flex items-center gap-1.5">
                    <Target size={13} className="text-gold-dark" aria-hidden="true" />
                    复习建议
                  </p>
                  <ul className="space-y-1.5">
                    {report.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-ink-800 font-serif leading-relaxed"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-seal/10 text-seal text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="flex-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
              {report.nextPlan && (
                <motion.div variants={reportItemVariants} className="rounded-paper border border-gold/20 bg-gold/5 px-3 py-2.5">
                  <p className="text-xs text-gold-dark font-serif mb-0.5">下周建议</p>
                  <p className="text-sm text-ink-800 font-serif leading-relaxed">{report.nextPlan}</p>
                </motion.div>
              )}
              <motion.div variants={reportItemVariants} className="pt-2 border-t border-ink-600/10 flex items-center gap-2 flex-wrap">
                <VintageButton variant="ghost" size="sm" onClick={() => void generateReport()}>
                  <RefreshCw size={13} className="mr-1" aria-hidden="true" /> 重新生成
                </VintageButton>
              </motion.div>
            </motion.div>
          </PaperCard>
        )}
      </section>
      </motion.div>

      {/* 5. 错题分布 */}
      {wrongQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
              <BarChart3 size={16} className="text-terracotta-dark" aria-hidden="true" />
              错题分布
            </h2>
            <span className="text-xs text-ink-500 font-sans">按知识点错题数</span>
          </div>
          <PaperCard status="default" className="p-4">
            {wrongDist.length === 0 ? (
              <p className="font-serif text-sm text-ink-500 text-center py-2">暂无错题分布数据</p>
            ) : (
              <div className="space-y-2.5">
                {wrongDist.map((d) => {
                  const max = wrongDist[0]?.count ?? 1;
                  const pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
                  return (
                    <div key={d.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif text-sm text-ink-800 truncate">{d.name}</span>
                        <span className="font-serif text-xs text-terracotta-dark font-bold flex-shrink-0 ml-2">
                          {d.count} 题
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-terracotta"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          whileHover={{ opacity: 0.85, scale: 1.02 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PaperCard>
        </section>
        </motion.div>
      )}
    </div>
  );
}
