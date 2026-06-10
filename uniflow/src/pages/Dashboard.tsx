import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  Clock,
  Timer,
  Plus,
  Minus,
  TrendingUp,
  Flame,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

/* ─── 动画变体 ─── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ─── 工具函数 ─── */
function getCountdown(examDate: string) {
  const now = new Date();
  const target = new Date(examDate + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, passed: false };
}

function neonShadow(color: string, intensity = 0.5) {
  return `0 0 12px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, 0 0 36px ${color}${Math.round(intensity * 0.3 * 255).toString(16).padStart(2, '0')}`;
}

function masteryColor(mastery: number): string {
  if (mastery >= 70) return '#00ff88';
  if (mastery >= 40) return '#ffd600';
  return '#ff4444';
}

function masteryBg(mastery: number): string {
  if (mastery >= 70) return 'rgba(0,255,136,0.12)';
  if (mastery >= 40) return 'rgba(255,214,0,0.12)';
  return 'rgba(255,68,68,0.12)';
}

/* ─── 子组件 ─── */

/** 1. 考试倒计时卡片 */
function ExamCountdown() {
  const { subjects } = useAppStore();

  return (
    <div className="col-span-2 row-span-2 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-neon-blue" />
        <h3 className="font-display font-semibold text-white text-base">考试倒计时</h3>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-auto">
        {subjects.map((subject) => {
          const cd = getCountdown(subject.examDate);
          return (
            <motion.div
              key={subject.id}
              variants={itemVariants}
              className="relative rounded-xl p-4 flex flex-col justify-between overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${subject.color}10, ${subject.color}05)`,
                border: `1px solid ${subject.color}40`,
                boxShadow: neonShadow(subject.color, 0.15),
              }}
            >
              {/* 背景光晕 */}
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ background: subject.color }}
              />
              <div className="relative z-10">
                <p className="text-sm text-zinc-400 font-body truncate">{subject.name}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{subject.examDate}</p>
              </div>
              <div className="relative z-10 mt-3">
                {cd.passed ? (
                  <span className="text-sm text-zinc-500">已结束</span>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-display font-bold text-3xl tabular-nums"
                      style={{
                        color: subject.color,
                        textShadow: `0 0 14px ${subject.color}80, 0 0 40px ${subject.color}30`,
                      }}
                    >
                      {cd.days}
                    </span>
                    <span className="text-xs text-zinc-500">天</span>
                    <span
                      className="font-display font-semibold text-xl tabular-nums"
                      style={{ color: subject.color, textShadow: `0 0 10px ${subject.color}60` }}
                    >
                      {cd.hours}
                    </span>
                    <span className="text-xs text-zinc-500">时</span>
                    <span
                      className="font-display font-semibold text-lg tabular-nums"
                      style={{ color: subject.color, textShadow: `0 0 10px ${subject.color}40` }}
                    >
                      {cd.minutes}
                    </span>
                    <span className="text-xs text-zinc-500">分</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** 2. 心流时长统计 */
function FlowStats() {
  const { todayFlowMinutes, weeklyFlowData } = useAppStore();
  const target = 125;
  const pct = Math.min((todayFlowMinutes / target) * 100, 100);

  // SVG 环形图参数
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="col-span-2 row-span-2 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Timer size={18} className="text-neon-green" />
        <h3 className="font-display font-semibold text-white text-base">心流时长统计</h3>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center gap-6">
        {/* 环形图 */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* 背景环 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
            />
            {/* 进度环 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
          {/* 中心文字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-2xl neon-text-green tabular-nums">
              {todayFlowMinutes}
            </span>
            <span className="text-[11px] text-zinc-500">/ {target} 分钟</span>
          </div>
        </div>

        {/* 周趋势面积图 */}
        <div className="flex-1 w-full h-36">
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> 本周趋势
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyFlowData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(18,18,26,0.9)',
                  border: '1px solid rgba(0,255,136,0.2)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#e4e4e7',
                }}
                formatter={(value: number) => [`${value} 分钟`, '心流时长']}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#00ff88"
                strokeWidth={2}
                fill="url(#flowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/** 3. 科目进度条 */
function SubjectProgress() {
  const { subjects, updateSubjectProgress } = useAppStore();

  const adjust = (id: string, delta: number) => {
    const s = subjects.find((s) => s.id === id);
    if (!s) return;
    const next = Math.max(0, Math.min(100, s.progress + delta));
    updateSubjectProgress(id, next);
  };

  return (
    <div className="col-span-2 row-span-1 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-neon-purple" />
        <h3 className="font-display font-semibold text-white text-base">科目进度</h3>
      </div>
      <div className="flex-1 space-y-3 overflow-auto">
        {subjects.map((subject) => (
          <div key={subject.id} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-24 truncate flex-shrink-0">{subject.name}</span>
            <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${subject.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  background: `linear-gradient(90deg, ${subject.color}cc, ${subject.color})`,
                  boxShadow: `0 0 8px ${subject.color}60`,
                }}
              />
            </div>
            <span
              className="text-xs font-display font-semibold w-10 text-right tabular-nums"
              style={{ color: subject.color }}
            >
              {subject.progress}%
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => adjust(subject.id, -5)}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => adjust(subject.id, 5)}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 4. 盲区热力图 */
function Heatmap() {
  const { knowledgePoints, subjects } = useAppStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, typeof knowledgePoints> = {};
    subjects.forEach((s) => {
      map[s.id] = knowledgePoints.filter((kp) => kp.subjectId === s.id);
    });
    return map;
  }, [knowledgePoints, subjects]);

  return (
    <div className="col-span-2 row-span-2 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-neon-pink" />
        <h3 className="font-display font-semibold text-white text-base">盲区热力图</h3>
      </div>
      <div className="flex-1 space-y-4 overflow-auto">
        {subjects.map((subject) => {
          const points = grouped[subject.id] || [];
          if (points.length === 0) return null;
          return (
            <div key={subject.id}>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: subject.color, boxShadow: `0 0 6px ${subject.color}80` }}
                />
                {subject.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {points.map((kp) => {
                  const isHovered = hovered === kp.id;
                  return (
                    <div
                      key={kp.id}
                      className="relative"
                      onMouseEnter={() => setHovered(kp.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center text-[10px] font-display font-semibold transition-colors"
                        style={{
                          background: masteryBg(kp.mastery),
                          border: `1px solid ${masteryColor(kp.mastery)}40`,
                          color: masteryColor(kp.mastery),
                          boxShadow: isHovered ? `0 0 12px ${masteryColor(kp.mastery)}40` : 'none',
                        }}
                      >
                        {kp.mastery}
                      </motion.div>
                      {/* 悬浮提示 */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
                          style={{
                            background: 'rgba(18,18,26,0.95)',
                            border: `1px solid ${masteryColor(kp.mastery)}50`,
                            boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                          }}
                        >
                          <p className="text-xs text-zinc-200">{kp.name}</p>
                          <p
                            className="text-[10px] font-display font-semibold"
                            style={{ color: masteryColor(kp.mastery) }}
                          >
                            掌握度 {kp.mastery}%
                          </p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <span className="text-[10px] text-zinc-600">掌握度</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: masteryBg(20), border: `1px solid ${masteryColor(20)}40` }} />
          <span className="text-[10px] text-zinc-500">&lt;40</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: masteryBg(55), border: `1px solid ${masteryColor(55)}40` }} />
          <span className="text-[10px] text-zinc-500">40-70</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: masteryBg(80), border: `1px solid ${masteryColor(80)}40` }} />
          <span className="text-[10px] text-zinc-500">&ge;70</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 主组件 ─── */
export default function Dashboard() {
  return (
    <motion.div
      className="bento-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="contents">
        <ExamCountdown />
      </motion.div>
      <motion.div variants={itemVariants} className="contents">
        <FlowStats />
      </motion.div>
      <motion.div variants={itemVariants} className="contents">
        <SubjectProgress />
      </motion.div>
      <motion.div variants={itemVariants} className="contents">
        <Heatmap />
      </motion.div>
    </motion.div>
  );
}
