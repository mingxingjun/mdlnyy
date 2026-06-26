import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import PaperCard from '@/components/PaperCard';
import VintageTag from '@/components/VintageTag';
import StickyNote from '@/components/StickyNote';
import FileUploadZone from '@/components/FileUploadZone';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
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
  const { subjects, flashCards } = useAppStore();

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

  const unmasteredCount = useMemo(() => flashCards.filter(c => !c.mastered).length, [flashCards]);
  const masteredCount = useMemo(() => flashCards.filter(c => c.mastered).length, [flashCards]);
  const correctRate = useMemo(() => {
    if (flashCards.length === 0) return 0;
    return Math.round((masteredCount / flashCards.length) * 100);
  }, [masteredCount, flashCards]);

  const lowestProgressSubject = useMemo(() => {
    if (subjects.length === 0) return null;
    return [...subjects].sort((a, b) => a.progress - b.progress)[0];
  }, [subjects]);

  const stickyNotes = [
    { color: 'yellow' as const, rotation: -3, text: '📌 今日待办：完成高数第五章练习题', top: 0 },
    { color: 'pink' as const, rotation: 2, text: `💪 坚持就是胜利！已经复习${avgProgress}%了`, top: 15 },
    { color: 'blue' as const, rotation: -1.5, text: '⚠️ 有3道错题待订正', top: 8 },
    { color: 'green' as const, rotation: 2.5, text: `📚 ${unmasteredCount}张闪卡待复习`, top: 20 },
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-12"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="handwritten text-3xl md:text-4xl font-serif text-ink-800 leading-tight mb-1"
            style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontStyle: 'italic' }}>
            早上好，复习人 ✦
          </h1>
          <p className="font-serif text-ink-600 text-sm mt-1">{todayStr}</p>
        </div>
        
        {nearestExam && (
          <PaperCard status="default" rotation={-2} className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex flex-col items-center justify-center bg-seal/10 border border-seal/20 rounded">
                <span className="text-3xl font-serif font-bold text-seal leading-none">{nearestExam.days}</span>
                <span className="text-[10px] font-serif text-seal/70 mt-1">天后考试</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{nearestExam.icon}</span>
                  <span className="font-serif text-lg text-ink-800 font-medium">{nearestExam.name}</span>
                </div>
                <p className="font-serif text-xs text-ink-500">
                  最近的考试 · {nearestExam.examDate}
                </p>
              </div>
            </div>
          </PaperCard>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="mb-10">
        <FileUploadZone />
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
                onClick={() => navigate('/ai-engine')}
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
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">12</div>
            <div className="font-serif text-sm text-ink-600">今日答题</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={0.5}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">{correctRate}%</div>
            <div className="font-serif text-sm text-ink-600">正确率</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={-0.8}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">7</div>
            <div className="font-serif text-sm text-ink-600">连续天数</div>
          </PaperCard>
          <PaperCard className="p-5 text-center" rotation={1.2}>
            <div className="text-3xl font-serif font-bold text-ink-800 mb-1">{avgProgress}%</div>
            <div className="font-serif text-sm text-ink-600">总掌握度</div>
          </PaperCard>
        </div>

        <div className="mt-6">
          <PaperCard className="p-5">
            <h3 className="font-serif text-sm text-ink-700 mb-4">各学科进度对比</h3>
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 flex-shrink-0">{subject.icon}</span>
                  <span className="font-serif text-sm text-ink-700 w-20 flex-shrink-0 truncate">{subject.name}</span>
                  <div className="flex-1">
                    <HandDrawnProgressBar progress={subject.progress} color={subject.color} />
                  </div>
                  <span className="font-serif text-xs text-ink-600 w-10 text-right tabular-nums">{subject.progress}%</span>
                </div>
              ))}
            </div>
          </PaperCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
