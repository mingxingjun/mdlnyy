import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  Clock, Check, Headphones, CloudRain, BookOpen, Coffee, Flame,
} from 'lucide-react';
import { useAppStore, type WhiteNoiseType } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import PaperCard from '@/components/PaperCard';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const NOISE_CONFIG: { type: WhiteNoiseType; label: string; icon: typeof CloudRain }[] = [
  { type: 'rain', label: '雨声', icon: CloudRain },
  { type: 'library', label: '图书馆', icon: BookOpen },
  { type: 'cafe', label: '咖啡馆', icon: Coffee },
  { type: 'fire', label: '壁炉', icon: Flame },
];

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
    default: {
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      return source;
    }
  }
}

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

  const totalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = 1 - timeLeft / totalDuration;

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
          setTimeout(() => setCompletedAnimation(false), 2000);
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

  const strokeColor = mode === 'work' ? '#8B2500' : '#2D5A27';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex items-center gap-2 bg-paper-200/60 rounded-full p-1 w-full sm:w-auto border border-ink-800/10">
        {(['work', 'break'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setTimeLeft(m === 'work' ? WORK_DURATION : BREAK_DURATION);
              setRunning(false);
            }}
            className={`flex-1 sm:flex-none px-5 py-1.5 rounded-full text-sm font-serif font-medium transition-all duration-300 ${
              mode === m
                ? m === 'work'
                  ? 'bg-seal/10 text-seal shadow-sm'
                  : 'bg-green-ink/10 text-green-ink shadow-sm'
                : 'text-ink-600 hover:text-ink-700'
            }`}
          >
            {m === 'work' ? '专注' : '休息'}
          </button>
        ))}
      </div>

      <div
        className={`relative ${running ? 'animate-breathe' : ''} ${
          completedAnimation ? 'completion-pulse' : ''
        }`}
      >
        <svg viewBox="0 0 320 320" className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px] -rotate-90">
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke="#E0D4C0"
            strokeWidth="6"
          />
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            style={{ opacity: 0.8 }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-6xl font-bold tracking-widest tabular-nums text-ink-800 transition-all duration-300">
            {minutes}:{seconds}
          </span>
          <span className="text-ink-600 text-xs tracking-widest uppercase mt-2 font-serif">
            {mode === 'work' ? '专注中' : '休息中'}
          </span>
          {currentSubject && (
            <span
              className="text-xs mt-1.5 font-serif font-medium opacity-70"
              style={{ color: currentSubject.color }}
            >
              {currentSubject.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full border border-ink-800/15 flex items-center justify-center text-ink-600 hover:text-ink-800 hover:border-ink-800/25 transition-all bg-paper-100"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={running ? handlePause : handleStart}
          className={`w-14 h-14 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-300 ${
            mode === 'work'
              ? 'bg-seal hover:bg-seal-dark'
              : 'bg-green-ink hover:bg-green-ink/90'
          } text-paper-50 shadow-paper`}
        >
          {running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <div className="w-10 h-10" />
      </div>

      {subjects.length > 0 ? (
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-auto bg-paper-100 border border-ink-800/15 rounded-md px-4 py-2 text-sm font-serif text-ink-700 focus:outline-none focus:border-seal/30 transition-colors"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-ink-600 font-serif">请先在仪表盘添加考试科目</p>
      )}
    </motion.div>
  );
}

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
    <PaperCard className="p-5">
      <h3 className="font-serif text-sm font-semibold text-ink-700 mb-4 flex items-center gap-2 tracking-wide">
        <Headphones size={14} className="text-seal" />
        白噪音
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {NOISE_CONFIG.map(({ type, label, icon: Icon }) => {
          const isActive = activeWhiteNoise.includes(type);
          return (
            <div
              key={type}
              className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-all duration-300 ${
                isActive
                  ? 'bg-seal/8 border-seal/25'
                  : 'bg-paper-100/60 border-ink-800/10 hover:border-ink-800/20'
              }`}
            >
              <button
                onClick={() => handleToggle(type)}
                className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-seal/10 text-seal'
                    : 'bg-paper-200 text-ink-600'
                }`}
              >
                {isActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <Icon
                size={16}
                className={isActive ? 'text-seal' : 'text-ink-600'}
              />
              <span
                className={`text-xs font-serif font-medium ${isActive ? 'text-seal' : 'text-ink-600'}`}
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
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-seal"
                  style={{
                    background: `linear-gradient(to right, #8B2500 ${volumes[type]}%, rgba(92,64,51,0.1) ${volumes[type]}%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </PaperCard>
  );
}

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
    <PaperCard className="px-6 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
      <div className="flex items-center gap-3">
        <Clock size={16} className="text-seal" />
        <div>
          <p className="text-[10px] font-serif text-ink-600 uppercase tracking-widest">今日专注</p>
          <p className="font-serif text-xl font-bold text-ink-800">
            {hours}h {mins}m
          </p>
        </div>
      </div>
      <div className="w-px h-8 bg-ink-800/10 hidden sm:block" />
      <div className="flex items-center gap-3">
        <Check size={16} className="text-green-ink" />
        <div>
          <p className="text-[10px] font-serif text-ink-600 uppercase tracking-widest">完成番茄</p>
          <p className="font-serif text-xl font-bold text-ink-800">
            {completedToday}
          </p>
        </div>
      </div>
    </PaperCard>
  );
}

export default function FlowChamber() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 md:px-0 py-6">
      <div className="mb-2 text-center">
        <h1 className="handwritten text-3xl md:text-4xl font-serif text-ink-800 leading-tight mb-1"
          style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontStyle: 'italic' }}>
          番茄钟 ⏱️
        </h1>
        <p className="font-serif text-ink-600 text-sm mt-1">25分钟专注 · 5分钟休息</p>
      </div>

      <PomodoroTimer />

      <WhiteNoisePanel />

      <FocusStats />
    </div>
  );
}
