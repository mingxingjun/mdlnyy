import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  Trash2, Home, AlertCircle, Layers, BookOpen, Plus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { MemoryCard } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { loadModelSettings, callModelForTask, isTaskConfigured } from '@/lib/models/api';
import { getAgent, compressPrompt } from '@/lib/agents/definitions';
import { cn } from '@/lib/utils';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import PaperSpinner from '@/components/PaperSpinner';
import MathText from '@/components/MathText';
import { useCountUp } from '@/hooks/useCountUp';

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function coerceString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
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

interface ParsedCard {
  knowledgePointId: string;
  front: string;
  back: string;
}

/** 从记忆卡片 Agent 返回内容中解析卡片 JSON，兼容 { cards: [...] } 与数组两种形式 */
function parseCardsResponse(content: string): ParsedCard[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    return [];
  }
  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (isObject(parsed) && Array.isArray(parsed.cards)) {
    arr = parsed.cards;
  } else {
    return [];
  }
  return arr
    .filter(isObject)
    .map((c) => ({
      knowledgePointId: coerceString(c.knowledgePointId),
      front: coerceString(c.front),
      back: coerceString(c.back),
    }))
    .filter((c) => c.knowledgePointId.length > 0 && c.front.length > 0 && c.back.length > 0);
}

