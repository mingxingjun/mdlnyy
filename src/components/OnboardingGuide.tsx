import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StickyNote from './StickyNote';
import VintageButton from './VintageButton';

interface OnboardingGuideProps {
  onDismiss: () => void;
}

const steps = [
  {
    color: 'yellow' as const,
    rotation: -3,
    emoji: '✏️',
    title: '① 选学科，开始刷题',
    description: '点击下方学科卡片，直接开始做题',
    initialX: -80,
    initialY: -60,
  },
  {
    color: 'pink' as const,
    rotation: 2,
    emoji: '📕',
    title: '② 答错自动收录',
    description: '做错的题会自动加入错题本',
    initialX: 80,
    initialY: -60,
  },
  {
    color: 'blue' as const,
    rotation: -1,
    emoji: '🔄',
    title: '③ 错题反复练',
    description: '去错题本订正，答对即掌握',
    initialX: -80,
    initialY: 60,
  },
  {
    color: 'green' as const,
    rotation: 3,
    emoji: '🃏',
    title: '④ 闪卡助记忆',
    description: '间隔重复法记牢知识点',
    initialX: 80,
    initialY: 60,
  },
];

export default function OnboardingGuide({ onDismiss }: OnboardingGuideProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleExitComplete = () => {
    onDismiss();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ backgroundColor: 'rgba(251,247,240,0.7)' }}
          />

          <div className="relative z-10 flex flex-col items-center px-4 py-8">
            <motion.h1
              className="font-serif text-3xl md:text-4xl text-ink-800 mb-2 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              欢迎使用 ✦
            </motion.h1>
            <motion.p
              className="font-serif text-ink-600 text-sm mb-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              四步上手，开启高效复习之旅
            </motion.p>

            <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-[480px] mb-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0.5,
                    x: step.initialX,
                    y: step.initialY,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 20,
                    delay: 0.25 + i * 0.12,
                  }}
                >
                  <StickyNote
                    color={step.color}
                    rotation={step.rotation}
                    className="max-w-[200px] w-full min-h-[160px] flex flex-col items-center justify-center text-center p-4"
                  >
                    <div className="text-3xl mb-2">{step.emoji}</div>
                    <div className="font-serif font-bold text-base mb-1.5 leading-tight">
                      {step.title}
                    </div>
                    <div className="font-serif text-xs leading-relaxed opacity-80">
                      {step.description}
                    </div>
                  </StickyNote>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: 0.85,
              }}
            >
              <VintageButton
                variant="stamp"
                size="lg"
                className="!w-auto !h-auto !px-8 !py-3"
                onClick={handleDismiss}
              >
                ✓ 知道了，开始学习
              </VintageButton>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
