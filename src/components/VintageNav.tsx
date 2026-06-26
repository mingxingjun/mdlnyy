import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  primary: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: '复习计划', icon: '📋', primary: true },
  { path: '/ai-engine', label: '智能出题', icon: '❓', primary: true },
  { path: '/my-notes', label: '错题集', icon: '📝', primary: true },
  { path: '/flashcards', label: '记忆闪卡', icon: '🃏', primary: true },
  { path: '/supervisor', label: '进度督学', icon: '📊', primary: true },
  { path: '/flow-chamber', label: '沉浸流', icon: '🎯', primary: false },
];

export default function VintageNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
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
          {NAV_ITEMS.filter((item) => item.primary).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
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

          {NAV_ITEMS.filter((item) => !item.primary).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`relative ml-2 md:ml-4 px-2 md:px-3 py-1.5 rounded-b-md border-b border-l border-r transition-colors flex items-center gap-1 text-xs md:text-sm opacity-80 ${
                  isActive
                    ? 'bg-paper-100 border-ink-600/20 text-ink-800 font-semibold shadow-sm'
                    : 'bg-paper-200/40 border-ink-600/10 text-ink-600 hover:bg-paper-100/60 hover:opacity-100'
                }`}
                initial={false}
                animate={{
                  y: isActive ? 2 : 0,
                }}
                whileHover={{
                  y: isActive ? 2 : 1,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  marginTop: -2,
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="whitespace-nowrap font-serif">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-700"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pb-2 pt-2">
          <div className="text-ink-600/60 font-serif text-sm hidden md:block">
            2026.06
          </div>
        </div>
      </nav>

      <div className="h-px bg-ink-800/10 mx-4 md:mx-6 mt-0" />
    </header>
  );
}
