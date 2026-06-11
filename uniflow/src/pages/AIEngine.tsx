import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Upload,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Check,
  X,
  FileText,
  Loader2,
  Sparkles,
  RotateCcw,
  Search,
  MessageSquare,
  BookOpen,
  Zap,
  Tag,
  BarChart3,
  Bot,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

/* ================================================================== */
/*  Mock Data                                                          */
/* ================================================================== */

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
  concept: string;
  plain: string;
  subjectId: string;
  detail: string;
}

const mockExamPoints: ExamPoint[] = [
  { id: 'ep1', concept: '泰勒公式展开及余项估计', plain: '用多项式去"模仿"复杂函数，余项告诉你模仿得差多少', subjectId: '1', detail: '泰勒公式将函数在某点展开为多项式，拉格朗日余项和佩亚诺余项是两种常见估计方式。常用于极限计算、近似计算和不等式证明。' },
  { id: 'ep2', concept: '格林公式与路径无关条件', plain: '绕一圈积分为零，说明你走哪条路结果都一样', subjectId: '1', detail: '格林公式将平面闭区域上的二重积分与边界曲线积分互化。当∂Q/∂x=∂P/∂y时，曲线积分与路径无关，只与起终点有关。' },
  { id: 'ep3', concept: '多元函数极值的充分条件', plain: '算AC-B²就行：大于0看A正负，小于0是鞍点', subjectId: '1', detail: '令f在(x₀,y₀)的偏导为零，记A=fxx, B=fxy, C=fyy。AC-B²>0且A<0为极大值，A>0为极小值；AC-B²<0为鞍点。' },
  { id: 'ep4', concept: '二重积分的极坐标变换', plain: '圆对称的问题换成极坐标，积分区域变简单', subjectId: '1', detail: '当积分区域为圆域或扇形时，令x=r cosθ, y=r sinθ，dxdy=r drdθ，可将复杂区域化为矩形区域。' },
  { id: 'ep5', concept: '高斯公式的散度意义', plain: '流出一个封闭曲面的总量等于里面"源"的强度之和', subjectId: '1', detail: '高斯公式将闭曲面上的曲面积分转化为所围区域上的三重积分，散度div F表示场中每一点的"源"或"汇"的强度。' },
  { id: 'ep6', concept: '斯托克斯公式', plain: '格林公式的3D升级版，把面上的积分变成边上的积分', subjectId: '1', detail: '斯托克斯公式将空间曲面上的曲面积分与边界曲线上的曲线积分联系起来，是格林公式在三维空间的推广。' },
  { id: 'ep7', concept: '幂级数的收敛半径', plain: '用比值法或根值法，算出来就是收敛的边界', subjectId: '1', detail: '收敛半径R=1/limsup|aₙ|^(1/n)，或用比值法R=lim|aₙ/aₙ₊₁|。收敛区间端点需单独判断。' },
  { id: 'ep8', concept: '傅里叶级数的奇偶延拓', plain: '奇函数只有正弦项，偶函数只有余弦项', subjectId: '1', detail: '奇延拓只含正弦项，偶延拓只含余弦项。通过延拓可将定义在有限区间上的函数展开为傅里叶级数。' },
  { id: 'ep9', concept: '矩阵可逆的充要条件', plain: '行列式不为零就行，等价说法有一堆', subjectId: '3', detail: '矩阵可逆⇔|A|≠0⇔满秩⇔特征值均非零⇔行/列向量线性无关⇔Ax=0只有零解。' },
  { id: 'ep10', concept: '特征值与特征向量', plain: '变换后方向不变的向量，特征值是伸缩比例', subjectId: '3', detail: 'Ax=λx，特征向量是矩阵变换后方向不变（或反向）的非零向量，特征值是伸缩比例。不同特征值对应的特征向量线性无关。' },
  { id: 'ep11', concept: '二次型的标准形', plain: '把二次型化成只有平方项的形式，用正交变换或配方法', subjectId: '3', detail: '二次型f=xᵀAx可通过正交变换化为标准形λ₁y₁²+λ₂y₂²+...+λₙyₙ²，其中λᵢ为A的特征值。' },
  { id: 'ep12', concept: '大数定律', plain: '试验次数够多，频率就接近概率', subjectId: '5', detail: '大数定律表明，当独立试验次数n→∞时，事件发生的频率依概率收敛于其概率。辛钦大数定律要求独立同分布且期望存在。' },
  { id: 'ep13', concept: '中心极限定理', plain: '大量随机变量之和近似正态分布，不管原来啥分布', subjectId: '5', detail: '独立同分布随机变量之和经标准化后依分布收敛于标准正态分布，这是统计推断的理论基础。' },
  { id: 'ep14', concept: 'AVL树与红黑树', plain: 'AVL严格平衡查找快，红黑树近似平衡插入快', subjectId: '4', detail: 'AVL树任意节点左右子树高度差≤1，查找O(logn)但调整频繁；红黑树通过着色规则近似平衡，插入删除最多3次旋转。' },
  { id: 'ep15', concept: '动态规划的核心思想', plain: '大问题拆小问题，记住算过的别重复算', subjectId: '4', detail: '动态规划将问题分解为重叠子问题，通过记忆化或递推避免重复计算。关键：最优子结构、无后效性、状态转移方程。' },
  { id: 'ep16', concept: '麦克斯韦方程组', plain: '电生磁、磁生电，四个方程描述一切电磁现象', subjectId: '2', detail: '麦克斯韦方程组包含高斯电定律、高斯磁定律、法拉第定律和安培-麦克斯韦定律，统一描述电磁场。' },
];

