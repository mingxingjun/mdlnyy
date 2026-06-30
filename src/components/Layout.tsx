import { useState } from 'react';
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

function renderView(activeView: string) {
  switch (activeView) {
    case 'practice':
      return <Practice />;
    case 'wrongbook':
      return <Wrongbook />;
    case 'memory':
      return <MemoryCards />;
    case 'supervisor':
      return <Supervisor />;
    case 'questionbank':
      return <QuestionBank />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView);
  // 移除 AnimatePresence mode="wait"：与 React 18 并发渲染冲突会导致退出动画卡住、页面切换空白。
  // 改为简单的 key 淡入切换，无退出动画，规避冲突。
  return (
    <ErrorBoundary resetKeys={[activeView]} fallback={<FallbackView><ViewRouter /></FallbackView>}>
      <motion.div
        key={activeView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {renderView(activeView)}
      </motion.div>
    </ErrorBoundary>
  );
}

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ThreeLayerBackground>
      <VintageNav onSettingsClick={() => setSettingsOpen(true)} />
      {/* 移除 main 的 max-w-6xl 和 padding：各页面已自带统一容器（px-3 sm:px-4 md:px-6 py-4 sm:py-6），避免双重嵌套 */}
      <main className="relative z-10">
        <ViewRouter />
      </main>
      <ModelSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ThreeLayerBackground>
  );
}
