import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Target, Brain, FileText, ChevronDown, ChevronRight,
  ArrowRight, Sparkles, Star, Bookmark,
  Send, X, BookOpen, Lightbulb, RotateCcw,
  AlertCircle, ListChecks, Bell, HelpCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

/* ─── 动画变体 ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── 工具函数 ─── */
function getCountdown(examDate: string) {
  const now = new Date();
  const target = new Date(examDate + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, passed: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, passed: false };
}

/* ─── 模拟数据 ─── */
const agentWorkflow = [
  { name: '导入资料', color: '#6C7CFF', status: 'completed' as const, output: '已导入 3 份 PDF' },
  { name: '提取重点', color: '#7C5CFF', status: 'completed' as const, output: '提取 42 个知识点' },
  { name: '生成题库', color: '#4FD1C5', status: 'active' as const, output: '已生成 28 道题' },
  { name: '错题诊断', color: '#fbbf24', status: 'pending' as const, output: '' },
  { name: '复习计划', color: '#f87171', status: 'pending' as const, output: '' },
  { name: '强化记忆', color: '#34d399', status: 'pending' as const, output: '' },
];

const chapters = [
  { name: '第一章 极限与连续', expanded: true, children: ['数列极限', '函数极限', '连续性'] },
  { name: '第二章 导数与微分', expanded: false, children: ['导数定义', '求导法则', '微分'] },
  { name: '第三章 积分', expanded: false, children: ['不定积分', '定积分', '积分应用'] },
  { name: '第四章 微分方程', expanded: false, children: ['一阶方程', '高阶方程'] },
];

const tags = ['重点', '易错', '公式', '证明', '计算'];

const knowledgeNodes = [
  { id: 'center', label: '微积分', x: 50, y: 50, size: 'lg', color: '#6C7CFF' },
  { id: 'n1', label: '极限', x: 22, y: 25, size: 'md', color: '#7C5CFF' },
  { id: 'n2', label: '导数', x: 78, y: 25, size: 'md', color: '#4FD1C5' },
  { id: 'n3', label: '积分', x: 22, y: 75, size: 'md', color: '#fbbf24' },
  { id: 'n4', label: '微分方程', x: 78, y: 75, size: 'md', color: '#f87171' },
  { id: 'n5', label: '连续性', x: 10, y: 50, size: 'sm', color: '#8b5cf6' },
  { id: 'n6', label: '求导法则', x: 90, y: 50, size: 'sm', color: '#34d399' },
  { id: 'n7', label: '定积分', x: 38, y: 88, size: 'sm', color: '#fb923c' },
  { id: 'n8', label: '数列极限', x: 8, y: 15, size: 'sm', color: '#a78bfa' },
];

const knowledgeEdges = [
  ['center', 'n1'], ['center', 'n2'], ['center', 'n3'], ['center', 'n4'],
  ['n1', 'n5'], ['n1', 'n8'], ['n2', 'n6'], ['n3', 'n7'],
];

const quizData = {
  question: '设 f(x) 在 x=0 处可导，且 f(0)=0，则 lim(x→0) [f(x) - f(-x)] / x 等于：',
  options: [
    'A. 0',
    'B. f\'(0)',
    'C. 2f\'(0)',
    'D. 不存在',
  ],
  correctIndex: 2,
  explanation: '由导数定义，f\'(0) = lim(x→0) [f(x) - f(0)] / x = lim(x→0) f(x)/x。同理 lim(x→0) f(-x)/x = -f\'(0)。因此 lim [f(x)-f(-x)]/x = f\'(0) - (-f\'(0)) = 2f\'(0)。',
};

const timelineData = [
  { date: '6月10日', task: '高数第三章积分复习', duration: '2h', status: 'completed' as const },
  { date: '6月11日', task: '线代特征值专题', duration: '1.5h', status: 'completed' as const },
  { date: '6月12日', task: '高数微分方程 + 错题重做', duration: '2h', status: 'today' as const },
  { date: '6月13日', task: '线代二次型 + 真题模拟', duration: '2.5h', status: 'future' as const },
  { date: '6月14日', task: '高数综合模拟卷', duration: '3h', status: 'future' as const },
  { date: '6月15日', task: '全科查漏补缺', duration: '2h', status: 'future' as const },
];

const defaultTodos = [
  { id: '1', text: '复习微分方程基础概念', done: false },
  { id: '2', text: '完成积分章节练习题', done: true },
  { id: '3', text: '整理线代公式速查表', done: false },
  { id: '4', text: '重做错题本标记题目', done: false },
];