/* AI Chat mock responses */
const quickPrompts = [
  '帮我总结高数下的重点',
  '解释格林公式',
  '线性代数怎么复习',
  '概率论重点题型',
];

const aiResponses: Record<string, string> = {
  '帮我总结高数下的重点':
    '高数下的核心重点可以分为四大板块：\n\n1️⃣ **多元函数微分**：偏导数、全微分、方向导数与梯度、极值与条件极值（拉格朗日乘数法是必考题）\n\n2️⃣ **重积分**：二重积分（直角坐标+极坐标）、三重积分（柱坐标+球坐标），重点在积分限的确定和坐标变换\n\n3️⃣ **曲线曲面积分**：格林公式、高斯公式、斯托克斯公式是三大核心，路径无关条件也是高频考点\n\n4️⃣ **级数**：常数项级数判敛、幂级数收敛域、傅里叶级数展开\n\n💡 建议复习顺序：微分→积分→公式→级数，每个板块先搞懂概念再刷题！',
  '解释格林公式':
    '格林公式是连接"区域内部"和"区域边界"的桥梁：\n\n📐 **公式**：∮(Pdx + Qdy) = ∬(∂Q/∂x - ∂P/∂y)dA\n\n🎯 **大白话**：在平面区域里算一个二重积分，等于沿着边界走一圈的曲线积分。\n\n🔑 **关键应用**：\n- 计算复杂曲线积分 → 转化为简单的二重积分\n- 判断曲线积分与路径无关：∂Q/∂x = ∂P/∂y\n- 求平面区域面积：A = ½∮(xdy - ydx)\n\n⚠️ **注意**：使用条件是区域要有正向边界，P和Q要有连续偏导数！',
  '线性代数怎么复习':
    '线代复习建议按这个路线走：\n\n📖 **第一周：基础概念**\n- 行列式计算（展开法+性质）\n- 矩阵运算（乘法、逆、转置）\n- 线性方程组（解的结构）\n\n📖 **第二周：核心理论**\n- 向量组的线性相关性\n- 秩的概念与计算\n- 特征值与特征向量（必考大题！）\n\n📖 **第三周：综合应用**\n- 二次型化标准形\n- 正交矩阵与正交变换\n- 综合题训练\n\n💡 **复习技巧**：\n1. 线代知识点高度关联，一定要理解内在联系\n2. 特征值是核心中的核心，几乎每年都考\n3. 多做真题，线代题型相对固定，刷题性价比高',
  '概率论重点题型':
    '概率论重点题型归纳：\n\n📊 **一、概率计算**\n- 古典概型与条件概率\n- 全概率公式与贝叶斯公式\n- 事件的独立性判断\n\n📊 **二、随机变量**\n- 离散型：分布律、期望、方差\n- 连续型：密度函数、分布函数、期望方差\n- 常见分布：正态、泊松、指数、均匀\n\n📊 **三、多维随机变量**\n- 联合分布与边缘分布\n- 独立性判断\n- 协方差与相关系数\n\n📊 **四、大数定律与中心极限定理**\n- 切比雪夫不等式\n- 大数定律的应用\n- 中心极限定理近似计算\n\n📊 **五、参数估计**\n- 矩估计法\n- 最大似然估计\n- 估计量的评价（无偏性最常考）\n\n💡 重点在二、三、五，占分约70%！',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, value] of Object.entries(aiResponses)) {
    if (lower.includes(key) || key.includes(lower) || lower.includes(key.slice(0, 4))) {
      return value;
    }
  }
  // Generic fallback response
  if (lower.includes('积分') || lower.includes('重积分')) {
    return '关于积分的问题，重点掌握以下内容：\n\n1. 二重积分的直角坐标和极坐标计算\n2. 三重积分的柱坐标和球坐标变换\n3. 格林公式、高斯公式、斯托克斯公式的应用\n\n建议先搞清楚积分区域的确定方法，再练习坐标变换。积分限的确定是很多同学的痛点，建议画图辅助理解！';
  }
  if (lower.includes('矩阵') || lower.includes('行列式')) {
    return '矩阵和行列式是线代的基础：\n\n1. 行列式：展开定理、性质化简\n2. 矩阵运算：乘法规则、逆矩阵求法\n3. 秩：初等变换求秩\n\n关键要理解行列式是一个"数"，而矩阵是一个"表"。行列式为0意味着矩阵不可逆，这是很多题的出发点！';
  }
  if (lower.includes('复习') || lower.includes('怎么学') || lower.includes('方法')) {
    return '高效复习建议：\n\n1. 📋 先梳理知识框架，建立知识树\n2. 🎯 抓重点，优先复习高频考点\n3. ✍️ 做真题，至少近5年\n4. 🔄 错题复盘，找到薄弱点\n5. ⏰ 合理安排时间，每天2-3小时专注复习\n\n记住：理解>记忆>刷题，不要本末倒置！';
  }
  return `这是一个很好的问题！让我帮你分析一下：\n\n根据你的提问，我建议从以下几个方面入手：\n\n1. 先回顾课本上的基础概念和定义\n2. 找到这个知识点与已学内容的联系\n3. 通过典型例题加深理解\n4. 做几道相关真题检验掌握程度\n\n如果你想了解更具体的内容，可以告诉我你正在复习哪个科目，我可以给出更有针对性的建议！😊`;
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

