import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen,
  Upload,
  Search,
  Tag,
  Trash2,
  Edit3,
  Plus,
  X,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

/* ───────── 类型定义 ───────── */
interface Note {
  id: string;
  title: string;
  subjectId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/* ───────── Mock 数据 ───────── */
const initialNotes: Note[] = [
  { id: '1', title: '多元函数微分 - 重点笔记', subjectId: '1', content: '偏导数：对某个变量求导，其他变量视为常数\n全微分：dz = (∂z/∂x)dx + (∂z/∂y)dy\n方向导数：沿某方向的变化率，梯度方向最大\n极值：AC-B²判别法，条件极值用拉格朗日乘数法', tags: ['偏导数', '全微分', '极值'], createdAt: '2026-06-08T10:30:00', updatedAt: '2026-06-08T10:30:00' },
  { id: '2', title: '格林公式与曲线积分', subjectId: '1', content: '格林公式：∮Pdx+Qdy = ∬(∂Q/∂x - ∂P/∂y)dA\n路径无关条件：∂Q/∂x = ∂P/∂y\n应用：计算面积、简化曲线积分', tags: ['格林公式', '曲线积分', '路径无关'], createdAt: '2026-06-07T14:20:00', updatedAt: '2026-06-09T08:15:00' },
  { id: '3', title: '电磁学公式汇总', subjectId: '2', content: '库仑定律：F = kq₁q₂/r²\n高斯定理：∮E·dA = Q/ε₀\n安培环路定理：∮B·dl = μ₀I\n法拉第定律：ε = -dΦ/dt', tags: ['电磁学', '公式汇总', '麦克斯韦'], createdAt: '2026-06-06T09:00:00', updatedAt: '2026-06-06T09:00:00' },
  { id: '4', title: '矩阵运算速查表', subjectId: '3', content: '转置：(AB)ᵀ = BᵀAᵀ\n逆矩阵：(AB)⁻¹ = B⁻¹A⁻¹\n行列式：|AB| = |A||B|\n特征值：Ax = λx\n正交化：Gram-Schmidt过程', tags: ['矩阵', '特征值', '速查表'], createdAt: '2026-06-05T16:45:00', updatedAt: '2026-06-08T11:20:00' },
  { id: '5', title: '排序算法对比', subjectId: '4', content: '冒泡 O(n²) 稳定\n快排 O(nlogn) 平均 不稳定\n归并 O(nlogn) 稳定\n堆排 O(nlogn) 不稳定\n选择排序 O(n²) 不稳定', tags: ['排序', '时间复杂度', '算法对比'], createdAt: '2026-06-04T13:10:00', updatedAt: '2026-06-04T13:10:00' },
  { id: '6', title: '概率论核心公式', subjectId: '5', content: '贝叶斯：P(A|B) = P(B|A)P(A)/P(B)\n全概率：P(B) = ΣP(B|Ai)P(Ai)\n期望：E(X) = Σxi·pi\n方差：D(X) = E(X²) - [E(X)]²', tags: ['贝叶斯', '期望', '方差'], createdAt: '2026-06-03T20:30:00', updatedAt: '2026-06-07T15:00:00' },
  { id: '7', title: '级数判敛方法总结', subjectId: '1', content: '比值法：lim|aₙ₊₁/aₙ| < 1 收敛\n根值法：lim ⁿ√|aₙ| < 1 收敛\n比较法：与已知级数比较\n莱布尼茨判别法：交错级数', tags: ['级数', '判敛', '总结'], createdAt: '2026-06-02T11:00:00', updatedAt: '2026-06-02T11:00:00' },
];

/* ───────── 排序类型 ───────── */
type SortOption = 'newest' | 'oldest' | 'subject';

/* ───────── 动画变体 ───────── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.15 } },
};

const uploadZoneVariants = {
  rest: { borderColor: 'rgba(0,255,136,0.2)' },
  hover: { borderColor: 'rgba(0,255,136,0.5)', boxShadow: '0 0 30px rgba(0,255,136,0.15)' },
};

/* ───────── 工具函数 ───────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ═══════════════════════════════════════════
   MyNotes 主组件
   ═══════════════════════════════════════════ */
export default function MyNotes() {
  const subjects = useAppStore((s) => s.subjects);

  /* ── 笔记状态 ── */
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  /* ── 筛选状态 ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  /* ── 上传表单状态 ── */
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadTagsInput, setUploadTagsInput] = useState('');
  const [uploadContent, setUploadContent] = useState('');

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

