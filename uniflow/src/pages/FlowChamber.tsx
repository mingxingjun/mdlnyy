import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Volume2, Users, Flame, Clock,
  CloudRain, BookOpen, Coffee, Music, Trees, FlameKindling,
} from 'lucide-react';
import { useAppStore, type WhiteNoiseType } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

/* ──────────────── 常量 ──────────────── */
const WORK_DURATION = 25 * 60; // 25 分钟
const BREAK_DURATION = 5 * 60; // 5 分钟

const NOISE_CONFIG: { type: WhiteNoiseType; label: string; icon: typeof CloudRain }[] = [
  { type: 'rain', label: '雨声', icon: CloudRain },
  { type: 'library', label: '图书馆', icon: BookOpen },
  { type: 'cafe', label: '咖啡馆', icon: Coffee },
  { type: 'bass', label: '低音环境', icon: Music },
  { type: 'forest', label: '森林', icon: Trees },
  { type: 'fire', label: '壁炉', icon: FlameKindling },
];

/* ──────────────── 番茄钟 ──────────────── */
function PomodoroTimer() {
  const subjects = useAppStore((s) => s.subjects);
  const addPomodoroSession = useAppStore((s) => s.addPomodoroSession);

  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = 1 - timeLeft / totalDuration;

  // 计时器核心逻辑
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到，自动切换模式
          if (mode === 'work') {
            addPomodoroSession({
              id: crypto.randomUUID(),
              startTime: new Date().toISOString(),
              duration: 25,
              subjectId: selectedSubject,
              completed: true,
            });
          }
          const nextMode = mode === 'work' ? 'break' : 'work';
          setMode(nextMode);
          return nextMode === 'work' ? WORK_DURATION : BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, selectedSubject, addPomodoroSession]);

  const handleStart = useCallback(() => setRunning(true), []);
  const handlePause = useCallback(() => setRunning(false), []);
  const handleReset = useCallback(() => {
    setRunning(false);
    setTimeLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
  }, [mode]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  // SVG 圆环参数
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6"
    >
      {/* 模式标签 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setMode('work'); setTimeLeft(WORK_DURATION); setRunning(false); }}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            mode === 'work'
              ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/40 shadow-neon-blue'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          )}
        >
          专注 25min
        </button>
        <button
          onClick={() => { setMode('break'); setTimeLeft(BREAK_DURATION); setRunning(false); }}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            mode === 'break'
              ? 'bg-neon-green/15 text-neon-green border border-neon-green/40 shadow-neon-green'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          )}
        >
          休息 5min
        </button>
      </div>

      {/* SVG 圆环计时器 */}
      <div className={cn('relative', running && 'animate-breathe')}>
        <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
          {/* 背景圆 */}
          <circle
            cx="140" cy="140" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* 进度圆 */}
          <circle
            cx="140" cy="140" r={radius}
            fill="none"
            stroke={mode === 'work' ? '#00d4ff' : '#00ff88'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: `drop-shadow(0 0 8px ${mode === 'work' ? 'rgba(0,212,255,0.6)' : 'rgba(0,255,136,0.6)'})`,
            }}
          />
        </svg>

        {/* 中心时间显示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-display text-5xl font-bold tracking-wider',
              mode === 'work' ? 'neon-text-blue' : 'neon-text-green'
            )}
          >
            {minutes}:{seconds}
          </span>
          <span className="text-zinc-500 text-sm mt-1">
            {mode === 'work' ? '专注中' : '休息中'}
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-4">
        {!running ? (
          <button
            onClick={handleStart}
            className="neon-btn neon-btn-blue flex items-center gap-2"
          >
            <Play size={16} />
            开始
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="neon-btn neon-btn-blue flex items-center gap-2"
          >
            <Pause size={16} />
            暂停
          </button>
        )}
        <button
          onClick={handleReset}
          className="neon-btn neon-btn-blue flex items-center gap-2"
        >
          <RotateCcw size={16} />
          重置
        </button>
      </div>

      {/* 科目选择 */}
      <select
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        className="bg-dark-700 border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-neon-blue/40 transition-colors"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </motion.div>
  );
}

