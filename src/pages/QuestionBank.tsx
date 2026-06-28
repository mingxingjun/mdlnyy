import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Search, FileText,
  ChevronDown, ChevronRight, CheckSquare, Square, Edit3, Folder,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Question, StudyMaterial } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';

/* ═══════════════════════════════════════════════════════
   常量与类型
   ═══════════════════════════════════════════════════════ */

const QTYPE_OPTIONS: { value: Question['type']; label: string }[] = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'short', label: '简答题' },
  { value: 'calculation', label: '计算题' },
];

const QTYPE_LABEL: Record<Question['type'], string> = {
  choice: '选择题',
  fill: '填空题',
  short: '简答题',
  calculation: '计算题',
};

const QTYPE_SHORT: Record<Question['type'], string> = {
  choice: '选',
  fill: '填',
  short: '简',
  calculation: '算',
};

interface EditForm {
  id?: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  stem: string;
  optionsText: string;
  answer: string;
  explanation: string;
  materialId: string;
}

const EMPTY_FORM: EditForm = {
  type: 'fill',
  difficulty: 3,
  stem: '',
  optionsText: '',
  answer: '',
  explanation: '',
  materialId: '',
};

/** 一套题库 = 一个 material + 其下所有题目 */
interface QuestionSet {
  material: StudyMaterial;
  questions: Question[];
  dateLabel: string; // YYYY-MM-DD
}

/* ═══════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════ */

function toDateLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function QuestionBank() {
  const questions = useAppStore((s) => s.questions);
  const materials = useAppStore((s) => s.materials);
  const addQuestion = useAppStore((s) => s.addQuestion);
  const updateQuestion = useAppStore((s) => s.updateQuestion);
  const deleteQuestion = useAppStore((s) => s.deleteQuestion);
  const updateMaterial = useAppStore((s) => s.updateMaterial);
  const removeMaterialAndQuestions = useAppStore((s) => s.removeMaterialAndQuestions);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const addToast = useToastStore((s) => s.addToast);

  /** 批量模式开关 */
  const [batchMode, setBatchMode] = useState(false);
  /** 选中的题目 id 集合（批量模式用） */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** 展开的题库套 materialId 集合 */
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  /** 编辑/新增表单 */
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  /** 重命名表单：materialId */
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  /** 待删除确认：{ type: 'set'|'question'|'batch', id? } */
  const [pendingDelete, setPendingDelete] = useState<
    { type: 'set'; id: string; name: string } |
    { type: 'question'; id: string } |
    { type: 'batch' } | null
  >(null);
  /** 搜索关键词（仅用于题目筛选，不影响套分组） */
  const [searchKeyword, setSearchKeyword] = useState('');

  // 按套分组：每个有题目的 material 为一套，按上传日期倒序
  // orphan 题目（materialId 为空或指向已删除的 material）归到"未分类题库"虚拟套
  const questionSets = useMemo<QuestionSet[]>(() => {
    const materialIds = new Set(materials.map((m) => m.id));
    const sets: QuestionSet[] = materials
      .map((m) => ({
        material: m,
        questions: questions
          .filter((q) => q.materialId === m.id)
          .sort((a, b) => a.createdAt - b.createdAt),
        dateLabel: toDateLabel(m.uploadedAt),
      }))
      .filter((s) => s.questions.length > 0);

    // orphan 题目：materialId 为空，或指向不存在的 material
    const orphanQs = questions.filter(
      (q) => !q.materialId || !materialIds.has(q.materialId),
    ).sort((a, b) => a.createdAt - b.createdAt);
    if (orphanQs.length > 0) {
      sets.push({
        material: {
          id: '__orphan__',
          name: '未分类题库',
          type: 'text',
          uploadedAt: orphanQs[0]?.createdAt ?? Date.now(),
          status: 'parsed',
          kind: 'bank',
        } as StudyMaterial,
        questions: orphanQs,
        dateLabel: toDateLabel(orphanQs[0]?.createdAt ?? Date.now()),
      });
    }

    // 按上传时间倒序（最新的套在前）
    sets.sort((a, b) => b.material.uploadedAt - a.material.uploadedAt);
    return sets;
  }, [questions, materials]);

  // 按日期分组（多套同一天上传归到一组）
  const setsByDate = useMemo(() => {
    const map = new Map<string, QuestionSet[]>();
    for (const s of questionSets) {
      if (!map.has(s.dateLabel)) map.set(s.dateLabel, []);
      map.get(s.dateLabel)!.push(s);
    }
    return Array.from(map.entries()); // [[dateLabel, sets], ...]
  }, [questionSets]);

  // 当前展开套里的、且匹配搜索词的题目
  const getFilteredQuestions = (set: QuestionSet): Question[] => {
    if (!searchKeyword.trim()) return set.questions;
    const kw = searchKeyword.trim().toLowerCase();
    return set.questions.filter(
      (q) =>
        q.stem.toLowerCase().includes(kw) ||
        q.answer.toLowerCase().includes(kw) ||
        (q.explanation || '').toLowerCase().includes(kw),
    );
  };

  const toggleExpand = (materialId: string) => {
    setExpandedSets((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) next.delete(materialId);
      else next.add(materialId);
      return next;
    });
  };

  const toggleSelect = (questionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const toggleSelectAllInSet = (set: QuestionSet) => {
    const ids = set.questions.map((q) => q.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleOpenAdd = (materialId?: string) => {
    setEditForm({
      ...EMPTY_FORM,
      materialId: materialId || (questionSets[0]?.material.id ?? ''),
    });
  };

  const handleOpenEdit = (q: Question) => {
    setEditForm({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      stem: q.stem,
      optionsText: q.options?.join('\n') ?? '',
      answer: q.answer,
      explanation: q.explanation,
      materialId: q.materialId,
    });
  };

  const handleSave = () => {
    if (!editForm) return;
    if (!editForm.stem.trim()) {
      addToast('warning', '题干不能为空');
      return;
    }
    if (!editForm.materialId) {
      addToast('warning', '请选择所属题库');
      return;
    }
    const options = editForm.type === 'choice'
      ? editForm.optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (editForm.id) {
      updateQuestion(editForm.id, {
        type: editForm.type,
        difficulty: editForm.difficulty,
        stem: editForm.stem.trim(),
        options: options && options.length > 0 ? options : undefined,
        answer: editForm.answer.trim(),
        explanation: editForm.explanation.trim(),
        materialId: editForm.materialId,
      });
      addToast('success', '题目已更新');
    } else {
      addQuestion({
        id: crypto.randomUUID(),
        materialId: editForm.materialId,
        knowledgePointIds: [],
        type: editForm.type,
        difficulty: editForm.difficulty,
        stem: editForm.stem.trim(),
        options: options && options.length > 0 ? options : undefined,
        answer: editForm.answer.trim(),
        explanation: editForm.explanation.trim(),
        source: 'bank',
        bankId: editForm.materialId,
        aiFilled: false,
        createdAt: Date.now(),
      });
      addToast('success', '题目已添加');
    }
    setEditForm(null);
  };

  const handleStartRename = (m: StudyMaterial) => {
    setRenameId(m.id);
    setRenameValue(m.name);
  };

  const handleConfirmRename = () => {
    if (!renameId || !renameValue.trim()) return;
    updateMaterial(renameId, { name: renameValue.trim() });
    addToast('success', '题库名已更新');
    setRenameId(null);
    setRenameValue('');
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'set') {
      if (pendingDelete.id === '__orphan__') {
        // 未分类虚拟套：只删题目，不删 material
        const orphanIds = questions
          .filter((q) => {
            const materialIds = new Set(materials.map((m) => m.id));
            return !q.materialId || !materialIds.has(q.materialId);
          })
          .map((q) => q.id);
        orphanIds.forEach((id) => deleteQuestion(id));
        addToast('success', `已清空「${pendingDelete.name}」共 ${orphanIds.length} 道题目`);
      } else {
        removeMaterialAndQuestions(pendingDelete.id);
        addToast('success', `已删除题库「${pendingDelete.name}」及全部题目`);
      }
    } else if (pendingDelete.type === 'question') {
      deleteQuestion(pendingDelete.id);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(pendingDelete.id); return n; });
      addToast('success', '题目已删除');
    } else if (pendingDelete.type === 'batch') {
      let count = 0;
      selectedIds.forEach((id) => { deleteQuestion(id); count++; });
      setSelectedIds(new Set());
      addToast('success', `已批量删除 ${count} 道题目`);
    }
    setPendingDelete(null);
  };

  const handleExitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  // 统计每套题型分布
  const getTypeDist = (qs: Question[]): string => {
    const dist: Record<string, number> = {};
    qs.forEach((q) => { dist[q.type] = (dist[q.type] || 0) + 1; });
    return QTYPE_OPTIONS
      .map((o) => dist[o.value] ? `${QTYPE_SHORT[o.value]}${dist[o.value]}` : null)
      .filter(Boolean)
      .join(' ') || '无';
  };

  const totalQuestions = questions.length;
  const totalSets = questionSets.length;
  const animatedQuestions = useCountUp(totalQuestions);
  const animatedSets = useCountUp(totalSets);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* 页头 */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            title="返回首页"
            aria-label="返回首页"
            className="inline-flex items-center justify-center w-9 h-9 rounded-paper border border-ink-600/20 bg-paper-100 text-ink-700 hover:bg-paper-200 hover:text-seal transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div>
            <p className="font-handwritten text-sm text-ink-500 leading-none">题库管理</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">
              题库 <span className="text-sm font-sans text-ink-500 font-normal ml-1">{animatedSets} 套 · {animatedQuestions} 题</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {batchMode ? (
            <VintageButton variant="ghost" size="sm" onClick={handleExitBatchMode}>
              退出批量
            </VintageButton>
          ) : (
            <>
              <VintageButton variant="ghost" size="sm" onClick={() => setBatchMode(true)}>
                <CheckSquare size={14} className="mr-1" aria-hidden="true" /> 批量操作
              </VintageButton>
              <VintageButton variant="primary" size="sm" onClick={() => handleOpenAdd()}>
                <Plus size={14} className="mr-1" aria-hidden="true" /> 新增题目
              </VintageButton>
            </>
          )}
        </div>
      </header>

      {/* 搜索栏 */}
      <PaperCard status="default" className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            aria-label="搜索题库"
            placeholder="搜索题库..."
            className="w-full pl-9 pr-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50"
          />
        </div>
      </PaperCard>

      {/* 批量操作栏（批量模式 + 有选中时显示） */}
      <AnimatePresence>
        {batchMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PaperCard status="active" className="p-3 flex items-center justify-between gap-3">
              <span className="text-sm font-serif text-ink-800">
                已选 <span className="font-bold text-seal">{selectedIds.size}</span> 题
              </span>
              <div className="flex items-center gap-2">
                <VintageButton variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  清空选择
                </VintageButton>
                <VintageButton
                  variant="primary"
                  size="sm"
                  className="bg-terracotta hover:bg-terracotta-dark border-terracotta-dark"
                  onClick={() => setPendingDelete({ type: 'batch' })}
                >
                  <Trash2 size={14} className="mr-1" /> 批量删除
                </VintageButton>
              </div>
            </PaperCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 题库为空 */}
      {totalSets === 0 ? (
        <PaperCard status="default" className="p-8 text-center">
          <motion.span
            className="block mb-4"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Folder size={40} className="mx-auto text-ink-300" />
          </motion.span>
          <p className="text-sm text-ink-500 font-serif mb-1">题库为空</p>
          <p className="text-xs text-ink-400 font-sans">请先上传题库资料，或点击「新增题目」手动添加</p>
        </PaperCard>
      ) : (
        /* 按日期分组的题库套列表 */
        <div className="space-y-6">
          {setsByDate.map(([dateLabel, sets]) => (
            <div key={dateLabel}>
              {/* 日期标题 */}
              <div className="flex items-center gap-2 mb-2.5 sticky top-0 z-10 bg-paper-50/95 py-1">
                <div className="flex-1 h-px bg-ink-600/10" />
                <span className="text-xs font-sans text-ink-500 px-2">{dateLabel}</span>
                <div className="flex-1 h-px bg-ink-600/10" />
              </div>

              {/* 该日期下的每套题库 */}
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                {sets.map((set, idx) => {
                  const isExpanded = expandedSets.has(set.material.id);
                  const filteredQs = getFilteredQuestions(set);
                  const allSelectedInSet = batchMode && set.questions.length > 0 &&
                    set.questions.every((q) => selectedIds.has(q.id));
                  return (
                    <motion.div
                      key={set.material.id}
                      layout
                      initial={{ opacity: 0, y: -40, rotate: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                    >
                    <PaperCard status="default" className="overflow-hidden">
                      {/* 套标题栏 */}
                      <div className="p-3.5 flex items-center gap-3">
                        {/* 展开/折叠按钮 */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(set.material.id)}
                          aria-label={isExpanded ? '折叠题库' : '展开题库'}
                          className="w-6 h-6 rounded-[3px] hover:bg-paper-200 flex items-center justify-center text-ink-600 flex-shrink-0"
                        >
                          {isExpanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                        </button>

                        {/* 批量模式下的全选 checkbox */}
                        {batchMode && (
                          <button
                            type="button"
                            onClick={() => toggleSelectAllInSet(set)}
                            aria-label="全选/取消全选"
                            className="w-5 h-5 flex-shrink-0 text-ink-600"
                          >
                            {allSelectedInSet ? <CheckSquare size={18} className="text-seal" aria-hidden="true" /> : <Square size={18} aria-hidden="true" />}
                          </button>
                        )}

                        <FileText size={16} className="text-ink-500 flex-shrink-0" aria-hidden="true" />

                        {/* 标题（可重命名） */}
                        <div className="flex-1 min-w-0">
                          {renameId === set.material.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setRenameId(null); }}
                                aria-label="题库名称"
                                placeholder="输入题库名称"
                                autoFocus
                                className="flex-1 px-2 py-1 text-sm font-serif rounded-[3px] border border-seal/40 bg-paper-100 text-ink-900 focus:outline-none"
                              />
                              <button onClick={handleConfirmRename} aria-label="确认重命名" className="text-sage-dark hover:bg-sage/10 w-7 h-7 rounded flex items-center justify-center">
                                <Save size={14} aria-hidden="true" />
                              </button>
                              <button onClick={() => setRenameId(null)} aria-label="取消重命名" className="text-ink-500 hover:bg-paper-200 w-7 h-7 rounded flex items-center justify-center">
                                <X size={14} aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif text-sm font-bold text-ink-900 truncate">{set.material.name}</span>
                              <VintageTag color="ink">{set.questions.length} 题</VintageTag>
                              <span className="text-[10px] text-ink-500 font-sans">{getTypeDist(set.questions)}</span>
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!batchMode && set.material.id !== '__orphan__' && (
                            <button
                              type="button"
                              onClick={() => handleStartRename(set.material)}
                              title="重命名"
                              aria-label="重命名题库"
                              className="w-7 h-7 rounded-[3px] hover:bg-paper-200 text-ink-500 hover:text-ink-800 flex items-center justify-center"
                            >
                              <Edit3 size={13} aria-hidden="true" />
                            </button>
                          )}
                          {!batchMode && (
                            <button
                              type="button"
                              onClick={() => setPendingDelete({ type: 'set', id: set.material.id, name: set.material.name })}
                              title={set.material.id === '__orphan__' ? '清空未分类题目' : '删除整套'}
                              aria-label="删除整套题库"
                              className="w-7 h-7 rounded-[3px] hover:bg-terracotta/10 text-terracotta-dark flex items-center justify-center"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 展开后的题目列表 */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-ink-600/10"
                          >
                            {filteredQs.length === 0 ? (
                              <p className="text-xs text-ink-400 font-serif py-4 text-center">
                                {searchKeyword ? '无匹配题目' : '该题库暂无题目'}
                              </p>
                            ) : (
                              <div className="divide-y divide-ink-600/5">
                                {filteredQs.map((q, idx) => {
                                  const isSelected = selectedIds.has(q.id);
                                  return (
                                    <motion.div
                                      key={q.id}
                                      whileHover={{ y: -1, borderColor: 'rgba(139,37,0,0.2)' }}
                                      className={cn(
                                        'px-3.5 py-2.5 flex items-start gap-2.5 transition-colors',
                                        isSelected && 'bg-seal/5',
                                      )}
                                    >
                                      {/* 批量模式 checkbox */}
                                      {batchMode && (
                                        <button
                                          type="button"
                                          onClick={() => toggleSelect(q.id)}
                                          aria-label="勾选题目"
                                          className="w-5 h-5 flex-shrink-0 mt-0.5 text-ink-600"
                                        >
                                          {isSelected ? <CheckSquare size={16} className="text-seal" aria-hidden="true" /> : <Square size={16} aria-hidden="true" />}
                                        </button>
                                      )}

                                      <div className="flex-1 min-w-0">
                                        {/* 标签行 */}
                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                          <span className="text-[10px] text-ink-400 font-sans">#{idx + 1}</span>
                                          <VintageTag color="ink">{QTYPE_LABEL[q.type]}</VintageTag>
                                          <VintageTag color={q.difficulty >= 4 ? 'seal' : q.difficulty <= 2 ? 'green' : 'gold'}>
                                            {q.difficulty}/5
                                          </VintageTag>
                                          {q.aiFilled && <VintageTag color="worn">AI补答</VintageTag>}
                                        </div>
                                        {/* 题干 */}
                                        <p className="font-serif text-sm text-ink-900 leading-relaxed mb-1 whitespace-pre-wrap line-clamp-2">
                                          {q.stem}
                                        </p>
                                        {/* 答案 */}
                                        <p className="text-xs font-serif">
                                          <span className="text-ink-500">答案：</span>
                                          <span className="text-sage-dark font-bold">{q.answer || '（空）'}</span>
                                        </p>
                                      </div>

                                      {/* 单题操作（非批量模式） */}
                                      {!batchMode && (
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(q)}
                                            aria-label="编辑题目"
                                            className="w-7 h-7 rounded-[3px] border border-ink-600/10 bg-paper-100 text-ink-500 hover:text-ink-800 hover:bg-paper-200 flex items-center justify-center"
                                          >
                                            <Pencil size={12} aria-hidden="true" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPendingDelete({ type: 'question', id: q.id })}
                                            aria-label="删除题目"
                                            className="w-7 h-7 rounded-[3px] border border-terracotta/20 bg-paper-100 text-terracotta-dark hover:bg-terracotta/10 flex items-center justify-center"
                                          >
                                            <Trash2 size={12} aria-hidden="true" />
                                          </button>
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            )}
                            {/* 套内新增题目按钮 */}
                            {!batchMode && (
                              <div className="p-2.5 border-t border-ink-600/5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdd(set.material.id)}
                                  className="w-full py-1.5 rounded-[3px] border border-dashed border-ink-600/20 text-xs font-serif text-ink-500 hover:border-seal/40 hover:text-seal transition-colors flex items-center justify-center gap-1"
                                >
                                  <Plus size={12} /> 在此题库新增题目
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </PaperCard>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑/新增弹层 */}
      <AnimatePresence>
        {editForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditForm(null)}
          >
            <motion.div
              className="bg-paper-50 rounded-paper border border-ink-600/20 shadow-paper-hover max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-paper-50 border-b border-ink-600/10 px-5 py-3 flex items-center justify-between">
                <h3 className="font-serif text-base text-ink-900 font-bold">
                  {editForm.id ? '编辑题目' : '新增题目'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditForm(null)}
                  aria-label="关闭"
                  className="w-7 h-7 rounded-full hover:bg-paper-200 flex items-center justify-center text-ink-500"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="qb-edit-material" className="block text-xs font-serif text-ink-600 mb-1">所属题库</label>
                  <select
                    id="qb-edit-material"
                    value={editForm.materialId}
                    onChange={(e) => setEditForm({ ...editForm, materialId: e.target.value })}
                    aria-label="所属题库"
                    className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                  >
                    <option value="">请选择题库…</option>
                    {questionSets.filter((s) => s.material.id !== '__orphan__').map((s) => (
                      <option key={s.material.id} value={s.material.id}>{s.material.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="qb-edit-type" className="block text-xs font-serif text-ink-600 mb-1">题型</label>
                    <select
                      id="qb-edit-type"
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Question['type'] })}
                      aria-label="题型"
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                    >
                      {QTYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="qb-edit-difficulty" className="block text-xs font-serif text-ink-600 mb-1">难度（1-5）</label>
                    <select
                      id="qb-edit-difficulty"
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: Number(e.target.value) as Question['difficulty'] })}
                      aria-label="难度"
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="qb-edit-stem" className="block text-xs font-serif text-ink-600 mb-1">题干</label>
                  <textarea
                    id="qb-edit-stem"
                    value={editForm.stem}
                    onChange={(e) => setEditForm({ ...editForm, stem: e.target.value })}
                    rows={3}
                    aria-label="题干"
                    placeholder="输入题干内容，填空题用 ______ 表示空格"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                  />
                </div>

                {editForm.type === 'choice' && (
                  <div>
                    <label htmlFor="qb-edit-options" className="block text-xs font-serif text-ink-600 mb-1">
                      选项（每行一个，形如 "A. 选项内容"）
                    </label>
                    <textarea
                      id="qb-edit-options"
                      value={editForm.optionsText}
                      onChange={(e) => setEditForm({ ...editForm, optionsText: e.target.value })}
                      rows={4}
                      aria-label="选项"
                      placeholder={'A. 选项一\nB. 选项二\nC. 选项三\nD. 选项四'}
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="qb-edit-answer" className="block text-xs font-serif text-ink-600 mb-1">
                    答案{editForm.type === 'choice' ? '（填字母如 B）' : ''}
                  </label>
                  <input
                    id="qb-edit-answer"
                    type="text"
                    value={editForm.answer}
                    onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                    aria-label="答案"
                    placeholder="输入正确答案"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50"
                  />
                </div>

                <div>
                  <label htmlFor="qb-edit-explanation" className="block text-xs font-serif text-ink-600 mb-1">解析（可选）</label>
                  <textarea
                    id="qb-edit-explanation"
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    rows={2}
                    aria-label="解析"
                    placeholder="输入解析内容"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-paper-50 border-t border-ink-600/10 px-5 py-3 flex items-center justify-end gap-2">
                <VintageButton variant="ghost" size="sm" onClick={() => setEditForm(null)}>取消</VintageButton>
                <VintageButton variant="primary" size="sm" onClick={handleSave}>
                  <Save size={14} className="mr-1" aria-hidden="true" /> 保存
                </VintageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认 */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPendingDelete(null)}
          >
            <motion.div
              className="bg-paper-50 rounded-paper border border-ink-600/20 shadow-paper-hover max-w-sm w-full p-5"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-sm text-ink-900 mb-4">
                {pendingDelete.type === 'set' && (
                  <>确定删除题库「<span className="font-bold">{pendingDelete.name}</span>」及其所有题目？此操作不可撤销。</>
                )}
                {pendingDelete.type === 'question' && '确定删除该题目？此操作不可撤销。'}
                {pendingDelete.type === 'batch' && (
                  <>确定批量删除选中的 <span className="font-bold text-seal">{selectedIds.size}</span> 道题目？此操作不可撤销。</>
                )}
              </p>
              <div className="flex items-center justify-end gap-2">
                <VintageButton variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>取消</VintageButton>
                <VintageButton
                  variant="primary"
                  size="sm"
                  className="bg-terracotta hover:bg-terracotta-dark border-terracotta-dark"
                  onClick={handleConfirmDelete}
                >
                  <Trash2 size={14} className="mr-1" aria-hidden="true" /> 删除
                </VintageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
