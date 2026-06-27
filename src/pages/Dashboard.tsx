import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Trash2, Loader2, Clock, RefreshCw,
  AlertCircle, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { StudyMaterial, KnowledgePoint } from '@/store/useAppStore';
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

interface RawKnowledgePoint {
  name?: unknown;
  description?: unknown;
  priority?: unknown;
  tags?: unknown;
}

/** 从 LLM 返回内容中解析知识点 JSON，容错处理代码块与多余文本 */
function parseKnowledgePointsResponse(content: string, materialId: string): KnowledgePoint[] {
  let cleaned = content.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    cleaned = fence[1].trim();
  } else if (!cleaned.startsWith('{')) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (typeof parsed !== 'object' || parsed === null) return [];
  const rawPoints = (parsed as { knowledgePoints?: unknown }).knowledgePoints;
  if (!Array.isArray(rawPoints)) return [];

  return rawPoints
    .filter((p): p is RawKnowledgePoint => typeof p === 'object' && p !== null)
    .map((p) => {
      const priorityRaw = typeof p.priority === 'number' ? p.priority : 3;
      const priority = Math.max(1, Math.min(5, Math.round(priorityRaw)));
      const tagsRaw = Array.isArray(p.tags)
        ? p.tags.filter((t) => typeof t === 'string' || typeof t === 'number')
        : [];
      return {
        id: crypto.randomUUID(),
        materialId,
        name: String(typeof p.name === 'string' ? p.name : '未命名知识点').slice(0, 60),
        description: String(typeof p.description === 'string' ? p.description : '').slice(0, 240),
        priority,
        mastery: 0,
        relatedIds: [],
        tags: tagsRaw.map((t) => String(t)).slice(0, 4),
        createdAt: Date.now(),
      } satisfies KnowledgePoint;
    });
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
    addKnowledgePoints, setLearningState, learningState,
  } = useAppStore();
  const { addToast } = useToastStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = async (file: File) => {
    if (isParsing) return;

    // 1. 创建资料条目，状态置为 parsing
    const id = crypto.randomUUID();
    const material: StudyMaterial = {
      id,
      name: file.name,
      type: detectMaterialType(file),
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
      addToast('warning', '文件内容过少，无法提取知识点');
      setIsParsing(false);
      return;
    }

    // 3. 检查 API Key 是否已配置
    if (!isApiKeyConfigured()) {
      updateMaterial(id, { status: 'pending', parsedText });
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      setIsParsing(false);
      return;
    }

    // 4. 调用 LLM 提取知识点
    try {
      const settings = loadModelSettings();
      const userPrompt = `请从以下学习资料中提取知识点 JSON：

【资料名称】${file.name}

【资料内容】
${parsedText.slice(0, 6000)}`;
      const { content } = await callModelForTask(
        settings,
        'doc_parse',
        KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
      );
      const points = parseKnowledgePointsResponse(content, id);

      updateMaterial(id, { status: 'parsed', parsedText });

      if (points.length === 0) {
        addToast('info', '资料已上传，但未提取到知识点');
      } else {
        addKnowledgePoints(points);
        // 仅在尚未到达 KnowledgeReady 时推进状态，避免覆盖更靠后的状态
        if (learningState === 'Onboarded' || learningState === 'MaterialReady') {
          setLearningState('KnowledgeReady');
        }
        addToast('success', `成功提取 ${points.length} 个知识点`);
      }
    } catch (err) {
      updateMaterial(id, { status: 'pending', parsedText });
      addToast('error', `知识点提取失败：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsParsing(false);
    }
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
    if (!isApiKeyConfigured()) {
      addToast('warning', '请先在设置中配置 AI 模型 API Key');
      return;
    }
    setIsParsing(true);
    updateMaterial(material.id, { status: 'parsing' });
    try {
      const settings = loadModelSettings();
      const userPrompt = `请从以下学习资料中提取知识点 JSON：

【资料名称】${material.name}

【资料内容】
${material.parsedText.slice(0, 6000)}`;
      const { content } = await callModelForTask(
        settings,
        'doc_parse',
        KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
      );
      const points = parseKnowledgePointsResponse(content, material.id);
      updateMaterial(material.id, { status: 'parsed' });
      if (points.length === 0) {
        addToast('info', '资料已解析，但未提取到知识点');
      } else {
        addKnowledgePoints(points);
        if (learningState === 'Onboarded' || learningState === 'MaterialReady') {
          setLearningState('KnowledgeReady');
        }
        addToast('success', `成功提取 ${points.length} 个知识点`);
      }
    } catch (err) {
      updateMaterial(material.id, { status: 'failed' });
      addToast('error', `知识点提取失败：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsParsing(false);
    }
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
            <p className="text-xs text-ink-500 font-sans">上传复习资料，由 Agent 提取知识点</p>
          </div>
        </div>
        <VintageTag color="seal">进行中</VintageTag>
      </div>

      {/* 拖拽 / 点击上传区 */}
      <div
        role="button"
        tabIndex={0}
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx,.doc"
          className="hidden"
          onChange={handleInputChange}
        />
        <motion.div
          animate={isDragOver ? { y: -2 } : { y: 0 }}
          className="flex flex-col items-center gap-1.5"
        >
          <Upload size={22} className="text-ink-600" />
          <p className="font-serif text-sm text-ink-800">
            拖拽文件到此处，或<span className="text-seal font-semibold">点击选择</span>
          </p>
          <p className="text-xs text-ink-500 font-sans">支持 TXT / MD / PDF / DOCX（PDF 与 Word 暂仅支持纯文本提取）</p>
        </motion.div>
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
  const typeIcon = material.type === 'pdf' ? '📄' : material.type === 'word' ? '📝' : material.type === 'markdown' ? '📑' : '📃';

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