/* ──────────────── 白噪音面板 ──────────────── */
function WhiteNoisePanel() {
  const activeWhiteNoise = useAppStore((s) => s.activeWhiteNoise);
  const toggleWhiteNoise = useAppStore((s) => s.toggleWhiteNoise);
  const [volumes, setVolumes] = useState<Record<WhiteNoiseType, number>>({
    rain: 70, library: 70, cafe: 70, bass: 70, forest: 70, fire: 70,
  });

  const handleVolumeChange = (type: WhiteNoiseType, value: number) => {
    setVolumes((prev) => ({ ...prev, [type]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="font-display text-lg font-semibold neon-text-purple mb-5 flex items-center gap-2">
        <Volume2 size={18} />
        白噪音面板
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {NOISE_CONFIG.map(({ type, label, icon: Icon }) => {
          const isActive = activeWhiteNoise.includes(type);
          return (
            <div key={type} className="flex flex-col items-center gap-2">
              <button
                onClick={() => toggleWhiteNoise(type)}
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border',
                  isActive
                    ? 'bg-neon-purple/15 border-neon-purple/50 shadow-neon-purple animate-pulse-neon'
                    : 'bg-dark-600 border-white/10 hover:border-white/20'
                )}
              >
                <Icon
                  size={22}
                  className={cn(isActive ? 'text-neon-purple' : 'text-zinc-500')}
                />
              </button>
              <span className={cn('text-xs', isActive ? 'text-neon-purple' : 'text-zinc-500')}>
                {label}
              </span>

              {/* 音量滑块 */}
              {isActive && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volumes[type]}
                  onChange={(e) => handleVolumeChange(type, Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none bg-dark-500 accent-neon-purple cursor-pointer"
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ──────────────── 虚拟自习室 ──────────────── */
function StudyRoomsPanel() {
  const studyRooms = useAppStore((s) => s.studyRooms);

  // 生成匿名头像颜色
  const avatarColors = [
    'from-neon-blue to-neon-purple',
    'from-neon-green to-neon-blue',
    'from-neon-purple to-neon-pink',
    'from-neon-pink to-neon-yellow',
    'from-neon-yellow to-neon-green',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="font-display text-lg font-semibold neon-text-green mb-5 flex items-center gap-2">
        <Users size={18} />
        虚拟自习室
      </h3>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {studyRooms.map((room) => (
          <div
            key={room.id}
            className="glass-card p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200 truncate">{room.name}</span>
                {room.isActive && (
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-neon flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-zinc-500">
                  {room.members}/{room.maxMembers} 人
                </span>
                {/* 在线头像 */}
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(4, room.members) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center ring-1 ring-dark-900',
                        avatarColors[i % avatarColors.length]
                      )}
                    >
                      <span className="text-[8px] font-bold text-white">
                        {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                  ))}
                  {room.members > 4 && (
                    <div className="w-5 h-5 rounded-full bg-dark-500 flex items-center justify-center ring-1 ring-dark-900">
                      <span className="text-[8px] text-zinc-400">+{room.members - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button className="neon-btn neon-btn-green text-xs px-4 py-1.5 flex-shrink-0">
              加入
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────────── 今日专注统计 ──────────────── */
function FocusStats() {
  const todayFlowMinutes = useAppStore((s) => s.todayFlowMinutes);
  const pomodoroSessions = useAppStore((s) => s.pomodoroSessions);

  const completedToday = pomodoroSessions.filter((s) => s.completed).length;
  const hours = Math.floor(todayFlowMinutes / 60);
  const mins = todayFlowMinutes % 60;

  const stats = [
    {
      icon: Clock,
      label: '今日专注',
      value: `${hours}h ${mins}m`,
      color: 'neon-blue',
    },
    {
      icon: Flame,
      label: '完成番茄',
      value: `${completedToday} 个`,
      color: 'neon-purple',
    },
    {
      icon: Flame,
      label: '连续专注',
      value: `${completedToday} 轮`,
      color: 'neon-green',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="grid grid-cols-3 gap-4"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              stat.color === 'neon-blue' && 'bg-neon-blue/10',
              stat.color === 'neon-purple' && 'bg-neon-purple/10',
              stat.color === 'neon-green' && 'bg-neon-green/10'
            )}
          >
            <stat.icon
              size={20}
              className={cn(
                stat.color === 'neon-blue' && 'text-neon-blue',
                stat.color === 'neon-purple' && 'text-neon-purple',
                stat.color === 'neon-green' && 'text-neon-green'
              )}
            />
          </div>
          <div>
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p
              className={cn(
                'font-display text-lg font-bold',
                stat.color === 'neon-blue' && 'neon-text-blue',
                stat.color === 'neon-purple' && 'neon-text-purple',
                stat.color === 'neon-green' && 'neon-text-green'
              )}
            >
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ──────────────── 主页面 ──────────────── */
export default function FlowChamber() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">沉浸流空间</h1>
        <p className="text-sm text-zinc-500 mt-1">番茄钟 · 白噪音 · 虚拟自习室</p>
      </div>

      {/* 番茄钟 */}
      <PomodoroTimer />

      {/* 两列布局：白噪音 + 自习室 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhiteNoisePanel />
        <StudyRoomsPanel />
      </div>

      {/* 今日统计 */}
      <FocusStats />
    </div>
  );
}
