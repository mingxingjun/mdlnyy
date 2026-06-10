import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Brain,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

/* ------------------------------------------------------------------ */
/*  Mock data for mind map & exam points (shown after "upload")       */
/* ------------------------------------------------------------------ */

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

const mockMindMap: MindMapNode = {
  id: 'root',
  label: '高等数学下',
  children: [
    {
      id: 'c1',
      label: '多元函数微分',
      children: [
        { id: 'c1-1', label: '偏导数与全微分' },
        { id: 'c1-2', label: '方向导数与梯度' },
        { id: 'c1-3', label: '极值与条件极值' },
      ],
    },
    {
      id: 'c2',
      label: '重积分',
      children: [
        { id: 'c2-1', label: '二重积分' },
        { id: 'c2-2', label: '三重积分' },
      ],
    },
    {
      id: 'c3',
      label: '曲线曲面积分',
      children: [
        { id: 'c3-1', label: '格林公式' },
        { id: 'c3-2', label: '高斯公式' },
        { id: 'c3-3', label: '斯托克斯公式' },
      ],
    },
    {
      id: 'c4',
      label: '级数',
      children: [
        { id: 'c4-1', label: '常数项级数' },
        { id: 'c4-2', label: '幂级数' },
        { id: 'c4-3', label: '傅里叶级数' },
      ],
    },
  ],
};

interface ExamPoint {
  id: string;
  text: string;
  plain: string;
  checked: boolean;
}

