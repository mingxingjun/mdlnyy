import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Target, Brain, Headphones, NotebookPen, X, Inbox, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Subject } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

/* ─── 动画变体 ─── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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

function masteryColor(mastery: number): string {
  if (mastery >= 70) return '#10b981';
  if (mastery >= 40) return '#f59e0b';
  return '#ef4444';
}

function masteryBg(mastery: number): string {
  if (mastery >= 70) return 'rgba(16,185,129,0.1)';
  if (mastery >= 40) return 'rgba(245,158,11,0.1)';
  return 'rgba(239,68,68,0.1)';
}

/* ─── 添加科目弹窗 ─── */
function AddSubjectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Subject) => void }) {
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const colors = ['#2383E2', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#f97316'];

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#EAEAEA] rounded-[6px] w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans font-semibold text-lg text-[#111111]">添加考试科目</h3>
          <button onClick={onClose} className="p-1 rounded-[5px] hover:bg-[#f5f5f5] transition-colors">
            <X size={16} className="text-[#999999]" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#999999] mb-1.5">科目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：高等数学下"
              className="w-full px-4 py-2.5 rounded-[6px] bg-[#f9f9f9] text-sm text-[#111111] placeholder-[#999999] outline-none transition-all"
              style={{
                border: nameError ? '1px solid #ef4444' : '1px solid #EAEAEA',
              }}
              onFocus={(e) => { if (!nameError) e.currentTarget.style.borderColor = '#2383E2'; }}
              onBlur={(e) => { if (!nameError) e.currentTarget.style.borderColor = '#EAEAEA'; }}
            />
            {nameError && <p className="text-[11px] text-red-500 mt-1">请输入科目名称</p>}
          </div>
          <div>
            <label className="block text-xs text-[#999999] mb-1.5">考试日期</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[6px] bg-[#f9f9f9] text-sm text-[#111111] outline-none transition-all"
              style={{
                border: dateError ? '1px solid #ef4444' : '1px solid #EAEAEA',
              }}
              onFocus={(e) => { if (!dateError) e.currentTarget.style.borderColor = '#2383E2'; }}
              onBlur={(e) => { if (!dateError) e.currentTarget.style.borderColor = '#EAEAEA'; }}
            />
            {dateError && <p className="text-[11px] text-red-500 mt-1">请选择考试日期</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[6px] text-sm text-[#666666] hover:text-[#111111] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-[6px] text-sm font-semibold bg-[#111111] text-white hover:bg-[#2a2a2a] transition-all"
          >
            添加
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── 子组件 ─── */

/** 1. 考试倒计时 — Hero 卡片 */
function ExamCountdown() {
  const { subjects, removeSubject, addSubject } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()),
    [subjects],
  );

  const nearest = sortedSubjects[0];
  const others = sortedSubjects.slice(1);

  const handleAdd = (s: Subject) => {
    addSubject(s);
    addToast('success', '科目添加成功');
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeSubject(id);
      addToast('info', '科目已删除');
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <>
      <div className="col-span-2 card p-6 flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[5px] flex items-center justify-center bg-[#EEF4FF]">
              <Clock size={16} className="text-[#2383E2]" />
            </div>
            <h3 className="font-sans font-semibold text-[#111111] text-base">考试倒计时</h3>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-[5px] flex items-center justify-center transition-all card-interactive"
          >
            <Plus size={15} className="text-[#2383E2]" />
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Inbox size={32} className="text-[#CCCCCC]" />
            <p className="text-sm text-[#999999]">暂无考试科目</p>
            <button
              onClick={() => setShowAdd(true)}
              className="w-9 h-9 rounded-[6px] flex items-center justify-center transition-all hover:scale-105 bg-[#EEF4FF] border border-[#2383E2]"
            >
              <Plus size={16} className="text-[#2383E2]" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-auto">
            {/* 最近的考试 — 大号展示 */}
            {nearest && (
              <div
                className="relative rounded-[6px] p-5 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${nearest.color}06, ${nearest.color}02)`,
                  border: `1px solid ${nearest.color}20`,
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-[#666666] font-sans">{nearest.name}</p>
                    <button
                      onClick={() => handleDelete(nearest.id)}
                      className={`p-1 rounded transition-all ${
                        confirmDeleteId === nearest.id
                          ? 'opacity-100 bg-[#FEF2F2] border border-red-200'
                          : 'opacity-0 hover:opacity-100 hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {confirmDeleteId === nearest.id ? (
                        <span className="text-[10px] text-red-500 font-semibold px-1">确认?</span>
                      ) : (
                        <Trash2 size={12} className="text-[#999999]" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#999999] mb-4">{nearest.examDate}</p>
                  {(() => {
                    const cd = getCountdown(nearest.examDate);
                    return cd.passed ? (
                      <span className="text-sm text-[#999999]">已结束</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-sans font-bold text-5xl tabular-nums leading-none text-[#111111]"
                        >
                          {cd.days}
                        </span>
                        <span className="text-xs text-[#999999] mr-3">天</span>
                        <span
                          className="font-sans font-semibold text-2xl tabular-nums text-[#111111]"
                        >
                          {String(cd.hours).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-[#999999] mx-0.5">:</span>
                        <span
                          className="font-sans font-semibold text-2xl tabular-nums text-[#111111]"
                        >
                          {String(cd.minutes).padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 其他考试 — 紧凑列表 */}
            {others.length > 0 && (
              <div className="space-y-1.5">
                {others.map((subject) => {
                  const cd = getCountdown(subject.examDate);
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-colors hover:bg-[#f9f9f9] group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: subject.color }}
                        />
                        <span className="text-xs text-[#666666] truncate">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cd.passed ? (
                          <span className="text-[11px] text-[#999999]">已结束</span>
                        ) : (
                          <span
                            className="text-xs font-sans font-semibold tabular-nums"
                            style={{ color: subject.color }}
                          >
                            {cd.days}天 {String(cd.hours).padStart(2, '0')}:{String(cd.minutes).padStart(2, '0')}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className={`p-0.5 rounded transition-all ${
                            confirmDeleteId === subject.id
                              ? 'opacity-100 bg-[#FEF2F2] border border-red-200'
                              : 'opacity-0 group-hover:opacity-100 hover:bg-[#f5f5f5]'
                          }`}
                        >
                          {confirmDeleteId === subject.id ? (
                            <span className="text-[9px] text-red-500 font-semibold px-0.5">确认?</span>
                          ) : (
                            <Trash2 size={11} className="text-[#999999]" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddSubjectModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      </AnimatePresence>
    </>
  );
}

/** 2. 科目进度条 */
function SubjectProgress() {
  const { subjects, updateSubjectProgress } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handleProgressClick = (id: string, currentProgress: number) => {
    if (editingId === id) return;
    setEditingId(id);
    setEditValue(currentProgress);
  };

  const commitProgress = (id: string, value: number) => {
    updateSubjectProgress(id, value);
    setEditingId(null);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addToast('success', '进度已更新');
    }, 400);
  };

  return (
    <div className="col-span-1 card p-5 flex flex-col min-h-[260px]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-[5px] flex items-center justify-center bg-purple-50">
          <Target size={16} className="text-purple-600" />
        </div>
        <h3 className="font-sans font-semibold text-[#111111] text-base">科目进度</h3>
      </div>

      {subjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Inbox size={28} className="text-[#CCCCCC]" />
          <p className="text-sm text-[#999999]">暂无科目数据</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-auto">
          {subjects.map((subject) => {
            const isEditing = editingId === subject.id;
            return (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#666666] truncate max-w-[140px]">{subject.name}</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editValue}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(100, Number(e.target.value)));
                        setEditValue(v);
                      }}
                      onBlur={() => commitProgress(subject.id, editValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitProgress(subject.id, editValue);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-12 text-xs text-right bg-transparent outline-none tabular-nums font-sans font-semibold text-[#111111]"
                    />
                  ) : (
                    <button
                      onClick={() => handleProgressClick(subject.id, subject.progress)}
                      className="text-xs font-sans font-semibold tabular-nums cursor-pointer hover:underline"
                      style={{ color: subject.color }}
                    >
                      {subject.progress}%
                    </button>
                  )}
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden cursor-pointer bg-[#f5f5f5]"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const clamped = Math.max(0, Math.min(100, pct));
                    updateSubjectProgress(subject.id, clamped);
                    if (debounceTimer) clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                      addToast('success', '进度已更新');
                    }, 400);
                  }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: subject.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
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
    <div className="col-span-1 card p-5 flex flex-col min-h-[260px]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-[5px] flex items-center justify-center bg-[#FEF2F2]">
          <Brain size={16} className="text-red-500" />
        </div>
        <h3 className="font-sans font-semibold text-[#111111] text-base">盲区热力图</h3>
      </div>

      {!hasKnowledgePoints ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Inbox size={28} className="text-[#CCCCCC]" />
          <p className="text-sm text-[#999999]">暂无知识点数据</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-auto">
          {subjects.map((subject) => {
            const points = grouped[subject.id] || [];
            if (points.length === 0) return null;
            return (
              <div key={subject.id}>
                <p className="text-[11px] text-[#999999] mb-2 flex items-center gap-1.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: subject.color }}
                  />
                  {subject.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
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
                          whileHover={{ scale: 1.12 }}
                          className="w-9 h-9 rounded-[5px] cursor-pointer flex items-center justify-center text-[9px] font-sans font-semibold transition-colors"
                          style={{
                            background: masteryBg(kp.mastery),
                            border: `1px solid ${masteryColor(kp.mastery)}30`,
                            color: masteryColor(kp.mastery),
                          }}
                        >
                          {kp.mastery}
                        </motion.div>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-[5px] whitespace-nowrap pointer-events-none bg-white border border-[#EAEAEA] shadow-lg"
                          >
                            <p className="text-[11px] text-[#666666]">{kp.name}</p>
                            <p
                              className="text-[9px] font-sans font-semibold"
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

      {hasKnowledgePoints && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EAEAEA]">
          <span className="text-[9px] text-[#999999]">掌握度</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: masteryBg(20), border: `1px solid ${masteryColor(20)}30` }} />
            <span className="text-[9px] text-[#999999]">&lt;40</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: masteryBg(55), border: `1px solid ${masteryColor(55)}30` }} />
            <span className="text-[9px] text-[#999999]">40-70</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: masteryBg(80), border: `1px solid ${masteryColor(80)}30` }} />
            <span className="text-[9px] text-[#999999]">&ge;70</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** 4. 快捷操作 */
function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: '上传资料复习',
      icon: Zap,
      color: '#2383E2',
      bgColor: 'bg-[#EEF4FF]',
      iconColor: 'text-[#2383E2]',
      onClick: () => navigate('/ai-engine?mode=workflow'),
    },
    {
      label: '开始番茄钟',
      icon: Headphones,
      color: '#10b981',
      bgColor: 'bg-[#ECFDF5]',
      iconColor: 'text-[#10b981]',
      onClick: () => navigate('/flow-chamber'),
    },
    {
      label: '查看笔记',
      icon: NotebookPen,
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => navigate('/my-notes'),
    },
  ];

  return (
    <div className="col-span-1 card p-5 flex flex-col min-h-[260px]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-[5px] flex items-center justify-center bg-[#ECFDF5]">
          <Zap size={16} className="text-[#10b981]" />
        </div>
        <h3 className="font-sans font-semibold text-[#111111] text-base">快捷操作</h3>
      </div>

      <div className="flex-1 flex flex-col gap-2.5">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className="card-interactive flex items-center gap-3 px-4 py-3.5 rounded-[6px] text-left transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-[5px] flex items-center justify-center flex-shrink-0 transition-colors ${action.bgColor}`}
            >
              <action.icon size={16} className={action.iconColor} />
            </div>
            <span className="text-sm text-[#666666] group-hover:text-[#111111] transition-colors">{action.label}</span>
            <span
              className="ml-auto text-[#999999] group-hover:text-[#999999] transition-colors text-xs"
            >
              →
            </span>
          </motion.button>
        ))}
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
      <motion.div variants={itemVariants} className="contents">
        <QuickActions />
      </motion.div>
    </motion.div>
  );
}
