import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

/* ─── 静态数据（仅保留知识图谱和标签） ─── */
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

const fallbackChapters = [
  { name: '第一章 极限与连续', expanded: true, children: ['数列极限', '函数极限', '连续性'] },
  { name: '第二章 导数与微分', expanded: false, children: ['导数定义', '求导法则', '微分'] },
  { name: '第三章 积分', expanded: false, children: ['不定积分', '定积分', '积分应用'] },
  { name: '第四章 微分方程', expanded: false, children: ['一阶方程', '高阶方程'] },
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
  const agentSessions = useAppStore(s => s.agentSessions);

  const agentWorkflow = useMemo(() => {
    const agentDefs = [
      { name: '导入资料', agentId: 'importer', color: '#6C7CFF', output: '' },
      { name: '提取重点', agentId: 'extractor', color: '#7C5CFF', output: '' },
      { name: '生成题库', agentId: 'examiner', color: '#4FD1C5', output: '' },
      { name: '错题诊断', agentId: 'analyst', color: '#fbbf24', output: '' },
      { name: '复习计划', agentId: 'planner', color: '#f87171', output: '' },
      { name: '强化记忆', agentId: 'reviewer', color: '#34d399', output: '' },
    ];

    return agentDefs.map((def) => {
      const session = agentSessions.find(s => s.agentId === def.agentId);
      let status: 'completed' | 'active' | 'pending' = 'pending';
      let output = '';

      if (session) {
        if (session.messages.length > 0) {
          status = 'completed';
          const lastAssistant = [...session.messages].reverse().find(m => m.role === 'assistant');
          if (lastAssistant) {
            output = lastAssistant.content.slice(0, 30) + (lastAssistant.content.length > 30 ? '...' : '');
          }
        } else {
          status = 'active';
        }
      }

      return { ...def, status, output };
    });
  }, [agentSessions]);

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
      <div className="flex overflow-x-auto gap-4 pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {agentWorkflow.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-2 flex-shrink-0 lg:flex-shrink">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-4 min-w-[150px] lg:min-w-0 transition-all hover:border-[#6C7CFF]/30 hover:shadow-[0_0_20px_rgba(108,124,255,0.08)]"
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
              <ArrowRight size={14} className="text-[#5c5f73] flex-shrink-0 hidden lg:block" />
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
  const subjects = useAppStore(s => s.subjects);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string>('');

  // Set initial selected subject
  useMemo(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const toggleChapter = (idx: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Use fallback chapters when a subject is selected but has no chapter data
  const displayChapters = fallbackChapters;

  return (
    <div className="w-full lg:w-[220px] flex-shrink-0 min-w-0 bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5">
      <h3 className="text-[13px] font-semibold text-[#e8eaf0] mb-3">知识导航</h3>

      {/* Course selector */}
      <div className="relative mb-4">
        {subjects.length > 0 ? (
          <>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full appearance-none bg-[#1a1b2e] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#e8eaf0] outline-none focus:border-[#6C7CFF]/30 transition-colors"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5f73] pointer-events-none" />
          </>
        ) : (
          <div className="w-full bg-[#1a1b2e] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#5c5f73]">
            添加科目后显示章节目录
          </div>
        )}
      </div>

      {/* Chapter list */}
      {subjects.length > 0 ? (
        <div className="space-y-1 mb-4 max-h-[200px] overflow-y-auto scrollbar-hide">
          {displayChapters.map((ch, idx) => (
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
      ) : (
        <div className="mb-4 py-6 text-center text-[12px] text-[#5c5f73]">
          添加科目后显示章节目录
        </div>
      )}

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
    <div className="w-full lg:flex-1 min-w-0 bg-[#12131f] border border-white/[0.06] rounded-[24px] p-5 relative overflow-hidden">
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
  const flashCards = useAppStore(s => s.flashCards);
  const subjects = useAppStore(s => s.subjects);
  const [quickQuestion, setQuickQuestion] = useState('');

  // Generate todos from unmastered flashCards
  const todos = useMemo(() => {
    const unmastered = flashCards.filter(c => !c.mastered).slice(0, 4);
    if (unmastered.length === 0) return [{ id: '1', text: '所有闪卡已掌握！', done: true }];
    return unmastered.map(c => ({ id: c.id, text: `复习: ${c.front.slice(0, 20)}...`, done: false }));
  }, [flashCards]);

  const [todoItems, setTodoItems] = useState(todos);

  // Sync with computed todos
  useMemo(() => {
    setTodoItems(todos);
  }, [todos]);

  const toggleTodo = (id: string) => {
    setTodoItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // Exam reminders from subjects sorted by examDate
  const examReminders = useMemo(() => {
    return [...subjects]
      .filter(s => s.examDate)
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .map(s => {
        const cd = getCountdown(s.examDate);
        const dateStr = new Date(s.examDate + 'T00:00:00');
        const monthDay = `${dateStr.getMonth() + 1}月${dateStr.getDate()}日`;
        let urgencyColor = 'text-[#5c5f73]';
        if (cd.passed) {
          urgencyColor = 'text-[#5c5f73]';
        } else if (cd.days <= 3) {
          urgencyColor = 'text-[#f87171]';
        } else if (cd.days <= 7) {
          urgencyColor = 'text-[#fbbf24]';
        } else {
          urgencyColor = 'text-[#34d399]';
        }
        return { name: s.name, date: monthDay, urgencyColor, days: cd.days };
      });
  }, [subjects]);

  return (
    <div className="w-full lg:w-[280px] flex-shrink-0 min-w-0 space-y-4">
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
          {todoItems.map((todo) => (
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
        {examReminders.length > 0 ? (
          <div className="space-y-2">
            {examReminders.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b8fa3]">{r.name}</span>
                <span className={`text-[11px] font-medium ${r.urgencyColor}`}>{r.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#5c5f73]">暂无考试安排</p>
        )}
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
  const flashCards = useAppStore(s => s.flashCards);
  const subjects = useAppStore(s => s.subjects);
  const navigate = useNavigate();

  const [quizIndex, setQuizIndex] = useState(0);

  // Generate quiz data from flashCards
  const quizState = useMemo(() => {
    if (flashCards.length === 0) return null;

    // Pick a card (cycle through based on quizIndex)
    const cardIndex = quizIndex % flashCards.length;
    const card = flashCards[cardIndex];

    // Get other cards' backs for wrong options
    const otherCards = flashCards.filter((_, i) => i !== cardIndex);
    const wrongOptions = otherCards.length >= 3
      ? otherCards.slice(0, 3).map(c => c.back)
      : [
          ...otherCards.map(c => c.back),
          ...Array(3 - otherCards.length).fill('').map((_, i) => `选项 ${String.fromCharCode(68 - i)}`),
        ];

    // Shuffle options with correct answer
    const allOptions = [card.back, ...wrongOptions.slice(0, 3)];
    const shuffled = allOptions.map((opt, i) => ({ opt, sort: Math.random() }));
    shuffled.sort((a, b) => a.sort - b.sort);

    const correctIndex = shuffled.findIndex(s => s.opt === card.back);

    const subject = subjects.find(s => s.id === card.subjectId);

    return {
      question: card.front,
      options: shuffled.map((s, i) => `${String.fromCharCode(65 + i)}. ${s.opt}`),
      correctIndex,
      explanation: card.back,
      subjectName: subject?.name || '未知科目',
    };
  }, [flashCards, subjects, quizIndex]);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const isAnswered = selectedOption !== null;
  const isCorrect = quizState ? selectedOption === quizState.correctIndex : false;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setTimeout(() => setShowExplanation(true), 400);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setIsStarred(false);
    setIsBookmarked(false);
    setQuizIndex((prev) => prev + 1);
  };

  if (!quizState) {
    return (
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mt-8"
      >
        <h2 className="text-[16px] font-semibold text-[#e8eaf0] mb-4">智能出题练习</h2>
        <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col items-center justify-center py-12">
          <Brain size={40} className="text-[#5c5f73] mb-3" />
          <p className="text-[14px] text-[#5c5f73] mb-4">添加闪卡后开始练习</p>
          <button
            onClick={() => navigate('/ai-engine')}
            className="text-[13px] px-4 py-2 rounded-[12px] bg-[#6C7CFF]/10 text-[#6C7CFF] border border-[#6C7CFF]/20 hover:bg-[#6C7CFF]/20 transition-colors"
          >
            前往 AI 冲刺核
          </button>
        </div>
      </motion.section>
    );
  }

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
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#6C7CFF]/10 text-[#6C7CFF]">{quizState.subjectName}</span>
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
            <div className="h-full rounded-full bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF]" style={{ width: `${((quizIndex % flashCards.length) + 1) / flashCards.length * 100}%` }} />
          </div>
          <span className="text-[11px] text-[#5c5f73] tabular-nums">{(quizIndex % flashCards.length) + 1}/{flashCards.length}</span>
        </div>

        {/* Question */}
        <p className="text-[14px] text-[#e8eaf0] leading-relaxed mb-5">{quizState.question}</p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {quizState.options.map((opt, idx) => {
            let optClass = 'border border-white/[0.08] rounded-[12px] p-3 text-[13px] text-[#8b8fa3] cursor-pointer transition-all hover:border-[#6C7CFF]/30 hover:text-[#e8eaf0]';
            if (isAnswered) {
              if (idx === quizState.correctIndex) {
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
                <p className="text-[12px] text-[#8b8fa3] leading-relaxed">{quizState.explanation}</p>
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
  const subjects = useAppStore(s => s.subjects);

  const timelineData = useMemo(() => {
    const subjectsWithExam = subjects.filter(s => s.examDate);
    if (subjectsWithExam.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subjectsWithExam
      .map(s => {
        const examDate = new Date(s.examDate + 'T00:00:00');
        examDate.setHours(0, 0, 0, 0);
        const diffTime = examDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let status: 'completed' | 'today' | 'future' = 'future';
        if (diffDays < 0) status = 'completed';
        else if (diffDays === 0) status = 'today';

        const monthDay = `${examDate.getMonth() + 1}月${examDate.getDate()}日`;

        return {
          date: monthDay,
          task: `${s.name} 复习`,
          duration: `${Math.max(1, Math.round(s.progress / 30))}h`,
          status,
          sortKey: examDate.getTime(),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [subjects]);

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

      <div className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-6 overflow-x-auto">
        {timelineData.length > 0 ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Clock size={32} className="text-[#5c5f73] mb-3" />
            <p className="text-[13px] text-[#5c5f73]">添加科目后生成复习计划</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ─── 6. Floating Agent Assistant ─── */
function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const commands = [
    { icon: FileText, label: '帮我出题', color: '#6C7CFF', action: () => navigate('/ai-engine?agent=examiner') },
    { icon: AlertCircle, label: '分析错题', color: '#f87171', action: () => navigate('/ai-engine?agent=analyst') },
    { icon: BookOpen, label: '整理重点', color: '#4FD1C5', action: () => navigate('/ai-engine?agent=extractor') },
  ];

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-50">
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
                  onClick={() => { cmd.action(); setIsOpen(false); }}
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
    <div className="space-y-0 pb-8 overflow-x-hidden">
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
