import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Target, Brain, FileText, ChevronDown,
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

/* ─── 静态标签 ─── */
const tags = ['重点', '易错', '公式', '证明', '计算'];

/* ─── 1. Stats Overview ─── */
function StatsOverview() {
  const { subjects, flashCards } = useAppStore();

  const todayRate = useMemo(() => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((s, sub) => s + sub.progress, 0);
    return Math.round(total / subjects.length);
  }, [subjects]);

  const nearestDays = useMemo(() => {
    if (subjects.length === 0) return null;
    const sorted = [...subjects].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    const cd = getCountdown(sorted[0].examDate);
    return cd.passed ? 0 : cd.days;
  }, [subjects]);

  const avgMastery = useMemo(() => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((s, sub) => s + sub.progress, 0);
    return Math.round(total / subjects.length);
  }, [subjects]);

  const totalQuizzes = flashCards.length;

  const stats = [
    {
      label: '今日完成率',
      value: subjects.length > 0 ? `${todayRate}%` : '--',
      icon: CheckCircle2,
      iconBg: 'bg-[#00D924]/10',
      iconColor: 'text-[#00D924]',
      trend: subjects.length > 0 ? `${todayRate}%` : '添加科目',
      trendUp: todayRate > 0,
      ring: subjects.length > 0,
      ringValue: todayRate,
    },
    {
      label: '距期末',
      value: nearestDays !== null ? `${nearestDays}` : '--',
      valueSuffix: nearestDays !== null ? '天' : '',
      icon: Clock,
      iconBg: 'bg-[#635BFF]/10',
      iconColor: 'text-[#635BFF]',
      trend: subjects.length > 0 ? '最近考试' : '添加科目',
      trendUp: false,
      ring: false,
    },
    {
      label: '掌握度',
      value: subjects.length > 0 ? `${avgMastery}%` : '--',
      icon: Target,
      iconBg: 'bg-[#FFB800]/10',
      iconColor: 'text-[#FFB800]',
      trend: subjects.length > 0 ? `${avgMastery}%` : '添加科目',
      trendUp: avgMastery > 0,
      bar: subjects.length > 0,
      barValue: avgMastery,
    },
    {
      label: '已出题',
      value: `${totalQuizzes}`,
      valueSuffix: '道',
      icon: FileText,
      iconBg: 'bg-[#7C5CFF]/10',
      iconColor: 'text-[#7C5CFF]',
      trend: totalQuizzes > 0 ? `共 ${totalQuizzes} 题` : '添加闪卡',
      trendUp: totalQuizzes > 0,
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
          className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5 transition-all hover:border-[#635BFF]/30 hover:shadow-[0_0_20px_rgba(99,91,255,0.08)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
            <span className={`text-[11px] font-medium ${stat.trendUp ? 'text-[#00D924]' : 'text-[#a3b5cc]'}`}>
              {stat.trend}
            </span>
          </div>

          <p className="text-[12px] text-[#a3b5cc] mb-1">{stat.label}</p>

          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-bold text-[#ffffff] leading-none tabular-nums">{stat.value}</span>
            {stat.valueSuffix && (
              <span className="text-[13px] text-[#6b7c93]">{stat.valueSuffix}</span>
            )}
          </div>

          {/* Ring progress */}
          {stat.ring && (
            <div className="mt-3 flex justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke="#00D924" strokeWidth="4" strokeLinecap="round"
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
                style={{ background: 'linear-gradient(90deg, #FFB800, #f97316)' }}
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
    // 5 个核心 Agent + 1 个 Orchestrator 协调器
    const agentDefs = [
      { name: '协调器', agentId: 'orchestrator', color: '#635BFF', output: '', isOrchestrator: true },
      { name: '内容摘要', agentId: 'content-agent', color: '#7C5CFF', output: '' },
      { name: '智能出题', agentId: 'question-agent', color: '#4FD1C5', output: '' },
      { name: '诊断评估', agentId: 'diagnoser-agent', color: '#FFB800', output: '' },
      { name: '学习规划', agentId: 'planner-agent', color: '#FF3D00', output: '' },
      { name: '教学助理', agentId: 'tutor-agent', color: '#00D924', output: '' },
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

      // Orchestrator 始终视为活跃（任务总控）
      if (def.isOrchestrator && status === 'pending') {
        status = 'active';
      }

      return { ...def, status, output };
    });
  }, [agentSessions]);

  const statusBadge = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00D924]/10 text-[#00D924]">已完成</span>;
      case 'active':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF]">进行中</span>;
      case 'pending':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#6b7c93]">待执行</span>;
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-[#ffffff]">Agent 协作工作流</h2>
        <span className="text-[11px] text-[#6b7c93]">5 Agent + 1 协调器 · 状态机驱动 DAG 调度</span>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {agentWorkflow.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-2 flex-shrink-0 lg:flex-shrink">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className={`bg-[#0d2d4a] border rounded-[20px] p-4 min-w-[150px] lg:min-w-0 transition-all hover:shadow-[0_0_20px_rgba(99,91,255,0.08)] ${
                agent.isOrchestrator
                  ? 'border-[#635BFF]/40 shadow-[0_0_16px_rgba(99,91,255,0.08)]'
                  : 'border-white/[0.06] hover:border-[#635BFF]/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agent.color }} />
                <span className="text-[13px] font-medium text-[#ffffff]">{agent.name}</span>
                {agent.isOrchestrator && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-[#635BFF]/15 text-[#635BFF]">CORE</span>
                )}
              </div>
              <div className="mb-2">{statusBadge(agent.status)}</div>
              {agent.output && (
                <p className="text-[11px] text-[#6b7c93] leading-relaxed">{agent.output}</p>
              )}
            </motion.div>
            {i < agentWorkflow.length - 1 && (
              <ArrowRight size={14} className="text-[#6b7c93] flex-shrink-0 hidden lg:block" />
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
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Set initial selected subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Get selected subject data
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="w-full lg:w-[220px] flex-shrink-0 min-w-0 bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5">
      <h3 className="text-[13px] font-semibold text-[#ffffff] mb-3">知识导航</h3>

      {/* Course selector */}
      <div className="relative mb-4">
        {subjects.length > 0 ? (
          <>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full appearance-none bg-[#1a3a5c] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#ffffff] outline-none focus:border-[#635BFF]/30 transition-colors"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7c93] pointer-events-none" />
          </>
        ) : (
          <div className="w-full bg-[#1a3a5c] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#6b7c93]">
            添加科目后显示章节目录
          </div>
        )}
      </div>

      {/* Chapter list - show knowledge points for selected subject */}
      {subjects.length > 0 && selectedSubject ? (
        <div className="space-y-1 mb-4 max-h-[200px] overflow-y-auto scrollbar-hide">
          <div className="text-[11px] text-[#6b7c93] px-2 py-1">
            通过 AI 冲刺核添加知识点
          </div>
        </div>
      ) : (
        <div className="mb-4 py-6 text-center text-[12px] text-[#6b7c93]">
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
                ? 'bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/30'
                : 'bg-white/[0.04] text-[#6b7c93] border border-white/[0.06] hover:text-[#a3b5cc]'
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
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const subjects = useAppStore(s => s.subjects);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Build graph from knowledgePoints
  const graphData = useMemo(() => {
    if (knowledgePoints.length === 0) return null;

    // Group by subject
    const bySubject = new Map<string, typeof knowledgePoints>();
    knowledgePoints.forEach(kp => {
      if (!bySubject.has(kp.subjectId)) bySubject.set(kp.subjectId, []);
      bySubject.get(kp.subjectId)!.push(kp);
    });

    // Create nodes with positions (simple radial layout)
    const nodes: Array<{
      id: string;
      label: string;
      x: number;
      y: number;
      size: 'lg' | 'md' | 'sm';
      color: string;
      mastery: number;
    }> = [];

    const colors = ['#635BFF', '#7C5CFF', '#4FD1C5', '#FFB800', '#FF3D00', '#00D924'];
    let subjectIdx = 0;

    bySubject.forEach((points, subjectId) => {
      const subject = subjects.find(s => s.id === subjectId);
      const color = colors[subjectIdx % colors.length];
      subjectIdx++;

      // Center node for subject
      const centerX = 20 + (subjectIdx * 60) % 60;
      const centerY = 50;
      nodes.push({
        id: `subject-${subjectId}`,
        label: subject?.name || '科目',
        x: centerX,
        y: centerY,
        size: 'lg',
        color,
        mastery: Math.round(points.reduce((sum, p) => sum + p.mastery, 0) / points.length),
      });

      // Child nodes in circle around center
      const radius = 25;
      points.slice(0, 6).forEach((kp, i) => {
        const angle = (i / Math.min(points.length, 6)) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        nodes.push({
          id: kp.id,
          label: kp.name.length > 4 ? kp.name.slice(0, 4) : kp.name,
          x: Math.max(5, Math.min(95, x)),
          y: Math.max(5, Math.min(95, y)),
          size: kp.mastery >= 80 ? 'md' : 'sm',
          color,
          mastery: kp.mastery,
        });
      });
    });

    return { nodes, bySubject };
  }, [knowledgePoints, subjects]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="w-full lg:flex-1 min-w-0 bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5 flex flex-col items-center justify-center">
        <h3 className="text-[13px] font-semibold text-[#ffffff] mb-3">知识图谱</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <Brain size={32} className="text-[#6b7c93] mb-3" />
          <p className="text-[13px] text-[#6b7c93] text-center">
            通过 AI 冲刺核添加知识点后<br />知识图谱将自动生成
          </p>
        </div>
      </div>
    );
  }

  const nodeSize = (size: string) => {
    switch (size) {
      case 'lg': return 'w-16 h-16 text-[12px]';
      case 'md': return 'w-12 h-12 text-[10px]';
      default: return 'w-9 h-9 text-[9px]';
    }
  };

  return (
    <div className="w-full lg:flex-1 min-w-0 bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5 relative overflow-hidden">
      <h3 className="text-[13px] font-semibold text-[#ffffff] mb-3">知识图谱</h3>
      <div className="relative w-full" style={{ paddingBottom: '80%' }}>
        {/* Nodes */}
        {graphData.nodes.map((node) => (
          <motion.button
            key={node.id}
            onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute rounded-full flex items-center justify-center font-medium transition-all duration-300 cursor-pointer ${nodeSize(node.size)} ${
              selectedNode === node.id
                ? 'ring-2 ring-offset-1 ring-offset-[#0d2d4a]'
                : ''
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              background: selectedNode === node.id ? `${node.color}20` : `${node.color}10`,
              border: `1px solid ${selectedNode === node.id ? node.color : `${node.color}30`}`,
              color: node.color,
              ...(selectedNode === node.id ? { boxShadow: `0 0 20px ${node.color}20` } : {}),
            }}
            title={`${node.label} - 掌握度 ${node.mastery}%`}
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
    if (unmastered.length === 0) return [];
    return unmastered.map(c => ({ id: c.id, text: `复习: ${c.front.slice(0, 20)}...`, done: false }));
  }, [flashCards]);

  const [todoItems, setTodoItems] = useState(todos);

  // Sync with computed todos
  useEffect(() => {
    setTodoItems(todos);
  }, [todos]);

  const toggleTodo = (id: string) => {
    setTodoItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // AI suggestion based on real data
  const aiSuggestion = useMemo(() => {
    if (flashCards.length === 0) return null;
    const unmastered = flashCards.filter(c => !c.mastered);
    if (unmastered.length === 0) return { text: '所有闪卡已掌握！继续保持复习节奏。', highlight: null };
    const subject = subjects.find(s => s.id === unmastered[0].subjectId);
    return {
      text: `建议优先复习「${subject?.name || '未分类'}」，有 ${unmastered.length} 张闪卡未掌握。`,
      highlight: subject?.name || null,
    };
  }, [flashCards, subjects]);

  // Exam reminders from subjects sorted by examDate
  const examReminders = useMemo(() => {
    return [...subjects]
      .filter(s => s.examDate)
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .map(s => {
        const cd = getCountdown(s.examDate);
        const dateStr = new Date(s.examDate + 'T00:00:00');
        const monthDay = `${dateStr.getMonth() + 1}月${dateStr.getDate()}日`;
        let urgencyColor = 'text-[#6b7c93]';
        if (cd.passed) {
          urgencyColor = 'text-[#6b7c93]';
        } else if (cd.days <= 3) {
          urgencyColor = 'text-[#FF3D00]';
        } else if (cd.days <= 7) {
          urgencyColor = 'text-[#FFB800]';
        } else {
          urgencyColor = 'text-[#00D924]';
        }
        return { name: s.name, date: monthDay, urgencyColor, days: cd.days };
      });
  }, [subjects]);

  return (
    <div className="w-full lg:w-[280px] flex-shrink-0 min-w-0 space-y-4">
      {/* AI 复习建议 */}
      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#635BFF]/10">
            <Sparkles size={14} className="text-[#635BFF]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#ffffff]">AI 复习建议</h3>
        </div>
        {aiSuggestion ? (
          <p className="text-[12px] text-[#a3b5cc] leading-relaxed">
            {aiSuggestion.highlight ? (
              <>建议优先复习<strong className="text-[#FFB800]">{aiSuggestion.highlight}</strong>，{aiSuggestion.text.split('，')[1]}</>
            ) : (
              aiSuggestion.text
            )}
          </p>
        ) : (
          <p className="text-[12px] text-[#6b7c93] leading-relaxed">
            添加闪卡后生成个性化复习建议
          </p>
        )}
      </div>

      {/* 今日待办 */}
      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#4FD1C5]/10">
            <ListChecks size={14} className="text-[#4FD1C5]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#ffffff]">今日待办</h3>
        </div>
        {todoItems.length > 0 ? (
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
                      ? 'bg-[#00D924] border-[#00D924]'
                      : 'border border-white/[0.12] group-hover:border-[#635BFF]/40'
                  }`}
                >
                  {todo.done && <CheckCircle2 size={10} className="text-white" />}
                </button>
                <span className={`text-[12px] transition-colors ${
                  todo.done ? 'text-[#6b7c93] line-through' : 'text-[#a3b5cc] group-hover:text-[#ffffff]'
                }`}>
                  {todo.text}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#6b7c93]">暂无待办事项</p>
        )}
      </div>

      {/* 考试提醒 */}
      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#FF3D00]/10">
            <Bell size={14} className="text-[#FF3D00]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#ffffff]">考试提醒</h3>
        </div>
        {examReminders.length > 0 ? (
          <div className="space-y-2">
            {examReminders.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-[12px] text-[#a3b5cc]">{r.name}</span>
                <span className={`text-[11px] font-medium ${r.urgencyColor}`}>{r.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#6b7c93]">暂无考试安排</p>
        )}
      </div>

      {/* 快速提问 */}
      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-[#7C5CFF]/10">
            <HelpCircle size={14} className="text-[#7C5CFF]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#ffffff]">快速提问</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder="输入你的问题..."
            className="flex-1 bg-[#1a3a5c] border border-white/[0.06] rounded-[12px] px-3 py-2 text-[12px] text-[#ffffff] placeholder-[#6b7c93] outline-none focus:border-[#635BFF]/30 transition-colors"
          />
          <button className="w-8 h-8 rounded-[10px] bg-[#635BFF]/10 flex items-center justify-center hover:bg-[#635BFF]/20 transition-colors">
            <Send size={14} className="text-[#635BFF]" />
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
          ...Array(3 - otherCards.length).fill('').map(() => `选项 ${String.fromCharCode(68)}`),
        ];

    // Shuffle options with correct answer
    const allOptions = [card.back, ...wrongOptions.slice(0, 3)];
    const shuffled = allOptions.map((opt) => ({ opt, sort: Math.random() }));
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
  const explanationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);
    };
  }, []);

  const isAnswered = selectedOption !== null;
  const isCorrect = quizState ? selectedOption === quizState.correctIndex : false;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);
    explanationTimerRef.current = setTimeout(() => setShowExplanation(true), 400);
  };

  const handleReset = () => {
    if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);
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
        <h2 className="text-[16px] font-semibold text-[#ffffff] mb-4">智能出题练习</h2>
        <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-6 flex flex-col items-center justify-center py-12">
          <Brain size={40} className="text-[#6b7c93] mb-3" />
          <p className="text-[14px] text-[#6b7c93] mb-4">添加闪卡后开始练习</p>
          <button
            onClick={() => navigate('/ai-engine')}
            className="text-[13px] px-4 py-2 rounded-[12px] bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20 hover:bg-[#635BFF]/20 transition-colors"
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
      <h2 className="text-[16px] font-semibold text-[#ffffff] mb-4">智能出题练习</h2>
      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#635BFF]/10 text-[#635BFF]">{quizState.subjectName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStarred(!isStarred)}
              className="p-1.5 rounded-[8px] hover:bg-white/[0.04] transition-colors"
            >
              <Star size={16} className={isStarred ? 'text-[#FFB800] fill-[#FFB800]' : 'text-[#6b7c93]'} />
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-1.5 rounded-[8px] hover:bg-white/[0.04] transition-colors"
            >
              <Bookmark size={16} className={isBookmarked ? 'text-[#635BFF] fill-[#635BFF]' : 'text-[#6b7c93]'} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#635BFF] to-[#7C5CFF]" style={{ width: `${((quizIndex % flashCards.length) + 1) / flashCards.length * 100}%` }} />
          </div>
          <span className="text-[11px] text-[#6b7c93] tabular-nums">{(quizIndex % flashCards.length) + 1}/{flashCards.length}</span>
        </div>

        {/* Question */}
        <p className="text-[14px] text-[#ffffff] leading-relaxed mb-5">{quizState.question}</p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {quizState.options.map((opt, idx) => {
            let optClass = 'border border-white/[0.08] rounded-[12px] p-3 text-[13px] text-[#a3b5cc] cursor-pointer transition-all hover:border-[#635BFF]/30 hover:text-[#ffffff]';
            if (isAnswered) {
              if (idx === quizState.correctIndex) {
                optClass = 'border border-[#00D924] bg-[#00D924]/10 rounded-[12px] p-3 text-[13px] text-[#00D924] cursor-default';
              } else if (idx === selectedOption && !isCorrect) {
                optClass = 'border border-[#FF3D00] bg-[#FF3D00]/10 rounded-[12px] p-3 text-[13px] text-[#FF3D00] cursor-default';
              } else {
                optClass = 'border border-white/[0.04] rounded-[12px] p-3 text-[13px] text-[#6b7c93] cursor-default opacity-50';
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
              <div className="bg-[#1a3a5c] border border-white/[0.06] rounded-[16px] p-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-[#FFB800]" />
                  <span className="text-[12px] font-semibold text-[#ffffff]">AI 解析</span>
                  {isCorrect ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D924]/10 text-[#00D924]">回答正确</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3D00]/10 text-[#FF3D00]">回答错误</span>
                  )}
                </div>
                <p className="text-[12px] text-[#a3b5cc] leading-relaxed">{quizState.explanation}</p>
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
              <button className="text-[12px] text-[#635BFF] hover:text-[#7C5CFF] transition-colors flex items-center gap-1">
                <Sparkles size={12} />
                逐步提示
              </button>
              <button className="text-[12px] text-[#4FD1C5] hover:text-[#00D924] transition-colors flex items-center gap-1">
                <RotateCcw size={12} />
                生成同类题
              </button>
            </div>
            <button
              onClick={handleReset}
              className="text-[12px] text-[#a3b5cc] hover:text-[#ffffff] transition-colors flex items-center gap-1"
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
        <h2 className="text-[16px] font-semibold text-[#ffffff]">复习计划时间线</h2>
        <button className="text-[12px] text-[#635BFF] hover:text-[#7C5CFF] transition-colors flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-[#635BFF]/20 hover:border-[#635BFF]/40">
          <Sparkles size={12} />
          智能调整计划
        </button>
      </div>

      <div className="bg-[#0d2d4a] border border-white/[0.06] rounded-[24px] p-6 overflow-x-auto">
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
                        <div className="w-3 h-3 rounded-full bg-[#00D924] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0d2d4a]" />
                        </div>
                      )}
                      {item.status === 'today' && (
                        <motion.div
                          className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7C5CFF]"
                          animate={{ boxShadow: ['0 0 0 0 rgba(99,91,255,0.4)', '0 0 0 6px rgba(99,91,255,0)', '0 0 0 0 rgba(99,91,255,0.4)'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      {item.status === 'future' && (
                        <div className="w-3 h-3 rounded-full bg-[#6b7c93]/40" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-px flex-1 min-h-[40px] ${
                        item.status === 'completed' ? 'bg-[#00D924]/30' : 'bg-white/[0.06]'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[11px] font-medium tabular-nums ${
                        item.status === 'completed' ? 'text-[#00D924]' :
                        item.status === 'today' ? 'text-[#635BFF]' :
                        'text-[#6b7c93]'
                      }`}>
                        {item.date}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.status === 'completed' ? 'bg-[#00D924]/10 text-[#00D924]' :
                        item.status === 'today' ? 'bg-[#635BFF]/10 text-[#635BFF]' :
                        'bg-white/[0.04] text-[#6b7c93]'
                      }`}>
                        {item.duration}
                      </span>
                    </div>
                    <p className={`text-[13px] ${
                      item.status === 'completed' ? 'text-[#a3b5cc]' :
                      item.status === 'today' ? 'text-[#ffffff] font-medium' :
                      'text-[#6b7c93]'
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
            <Clock size={32} className="text-[#6b7c93] mb-3" />
            <p className="text-[13px] text-[#6b7c93]">添加科目后生成复习计划</p>
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
    { icon: FileText, label: '帮我出题', color: '#4FD1C5', action: () => navigate('/ai-engine?agent=question-agent') },
    { icon: AlertCircle, label: '分析错题', color: '#FFB800', action: () => navigate('/ai-engine?agent=diagnoser-agent') },
    { icon: BookOpen, label: '整理重点', color: '#7C5CFF', action: () => navigate('/ai-engine?agent=content-agent') },
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
            className="absolute bottom-16 right-0 bg-[#0d2d4a] border border-white/[0.06] rounded-[20px] p-4 w-[200px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#ffffff]">Agent 助手</span>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-[6px] hover:bg-white/[0.04]">
                <X size={12} className="text-[#6b7c93]" />
              </button>
            </div>
            <div className="space-y-1.5">
              {commands.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[12px] text-[#a3b5cc] hover:bg-white/[0.04] hover:text-[#ffffff] transition-colors"
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
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_4px_16px_rgba(99,91,255,0.3)]"
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
