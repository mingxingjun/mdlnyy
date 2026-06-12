import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Settings, Cpu } from 'lucide-react';
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
    <div className="flex h-screen bg-white font-body overflow-hidden">
      {/* ── 侧边栏 ── */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center flex-shrink-0">
          <span className="font-semibold text-lg text-gray-900">UniFlow</span>
        </div>

        {/* 分割线 */}
        <div className="mx-4 border-t border-gray-100" />

        {/* 导航区 */}
        <div className="px-3 pt-4 pb-2">
          <p className="px-2 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">导航</p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 -ml-[2px] pl-[8px]'
                      : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent -ml-[2px] pl-[8px]'
                  }`
                }
              >
                <item.icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 分割线 */}
        <div className="mx-4 mt-2 border-t border-gray-100" />

        {/* 底部：模型指示器 */}
        <div className="mt-auto px-3 pb-4">
          <button
            onClick={() => navigate('/ai-engine?tab=settings')}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-xs text-gray-500 hover:bg-gray-50 transition-colors duration-150"
          >
            <Cpu size={14} strokeWidth={1.8} />
            <span className="flex-1 text-left truncate">{providerDisplay}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* 页面标题 */}
        <div className="px-8 pt-8 pb-2 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900">{current.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{current.subtitle}</p>
        </div>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
