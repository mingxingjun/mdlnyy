import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  PenTool,
  CalendarCheck,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Zap,
  ChevronRight,
  Menu,
  X,
  GitBranch,
  Sparkles,
  Clock,
  Target,
  BarChart3,
  CheckCircle2,
  Lightbulb,
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

const orbitalAgents = [
  { emoji: '📚', name: '资料整理 Agent', color: '#6C7CFF', icon: FileText },
  { emoji: '📝', name: '题目生成 Agent', color: '#7C5CFF', icon: PenTool },
  { emoji: '🔍', name: '错题分析 Agent', color: '#4FD1C5', icon: AlertCircle },
  { emoji: '📅', name: '计划管理 Agent', color: '#fbbf24', icon: CalendarCheck },
  { emoji: '🧠', name: '记忆强化 Agent', color: '#34d399', icon: Brain },
  { emoji: '💬', name: '答疑 Agent', color: '#f87171', icon: MessageSquare },
];

const workflowSteps = [
  { emoji: '📥', name: '导入资料', desc: '上传课件、笔记、PDF', status: '已完成' as const },
  { emoji: '🔍', name: '提取重点', desc: 'AI 自动提炼核心知识', status: '已完成' as const },
  { emoji: '📝', name: '生成题库', desc: '根据重点智能出题', status: '进行中' as const },
  { emoji: '🔍', name: '错题诊断', desc: '分析错误模式与薄弱点', status: '进行中' as const },
  { emoji: '📅', name: '复习计划', desc: '智能安排复习节奏', status: '待执行' as const },
  { emoji: '🧠', name: '强化记忆', desc: '间隔重复巩固记忆', status: '待执行' as const },
];

