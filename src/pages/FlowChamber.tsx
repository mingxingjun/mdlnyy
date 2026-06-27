import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Users, LogIn,
  Clock, Check, Headphones, CloudRain, BookOpen, Coffee, TreePine,
  Flame, Music,
} from 'lucide-react';
import { useAppStore, type WhiteNoiseType } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

/* ──────────────── 常量 ──────────────── */
const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const NOISE_CONFIG: { type: WhiteNoiseType; label: string; icon: typeof CloudRain }[] = [
  { type: 'rain', label: '雨声', icon: CloudRain },
  { type: 'library', label: '图书馆', icon: BookOpen },
  { type: 'cafe', label: '咖啡馆', icon: Coffee },
  { type: 'bass', label: '低音', icon: Music },
  { type: 'forest', label: '森林', icon: TreePine },
  { type: 'fire', label: '壁炉', icon: Flame },
];

/* ──────────────── 白噪音音频生成器 ──────────────── */
function createNoiseGenerator(
  ctx: AudioContext,
  type: WhiteNoiseType,
  gainNode: GainNode,
): AudioNode {
  const sampleRate = ctx.sampleRate;
  const bufferSize = 2 * sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);

  switch (type) {
    case 'rain': {
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return source;
    }
    case 'library': {
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return source;
    }
    case 'cafe': {
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return source;
    }
    case 'bass': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 60;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 120;
      osc.connect(filter);
      filter.connect(gainNode);
      osc.start();
      return osc;
    }
    case 'forest': {
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 2;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return source;
    }
    case 'fire': {
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        if (Math.random() < 0.003) {
          data[i] = (Math.random() - 0.5) * 0.8;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.05;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return source;
    }
  }
}

