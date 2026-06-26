import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import StickyNote from '@/components/StickyNote';
import { useAppStore } from '@/store/useAppStore';
import type { CardRating, FlashCard } from '@/store/useAppStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const confettiColors = ['#8B2500', '#B8860B', '#2D5A27', '#5C4033', '#A0522D', '#DAA520'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * 360,
      size: 8 + Math.random() * 8,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            borderRadius: '1px',
          }}
        />
      ))}
    </div>
  );
}

interface FlashCardViewProps {
  card: FlashCard;
  subjectName: string;
  subjectColor: string;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: CardRating) => void;
  cardNumber: number;
  totalCards: number;
  direction: 'left' | 'right' | 'none';
}

function FlashCardView({ card, subjectName, subjectColor, isFlipped, onFlip, onRate, cardNumber, totalCards, direction }: FlashCardViewProps) {
  const slideVariants = {
    enter: (dir: 'left' | 'right' | 'none') => ({
      x: dir === 'left' ? 200 : dir === 'right' ? -200 : 0,
      opacity: 0,
      rotateY: dir === 'left' ? 15 : dir === 'right' ? -15 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      transition: { type: 'spring', stiffness: 250, damping: 28 },
    },
    exit: (dir: 'left' | 'right' | 'none') => ({
      x: dir === 'left' ? -200 : dir === 'right' ? 200 : 0,
      opacity: 0,
      rotateY: dir === 'left' ? -15 : dir === 'right' ? 15 : 0,
      transition: { duration: 0.25, ease: 'easeIn' },
    }),
  };

  return (
    <motion.div
      className="flex flex-col items-center w-full max-w-[460px] mx-auto"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <div className="flash-card w-full" onClick={!isFlipped ? onFlip : undefined}>
        <div className={`flash-card-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flash-card-face flash-card-front">
            <div className="index-card w-full h-full p-6 flex flex-col">
              <div className="index-card-grain" />
              <div className="index-card-lines" />
              <div className="index-card-hole" />
              <div className="index-card-corner" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 pt-1 pl-6">
                  <VintageTag color="ink" className="text-[11px]">
                    <span style={{ color: subjectColor }}>●</span> {subjectName}
                  </VintageTag>
                  <span className="text-[10px] text-ink-400 font-serif">
                    {card.mastered ? '已掌握' : '学习中'}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center px-2 pl-8 py-4">
                  <p className="font-serif text-xl text-ink-800 text-center leading-relaxed">
                    {card.front}
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-ink-400 font-serif italic">
                    ~ 点击卡片查看答案 ~
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flash-card-face flash-card-back">
            <div className="index-card w-full h-full p-6 flex flex-col overflow-hidden">
              <div className="index-card-grain" />
              <div className="index-card-lines" />
              <div className="index-card-hole" />
              <div className="index-card-corner" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 pt-1 pl-6">
                  <VintageTag color="green" className="text-[11px]">
                    ✓ 答案
                  </VintageTag>
                  <span className="text-[10px] text-ink-400 font-serif">
                    第 {cardNumber} / {totalCards} 张
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center px-2 pl-8 py-3 overflow-auto">
                  <p className="font-serif text-lg text-ink-700 text-center leading-relaxed">
                    {card.back}
                  </p>
                </div>

                <div className="pt-3">
                  <p className="text-[10px] text-center text-ink-400 font-serif mb-2">
                    你记得有多清楚？
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <VintageButton
                      variant="secondary"
                      size="sm"
                      className="rating-btn border-seal/50 text-seal hover:bg-seal/10"
                      onClick={(e) => { e?.stopPropagation?.(); onRate('again'); }}
                    >
                      😕 忘记
                    </VintageButton>
                    <VintageButton
                      variant="secondary"
                      size="sm"
                      className="rating-btn border-gold/50 text-gold hover:bg-gold/10"
                      onClick={(e) => { e?.stopPropagation?.(); onRate('hard'); }}
                    >
                      🤔 模糊
                    </VintageButton>
                    <VintageButton
                      variant="secondary"
                      size="sm"
                      className="rating-btn"
                      onClick={(e) => { e?.stopPropagation?.(); onRate('good'); }}
                    >
                      😐 记得
                    </VintageButton>
                    <VintageButton
                      variant="primary"
                      size="sm"
                      className="rating-btn bg-[#2D5A27] hover:bg-[#234B1F] text-paper-50 border-none"
                      onClick={(e) => { e?.stopPropagation?.(); onRate('easy'); }}
                    >
                      😊 很熟
                    </VintageButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isFlipped && (
        <motion.p
          className="mt-4 text-sm text-ink-500 font-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          第 {cardNumber} / {totalCards} 张
        </motion.p>
      )}
    </motion.div>
  );
}

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { subjects, flashCards, rateCard, getDueCards } = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [masteredToday, setMasteredToday] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [animating, setAnimating] = useState(false);
  const initializedRef = useRef(false);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach(s => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const cardMap = useMemo(() => {
    const map = new Map<string, FlashCard>();
    flashCards.forEach(c => map.set(c.id, c));
    return map;
  }, [flashCards]);

  const initSession = useCallback((subjectId: string | null) => {
    const due = getDueCards(subjectId);
    setSessionQueue(due.map(c => c.id));
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setMasteredToday(0);
    setIsComplete(due.length === 0);
    setShowConfetti(false);
    setDirection('none');
    setAnimating(false);
  }, [getDueCards]);

  useEffect(() => {
    initSession(selectedSubject);
    initializedRef.current = true;
  }, [selectedSubject, initSession]);

  const totalCards = flashCards.length;
  const masteredCount = flashCards.filter(c => c.mastered).length;
  const dueCountNow = useMemo(() => getDueCards(selectedSubject).length, [getDueCards, selectedSubject, flashCards]);
  const sessionTotal = sessionQueue.length;
  const currentCardId = sessionQueue[currentIndex];
  const currentCard = currentCardId ? cardMap.get(currentCardId) : undefined;

  const handleFlip = useCallback(() => {
    if (!isFlipped && !animating) {
      setIsFlipped(true);
    }
  }, [isFlipped, animating]);

  const handleRate = useCallback((rating: CardRating) => {
    if (!currentCard || animating) return;
    if (!isFlipped) return;

    setAnimating(true);

    const wasMastered = currentCard.mastered;
    rateCard(currentCard.id, rating);
    setReviewedCount(prev => prev + 1);

    const willBeMastered = (rating === 'easy' && currentCard.repetitions >= 4) ||
      (rating === 'good' && currentCard.repetitions >= 5);
    if (willBeMastered && !wasMastered) {
      setMasteredToday(prev => prev + 1);
    }

    setIsFlipped(false);

    setTimeout(() => {
      setDirection('left');
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= sessionQueue.length) {
          setIsComplete(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          setAnimating(false);
        } else {
          setCurrentIndex(nextIndex);
          setDirection('right');
          setAnimating(false);
        }
      }, 280);
    }, 350);
  }, [currentCard, currentIndex, sessionQueue.length, rateCard, isFlipped, animating]);

  const handleReset = useCallback(() => {
    initSession(selectedSubject);
  }, [initSession, selectedSubject]);

  const subjectInfo = currentCard ? subjectMap.get(currentCard.subjectId) : null;

  return (
    <motion.div
      className="space-y-6 relative min-h-[calc(100vh-120px)]"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {showConfetti && <Confetti />}

      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl text-ink-800 font-bold mb-1 flex items-center gap-2">
              <span>🃏</span>
              <span>记忆闪卡</span>
            </h1>
            <p className="text-ink-600 font-serif text-sm">间隔重复，高效记忆</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-serif bg-paper-50 border border-ink-600/15 rounded-[3px] text-ink-600 hover:bg-paper-200 transition-colors"
            >
              ↻ 重新开始
            </button>
            <select
              value={selectedSubject || ''}
              onChange={(e) => {
                setSelectedSubject(e.target.value || null);
              }}
              className="px-3 py-2 text-sm font-serif bg-paper-50 border border-ink-600/15 rounded-[3px] focus:outline-none focus:border-seal/40 text-ink-800"
            >
              <option value="">全部学科</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <PaperCard className="p-3 text-center" rotation={-1}>
            <p className="text-[10px] text-ink-500 font-serif mb-1">本次待复习</p>
            <p className="font-serif text-2xl font-bold text-seal tabular-nums">{sessionTotal}</p>
          </PaperCard>
          <PaperCard className="p-3 text-center" rotation={0.5}>
            <p className="text-[10px] text-ink-500 font-serif mb-1">总卡片数</p>
            <p className="font-serif text-2xl font-bold text-ink-700 tabular-nums">{totalCards}</p>
          </PaperCard>
          <PaperCard className="p-3 text-center" rotation={1}>
            <p className="text-[10px] text-ink-500 font-serif mb-1">已掌握</p>
            <p className="font-serif text-2xl font-bold text-[#2D5A27] tabular-nums">{masteredCount}</p>
          </PaperCard>
        </div>
      </motion.div>

      {sessionTotal > 0 && !isComplete && (
        <motion.div variants={fadeUp}>
          <div className="max-w-[460px] mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-paper-300 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-seal/70 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIndex / sessionTotal) * 100}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] text-ink-500 font-serif tabular-nums whitespace-nowrap">
                {currentIndex + 1} / {sessionTotal}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl mx-auto py-8"
          >
            <PaperCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className="text-5xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="font-serif text-xl text-ink-800 font-bold mb-2">
                {reviewedCount > 0 ? '本次复习完成！' : '暂无待复习卡片'}
              </h2>

              {reviewedCount > 0 ? (
                <>
                  <p className="text-ink-600 font-serif text-sm mb-6">
                    太棒了！你本次复习了 <span className="text-seal font-bold">{reviewedCount}</span> 张卡片
                    {masteredToday > 0 && <>，新掌握了 <span className="text-[#2D5A27] font-bold">{masteredToday}</span> 张</>}
                  </p>

                  <div className="flex justify-center mb-6">
                    <StickyNote color="yellow" rotation={-2} className="max-w-xs">
                      <p className="text-center">
                        ✨ 坚持就是胜利！<br />
                        <span className="text-xs opacity-70">明天同一时间继续复习哦~</span>
                      </p>
                    </StickyNote>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-ink-600 font-serif text-sm mb-6">
                    所有卡片都已安排好复习时间
                  </p>

                  <div className="flex justify-center mb-6">
                    <StickyNote color="blue" rotation={1} className="max-w-xs">
                      <p className="text-center">
                        ✨ 先去做题吧<br />
                        <span className="text-xs opacity-70">错题会自动生成闪卡哦~</span>
                      </p>
                    </StickyNote>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                {reviewedCount > 0 && (
                  <VintageButton variant="ghost" onClick={handleReset}>
                    再复习一轮
                  </VintageButton>
                )}
                <VintageButton variant="primary" onClick={() => navigate('/')}>
                  返回首页
                </VintageButton>
              </div>
            </PaperCard>
          </motion.div>
        ) : currentCard ? (
          <motion.div
            key={`card-${currentCard.id}-${currentIndex}`}
            className="flex justify-center py-4"
          >
            <FlashCardView
              card={currentCard}
              subjectName={subjectInfo?.name || '未知学科'}
              subjectColor={subjectInfo?.color || '#5C4033'}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onRate={handleRate}
              cardNumber={currentIndex + 1}
              totalCards={sessionTotal}
              direction={direction}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