/** 检查记忆卡片生成任务（chat 路由）的 provider 是否已配置 API Key */
function isApiKeyConfigured(): boolean {
  try {
    const settings = loadModelSettings();
    return isTaskConfigured(settings, 'chat');
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   3D 翻转记忆卡片
   ═══════════════════════════════════════════════════════ */

interface FlashCardViewProps {
  card: MemoryCard;
  kpName: string;
  index: number;
}

function FlashCardView({ card, kpName, index }: FlashCardViewProps) {
  const reviewMemoryCard = useAppStore((s) => s.reviewMemoryCard);
  const { addToast } = useToastStore();
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [shake, setShake] = useState(false);

  const handleFlip = () => setFlipped((f) => !f);

  const handleReview = (isCorrect: boolean) => {
    if (reviewed) return;
    if (!isCorrect) {
      // 忘了：先摇头反馈 0.3s 再记录
      setShake(true);
      setTimeout(() => {
        setShake(false);
        reviewMemoryCard(card.id, false);
        setReviewed(true);
        addToast('info', '已记录：忘了，将尽快再次复习');
      }, 300);
    } else {
      // 记得：立即记录
      reviewMemoryCard(card.id, true);
      setReviewed(true);
      addToast('success', '已记录：记得，下次复习间隔延长');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, rotate: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
      <div className="flash-card h-[260px]">
        <div className={cn('flash-card-inner h-full w-full', flipped && 'flipped')}>
          {/* 正面：问题 / 关键词 */}
          <div
            className="flash-card-front absolute inset-0 cursor-pointer"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label={`记忆卡片：${card.front.slice(0, 30)}，点击翻面查看答案`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFlip();
              }
            }}
          >
            <PaperCard status="default" rotation={0} className="h-full p-4 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <VintageTag color="seal">记忆卡片</VintageTag>
                {kpName && <VintageTag color="gold">{kpName}</VintageTag>}
              </div>
              <div className="flex-1 flex items-center justify-center text-center px-2">
                <MathText as="div" className="font-serif text-base sm:text-lg md:text-xl text-ink-900 leading-relaxed whitespace-pre-wrap">
                  {card.front}
                </MathText>
              </div>
              <p className="text-xs text-ink-500 font-sans text-center mt-2">
                点击卡片查看答案 →
              </p>
            </PaperCard>
          </div>

          {/* 背面：答案 + 评分按钮 */}
          <div className="flash-card-back absolute inset-0">
            <PaperCard status="active" rotation={0} className="h-full p-4 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <VintageTag color="green">答案</VintageTag>
                {kpName && <VintageTag color="gold">{kpName}</VintageTag>}
              </div>
              <div className="flex-1 flex items-center justify-center text-center px-2 overflow-auto">
                <MathText as="div" className="font-serif text-sm sm:text-base md:text-lg text-ink-800 leading-relaxed whitespace-pre-wrap">
                  {card.back}
                </MathText>
              </div>
              {!reviewed ? (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <VintageButton
                    variant="primary"
                    size="sm"
                    className="bg-sage border-sage-dark/40 hover:bg-sage-dark"
                    onClick={() => handleReview(true)}
                  >
                    记得
                  </VintageButton>
                  <VintageButton
                    variant="primary"
                    size="sm"
                    className="bg-terracotta border-terracotta-dark/40 hover:bg-terracotta-dark"
                    onClick={() => handleReview(false)}
                  >
                    忘了
                  </VintageButton>
                </div>
              ) : (
                <p className="text-xs text-sage-dark font-serif text-center mt-3">
                  已记录复习结果
                </p>
              )}
            </PaperCard>
          </div>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   全部卡片列表中的单行卡片
   ═══════════════════════════════════════════════════════ */

interface CardRowProps {
  card: MemoryCard;
  kpName: string;
}

function CardRow({ card, kpName }: CardRowProps) {
  const removeMemoryCard = useAppStore((s) => s.removeMemoryCard);
  const { addToast } = useToastStore();
  const [expanded, setExpanded] = useState(false);

  const handleRemove = () => {
    removeMemoryCard(card.id);
    addToast('info', '已移除卡片');
  };

  return (
    <li className="rounded-paper border border-ink-600/10 bg-paper-100/40 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <VintageTag color={card.isMastered ? 'green' : 'seal'}>
              {card.isMastered ? '已掌握' : '待复习'}
            </VintageTag>
            {kpName && <VintageTag color="gold">{kpName}</VintageTag>}
            <VintageTag color="worn">下次：{card.nextReviewDate}</VintageTag>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="block w-full text-left"
          >
            <div className="font-serif text-sm text-ink-900 leading-relaxed">
              <span className="text-ink-500">问：</span><MathText>{card.front}</MathText>
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="font-serif text-sm text-ink-700 leading-relaxed mt-1.5">
                    <span className="text-sage-dark">答：</span><MathText>{card.back}</MathText>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          title="移除卡片"
          className="flex-shrink-0 p-1.5 rounded-paper text-ink-500 hover:bg-terracotta/10 hover:text-terracotta-dark transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function MemoryCards() {
  const memoryCards = useAppStore((s) => s.memoryCards);
  const knowledgePoints = useAppStore((s) => s.knowledgePoints);
  const studyProgress = useAppStore((s) => s.studyProgress);
  const addMemoryCards = useAppStore((s) => s.addMemoryCards);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { addToast } = useToastStore();

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string>('');
  const [showAllCards, setShowAllCards] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const today = useMemo(() => todayISO(), []);

  const kpNameMap = useMemo(() => {
    const m = new Map<string, string>();
    knowledgePoints.forEach((kp) => m.set(kp.id, kp.name));
    return m;
  }, [knowledgePoints]);

  /** 今日待复习：未掌握且到期 */
  const dueCards = useMemo(() => {
    return memoryCards
      .filter((c) => !c.isMastered && c.nextReviewDate <= today)
      .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
  }, [memoryCards, today]);

  const masteredCards = useMemo(
    () => memoryCards.filter((c) => c.isMastered),
    [memoryCards],
  );
  const pendingCards = useMemo(
    () => memoryCards.filter((c) => !c.isMastered),
    [memoryCards],
  );

  // 顶部统计数字递增动画
  const animatedDue = useCountUp(dueCards.length);
  const animatedMastered = useCountUp(masteredCards.length);
  const animatedTotal = useCountUp(memoryCards.length);

  const handleBackHome = useCallback(() => {
    setActiveView('dashboard');
  }, [setActiveView]);

  const generateCards = useCallback(async () => {
    if (knowledgePoints.length === 0) {
      addToast('warning', '尚无知识点，请先上传资料');
      setGenError('尚无知识点，请先在首页上传资料，由 Agent 提取知识点后再生成卡片。');
      return;
    }
    if (!isApiKeyConfigured()) {
      addToast('warning', '请先配置 AI 模型 API Key');
      setGenError('未配置 AI 模型 API Key，无法调用记忆卡片 Agent。');
      return;
    }
    const agent = getAgent('memorycard-agent');
    if (!agent) {
      addToast('error', '记忆卡片 Agent 未就绪');
      setGenError('记忆卡片 Agent 未就绪');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setGenError('');

    // 排序知识点：薄弱点优先，其次按掌握度升序
    const weakSet = new Set(studyProgress.weakPointIds);
    const sortedKps = [...knowledgePoints].sort((a, b) => {
      const aWeak = weakSet.has(a.id) ? 0 : 1;
      const bWeak = weakSet.has(b.id) ? 0 : 1;
      if (aWeak !== bWeak) return aWeak - bWeak;
      return a.mastery - b.mastery;
    });
    const weakNames = knowledgePoints
      .filter((kp) => weakSet.has(kp.id))
      .map((kp) => kp.name);

    const kpList = sortedKps
      .map((kp, i) => {
        const weak = weakSet.has(kp.id) ? '【薄弱点·优先】' : '';
        return `${i + 1}. ${weak}[id:${kp.id}] ${kp.name}（掌握度：${kp.mastery.toFixed(2)}）：${kp.description}`;
      })
      .join('\n');

    const weakBlock = weakNames.length > 0
      ? `【当前薄弱知识点（请优先为这些知识点制卡）】\n${weakNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n`
      : '';

    const input = `请基于以下知识点为「期末复习」生成记忆卡片（SM-2 间隔重复）。
${weakBlock}
【知识点列表】
${kpList}

【制卡原则】
- 优先为薄弱点生成卡片，每个知识点最多 3 张卡片
- front：问题 / 关键词提示（不超过 50 字）
- back：答案 / 解释（不超过 100 字）
- 单卡片只考一个知识点（原子化）
- knowledgePointId 必须从上方 [id:...] 中选取，不可臆造
- 公式 / 定义 / 易混淆概念优先制卡

【输出 JSON Schema】
{
  "cards": [
    { "knowledgePointId": "kp_xxx", "front": "什么是...？", "back": "..." }
  ]
}
仅输出 JSON，不要 markdown 代码块标记。`;

    try {
      const settings = loadModelSettings();
      const userMessage = compressPrompt(agent, input);
      const { content } = await callModelForTask(
        settings, 'chat', agent.systemPrompt, userMessage, controller.signal,
        { temperature: agent.temperature, maxTokens: agent.maxTokens },
      );
      if (controller.signal.aborted) return;
      const parsed = parseCardsResponse(content);
      if (parsed.length === 0) {
        addToast('error', '卡片解析失败，请重试');
        setGenError('未能从 Agent 返回内容中解析出有效卡片，请重试。');
        return;
      }
      const now = Date.now();
      const newCards: MemoryCard[] = parsed.map((p, i) => ({
        id: crypto.randomUUID(),
        knowledgePointId: p.knowledgePointId,
        front: p.front,
        back: p.back,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        isMastered: false,
        createdAt: now + i,
      }));
      addMemoryCards(newCards);
      addToast('success', `已生成 ${newCards.length} 张记忆卡片`);
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : '未知错误';
      addToast('error', `生成失败：${msg}`);
      setGenError(msg);
    } finally {
      if (!controller.signal.aborted) setGenerating(false);
    }
  }, [knowledgePoints, studyProgress.weakPointIds, addMemoryCards, addToast, today]);

  /* ── 空状态 ── */
  if (memoryCards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-5">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackHome}
            title="返回首页"
            className="inline-flex items-center justify-center w-9 h-9 rounded-paper border border-ink-600/20 bg-paper-100 text-ink-700 hover:bg-paper-200 hover:text-seal transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-handwritten text-sm text-ink-500 leading-none">间隔重复 · 长期记忆</p>
            <h1 className="font-serif text-xl sm:text-2xl text-ink-900 font-bold tracking-wide leading-tight">记忆卡片</h1>
          </div>
        </header>

        <PaperCard status="default" className="p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="text-center space-y-4">
            <motion.span
              className="text-5xl block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >🃏</motion.span>
            <p className="font-handwritten text-2xl text-ink-700">还没有记忆卡片，点击生成</p>
            <p className="text-sm text-ink-500 font-sans max-w-md mx-auto">
              记忆卡片 Agent 会基于知识点（薄弱点优先）生成 SM-2 间隔重复卡片，每日到期自动出现在「今日待复习」中。
            </p>
            {genError && (
              <div className="rounded-paper border border-terracotta/25 bg-terracotta/5 px-3 py-2 max-w-md mx-auto text-left">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} className="text-terracotta-dark flex-shrink-0" />
                  <p className="text-sm text-terracotta-dark font-serif">{genError}</p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <VintageButton
                variant="primary"
                size="lg"
                disabled={generating}
                onClick={() => void generateCards()}
              >
                {generating ? '生成中...' : '生成卡片'}
                {!generating && <Plus size={16} className="ml-1.5" />}
              </VintageButton>
              <VintageButton variant="ghost" size="lg" onClick={handleBackHome}>
                <Home size={16} className="mr-1.5" /> 返回首页
              </VintageButton>
            </div>
            {generating && (
              <div className="pt-2">
                <PaperSpinner text="记忆卡片 Agent 正在生成卡片..." />
              </div>
            )}
          </div>
        </PaperCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-5">
      {/* 1. 页头 */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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
            <p className="font-handwritten text-sm text-ink-500 leading-none">间隔重复 · 长期记忆</p>
            <h1 className="font-serif text-xl sm:text-2xl text-ink-900 font-bold tracking-wide leading-tight">记忆卡片</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VintageTag color="seal">今日待复习 {animatedDue}</VintageTag>
          <VintageTag color="green">已掌握 {animatedMastered}</VintageTag>
          <VintageTag color="ink">总卡片 {animatedTotal}</VintageTag>
          <VintageButton
            variant="primary"
            size="sm"
            disabled={generating || knowledgePoints.length === 0}
            onClick={() => void generateCards()}
          >
            <Plus size={13} className="mr-1" />
            {generating ? '生成中...' : '生成卡片'}
          </VintageButton>
        </div>
      </header>

      {/* 2. 生成中 / 错误提示 */}
      {generating && (
        <PaperCard status="active" className="p-4">
          <PaperSpinner text="记忆卡片 Agent 正在生成卡片..." />
        </PaperCard>
      )}
      {genError && !generating && (
        <PaperCard status="default" className="p-4">
          <div className="rounded-paper border border-terracotta/25 bg-terracotta/5 px-3 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertCircle size={15} className="text-terracotta-dark" />
              <p className="font-serif text-sm text-terracotta-dark font-bold">生成失败</p>
            </div>
            <p className="text-sm text-ink-700 font-sans mb-3">{genError}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <VintageButton variant="primary" size="sm" onClick={() => void generateCards()}>
                <RefreshCw size={13} className="mr-1" /> 重试
              </VintageButton>
              <VintageButton variant="ghost" size="sm" onClick={handleBackHome}>
                <Home size={13} className="mr-1" /> 返回首页
              </VintageButton>
            </div>
          </div>
        </PaperCard>
      )}

      {/* 3. 今日待复习 */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
            <Layers size={16} className="text-seal" />
            今日待复习
          </h2>
          <span className="text-xs text-ink-500 font-sans">{dueCards.length} 张到期</span>
        </div>
        {dueCards.length === 0 ? (
          <PaperCard status="default" className="p-6">
            <div className="text-center space-y-1">
              <motion.span
                className="text-2xl sm:text-3xl block"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >🎉</motion.span>
              <p className="font-serif text-sm text-ink-700">
                今日无待复习卡片，已全部掌握或未到期
              </p>
            </div>
          </PaperCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {dueCards.map((c, i) => (
                <FlashCardView
                  key={c.id}
                  card={c}
                  kpName={kpNameMap.get(c.knowledgePointId) ?? ''}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 4. 全部卡片（默认折叠） */}
      <section>
        <button
          type="button"
          onClick={() => setShowAllCards((v) => !v)}
          className="w-full flex items-center justify-between px-1 py-1 group"
        >
          <h2 className="font-serif text-lg text-ink-900 font-bold flex items-center gap-2">
            <BookOpen size={16} className="text-ink-600" />
            全部卡片
            <span className="text-xs text-ink-500 font-sans">({memoryCards.length})</span>
          </h2>
          <span className="inline-flex items-center text-sm text-seal font-serif group-hover:underline">
            {showAllCards ? '收起' : '展开'}
            {showAllCards ? <ChevronUp size={14} className="ml-0.5" /> : <ChevronDown size={14} className="ml-0.5" />}
          </span>
        </button>

        {showAllCards && (
          <div className="mt-3 space-y-4">
            {/* 待复习组 */}
            <div>
              <p className="font-serif text-sm text-ink-700 mb-2 flex items-center gap-1.5">
                <VintageTag color="seal">待复习</VintageTag>
                <span className="text-xs text-ink-500 font-sans">{pendingCards.length} 张</span>
              </p>
              {pendingCards.length === 0 ? (
                <p className="font-serif text-xs text-ink-500 italic px-2">暂无</p>
              ) : (
                <ul className="space-y-2">
                  {pendingCards.map((c) => (
                    <CardRow
                      key={c.id}
                      card={c}
                      kpName={kpNameMap.get(c.knowledgePointId) ?? ''}
                    />
                  ))}
                </ul>
              )}
            </div>
            {/* 已掌握组 */}
            <div>
              <p className="font-serif text-sm text-ink-700 mb-2 flex items-center gap-1.5">
                <VintageTag color="green">已掌握</VintageTag>
                <span className="text-xs text-ink-500 font-sans">{masteredCards.length} 张</span>
              </p>
              {masteredCards.length === 0 ? (
                <p className="font-serif text-xs text-ink-500 italic px-2">暂无</p>
              ) : (
                <ul className="space-y-2">
                  {masteredCards.map((c) => (
                    <CardRow
                      key={c.id}
                      card={c}
                      kpName={kpNameMap.get(c.knowledgePointId) ?? ''}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
