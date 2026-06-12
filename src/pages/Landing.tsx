import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  Brain,
  FileText,
  PenTool,
  CalendarCheck,
  Sparkles,
  Lightbulb,
  BarChart3,
  Zap,
  TrendingUp,
  AlertCircle,
  Play,
  MessageSquare,
  ListTodo,
  GitBranch,
  Star,
} from 'lucide-react';

/* ─── Animation Helpers ────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Counter Animation ────────────────────────────── */

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Agent Data ───────────────────────────────────── */

const agents = [
  { name: '资料整理', color: '#6C7CFF', icon: FileText, status: '已完成' },
  { name: '题目生成', color: '#7C5CFF', icon: PenTool, status: '进行中' },
  { name: '错题分析', color: '#f87171', icon: AlertCircle, status: '待执行' },
  { name: '计划管理', color: '#4FD1C5', icon: CalendarCheck, status: '进行中' },
  { name: '记忆强化', color: '#fbbf24', icon: Brain, status: '待执行' },
  { name: '智能答疑', color: '#34d399', icon: MessageSquare, status: '已完成' },
];

const workflowSteps = [
  { emoji: '📥', name: '导入资料', desc: '上传课件、笔记、PDF', status: '已完成' as const, preview: '已导入 12 个文件' },
  { emoji: '🔍', name: '提取重点', desc: 'AI 自动提炼核心知识', status: '已完成' as const, preview: '提取 86 个知识点' },
  { emoji: '📝', name: '生成题库', desc: '根据重点智能出题', status: '进行中' as const, preview: '已生成 234 道题' },
  { emoji: '🔍', name: '错题诊断', desc: '分析错误模式与薄弱点', status: '进行中' as const, preview: '诊断 23 道错题' },
  { emoji: '📅', name: '复习计划', desc: '智能安排复习节奏', status: '待执行' as const, preview: '规划 12 天计划' },
  { emoji: '🧠', name: '强化记忆', desc: '间隔重复巩固记忆', status: '待执行' as const, preview: '待启动' },
];