/** Mind map tree node with connecting lines */
function MindMapTreeNode({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
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

  const dotColors = ['bg-neon-purple', 'bg-neon-blue', 'bg-neon-green', 'bg-neon-pink'];
  const dotColor = dotColors[depth % dotColors.length];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Connecting dot */}
        {!isRoot && (
          <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 shadow-[0_0_6px_currentColor]`} />
        )}
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
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-4 overflow-hidden pl-4 mt-1 space-y-1.5"
            style={{
              borderLeft: `2px solid rgba(139, 92, 246, ${0.2 - depth * 0.05})`,
            }}
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

/* ================================================================== */
/*  Chat Message Type                                                  */
/* ================================================================== */

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function AIEngine() {
  const { flashCards, subjects, setFlashCardMastered } = useAppStore();

  /* ─── AI Chat State ─── */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '你好！我是你的AI学习助手 🎓\n\n我可以帮你：\n- 总结各科重点和考点\n- 解释复杂概念（用大白话！）\n- 制定复习计划\n- 解题思路点拨\n\n有什么想问的，尽管开口吧！',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Document Parser State ─── */
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [docCollapsed, setDocCollapsed] = useState(false);

  /* ─── Flashcard State ─── */
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  /* ─── Quick Reference State ─── */
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPoint, setExpandedPoint] = useState<string | null>(null);

  /* ─── Derived: Flashcards ─── */
  const filteredCards =
    subjectFilter === 'all'
      ? flashCards
      : flashCards.filter((c) => c.subjectId === subjectFilter);

  const currentCard = filteredCards[cardIndex];
  const masteredCount = filteredCards.filter((c) => c.mastered).length;

  /* ─── Derived: Exam Points ─── */
  const filteredExamPoints = mockExamPoints.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  /* ─── Reset card index when filter changes ─── */
  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [subjectFilter]);

  /* ─── Chat Handlers ─── */
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput('');
      setIsTyping(true);

      // Simulate AI typing delay
      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: getAIResponse(text.trim()),
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, delay);
    },
    [isTyping],
  );

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatInput);
  };

  /* ─── Document Handlers ─── */
  const handleUpload = useCallback(() => {
    if (uploaded || processing) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setUploaded(true);
    }, 1800);
  }, [uploaded, processing]);

  /* ─── Flashcard Handlers ─── */
  const handlePrev = () => {
    setFlipped(false);
    setCardIndex((i) => (i - 1 + filteredCards.length) % filteredCards.length);
  };
  const handleNext = () => {
    setFlipped(false);
    setCardIndex((i) => (i + 1) % filteredCards.length);
  };
  const handleMastered = (mastered: boolean) => {
    if (currentCard) {
      setFlashCardMastered(currentCard.id, mastered);
    }
    handleNext();
  };
  const handleReset = () => {
    filteredCards.forEach((c) => setFlashCardMastered(c.id, false));
    setCardIndex(0);
    setFlipped(false);
  };

  /* ─── Get subject name by id ─── */
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '';
  const getSubjectColor = (id: string) => subjects.find((s) => s.id === id)?.color ?? '#8b5cf6';

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4 flex-shrink-0"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-neon-purple">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">AI 冲刺核</h1>
          <p className="text-xs text-zinc-500 font-body">AI 对话 · 文档解析 · 闪卡训练 · 考点速查</p>
        </div>
      </motion.div>

      {/* Main layout: left 60% chat, right 40% stacked modules */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0 overflow-hidden">
        {/* ========== LEFT: AI Chat (3/5 = 60%) ========== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-card flex flex-col min-h-0 overflow-hidden"
        >
          {/* Chat header */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center">
              <MessageSquare size={16} className="text-neon-purple" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white text-sm">AI 对话助手</h2>
              <p className="text-[10px] text-zinc-600 font-body">随时提问，智能解答</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-body">在线</span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
            <AnimatePresence initial={false}>
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${msg.role === 'ai'
                        ? 'bg-neon-purple/15 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                        : 'bg-neon-blue/15 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                      }`}
                  >
                    {msg.role === 'ai' ? (
                      <Bot size={16} className="text-neon-purple" />
                    ) : (
                      <User size={16} className="text-neon-blue" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed whitespace-pre-wrap
                      ${msg.role === 'ai'
                        ? 'bg-dark-600/60 border border-white/5 text-zinc-300 rounded-tl-sm'
                        : 'bg-neon-blue/10 border border-neon-blue/20 text-zinc-200 rounded-tr-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                  <Bot size={16} className="text-neon-purple" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-dark-600/60 border border-white/5">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          {chatMessages.length <= 1 && (
            <div className="px-5 pb-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + quickPrompts.indexOf(prompt) * 0.08 }}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs font-body border border-neon-purple/20 bg-neon-purple/5 text-neon-purple/80 hover:bg-neon-purple/10 hover:border-neon-purple/40 transition-all duration-200 cursor-pointer"
                  >
                    <Zap size={10} className="inline mr-1" />
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input */}
          <form
            onSubmit={handleChatSubmit}
            className="px-4 pb-4 pt-2 flex-shrink-0"
          >
            <div className="flex items-center gap-2 bg-dark-700/60 border border-white/8 rounded-xl px-4 py-2 focus-within:border-neon-purple/40 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="输入你的问题..."
                className="flex-1 bg-transparent text-sm font-body text-zinc-200 placeholder-zinc-600 outline-none"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center text-neon-purple hover:bg-neon-purple/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </motion.div>

        {/* ========== RIGHT: Stacked modules (2/5 = 40%) ========== */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          {/* ─── Document Parser ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card flex-shrink-0"
          >
            {/* Header with collapse toggle */}
            <button
              onClick={() => setDocCollapsed(!docCollapsed)}
              className="w-full flex items-center justify-between px-5 pt-4 pb-3 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neon-blue/15 flex items-center justify-center">
                  <FileText size={14} className="text-neon-blue" />
                </div>
                <h2 className="font-display font-semibold text-white text-sm">智能文档解析</h2>
              </div>
              <motion.div animate={{ rotate: docCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-zinc-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {!docCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4">
                    {/* Upload zone */}
                    {!uploaded && !processing && (
                      <div
                        onClick={handleUpload}
                        className="border-2 border-dashed border-neon-blue/20 rounded-xl py-8 flex flex-col items-center gap-3 cursor-pointer hover:border-neon-blue/40 hover:bg-neon-blue/5 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                          <Upload size={22} className="text-neon-blue" />
                        </div>
                        <p className="text-zinc-400 text-xs font-body">拖入课程 PPT 或教材，AI 自动提取考点</p>
                        <span className="text-[10px] text-zinc-600 font-body">支持 PDF / PPTX / DOCX / 图片</span>
                        <div className="mt-1 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-medium">
                          点击模拟上传
                        </div>
                      </div>
                    )}

                    {/* Processing */}
                    {processing && (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 size={28} className="text-neon-blue animate-spin" />
                        <p className="neon-text-blue text-xs font-medium font-body">AI 正在解析文档…</p>
                        <div className="w-40 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.8, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    {uploaded && (
                      <div className="space-y-3">
                        {/* File info */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neon-green/5 border border-neon-green/15">
                          <FileText size={16} className="text-neon-green flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-200 text-xs font-body truncate">高等数学下_期末复习讲义.pdf</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">已提取 8 个核心考点 · 12 张闪卡</p>
                          </div>
                          <Sparkles size={14} className="text-neon-green" />
                        </div>

                        {/* Summary */}
                        <div className="px-3 py-2.5 rounded-lg bg-dark-600/40 border border-white/5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <BookOpen size={12} className="text-neon-purple" />
                            <span className="text-[10px] text-zinc-500 font-body uppercase tracking-wider">自动摘要</span>
                          </div>
                          <p className="text-xs text-zinc-400 font-body leading-relaxed">
                            本文档涵盖高等数学下学期核心内容，包括多元函数微分学、重积分、曲线曲面积分和级数四大板块。重点在于格林公式、高斯公式和斯托克斯公式的应用，以及幂级数收敛域的求解。
                          </p>
                        </div>

                        {/* Key concepts as tags */}
                        <div className="px-3 py-2.5 rounded-lg bg-dark-600/40 border border-white/5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Tag size={12} className="text-neon-pink" />
                            <span className="text-[10px] text-zinc-500 font-body uppercase tracking-wider">核心概念</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['偏导数', '全微分', '格林公式', '高斯公式', '斯托克斯公式', '幂级数', '傅里叶级数', '极坐标变换'].map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-[10px] font-body bg-neon-purple/10 border border-neon-purple/20 text-neon-purple/80"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Difficulty */}
                        <div className="px-3 py-2.5 rounded-lg bg-dark-600/40 border border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <BarChart3 size={12} className="text-neon-yellow" />
                              <span className="text-[10px] text-zinc-500 font-body uppercase tracking-wider">难度评估</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${i <= 4 ? 'bg-neon-yellow shadow-[0_0_6px_rgba(255,214,0,0.4)]' : 'bg-dark-400'}`}
                                />
                              ))}
                              <span className="text-[10px] text-neon-yellow ml-1 font-body">4/5 较难</span>
                            </div>
                          </div>
                        </div>

                        {/* Mind map tree */}
                        <div className="px-3 py-2.5 rounded-lg bg-dark-600/40 border border-white/5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Brain size={12} className="text-neon-purple" />
                            <span className="text-[10px] text-zinc-500 font-body uppercase tracking-wider">知识结构</span>
                          </div>
                          <MindMapTreeNode node={mockMindMap} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Flashcard Training ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5 flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neon-green/15 flex items-center justify-center">
                  <Sparkles size={14} className="text-neon-green" />
                </div>
                <h2 className="font-display font-semibold text-white text-sm">闪卡训练</h2>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-neon-pink transition-colors cursor-pointer"
              >
                <RotateCcw size={10} />
                重新开始
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500 font-body">掌握进度</span>
                <span className="text-[10px] text-zinc-400 font-body">
                  {masteredCount}/{filteredCards.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full"
                  animate={{ width: filteredCards.length > 0 ? `${(masteredCount / filteredCards.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Subject filter tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => setSubjectFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-body whitespace-nowrap transition-all duration-200 cursor-pointer
                  ${subjectFilter === 'all'
                    ? 'bg-neon-purple/15 border border-neon-purple/30 text-neon-purple'
                    : 'bg-dark-600/40 border border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                全部
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectFilter(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-body whitespace-nowrap transition-all duration-200 cursor-pointer
                    ${subjectFilter === s.id
                      ? 'border text-white'
                      : 'bg-dark-600/40 border border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  style={subjectFilter === s.id ? { background: `${s.color}20`, borderColor: `${s.color}50` } : undefined}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Card */}
            {currentCard ? (
              <div className="flex items-center justify-center min-h-[180px]">
                <div
                  className="w-full max-w-xs cursor-pointer"
                  style={{ perspective: '1000px' }}
                  onClick={() => setFlipped(!flipped)}
                >
                  <div
                    className={`flash-card-inner relative w-full ${flipped ? 'flipped' : ''}`}
                    style={{ minHeight: 170 }}
                  >
                    {/* Front */}
                    <div className="flash-card-front absolute inset-0 rounded-2xl neon-border-purple bg-dark-700/80 p-5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">问题</span>
                      <p className="text-zinc-200 font-body text-sm leading-relaxed">
                        {currentCard.front}
                      </p>
                      <span className="text-[9px] text-zinc-600 mt-3">点击翻转查看答案</span>
                    </div>
                    {/* Back */}
                    <div className="flash-card-back absolute inset-0 rounded-2xl neon-border-green bg-dark-700/80 p-5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">答案</span>
                      <p className="neon-text-green font-body text-xs leading-relaxed">
                        {currentCard.back}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[180px] text-zinc-600 text-xs font-body">
                该科目暂无闪卡
              </div>
            )}

            {/* Controls */}
            {currentCard && (
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleMastered(false)}
                    className="neon-btn neon-btn-blue flex items-center gap-1 text-[10px] !py-1.5 !px-3"
                  >
                    <X size={12} />
                    未掌握
                  </button>
                  <span className="text-[10px] text-zinc-500 font-body min-w-[36px] text-center">
                    {cardIndex + 1}/{filteredCards.length}
                  </span>
                  <button
                    onClick={() => handleMastered(true)}
                    className="neon-btn neon-btn-green flex items-center gap-1 text-[10px] !py-1.5 !px-3"
                  >
                    <Check size={12} />
                    已掌握
                  </button>
                </div>

                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>

          {/* ─── Quick Reference ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5 flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-neon-yellow/15 flex items-center justify-center">
                <Zap size={14} className="text-neon-yellow" />
              </div>
              <h2 className="font-display font-semibold text-white text-sm">考点速查</h2>
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索考点..."
                className="w-full bg-dark-700/60 border border-white/8 rounded-lg pl-9 pr-3 py-2 text-xs font-body text-zinc-200 placeholder-zinc-600 outline-none focus:border-neon-blue/40 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-300"
              />
            </div>

            {/* Exam points list */}
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredExamPoints.map((point, idx) => (
                <motion.div
                  key={point.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <button
                    onClick={() => setExpandedPoint(expandedPoint === point.id ? null : point.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-dark-600/30 border border-white/5 hover:bg-dark-600/50 hover:border-white/10 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getSubjectColor(point.subjectId), boxShadow: `0 0 6px ${getSubjectColor(point.subjectId)}40` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-zinc-200 font-body truncate">{point.concept}</p>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-body flex-shrink-0"
                            style={{
                              background: `${getSubjectColor(point.subjectId)}15`,
                              color: getSubjectColor(point.subjectId),
                              border: `1px solid ${getSubjectColor(point.subjectId)}30`,
                            }}
                          >
                            {getSubjectName(point.subjectId)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-body mt-0.5 line-clamp-1">
                          💡 {point.plain}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedPoint === point.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <ChevronDown size={12} className="text-zinc-600" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedPoint === point.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-2.5 ml-3 border-l-2 border-neon-purple/20">
                          <p className="text-[11px] text-zinc-400 font-body leading-relaxed">
                            {point.detail}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {filteredExamPoints.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-xs font-body">
                  没有找到匹配的考点
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
