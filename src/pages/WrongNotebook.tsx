import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw, BookOpen, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PaperCard from '@/components/PaperCard';
import StickyNote from '@/components/StickyNote';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';

const SUBJECT_FILTERS = [
  { id: null, name: '全部', icon: '📝' },
  { id: 'math', name: '高数', icon: '📐' },
  { id: 'english', name: '英语', icon: '📖' },
  { id: 'linear', name: '线代', icon: '📊' },
  { id: 'programming', name: '编程', icon: '💻' },
  { id: 'physics', name: '物理', icon: '⚛️' },
];

const STATUS_FILTERS = [
  { id: 'all', name: '全部' },
  { id: 'pending', name: '待订正' },
  { id: 'reviewed', name: '已复习' },
];

const DIFFICULTY_LABEL = {
  easy: { label: '易', color: 'green' as const },
  medium: { label: '中', color: 'gold' as const },
  hard: { label: '难', color: 'seal' as const },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const CIRCLED_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

interface WeakPointTag {
  subjectId: string;
  name: string;
  icon: string;
  count: number;
}

function RedInkDecorations() {
  return (
    <>
      <div className="absolute top-3 left-3 text-seal/30 text-2xl font-bold select-none pointer-events-none" style={{ transform: 'rotate(-12deg)' }}>✗</div>
      <div className="absolute top-8 right-4 text-seal/20 text-lg font-bold select-none pointer-events-none" style={{ transform: 'rotate(8deg)' }}>!</div>
      <div className="absolute bottom-4 left-6 text-seal/25 text-xl select-none pointer-events-none" style={{ transform: 'rotate(-5deg)' }}>×</div>
    </>
  );
}

function ReviewedStamp() {
  return (
    <motion.div
      initial={{ scale: 2, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 0.7, rotate: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute top-3 right-3 z-10 pointer-events-none"
    >
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#2D5A27" strokeWidth="3" strokeDasharray="4 2" />
        </svg>
        <span className="font-serif text-[#2D5A27] text-sm font-bold tracking-wider" style={{ transform: 'rotate(-12deg)' }}>
          已订正 ✓
        </span>
      </div>
    </motion.div>
  );
}

interface WrongAnswerCardProps {
  wrongAnswer: ReturnType<typeof useAppStore.getState>['wrongAnswers'][number];
  question: ReturnType<typeof useAppStore.getState>['quizQuestions'][number] | undefined;
  subject: ReturnType<typeof useAppStore.getState>['subjects'][number] | undefined;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onMarkReviewed: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (wrongId: string) => void;
  index: number;
}

function WrongAnswerCard({
  wrongAnswer,
  question,
  subject,
  expandedId,
  onToggleExpand,
  onMarkReviewed,
  onDelete,
  onRetry,
  index,
}: WrongAnswerCardProps) {
  const isExpanded = expandedId === wrongAnswer.id;
  const isReviewed = wrongAnswer.reviewed;

  if (!question) return null;

  const difficulty = DIFFICULTY_LABEL[question.difficulty];
  const stepRotations = useMemo(
    () => question.steps.map(() => (Math.random() - 0.5) * 3),
    [question.id]
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      className="relative"
    >
      <PaperCard status={isReviewed ? 'completed' : 'default'} className="p-0 overflow-visible">
        {!isReviewed && <RedInkDecorations />}
        {isReviewed && <ReviewedStamp />}

        <div className="p-5 pl-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {subject && (
              <VintageTag color="ink">{subject.icon} {subject.name}</VintageTag>
            )}
            <VintageTag color={difficulty.color}>{difficulty.label}</VintageTag>
            <span className="font-serif text-xs text-ink-500 ml-auto">
              {formatTimeAgo(wrongAnswer.timestamp)}
            </span>
          </div>

          <p className="font-serif text-base text-ink-800 leading-relaxed mb-4 line-clamp-2">
            {question.question.length > 50 ? question.question.slice(0, 50) + '...' : question.question}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <span className="font-serif text-sm text-seal font-medium flex-shrink-0">你的答案：</span>
              <span className="font-serif text-sm text-seal line-through opacity-80">
                [{OPTION_LABELS[wrongAnswer.userAnswer]}] {question.options[wrongAnswer.userAnswer]}
              </span>
              <XCircle size={16} className="text-seal flex-shrink-0 mt-0.5" />
            </div>
            <div className="flex items-start gap-2">
              <span className="font-serif text-sm text-[#2D5A27] font-medium flex-shrink-0">正确答案：</span>
              <span className="font-serif text-sm text-[#2D5A27] font-medium">
                [{OPTION_LABELS[wrongAnswer.correctAnswer]}] {question.options[wrongAnswer.correctAnswer]}
              </span>
              <CheckCircle2 size={16} className="text-[#2D5A27] flex-shrink-0 mt-0.5" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-ink-600/10">
            <VintageButton
              variant="primary"
              size="sm"
              onClick={() => onRetry(wrongAnswer.id)}
              disabled={isReviewed}
            >
              <RotateCcw size={14} className="mr-1" />
              重做此题
            </VintageButton>

            <VintageButton
              variant="secondary"
              size="sm"
              onClick={() => onToggleExpand(wrongAnswer.id)}
            >
              <BookOpen size={14} className="mr-1" />
              {isExpanded ? '收起解析' : '查看解析'}
              {isExpanded ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </VintageButton>

            {!isReviewed && (
              <VintageButton
                variant="ghost"
                size="sm"
                onClick={() => onMarkReviewed(wrongAnswer.id)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                已订正
              </VintageButton>
            )}

            <VintageButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(wrongAnswer.id)}
              className="!text-seal hover:!bg-seal/10"
            >
              <Trash2 size={14} />
            </VintageButton>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-ink-600/10 ml-2">
                <div className="mb-4">
                  <h4 className="font-serif text-ink-700 text-sm mb-3 font-medium">完整题目</h4>
                  <p className="font-serif text-base text-ink-800 leading-relaxed mb-4">
                    {question.question}
                  </p>
                  <div className="space-y-2 ml-2">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = optIndex === wrongAnswer.userAnswer;
                      const isCorrectAnswer = optIndex === wrongAnswer.correctAnswer;

                      return (
                        <div
                          key={optIndex}
                          className={`
                            flex items-start gap-3 p-3 rounded-sm border
                            ${isCorrectAnswer ? 'border-[#2D5A27]/40 bg-[#2D5A27]/5' : ''}
                            ${isUserAnswer && !isCorrectAnswer ? 'border-seal/40 bg-seal/5' : ''}
                            ${!isUserAnswer && !isCorrectAnswer ? 'border-ink-600/10 bg-paper-50' : ''}
                          `}
                        >
                          <span className={`
                            flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-sm
                            ${isCorrectAnswer ? 'bg-[#2D5A27] text-paper-50' : ''}
                            ${isUserAnswer && !isCorrectAnswer ? 'bg-seal text-paper-50' : ''}
                            ${!isUserAnswer && !isCorrectAnswer ? 'bg-ink-200 text-ink-600' : ''}
                          `}>
                            {isCorrectAnswer ? '✓' : isUserAnswer && !isCorrectAnswer ? '✗' : OPTION_LABELS[optIndex]}
                          </span>
                          <span className={`
                            font-serif text-sm pt-1
                            ${isCorrectAnswer ? 'text-[#2D5A27] font-medium' : ''}
                            ${isUserAnswer && !isCorrectAnswer ? 'text-seal font-medium line-through opacity-80' : ''}
                            ${!isUserAnswer && !isCorrectAnswer ? 'text-ink-700' : ''}
                          `}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-seal/30" />

                  <h4 className="handwritten text-seal text-lg mb-4 flex items-center gap-2" style={{ transform: 'skew(-2deg)', color: '#8B2500' }}>
                    <span className="text-xl">【</span>
                    解题步骤
                    <span className="text-xl">】</span>
                  </h4>
                  <div className="space-y-3 mb-6">
                    {question.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-seal flex items-center justify-center bg-seal/5"
                          style={{ transform: `rotate(${stepRotations[i] * 0.3}deg)` }}
                        >
                          <span className="font-serif text-seal font-bold text-sm">
                            {CIRCLED_NUMERALS[i]}
                          </span>
                        </div>
                        <div
                          className="flex-1 border-l-2 border-seal/40 pl-3 py-1"
                          style={{ transform: `rotate(${stepRotations[i] * 0.2}deg)` }}
                        >
                          <p className="font-serif text-ink-700 text-sm leading-relaxed">
                            {step}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {question.mistakes.length > 0 && (
                    <div>
                      <h4 className="handwritten text-seal text-base mb-3 flex items-center gap-2" style={{ transform: 'skew(-1deg)', color: '#8B2500' }}>
                        <AlertTriangle size={18} />
                        易错点
                      </h4>
                      <div className="max-w-md">
                        <StickyNote color="yellow" rotation={-2} className="!py-3">
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 text-base flex-shrink-0">❗</span>
                            <ul className="space-y-1">
                              {question.mistakes.map((mistake, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-seal font-bold flex-shrink-0">•</span>
                                  <span className="text-[#5D4E37] text-sm">{mistake}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </StickyNote>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PaperCard>
    </motion.div>
  );
}

export default function WrongNotebook() {
  const navigate = useNavigate();
  const {
    quizQuestions,
    subjects,
    wrongAnswers,
    markWrongReviewed,
    deleteWrongAnswer,
    clearReviewedWrongAnswers,
  } = useAppStore();

  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredWrongAnswers = useMemo(() => {
    return wrongAnswers.filter((w) => {
      if (subjectFilter && w.subjectId !== subjectFilter) return false;
      if (statusFilter === 'pending' && w.reviewed) return false;
      if (statusFilter === 'reviewed' && !w.reviewed) return false;
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [wrongAnswers, subjectFilter, statusFilter]);

  const totalCount = wrongAnswers.length;
  const pendingCount = wrongAnswers.filter((w) => !w.reviewed).length;
  const reviewedCount = totalCount - pendingCount;

  const weakPoints = useMemo<WeakPointTag[]>(() => {
    const countMap = wrongAnswers.reduce((acc, w) => {
      acc[w.subjectId] = (acc[w.subjectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return subjects
      .map((s) => ({
        subjectId: s.id,
        name: s.name,
        icon: s.icon,
        count: countMap[s.id] || 0,
      }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [wrongAnswers, subjects]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleMarkReviewed = useCallback((id: string) => {
    markWrongReviewed(id);
  }, [markWrongReviewed]);

  const handleDelete = useCallback((id: string) => {
    deleteWrongAnswer(id);
    if (expandedId === id) setExpandedId(null);
  }, [deleteWrongAnswer, expandedId]);

  const handleRetrySingle = useCallback((wrongId: string) => {
    navigate(`/ai-engine?mode=wrong-review&ids=${wrongId}`);
  }, [navigate]);

  const handleStartReview = useCallback(() => {
    const pendingWrongs = wrongAnswers.filter(w => !w.reviewed);
    if (pendingWrongs.length === 0) {
      return;
    }
    const ids = pendingWrongs.map(w => w.id).join(',');
    navigate(`/ai-engine?mode=wrong-review&ids=${ids}`);
  }, [wrongAnswers, navigate]);

  const handleClearReviewed = useCallback(() => {
    clearReviewedWrongAnswers();
    setShowClearConfirm(false);
  }, [clearReviewedWrongAnswers]);

  const getQuestionById = useCallback((questionId: string) => {
    return quizQuestions.find((q) => q.id === questionId);
  }, [quizQuestions]);

  const getSubjectById = useCallback((subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  }, [subjects]);

  const stickerColors: ('yellow' | 'pink' | 'blue' | 'green')[] = ['yellow', 'pink', 'blue', 'green'];
  const stickerRotations = useMemo(
    () => weakPoints.map(() => (Math.random() - 0.5) * 10),
    [weakPoints.length]
  );

  return (
    <motion.div
      className="max-w-5xl mx-auto py-6 px-4 pb-24"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      <motion.div variants={fadeUp} className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink-800 font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl">📕</span>
            <span>错题集</span>
          </h1>
          <p className="text-ink-600 font-serif text-base italic">
            收集错题，反复练习，不再二错
          </p>
        </div>
        <div className="font-serif text-right">
          <div className="text-ink-700">
            共 <span className="text-seal font-bold text-2xl mx-1">{totalCount}</span> 道错题
          </div>
          <div className="text-ink-500 text-sm mt-1">
            待订正 <span className="text-seal font-bold">{pendingCount}</span> 道
            {totalCount > 0 && (
              <span className="ml-3 text-[#2D5A27]">
                订正率 {Math.round((reviewedCount / totalCount) * 100)}%
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {weakPoints.length > 0 && (
        <motion.div variants={fadeUp} className="mb-8">
          <PaperCard className="p-5 relative overflow-hidden">
            <h3 className="font-serif text-lg text-ink-800 font-bold mb-4 flex items-center gap-2">
              <span>🏷️</span>
              薄弱知识点
            </h3>
            <div className="flex flex-wrap gap-4 items-start min-h-[120px]">
              {weakPoints.map((point, i) => {
                const maxCount = Math.max(...weakPoints.map((p) => p.count));
                const scale = 0.85 + (point.count / maxCount) * 0.4;
                const colorIndex = i % stickerColors.length;
                const opacity = 0.6 + (point.count / maxCount) * 0.4;

                return (
                  <motion.div
                    key={point.subjectId}
                    initial={{ opacity: 0, scale: 0.5, rotate: stickerRotations[i] - 10 }}
                    animate={{ opacity, scale, rotate: stickerRotations[i] }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                    whileHover={{ scale: scale * 1.1, zIndex: 10, rotate: stickerRotations[i] + 3 }}
                    style={{ zIndex: weakPoints.length - i }}
                  >
                    <StickyNote
                      color={stickerColors[colorIndex]}
                      rotation={stickerRotations[i]}
                      className="!min-w-[100px] cursor-pointer"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{point.icon}</div>
                        <div className="font-serif font-bold text-sm">{point.name}</div>
                        <div className="font-serif text-lg font-bold mt-1" style={{ color: point.count >= maxCount ? '#8B2500' : undefined }}>
                          {point.count}题
                        </div>
                      </div>
                    </StickyNote>
                  </motion.div>
                );
              })}
            </div>
          </PaperCard>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="mb-6">
        <div className="bg-paper-100/50 p-4 rounded-sm border border-ink-600/10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-sm text-ink-600">学科：</span>
              {SUBJECT_FILTERS.map((filter) => (
                <button
                  key={filter.id ?? 'all'}
                  onClick={() => setSubjectFilter(filter.id)}
                  className={`
                    px-3 py-1 font-serif text-sm rounded-sm border transition-all duration-200 cursor-pointer
                    ${subjectFilter === filter.id
                      ? 'bg-seal text-paper-50 border-seal shadow-stamp'
                      : 'bg-paper-50 text-ink-700 border-ink-600/20 hover:bg-paper-200'
                    }
                  `}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.name}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-ink-600/20 hidden md:block" />

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-sm text-ink-600">状态：</span>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                  className={`
                    px-3 py-1 font-serif text-sm rounded-sm border transition-all duration-200 cursor-pointer
                    ${statusFilter === filter.id
                      ? 'bg-ink-800 text-paper-50 border-ink-800'
                      : 'bg-paper-50 text-ink-700 border-ink-600/20 hover:bg-paper-200'
                    }
                  `}
                >
                  {filter.name}
                  {filter.id === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 text-xs bg-seal text-paper-50 px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                  {filter.id === 'reviewed' && reviewedCount > 0 && (
                    <span className="ml-1 text-xs bg-[#2D5A27] text-paper-50 px-1.5 py-0.5 rounded-full">
                      {reviewedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {filteredWrongAnswers.length === 0 ? (
        <motion.div variants={fadeUp}>
          <PaperCard className="p-12">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-6">
                <div className="text-8xl">📚</div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: [0, 10, -5, 5, 0], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <span className="text-3xl">✨</span>
                </motion.div>
              </div>
              <h3 className="font-serif text-2xl text-ink-800 font-bold mb-2">
                {totalCount === 0 ? '暂无错题，继续保持！' : '该筛选条件下暂无错题'}
              </h3>
              <p className="font-serif text-ink-500 text-center max-w-md">
                {totalCount === 0
                  ? '去智能出题模块做几道题吧，错题会自动收集到这里～'
                  : '试试其他筛选条件？'}
              </p>
              {totalCount === 0 && (
                <VintageButton
                  variant="primary"
                  className="mt-6"
                  onClick={() => navigate('/ai-engine')}
                >
                  开始做题 →
                </VintageButton>
              )}
            </div>
          </PaperCard>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-5">
          {filteredWrongAnswers.map((wrong, index) => (
            <WrongAnswerCard
              key={wrong.id}
              wrongAnswer={wrong}
              question={getQuestionById(wrong.questionId)}
              subject={getSubjectById(wrong.subjectId)}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              onMarkReviewed={handleMarkReviewed}
              onDelete={handleDelete}
              onRetry={handleRetrySingle}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {totalCount > 0 && (
        <motion.div variants={fadeUp} className="mt-10">
          <PaperCard className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-serif text-lg text-ink-800 font-bold mb-1">批量操作</h3>
                <p className="font-serif text-sm text-ink-500">
                  针对错题进行集中复习或清理
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {pendingCount === 0 ? (
                  <div className="font-serif text-[#2D5A27] font-bold text-lg flex items-center gap-2">
                    🎉 全部订正完了！
                  </div>
                ) : (
                  <VintageButton
                    variant="stamp"
                    size="lg"
                    onClick={handleStartReview}
                  >
                    📝 开始订正（{pendingCount}道）
                  </VintageButton>
                )}

                {reviewedCount > 0 && (
                  <>
                    {showClearConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm text-seal">确定清空？</span>
                        <VintageButton
                          variant="primary"
                          size="sm"
                          onClick={handleClearReviewed}
                          className="!bg-seal"
                        >
                          确定
                        </VintageButton>
                        <VintageButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClearConfirm(false)}
                        >
                          取消
                        </VintageButton>
                      </div>
                    ) : (
                      <VintageButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowClearConfirm(true)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        清空已订正 ({reviewedCount})
                      </VintageButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </PaperCard>
        </motion.div>
      )}
    </motion.div>
  );
}
