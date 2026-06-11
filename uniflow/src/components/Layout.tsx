import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Brain, NotebookPen, Headphones, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '高光仪表盘', color: 'neon-blue' },
  { path: '/ai-engine', icon: Brain, label: 'AI 冲刺核', color: 'neon-purple' },
  { path: '/my-notes', icon: NotebookPen, label: '我的笔记', color: 'neon-green' },
  { path: '/flow-chamber', icon: Headphones, label: '沉浸流空间', color: 'neon-purple' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '高光仪表盘', subtitle: '考试倒计时 · 心流统计 · 进度追踪' },
  '/ai-engine': { title: 'AI 冲刺核', subtitle: '上传教材，AI 自动提取考点' },
  '/my-notes': { title: '我的笔记', subtitle: '上传、整理、复习你的学习笔记' },
  '/flow-chamber': { title: '沉浸流空间', subtitle: '番茄钟 · 白噪音 · 虚拟自习室' },
};

export default function Layout() {
  const location = useLocation();
  const subjects = useAppStore((s) => s.subjects);

  const nearestExam = useMemo(() => {
    const now = new Date().getTime();
    const futureExams = subjects
      .map((s) => ({ name: s.name, date: new Date(s.examDate + 'T00:00:00').getTime() }))
      .filter((e) => e.date > now)
      .sort((a, b) => a.date - b.date);
    if (futureExams.length === 0) return null;
    const days = Math.ceil((futureExams[0].date - now) / (1000 * 60 * 60 * 24));
    return { name: futureExams[0].name, days };
  }, [subjects]);

  const current = pageTitles[location.pathname] || pageTitles['/dashboard'];

  return (
    <div className="flex h-screen bg-dark-900 font-body">
      {/* 侧边栏 */}
      <aside className="w-[72px] lg:w-[220px] flex-shrink-0 border-r border-white/5 flex flex-col bg-dark-900/80">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="font-display font-bold text-white text-sm">U</span>
          </div>
          <span className="hidden lg:block font-display font-bold text-lg text-white tracking-tight">
            UniFlow
          </span>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? `bg-white/5 ${
                        item.color === 'neon-blue'
                          ? 'text-neon-blue'
                          : item.color === 'neon-purple'
                          ? 'text-neon-purple'
                          : 'text-neon-green'
                      }`
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    className={isActive ? 'drop-shadow-[0_0_8px_currentColor]' : ''}
                  />
                  <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-current"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部用户区 */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-zinc-300 font-medium">同学小张</p>
              <p className="text-xs text-zinc-600">积分: 128</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0 bg-dark-900/50 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-display font-semibold text-white">{current.title}</h2>
            <p className="text-xs text-zinc-500">
              {nearestExam
                ? `${nearestExam.name} 距考试还有 ${nearestExam.days} 天`
                : '暂无即将到来的考试'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell size={18} className="text-zinc-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-neon-pink rounded-full" />
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
