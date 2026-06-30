import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PaperCard from './PaperCard';
import StickyNote from './StickyNote';
import VintageButton from './VintageButton';
import { useCountUp } from '@/hooks/useCountUp';

interface QuizResultPageProps {
  session: {
    id: string;
    subjectId: string | null;
    mode: 'practice' | 'wrong-review';
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    durationSeconds: number;
    weakSubjects?: { name: string; icon: string; count: number; color: string }[];
  };
  onReviewWrong: () => void;
  onRetry: () => void;
  onGoHome: () => void;
}

const confettiColors = ['#8B2500', '#B8860B', '#2D5A27', '#5C4033', '#A0522D', '#DAA520', '#C4543A'];

function Confetti({ count }: { count: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
        duration: 2 + Math.random() * 1.5,
        xDrift: (Math.random() - 0.5) * 120,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            borderRadius: '1px',
          }}
          initial={{ y: -20, rotate: p.rotation, x: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 40,
            rotate: p.rotation + 720,
            x: p.xDrift,
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
            times: [0, 0.7, 0.9, 1],
          }}
        />
      ))}
    </div>
  );
}

function getGrade(accuracy: number) {
  if (accuracy === 100) {
    return { text: '满分\n💯', color: '#DAA520', borderColor: '#B8860B', label: '满分' };
  }
  if (accuracy >= 80) {
    return { text: '优秀\n★', color: '#8B2500', borderColor: '#8B2500', label: '优秀' };
  }
  if (accuracy >= 60) {
    return { text: '良好\n✓', color: '#5C4033', borderColor: '#5C4033', label: '良好' };
  }
  return { text: '加油\n📕', color: 'rgba(139,37,0,0.5)', borderColor: 'rgba(139,37,0,0.4)', label: '加油' };
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#2D5A27';
  if (accuracy >= 60) return '#B8860B';
  return '#8B2500';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}秒`;
  return `${m}分${s}秒`;
}

function getComment(accuracy: number, mode: 'practice' | 'wrong-review', correctCount: number, wrongCount: number): string {
  if (mode === 'wrong-review') {
    if (accuracy === 100) return '所有错题都订正了！太棒了 🎉';
    return `订正了${correctCount}道错题，还有${wrongCount}道需要再练 💪`;
  }
  if (accuracy === 100) return '全对！你就是学霸本霸 🎉 这套题已经完全掌握了！';
  if (accuracy >= 80) return '很棒！继续保持这个状态 ✨ 错题记得复习哦';
  if (accuracy >= 60) return '及格了，再接再厉 💪 重点看看错题的解析';
  return '多看看错题，不要灰心 📕 每道错题都是进步的机会';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function QuizResultPage({ session, onReviewWrong, onRetry, onGoHome }: QuizResultPageProps) {
  const { totalQuestions, correctCount, wrongCount, accuracy, durationSeconds, weakSubjects, mode } = session;
  const animatedAccuracy = useCountUp(accuracy);
  const [showConfetti, setShowConfetti] = useState(false);

  const grade = getGrade(accuracy);
  const accuracyColor = getAccuracyColor(accuracy);
  const comment = getComment(accuracy, mode, correctCount, wrongCount);
  const hasWrong = wrongCount > 0;

  useEffect(() => {
    if (accuracy === 100 || (accuracy >= 80 && accuracy < 100)) {
      const t = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(t);
    }
  }, [accuracy]);

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - animatedAccuracy / 100);

  const stickyRotations = useMemo(
    () => (weakSubjects || []).map((_, i) => (i % 2 === 0 ? -2.5 : 2.5) + (Math.random() - 0.5) * 2),
    [weakSubjects]
  );

  return (
    <motion.div
      className="relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {showConfetti && <Confetti count={accuracy === 100 ? 50 : 30} />}

      <PaperCard className="relative overflow-hidden" rotation={0}>
        <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="relative mb-8">
            <motion.h1
              variants={itemVariants}
              className="font-serif text-3xl md:text-4xl font-bold text-ink-800 text-center tracking-wider"
            >
              ✦ 练习完成 ✦
            </motion.h1>

            <motion.div
              initial={{ scale: 2.5, rotate: -12 - 30, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: accuracy < 60 ? 0.65 : 0.88 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.5 }}
              className="absolute -top-2 -right-2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center flex-col"
              style={{
                border: `3px solid ${grade.borderColor}`,
                color: grade.color,
                background: `radial-gradient(circle, ${grade.color}10 0%, transparent 70%)`,
                boxShadow: `0 2px 10px ${grade.color}30, inset 0 0 16px ${grade.color}12`,
                textShadow: `0 0 1px ${grade.color}40`,
              }}
            >
              <span className="font-serif font-bold text-xs sm:text-sm md:text-base leading-tight text-center whitespace-pre-line" style={{ letterSpacing: '1px' }}>
                {grade.text}
              </span>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]">
                <circle
                  cx="70"
                  cy="70"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#E0D4C0"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="2 6"
                  opacity="0.6"
                />
                <motion.circle
                  cx="70"
                  cy="70"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={accuracyColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 4px ${accuracyColor}40)`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <motion.span
                  className="font-serif text-2xl sm:text-3xl font-bold tabular-nums"
                  style={{ color: accuracyColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {animatedAccuracy}%
                </motion.span>
                <span className="font-serif text-xs text-ink-500 mt-1">正确率</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <p className="font-serif text-[10px] text-ink-500 mb-1 tracking-wider uppercase">答对</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: '#2D5A27' }}>
                {correctCount}
              </p>
              <p className="font-serif text-xs text-ink-400">题</p>
            </div>
            <div className="text-center border-x border-ink-600/15">
              <p className="font-serif text-[10px] text-ink-500 mb-1 tracking-wider uppercase">答错</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-seal">
                {wrongCount}
              </p>
              <p className="font-serif text-xs text-ink-400">题</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-[10px] text-ink-500 mb-1 tracking-wider uppercase">用时</p>
              <p className="font-serif text-base sm:text-xl font-bold tabular-nums text-ink-700 mt-1">
                {formatDuration(durationSeconds)}
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="max-w-md">
              <StickyNote color="yellow" rotation={-1.5} className="!px-4 !py-3 sm:!px-6 sm:!py-5">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-base sm:text-xl flex-shrink-0 mt-0.5">📝</span>
                  <p className="handwritten text-sm sm:text-base leading-relaxed" style={{ color: '#5D4E37' }}>
                    {comment}
                  </p>
                </div>
              </StickyNote>
            </div>
          </motion.div>

          {weakSubjects && weakSubjects.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <h3 className="font-serif text-base font-bold text-ink-700 text-center mb-4">
                需要重点复习
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {weakSubjects.map((subject, i) => (
                  <motion.div
                    key={subject.name}
                    initial={{ opacity: 0, y: 15, rotate: stickyRotations[i] }}
                    animate={{ opacity: 1, y: 0, rotate: stickyRotations[i] }}
                    transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <StickyNote color="pink" rotation={stickyRotations[i]} className="!py-2 !px-3 sm:!py-3 sm:!px-4 !min-h-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                        <span className="text-base sm:text-lg">{subject.icon}</span>
                        <span className="font-serif text-xs sm:text-sm font-medium" style={{ color: subject.color }}>
                          {subject.name}
                        </span>
                        <span className="font-serif text-xs text-seal font-bold">
                          ×{subject.count}
                        </span>
                      </div>
                    </StickyNote>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            {hasWrong && (
              <VintageButton
                variant="stamp"
                size="lg"
                onClick={onReviewWrong}
                className="w-full sm:w-auto"
              >
                复习错题
              </VintageButton>
            )}
            <VintageButton
              variant="primary"
              size="lg"
              onClick={onRetry}
              className="w-full sm:w-auto"
            >
              🔄 再来一组
            </VintageButton>
            <VintageButton
              variant="ghost"
              size="lg"
              onClick={onGoHome}
              className="w-full sm:w-auto"
            >
              🏠 返回首页
            </VintageButton>
          </motion.div>

          {mode === 'wrong-review' && (
            <motion.div
              variants={itemVariants}
              className="mt-6 text-center"
            >
              <p className="font-serif text-xs text-ink-400 italic">
                📕 错题订正模式
              </p>
            </motion.div>
          )}
        </div>
      </PaperCard>
    </motion.div>
  );
}
