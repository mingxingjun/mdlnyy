import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import FallbackView from './FallbackView';
import ThreeLayerBackground from './ThreeLayerBackground';
import IntroAnimation from './IntroAnimation';
import PageTransition from './PageTransition';
import VintageNav from './VintageNav';
import { useNavigationStore } from '@/store/useNavigationStore';

export default function Layout() {
  const location = useLocation();
  const syncFromRoute = useNavigationStore((s) => s.syncFromRoute);
  const setInitialLoadComplete = useNavigationStore((s) => s.setInitialLoadComplete);

  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    syncFromRoute(currentPath);
    setInitialLoadComplete();
  }, [location.pathname, syncFromRoute, setInitialLoadComplete]);

  const handleIntroComplete = () => {
    setContentReady(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 400);
  };

  if (isLoading) {
    return (
      <ThreeLayerBackground>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-ink-700 font-serif text-lg"
          >
            加载中...
          </motion.div>
        </div>
      </ThreeLayerBackground>
    );
  }

  return (
    <>
      <ThreeLayerBackground>
        <div className="min-h-screen flex flex-col">
          <VintageNav />
          <main className="flex-1 relative z-10 px-6 py-6 pb-12">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary fallback={<FallbackView />}>
                {contentReady && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <PageTransition />
                  </motion.div>
                )}
              </ErrorBoundary>
            </div>
          </main>
          <footer className="h-1 bg-ink-800/20 mt-auto" />
        </div>
      </ThreeLayerBackground>

      {showIntro && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
    </>
  );
}
