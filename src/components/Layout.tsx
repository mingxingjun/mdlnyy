import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadModelSettings } from '@/lib/models/api';
import { useMemo } from 'react';

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
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
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
    <div className="flex h-screen bg-[#0A2540] font-sans overflow-hidden">
      {/* ── 侧边栏 ── */}
      <aside className="sidebar w-[240px] flex-shrink-0 flex flex-col bg-[#0A2540] border-r border-white/[0.08]">
        {/* Logo */}
        <div className="sidebar-logo px-5 h-16 flex items-center flex-shrink-0 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-[#635BFF] to-[#7C5CFF] rounded-[8px] flex items-center justify-center shadow-lg shadow-[#635BFF]/20">
              <span className="text-white text-[10px] font-bold">UF</span>
            </div>
            <span className="font-semibold text-[14px] text-white tracking-tight">UniFlow</span>
          </div>
        </div>

        {/* 导航区 */}
        <div className="sidebar-nav px-3 pt-4 pb-2 flex-1">
          <p className="sidebar-label px-3 mb-2 text-[11px] font-medium text-[#6b7c93] uppercase tracking-wider">导航</p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#635BFF]/15 to-[#7C5CFF]/10 text-white border-l-2 border-[#635BFF] pl-[10px] shadow-sm shadow-[#635BFF]/10'
                      : 'text-[#a3b5cc] hover:bg-white/[0.04] hover:text-white'
                  }`
                }
              >
                <item.icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 底部：模型指示器 */}
        <div className="sidebar-footer px-3 pb-3 pt-2 border-t border-white/[0.08]">
          <button
            onClick={() => navigate('/ai-engine?tab=settings')}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[10px] text-[12px] text-[#a3b5cc] hover:bg-white/[0.04] hover:text-white transition-all duration-150"
          >
            <Cpu size={14} strokeWidth={1.8} />
            <span className="flex-1 text-left truncate">{providerDisplay}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D924] flex-shrink-0 shadow-sm shadow-[#00D924]/50" />
          </button>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 页面标题 */}
        <div className="px-4 lg:px-8 pt-5 lg:pt-7 pb-3 flex-shrink-0 bg-[#0A2540] border-b border-white/[0.08]">
          <h1 className="text-[16px] lg:text-[18px] font-semibold text-white">{current.title}</h1>
          <p className="text-[11px] lg:text-[12px] text-[#6b7c93] mt-0.5">{current.subtitle}</p>
        </div>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto px-4 lg:px-8 py-4 lg:py-6 bg-[#0A2540] pb-20 lg:pb-6">
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
