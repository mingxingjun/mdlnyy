import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  return (
    <ErrorBoundary resetKeys={[activeView]} fallback={<FallbackView><ViewRouter /></FallbackView>}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {renderView(activeView)}
        </motion.div>
      </AnimatePresence>
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