  /* ── 收集所有 tag ── */
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  /* ── 过滤 & 排序 ── */
  const filteredNotes = useMemo(() => {
    let result = notes.filter((n) => {
      if (selectedSubjectId && n.subjectId !== selectedSubjectId) return false;
      if (selectedTag && !n.tags.includes(selectedTag)) return false;
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
  }, [notes, selectedSubjectId, selectedTag, searchQuery, sortOption]);

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
    if (!uploadTitle.trim() || !uploadSubjectId || !uploadContent.trim()) return;
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
    setNotes((prev) => [newNote, ...prev]);
    resetUploadForm();
  };

  const resetUploadForm = () => {
    setShowUploadForm(false);
    setUploadTitle('');
    setUploadSubjectId('');
    setUploadTagsInput('');
    setUploadContent('');
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
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id
          ? {
              ...n,
              title: editTitle.trim(),
              content: editContent.trim(),
              tags: parseTags(editTagsInput),
              subjectId: editSubjectId,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    setSelectedNote(null);
  };

  /* ── 删除笔记 ── */
  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
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
    <div className="flex flex-col gap-6 h-full">
      {/* ═══════ 顶部：搜索 + 筛选 + 排序 ═══════ */}
      <div className="flex flex-col gap-4">
        {/* 搜索栏 + 上传按钮 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记标题或内容..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-600/60 border border-white/5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-300 focus:border-neon-green/50 focus:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/5"
              >
                <X size={14} className="text-zinc-500" />
              </button>
            )}
          </div>

          {/* 排序下拉 */}
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-600/60 border border-white/5 text-sm text-zinc-400 hover:border-white/10 transition-colors"
            >
              {sortOptions.find((o) => o.value === sortOption)?.label}
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            <AnimatePresence>
              {sortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-1 w-36 rounded-lg bg-dark-600 border border-white/10 shadow-glass overflow-hidden"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortOption(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neon-green/10 transition-colors ${
                        sortOption === opt.value ? 'text-neon-green bg-neon-green/5' : 'text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 上传按钮 */}
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="neon-btn neon-btn-green flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} />
            新建笔记
          </button>
        </div>

        {/* 科目筛选 Tab */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSubjectId('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSubjectId === ''
                ? 'bg-neon-green/15 text-neon-green border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-300 hover:border-white/10'
            }`}
          >
            全部
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(selectedSubjectId === s.id ? '' : s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSubjectId === s.id
                  ? 'border shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                  : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-300 hover:border-white/10'
              }`}
              style={
                selectedSubjectId === s.id
                  ? { borderColor: s.color + '4D', backgroundColor: s.color + '26', color: s.color }
                  : undefined
              }
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Tag 筛选 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={13} className="text-zinc-600 flex-shrink-0" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-all ${
                  selectedTag === tag
                    ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                    : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-400 hover:border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag('')}
                className="p-0.5 rounded hover:bg-white/5 transition-colors"
              >
                <X size={12} className="text-zinc-500" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════ 上传区 ═══════ */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <motion.div
              variants={uploadZoneVariants}
              initial="rest"
              whileHover="hover"
              className="glass-card p-6 border-2 border-dashed"
              style={{ borderColor: 'rgba(0,255,136,0.2)' }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                  <Upload size={20} className="text-neon-green" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">新建笔记</h3>
                  <p className="text-xs text-zinc-500">填写笔记信息，点击保存即可添加</p>
                </div>
                <button
                  onClick={resetUploadForm}
                  className="ml-auto p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 标题 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">笔记标题</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="输入笔记标题..."
                    className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-neon-green/30"
                  />
                </div>

                {/* 科目 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">所属科目</label>
                  <select
                    value={uploadSubjectId}
                    onChange={(e) => setUploadSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 outline-none transition-all focus:border-neon-green/30 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-dark-600 text-zinc-400">选择科目</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-dark-600 text-zinc-200">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 标签 */}
              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">标签（逗号分隔）</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={uploadTagsInput}
                    onChange={(e) => setUploadTagsInput(e.target.value)}
                    placeholder="偏导数, 全微分, 极值"
                    className="flex-1 px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-neon-green/30"
                  />
                </div>
                {parseTags(uploadTagsInput).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parseTags(uploadTagsInput).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-xs bg-neon-green/10 text-neon-green border border-neon-green/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="mb-5">
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">笔记内容</label>
                <textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="输入笔记内容..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-neon-green/30 resize-none"
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!uploadTitle.trim() || !uploadSubjectId || !uploadContent.trim()}
                  className="neon-btn neon-btn-green flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={16} />
                  保存笔记
                </button>
                <button
                  onClick={resetUploadForm}
                  className="px-5 py-2 rounded-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 笔记卡片网格 ═══════ */}
      {filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <NotebookPen size={48} className="text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-sm">没有找到匹配的笔记</p>
          <p className="text-zinc-600 text-xs mt-1">尝试调整筛选条件或新建笔记</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-4 pr-1">
          {filteredNotes.map((note, i) => {
            const subject = getSubject(note.subjectId);
            const subjectColor = subject?.color ?? '#00ff88';
            const contentPreview = note.content.replace(/\n/g, ' ').slice(0, 80);

            return (
              <motion.div
                key={note.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{
                  boxShadow: `0 0 20px ${subjectColor}26, 0 8px 32px rgba(0,0,0,0.3)`,
                }}
                onClick={() => openDetail(note)}
                className="glass-card cursor-pointer group relative overflow-hidden"
              >
                {/* 科目颜色指示条 */}
                <div
                  className="h-1 rounded-t-2xl"
                  style={{ backgroundColor: subjectColor }}
                />

                <div className="p-4">
                  {/* 标题 + 操作按钮 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-semibold text-sm text-zinc-100 leading-snug flex-1 line-clamp-2">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(note);
                          setIsEditing(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="编辑"
                      >
                        <Edit3 size={13} className="text-zinc-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={13} className="text-zinc-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* 科目名称 */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subjectColor }}
                    />
                    <span className="text-xs text-zinc-500">{subject?.name ?? '未知科目'}</span>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-neon-green/5 text-neon-green/70 border border-neon-green/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 内容预览 */}
                  <p className="text-xs text-zinc-500 leading-relaxed mb-3 line-clamp-2">
                    {contentPreview}
                    {note.content.length > 80 && '...'}
                  </p>

                  {/* 底部：日期 + 图标 */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-zinc-600">
                      {formatDate(note.createdAt)}
                    </span>
                    <FileText size={12} className="text-zinc-700" />
                  </div>
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
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto"
              style={{ borderColor: 'rgba(0,255,136,0.1)' }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedNote(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors z-10"
              >
                <X size={18} className="text-zinc-500" />
              </button>

              {!isEditing ? (
                <>
                  {/* ── 查看模式 ── */}
                  {/* 科目颜色指示 */}
                  {(() => {
                    const subject = getSubject(selectedNote.subjectId);
                    const color = subject?.color ?? '#00ff88';
                    return (
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium" style={{ color }}>
                          {subject?.name ?? '未知科目'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 标题 */}
                  <h2 className="font-display font-bold text-lg text-white mb-4 pr-8">
                    {selectedNote.title}
                  </h2>

                  {/* 标签 */}
                  {selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-xs bg-neon-green/10 text-neon-green border border-neon-green/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="bg-dark-600/50 rounded-xl p-4 mb-5">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex items-center gap-4 text-xs text-zinc-600 mb-5">
                    <span>创建于 {formatDate(selectedNote.createdAt)}</span>
                    {selectedNote.updatedAt !== selectedNote.createdAt && (
                      <span>更新于 {formatDate(selectedNote.updatedAt)}</span>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="neon-btn neon-btn-green flex items-center gap-2 flex-1 justify-center"
                    >
                      <Edit3 size={16} />
                      编辑
                    </button>
                    {confirmDeleteId === selectedNote.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(selectedNote.id)}
                          className="neon-btn neon-btn-pink flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          确认删除
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 rounded-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(selectedNote.id)}
                        className="px-5 py-2 rounded-full text-sm text-red-400/60 border border-red-400/20 hover:bg-red-400/10 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* ── 编辑模式 ── */}
                  <h3 className="font-display font-semibold text-sm text-white mb-5 flex items-center gap-2">
                    <Edit3 size={16} className="text-neon-green" />
                    编辑笔记
                  </h3>

                  <div className="space-y-4">
                    {/* 标题 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 font-medium">标题</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 outline-none transition-all focus:border-neon-green/30"
                      />
                    </div>

                    {/* 科目 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 font-medium">科目</label>
                      <select
                        value={editSubjectId}
                        onChange={(e) => setEditSubjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 outline-none transition-all focus:border-neon-green/30 appearance-none cursor-pointer"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id} className="bg-dark-600 text-zinc-200">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 标签 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 font-medium">标签（逗号分隔）</label>
                      <input
                        type="text"
                        value={editTagsInput}
                        onChange={(e) => setEditTagsInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 outline-none transition-all focus:border-neon-green/30"
                      />
                      {parseTags(editTagsInput).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parseTags(editTagsInput).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-xs bg-neon-green/10 text-neon-green border border-neon-green/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 内容 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 font-medium">内容</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-200 outline-none transition-all focus:border-neon-green/30 resize-none"
                      />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3 mt-5">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim() || !editContent.trim()}
                      className="neon-btn neon-btn-green flex items-center gap-2 flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check size={16} />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setConfirmDeleteId(null);
                      }}
                      className="px-5 py-2 rounded-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
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
