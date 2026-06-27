import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

type ViewKey = 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor';

interface NavItem {
  view: ViewKey;
  label: string;
  icon: string;
}

interface VintageNavProps {
  onSettingsClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: '首页', icon: '🏠' },
  { view: 'practice', label: '开始练习', icon: '✏️' },
  { view: 'wrongbook', label: '错题本', icon: '📕' },
  { view: 'memory', label: '记忆卡片', icon: '🃏' },
  { view: 'supervisor', label: '学习报告', icon: '📊' },
];

export default function VintageNav({ onSettingsClick }: VintageNavProps) {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);

  const handleNavClick = (view: ViewKey) => {
    setActiveView(view);
  };

  return (
    <header className="relative z-20">
      <div className="h-2 bg-ink-800 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          }}
        />
      </div>

      <nav className="flex items-end justify-between px-4 md:px-6 pt-0 relative">
        <div className="flex items-center gap-2 pb-2 pt-2">
          <motion.div
            className="w-10 h-10 rounded-full bg-ink-800 text-paper-50 flex items-center justify-center font-serif text-lg shadow-md border-2 border-ink-700"
            whileHover={{ rotate: -5 }}
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent)',
            }}
          >
            优
          </motion.div>
          <h1 className="font-serif text-xl text-ink-800 font-bold tracking-wide">
            优流手账
          </h1>
        </div>

        <div className="flex items-end gap-1 md:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <motion.button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`relative px-3 md:px-4 py-2 rounded-b-md border-b-2 border-l border-r transition-colors flex items-center gap-1.5 md:gap-2 text-sm md:text-base ${
                  isActive
                    ? 'bg-paper-50 border-ink-600/30 text-ink-900 font-bold shadow-md'
                    : 'bg-paper-200/60 border-ink-600/10 text-ink-700 hover:bg-paper-100/80'
                }`}
                initial={false}
                animate={{
                  y: isActive ? 4 : 0,
                }}
                whileHover={{
                  y: isActive ? 4 : 2,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  marginTop: -4,
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                }}
              >
                <span className="text-base md:text-lg">{item.icon}</span>
                <span className="whitespace-nowrap font-serif">{item.label}</span>
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

          {onSettingsClick && (
            <motion.button
              onClick={onSettingsClick}
              className="ml-2 md:ml-3 w-9 h-9 rounded-full flex items-center justify-center text-ink-600 hover:text-ink-800 hover:bg-paper-200/60 transition-colors text-lg border border-ink-600/10"
              whileHover={{ rotate: 90, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              title="AI设置"
            >
              ⚙️
            </motion.button>
          )}
        </div>
      </nav>

      <div className="h-px bg-ink-800/10 mx-4 md:mx-6 mt-0" />
    </header>
  );
}
