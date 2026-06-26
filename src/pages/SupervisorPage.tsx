import { useMemo } from 'react';
import { motion } from 'framer-motion';
import PaperCard from '@/components/PaperCard';
import StickyNote from '@/components/StickyNote';
import { useAppStore } from '@/store/useAppStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const STREAK_KEY = 'study-streak-days';

function getStreakDays(): number {
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.days && data.lastDate === new Date().toDateString()) {
        return data.days;
      }
    }
  } catch {
  }
  return 7;
}

function saveStreak(days: number) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      days,
      lastDate: new Date().toDateString(),
    }));
  } catch {
  }
}

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

function daysUntilExam(examDate: string): number {
  const exam = new Date(examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
}

function HandDrawnProgressBar({ progress, color, delay = 0 }: { progress: number; color: string; delay?: number }) {
  const segments = useMemo(() => {
    const count = 20;
    const filledCount = Math.round((progress / 100) * count);
    return Array.from({ length: count }, (_, i) => ({
      filled: i < filledCount,
      height: 8 + Math.sin(i * 0.8) * 3 + (Math.random() - 0.5) * 2,
      offset: (Math.random() - 0.5) * 2,
    }));
  }, [progress]);

  return (
    <div className="flex-1 h-6 mx-3 relative overflow-visible">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-paper-300 rounded-sm"
        style={{ borderBottom: '1px dashed rgba(92,64,51,0.2)' }}
      />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 flex items-stretch gap-[1px] overflow-hidden rounded-sm">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            className="flex-1"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: seg.filled ? 1 : 0 }}
            transition={{ duration: 0.3, delay: delay + i * 0.02, ease: 'easeOut' }}
            style={{
              transformOrigin: 'left',
              backgroundColor: seg.filled ? color : 'transparent',
              height: `${seg.height}px`,
              marginTop: `${(12 - seg.height) / 2 + seg.offset}px`,
              borderRadius: '1px',
              opacity: seg.filled ? 0.85 + (Math.random() * 0.15) : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WeeklyBarChart({ todayCount }: { todayCount: number }) {
  const weekData = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return days.map((label, i) => {
      const isToday = i === mondayIndex;
      let height: number;
      if (isToday) {
        height = Math.max(15, Math.min(100, todayCount * 8 + 20));
      } else {
        height = 20 + Math.sin(i * 1.3) * 25 + (i % 2 === 0 ? 15 : 0) + Math.random() * 20;
        height = Math.max(15, Math.min(95, height));
      }
      return { label, height, isToday };
    });
  }, [todayCount]);

  return (
    <div className="mt-4">
      <div className="flex items-end gap-2 h-32 px-2">
        {weekData.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${day.height}%` }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
              className="w-full max-w-[32px] rounded-t-sm relative"
              style={{
                backgroundColor: day.isToday ? 'rgba(139, 37, 0, 0.5)' : 'rgba(92, 64, 51, 0.25)',
                borderTop: `2px solid ${day.isToday ? '#8B2500' : 'rgba(92, 64, 51, 0.4)'}`,
                borderLeft: '1px solid rgba(92,64,51,0.1)',
                borderRight: '1px solid rgba(92,64,51,0.1)',
                boxShadow: day.isToday ? '0 -2px 6px rgba(139,37,0,0.15)' : 'none',
              }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-serif text-ink-500 tabular-nums whitespace-nowrap">
                {day.isToday ? todayCount : ''}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-2">
        {weekData.map((day, i) => (
          <span
            key={i}
            className="flex-1 text-center text-xs font-serif"
            style={{ color: day.isToday ? '#8B2500' : '#7A6350', fontWeight: day.isToday ? 600 : 400 }}
          >
            {day.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StampSeal({ text }: { text: string }) {
  return (
    <div className="stamp-red" style={{ width: '64px', height: '64px', fontSize: '12px' }}>
      {text}
    </div>
  );
}

export default function SupervisorPage() {
  const subjects = useAppStore(s => s.subjects);
  const answerRecords = useAppStore(s => s.answerRecords);
  const wrongAnswers = useAppStore(s => s.wrongAnswers);
  const flashCards = useAppStore(s => s.flashCards);

  const streakDays = useMemo(() => {
    const days = getStreakDays();
    saveStreak(days);
    return days;
  }, []);

  const stats = useMemo(() => {
    const todayRecords = answerRecords.filter(r => isToday(r.timestamp));
    const todayCount = todayRecords.length;
    const totalCount = answerRecords.length;
    const correctCount = answerRecords.filter(r => r.isCorrect).length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const totalWrong = wrongAnswers.length;
    const pendingWrong = wrongAnswers.filter(w => !w.reviewed).length;
    const now = Date.now();
    const dueCards = flashCards.filter(c => !c.mastered && c.nextReviewDate <= now).length;

    const subjectWrongCounts: Record<string, number> = {};
    wrongAnswers.forEach(w => {
      subjectWrongCounts[w.subjectId] = (subjectWrongCounts[w.subjectId] || 0) + 1;
    });
    const worstSubjectId = Object.entries(subjectWrongCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const worstSubject = subjects.find(s => s.id === worstSubjectId);

    const avgProgress = subjects.length > 0
      ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)
      : 0;

    return {
      todayCount,
      totalCount,
      accuracy,
      totalWrong,
      pendingWrong,
      dueCards,
      worstSubject,
      avgProgress,
    };
  }, [answerRecords, wrongAnswers, flashCards, subjects]);

  const accuracyColor = stats.accuracy >= 80 ? 'text-green-ink' : stats.accuracy >= 60 ? 'text-gold' : 'text-seal';

  const encouragement = useMemo(() => {
    if (stats.totalCount === 0) return '开始答题，开启你的学习之旅吧';
    if (stats.accuracy > 80) return '太棒了！保持这个状态继续前进';
    if (stats.accuracy >= 60) return '稳步前进，继续加油哦';
    return '别灰心，多复习错题就会进步';
  }, [stats.accuracy, stats.totalCount]);

  const nearestExam = useMemo(() => {
    if (subjects.length === 0) return null;
    return subjects.reduce((nearest, s) => {
      const d = daysUntilExam(s.examDate);
      if (!nearest || d < daysUntilExam(nearest.examDate)) return s;
      return nearest;
    }, subjects[0]);
  }, [subjects]);

  const hasData = stats.totalCount > 0 || stats.totalWrong > 0 || stats.dueCards > 0;

  return (
    <motion.div
      className="space-y-6 max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      <motion.div variants={fadeUp} className="text-center mb-8 relative">
        <h1 className="font-serif text-3xl text-ink-800 font-bold mb-2 flex items-center justify-center gap-2">
          <span>📊</span>
          <span className="ink-underline">进度督学</span>
        </h1>
        <p className="text-ink-600 font-serif text-sm mt-3">你的学习小助手，随时汇报进度</p>
        <p className="text-ink-500 font-serif text-xs mt-1">{formatDate()}</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PaperCard rotation={-0.8} className="p-4 text-center">
            <div className="text-2xl mb-1">📝</div>
            <div className="font-serif text-2xl font-bold text-ink-800 tabular-nums">
              {stats.todayCount}
            </div>
            <div className="text-xs text-ink-500 font-serif mt-1">今日答题</div>
          </PaperCard>

          <PaperCard rotation={0.5} className="p-4 text-center">
            <div className="text-2xl mb-1">✓</div>
            <div className={`font-serif text-2xl font-bold tabular-nums ${accuracyColor}`}>
              {stats.accuracy}%
            </div>
            <div className="text-xs text-ink-500 font-serif mt-1">正确率</div>
          </PaperCard>

          <PaperCard rotation={-0.3} className="p-4 text-center">
            <div className="text-2xl mb-1">📕</div>
            <div className="font-serif text-2xl font-bold text-seal tabular-nums">
              {stats.pendingWrong}
            </div>
            <div className="text-xs text-ink-500 font-serif mt-1">待订正错题</div>
          </PaperCard>

          <PaperCard rotation={0.7} className="p-4 text-center">
            <div className="text-2xl mb-1">🃏</div>
            <div className="font-serif text-2xl font-bold text-ink-800 tabular-nums">
              {stats.dueCards}
            </div>
            <div className="text-xs text-ink-500 font-serif mt-1">待复习闪卡</div>
          </PaperCard>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <PaperCard className="p-6">
          <h2 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
            <span>📚</span>
            <span className="ink-underline">学科掌握度</span>
          </h2>

          <div className="space-y-4">
            {subjects.map((subject, idx) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center"
              >
                <div className="flex items-center gap-2 w-28 flex-shrink-0">
                  <span className="text-lg">{subject.icon}</span>
                  <span className="font-serif text-sm text-ink-700 truncate">{subject.name}</span>
                </div>
                <HandDrawnProgressBar
                  progress={subject.progress}
                  color={subject.color}
                  delay={0.3 + idx * 0.1}
                />
                <div className="w-12 text-right font-serif text-sm tabular-nums text-ink-700 font-medium">
                  {subject.progress}%
                </div>
              </motion.div>
            ))}
          </div>

          {nearestExam && (
            <div className="mt-5 pt-4 border-t border-dashed border-ink-600/20">
              <p className="text-xs font-serif text-ink-600 flex items-center gap-2">
                <span>⏰</span>
                <span>
                  距离
                  <span className="font-semibold text-ink-800 mx-1">{nearestExam.name}</span>
                  考试还有
                  <span className="text-seal font-bold mx-1">{daysUntilExam(nearestExam.examDate)}</span>
                  天
                </span>
              </p>
            </div>
          )}
        </PaperCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PaperCard className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-2 flex items-center gap-2">
              <span>📈</span>
              <span className="ink-underline">本周学习情况</span>
            </h2>
            <p className="text-xs text-ink-500 font-serif">每日答题数量统计</p>

            {hasData ? (
              <WeeklyBarChart todayCount={stats.todayCount} />
            ) : (
              <div className="h-32 flex items-center justify-center text-ink-500 font-serif text-sm">
                暂无学习数据，开始答题后这里会显示你的学习趋势
              </div>
            )}
          </PaperCard>
        </motion.div>

        <motion.div variants={fadeUp} className="relative min-h-[300px]">
          <div className="relative h-full">
            <StickyNote color="yellow" rotation={-3} className="absolute top-0 left-0 right-4">
              <p className="text-center">💬 {encouragement}</p>
            </StickyNote>

            <StickyNote color="pink" rotation={2} className="absolute top-24 left-4 right-0">
              <p className="text-sm">📋 待办提醒</p>
              {stats.pendingWrong > 0 && (
                <p className="text-xs mt-1">· {stats.pendingWrong}道错题待订正</p>
              )}
              {stats.dueCards > 0 && (
                <p className="text-xs">· {stats.dueCards}张闪卡待复习</p>
              )}
              {stats.pendingWrong === 0 && stats.dueCards === 0 && (
                <p className="text-xs mt-1">· 所有任务已完成 🎉</p>
              )}
            </StickyNote>

            <StickyNote color="blue" rotation={-1} className="absolute top-48 left-2 right-2">
              <p className="text-sm">💡 学习建议</p>
              {stats.worstSubject ? (
                <p className="text-xs mt-1">建议重点复习{stats.worstSubject.icon}{stats.worstSubject.name}科目</p>
              ) : stats.totalCount === 0 ? (
                <p className="text-xs mt-1">还没有答题记录，快去刷题吧</p>
              ) : (
                <p className="text-xs mt-1">继续保持均衡复习</p>
              )}
            </StickyNote>

            <StickyNote color="green" rotation={3} className="absolute top-72 left-0 right-4">
              <p className="text-center">🔥 已连续学习{streakDays}天</p>
              <p className="text-xs text-center mt-1 opacity-70">坚持就是胜利！</p>
            </StickyNote>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <PaperCard className="p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(92,64,51,0.3) 31px, rgba(92,64,51,0.3) 32px)',
              marginLeft: '44px',
              borderLeft: '2px solid rgba(220,80,60,0.2)',
            }}
          />

          <div className="relative z-[1]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                  <span>📜</span>
                  <span className="handwritten ink-underline">学习小结</span>
                </h2>
                <p className="text-xs text-ink-500 font-serif mt-1">No. {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}{String(new Date().getDate()).padStart(2, '0')}</p>
              </div>
              <StampSeal text="督学通过" />
            </div>

            <div className="font-serif text-ink-700 leading-loose space-y-3 ml-12 text-sm">
              {stats.totalCount === 0 ? (
                <p>亲爱的同学，你还没有开始答题。学习之旅始于足下，快去题库练习吧！</p>
              ) : (
                <>
                  <p>
                    截至今日，你已完成<span className="text-seal font-bold mx-1">{stats.totalCount}</span>道题目，
                    整体正确率为<span className="font-bold mx-1" style={{ color: stats.accuracy >= 80 ? '#2D5A27' : stats.accuracy >= 60 ? '#B8860B' : '#8B2500' }}>{stats.accuracy}%</span>，
                    各学科平均掌握度约<span className="text-ink-800 font-bold mx-1">{stats.avgProgress}%</span>。
                  </p>
                  <p>
                    目前累计错题<span className="text-seal font-bold mx-1">{stats.totalWrong}</span>道，
                    其中<span className="text-seal font-bold mx-1">{stats.pendingWrong}</span>道尚待订正复习；
                    闪卡待复习<span className="text-ink-800 font-bold mx-1">{stats.dueCards}</span>张。
                  </p>
                  {stats.worstSubject && (
                    <p>
                      建议近期重点关注<span style={{ color: stats.worstSubject.color }} className="font-bold mx-1">
                        {stats.worstSubject.icon}{stats.worstSubject.name}
                      </span>
                      科目的复习，巩固薄弱知识点。
                    </p>
                  )}
                  <p>
                    {stats.accuracy > 80
                      ? '表现优异，继续保持这份学习热情！记住，温故而知新，定期复习错题能让你更上一层楼。'
                      : stats.accuracy >= 60
                        ? '稳步提升中，学习是一个循序渐进的过程。每天进步一点点，终将收获满满。'
                        : '目前正确率还有提升空间，不要气馁。认真分析每一道错题，理解错误原因，进步就在眼前。'}
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 ml-12 flex items-end justify-between">
              <div className="space-y-3">
                <div className="border-b border-ink-600/30 w-40 pb-1">
                  <p className="text-xs text-ink-500 font-serif">督学评语：</p>
                </div>
                <p className="text-sm font-serif text-ink-600 italic">
                  "{streakDays >= 7 ? '持之以恒，未来可期' : '继续努力，保持节奏'}"
                </p>
              </div>
              <div className="text-right">
                <div className="border-b border-ink-600/30 w-28 pb-1 mb-1">
                  <p className="text-xs text-ink-500 font-serif text-right">督学Agent 签章</p>
                </div>
                <p className="text-xs font-serif text-ink-500 mt-2">{formatDate().split(' ')[0]}</p>
              </div>
            </div>
          </div>
        </PaperCard>
      </motion.div>
    </motion.div>
  );
}
