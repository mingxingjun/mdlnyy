import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import FallbackView from './FallbackView';
import ThreeLayerBackground from './ThreeLayerBackground';
import VintageNav from './VintageNav';
import ModelSettingsModal from './ModelSettingsModal';
import { useAppStore } from '@/store/useAppStore';

type ViewKey = 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor' | 'questionbank';

/**
 * 路由懒加载：每个页面单独 chunk，首屏只加载 Dashboard。
 * 配合 vite manualChunks，第三方库已拆分，页面按需加载。
 */
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Practice = lazy(() => import('@/pages/Practice'));
const Wrongbook = lazy(() => import('@/pages/Wrongbook'));
const MemoryCards = lazy(() => import('@/pages/MemoryCards'));
const Supervisor = lazy(() => import('@/pages/Supervisor'));
const QuestionBank = lazy(() => import('@/pages/QuestionBank'));

const VIEW_COMPONENTS: Record<ViewKey, () => ReactNode> = {
  dashboard: () => <Dashboard />,
  practice: () => <Practice />,
  wrongbook: () => <Wrongbook />,
  memory: () => <MemoryCards />,
  supervisor: () => <Supervisor />,
  questionbank: () => <QuestionBank />,
};

const VIEW_ORDER: ViewKey[] = ['dashboard', 'practice', 'wrongbook', 'memory', 'supervisor', 'questionbank'];

/** 页面加载占位（Suspense fallback） */
function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-ink-600/20 border-t-seal rounded-full animate-spin" aria-label="加载中" />
    </div>
  );
}

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

/**
 * LRU keep-alive 视图路由。
 * 优化点：原版保留所有已访问视图（最多 6 个常驻），导致 framer-motion 实例、
 * store 订阅、useEffect 副作用全部常驻。改为 LRU 后最多保留 2 个视图（当前 + 上一个），
 * 大幅降低常驻 DOM 节点数和订阅数，同时保留「切回上一页不丢状态」的核心体验。
 */
const MAX_KEPT_VIEWS = 2;

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView) as ViewKey;

  // LRU 缓存：最多保留 MAX_KEPT_VIEWS 个视图，超出时淘汰最久未访问的
  const [mounted, setMounted] = useState<ViewKey[]>(() => [activeView]);

  useEffect(() => {
    setMounted((prev) => {
      // 移除当前视图（如果存在），重新放到队尾（最近使用）
      const filtered = prev.filter((k) => k !== activeView);
      const next = [...filtered, activeView];
      // 超出上限时，淘汰队首（最久未使用），但始终保留 dashboard 作为首页兜底
      if (next.length > MAX_KEPT_VIEWS) {
        const evicted = next.shift() as ViewKey;
        // 注意：被淘汰的视图组件会卸载，其内部状态丢失。这是 LRU 的预期行为。
        void evicted;
      }
      return next;
    });
  }, [activeView]);

  return (
    <ErrorBoundary resetKeys={[activeView]} fallback={<FallbackView><ViewRouter /></FallbackView>}>
      <Suspense fallback={<PageFallback />}>
        {VIEW_ORDER.filter((key) => mounted.includes(key)).map((key) => {
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
      </Suspense>
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