const statusConfig = {
  '已完成': { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
  '进行中': { color: '#6C7CFF', bg: 'rgba(108,124,255,0.1)', border: 'rgba(108,124,255,0.2)' },
  '待执行': { color: '#5c5f73', bg: 'rgba(92,95,115,0.1)', border: 'rgba(92,95,115,0.15)' },
};

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0b14] font-sans text-[#e8eaf0] antialiased overflow-x-hidden">

      {/* ═══════════════════════ 1. 导航栏 ═══════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0b14]/70 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_12px_rgba(108,124,255,0.3)]">
              <span className="text-white text-[11px] font-bold tracking-tight">UF</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#e8eaf0]">UniFlow</span>
          </div>

          {/* Center: Nav Links (desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {['功能', '关于', '常见问题'].map((link) => (
              <a
                key={link}
                href={`#${link}`}
                className="text-[13px] text-[#8b8fa3] hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Right: Actions (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-[13px] text-[#8b8fa3] hover:text-white transition-colors duration-200 px-4 py-2">
              登录
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[13px] font-medium rounded-[10px] px-5 py-2 hover:shadow-[0_0_20px_rgba(108,124,255,0.3)] transition-shadow duration-300"
            >
              开始使用
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#1a1b2e] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={18} className="text-[#8b8fa3]" /> : <Menu size={18} className="text-[#8b8fa3]" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden border-t border-white/[0.06] bg-[#0a0b14]/95 backdrop-blur-xl px-6 py-4 space-y-3"
          >
            {['功能', '关于', '常见问题'].map((link) => (
              <a
                key={link}
                href={`#${link}`}
                className="block text-[14px] text-[#8b8fa3] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button className="text-[13px] text-[#8b8fa3] hover:text-white px-4 py-2">登录</button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[13px] font-medium rounded-[10px] px-5 py-2"
              >
                开始使用
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ═══════════════════════ 2. Hero Section ═══════════════════════ */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#6C7CFF] opacity-[0.15] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#4FD1C5] opacity-[0.10] blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-[#7C5CFF] opacity-[0.08] blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          {/* Left: Text (55%) */}
          <motion.div
            className="flex-[55] max-w-[600px]"
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
              className="text-[52px] font-bold tracking-tight leading-[1.1] text-[#e8eaf0] mb-5"
            >
              期末复习，<br />不再一个人硬扛。
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[17px] text-[#8b8fa3] leading-[1.7] mb-8 max-w-[520px]"
            >
              6 个 AI Agent 帮你拆解资料、提炼重点、出题练习、诊断错题、管理计划、强化记忆——一套闭环，全程协作。
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[14px] font-medium rounded-[12px] px-8 py-3.5 shadow-[0_4px_16px_rgba(108,124,255,0.3)] hover:shadow-[0_4px_24px_rgba(108,124,255,0.45)] transition-shadow duration-300"
              >
                立即开始复习
              </button>
              <button
                onClick={() => {
                  document.getElementById('功能')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-white/[0.1] text-[#8b8fa3] hover:text-white hover:border-[#6C7CFF]/30 rounded-[12px] px-8 py-3.5 text-[14px] transition-all duration-300"
              >
                查看协作流程 →
              </button>
            </motion.div>
          </motion.div>

          {/* Right: Multi-Agent Orbital Visualization (45%) */}
          <motion.div
            className="flex-[45] relative w-full max-w-[480px] aspect-square hidden sm:block"
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

            {/* Central pulsing circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-[88px] h-[88px] rounded-full bg-[#12131f] border border-[rgba(108,124,255,0.3)] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(108,124,255,0.15)] animate-[pulse-glow_3s_ease-in-out_infinite]">
                <Zap size={18} className="text-[#6C7CFF] mb-0.5" />
                <span className="text-[10px] font-medium text-[#8b8fa3]">任务核心</span>
              </div>
              {/* Pulsing glow */}
              <div className="absolute inset-0 rounded-full bg-[#6C7CFF]/10 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>

            {/* Agent nodes */}
            {orbitalAgents.map((agent, i) => {
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
                  <div className="bg-[#12131f]/80 backdrop-blur border border-white/[0.06] rounded-[12px] px-3 py-2 flex items-center gap-2 hover:border-[rgba(108,124,255,0.3)] hover:shadow-[0_0_16px_rgba(108,124,255,0.08)] transition-all duration-300 cursor-default min-w-[130px]">
                    <div
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${agent.color}18` }}
                    >
                      <Icon size={12} style={{ color: agent.color }} />
                    </div>
                    <span className="text-[11px] font-medium text-[#e8eaf0] whitespace-nowrap">{agent.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Mobile: simplified 6 dots in a row */}
          <div className="sm:hidden flex items-center justify-center gap-3 w-full mt-4">
            {orbitalAgents.map((agent) => (
              <div
                key={agent.name}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-white/[0.06]"
                style={{ backgroundColor: `${agent.color}12` }}
                title={agent.name}
              >
                <span className="text-[14px]">{agent.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 3. Stats Section (核心能力速览) ═══════════════════════ */}
      <Section className="py-16 px-6" id="功能">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">核心能力速览</h2>
            <p className="text-[15px] text-[#8b8fa3]">数据驱动的智能复习，效果看得见</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, label: '今日平均完成率', value: 92, suffix: '%', trend: '↑8%', trendUp: true, color: '#6C7CFF' },
              { icon: TrendingUp, label: '平均提升掌握度', value: 40, suffix: '%', trend: '↑12%', trendUp: true, color: '#7C5CFF' },
              { icon: BarChart3, label: '已生成练习题', value: 120, suffix: '万+', trend: '↑23%', trendUp: true, color: '#4FD1C5' },
              { icon: Zap, label: '活跃 Agent 数量', value: 6, suffix: '', trend: '全部在线', trendUp: true, color: '#34d399' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i}
                className="bg-[#12131f] border border-white/[0.06] rounded-[24px] p-6 hover:border-[#6C7CFF]/30 hover:shadow-[0_0_24px_rgba(108,124,255,0.1)] transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <span className="text-[12px] font-medium text-[#34d399] flex items-center gap-0.5">
                    {stat.trendUp && <TrendingUp size={11} />}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[12px] text-[#5c5f73] mb-1">{stat.label}</p>
                <p className="text-[32px] font-bold tracking-tight text-[#e8eaf0]">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════ 4. Agent Workflow Section ═══════════════════════ */}
      <Section className="py-20 px-6" id="关于">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">六步协作，闭环复习</h2>
            <p className="text-[15px] text-[#8b8fa3]">从资料导入到记忆强化，六个 Agent 各司其职，无缝衔接</p>
          </motion.div>

          {/* Desktop: horizontal flow */}
          <div className="hidden lg:flex items-start justify-center gap-2">
            {workflowSteps.map((step, i) => (
              <motion.div key={step.name} variants={fadeUp} custom={i} className="flex items-start">
                <div className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-5 w-[170px] hover:border-[rgba(108,124,255,0.3)] hover:shadow-[0_0_16px_rgba(108,124,255,0.08)] transition-all duration-300 group">
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
                  <p className="text-[11px] text-[#8b8fa3] leading-[1.6]">{step.desc}</p>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="flex items-center self-center mx-1">
                    <ChevronRight size={20} className="text-[#5c5f73]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Tablet/Mobile: vertical stack */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workflowSteps.map((step, i) => (
              <motion.div key={step.name} variants={fadeUp} custom={i}>
                <div className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-5 flex items-start gap-4 hover:border-[rgba(108,124,255,0.3)] transition-all duration-300">
                  <span className="text-[24px] flex-shrink-0">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[14px] font-semibold text-[#e8eaf0]">{step.name}</span>
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
                    <p className="text-[12px] text-[#8b8fa3]">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════ 5. Feature Highlights (特色亮点) ═══════════════════════ */}
      <Section className="py-20 px-6" id="常见问题">
        <div className="max-w-7xl mx-auto space-y-24">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-[32px] font-bold tracking-tight text-[#e8eaf0] mb-3">特色亮点</h2>
            <p className="text-[15px] text-[#8b8fa3]">三大核心能力，让复习更智能</p>
          </motion.div>

          {/* Feature 1: 知识图谱 — text left, visual right */}
          <motion.div variants={fadeUp} custom={0} className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-[480px]">
              <div className="inline-flex items-center gap-2 bg-[#6C7CFF]/10 border border-[rgba(108,124,255,0.2)] rounded-full px-3 py-1 mb-4">
                <GitBranch size={12} className="text-[#6C7CFF]" />
                <span className="text-[11px] text-[#6C7CFF] font-medium">知识图谱</span>
              </div>
              <h3 className="text-[28px] font-bold tracking-tight text-[#e8eaf0] mb-4">概念关联一目了然</h3>
              <p className="text-[15px] text-[#8b8fa3] leading-[1.7]">
                AI 自动构建学科知识图谱，将零散知识点串联成网络。一眼看清概念间的依赖关系，精准定位薄弱环节，让复习不再盲目。
              </p>
            </div>
            <div className="flex-1 max-w-[440px] w-full">
              <div className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-6 relative overflow-hidden min-h-[300px]">
                {/* Simulated graph visualization */}
                <div className="relative w-full h-[260px]">
                  {/* Central node */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full bg-[#6C7CFF]/15 border border-[#6C7CFF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(108,124,255,0.15)]">
                      <span className="text-[10px] font-medium text-[#6C7CFF]">微积分</span>
                    </div>
                  </div>
                  {/* Surrounding nodes */}
                  {[
                    { label: '极限', x: '15%', y: '18%', color: '#7C5CFF', size: 'w-11 h-11' },
                    { label: '导数', x: '78%', y: '12%', color: '#4FD1C5', size: 'w-12 h-12' },
                    { label: '积分', x: '85%', y: '58%', color: '#6C7CFF', size: 'w-13 h-13' },
                    { label: '级数', x: '68%', y: '85%', color: '#fbbf24', size: 'w-11 h-11' },
                    { label: '微分方程', x: '12%', y: '75%', color: '#f87171', size: 'w-12 h-12' },
                    { label: '多元函数', x: '5%', y: '46%', color: '#34d399', size: 'w-11 h-11' },
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
                        <span className="text-[9px] font-medium" style={{ color: node.color }}>{node.label}</span>
                      </div>
                    </div>
                  ))}
                  {/* Connection lines (SVG) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
                    <line x1="50%" y1="50%" x2="20%" y2="22%" stroke="#7C5CFF" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="82%" y2="18%" stroke="#4FD1C5" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="89%" y2="62%" stroke="#6C7CFF" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="72%" y2="88%" stroke="#fbbf24" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="16%" y2="78%" stroke="#f87171" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="#34d399" strokeWidth="1" />
                    {/* Cross connections */}
                    <line x1="20%" y1="22%" x2="82%" y2="18%" stroke="#4FD1C5" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="89%" y1="62%" x2="72%" y2="88%" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="16%" y1="78%" x2="10%" y2="50%" stroke="#34d399" strokeWidth="0.5" strokeDasharray="4 4" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: AI 问答 — visual left, text right */}
          <motion.div variants={fadeUp} custom={1} className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 max-w-[480px]">
              <div className="inline-flex items-center gap-2 bg-[#7C5CFF]/10 border border-[rgba(124,92,255,0.2)] rounded-full px-3 py-1 mb-4">
                <MessageSquare size={12} className="text-[#7C5CFF]" />
                <span className="text-[11px] text-[#7C5CFF] font-medium">AI 问答</span>
              </div>
              <h3 className="text-[28px] font-bold tracking-tight text-[#e8eaf0] mb-4">随时提问，即时解答</h3>
              <p className="text-[15px] text-[#8b8fa3] leading-[1.7]">
                遇到不懂的概念？直接向答疑 Agent 提问。它会结合你的知识图谱和学习进度，给出精准、个性化的解答，还能推荐相关练习题加深理解。
              </p>
            </div>
            <div className="flex-1 max-w-[440px] w-full">
              <div className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-6 space-y-4">
                {/* Chat bubble: user */}
                <div className="flex justify-end">
                  <div className="bg-[#6C7CFF]/15 border border-[#6C7CFF]/20 rounded-[16px] rounded-br-[4px] px-4 py-2.5 max-w-[280px]">
                    <p className="text-[12px] text-[#e8eaf0]">什么是条件概率？和联合概率有什么区别？</p>
                  </div>
                </div>
                {/* Chat bubble: AI */}
                <div className="flex justify-start">
                  <div className="bg-[#0a0b14] border border-white/[0.06] rounded-[16px] rounded-bl-[4px] px-4 py-3 max-w-[320px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-[6px] bg-[#7C5CFF]/15 flex items-center justify-center">
                        <Sparkles size={10} className="text-[#7C5CFF]" />
                      </div>
                      <span className="text-[10px] font-medium text-[#7C5CFF]">答疑 Agent</span>
                    </div>
                    <p className="text-[12px] text-[#8b8fa3] leading-[1.6]">
                      条件概率 P(A|B) 是在 B 已发生的前提下 A 发生的概率；联合概率 P(A∩B) 是 A 和 B 同时发生的概率。关系：P(A∩B) = P(A|B) × P(B)
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] text-[#6C7CFF] bg-[#6C7CFF]/10 px-2 py-0.5 rounded-full">相关练习 →</span>
                      <span className="text-[10px] text-[#4FD1C5] bg-[#4FD1C5]/10 px-2 py-0.5 rounded-full">查看图谱 →</span>
                    </div>
                  </div>
                </div>
                {/* Input bar */}
                <div className="flex items-center gap-2 bg-[#0a0b14] border border-white/[0.06] rounded-[12px] px-4 py-2.5">
                  <span className="text-[12px] text-[#5c5f73] flex-1">输入你的问题...</span>
                  <div className="w-7 h-7 rounded-[8px] bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: 智能计划 — text left, visual right */}
          <motion.div variants={fadeUp} custom={2} className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-[480px]">
              <div className="inline-flex items-center gap-2 bg-[#4FD1C5]/10 border border-[rgba(79,209,197,0.2)] rounded-full px-3 py-1 mb-4">
                <CalendarCheck size={12} className="text-[#4FD1C5]" />
                <span className="text-[11px] text-[#4FD1C5] font-medium">智能计划</span>
              </div>
              <h3 className="text-[28px] font-bold tracking-tight text-[#e8eaf0] mb-4">动态调整，精准复习</h3>
              <p className="text-[15px] text-[#8b8fa3] leading-[1.7]">
                计划管理 Agent 根据你的掌握度、遗忘曲线和考试倒计时，动态生成最优复习计划。每天该学什么、学多久，AI 帮你安排得明明白白。
              </p>
            </div>
            <div className="flex-1 max-w-[440px] w-full">
              <div className="bg-[#12131f] border border-white/[0.06] rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[13px] font-semibold text-[#e8eaf0]">复习计划</span>
                  <span className="text-[10px] text-[#4FD1C5] bg-[#4FD1C5]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap size={9} />
                    AI 动态调整
                  </span>
                </div>
                {/* Timeline items */}
                <div className="relative space-y-0">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/[0.06]" />
                  {[
                    { date: '6月10日', task: '高等数学 · 微积分', status: 'completed' as const },
                    { date: '6月11日', task: '线性代数 · 矩阵运算', status: 'completed' as const },
                    { date: '6月12日', task: '概率论 · 随机变量', status: 'today' as const },
                    { date: '6月13日', task: '高等数学 · 级数与积分', status: 'future' as const },
                    { date: '6月14日', task: '综合模拟测试', status: 'future' as const },
                  ].map((item, i) => {
                    const dotColor =
                      item.status === 'completed' ? '#34d399'
                      : item.status === 'today' ? '#6C7CFF'
                      : '#5c5f73';
                    const isToday = item.status === 'today';
                    return (
                      <div key={item.date + item.task} className="flex items-start gap-3 relative pb-4 last:pb-0">
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          <div
                            className="w-[6px] h-[6px] rounded-full mt-[3px]"
                            style={{
                              backgroundColor: item.status === 'future' ? 'transparent' : dotColor,
                              border: `2px solid ${dotColor}`,
                            }}
                          />
                          {isToday && (
                            <div className="absolute inset-0 w-[6px] h-[6px] rounded-full bg-[#6C7CFF] animate-ping opacity-30 mt-[3px]" />
                          )}
                        </div>
                        <div className={`flex-1 rounded-[10px] p-3 ${isToday ? 'bg-[#6C7CFF]/8 border border-[rgba(108,124,255,0.2)]' : 'bg-[#0a0b14] border border-white/[0.04]'}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium" style={{ color: dotColor }}>
                              {item.date}
                              {isToday && <span className="ml-1.5 text-[9px] bg-[#6C7CFF]/15 text-[#6C7CFF] px-1.5 py-0.5 rounded-[3px]">今天</span>}
                            </span>
                            <Clock size={9} className="text-[#5c5f73]" />
                          </div>
                          <p className={`text-[11px] font-medium ${item.status === 'completed' ? 'text-[#5c5f73] line-through' : 'text-[#e8eaf0]'}`}>
                            {item.task}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════ 6. Bottom CTA ═══════════════════════ */}
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
          <p className="text-[16px] text-[#8b8fa3] leading-[1.7] mb-10 max-w-[460px] mx-auto">
            加入数千名大学生，让多 Agent 帮你掌控期末复习
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white text-[15px] font-semibold rounded-[12px] px-9 py-3.5 shadow-[0_4px_16px_rgba(108,124,255,0.3)] hover:shadow-[0_4px_32px_rgba(108,124,255,0.5)] transition-shadow duration-300"
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
              <span className="text-[12px] text-[#5c5f73]">UniFlow © 2026</span>
            </div>
            <div className="flex items-center gap-4">
              {['功能', '关于', '文档'].map((link) => (
                <a key={link} href="#" className="text-[12px] text-[#5c5f73] hover:text-[#8b8fa3] transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
