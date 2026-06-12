import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen,
  Search,
  Tag,
  Trash2,
  Edit3,
  Plus,
  X,
  FileText,
  ChevronDown,
  Check,
  BookOpen,
} from 'lucide-react';
import { Note, useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

/* ───────── 排序类型 ───────── */
type SortOption = 'newest' | 'oldest' | 'subject';

/* ───────── 动画变体 ───────── */
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.15 } },
};

/* ───────── 工具函数 ───────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ───────── 输入框样式 ───────── */
const inputBase =
  'w-full px-3 py-2 rounded-lg bg-dark-700/80 border border-white/[0.06] text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-neon-green/30 focus:shadow-[0_0_12px_rgba(0,255,136,0.08)]';
const inputError = 'border-red-500/50 focus:border-red-500/60 focus:shadow-[0_0_12px_rgba(255,68,68,0.1)]';

/* ═══════════════════════════════════════════
   MyNotes 主组件
   ═══════════════════════════════════════════ */
export default function MyNotes() {
  const subjects = useAppStore((s) => s.subjects);
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const addToast = useToastStore((s) => s.addToast);

  /* ── 筛选状态 ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  /* ── 上传表单状态 ── */
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadTagsInput, setUploadTagsInput] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  /* ── 详情/编辑弹窗状态 ── */
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');

  /* ── 删除确认 ── */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ── 排序下拉 ── */
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  /* ── 过滤 & 排序 ── */
  const filteredNotes = useMemo(() => {
    let result = notes.filter((n) => {
      if (selectedSubjectId && n.subjectId !== selectedSubjectId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === 'subject') return a.subjectId.localeCompare(b.subjectId);
      return 0;
    });

    return result;
  }, [notes, selectedSubjectId, searchQuery, sortOption]);

  /* ── 辅助：获取科目 ── */
  const getSubject = useCallback(
    (id: string) => subjects.find((s) => s.id === id),
    [subjects],
  );

  /* ── 解析 tags 输入 ── */
  const parseTags = (input: string): string[] =>
    input
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

  /* ── 上传笔记 ── */
  const handleUpload = () => {
    const errors: Record<string, boolean> = {};
    if (!uploadTitle.trim()) errors.title = true;
    if (!uploadSubjectId) errors.subjectId = true;
    if (!uploadContent.trim()) errors.content = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const now = new Date().toISOString();
    const newNote: Note = {
      id: generateId(),
      title: uploadTitle.trim(),
      subjectId: uploadSubjectId,
      content: uploadContent.trim(),
      tags: parseTags(uploadTagsInput),
      createdAt: now,
      updatedAt: now,
    };
    addNote(newNote);
    addToast('success', '笔记创建成功');
    resetUploadForm();
  };

  const resetUploadForm = () => {
    setShowUploadForm(false);
    setUploadTitle('');
    setUploadSubjectId('');
    setUploadTagsInput('');
    setUploadContent('');
    setValidationErrors({});
  };

  /* ── 打开详情弹窗 ── */
  const openDetail = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTagsInput(note.tags.join(', '));
    setEditSubjectId(note.subjectId);
    setConfirmDeleteId(null);
  };

  /* ── 保存编辑 ── */
  const handleSaveEdit = () => {
    if (!selectedNote || !editTitle.trim() || !editContent.trim()) return;
    updateNote(selectedNote.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      tags: parseTags(editTagsInput),
      subjectId: editSubjectId,
    });
    addToast('success', '笔记已更新');
    setSelectedNote(null);
  };

  /* ── 删除笔记 ── */
  const handleDelete = (id: string) => {
    removeNote(id);
    addToast('info', '笔记已删除');
    setSelectedNote(null);
    setConfirmDeleteId(null);
  };

  /* ── 排序选项配置 ── */
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: '最新优先' },
    { value: 'oldest', label: '最早优先' },
    { value: 'subject', label: '按科目' },
  ];

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ═══════ 上传表单 ═══════ */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="glass-card p-5">
              {/* 表单头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center">
                    <BookOpen size={16} className="text-neon-green" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-zinc-100">新建笔记</h3>
                </div>
                <button
                  onClick={resetUploadForm}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={15} className="text-zinc-500" />
                </button>
              </div>

              {/* 标题 + 科目 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">标题</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => {
                      setUploadTitle(e.target.value);
                      if (validationErrors.title) setValidationErrors((prev) => ({ ...prev, title: false }));
                    }}
                    placeholder="笔记标题..."
                    className={`${inputBase} ${validationErrors.title ? inputError : ''}`}
                  />
                  {validationErrors.title && (
                    <p className="text-[11px] text-red-400/80 mt-1">请输入标题</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">科目</label>
                  <select
                    value={uploadSubjectId}
                    onChange={(e) => {
                      setUploadSubjectId(e.target.value);
                      if (validationErrors.subjectId) setValidationErrors((prev) => ({ ...prev, subjectId: false }));
                    }}
                    className={`${inputBase} ${validationErrors.subjectId ? inputError : ''}`}
                  >
                    <option value="" className="bg-dark-700 text-zinc-500">选择科目</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-dark-700 text-zinc-200">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.subjectId && (
                    <p className="text-[11px] text-red-400/80 mt-1">请选择科目</p>
                  )}
                </div>
              </div>

              {/* 标签 */}
              <div className="mb-3">
                <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">标签</label>
                <input
                  type="text"
                  value={uploadTagsInput}
                  onChange={(e) => setUploadTagsInput(e.target.value)}
                  placeholder="逗号分隔，如：偏导数, 全微分"
                  className={inputBase}
                />
                {parseTags(uploadTagsInput).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parseTags(uploadTagsInput).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="mb-4">
                <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">内容</label>
                <textarea
                  value={uploadContent}
                  onChange={(e) => {
                    setUploadContent(e.target.value);
                    if (validationErrors.content) setValidationErrors((prev) => ({ ...prev, content: false }));
                  }}
                  placeholder="写下你的笔记..."
                  rows={4}
                  className={`${inputBase} resize-none ${validationErrors.content ? inputError : ''}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {validationErrors.content ? (
                    <p className="text-[11px] text-red-400/80">请输入内容</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-zinc-600 tabular-nums">{uploadContent.length} 字</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!uploadTitle.trim() || !uploadSubjectId || !uploadContent.trim()}
                  className="neon-btn neon-btn-green flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  <Check size={15} />
                  保存
                </button>
                <button
                  onClick={resetUploadForm}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 筛选栏 ═══════ */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 科目 Tab */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedSubjectId('')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              selectedSubjectId === ''
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            全部
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(selectedSubjectId === s.id ? '' : s.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedSubjectId === s.id
                  ? 'border'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
              style={
                selectedSubjectId === s.id
                  ? { borderColor: s.color + '33', backgroundColor: s.color + '14', color: s.color }
                  : undefined
              }
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* 搜索框 */}
        <div className="relative w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-full pl-9 pr-8 py-1.5 rounded-md bg-dark-700/80 border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-neon-green/30 focus:shadow-[0_0_10px_rgba(0,255,136,0.06)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/5"
            >
              <X size={12} className="text-zinc-500" />
            </button>
          )}
        </div>

        {/* 排序下拉 */}
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-dark-700/80 border border-white/[0.06] text-xs text-zinc-400 hover:border-white/10 transition-colors"
          >
            {sortOptions.find((o) => o.value === sortOption)?.label}
            <ChevronDown size={12} className="text-zinc-500" />
          </button>
          <AnimatePresence>
            {sortDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 z-20 mt-1 w-32 rounded-lg bg-dark-700 border border-white/[0.08] shadow-glass overflow-hidden"
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortOption(opt.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors ${
                      sortOption === opt.value ? 'text-neon-green' : 'text-zinc-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 新建按钮 */}
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="neon-btn neon-btn-green flex items-center gap-1.5 text-xs !py-1.5 !px-3"
        >
          <Plus size={14} />
          新建
        </button>
      </div>

      {/* ═══════ 笔记卡片网格 ═══════ */}
      {notes.length === 0 ? (
        /* 全空状态 */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <NotebookPen size={64} className="text-zinc-800 mb-4" strokeWidth={1.2} />
          <p className="text-zinc-400 text-sm font-medium">还没有笔记，点击上方新建</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* 筛选空状态 */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <Search size={40} className="text-zinc-800 mb-3" strokeWidth={1.2} />
          <p className="text-zinc-500 text-sm">没有匹配的笔记</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto flex-1 pb-4 pr-1">
          {filteredNotes.map((note, i) => {
            const subject = getSubject(note.subjectId);
            const subjectColor = subject?.color ?? '#00ff88';
            const contentPreview = note.content.replace(/\n/g, ' ').slice(0, 90);

            return (
              <motion.div
                key={note.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                onClick={() => openDetail(note)}
                className="glass-card cursor-pointer group relative"
                style={{ borderLeftColor: subjectColor + '40', borderLeftWidth: '3px' }}
              >
                <div className="p-4 pl-4">
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-semibold text-[13px] text-zinc-100 leading-snug flex-1 line-clamp-2">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(note);
                          setIsEditing(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                        title="编辑"
                      >
                        <Edit3 size={12} className="text-zinc-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={12} className="text-zinc-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* 科目 + 日期 */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subjectColor }}
                    />
                    <span className="text-[11px] text-zinc-500">{subject?.name ?? '未知科目'}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-600">{formatDate(note.createdAt)}</span>
                  </div>

                  {/* 标签 */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-px rounded text-[10px] bg-white/[0.03] text-zinc-500 border border-white/[0.04]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 内容预览 */}
                  <p className="text-xs text-zinc-500/80 leading-relaxed line-clamp-2">
                    {contentPreview}
                    {note.content.length > 90 && <span className="text-zinc-600">...</span>}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════ 笔记详情/编辑弹窗 ═══════ */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedNote(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors z-10"
              >
                <X size={16} className="text-zinc-500" />
              </button>

              {!isEditing ? (
                <>
                  {/* ── 查看模式 ── */}
                  {(() => {
                    const subject = getSubject(selectedNote.subjectId);
                    const color = subject?.color ?? '#00ff88';
                    return (
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium" style={{ color }}>
                          {subject?.name ?? '未知科目'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 标题 */}
                  <h2 className="font-display font-bold text-lg text-white mb-3 pr-8 leading-tight">
                    {selectedNote.title}
                  </h2>

                  {/* 标签 */}
                  {selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="rounded-lg bg-dark-700/50 p-4 mb-5 border border-white/[0.04]">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-600 mb-5">
                    <span>创建于 {formatDate(selectedNote.createdAt)}</span>
                    {selectedNote.updatedAt !== selectedNote.createdAt && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span>更新于 {formatDate(selectedNote.updatedAt)}</span>
                      </>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="neon-btn neon-btn-green flex items-center gap-2 flex-1 justify-center"
                    >
                      <Edit3 size={15} />
                      编辑
                    </button>
                    {confirmDeleteId === selectedNote.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(selectedNote.id)}
                          className="neon-btn neon-btn-pink flex items-center gap-2"
                        >
                          <Trash2 size={15} />
                          确认删除
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(selectedNote.id)}
                        className="px-4 py-2 rounded-lg text-sm text-red-400/50 border border-red-400/15 hover:bg-red-400/8 hover:text-red-400/80 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* ── 编辑模式 ── */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-semibold text-sm text-zinc-200 flex items-center gap-2">
                      <Edit3 size={15} className="text-neon-green" />
                      编辑笔记
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-neon-green/60">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green/50 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon-green" />
                      </span>
                      编辑中...
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* 标题 */}
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">标题</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={inputBase}
                      />
                    </div>

                    {/* 科目 */}
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">科目</label>
                      <select
                        value={editSubjectId}
                        onChange={(e) => setEditSubjectId(e.target.value)}
                        className={inputBase}
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id} className="bg-dark-700 text-zinc-200">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 标签 */}
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">标签</label>
                      <input
                        type="text"
                        value={editTagsInput}
                        onChange={(e) => setEditTagsInput(e.target.value)}
                        placeholder="逗号分隔"
                        className={inputBase}
                      />
                      {parseTags(editTagsInput).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parseTags(editTagsInput).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 内容 */}
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1 font-medium tracking-wide uppercase">内容</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        className={`${inputBase} resize-none`}
                      />
                      <span className="text-[11px] text-zinc-600 mt-1 block text-right tabular-nums">{editContent.length} 字</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3 mt-5">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim() || !editContent.trim()}
                      className="neon-btn neon-btn-green flex items-center gap-2 flex-1 justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none"
                    >
                      <Check size={15} />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