/* ──────────────── 番茄钟 ──────────────── */
function PomodoroTimer() {
  const subjects = useAppStore((s) => s.subjects);
  const addPomodoroSession = useAppStore((s) => s.addPomodoroSession);
  const addToast = useToastStore((s) => s.addToast);

  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const [completedAnimation, setCompletedAnimation] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = 1 - timeLeft / totalDuration;

  // Keep selectedSubject valid when subjects list changes
  useEffect(() => {
    if (subjects.length > 0 && !subjects.find((s) => s.id === selectedSubject)) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const currentMode = mode;
          if (currentMode === 'work') {
            addPomodoroSession({
              id: crypto.randomUUID(),
              startTime: new Date().toISOString(),
              duration: 25,
              subjectId: selectedSubject,
              completed: true,
            });
            addToast('success', '🎉 专注完成！休息一下吧');
          } else {
            addToast('info', '休息结束，继续加油！');
          }
          setCompletedAnimation(true);
          if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
          completedTimerRef.current = setTimeout(() => setCompletedAnimation(false), 2000);
          const nextMode = currentMode === 'work' ? 'break' : 'work';
          setMode(nextMode);
          return nextMode === 'work' ? WORK_DURATION : BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, selectedSubject, addPomodoroSession, addToast]);

  const handleStart = useCallback(() => setRunning(true), []);
  const handlePause = useCallback(() => setRunning(false), []);
  const handleReset = useCallback(() => {
    setRunning(false);
    setTimeLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
  }, [mode]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  const strokeColor = mode === 'work' ? '#635BFF' : '#00D924';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-8"
    >
      {/* 模式切换 */}
      <div className="flex items-center gap-2 bg-[#1a3a5c] rounded-full p-1 w-full sm:w-auto">
        {(['work', 'break'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setTimeLeft(m === 'work' ? WORK_DURATION : BREAK_DURATION);
              setRunning(false);
            }}
            className={`flex-1 sm:flex-none px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              mode === m
                ? m === 'work'
                  ? 'bg-[#635BFF]/10 text-[#635BFF] shadow-sm'
                  : 'bg-[#00D924]/10 text-[#00D924] shadow-sm'
                : 'text-[#6b7c93] hover:text-[#6b7c93]'
            }`}
          >
            {m === 'work' ? '专注' : '休息'}
          </button>
        ))}
      </div>

      {/* SVG 圆环计时器 — 英雄元素 */}
      <div
        className={`relative ${running ? 'animate-breathe' : ''} ${
          completedAnimation ? 'animate-completion-pulse' : ''
        }`}
      >
        <svg viewBox="0 0 320 320" className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px] -rotate-90">
          {/* 背景圆 */}
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="6"
          />
          {/* 进度圆 */}
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-sans text-6xl font-bold tracking-widest tabular-nums text-[#ffffff] transition-all duration-300">
            {minutes}:{seconds}
          </span>
          <span className="text-[#6b7c93] text-xs tracking-widest uppercase mt-2">
            {mode === 'work' ? '专注中' : '休息中'}
          </span>
          {currentSubject && (
            <span
              className="text-xs mt-1.5 font-medium opacity-70"
              style={{ color: currentSubject.color }}
            >
              {currentSubject.name}
            </span>
          )}
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full border border-white/[0.06] flex items-center justify-center text-[#6b7c93] hover:text-[#a3b5cc] hover:border-white/[0.12] transition-all bg-[#0d2d4a]"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={running ? handlePause : handleStart}
          className={`w-14 h-14 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-300 ${
            mode === 'work'
              ? 'bg-[#635BFF] hover:bg-[#5a6aff]'
              : 'bg-[#00D924] hover:bg-[#2dd4a0]'
          } text-white`}
        >
          {running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <div className="w-10 h-10" /> {/* 占位保持居中 */}
      </div>

      {/* 科目选择 */}
      {subjects.length > 0 ? (
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-auto bg-[#0d2d4a] border border-white/[0.06] rounded-[10px] px-4 py-2 text-sm text-[#a3b5cc] focus:outline-none focus:border-[#635BFF]/30 transition-colors"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-[#6b7c93]">请先在仪表盘添加考试科目</p>
      )}
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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Map<WhiteNoiseType, { source: AudioNode; gain: GainNode }>>(new Map());

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  const handleVolumeChange = (type: WhiteNoiseType, value: number) => {
    setVolumes((prev) => ({ ...prev, [type]: value }));
    const nodes = audioNodesRef.current.get(type);
    if (nodes) {
      nodes.gain.gain.value = value / 100;
    }
  };

  const handleToggle = useCallback((type: WhiteNoiseType) => {
    const isActive = activeWhiteNoise.includes(type);
    if (isActive) {
      const nodes = audioNodesRef.current.get(type);
      if (nodes) {
        try {
          if (nodes.source instanceof AudioBufferSourceNode || nodes.source instanceof OscillatorNode) {
            nodes.source.stop();
          }
          nodes.source.disconnect();
          nodes.gain.disconnect();
        } catch { /* ignore */ }
        audioNodesRef.current.delete(type);
      }
    } else {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const gainNode = ctx.createGain();
      gainNode.gain.value = volumes[type] / 100;
      gainNode.connect(ctx.destination);
      const source = createNoiseGenerator(ctx, type, gainNode);
      audioNodesRef.current.set(type, { source, gain: gainNode });
    }
    toggleWhiteNoise(type);
  }, [activeWhiteNoise, toggleWhiteNoise, getAudioCtx, volumes]);

  useEffect(() => {
    const currentNodes = audioNodesRef.current;
    return () => {
      currentNodes.forEach((nodes) => {
        try {
          if (nodes.source instanceof AudioBufferSourceNode || nodes.source instanceof OscillatorNode) {
            nodes.source.stop();
          }
          nodes.source.disconnect();
          nodes.gain.disconnect();
        } catch { /* ignore */ }
      });
      currentNodes.clear();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="card p-5"
    >
      <h3 className="font-sans text-sm font-semibold text-[#a3b5cc] mb-4 flex items-center gap-2 tracking-wide">
        <Headphones size={14} className="text-[#635BFF]" />
        白噪音
      </h3>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {NOISE_CONFIG.map(({ type, label, icon: Icon }) => {
          const isActive = activeWhiteNoise.includes(type);
          return (
            <div
              key={type}
              className={`flex flex-col items-center gap-2 p-3 rounded-[16px] border transition-all duration-300 ${
                isActive
                  ? 'bg-[#635BFF]/10 border-[#635BFF]/30'
                  : 'bg-[#0d2d4a] border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <button
                onClick={() => handleToggle(type)}
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-[#635BFF]/10 text-[#635BFF]'
                    : 'bg-[#0A2540] text-[#6b7c93]'
                }`}
              >
                {isActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <Icon
                size={16}
                className={isActive ? 'text-[#635BFF]' : 'text-[#6b7c93]'}
              />
              <span
                className={`text-[11px] font-medium ${isActive ? 'text-[#635BFF]' : 'text-[#6b7c93]'}`}
              >
                {label}
              </span>
              {isActive && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volumes[type]}
                  onChange={(e) => handleVolumeChange(type, Number(e.target.value))}
                  className="w-full h-0.5 rounded-full appearance-none cursor-pointer accent-[#635BFF]"
                  style={{
                    background: `linear-gradient(to right, #635BFF ${volumes[type]}%, rgba(255,255,255,0.06) ${volumes[type]}%)`,
                  }}
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
  const joinedRooms = useAppStore((s) => s.joinedRooms);
  const joinRoom = useAppStore((s) => s.joinRoom);
  const leaveRoom = useAppStore((s) => s.leaveRoom);
  const addToast = useToastStore((s) => s.addToast);

  const handleJoinLeave = (roomId: string, roomName: string) => {
    if (joinedRooms.includes(roomId)) {
      leaveRoom(roomId);
      addToast('info', `已离开「${roomName}」`);
    } else {
      const ok = joinRoom(roomId);
      if (ok) {
        addToast('success', `已加入「${roomName}」`);
      } else {
        const room = studyRooms.find((r) => r.id === roomId);
        if (!room) {
          addToast('error', '房间不存在');
        } else if (room.members >= room.maxMembers) {
          addToast('error', `「${roomName}」已满员`);
        } else {
          addToast('error', '加入房间失败');
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="card p-5"
    >
      <h3 className="font-sans text-sm font-semibold text-[#a3b5cc] mb-4 flex items-center gap-2 tracking-wide">
        <Users size={14} className="text-[#00D924]" />
        自习室
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
        {studyRooms.map((room) => {
          const isJoined = joinedRooms.includes(room.id);
          return (
            <div
              key={room.id}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] border transition-all duration-200 ${
                isJoined
                  ? 'bg-[#00D924]/10 border-[#00D924]/30'
                  : 'bg-[#0d2d4a] border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#ffffff] truncate">{room.name}</span>
                  {room.isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-[#6b7c93]">
                  {room.members}/{room.maxMembers} 人
                </span>
              </div>
              <button
                onClick={() => handleJoinLeave(room.id, room.name)}
                className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-[8px] font-medium transition-all duration-200 flex-shrink-0 ${
                  isJoined
                    ? 'bg-[#00D924]/10 border border-[#00D924]/30 text-[#00D924]'
                    : 'bg-gradient-to-r from-[#635BFF] to-[#7C5CFF] text-white hover:opacity-90'
                }`}
              >
                {isJoined ? (
                  <>
                    <Check size={10} />
                    已加入
                  </>
                ) : (
                  <>
                    <LogIn size={10} />
                    加入
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ──────────────── 今日专注统计 ──────────────── */
function FocusStats() {
  const pomodoroSessions = useAppStore((s) => s.pomodoroSessions);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todaySessions = pomodoroSessions.filter((s) => {
    if (!s.completed) return false;
    const d = new Date(s.startTime);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return ds === todayStr;
  });
  const todayFlowMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const completedToday = todaySessions.length;

  const hours = Math.floor(todayFlowMinutes / 60);
  const mins = todayFlowMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="card px-6 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-8"
    >
      <div className="flex items-center gap-3">
        <Clock size={16} className="text-[#635BFF]" />
        <div>
          <p className="text-[10px] text-[#6b7c93] uppercase tracking-widest">今日专注</p>
          <p className="font-sans text-xl font-bold text-[#ffffff]">
            {hours}h {mins}m
          </p>
        </div>
      </div>
      <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
      <div className="flex items-center gap-3">
        <Flame size={16} className="text-[#635BFF]" />
        <div>
          <p className="text-[10px] text-[#6b7c93] uppercase tracking-widest">完成番茄</p>
          <p className="font-sans text-xl font-bold text-[#ffffff]">
            {completedToday}
          </p>
        </div>
      </div>
      <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
      <div className="flex items-center gap-3">
        <Check size={16} className="text-[#00D924]" />
        <div>
          <p className="text-[10px] text-[#6b7c93] uppercase tracking-widest">连续轮次</p>
          <p className="font-sans text-xl font-bold text-[#ffffff]">
            {completedToday}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────── 主页面 ──────────────── */
export default function FlowChamber() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 番茄钟 — 居中英雄 */}
      <PomodoroTimer />

      {/* 白噪音 + 自习室并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhiteNoisePanel />
        <StudyRoomsPanel />
      </div>

      {/* 今日统计 */}
      <FocusStats />
    </div>
  );
}