/* ─── 1. Stats Overview ─── */
function StatsOverview() {
  const { subjects, flashCards } = useAppStore();

  const todayRate = useMemo(() => {
    if (subjects.length === 0) return 68;
    const total = subjects.reduce((s, sub) => s + sub.progress, 0);
    return Math.round(total / subjects.length);
  }, [subjects]);

  const nearestDays = useMemo(() => {
    if (subjects.length === 0) return 12;
    const sorted = [...subjects].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    const cd = getCountdown(sorted[0].examDate);
    return cd.passed ? 0 : cd.days;
  }, [subjects]);

  const avgMastery = useMemo(() => {
    if (subjects.length === 0) return 54;
    const total = subjects.reduce((s, sub) => s + sub.progress, 0);
    return Math.round(total / subjects.length);
  }, [subjects]);

  const totalQuizzes = flashCards.length > 0 ? flashCards.length : 28;

  const stats = [
    {
      label: '今日完成率',
      value: `${todayRate}%`,
      icon: CheckCircle2,
      iconBg: 'bg-[#34d399]/10',
      iconColor: 'text-[#34d399]',
      trend: '+12%',
      trendUp: true,
      ring: true,
      ringValue: todayRate,
    },
    {
      label: '距期末',
      value: `${nearestDays}`,
      valueSuffix: '天',
      icon: Clock,
      iconBg: 'bg-[#6C7CFF]/10',
      iconColor: 'text-[#6C7CFF]',
      trend: '高数最近',
      trendUp: false,
      ring: false,
    },
    {
      label: '掌握度',
      value: `${avgMastery}%`,
      icon: Target,
      iconBg: 'bg-[#fbbf24]/10',
      iconColor: 'text-[#fbbf24]',
      trend: '+5%',
      trendUp: true,
      bar: true,
      barValue: avgMastery,
    },
    {
      label: '已出题',
      value: `${totalQuizzes}`,
      valueSuffix: '道',
      icon: FileText,
      iconBg: 'bg-[#7C5CFF]/10',
      iconColor: 'text-[#7C5CFF]',
      trend: '今日 +6',
      trendUp: true,
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={fadeUp}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5 transition-all hover:border-[#6C7CFF]/30 hover:shadow-[0_0_20px_rgba(108,124,255,0.08)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
            <span className={`text-[11px] font-medium ${stat.trendUp ? 'text-[#34d399]' : 'text-[#8b8fa3]'}`}>
              {stat.trend}
            </span>
          </div>

          <p className="text-[12px] text-[#8b8fa3] mb-1">{stat.label}</p>

          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-bold text-[#e8eaf0] leading-none tabular-nums">{stat.value}</span>
            {stat.valueSuffix && (
              <span className="text-[13px] text-[#5c5f73]">{stat.valueSuffix}</span>
            )}
          </div>

          {/* Ring progress */}
          {stat.ring && (
            <div className="mt-3 flex justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke="#34d399" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(stat.ringValue! / 100) * 138.2} 138.2`}
                  transform="rotate(-90 28 28)"
                  className="transition-all duration-700"
                />
              </svg>
            </div>
          )}

          {/* Bar progress */}
          {stat.bar && (
            <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${stat.barValue}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── 2. Agent Workflow ─── */
function AgentWorkflow() {
  const statusBadge = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#34d399]/10 text-[#34d399]">已完成</span>;
      case 'active':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6C7CFF]/10 text-[#6C7CFF]">进行中</span>;
      case 'pending':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#5c5f73]">待执行</span>;
    }
  };

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="mt-8"
    >
      <h2 className="text-[16px] font-semibold text-[#e8eaf0] mb-4">Agent 协作工作流</h2>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {agentWorkflow.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-4 min-w-[150px] transition-all hover:border-[#6C7CFF]/30 hover:shadow-[0_0_20px_rgba(108,124,255,0.08)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agent.color }} />
                <span className="text-[13px] font-medium text-[#e8eaf0]">{agent.name}</span>
              </div>
              <div className="mb-2">{statusBadge(agent.status)}</div>
              {agent.output && (
                <p className="text-[11px] text-[#5c5f73] leading-relaxed">{agent.output}</p>
              )}
            </motion.div>
            {i < agentWorkflow.length - 1 && (
              <ArrowRight size={14} className="text-[#5c5f73] flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── 3. Three-Column Layout ─── */

/** Left: Knowledge Navigation */
function KnowledgeNav() {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string>('数列极限');

  const toggleChapter = (idx: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="w-full lg:w-[220px] flex-shrink-0 bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
      <h3 className="text-[13px] font-semibold text-[#e8eaf0] mb-3">知识导航</h3>

      {/* Course selector */}
      <div className="relative mb-4">
        <select className="w-full appearance-none bg-[#1a1b2e] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#e8eaf0] outline-none focus:border-[#6C7CFF]/30 transition-colors">
          <option>高等数学下</option>
          <option>线性代数</option>
          <option>概率论</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5f73] pointer-events-none" />
      </div>

      {/* Chapter list */}
      <div className="space-y-1 mb-4 max-h-[200px] overflow-y-auto scrollbar-hide">
        {chapters.map((ch, idx) => (
          <div key={ch.name}>
            <button
              onClick={() => toggleChapter(idx)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[8px] text-[12px] text-[#8b8fa3] hover:bg-white/[0.04] transition-colors"
            >
              {expandedChapters.has(idx) ? (
                <ChevronDown size={12} className="text-[#5c5f73] flex-shrink-0" />
              ) : (
                <ChevronRight size={12} className="text-[#5c5f73] flex-shrink-0" />
              )}
              <span className="truncate">{ch.name}</span>
            </button>
            <AnimatePresence>
              {expandedChapters.has(idx) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {ch.children.map((child) => (
                    <button
                      key={child}
                      onClick={() => setActiveItem(child)}
                      className={`w-full text-left pl-7 pr-2 py-1.5 text-[11px] rounded-[8px] transition-colors ${
                        activeItem === child
                          ? 'border-l-2 border-[#6C7CFF] bg-[#6C7CFF]/5 text-[#e8eaf0]'
                          : 'text-[#5c5f73] hover:bg-white/[0.04]'
                      }`}
                    >
                      {child}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
              activeTag === tag
                ? 'bg-[#6C7CFF]/10 text-[#6C7CFF] border border-[#6C7CFF]/30'
                : 'bg-white/[0.04] text-[#5c5f73] border border-white/[0.06] hover:text-[#8b8fa3]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Center: Knowledge Graph */
function KnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<string>('center');

  const nodeSize = (size: string) => {
    switch (size) {
      case 'lg': return 'w-16 h-16 text-[12px]';
      case 'md': return 'w-12 h-12 text-[10px]';
      default: return 'w-9 h-9 text-[9px]';
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5 relative overflow-hidden">
      <h3 className="text-[13px] font-semibold text-[#e8eaf0] mb-3">知识图谱</h3>
      <div className="relative w-full" style={{ paddingBottom: '80%' }}>
        {/* SVG Edges */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {knowledgeEdges.map(([from, to]) => {
            const f = knowledgeNodes.find((n) => n.id === from)!;
            const t = knowledgeNodes.find((n) => n.id === to)!;
            const isActive = selectedNode === from || selectedNode === to;
            return (
              <line
                key={`${from}-${to}`}
                x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={isActive ? 'rgba(108,124,255,0.4)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isActive ? 0.5 : 0.3}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {knowledgeNodes.map((node) => (
          <motion.button
            key={node.id}
            onClick={() => setSelectedNode(node.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute rounded-full flex items-center justify-center font-medium transition-all duration-300 cursor-pointer ${nodeSize(node.size)} ${
              selectedNode === node.id
                ? 'ring-2 ring-offset-1 ring-offset-[#12131f]'
                : ''
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              background: selectedNode === node.id ? `${node.color}20` : `${node.color}10`,
              border: `1px solid ${selectedNode === node.id ? node.color : `${node.color}30`}`,
              color: node.color,
              ...(selectedNode === node.id ? { ringColor: node.color, boxShadow: `0 0 20px ${node.color}20` } : {}),
            }}
          >
            {node.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Right: Smart Panel */
function SmartPanel() {
  const [todos, setTodos] = useState(defaultTodos);
  const [quickQuestion, setQuickQuestion] = useState('');

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
      {/* AI 复习建议 */}
      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#6C7CFF]/10">
            <Sparkles size={14} className="text-[#6C7CFF]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#e8eaf0]">AI 复习建议</h3>
        </div>
        <p className="text-[12px] text-[#8b8fa3] leading-relaxed">
          根据你的错题分布，建议今天优先复习<strong className="text-[#fbbf24]">微分方程</strong>章节，该章节掌握度仅 42%，且与上次错题高度相关。
        </p>
      </div>

      {/* 今日待办 */}
      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#4FD1C5]/10">
            <ListChecks size={14} className="text-[#4FD1C5]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#e8eaf0]">今日待办</h3>
        </div>
        <div className="space-y-2">
          {todos.map((todo) => (
            <label
              key={todo.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all ${
                  todo.done
                    ? 'bg-[#34d399] border-[#34d399]'
                    : 'border border-white/[0.12] group-hover:border-[#6C7CFF]/40'
                }`}
              >
                {todo.done && <CheckCircle2 size={10} className="text-white" />}
              </button>
              <span className={`text-[12px] transition-colors ${
                todo.done ? 'text-[#5c5f73] line-through' : 'text-[#8b8fa3] group-hover:text-[#e8eaf0]'
              }`}>
                {todo.text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 考试提醒 */}
      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#f87171]/10">
            <Bell size={14} className="text-[#f87171]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#e8eaf0]">考试提醒</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8b8fa3]">高等数学下</span>
            <span className="text-[11px] font-medium text-[#f87171]">6月20日</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8b8fa3]">线性代数</span>
            <span className="text-[11px] font-medium text-[#fbbf24]">6月22日</span>
          </div>
        </div>
      </div>

      {/* 快速提问 */}
      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#7C5CFF]/10">
            <HelpCircle size={14} className="text-[#7C5CFF]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#e8eaf0]">快速提问</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder="输入你的问题..."
            className="flex-1 bg-[#1a1b2e] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#e8eaf0] placeholder-[#5c5f73] outline-none focus:border-[#6C7CFF]/30 transition-colors"
          />
          <button className="w-8 h-8 rounded-[10px] bg-[#6C7CFF]/10 flex items-center justify-center hover:bg-[#6C7CFF]/20 transition-colors">
            <Send size={14} className="text-[#6C7CFF]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Quiz Practice ─── */
function QuizPractice() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === quizData.correctIndex;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setTimeout(() => setShowExplanation(true), 400);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowExplanation(false);
  };

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="mt-8"
    >
      <h2 className="text-[16px] font-semibold text-[#e8eaf0] mb-4">智能出题练习</h2>
      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#6C7CFF]/10 text-[#6C7CFF]">高等数学</span>
            <span className="text-[11px] text-[#5c5f73]">微分方程</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStarred(!isStarred)}
              className="p-1.5 rounded-[8px] hover:bg-white/[0.04] transition-colors"
            >
              <Star size={16} className={isStarred ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-[#5c5f73]'} />
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-1.5 rounded-[8px] hover:bg-white/[0.04] transition-colors"
            >
              <Bookmark size={16} className={isBookmarked ? 'text-[#6C7CFF] fill-[#6C7CFF]' : 'text-[#5c5f73]'} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full w-[10%] rounded-full bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF]" />
          </div>
          <span className="text-[11px] text-[#5c5f73] tabular-nums">2/20</span>
        </div>

        {/* Question */}
        <p className="text-[14px] text-[#e8eaf0] leading-relaxed mb-5">{quizData.question}</p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {quizData.options.map((opt, idx) => {
            let optClass = 'border border-white/[0.08] rounded-[12px] p-3 text-[13px] text-[#8b8fa3] cursor-pointer transition-all hover:border-[#6C7CFF]/30 hover:text-[#e8eaf0]';
            if (isAnswered) {
              if (idx === quizData.correctIndex) {
                optClass = 'border border-[#34d399] bg-[#34d399]/10 rounded-[12px] p-3 text-[13px] text-[#34d399] cursor-default';
              } else if (idx === selectedOption && !isCorrect) {
                optClass = 'border border-[#f87171] bg-[#f87171]/10 rounded-[12px] p-3 text-[13px] text-[#f87171] cursor-default';
              } else {
                optClass = 'border border-white/[0.04] rounded-[12px] p-3 text-[13px] text-[#5c5f73] cursor-default opacity-50';
              }
            }
            return (
              <motion.button
                key={idx}
                onClick={() => handleSelect(idx)}
                whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                className={optClass}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* AI Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-[#1a1b2e] border border-white/[0.06] rounded-[16px] p-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-[#fbbf24]" />
                  <span className="text-[12px] font-semibold text-[#e8eaf0]">AI 解析</span>
                  {isCorrect ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34d399]/10 text-[#34d399]">回答正确</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f87171]/10 text-[#f87171]">回答错误</span>
                  )}
                </div>
                <p className="text-[12px] text-[#8b8fa3] leading-relaxed">{quizData.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom actions */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]"
          >
            <div className="flex items-center gap-4">
              <button className="text-[12px] text-[#6C7CFF] hover:text-[#7C5CFF] transition-colors flex items-center gap-1">
                <Sparkles size={12} />
                逐步提示
              </button>
              <button className="text-[12px] text-[#4FD1C5] hover:text-[#34d399] transition-colors flex items-center gap-1">
                <RotateCcw size={12} />
                生成同类题
              </button>
            </div>
            <button
              onClick={handleReset}
              className="text-[12px] text-[#8b8fa3] hover:text-[#e8eaf0] transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              下一题
            </button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ─── 5. Review Timeline ─── */
function ReviewTimeline() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-[#e8eaf0]">复习计划时间线</h2>
        <button className="text-[12px] text-[#6C7CFF] hover:text-[#7C5CFF] transition-colors flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-[#6C7CFF]/20 hover:border-[#6C7CFF]/40">
          <Sparkles size={12} />
          智能调整计划
        </button>
      </div>

      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-6">
        <div className="relative">
          {timelineData.map((item, idx) => {
            const isLast = idx === timelineData.length - 1;
            return (
              <div key={item.date + item.task} className="flex gap-4">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {item.status === 'completed' && (
                      <div className="w-3 h-3 rounded-full bg-[#34d399] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#12131f]" />
                      </div>
                    )}
                    {item.status === 'today' && (
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF]"
                        animate={{ boxShadow: ['0 0 0 0 rgba(108,124,255,0.4)', '0 0 0 6px rgba(108,124,255,0)', '0 0 0 0 rgba(108,124,255,0.4)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {item.status === 'future' && (
                      <div className="w-3 h-3 rounded-full bg-[#5c5f73]/40" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[40px] ${
                      item.status === 'completed' ? 'bg-[#34d399]/30' : 'bg-white/[0.06]'
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[11px] font-medium tabular-nums ${
                      item.status === 'completed' ? 'text-[#34d399]' :
                      item.status === 'today' ? 'text-[#6C7CFF]' :
                      'text-[#5c5f73]'
                    }`}>
                      {item.date}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === 'completed' ? 'bg-[#34d399]/10 text-[#34d399]' :
                      item.status === 'today' ? 'bg-[#6C7CFF]/10 text-[#6C7CFF]' :
                      'bg-white/[0.04] text-[#5c5f73]'
                    }`}>
                      {item.duration}
                    </span>
                  </div>
                  <p className={`text-[13px] ${
                    item.status === 'completed' ? 'text-[#8b8fa3]' :
                    item.status === 'today' ? 'text-[#e8eaf0] font-medium' :
                    'text-[#5c5f73]'
                  }`}>
                    {item.task}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

/* ─── 6. Floating Agent Assistant ─── */
function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    { icon: FileText, label: '帮我出题', color: '#6C7CFF' },
    { icon: AlertCircle, label: '分析错题', color: '#f87171' },
    { icon: BookOpen, label: '整理重点', color: '#4FD1C5' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-[#12131f] border border-white/[0.06] rounded-[20px] p-4 w-[200px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#e8eaf0]">Agent 助手</span>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-[6px] hover:bg-white/[0.04]">
                <X size={12} className="text-[#5c5f73]" />
              </button>
            </div>
            <div className="space-y-1.5">
              {commands.map((cmd) => (
                <button
                  key={cmd.label}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[12px] text-[#8b8fa3] hover:bg-white/[0.04] hover:text-[#e8eaf0] transition-colors"
                >
                  <cmd.icon size={14} style={{ color: cmd.color }} />
                  {cmd.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_4px_16px_rgba(108,124,255,0.3)]"
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Brain size={20} className="text-white" />
        )}
      </motion.button>
    </div>
  );
}

/* ─── 主组件 ─── */
export default function Dashboard() {
  return (
    <div className="space-y-0 pb-8">
      {/* 1. Stats Overview */}
      <StatsOverview />

      {/* 2. Agent Workflow */}
      <AgentWorkflow />

      {/* 3. Three-Column Layout */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mt-8 flex flex-col lg:flex-row gap-4"
      >
        <KnowledgeNav />
        <KnowledgeGraph />
        <SmartPanel />
      </motion.section>

      {/* 4. Quiz Practice */}
      <QuizPractice />

      {/* 5. Review Timeline */}
      <ReviewTimeline />

      {/* 6. Floating Agent Assistant */}
      <FloatingAssistant />
    </div>
  );
}
