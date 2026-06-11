import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Plus,
  Minus,
  Flame,
  Target,
  Trash2,
  Calendar,
  Inbox,
} from 'lucide-react';
import { useAppStore, type Subject } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

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

/* ─── 添加科目弹窗 ─── */
function AddSubjectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Subject) => void }) {
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const colors = ['#00d4ff', '#00ff88', '#8b5cf6', '#ff0080', '#ffd600', '#ff6b35'];

  const nameError = submitted && !name.trim();
  const dateError = submitted && !examDate;

  const handleSubmit = () => {
    setSubmitted(true);
    if (!name.trim() || !examDate) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      examDate,
      progress: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      icon: 'book',
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md p-6"
      >
        <h3 className="font-display font-bold text-lg text-white mb-5">添加考试科目</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">科目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：高等数学下"
              className="w-full px-4 py-2.5 rounded-xl bg-dark-600/60 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
              style={{
                border: nameError ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: nameError ? '0 0 12px rgba(255,68,68,0.2)' : undefined,
              }}
              onFocus={(e) => { if (!nameError) e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'; }}
              onBlur={(e) => { if (!nameError) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            />
            {nameError && <p className="text-[11px] text-red-400 mt-1">请输入科目名称</p>}
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">考试日期</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-600/60 text-sm text-zinc-200 outline-none transition-all"
              style={{
                border: dateError ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: dateError ? '0 0 12px rgba(255,68,68,0.2)' : undefined,
              }}
              onFocus={(e) => { if (!dateError) e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'; }}
              onBlur={(e) => { if (!dateError) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            />
            {dateError && <p className="text-[11px] text-red-400 mt-1">请选择考试日期</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button onClick={onClose} className="neon-btn neon-btn-blue flex-1 justify-center" style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            取消
          </button>
          <button onClick={handleSubmit} className="neon-btn neon-btn-blue flex-1 justify-center">
            添加
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── 子组件 ─── */

/** 1. 考试倒计时卡片 */
function ExamCountdown() {
  const { subjects, removeSubject } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const addSubject = useAppStore((s) => s.addSubject);
  const addToast = useToastStore((s) => s.addToast);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 点击其他区域取消确认
  useEffect(() => {
    if (!confirmDeleteId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDeleteId]);

  const handleAdd = useCallback((s: Subject) => {
    addSubject(s);
    addToast('success', '科目添加成功');
  }, [addSubject, addToast]);

  const handleDelete = useCallback((id: string) => {
    if (confirmDeleteId === id) {
      removeSubject(id);
      addToast('info', '科目已删除');
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }, [confirmDeleteId, removeSubject, addToast]);

  return (
    <>
      <div className="col-span-2 row-span-2 glass-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-neon-blue" />
            <h3 className="font-display font-semibold text-white text-base">考试倒计时</h3>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-7 h-7 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center hover:bg-neon-blue/20 transition-colors"
          >
            <Plus size={14} className="text-neon-blue" />
          </button>
        </div>
        {subjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Inbox size={36} className="text-zinc-600" />
            <p className="text-sm text-zinc-500">暂无考试科目，点击 + 添加</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-auto">
            {subjects.map((subject) => {
              const cd = getCountdown(subject.examDate);
              const isConfirming = confirmDeleteId === subject.id;
              return (
                <motion.div
                  key={subject.id}
                  variants={itemVariants}
                  className="relative rounded-xl p-4 flex flex-col justify-between overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${subject.color}10, ${subject.color}05)`,
                    border: `1px solid ${subject.color}40`,
                    boxShadow: neonShadow(subject.color, 0.15),
                  }}
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: subject.color }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-400 font-body truncate">{subject.name}</p>
                      <div className="relative">
                        <button
                          ref={isConfirming ? confirmRef : undefined}
                          onClick={() => handleDelete(subject.id)}
                          onBlur={() => { if (isConfirming) setConfirmDeleteId(null); }}
                          className={`p-1 rounded transition-all ${
                            isConfirming
                              ? 'opacity-100 bg-red-500/20 border border-red-500/40'
                              : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
                          }`}
                        >
                          {isConfirming ? (
                            <span className="text-[10px] text-red-400 font-semibold px-1">确认?</span>
                          ) : (
                            <Trash2 size={12} className="text-zinc-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> {subject.examDate}
                    </p>
                  </div>
                  <div className="relative z-10 mt-3">
                    {cd.passed ? (
                      <span className="text-sm text-zinc-500">已结束</span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="font-display font-bold text-3xl tabular-nums"
                          style={{ color: subject.color, textShadow: `0 0 14px ${subject.color}80, 0 0 40px ${subject.color}30` }}
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
        )}
      </div>
      {showAdd && <AddSubjectModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </>
  );
}

/** 2. 科目进度条 */
function SubjectProgress() {
  const { subjects, updateSubjectProgress } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adjust = (id: string, delta: number) => {
    const s = subjects.find((s) => s.id === id);
    if (!s) return;
    const next = Math.max(0, Math.min(100, s.progress + delta));
    updateSubjectProgress(id, next);
    // 只在进度达到 0 或 100 时显示 toast，避免频繁弹出
    if (next === 0 || next === 100) {
      addToast('success', '进度已更新');
    } else {
      // 防抖：连续调整时只显示一次
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        addToast('success', '进度已更新');
      }, 800);
    }
  };

  return (
    <div className="col-span-2 row-span-1 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-neon-purple" />
        <h3 className="font-display font-semibold text-white text-base">科目进度</h3>
      </div>
      {subjects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">暂无科目数据</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-auto">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-28 truncate flex-shrink-0">{subject.name}</span>
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
      )}
    </div>
  );
}

/** 3. 盲区热力图 */
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

  const hasKnowledgePoints = knowledgePoints.length > 0;

  return (
    <div className="col-span-2 row-span-2 glass-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-neon-pink" />
        <h3 className="font-display font-semibold text-white text-base">盲区热力图</h3>
      </div>
      {!hasKnowledgePoints ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">暂无知识点数据</p>
        </div>
      ) : (
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
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
                            style={{
                              background: 'rgba(18,18,26,0.95)',
                              border: `1px solid ${masteryColor(kp.mastery)}50`,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
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
      )}
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
        <SubjectProgress />
      </motion.div>
      <motion.div variants={itemVariants} className="contents">
        <Heatmap />
      </motion.div>
    </motion.div>
  );
}
