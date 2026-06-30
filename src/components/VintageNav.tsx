import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Pencil, BookOpen, BookX, Layers, BarChart3, Settings, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from './Toast';

type ViewKey = 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor' | 'questionbank';

interface NavItem {
  view: ViewKey;
  label: string;
  icon: ReactNode;
}

interface VintageNavProps {
  onSettingsClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: '首页', icon: <Home size={16} strokeWidth={2} /> },
  { view: 'practice', label: '练习', icon: <Pencil size={16} strokeWidth={2} /> },
  { view: 'questionbank', label: '题库', icon: <BookOpen size={16} strokeWidth={2} /> },
  { view: 'wrongbook', label: '错题本', icon: <BookX size={16} strokeWidth={2} /> },
  { view: 'memory', label: '记忆卡片', icon: <Layers size={16} strokeWidth={2} /> },
  { view: 'supervisor', label: '学习报告', icon: <BarChart3 size={16} strokeWidth={2} /> },
];

export default function VintageNav({ onSettingsClick }: VintageNavProps) {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const addToast = useToastStore((s) => s.addToast);

  // 清除缓存确认：用 useState 管理状态，避免双击确认模式下 ref 同步问题
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    addToast('success', '已清除所有数据');
    setActiveView('dashboard');
  };

  return (
    <header className="relative z-20">
      {/* 顶部装订线 */}
      <div className="h-2 bg-ink-800 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          }}
        />
      </div>

      <nav className="flex items-end justify-between px-3 sm:px-4 md:px-6 pt-0 relative">
        <div className="flex items-center gap-2 sm:gap-2.5 pb-2 pt-2">
          <motion.div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ink-800 text-paper-50 flex items-center justify-center font-brush text-xl sm:text-2xl shadow-md border-2 border-ink-700 flex-shrink-0"
            whileHover={{ rotate: -5 }}
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent)',
            }}
          >
            学
          </motion.div>
          <div className="flex flex-col">
            <h1 className="font-serif text-base sm:text-xl text-ink-800 font-bold tracking-wide leading-tight">
              学习搭子
            </h1>
            <span className="hidden sm:block text-[10px] text-ink-400 font-sans tracking-widest uppercase">
              Study Companion
            </span>
          </div>
        </div>

        <div className="flex items-end gap-0.5 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <motion.button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`relative px-1.5 sm:px-2.5 md:px-3.5 py-2 rounded-b-md border-b-2 border-l border-r transition-colors flex items-center gap-1 sm:gap-1.5 text-sm flex-shrink-0 ${
                  isActive
                    ? 'bg-paper-50 border-ink-600/30 text-ink-900 font-bold shadow-md'
                    : 'bg-paper-200/60 border-ink-600/10 text-ink-600 hover:bg-paper-100/80 hover:text-ink-800'
                }`}
                initial={false}
                animate={{ y: isActive ? 4 : 0 }}
                whileHover={{ y: isActive ? 4 : 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ marginTop: -4, borderTopLeftRadius: '2px', borderTopRightRadius: '2px' }}
              >
                <span className="opacity-80">{item.icon}</span>
                <span className="hidden sm:inline whitespace-nowrap font-serif">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-800"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full ${
                    isActive ? 'bg-ink-700/40' : 'bg-ink-600/10'
                  }`}
                />
              </motion.button>
            );
          })}

          {/* 设置 + 清除缓存按钮组 */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2 pb-0.5">
            {/* 清除缓存：确认/取消按钮模式 */}
            <AnimatePresence mode="wait">
              {confirmClear ? (
                <motion.div
                  key="confirm"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <button
                    onClick={handleClear}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-seal text-paper-50 hover:bg-seal-dark transition-colors text-xs font-bold"
                    title="确认清除"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-ink-200 text-ink-600 hover:bg-ink-300 transition-colors text-xs"
                    title="取消"
                  >
                    ✕
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="idle"
                  onClick={() => setConfirmClear(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-ink-500 hover:text-seal hover:bg-paper-200/60 transition-colors border border-ink-600/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="清除所有数据"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </motion.button>
              )}
            </AnimatePresence>

            {onSettingsClick && (
              <motion.button
                onClick={onSettingsClick}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-ink-500 hover:text-ink-800 hover:bg-paper-200/60 transition-colors border border-ink-600/10"
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
                title="AI设置"
              >
                <Settings size={15} strokeWidth={2} />
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      <div className="h-px bg-ink-800/10 mx-3 sm:mx-4 md:mx-6 mt-0" />
    </header>
  );
}
