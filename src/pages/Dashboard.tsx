import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import PaperCard from '@/components/PaperCard';
import VintageTag from '@/components/VintageTag';
import StickyNote from '@/components/StickyNote';
import FileUploadZone from '@/components/FileUploadZone';
import VintageButton from '@/components/VintageButton';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function getCountdown(examDate: string) {
  const now = new Date();
  const target = new Date(examDate + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, passed: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, passed: false };
}

function HandDrawnProgressBar({ progress, color = '#3D2B1F' }: { progress: number; color?: string }) {
  return (
    <div className="relative h-3 bg-paper-300/60 rounded-[2px] overflow-hidden"
      style={{ 
        borderBottom: '1px solid rgba(92,64,51,0.15)',
        boxShadow: 'inset 0 1px 2px rgba(92,64,51,0.08)'
      }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="h-full relative"
        style={{ 
          backgroundColor: color,
          opacity: 0.85,
          borderRadius: '1px',
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q10 8 20 10 T40 10' stroke='rgba(255,255,255,0.15)' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: '0 50%',
        }} />
        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/30 rounded-full" />
      </motion.div>
    </div>
  );
}

function getStatusTag(progress: number): { color: 'green' | 'seal' | 'ink'; text: string } {
  if (progress >= 80) return { color: 'green', text: '复习良好' };
  if (progress < 50) return { color: 'seal', text: '需加强' };
  return { color: 'ink', text: '进行中' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { subjects, flashCards, answerRecords, wrongAnswers, setCurrentSubjectFilter } = useAppStore();
  const [uploadExpanded, setUploadExpanded] = useState(false);

  const nearestExam = useMemo(() => {
    if (subjects.length === 0) return null;
    const sorted = [...subjects].sort(
      (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    );
    const nearest = sorted[0];
    const cd = getCountdown(nearest.examDate);
    return { ...nearest, days: cd.days, passed: cd.passed };
  }, [subjects]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
  }, []);

  const avgProgress = useMemo(() => {
    if (subjects.length === 0) return 0;
    return Math.round(subjects.reduce((s, sub) => s + sub.progress, 0) / subjects.length);
  }, [subjects]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayAnswerCount = useMemo(() => {
    return answerRecords.filter(r => r.timestamp >= todayStart).length;
  }, [answerRecords, todayStart]);

  const correctRate = useMemo(() => {
    if (answerRecords.length === 0) return null;
    const correct = answerRecords.filter(r => r.isCorrect).length;
    return Math.round((correct / answerRecords.length) * 100);
  }, [answerRecords]);

  const studyStreak = useMemo(() => {
    const saved = localStorage.getItem('studyStreak');
    return saved ? parseInt(saved, 10) : 7;
  }, []);

  const pendingWrongCount = useMemo(() => {
    return wrongAnswers.filter(w => !w.reviewed).length;
  }, [wrongAnswers]);

  const now = Date.now();
  const dueFlashcards = useMemo(() => {
    return flashCards.filter(c => c.nextReviewDate <= now && !c.mastered).length;
  }, [flashCards, now]);

  const lowestProgressSubject = useMemo(() => {
    if (subjects.length === 0) return null;
    return [...subjects].sort((a, b) => a.progress - b.progress)[0];
  }, [subjects]);

  const stickyNotes = useMemo(() => {
    const notes = [];

    if (nearestExam) {
      notes.push({
        color: 'yellow' as const,
        rotation: -3,
        text: nearestExam.passed
          ? `🎉 ${nearestExam.name}考试加油！`
          : `📌 ${nearestExam.name}还有${nearestExam.days}天考试`,
        top: 0,
      });
    } else {
      notes.push({
        color: 'yellow' as const,
        rotation: -3,
        text: '📌 还没有添加考试科目哦',
        top: 0,
      });
    }

    let encourageText = '💪 今天也要加油复习呀！';
    if (correctRate !== null) {
      if (correctRate >= 80) {
        encourageText = `🌟 正确率${correctRate}%！太棒了继续保持`;
      } else if (correctRate >= 60) {
        encourageText = `💪 正确率${correctRate}%，再接再厉！`;
      } else {
        encourageText = `📝 正确率${correctRate}%，多看看错题本吧`;
      }
    }
    notes.push({
      color: 'pink' as const,
      rotation: 2,
      text: encourageText,
      top: 15,
    });

    if (pendingWrongCount > 0) {
      notes.push({
        color: 'blue' as const,
        rotation: -1.5,
        text: `⚠️ 有${pendingWrongCount}道错题待订正`,
        top: 8,
      });
    } else {
      notes.push({
        color: 'blue' as const,
        rotation: -1.5,
        text: '🎉 错题都订正完了！',
        top: 8,
      });
    }

    if (dueFlashcards > 0) {
      notes.push({
        color: 'green' as const,
        rotation: 2.5,
        text: `📚 ${dueFlashcards}张闪卡待复习`,
        top: 20,
      });
    } else {
      notes.push({
        color: 'green' as const,
        rotation: 2.5,
        text: '✨ 闪卡都复习完啦！',
        top: 20,
      });
    }

    return notes;
  }, [nearestExam, correctRate, pendingWrongCount, dueFlashcards]);

  const handleSubjectClick = (subjectId: string | null) => {
    setCurrentSubjectFilter(subjectId);
    navigate('/ai-engine');
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-12"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="handwritten text-3xl md:text-4xl font-serif text-ink-800 leading-tight mb-1"
            style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontStyle: 'italic' }}>
            早上好，复习人 ✦
          </h1>
          <p className="font-serif text-ink-600 text-sm mt-1">{todayStr}</p>
        </div>
        
        {nearestExam && (
          <PaperCard status="default" rotation={-1} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex flex-col items-center justify-center bg-seal/10 border border-seal/20 rounded">
                <span className="text-2xl font-serif font-bold text-seal leading-none">{nearestExam.days}</span>
                <span className="text-[9px] font-serif text-seal/70 mt-0.5">天后</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base">{nearestExam.icon}</span>
                  <span className="font-serif text-base text-ink-800 font-medium">{nearestExam.name}</span>
                </div>
                <p className="font-serif text-xs text-ink-500">
                  {nearestExam.examDate}
                </p>
              </div>
            </div>
          </PaperCard>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="mb-8">
        <PaperCard status="active" rotation={-0.5} className="p-6">
          <h2 className="font-serif text-2xl md:text-3xl text-ink-800 font-bold mb-5 flex items-center gap-2">
            📝 今天学什么？
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {subjects.map((subject) => (
              <motion.button
                key={subject.id}
                onClick={() => handleSubjectClick(subject.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-md border-2 border-dashed transition-all cursor-pointer hover:shadow-md"
                style={{
                  borderColor: subject.color + '40',
                  backgroundColor: subject.color + '08',
                }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-3xl">{subject.icon}</span>
                <span className="font-serif text-sm font-medium text-ink-800">{subject.name}</span>
                <span className="text-xs font-serif" style={{ color: subject.color }}>开始刷题 →</span>
              </motion.button>
            ))}
            <motion.button
              onClick={() => handleSubjectClick(null)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-md border-2 border-dashed border-ink-600/30 bg-paper-100/50 transition-all cursor-pointer hover:shadow-md hover:border-ink-600/50"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-3xl">📚</span>
              <span className="font-serif text-sm font-medium text-ink-800">全部学科</span>
              <span className="text-xs font-serif text-ink-600">开始刷题 →</span>
            </motion.button>
          </div>
        </PaperCard>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-8">
        <div className="max-w-2xl">
          {!uploadExpanded ? (
            <motion.button
              onClick={() => setUploadExpanded(true)}
              className="w-full p-4 bg-paper-100/60 border border-dashed border-ink-600/20 rounded-md text-left hover:bg-paper-200/60 hover:border-ink-600/30 transition-colors cursor-pointer flex items-center gap-3"
              whileHover={{ x: 4 }}
            >
              <span className="text-xl">📎</span>
              <span className="font-serif text-ink-700">上传复习资料（PDF/Word）生成专属题目</span>
              <span className="ml-auto text-ink-500 text-sm">点击展开 →</span>
            </motion.button>
          ) : (
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg text-ink-800 font-semibold flex items-center gap-2">
                  📎 上传资料
                </h3>
                <button
                  onClick={() => setUploadExpanded(false)}
                  className="text-ink-500 hover:text-ink-700 text-sm font-serif"
                >
                  收起 ↑
                </button>
              </div>
              <FileUploadZone />
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl text-ink-800 font-semibold">📚 我的学科</h2>
          <div className="h-px flex-1 bg-ink-800/20 ml-4 mb-2" />
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.flex.gap-4.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
          
          {subjects.map((subject) => {
            const isLowest = lowestProgressSubject?.id === subject.id;
            const statusTag = getStatusTag(subject.progress);
            const todoQuestions = Math.max(0, Math.round((100 - subject.progress) / 10));
            
            return (
              <motion.div
                key={subject.id}
                whileHover={{ y: -4 }}
                onClick={() => handleSubjectClick(subject.id)}
                className="cursor-pointer flex-shrink-0"
                style={{ width: '240px' }}
              >
                <PaperCard 
                  status={isLowest ? 'active' : 'default'} 
                  rotation={isLowest ? 0 : ((subject.id.charCodeAt(0) % 5) - 2) * 0.5}
                  className="p-5 h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{subject.icon}</span>
                      <span className="font-serif text-lg font-semibold text-ink-800">{subject.name}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <HandDrawnProgressBar 
                      progress={subject.progress} 
                      color={isLowest ? '#8B2500' : subject.color} 
                    />
                  </div>
                  <p className="font-serif text-xs text-ink-600 mb-3">已掌握 {subject.progress}%</p>
                  
                  <div className="space-y-2">
                    <p className="font-serif text-xs text-ink-500 flex items-center gap-1">
                      <span>📅</span> 考试日期：{subject.examDate}
                    </p>
                    <p className="font-serif text-xs text-ink-500 flex items-center gap-1">
                      <span>✏️</span> 待刷题：{todoQuestions} 道
                    </p>
                    <div className="pt-1">
                      <VintageTag color={statusTag.color}>{statusTag.text}</VintageTag>
                    </div>
                  </div>
                </PaperCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl text-ink-800 font-semibold">📝 今日便签</h2>
          <div className="h-px flex-1 bg-ink-800/20 ml-4 mb-2" />
        </div>
        
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[160px]">
          {stickyNotes.map((note, i) => (
            <div key={i} className="relative" style={{ marginTop: `${note.top}px` }}>
              <StickyNote color={note.color} rotation={note.rotation}>
                {note.text}
              </StickyNote>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl text-ink-800 font-semibold">📊 学习统计</h2>
          <div className="h-px flex-1 bg-ink-800/20 ml-4 mb-2" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PaperCard className="p-5 text-center" rotation={-1}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">
              {todayAnswerCount > 0 ? todayAnswerCount : '--'}
            </div>
            <div className="font-serif text-sm text-ink-600">今日答题</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={0.5}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">
              {correctRate !== null ? `${correctRate}%` : '--'}
            </div>
            <div className="font-serif text-sm text-ink-600">正确率</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={-0.8}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">{studyStreak}</div>
            <div className="font-serif text-sm text-ink-600">连续天数</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={1.2}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">{avgProgress}%</div>
            <div className="font-serif text-sm text-ink-600">总掌握度</div>
          </PaperCard>
        </div>

        {lowestProgressSubject && lowestProgressSubject.progress < 60 && (
          <div className="mt-6">
            <PaperCard className="p-5" rotation={-1}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-serif text-ink-800 font-medium">
                    {lowestProgressSubject.icon} {lowestProgressSubject.name}进度稍慢
                  </p>
                  <p className="font-serif text-sm text-ink-600 mt-0.5">
                    当前掌握度 {lowestProgressSubject.progress}%，建议优先刷这科题目
                  </p>
                </div>
                <VintageButton
                  variant="primary"
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleSubjectClick(lowestProgressSubject.id)}
                >
                  去刷题
                </VintageButton>
              </div>
            </PaperCard>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
