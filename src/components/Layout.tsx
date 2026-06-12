import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Settings, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';
import { loadModelSettings } from '@/lib/models/api';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘', color: '#00d4ff', colorClass: 'neon-blue' },
  { path: '/ai-engine', icon: Brain, label: 'AI 冲刺核', color: '#8b5cf6', colorClass: 'neon-purple' },
  { path: '/my-notes', icon: NotebookPen, label: '我的笔记', color: '#00ff88', colorClass: 'neon-green' },
  { path: '/flow-chamber', icon: Headphones, label: '沉浸流', color: '#ff0080', colorClass: 'neon-pink' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '仪表盘', subtitle: '倒计时 · 进度 · 热力图' },
  '/ai-engine': { title: 'AI 冲刺核', subtitle: '6 Agent 协作 · 模型配置' },
  '/my-notes': { title: '我的笔记', subtitle: '上传 · 整理 · 复习' },
  '/flow-chamber': { title: '沉浸流', subtitle: '番茄钟 · 白噪音 · 自习室' },
};

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const subjects = useAppStore((s) => s.subjects);

  const modelSettings = useMemo(() => loadModelSettings(), []);
  const activeProvider = modelSettings.activeProvider;

  const providerDisplay = useMemo(() => {
    switch (activeProvider) {
      case 'deepseek': return { label: 'DeepSeek', color: '#00d4ff' };
      case 'ollama': return { label: '本地模型', color: '#00ff88' };
      case 'openai': return { label: 'OpenAI', color: '#8b5cf6' };
      case 'custom': return { label: '自定义', color: '#ff0080' };
      default: return { label: 'DeepSeek', color: '#00d4ff' };
    }
  }, [activeProvider]);

  const current = pageTitles[location.pathname] || pageTitles['/dashboard'];

  return (
    <div className="flex h-screen bg-dark-900 font-body overflow-hidden">
      {/* ── 侧边栏 ── */}
      <aside
        className="w-[72px] flex-shrink-0 flex flex-col items-center border-r border-white/[0.04]"
        style={{ background: 'rgba(14, 14, 22, 0.9)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0, 212, 255, 0.12)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 0 18px rgba(0, 212, 255, 0.2), inset 0 0 12px rgba(0, 212, 255, 0.08)',
            }}
          >
            <span className="font-display font-bold text-sm" style={{ color: '#00d4ff' }}>UF</span>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="group relative flex items-center justify-center"
            >
              {({ isActive }) => (
                <>
                  {/* 悬浮提示 */}
                  <div
                    className="absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex items-center gap-1.5"
                    style={{
                      background: 'rgba(18, 18, 26, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e4e4e7',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  >
                    {item.label}
                    <ChevronRight size={10} style={{ color: item.color }} />
                  </div>

                  {/* 图标按钮 */}
                  <div
                    className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isActive
                        ? `${item.color}15`
                        : 'transparent',
                      boxShadow: isActive
                        ? `0 0 16px ${item.color}20, inset 0 0 12px ${item.color}08`
                        : 'none',
                    }}
                  >
                    <item.icon
                      size={20}
                      className="transition-all duration-200"
                      style={{
                        color: isActive ? item.color : '#52525b',
                        filter: isActive ? `drop-shadow(0 0 6px ${item.color}80)` : 'none',
                      }}
                    />

                    {/* 活跃指示点 */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-dot"
                        className="absolute -right-0.5 top-2 w-1.5 h-1.5 rounded-full"
                        style={{
                          background: item.color,
                          boxShadow: `0 0 6px ${item.color}`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部设置 */}
        <div className="py-4 flex flex-col items-center">
          <NavLink
            to="/ai-engine?tab=settings"
            className="group relative flex items-center justify-center"
          >
            {({ isActive }) => (
              <>
                {/* 悬浮提示 */}
                <div
                  className="absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex items-center gap-1.5"
                  style={{
                    background: 'rgba(18, 18, 26, 0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  设置
                  <ChevronRight size={10} style={{ color: '#71717a' }} />
                </div>

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(113,113,122,0.1)' : 'transparent',
                  }}
                >
                  <Settings
                    size={18}
                    className="transition-colors duration-200"
                    style={{ color: isActive ? '#a1a1aa' : '#3f3f46' }}
                  />
                </div>
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* ── 主区域 ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header
          className="h-16 flex items-center justify-between px-6 flex-shrink-0 border-b border-white/[0.04]"
          style={{
            background: 'rgba(10, 10, 15, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* 左：标题 */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white leading-tight">
              {current.title}
            </h2>
            <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
              {current.subtitle}
            </p>
          </div>

          {/* 右：模型指示器 */}
          <button
            onClick={() => navigate('/ai-engine?tab=settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            title="模型设置"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: providerDisplay.color,
                boxShadow: `0 0 6px ${providerDisplay.color}80`,
              }}
            />
            <span className="text-xs font-medium" style={{ color: providerDisplay.color }}>
              {providerDisplay.label}
            </span>
          </button>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full p-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