const mockExamPoints: ExamPoint[] = [
  { id: 'ep1', text: '泰勒公式展开及余项估计', plain: '就是用多项式去"模仿"复杂函数，余项告诉你模仿得差多少', checked: false },
  { id: 'ep2', text: '格林公式与路径无关条件', plain: '绕一圈积分为零，说明你走哪条路结果都一样', checked: false },
  { id: 'ep3', text: '多元函数极值的充分条件', plain: '算 AC-B² 就行：大于0看A正负，小于0是鞍点', checked: false },
  { id: 'ep4', text: '二重积分的极坐标变换', plain: '圆对称的问题换成极坐标，积分区域变简单', checked: false },
  { id: 'ep5', text: '高斯公式的散度意义', plain: '流出一个封闭曲面的总量等于里面"源"的强度之和', checked: false },
  { id: 'ep6', text: '斯托克斯公式联系曲线与曲面积分', plain: '格林公式的3D升级版，把面上的积分变成边上的积分', checked: false },
  { id: 'ep7', text: '幂级数的收敛半径求法', plain: '用比值法或根值法，算出来就是收敛的边界', checked: false },
  { id: 'ep8', text: '傅里叶级数的奇偶延拓', plain: '奇函数只有正弦项，偶函数只有余弦项，延拓让你处理任意区间', checked: false },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Mind map tree node */
function MindMapTreeNode({
  node,
  depth = 0,
}: {
  node: MindMapNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = depth === 0;

  const colors = [
    'text-neon-purple border-neon-purple/30',
    'text-neon-blue border-neon-blue/30',
    'text-neon-green border-neon-green/30',
    'text-neon-pink border-neon-pink/30',
  ];
  const colorClass = colors[depth % colors.length];

  const glowColors = [
    'shadow-[0_0_12px_rgba(139,92,246,0.25)]',
    'shadow-[0_0_12px_rgba(0,212,255,0.25)]',
    'shadow-[0_0_12px_rgba(0,255,136,0.25)]',
    'shadow-[0_0_12px_rgba(255,0,128,0.25)]',
  ];
  const glowClass = glowColors[depth % glowColors.length];

  return (
    <div className="flex flex-col items-start">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.08 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer select-none
          ${isRoot ? 'text-base font-semibold px-4 py-2' : 'text-sm'}
          ${colorClass} ${glowClass}
          bg-dark-700/60 hover:bg-dark-600/60`}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} className="opacity-60 flex-shrink-0" />
          ) : (
            <ChevronRightIcon size={14} className="opacity-60 flex-shrink-0" />
          )
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        <span>{node.label}</span>
      </motion.button>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-5 overflow-hidden border-l border-white/10 pl-3 mt-1 space-y-1"
          >
            {node.children!.map((child) => (
              <MindMapTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AIEngine() {
  const { flashCards, setFlashCardMastered } = useAppStore();

  /* upload state */
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  /* flashcard state */
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  /* exam points state */
  const [examPoints, setExamPoints] = useState(mockExamPoints);

  /* derived */
  const currentCard = flashCards[cardIndex];
  const masteredCount = flashCards.filter((c) => c.mastered).length;

  /* handlers */
  const handleUpload = useCallback(() => {
    if (uploaded || processing) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setUploaded(true);
    }, 1500);
  }, [uploaded, processing]);

  const handlePrev = () => {
    setFlipped(false);
    setCardIndex((i) => (i - 1 + flashCards.length) % flashCards.length);
  };
  const handleNext = () => {
    setFlipped(false);
    setCardIndex((i) => (i + 1) % flashCards.length);
  };
  const handleMastered = (mastered: boolean) => {
    if (currentCard) {
      setFlashCardMastered(currentCard.id, mastered);
    }
    handleNext();
  };

  const toggleExamPoint = (id: string) => {
    setExamPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)),
    );
  };

  /* ---- render ---- */
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-neon-purple">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">AI 冲刺核</h1>
          <p className="text-xs text-zinc-500">上传教材，AI 自动提取考点、生成思维导图与闪卡</p>
        </div>
      </motion.div>

      {/* ========== 1. 文件上传区 ========== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          onClick={handleUpload}
          className={`glass-card relative overflow-hidden cursor-pointer transition-all duration-300
            ${!uploaded && !processing ? 'neon-border-blue hover:shadow-neon-blue' : ''}
            ${uploaded ? 'neon-border-green' : ''}
          `}
        >
          {!uploaded && !processing && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center">
                <Upload size={28} className="neon-text-blue" />
              </div>
              <div className="text-center">
                <p className="text-zinc-300 font-medium font-body">
                  拖入课程 PPT 或教材，AI 自动提取考点
                </p>
                <p className="text-xs text-zinc-600 mt-1">支持 PDF / PPTX / DOCX / 图片</p>
              </div>
              <div className="border-2 border-dashed border-neon-blue/30 rounded-xl px-8 py-3 mt-2">
                <span className="neon-text-blue text-sm font-medium">点击模拟上传</span>
              </div>
            </div>
          )}

          {processing && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <Loader2 size={36} className="text-neon-blue animate-spin" />
              <p className="neon-text-blue text-sm font-medium font-body">AI 正在解析文档，提取考点…</p>
              <div className="w-48 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                />
              </div>
            </div>
          )}

          {uploaded && (
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                <FileText size={22} className="neon-text-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 font-medium font-body truncate">高等数学下_期末复习讲义.pdf</p>
                <p className="text-xs text-zinc-500 mt-0.5">已提取 8 个核心考点 · 12 张闪卡 · 1 张思维导图</p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="neon-text-green" />
                <span className="neon-text-green text-sm font-medium">解析完成</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ========== 2-col grid: Mind Map + Flashcards ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========== 2. 思维导图 ========== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: uploaded ? 0.15 : 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="neon-text-purple" />
            <h2 className="font-display font-semibold text-white text-lg">思维导图</h2>
          </div>

          {!uploaded ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Brain size={40} className="opacity-30 mb-3" />
              <p className="text-sm">上传文档后自动生成思维导图</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[420px] pr-2">
              <MindMapTreeNode node={mockMindMap} />
            </div>
          )}
        </motion.div>

        {/* ========== 3. 闪卡模式 ========== */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: uploaded ? 0.2 : 0.25 }}
          className="glass-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="neon-text-blue" />
              <h2 className="font-display font-semibold text-white text-lg">闪卡模式</h2>
            </div>
            <span className="text-xs text-zinc-500 font-body">
              已掌握 {masteredCount}/{flashCards.length}
            </span>
          </div>

          {/* Card */}
          <div className="flex-1 flex items-center justify-center min-h-[240px]">
            <div
              className="w-full max-w-sm cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => setFlipped(!flipped)}
            >
              <div
                className={`flash-card-inner relative w-full ${flipped ? 'flipped' : ''}`}
                style={{ minHeight: 200 }}
              >
                {/* Front */}
                <div className="flash-card-front absolute inset-0 rounded-2xl neon-border-purple bg-dark-700/80 p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">问题</span>
                  <p className="text-zinc-200 font-body text-base leading-relaxed">
                    {currentCard?.front}
                  </p>
                  <span className="text-[10px] text-zinc-600 mt-4">点击翻转查看答案</span>
                </div>
                {/* Back */}
                <div className="flash-card-back absolute inset-0 rounded-2xl neon-border-green bg-dark-700/80 p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">答案</span>
                  <p className="neon-text-green font-body text-sm leading-relaxed">
                    {currentCard?.back}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMastered(false)}
                className="neon-btn neon-btn-blue flex items-center gap-1.5 text-xs"
              >
                <X size={14} />
                未掌握
              </button>
              <span className="text-xs text-zinc-500 font-body min-w-[40px] text-center">
                {cardIndex + 1}/{flashCards.length}
              </span>
              <button
                onClick={() => handleMastered(true)}
                className="neon-btn neon-btn-green flex items-center gap-1.5 text-xs"
              >
                <Check size={14} />
                已掌握
              </button>
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ========== 4. 考点清单 ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: uploaded ? 0.25 : 0.3 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={18} className="neon-text-blue" />
          <h2 className="font-display font-semibold text-white text-lg">考点清单</h2>
          {uploaded && (
            <span className="ml-auto text-xs text-zinc-500 font-body">
              {examPoints.filter((p) => p.checked).length}/{examPoints.length} 已复习
            </span>
          )}
        </div>

        {!uploaded ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <ListChecks size={40} className="opacity-30 mb-3" />
            <p className="text-sm">上传文档后自动生成考点清单</p>
          </div>
        ) : (
          <div className="space-y-2">
            {examPoints.map((point, idx) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleExamPoint(point.id)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                  ${point.checked ? 'bg-neon-green/5 border border-neon-green/20' : 'bg-dark-700/40 border border-transparent hover:bg-dark-600/40'}
                `}
              >
                {/* Checkbox */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200
                    ${point.checked
                      ? 'bg-neon-green/20 border-neon-green/60 shadow-[0_0_8px_rgba(0,255,136,0.3)]'
                      : 'border-zinc-600 hover:border-neon-blue/50'
                    }
                  `}
                >
                  {point.checked && <Check size={12} className="text-neon-green" />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body transition-colors duration-200 ${point.checked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-blue mr-2 shadow-[0_0_6px_rgba(0,212,255,0.5)]" />
                    {point.text}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1 pl-4 font-body">
                    💡 {point.plain}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
