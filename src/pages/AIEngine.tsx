import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookMarked, CheckCircle2, XCircle, Lightbulb, HelpCircle, MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import StickyNote from '@/components/StickyNote';

const SUBJECT_FILTERS = [
  { id: null, name: '全部', icon: '📝' },
  { id: 'math', name: '高数', icon: '📐' },
  { id: 'english', name: '英语', icon: '📖' },
  { id: 'linear', name: '线代', icon: '📊' },
  { id: 'programming', name: '编程', icon: '💻' },
  { id: 'physics', name: '物理', icon: '⚛️' },
];

const DIFFICULTY_LABEL = {
  easy: { label: '易', color: 'green' as const },
  medium: { label: '中', color: 'gold' as const },
  hard: { label: '难', color: 'seal' as const },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const CHINESE_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五'];
const CIRCLED_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

type ExplanationStyle = 'detailed' | 'concise' | 'socratic';

const EXPLANATION_STYLES: { id: ExplanationStyle; label: string; icon: string }[] = [
  { id: 'detailed', label: '详细讲解', icon: '📝' },
  { id: 'concise', label: '简洁提示', icon: '💡' },
  { id: 'socratic', label: '引导思考', icon: '🤔' },
];

const SOCRATIC_QUESTIONS = [
  '先想想这道题考的是什么知识点？',
  '回忆一下相关的公式、定理或定义是什么？',
  '如果给你一个类似的题，你会怎么入手分析？',
];

export default function AIEngine() {
  const { addToast } = useToastStore();
  const {
    quizQuestions,
    subjects,
    currentQuestionIndex,
    currentSubjectFilter,
    setCurrentSubjectFilter,
    submitAnswer,
    nextQuestion,
  } = useAppStore();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>('detailed');
  const [isWrongMarked, setIsWrongMarked] = useState(false);
  const [isStampAnimating, setIsStampAnimating] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (currentSubjectFilter) {
      return quizQuestions.filter((q) => q.subjectId === currentSubjectFilter);
    }
    return quizQuestions;
  }, [quizQuestions, currentSubjectFilter]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || null;
  const currentSubject = subjects.find((s) => s.id === currentQuestion?.subjectId);

  const totalQuestions = filteredQuestions.length;
  const displayIndex = currentQuestionIndex + 1;

  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);
    setExplanationStyle('detailed');
    setIsWrongMarked(false);
    setIsStampAnimating(false);
  }, [currentQuestionIndex, currentSubjectFilter]);

  const handleSelectOption = useCallback((index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  }, [isSubmitted]);

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || !currentQuestion) return;
    const result = submitAnswer(currentQuestion.id, selectedOption);
    setIsSubmitted(true);
    if (result.isCorrect) {
      addToast('success', '回答正确！继续加油～');
    } else {
      addToast('error', '答错了，看看解析吧');
    }
  }, [selectedOption, currentQuestion, submitAnswer, addToast]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleMarkWrong = useCallback(() => {
    if (!currentQuestion || !isWrongMarked) {
      setIsStampAnimating(true);
      setTimeout(() => {
        setIsWrongMarked(true);
        addToast('success', '已收录错题本 📕');
      }, 400);
    }
  }, [currentQuestion, isWrongMarked, addToast]);

  const handleFilterChange = useCallback((subjectId: string | null) => {
    setCurrentSubjectFilter(subjectId);
  }, [setCurrentSubjectFilter]);

  const handleShowAnswer = useCallback(() => {
    setExplanationStyle('detailed');
  }, []);

  const isCorrect = isSubmitted && selectedOption === currentQuestion?.correctIndex;

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <PaperCard className="p-12 text-center">
          <p className="font-serif text-ink-600 text-lg">暂无题目</p>
        </PaperCard>
      </div>
    );
  }

  const difficulty = DIFFICULTY_LABEL[currentQuestion.difficulty];
  const stepRotations = useMemo(
    () => currentQuestion.steps.map(() => (Math.random() - 0.5) * 3),
    [currentQuestion.id]
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24">
      {/* 顶部：标题 + 学科筛选 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
            <BookMarked className="text-seal" size={24} />
            智能出题
          </h1>
          <div className="font-serif text-ink-600 text-sm">
            第 <span className="text-seal font-bold text-lg">{displayIndex}</span> / {totalQuestions} 题
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {SUBJECT_FILTERS.map((filter) => (
            <button
              key={filter.id ?? 'all'}
              onClick={() => handleFilterChange(filter.id)}
              className={`
                px-4 py-1.5 font-serif text-sm rounded-sm border transition-all duration-200 cursor-pointer
                ${currentSubjectFilter === filter.id
                  ? 'bg-seal text-paper-50 border-seal shadow-stamp'
                  : 'bg-paper-100 text-ink-700 border-ink-600/20 hover:bg-paper-200'
                }
              `}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* 题卡区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20, rotateX: 5 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -20, rotateX: -5 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <PaperCard className="relative min-h-[400px]">
            {/* 左侧密封线装饰 */}
            <div className="absolute left-8 top-6 bottom-6 w-px border-l-2 border-dashed border-ink-600/20 pointer-events-none">
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 text-ink-500/40 text-xs font-serif whitespace-nowrap tracking-widest">
                密封线内不要答题
              </div>
            </div>

            <div className="pl-16 pr-8 py-8">
              {/* 顶部标签：学科 + 难度 */}
              <div className="flex items-center gap-2 mb-6">
                {currentSubject && (
                  <VintageTag color="ink">{currentSubject.icon} {currentSubject.name}</VintageTag>
                )}
                <VintageTag color={difficulty.color}>{difficulty.label}</VintageTag>
                {currentQuestion.type === 'judgment' && (
                  <VintageTag color="worn">判断题</VintageTag>
                )}
              </div>

              {/* 题号：红笔圈注 */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-seal flex items-center justify-center"
                    style={{ boxShadow: '0 0 0 1px rgba(139,37,0,0.1)' }}
                  >
                    <span className="font-serif text-seal font-bold text-sm">
                      {CHINESE_NUMERALS[currentQuestionIndex] || `Q${displayIndex}`}
                    </span>
                  </div>
                </div>

                {/* 题干 */}
                <div className="flex-1 pt-2">
                  <p className="font-serif text-xl text-ink-800 leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* 选项区域 */}
              <div className="space-y-3 mt-8 ml-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrectOption = index === currentQuestion.correctIndex;
                  const showCorrect = isSubmitted && isCorrectOption;
                  const showWrong = isSubmitted && isSelected && !isCorrectOption;
                  const showInactive = isSubmitted && !isSelected && !isCorrectOption;

                  return (
                    <motion.div
                      key={index}
                      onClick={() => handleSelectOption(index)}
                      className={`
                        relative p-4 rounded-sm border cursor-pointer transition-all duration-200
                        flex items-start gap-4
                        ${!isSubmitted && isSelected
                          ? 'border-seal bg-seal/5'
                          : ''
                        }
                        ${showCorrect
                          ? 'border-[#2D5A27] bg-[#2D5A27]/5'
                          : ''
                        }
                        ${showWrong
                          ? 'border-seal bg-seal/10'
                          : ''
                        }
                        ${showInactive
                          ? 'opacity-50 border-ink-600/20 bg-paper-50'
                          : ''
                        }
                        ${!isSubmitted && !isSelected
                          ? 'border-ink-600/20 bg-paper-50 hover:border-seal/40 hover:bg-paper-100'
                          : ''
                        }
                      `}
                      whileHover={!isSubmitted ? { scale: 1.005 } : undefined}
                      whileTap={!isSubmitted ? { scale: 0.995 } : undefined}
                    >
                      {/* 选项标记 */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-mono font-bold text-lg relative">
                        {showCorrect ? (
                          <>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[#2D5A27] text-2xl z-10"
                            >
                              ✓
                            </motion.span>
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                              className="absolute inset-0 rounded-full border-2 border-[#2D5A27]"
                            />
                          </>
                        ) : showWrong ? (
                          <>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-seal text-2xl z-10"
                            >
                              ✗
                            </motion.span>
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40">
                              <motion.line
                                x1="5" y1="5" x2="35" y2="35"
                                stroke="#8B2500" strokeWidth="2.5" strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                              />
                            </svg>
                          </>
                        ) : (
                          <span className={`${isSelected ? 'text-seal' : 'text-ink-500'}`}>
                            [{OPTION_LABELS[index]}]
                          </span>
                        )}
                      </div>

                      {/* 选项内容 */}
                      <div className="flex-1 pt-1">
                        <p className={`font-serif text-base leading-relaxed
                          ${showCorrect ? 'text-[#2D5A27] font-medium' : ''}
                          ${showWrong ? 'text-seal font-medium' : ''}
                          ${!isSubmitted && isSelected ? 'text-ink-800' : ''}
                          ${!isSubmitted && !isSelected ? 'text-ink-700' : ''}
                          ${showInactive ? 'text-ink-500' : ''}
                        `}>
                          {option}
                        </p>
                      </div>

                      {/* 正确答案红圈标注 */}
                      {showCorrect && isSubmitted && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                          className="absolute -right-2 -top-3 z-20"
                        >
                          <div className="relative">
                            <svg width="100" height="36" viewBox="0 0 100 36" className="overflow-visible">
                              <motion.ellipse
                                cx="40" cy="18" rx="42" ry="16"
                                fill="none" stroke="#8B2500" strokeWidth="2.5" strokeLinecap="round"
                                strokeDasharray="200"
                                initial={{ strokeDashoffset: 200 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                                style={{ filter: 'drop-shadow(0 1px 1px rgba(139,37,0,0.2))' }}
                              />
                              <motion.text
                                x="40" y="23"
                                textAnchor="middle"
                                fill="#8B2500"
                                fontFamily='"Noto Serif SC", "STKaiti", "KaiTi", cursive'
                                fontSize="14"
                                fontStyle="italic"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                              >
                                正确答案
                              </motion.text>
                            </svg>
                          </div>
                        </motion.div>
                      )}

                      {/* 选中时的填涂效果 */}
                      {isSelected && !isSubmitted && (
                        <motion.div
                          layoutId="option-selected"
                          className="absolute inset-0 rounded-sm border-2 border-seal/30 pointer-events-none"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* 结果反馈区 */}
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-8 ml-4"
                  >
                    {/* 答对反馈 */}
                    {isCorrect ? (
                      <div className="p-5 rounded-sm border-l-4 bg-[#2D5A27]/5 border-[#2D5A27]">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="text-[#2D5A27]" size={28} />
                          <span className="font-serif text-2xl font-bold text-[#2D5A27]">
                            回答正确！
                          </span>
                        </div>

                        {!showExplanation ? (
                          <motion.button
                            onClick={() => setShowExplanation(true)}
                            className="font-serif text-sm text-[#2D5A27] italic underline decoration-dotted underline-offset-4 hover:opacity-70 transition-opacity"
                            whileHover={{ x: 2 }}
                          >
                            查看解析 →
                          </motion.button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 border-t border-[#2D5A27]/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-1 h-full min-h-[40px] bg-[#2D5A27]/30 rounded-full flex-shrink-0" />
                              <div>
                                <p className="handwritten text-[#2D5A27] text-base" style={{ transform: 'skew(-2deg)' }}>
                                  {currentQuestion.explanation}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      /* 答错反馈 + 讲解面板 */
                      <div>
                        <div className="p-5 rounded-sm border-l-4 bg-seal/5 border-seal">
                          <div className="flex items-center gap-3 mb-3">
                            <XCircle className="text-seal" size={28} />
                            <span className="font-serif text-2xl font-bold text-seal">
                              回答错误
                            </span>
                          </div>

                          <p className="font-serif text-ink-700 mb-2">
                            正确答案是：<span className="text-[#2D5A27] font-bold">[{OPTION_LABELS[currentQuestion.correctIndex]}] {currentQuestion.options[currentQuestion.correctIndex]}</span>
                          </p>

                          {!showExplanation && (
                            <VintageButton
                              variant="primary"
                              onClick={() => setShowExplanation(true)}
                              className="mt-2"
                            >
                              <Lightbulb size={16} className="mr-2" />
                              查看详细讲解
                            </VintageButton>
                          )}
                        </div>

                        {/* 讲解面板展开区域 */}
                        <AnimatePresence>
                          {showExplanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t-2 border-seal/30 relative">
                                {/* 左侧批改栏竖线 */}
                                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-seal/20" />

                                {/* 讲解风格切换器 */}
                                <div className="flex items-center gap-2 mb-6 pl-4 flex-wrap">
                                  <span className="handwritten text-seal text-sm mr-1" style={{ transform: 'skew(-1deg)' }}>
                                    讲解方式：
                                  </span>
                                  {EXPLANATION_STYLES.map((style) => (
                                    <motion.button
                                      key={style.id}
                                      onClick={() => setExplanationStyle(style.id)}
                                      className={`
                                        px-3 py-1.5 font-serif text-xs rounded-sm border transition-all cursor-pointer
                                        ${explanationStyle === style.id
                                          ? 'bg-seal text-paper-50 border-seal shadow-stamp'
                                          : 'bg-paper-50 text-ink-600 border-ink-600/20 hover:border-seal/40 hover:bg-seal/5'
                                        }
                                      `}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      style={explanationStyle === style.id ? { transform: 'rotate(-1deg)' } : undefined}
                                    >
                                      <span className="mr-1">{style.icon}</span>
                                      {style.label}
                                    </motion.button>
                                  ))}
                                </div>

                                {/* 讲解内容区域 */}
                                <div className="pl-4 relative">
                                  <AnimatePresence mode="wait">
                                    {/* 详细讲解风格 */}
                                    {explanationStyle === 'detailed' && (
                                      <motion.div
                                        key="detailed"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.25 }}
                                      >
                                        {/* 解题步骤 */}
                                        <div className="mb-6">
                                          <h4 className="handwritten text-seal text-lg mb-4 flex items-center gap-2" style={{ transform: 'skew(-2deg)', color: '#8B2500' }}>
                                            <span className="text-xl">【</span>
                                            解题步骤
                                            <span className="text-xl">】</span>
                                          </h4>
                                          <div className="space-y-3">
                                            {currentQuestion.steps.map((step, i) => (
                                              <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-start gap-3"
                                              >
                                                <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-seal flex items-center justify-center bg-seal/5"
                                                  style={{ transform: `rotate(${stepRotations[i] * 0.3}deg)` }}>
                                                  <span className="font-serif text-seal font-bold text-sm">
                                                    {CIRCLED_NUMERALS[i]}
                                                  </span>
                                                </div>
                                                <div
                                                  className="flex-1 border-l-2 border-seal/60 pl-3 py-1"
                                                  style={{ transform: `rotate(${stepRotations[i] * 0.2}deg)` }}
                                                >
                                                  <p className="font-serif text-ink-700 text-base leading-relaxed">
                                                    {step}
                                                  </p>
                                                </div>
                                              </motion.div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* 易错点警示 */}
                                        {currentQuestion.mistakes.length > 0 && (
                                          <div className="mb-4">
                                            <h4 className="handwritten text-seal text-lg mb-3 flex items-center gap-2" style={{ transform: 'skew(-1deg)', color: '#8B2500' }}>
                                              ⚠️ 易错点
                                            </h4>
                                            <div className="max-w-md">
                                              <StickyNote color="yellow" rotation={-2} className="!py-4">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-red-600 text-lg flex-shrink-0">❗</span>
                                                  <ul className="space-y-1.5">
                                                    {currentQuestion.mistakes.map((mistake, i) => (
                                                      <li key={i} className="flex items-start gap-2">
                                                        <span className="text-seal font-bold flex-shrink-0">•</span>
                                                        <span className="text-[#5D4E37]">{mistake}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              </StickyNote>
                                            </div>
                                          </div>
                                        )}
                                      </motion.div>
                                    )}

                                    {/* 简洁提示风格 */}
                                    {explanationStyle === 'concise' && (
                                      <motion.div
                                        key="concise"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.25 }}
                                        className="flex justify-end"
                                      >
                                        <div className="max-w-sm relative">
                                          <StickyNote color="pink" rotation={-4}>
                                            <div className="flex items-start gap-2">
                                              <span className="text-xl flex-shrink-0">💡</span>
                                              <div>
                                                <p className="handwritten text-base leading-relaxed" style={{ color: '#5D3A3A' }}>
                                                  {currentQuestion.explanation}
                                                </p>
                                              </div>
                                            </div>
                                          </StickyNote>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* 苏格拉底引导风格 */}
                                    {explanationStyle === 'socratic' && (
                                      <motion.div
                                        key="socratic"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.25 }}
                                      >
                                        <div className="mb-4">
                                          <h4 className="handwritten text-ink-700 text-base mb-4 flex items-center gap-2 italic">
                                            <HelpCircle size={18} className="text-blue-700" />
                                            先不要看答案，试着思考以下问题：
                                          </h4>
                                          <div className="space-y-3">
                                            {SOCRATIC_QUESTIONS.map((question, i) => (
                                              <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.15 }}
                                                className="max-w-md"
                                              >
                                                <StickyNote
                                                  color="blue"
                                                  rotation={i % 2 === 0 ? -2 : 2}
                                                  className="!py-3"
                                                >
                                                  <div className="flex items-start gap-2">
                                                    <span className="text-lg flex-shrink-0">❓</span>
                                                    <p className="text-[#2C3E50] font-serif text-base leading-relaxed">
                                      {question}
                                                    </p>
                                                  </div>
                                                </StickyNote>
                                              </motion.div>
                                            ))}
                                          </div>
                                        </div>

                                        <motion.button
                                          onClick={handleShowAnswer}
                                          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-serif text-sm bg-seal/10 text-seal border-2 border-seal/30 rounded-sm hover:bg-seal/20 transition-colors cursor-pointer"
                                          whileHover={{ scale: 1.02, x: 3 }}
                                          whileTap={{ scale: 0.98 }}
                                          style={{ transform: 'rotate(-1deg)' }}
                                        >
                                          <MessageCircle size={16} />
                                          我想出来了，查看答案 →
                                        </motion.button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PaperCard>
        </motion.div>
      </AnimatePresence>

      {/* 底部操作栏 */}
      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        {!isSubmitted ? (
          <VintageButton
            variant="stamp"
            size="lg"
            disabled={selectedOption === null}
            onClick={handleSubmit}
          >
            提交答案
          </VintageButton>
        ) : (
          <>
            {!isCorrect && (
              <div className="relative">
                <motion.button
                  onClick={handleMarkWrong}
                  disabled={isWrongMarked}
                  className={`
                    relative inline-flex items-center justify-center font-serif font-bold
                    w-24 h-24 rounded-full text-sm select-none
                    transition-all duration-200 focus:outline-none
                    ${isWrongMarked
                      ? 'bg-ink-400/30 text-ink-500 border-2 border-ink-400/30 cursor-default'
                      : 'bg-seal text-paper-50 border-2 border-seal-dark/40 shadow-stamp hover:opacity-100 opacity-85 cursor-pointer'
                    }
                  `}
                  style={!isWrongMarked ? { letterSpacing: '1px' } : undefined}
                  whileHover={!isWrongMarked ? { scale: 1.05, rotate: -6 } : undefined}
                  whileTap={!isWrongMarked ? { scale: 0.97 } : undefined}
                  animate={isStampAnimating ? {
                    scale: [1, 1.3, 0.95, 1.02, 1],
                    rotate: [-8, -10, -6, -9, -8],
                    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
                  } : { rotate: isWrongMarked ? -8 : -8 }}
                >
                  {isWrongMarked ? (
                    <>
                      <span className="leading-tight text-center">
                        已收录
                        <br />
                        <span className="text-lg">✓</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="leading-tight text-center">
                        📕
                        <br />
                        收录错题本
                      </span>
                    </>
                  )}
                </motion.button>

                {/* 盖章动画效果 */}
                <AnimatePresence>
                  {isStampAnimating && !isWrongMarked && (
                    <motion.div
                      initial={{ scale: 2, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 0.9, rotate: -8 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                      className="absolute inset-0 rounded-full border-4 border-seal flex items-center justify-center pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, rgba(139,37,0,0.1) 0%, transparent 70%)',
                        boxShadow: 'inset 0 0 20px rgba(139,37,0,0.15)'
                      }}
                    >
                      <span className="font-serif text-seal text-xs font-bold" style={{ letterSpacing: '2px' }}>
                        已收录
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <VintageButton
              variant={isCorrect ? 'primary' : 'ghost'}
              onClick={handleNext}
            >
              下一题
              <ArrowRight size={16} className="ml-2" />
            </VintageButton>
          </>
        )}
      </div>
    </div>
  );
}
