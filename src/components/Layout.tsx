import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadModelSettings } from '@/lib/models/api';
import { useMemo } from 'react';
import CosmicBackground from './CosmicBackground';
import CursorGlow from './CursorGlow';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/ai-engine', icon: Brain, label: 'AI 冲刺核' },
  { path: '/my-notes', icon: NotebookPen, label: '我的笔记' },
  { path: '/flow-chamber', icon: Headphones, label: '沉浸流' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '仪表盘', subtitle: '倒计时 · 进度 · 热力图' },
  '/ai-engine': { title: 'AI 冲刺核', subtitle: '6 Agent 协作 · 模型配置' },
  '/my-notes': { title: '我的笔记', subtitle: '上传 · 整理 · 复习' },
  '/flow-chamber': { title: '沉浸流', subtitle: '番茄钟 · 白噪音 · 自习室' },
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.98,
    filter: 'blur(6px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const modelSettings = useMemo(() => loadModelSettings(), []);
  const activeProvider = modelSettings.activeProvider;

  const providerDisplay = useMemo(() => {
    switch (activeProvider) {
      case 'deepseek': return 'DeepSeek';
      case 'ollama': return '本地模型';
      case 'openai': return 'OpenAI';
      case 'custom': return '自定义';
      default: return 'DeepSeek';
    }
  }, [activeProvider]);

  const current = pageTitles[location.pathname] || pageTitles['/dashboard'];

  return (
    <div className="flex h-screen bg-[#050f1e] font-sans overflow-hidden relative">
      <CosmicBackground />
      <CursorGlow />

      {/* ── 侧边栏 ── */}
      <aside className="sidebar w-[240px] flex-shrink-0 flex flex-col glass-card border-r border-white/[0.06] z-10 backdrop-blur-xl">
        {/* Logo */}
        <div className="sidebar-logo px-5 h-16 flex items-center flex-shrink-0 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-[#635BFF] via-[#7C5CFF] to-[#00D4FF] rounded-[10px] flex items-center justify-center shadow-lg shadow-[#635BFF]/30">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF] to-[#00D4FF] rounded-[10px] blur-md opacity-40 -z-10 animate-pulse" />
            </div>
            <span className="font-semibold text-[15px] gradient-text tracking-tight">UniFlow</span>
          </div>
        </div>

        {/* 导航区 */}
        <div className="sidebar-nav px-3 pt-4 pb-2 flex-1">
          <p className="sidebar-label px-3 mb-2 text-[11px] font-medium text-[#6b7c93] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#635BFF]" />
            知识宇宙
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item, idx) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#635BFF]/20 via-[#7C5CFF]/10 to-transparent text-white shadow-lg shadow-[#635BFF]/10 border border-[#635BFF]/20'
                        : 'text-[#a3b5cc] hover:bg-white/[0.04] hover:text-white border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#635BFF] to-[#00D4FF] rounded-r-full" />
                      )}
                      <item.icon size={18} strokeWidth={1.8} className={isActive ? 'drop-shadow-[0_0_8px_rgba(99,91,255,0.6)]' : ''} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.8)] animate-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* 底部：模型指示器 */}
        <div className="sidebar-footer px-3 pb-3 pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => navigate('/ai-engine?tab=settings')}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[12px] text-[12px] text-[#a3b5cc] hover:bg-white/[0.04] hover:text-white transition-all duration-200 group"
          >
            <div className="relative">
              <Cpu size={14} strokeWidth={1.8} className="group-hover:text-[#635BFF] transition-colors" />
              <div className="absolute inset-0 bg-[#00D924] blur-sm opacity-50" />
            </div>
            <span className="flex-1 text-left truncate">{providerDisplay}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D924] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D924] shadow-[0_0_6px_rgba(0,217,36,0.8)]" />
            </span>
          </button>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* 页面标题 */}
        <div className="px-4 lg:px-8 pt-5 lg:pt-7 pb-4 flex-shrink-0 border-b border-white/[0.06] glass-card">
          <motion.h1
            key={current.title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[18px] lg:text-[20px] font-semibold text-white flex items-center gap-2"
          >
            {current.title}
            <div className="h-4 w-[1px] bg-gradient-to-b from-[#635BFF] to-transparent" />
          </motion.h1>
          <motion.p
            key={current.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-[11px] lg:text-[12px] text-[#6b7c93] mt-1 flex items-center gap-1.5"
          >
            <span className="w-1 h-1 rounded-full bg-[#635BFF]/60" />
            {current.subtitle}
          </motion.p>
        </div>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto px-4 lg:px-8 py-4 lg:py-6 pb-20 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
