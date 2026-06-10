import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Download,
  BookOpen,
  Filter,
  X,
  Heart,
  ChevronDown,
  ChevronUp,
  FileText,
  StickyNote,
  Sparkles,
} from 'lucide-react';
import { useAppStore, type Material } from '@/store/useAppStore';

/* ───────── 级联数据 ───────── */
const cascadeData: Record<string, Record<string, Record<string, string[]>>> = {
  浙江大学: {
    数学学院: {
      工科试验班: ['王教授', '刘教授'],
      数学系: ['王教授', '周教授'],
    },
    物理学院: {
      工科试验班: ['李教授', '孙教授'],
      应用物理: ['李教授'],
    },
  },
  清华大学: {
    数学系: {
      计算机科学: ['张教授', '吴教授'],
      基础数学: ['张教授'],
    },
    计算机系: {
      计算机科学: ['陈教授', '郑教授'],
      人工智能: ['陈教授'],
    },
  },
  北京大学: {
    数学学院: {
      应用数学: ['赵教授', '钱教授'],
      基础数学: ['赵教授'],
    },
    信息科学技术学院: {
      计算机科学: ['孙教授', '李教授'],
      数据科学: ['孙教授'],
    },
  },
};

const typeOptions = [
  { value: 'exam', label: '历年真题' },
  { value: 'notes', label: '笔记' },
  { value: 'cheatsheet', label: '通关秘籍' },
] as const;

