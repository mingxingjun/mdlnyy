import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import FallbackView from './FallbackView';
import ThreeLayerBackground from './ThreeLayerBackground';
import VintageNav from './VintageNav';
import ModelSettingsModal from './ModelSettingsModal';
import Dashboard from '@/pages/Dashboard';
import Practice from '@/pages/Practice';
import Wrongbook from '@/pages/Wrongbook';
import MemoryCards from '@/pages/MemoryCards';
import Supervisor from '@/pages/Supervisor';
import QuestionBank from '@/pages/QuestionBank';
import { useAppStore } from '@/store/useAppStore';

type ViewKey = 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor' | 'questionbank';

const VIEW_COMPONENTS: Record<ViewKey, () => ReactNode> = {
  dashboard: () => <Dashboard />,
  practice: () => <Practice />,
  wrongbook: () => <Wrongbook />,
  memory: () => <MemoryCards />,
  supervisor: () => <Supervisor />,
  questionbank: () => <QuestionBank />,
};

const VIEW_ORDER: ViewKey[] = ['dashboard', 'practice', 'wrongbook', 'memory', 'supervisor', 'questionbank'];

/**
 * Keep-alive 视图容器：非激活视图用 hidden 隐藏以保留状态，
 * 并通过 inert 属性（运行时设置，兼容 React 18）彻底禁止内部聚焦与交互，
 * 避免 aria-hidden + 可聚焦元素的 WAI-ARIA 违规。
 */
function ViewSlot({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [active]);

  return (
    <div ref={ref} hidden={!active} className={active ? 'block' : 'hidden'}>
      {children}
    </div>
  );
}

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView) as ViewKey;

  // Keep-alive：记录已挂载过的视图，切换时保留组件状态（不卸载）。
  // 使用「渲染期间调整 state」模式（React 官方推荐），避免 useEffect 延迟一帧导致闪烁。
  const [mounted, setMounted] = useState<Set<ViewKey>>(() => new Set([activeView]));
  if (!mounted.has(activeView)) {
    setMounted(new Set(mounted).add(activeView));
  }

  return (
    <ErrorBoundary resetKeys={[activeView]} fallback={<FallbackView><ViewRouter /></FallbackView>}>
      {VIEW_ORDER.filter((key) => mounted.has(key)).map((key) => {
        const isActive = key === activeView;
        const Comp = VIEW_COMPONENTS[key];
        return (
          <ViewSlot key={key} active={isActive}>
            {isActive ? (
              <motion.div
                initial={{ opacity: 0, y: -12, rotate: -3, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Comp />
              </motion.div>
            ) : (
              <Comp />
            )}
          </ViewSlot>
        );
      })}
    </ErrorBoundary>
  );
}

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ThreeLayerBackground>
      <VintageNav onSettingsClick={() => setSettingsOpen(true)} />
      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <ViewRouter />
      </main>
      <ModelSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ThreeLayerBackground>
  );
}
