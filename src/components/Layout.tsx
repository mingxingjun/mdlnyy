import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Cpu, Sparkles, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadModelSettings } from '@/lib/models/api';
import { useMemo } from 'react';
import CosmicUniverse from './CosmicUniverse';
import CursorGlow from './CursorGlow';
import ErrorBoundary from './ErrorBoundary';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘', desc: '学习驾驶舱' },
  { path: '/ai-engine', icon: Brain, label: 'AI 冲刺核', desc: 'Agent 协作' },
  { path: '/my-notes', icon: NotebookPen, label: '我的笔记', desc: '知识星图' },
  { path: '/flow-chamber', icon: Headphones, label: '沉浸流', desc: '深度专注' },
];

const pageTitles: Record<string, { title: string; subtitle: string; icon: any }> = {
  '/dashboard': { title: '学习驾驶舱', subtitle: '你的知识宇宙控制台', icon: Rocket },
  '/ai-engine': { title: 'AI 冲刺核', subtitle: '5 Agent 协同作战 · 激发无限算力', icon: Brain },
  '/my-notes': { title: '知识星图', subtitle: '上传 · 整理 · 连接知识点', icon: NotebookPen },
  '/flow-chamber': { title: '沉浸流空间', subtitle: '番茄钟 · 白噪音 · 进入超空间', icon: Headphones },
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    rotateX: 10,
    scale: 0.96,
    filter: 'blur(12px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    rotateX: -5,
    scale: 0.98,
    filter: 'blur(8px)',
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const modelSettings = useMemo(() => loadModelSettings(), []);
  const activeProvider = modelSettings.activeProvider;

  const providerDisplay = useMemo(() => {
    switch (activeProvider) {
      case 'deepseek': return 'DeepSeek 在线';
      case 'ollama': return '本地模型';
      case 'openai': return 'OpenAI';
      case 'custom': return '自定义接口';
      default: return 'DeepSeek 在线';
    }
  }, [activeProvider]);

  const current = pageTitles[location.pathname] || pageTitles['/dashboard'];
  const CurrentIcon = current.icon;

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#010308' }}>
      <ErrorBoundary fallback={
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 40%, #0a1830 0%, #030a18 45%, #010308 100%),
              radial-gradient(ellipse 70% 50% at 15% 35%, rgba(99, 91, 255, 0.1) 0%, transparent 55%),
              radial-gradient(ellipse 55% 45% at 85% 65%, rgba(0, 212, 255, 0.08) 0%, transparent 55%)
            `
          }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20px 30px, #eee, transparent),
              radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
              radial-gradient(1px 1px at 90px 40px, #fff, transparent),
              radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
              radial-gradient(1px 1px at 230px 80px, #fff, transparent),
              radial-gradient(2px 2px at 300px 150px, rgba(168,180,255,0.8), transparent)
            `,
            backgroundSize: '350px 200px',
            animation: 'twinkle 8s ease-in-out infinite',
          }} />
        </div>
      }>
        <CosmicUniverse />
      </ErrorBoundary>
      <CursorGlow />

      {/* ── 侧边栏 ── */}
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sidebar w-[260px] flex-shrink-0 flex flex-col z-20 relative"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 20, 40, 0.85) 0%, rgba(5, 12, 25, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(99, 91, 255, 0.12)',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.5), inset -1px 0 0 rgba(99, 91, 255, 0.08)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-px h-full"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.3) 30%, rgba(99, 91, 255, 0.3) 70%, transparent)',
          }}
        />

        {/* Logo */}
        <div
          className="sidebar-logo px-5 h-20 flex items-center flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(99,91,255,0.08) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #635BFF 0%, #7C5CFF 50%, #00D4FF 100%)',
                  boxShadow: '0 8px 32px rgba(99, 91, 255, 0.4), 0 0 60px rgba(99, 91, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <Sparkles size={20} className="text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl -z-10"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'linear-gradient(135deg, #635BFF, #00D4FF)',
                  filter: 'blur(12px)',
                }}
              />
            </motion.div>
            <div className="flex flex-col">
              <span
                className="font-bold text-[18px] tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #ffffff, #a8b4ff, #ffffff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 40px rgba(99,91,255,0.3)',
                }}
              >
                UniFlow
              </span>
              <span className="text-[9px] text-[#6b7c93] tracking-[0.2em] uppercase font-medium">知识宇宙</span>
            </div>
          </div>
        </div>

        {/* 导航区 */}
        <div className="sidebar-nav px-4 pt-5 pb-2 flex-1 overflow-y-auto">
          <p
            className="sidebar-label px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center gap-2"
            style={{ color: 'rgba(107, 124, 147, 0.8)' }}
          >
            <span className="w-5 h-[1px] bg-gradient-to-r from-[#635BFF] to-transparent" />
            导航
          </p>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item, idx) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.08, duration: 0.5, ease: 'easeOut' }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group overflow-hidden ${
                      isActive
                        ? 'text-white'
                        : 'text-[#8899b4] hover:text-white'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, rgba(99,91,255,0.2) 0%, rgba(0,212,255,0.08) 100%)',
                          border: '1px solid rgba(99,91,255,0.3)',
                          boxShadow: '0 8px 32px rgba(99,91,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                          transform: 'translateX(4px) scale(1.02)',
                        }
                      : {
                          border: '1px solid transparent',
                        }
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <>
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full"
                            style={{
                              background: 'linear-gradient(180deg, #635BFF, #00D4FF)',
                              boxShadow: '0 0 20px rgba(99,91,255,0.6)',
                            }}
                          />
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                              animation: 'shimmer 2s infinite',
                            }}
                          />
                        </>
                      )}
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 ${isActive ? '' : 'group-hover:bg-white/[0.06]'}`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(99,91,255,0.3), rgba(0,212,255,0.2))',
                          boxShadow: '0 0 20px rgba(99,91,255,0.3)',
                        } : {}}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.8}
                          style={isActive ? { filter: 'drop-shadow(0 0 8px rgba(99,91,255,0.8))' } : {}}
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span>{item.label}</span>
                        <span className={`text-[10px] ${isActive ? 'text-[#a8b4ff]' : 'text-[#4a5a74] group-hover:text-[#6b7c93]'} transition-colors`}>
                          {item.desc}
                        </span>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: '#00D4FF',
                            boxShadow: '0 0 12px #00D4FF, 0 0 24px rgba(0,212,255,0.5)',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* 底部：模型指示器 */}
        <div
          className="sidebar-footer px-4 pb-4 pt-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(0deg, rgba(99,91,255,0.05) 0%, transparent 100%)',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/ai-engine?tab=settings')}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-[12px] transition-all duration-300 group"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#a3b5cc',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,91,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(99,91,255,0.2)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,91,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="relative">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,217,36,0.15), rgba(0,212,255,0.1))',
                  border: '1px solid rgba(0,217,36,0.2)',
                }}
              >
                <Cpu size={14} strokeWidth={1.8} style={{ color: '#00D924', filter: 'drop-shadow(0 0 6px rgba(0,217,36,0.5))' }} />
              </div>
              <motion.div
                className="absolute inset-0 rounded-lg -z-10"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: '#00D924', filter: 'blur(8px)' }}
              />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-white font-medium text-[13px]">{providerDisplay}</span>
              <span className="text-[10px] text-[#4a5a74]">引擎已就绪 · 全系统正常</span>
            </div>
            <div className="relative flex h-2.5 w-2.5">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: '#00D924' }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{
                  background: '#00D924',
                  boxShadow: '0 0 10px #00D924, 0 0 20px rgba(0,217,36,0.5)',
                }}
              />
            </div>
          </motion.button>
        </div>
      </motion.aside>

      {/* ── 主内容区 ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* 页面标题 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="px-6 lg:px-10 pt-6 lg:pt-8 pb-5 flex-shrink-0 relative"
          style={{
            background: 'linear-gradient(180deg, rgba(10,20,40,0.6) 0%, rgba(5,12,25,0.3) 100%)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(99,91,255,0.08)',
          }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              key={current.title + '-icon'}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
              className="relative"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,91,255,0.2), rgba(0,212,255,0.1))',
                  border: '1px solid rgba(99,91,255,0.25)',
                  boxShadow: '0 8px 32px rgba(99,91,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <CurrentIcon size={22} style={{ color: '#a8b4ff', filter: 'drop-shadow(0 0 8px rgba(99,91,255,0.5))' }} />
              </div>
            </motion.div>
            <div className="flex flex-col">
              <motion.h1
                key={current.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-[22px] lg:text-[26px] font-bold text-white tracking-tight"
                style={{
                  textShadow: '0 2px 20px rgba(99,91,255,0.3)',
                }}
              >
                {current.title}
              </motion.h1>
              <motion.p
                key={current.subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-[12px] lg:text-[13px] mt-0.5 flex items-center gap-2"
                style={{ color: 'rgba(163, 181, 204, 0.8)' }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#635BFF', boxShadow: '0 0 8px #635BFF' }} />
                {current.subtitle}
              </motion.p>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(99,91,255,0.3), transparent)',
            }}
          />
        </motion.div>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto px-6 lg:px-10 py-6 lg:py-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