/* ───────── 类型徽章配置 ───────── */
const typeBadgeConfig: Record<Material['type'], { label: string; icon: typeof FileText; colorClass: string; bgClass: string }> = {
  exam: { label: '真题', icon: FileText, colorClass: 'neon-text-blue', bgClass: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' },
  notes: { label: '笔记', icon: StickyNote, colorClass: 'neon-text-green', bgClass: 'bg-neon-green/10 border-neon-green/30 text-neon-green' },
  cheatsheet: { label: '秘籍', icon: Sparkles, colorClass: 'neon-text-purple', bgClass: 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple' },
};

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

/* ───────── 下拉选择组件 ───────── */
function SelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-dark-600/60 border border-white/5 text-sm text-zinc-300 hover:border-neon-green/30 transition-colors"
      >
        <span className={value ? 'text-zinc-200' : 'text-zinc-600'}>{value || placeholder}</span>
        {open ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </button>
      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-1 w-full rounded-lg bg-dark-600 border border-white/10 shadow-glass overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neon-green/10 transition-colors ${
                  opt === value ? 'text-neon-green bg-neon-green/5' : 'text-zinc-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── 星级评分 ───────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? 'text-neon-yellow fill-neon-yellow' : 'text-zinc-700'}
        />
      ))}
      <span className="text-xs text-zinc-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PeerHub 主组件
   ═══════════════════════════════════════════ */
export default function PeerHub() {
  const materials = useAppStore((s) => s.materials);

  /* ── 筛选状态 ── */
  const [university, setUniversity] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [professor, setProfessor] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<Material['type']>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  /* ── 级联选项 ── */
  const universities = Object.keys(cascadeData);
  const colleges = university ? Object.keys(cascadeData[university] ?? {}) : [];
  const majors = university && college ? Object.keys(cascadeData[university]?.[college] ?? {}) : [];
  const professors = university && college && major ? cascadeData[university]?.[college]?.[major] ?? [] : [];

  /* 重置下级 */
  const handleUniversityChange = (v: string) => {
    setUniversity(v);
    setCollege('');
    setMajor('');
    setProfessor('');
  };
  const handleCollegeChange = (v: string) => {
    setCollege(v);
    setMajor('');
    setProfessor('');
  };
  const handleMajorChange = (v: string) => {
    setMajor(v);
    setProfessor('');
  };

  /* ── 类型复选 ── */
  const toggleType = (t: Material['type']) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  /* ── 过滤资料 ── */
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (university && m.university !== university) return false;
      if (college && m.college !== college) return false;
      if (major && m.major !== major) return false;
      if (professor && m.professor !== professor) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(m.type)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inTags = m.tags.some((t) => t.toLowerCase().includes(q));
        const inProf = m.professor.toLowerCase().includes(q);
        if (!inTitle && !inTags && !inProf) return false;
      }
      return true;
    });
  }, [materials, university, college, major, professor, selectedTypes, searchQuery]);

  /* ── 收藏切换 ── */
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── 清除筛选 ── */
  const clearFilters = () => {
    setUniversity('');
    setCollege('');
    setMajor('');
    setProfessor('');
    setSelectedTypes(new Set());
    setSearchQuery('');
  };

  const hasActiveFilter = university || college || major || professor || selectedTypes.size > 0;

  return (
    <div className="flex gap-6 h-full">
      {/* ═══════ 侧边栏 ═══════ */}
      {/* 移动端遮罩 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-[260px] flex-shrink-0
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="glass-card p-5 h-full overflow-y-auto" style={{ borderColor: 'rgba(0,255,136,0.1)' }}>
          {/* 标题 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Filter size={16} className="neon-text-green" />
              <h3 className="font-display font-semibold text-sm text-white">筛选器</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-500 hover:text-neon-green transition-colors"
                >
                  清除
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-white/5"
              >
                <X size={14} className="text-zinc-500" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 高校选择 */}
            <SelectDropdown
              label="高校选择"
              options={universities}
              value={university}
              onChange={handleUniversityChange}
              placeholder="选择高校"
            />

            {/* 学院选择 */}
            <SelectDropdown
              label="学院选择"
              options={colleges}
              value={college}
              onChange={handleCollegeChange}
              placeholder={university ? '选择学院' : '请先选择高校'}
            />

            {/* 专业选择 */}
            <SelectDropdown
              label="专业选择"
              options={majors}
              value={major}
              onChange={handleMajorChange}
              placeholder={college ? '选择专业' : '请先选择学院'}
            />

            {/* 教授选择 */}
            <SelectDropdown
              label="教授选择"
              options={professors}
              value={professor}
              onChange={setProfessor}
              placeholder={major ? '选择教授' : '请先选择专业'}
            />

            {/* 分隔线 */}
            <div className="border-t border-white/5 pt-4">
              <label className="block text-xs text-zinc-500 mb-2.5 font-medium">资料类型</label>
              <div className="space-y-2">
                {typeOptions.map((opt) => {
                  const checked = selectedTypes.has(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          checked
                            ? 'bg-neon-green/20 border-neon-green/60'
                            : 'border-white/10 group-hover:border-white/20'
                        }`}
                      >
                        {checked && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 text-neon-green"
                            fill="currentColor"
                            viewBox="0 0 12 12"
                          >
                            <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        )}
                      </span>
                      <span className={`text-sm ${checked ? 'text-zinc-200' : 'text-zinc-500'} group-hover:text-zinc-300 transition-colors`}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 筛选结果统计 */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-zinc-600">
              找到 <span className="neon-text-green font-semibold">{filtered.length}</span> 份资料
            </p>
          </div>
        </div>
      </aside>

      {/* ═══════ 主内容区 ═══════ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 搜索栏 */}
        <div className="flex items-center gap-4 mb-6">
          {/* 移动端筛选按钮 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex-shrink-0 p-2.5 rounded-xl glass-card hover:border-neon-green/30 transition-colors"
          >
            <Filter size={18} className="neon-text-green" />
          </button>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索资料名称、标签、教授..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-600/60 border border-white/5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-300 focus:border-neon-blue/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
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
        </div>

        {/* 资料卡片网格 */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <BookOpen size={48} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">没有找到匹配的资料</p>
            <p className="text-zinc-600 text-xs mt-1">尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-4 pr-1">
            {filtered.map((material, i) => {
              const badge = typeBadgeConfig[material.type];
              const BadgeIcon = badge.icon;
              const isFav = favorites.has(material.id);

              return (
                <motion.div
                  key={material.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{
                    boxShadow: material.type === 'exam'
                      ? '0 0 20px rgba(0,212,255,0.15), 0 8px 32px rgba(0,0,0,0.3)'
                      : material.type === 'notes'
                      ? '0 0 20px rgba(0,255,136,0.15), 0 8px 32px rgba(0,0,0,0.3)'
                      : '0 0 20px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                  onClick={() => setSelectedMaterial(material)}
                  className="glass-card p-4 cursor-pointer group"
                >
                  {/* 顶部：类型徽章 + 收藏 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badge.bgClass}`}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(material.id);
                      }}
                      className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Heart
                        size={14}
                        className={isFav ? 'text-neon-pink fill-neon-pink' : 'text-zinc-600 group-hover:text-zinc-400'}
                      />
                    </button>
                  </div>

                  {/* 标题 */}
                  <h4 className="font-display font-semibold text-sm text-zinc-100 mb-2 line-clamp-2 leading-snug">
                    {material.title}
                  </h4>

                  {/* 教授 & 学校 */}
                  <p className="text-xs text-zinc-500 mb-2">
                    {material.professor} · {material.university}
                  </p>

                  {/* 评分 & 下载 */}
                  <div className="flex items-center gap-4 mb-3">
                    <StarRating rating={material.rating} />
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Download size={11} />
                      {material.downloads.toLocaleString()}
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {material.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-zinc-500 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 积分 */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-zinc-600">所需积分</span>
                    <span className="neon-text-green font-display font-bold text-sm">
                      {material.credits}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ 资料详情弹窗 ═══════ */}
      <AnimatePresence>
        {selectedMaterial && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSelectedMaterial(null)}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg p-6 relative"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedMaterial(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} className="text-zinc-500" />
              </button>

              {/* 类型徽章 */}
              {(() => {
                const badge = typeBadgeConfig[selectedMaterial.type];
                const BadgeIcon = badge.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.bgClass} mb-4`}>
                    <BadgeIcon size={14} />
                    {badge.label}
                  </span>
                );
              })()}

              {/* 标题 */}
              <h2 className="font-display font-bold text-lg text-white mb-2 pr-8">
                {selectedMaterial.title}
              </h2>

              {/* 描述 */}
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                {selectedMaterial.description}
              </p>

              {/* 元数据 */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-dark-600/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-0.5">高校</p>
                  <p className="text-sm text-zinc-300">{selectedMaterial.university}</p>
                </div>
                <div className="bg-dark-600/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-0.5">学院</p>
                  <p className="text-sm text-zinc-300">{selectedMaterial.college}</p>
                </div>
                <div className="bg-dark-600/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-0.5">专业</p>
                  <p className="text-sm text-zinc-300">{selectedMaterial.major}</p>
                </div>
                <div className="bg-dark-600/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-0.5">教授</p>
                  <p className="text-sm text-zinc-300">{selectedMaterial.professor}</p>
                </div>
              </div>

              {/* 评分 & 下载 */}
              <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                  <StarRating rating={selectedMaterial.rating} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Download size={14} />
                  {selectedMaterial.downloads.toLocaleString()} 次下载
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedMaterial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-zinc-400 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                <button className="neon-btn neon-btn-green flex items-center gap-2 flex-1 justify-center">
                  <Download size={16} />
                  下载
                </button>
                <button
                  onClick={() => toggleFavorite(selectedMaterial.id)}
                  className={`neon-btn flex items-center gap-2 px-5 ${
                    favorites.has(selectedMaterial.id)
                      ? 'bg-neon-pink/10 border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/20 hover:shadow-[0_0_20px_rgba(255,0,128,0.3)]'
                      : 'neon-btn-purple'
                  }`}
                >
                  <Heart
                    size={16}
                    className={favorites.has(selectedMaterial.id) ? 'fill-neon-pink' : ''}
                  />
                  {favorites.has(selectedMaterial.id) ? '已收藏' : '收藏'}
                </button>
              </div>

              {/* 积分提示 */}
              <p className="text-center text-xs text-zinc-600 mt-3">
                下载需消耗 <span className="neon-text-green font-semibold">{selectedMaterial.credits}</span> 积分
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