const statusConfig = {
  '已完成': { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
  '进行中': { color: '#6C7CFF', bg: 'rgba(108,124,255,0.1)', border: 'rgba(108,124,255,0.2)' },
  '待执行': { color: '#5c5f73', bg: 'rgba(92,95,115,0.1)', border: 'rgba(92,95,115,0.15)' },
};

/* ─── Quiz Data ────────────────────────────────────── */

const quizOptions = [
  { label: 'A', text: '选择一个你不了解的概念' },
  { label: 'B', text: '用简单语言解释给他人听' },
  { label: 'C', text: '反复抄写笔记直到记住' },
  { label: 'D', text: '发现知识缺口后重新学习' },
];

/* ─── Timeline Data ────────────────────────────────── */

const timelineItems = [
  { date: '6月10日', task: '高等数学 · 微积分复习', duration: '2小时', status: 'completed' as const },
  { date: '6月11日', task: '线性代数 · 矩阵运算', duration: '1.5小时', status: 'completed' as const },
  { date: '6月12日', task: '概率论 · 随机变量', duration: '2小时', status: 'today' as const },
  { date: '6月13日', task: '高等数学 · 级数与积分', duration: '2小时', status: 'future' as const },
  { date: '6月14日', task: '线性代数 · 特征值', duration: '1.5小时', status: 'future' as const },
  { date: '6月15日', task: '综合模拟测试', duration: '3小时', status: 'future' as const },
];

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function Landing() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0b14] font-sans text-[#e8eaf0] antialiased overflow-x-hidden">

      {/* ═══════════════════════ 1. 导航栏 ═══════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0b14]/70 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_12px_rgba(108,124,255,0.3)]">
              <span className="text-white text-[10px] font-bold tracking-tight">UF</span>
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-[#e8eaf0]">UniFlow</span>
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {['首页', '复习计划', '知识图谱', '题库', '错题本', '智能协作'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[13px] text-[#8b8fa3] hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 text-[12px] text-[#5c5f73] bg-[#12131f] border border-white/[0.06] rounded-[8px] px-3 py-1.5 hover:border-white/[0.12] transition-colors">
              <Search size={13} />
              <span>搜索</span>
              <kbd className="text-[10px] text-[#5c5f73] bg-[#0a0b14] border border-white/[0.06] rounded-[4px] px-1.5 py-0.5 ml-1">⌘K</kbd>
            </button>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#1a1b2e] transition-colors">
              <Bell size={15} className="text-[#8b8fa3]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6C7CFF]" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C7CFF]/40 to-[#7C5CFF]/40 border border-white/[0.08] flex items-center justify-center">
              <span className="text-[10px] font-medium text-[#e8eaf0]">U</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ 2. Hero Section ═══════════════════════ */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#6C7CFF] opacity-[0.07] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#4FD1C5] opacity-[0.05] blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-[#7C5CFF] opacity-[0.06] blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          {/* Left: Text */}
          <motion.div
            className="flex-1 max-w-[600px]"
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-[#12131f] border border-white/[0.06] rounded-full px-3.5 py-1.5 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C7CFF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6C7CFF]" />
              </span>
              <span className="text-[12px] text-[#8b8fa3] font-medium">多 Agent 智能协作</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.15] text-[#e8eaf0] mb-5"
            >
              期末复习，<br />不再一个人硬扛。
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[17px] text-[#8b8fa3] leading-[1.75] mb-8 max-w-[520px]"
            >
              让 6 个 AI Agent 帮你拆解资料、提炼重点、出题练习、诊断错题、管理计划、强化记忆——一套闭环，全程协作。
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[14px] font-medium rounded-[10px] px-7 py-3 hover:shadow-[0_0_24px_rgba(108,124,255,0.35)] transition-shadow duration-300"
              >
                立即开始复习
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[14px] text-[#8b8fa3] hover:text-white transition-colors duration-200 flex items-center gap-1.5"
              >
                查看协作流程
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </motion.div>

          {/* Right: Multi-Agent Orbital Visualization */}
          <motion.div
            className="flex-1 relative w-full max-w-[480px] aspect-square"
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            custom={1}
          >
            {/* Orbital rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[340px] h-[340px] rounded-full border border-white/[0.04] animate-[spin_60s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[240px] h-[240px] rounded-full border border-white/[0.03] border-dashed animate-[spin_45s_linear_infinite_reverse]" />
            </div>

            {/* Central circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-[88px] h-[88px] rounded-full bg-[#12131f] border border-[rgba(108,124,255,0.3)] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(108,124,255,0.15)]">
                <Zap size={18} className="text-[#6C7CFF] mb-0.5" />
                <span className="text-[10px] font-medium text-[#8b8fa3]">任务核心</span>
              </div>
              {/* Pulsing glow */}
              <div className="absolute inset-0 rounded-full bg-[#6C7CFF]/10 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>

            {/* Agent nodes */}
            {agents.map((agent, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const radius = 170;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const Icon = agent.icon;

              return (
                <motion.div
                  key={agent.name}
                  className="absolute top-1/2 left-1/2 z-20"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
                >
                  {/* Connecting line to center */}
                  <div
                    className="absolute top-1/2 left-1/2 h-[1px] origin-left"
                    style={{
                      width: `${radius - 44}px`,
                      transform: `translate(-50%, -50%) rotate(${i * 60 + 90}deg)`,
                      background: `linear-gradient(90deg, transparent, ${agent.color}20)`,
                    }}
                  />
                  <div className="bg-[#12131f] border border-white/[0.06] rounded-[12px] px-3 py-2.5 flex items-center gap-2 hover:border-[rgba(108,124,255,0.3)] hover:shadow-[0_0_16px_rgba(108,124,255,0.08)] transition-all duration-300 cursor-default min-w-[120px]">
                    <div
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${agent.color}18` }}
                    >
                      <Icon size={12} style={{ color: agent.color }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-[#e8eaf0] whitespace-nowrap">{agent.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusConfig[agent.status as keyof typeof statusConfig].color }}
                        />
                        <span className="text-[9px]" style={{ color: statusConfig[agent.status as keyof typeof statusConfig].color }}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ 3. Stats Overview ═══════════════════════ */}
      <Section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Target, label: '今日完成率', value: 78, suffix: '%', trend: '+12%', trendUp: true, color: '#6C7CFF' },
            { icon: Clock, label: '距期末', value: 12, suffix: '天', trend: '倒计时中', trendUp: false, color: '#fbbf24' },
            { icon: BarChart3, label: '掌握度', value: 65, suffix: '%', trend: '+8%', trendUp: true, color: '#4FD1C5' },
            { icon: BookOpen, label: '已出题', value: 234, suffix: '道', trend: '+56道', trendUp: true, color: '#7C5CFF' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i}
              className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-5 hover:border-[#6C7CFF]/30 hover:shadow-[0_0_20px_rgba(108,124,255,0.1)] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <span className="text-[11px] font-medium text-[#34d399] flex items-center gap-0.5">
                  {stat.trendUp && <TrendingUp size={10} />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-[12px] text-[#5c5f73] mb-1">{stat.label}</p>
              <p className="text-[28px] font-bold tracking-tight text-[#e8eaf0]">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════ 4. Agent Workflow ═══════════════════════ */}
      <Section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">六步协作，闭环复习</h2>
            <p className="text-[15px] text-[#8b8fa3]">从导入到掌握，每个环节都有专属 Agent 守护</p>
          </motion.div>

          {/* Desktop: horizontal flow */}
          <div className="hidden lg:flex items-start justify-center gap-2">
            {workflowSteps.map((step, i) => (
              <motion.div key={step.name} variants={fadeUp} custom={i} className="flex items-start">
                <div className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-5 w-[170px] hover:border-[rgba(108,124,255,0.3)] hover:shadow-[0_0_16px_rgba(108,124,255,0.08)] transition-all duration-300 group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[20px]">{step.emoji}</span>
                    <span className="text-[13px] font-semibold text-[#e8eaf0]">{step.name}</span>
                  </div>
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full mb-3"
                    style={{
                      color: statusConfig[step.status].color,
                      backgroundColor: statusConfig[step.status].bg,
                      border: `1px solid ${statusConfig[step.status].border}`,
                    }}
                  >
                    {step.status}
                  </span>
                  <p className="text-[11px] text-[#8b8fa3] leading-[1.6] mb-2">{step.desc}</p>
                  <p className="text-[10px] text-[#5c5f73]">{step.preview}</p>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="flex items-center self-center mx-1">
                    <ChevronRight size={16} className="text-[#5c5f73]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Mobile: vertical flow */}
          <div className="lg:hidden flex flex-col gap-3">
            {workflowSteps.map((step, i) => (
              <motion.div key={step.name} variants={fadeUp} custom={i}>
                <div className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-4 flex items-center gap-4 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300">
                  <span className="text-[24px]">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-[#e8eaf0]">{step.name}</span>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: statusConfig[step.status].color,
                          backgroundColor: statusConfig[step.status].bg,
                          border: `1px solid ${statusConfig[step.status].border}`,
                        }}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b8fa3]">{step.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#5c5f73] flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════ 5. Three-Column Workspace ═══════════════════════ */}
      <Section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">你的复习指挥中心</h2>
            <p className="text-[15px] text-[#8b8fa3]">课程、知识图谱、AI 助手——一屏掌控</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column: 课程 & 知识点 */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-5 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300"
            >
              <h3 className="text-[14px] font-semibold text-[#e8eaf0] mb-4 flex items-center gap-2">
                <BookOpen size={14} className="text-[#6C7CFF]" />
                课程 & 知识点
              </h3>
              <div className="space-y-2">
                {[
                  { name: '高等数学', chapters: ['微积分', '级数', '多元函数'], color: '#6C7CFF', progress: 72 },
                  { name: '线性代数', chapters: ['矩阵', '向量空间', '特征值'], color: '#7C5CFF', progress: 58 },
                  { name: '概率论', chapters: ['随机变量', '分布函数', '大数定律'], color: '#4FD1C5', progress: 45 },
                ].map((course) => (
                  <div key={course.name} className="bg-[#0a0b14] rounded-[10px] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                        <span className="text-[12px] font-medium text-[#e8eaf0]">{course.name}</span>
                      </div>
                      <span className="text-[10px] text-[#5c5f73]">{course.progress}%</span>
                    </div>
                    <div className="w-full h-[3px] bg-[#1a1b2e] rounded-full mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.chapters.map((ch) => (
                        <span
                          key={ch}
                          className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[#1a1b2e] text-[#8b8fa3]"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Center Column: 知识图谱 */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-5 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300 relative overflow-hidden min-h-[360px]"
            >
              <h3 className="text-[14px] font-semibold text-[#e8eaf0] mb-4 flex items-center gap-2">
                <GitBranch size={14} className="text-[#7C5CFF]" />
                知识图谱
              </h3>
              {/* Simulated graph */}
              <div className="relative w-full h-[280px]">
                {/* Central node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-14 h-14 rounded-full bg-[#6C7CFF]/15 border border-[#6C7CFF]/30 flex items-center justify-center">
                    <span className="text-[9px] font-medium text-[#6C7CFF]">微积分</span>
                  </div>
                </div>
                {/* Surrounding nodes */}
                {[
                  { label: '极限', x: '18%', y: '20%', color: '#7C5CFF', size: 'w-10 h-10' },
                  { label: '导数', x: '75%', y: '15%', color: '#4FD1C5', size: 'w-11 h-11' },
                  { label: '积分', x: '82%', y: '60%', color: '#6C7CFF', size: 'w-12 h-12' },
                  { label: '级数', x: '65%', y: '85%', color: '#fbbf24', size: 'w-10 h-10' },
                  { label: '微分方程', x: '15%', y: '75%', color: '#f87171', size: 'w-11 h-11' },
                  { label: '多元函数', x: '8%', y: '48%', color: '#34d399', size: 'w-10 h-10' },
                ].map((node) => (
                  <div
                    key={node.label}
                    className="absolute"
                    style={{ left: node.x, top: node.y }}
                  >
                    <div
                      className={`${node.size} rounded-full flex items-center justify-center`}
                      style={{
                        backgroundColor: `${node.color}12`,
                        border: `1px solid ${node.color}30`,
                      }}
                    >
                      <span className="text-[8px] font-medium" style={{ color: node.color }}>{node.label}</span>
                    </div>
                  </div>
                ))}
                {/* Connection lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
                  <line x1="50%" y1="50%" x2="22%" y2="24%" stroke="#7C5CFF" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="78%" y2="20%" stroke="#4FD1C5" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="86%" y2="64%" stroke="#6C7CFF" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="68%" y2="88%" stroke="#fbbf24" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="19%" y2="78%" stroke="#f87171" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="12%" y2="52%" stroke="#34d399" strokeWidth="1" />
                </svg>
              </div>
            </motion.div>

            {/* Right Column: AI 助手 & 待办 */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-5 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300"
            >
              <h3 className="text-[14px] font-semibold text-[#e8eaf0] mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-[#4FD1C5]" />
                AI 助手 & 待办
              </h3>

              {/* AI Suggestion */}
              <div className="bg-gradient-to-br from-[#6C7CFF]/10 to-[#7C5CFF]/5 border border-[rgba(108,124,255,0.2)] rounded-[12px] p-3.5 mb-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb size={14} className="text-[#6C7CFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-[#e8eaf0] mb-1">智能建议</p>
                    <p className="text-[10px] text-[#8b8fa3] leading-[1.6]">你的「概率论」掌握度偏低，建议今天优先复习随机变量章节，预计需要 1.5 小时。</p>
                  </div>
                </div>
              </div>

              {/* Today's tasks */}
              <div className="mb-4">
                <p className="text-[11px] text-[#5c5f73] font-medium mb-2">今日待办</p>
                <div className="space-y-1.5">
                  {[
                    { text: '完成微积分第5章练习', done: true },
                    { text: '复习线性代数特征值', done: true },
                    { text: '概率论随机变量测验', done: false },
                    { text: '整理错题笔记', done: false },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-[#34d399]/15 border-[#34d399]/30' : 'border-[#5c5f73]/30'}`}>
                        {task.done && <CheckCircle2 size={10} className="text-[#34d399]" />}
                      </div>
                      <span className={`text-[11px] ${task.done ? 'text-[#5c5f73] line-through' : 'text-[#8b8fa3]'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review reminder */}
              <div className="bg-[#0a0b14] rounded-[10px] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-[#fbbf24]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#e8eaf0]">间隔复习提醒</p>
                  <p className="text-[10px] text-[#5c5f73]">3 个知识点今日到期复习</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════ 6. Quiz Practice ═══════════════════════ */}
      <Section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">智能出题，精准练习</h2>
            <p className="text-[15px] text-[#8b8fa3]">AI 根据你的薄弱点动态生成题目，越练越精准</p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            className="bg-[#12131f] border border-white/[0.06] rounded-[16px] p-6 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#6C7CFF] bg-[#6C7CFF]/10 px-2 py-0.5 rounded-full">概率论</span>
                <span className="text-[10px] text-[#5c5f73]">· 费曼技巧</span>
              </div>
              <span className="text-[11px] text-[#5c5f73]">3 / 24</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[3px] bg-[#1a1b2e] rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] rounded-full" style={{ width: '12.5%' }} />
            </div>

            {/* Question */}
            <h3 className="text-[16px] font-semibold text-[#e8eaf0] mb-5 leading-[1.6]">
              以下哪项不是费曼技巧的核心步骤？
            </h3>

            {/* Options */}
            <div className="space-y-2.5 mb-6">
              {quizOptions.map((opt, i) => {
                const isCorrect = i === 2;
                const isSelected = selectedOption === i;
                let borderStyle = 'border-white/[0.06]';
                if (isSelected && !isCorrect) borderStyle = 'border-[#f87171]/50';
                if (isSelected && isCorrect) borderStyle = 'border-[#34d399]/50';
                if (!isSelected && isCorrect && selectedOption !== null) borderStyle = 'border-[#34d399]/50';

                return (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedOption(i)}
                    className={`w-full text-left bg-[#0a0b14] border ${borderStyle} rounded-[10px] px-4 py-3 flex items-center gap-3 hover:border-[#6C7CFF]/30 transition-all duration-200 group`}
                  >
                    <span className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${
                      isSelected && isCorrect
                        ? 'bg-[#34d399]/15 text-[#34d399]'
                        : isSelected && !isCorrect
                        ? 'bg-[#f87171]/15 text-[#f87171]'
                        : 'bg-[#1a1b2e] text-[#8b8fa3] group-hover:bg-[#6C7CFF]/10 group-hover:text-[#6C7CFF]'
                    }`}>
                      {isSelected && isCorrect ? '✓' : isSelected && !isCorrect ? '✗' : opt.label}
                    </span>
                    <span className={`text-[13px] ${isSelected && isCorrect ? 'text-[#34d399]' : isSelected && !isCorrect ? 'text-[#f87171]' : 'text-[#8b8fa3] group-hover:text-[#e8eaf0]'}`}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer reveal */}
            {selectedOption !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#34d399]/5 border border-[#34d399]/20 rounded-[10px] p-3.5 mb-5"
              >
                <p className="text-[11px] text-[#34d399] font-medium mb-1">正确答案：C</p>
                <p className="text-[11px] text-[#8b8fa3] leading-[1.6]">反复抄写笔记属于机械记忆，不属于费曼技巧的核心步骤。费曼技巧强调的是「以教代学」——用简单语言解释概念，发现知识缺口后重新学习。</p>
              </motion.div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="text-[12px] text-[#8b8fa3] hover:text-white bg-[#0a0b14] border border-white/[0.06] rounded-[8px] px-3.5 py-2 flex items-center gap-1.5 transition-colors">
                  <Lightbulb size={12} />
                  逐步提示
                </button>
                <button className="text-[12px] text-[#8b8fa3] hover:text-white bg-[#0a0b14] border border-white/[0.06] rounded-[8px] px-3.5 py-2 flex items-center gap-1.5 transition-colors">
                  <PenTool size={12} />
                  生成同类题
                </button>
              </div>
              <button
                onClick={() => setSelectedOption(null)}
                className="text-[12px] text-[#6C7CFF] hover:text-white flex items-center gap-1 transition-colors"
              >
                下一题
                <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════ 7. Review Timeline ═══════════════════════ */}
      <Section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">复习计划时间线</h2>
              <p className="text-[15px] text-[#8b8fa3]">AI 动态调整，让每一天都花在刀刃上</p>
            </div>
            <button className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#6C7CFF] bg-[#6C7CFF]/10 border border-[rgba(108,124,255,0.2)] rounded-[8px] px-3.5 py-2 hover:bg-[#6C7CFF]/15 transition-colors">
              <Zap size={12} />
              智能调整计划
            </button>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-white/[0.06]" />

            <div className="space-y-0">
              {timelineItems.map((item, i) => {
                const dotColor =
                  item.status === 'completed'
                    ? '#34d399'
                    : item.status === 'today'
                    ? '#6C7CFF'
                    : '#5c5f73';
                const isToday = item.status === 'today';

                return (
                  <motion.div
                    key={item.date + item.task}
                    variants={fadeUp}
                    custom={i}
                    className="flex items-start gap-4 relative pb-6 last:pb-0"
                  >
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div
                        className={`w-[10px] h-[10px] rounded-full border-2 ${isToday ? 'shadow-[0_0_8px_rgba(108,124,255,0.5)]' : ''}`}
                        style={{
                          backgroundColor: item.status === 'future' ? 'transparent' : dotColor,
                          borderColor: dotColor,
                        }}
                      />
                      {isToday && (
                        <div className="absolute inset-0 w-[10px] h-[10px] rounded-full bg-[#6C7CFF] animate-ping opacity-30" />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 rounded-[12px] p-4 transition-all duration-300 ${
                        isToday
                          ? 'bg-[#6C7CFF]/8 border border-[rgba(108,124,255,0.2)]'
                          : 'bg-[#12131f] border border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium" style={{ color: dotColor }}>
                          {item.date}
                          {isToday && <span className="ml-2 text-[10px] bg-[#6C7CFF]/15 text-[#6C7CFF] px-1.5 py-0.5 rounded-[4px]">今天</span>}
                        </span>
                        <span className="text-[10px] text-[#5c5f73] flex items-center gap-1">
                          <Clock size={10} />
                          {item.duration}
                        </span>
                      </div>
                      <p className={`text-[13px] font-medium ${item.status === 'completed' ? 'text-[#5c5f73]' : 'text-[#e8eaf0]'}`}>
                        {item.task}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════ 8. Bottom CTA ═══════════════════════ */}
      <Section className="py-28 px-6 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#6C7CFF] opacity-[0.06] blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[300px] rounded-full bg-[#7C5CFF] opacity-[0.05] blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[300px] rounded-full bg-[#4FD1C5] opacity-[0.04] blur-[80px]" />
        </div>

        <motion.div variants={fadeUp} className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-[36px] sm:text-[42px] font-bold tracking-tight text-[#e8eaf0] mb-4 leading-[1.2]">
            把复习从混乱，<br />变成有序。
          </h2>
          <p className="text-[16px] text-[#8b8fa3] leading-[1.7] mb-10 max-w-[440px] mx-auto">
            6 个 AI Agent 全程协作，从资料到记忆，每一步都有智能守护。现在开始，让期末不再焦虑。
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[15px] font-semibold rounded-[12px] px-9 py-3.5 hover:shadow-[0_0_32px_rgba(108,124,255,0.4)] transition-shadow duration-300"
          >
            开始我的期末复习
          </button>
        </motion.div>
      </Section>

      {/* ═══════════════════════ Footer ═══════════════════════ */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[6px] bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">UF</span>
              </div>
              <span className="text-[12px] text-[#5c5f73]">UniFlow</span>
            </div>
            <div className="flex items-center gap-4">
              {['首页', '功能', '关于', '帮助'].map((link) => (
                <a key={link} href="#" className="text-[12px] text-[#5c5f73] hover:text-[#8b8fa3] transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-[#5c5f73]">© 2026 UniFlow. 保留所有权利。</span>
        </div>
      </footer>
    </div>
  );
}
