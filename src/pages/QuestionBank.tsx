import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Search, FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Question } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { cn } from '@/lib/utils';
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

/** 编辑表单的临时结构（与 Question 的区别：options 用换行字符串便于编辑） */
interface EditForm {
  id?: string; // 存在 = 编辑模式，undefined = 新增模式
  type: Question['type'];
  difficulty: Question['difficulty'];
  stem: string;
  optionsText: string; // 每行一个选项
  answer: string;
  explanation: string;
  materialId: string; // 关联的文件
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

/* ═══════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════ */

export default function QuestionBank() {
  const questions = useAppStore((s) => s.questions);
  const materials = useAppStore((s) => s.materials);
  const addQuestion = useAppStore((s) => s.addQuestion);
  const updateQuestion = useAppStore((s) => s.updateQuestion);
  const deleteQuestion = useAppStore((s) => s.deleteQuestion);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { addToast } = useToastStore();

  /** 当前选中的文件筛选（'all' = 全部） */
  const [filterMaterialId, setFilterMaterialId] = useState<string>('all');
  /** 题型筛选（'all' = 全部） */
  const [filterType, setFilterType] = useState<string>('all');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');
  /** 编辑/新增表单状态（null = 不显示表单） */
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  /** 待删除确认的题目 id */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // 题库题所在的文件列表（按上传时间排序）
  const bankMaterials = useMemo(() => {
    const ids = new Set(questions.map((q) => q.materialId).filter(Boolean));
    return materials.filter((m) => ids.has(m.id));
  }, [questions, materials]);

  // 过滤后的题目
  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (filterMaterialId !== 'all') {
      list = list.filter((q) => q.materialId === filterMaterialId);
    }
    if (filterType !== 'all') {
      list = list.filter((q) => q.type === filterType);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.stem.toLowerCase().includes(kw) ||
          q.answer.toLowerCase().includes(kw) ||
          (q.explanation || '').toLowerCase().includes(kw),
      );
    }
    // 按创建时间倒序
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [questions, filterMaterialId, filterType, searchKeyword]);

  // 按文件分组统计题数
  const countByMaterial = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q) => {
      map.set(q.materialId, (map.get(q.materialId) || 0) + 1);
    });
    return map;
  }, [questions]);

  const handleOpenAdd = () => {
    // 默认关联当前筛选的文件（若选中了具体文件）
    setEditForm({
      ...EMPTY_FORM,
      materialId: filterMaterialId !== 'all' ? filterMaterialId : (bankMaterials[0]?.id ?? ''),
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
      addToast('warning', '请选择所属文件');
      return;
    }
    const options = editForm.type === 'choice'
      ? editForm.optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (editForm.id) {
      // 编辑模式
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
      // 新增模式
      const newQ: Question = {
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
      };
      addQuestion(newQ);
      addToast('success', '题目已添加');
    }
    setEditForm(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteQuestion(pendingDeleteId);
    setPendingDeleteId(null);
    addToast('success', '题目已删除');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* 页头 */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            title="返回首页"
            className="inline-flex items-center justify-center w-9 h-9 rounded-paper border border-ink-600/20 bg-paper-100 text-ink-700 hover:bg-paper-200 hover:text-seal transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-handwritten text-sm text-ink-500 leading-none">题库管理</p>
            <h1 className="font-serif text-2xl text-ink-900 font-bold tracking-wide leading-tight">题库</h1>
          </div>
        </div>
        <VintageButton variant="primary" size="md" onClick={handleOpenAdd}>
          <Plus size={15} className="mr-1" /> 新增题目
        </VintageButton>
      </header>

      {/* 筛选区 */}
      <PaperCard status="default" className="p-4">
        <div className="space-y-3">
          {/* 文件筛选 */}
          <div>
            <p className="text-xs font-serif text-ink-500 mb-1.5">按文件筛选</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMaterialId('all')}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-xs font-serif border transition-colors',
                  filterMaterialId === 'all'
                    ? 'bg-seal text-paper-50 border-seal'
                    : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50',
                )}
              >
                全部 ({questions.length})
              </button>
              {bankMaterials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFilterMaterialId(m.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] text-xs font-serif border transition-colors max-w-[240px]',
                    filterMaterialId === m.id
                      ? 'bg-seal text-paper-50 border-seal'
                      : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-seal/50',
                  )}
                  title={m.name}
                >
                  <FileText size={11} className="flex-shrink-0" />
                  <span className="truncate">{m.name}</span>
                  <span className="opacity-70 flex-shrink-0">({countByMaterial.get(m.id) || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 题型 + 搜索 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-serif text-ink-500">题型</span>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-serif border transition-colors',
                  filterType === 'all'
                    ? 'bg-ink-700 text-paper-50 border-ink-700'
                    : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-ink-700/50',
                )}
              >
                全部
              </button>
              {QTYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterType(opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-[3px] text-xs font-serif border transition-colors',
                    filterType === opt.value
                      ? 'bg-ink-700 text-paper-50 border-ink-700'
                      : 'bg-paper-100 text-ink-700 border-ink-600/15 hover:border-ink-700/50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索题干/答案/解析"
                className="w-full pl-8 pr-3 py-1.5 text-xs font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50"
              />
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 题目列表 */}
      {filteredQuestions.length === 0 ? (
        <PaperCard status="default" className="p-8 text-center">
          <p className="text-sm text-ink-500 font-serif">
            {questions.length === 0
              ? '题库为空，请先上传题库资料或点击「新增题目」'
              : '当前筛选条件下无题目'}
          </p>
        </PaperCard>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredQuestions.map((q, idx) => {
              const material = materials.find((m) => m.id === q.materialId);
              return (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                >
                  <PaperCard status="default" className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* 标签行 */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <VintageTag color="ink">{QTYPE_LABEL[q.type]}</VintageTag>
                          <VintageTag color={q.difficulty >= 4 ? 'seal' : q.difficulty <= 2 ? 'green' : 'gold'}>
                            难度 {q.difficulty}/5
                          </VintageTag>
                          {q.source === 'bank' && (
                            <VintageTag color={q.aiFilled ? 'worn' : 'seal'}>
                              {q.aiFilled ? 'AI补答' : '原题'}
                            </VintageTag>
                          )}
                          {material && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-ink-500 font-sans">
                              <FileText size={10} />
                              <span className="truncate max-w-[200px]">{material.name}</span>
                            </span>
                          )}
                        </div>
                        {/* 题干 */}
                        <p className="font-serif text-sm text-ink-900 leading-relaxed mb-2 whitespace-pre-wrap line-clamp-3">
                          {q.stem}
                        </p>
                        {/* 选项 */}
                        {q.options && q.options.length > 0 && (
                          <ul className="text-xs text-ink-600 font-sans space-y-0.5 mb-2">
                            {q.options.map((opt, i) => (
                              <li key={i} className="truncate">{opt}</li>
                            ))}
                          </ul>
                        )}
                        {/* 答案 */}
                        <div className="text-xs font-serif space-y-0.5">
                          <p><span className="text-ink-500">答案：</span><span className="text-sage-dark font-bold">{q.answer || '（空）'}</span></p>
                          {q.explanation && (
                            <p className="text-ink-600 line-clamp-2"><span className="text-ink-500">解析：</span>{q.explanation}</p>
                          )}
                        </div>
                      </div>
                      {/* 操作按钮 */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          title="编辑"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-600 hover:bg-paper-200 hover:text-ink-900 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(q.id)}
                          title="删除"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-terracotta/30 bg-paper-100 text-terracotta-dark hover:bg-terracotta/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </PaperCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
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
                  className="w-7 h-7 rounded-full hover:bg-paper-200 flex items-center justify-center text-ink-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* 所属文件 */}
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">所属文件</label>
                  <select
                    value={editForm.materialId}
                    onChange={(e) => setEditForm({ ...editForm, materialId: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                  >
                    <option value="">请选择文件…</option>
                    {bankMaterials.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* 题型 + 难度 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-serif text-ink-600 mb-1">题型</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Question['type'] })}
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                    >
                      {QTYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-serif text-ink-600 mb-1">难度（1-5）</label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: Number(e.target.value) as Question['difficulty'] })}
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 focus:outline-none focus:border-seal/50"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 题干 */}
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">题干</label>
                  <textarea
                    value={editForm.stem}
                    onChange={(e) => setEditForm({ ...editForm, stem: e.target.value })}
                    rows={3}
                    placeholder="输入题干内容，填空题用 ______ 表示空格"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                  />
                </div>

                {/* 选项（仅选择题） */}
                {editForm.type === 'choice' && (
                  <div>
                    <label className="block text-xs font-serif text-ink-600 mb-1">
                      选项（每行一个，形如 "A. 选项内容"）
                    </label>
                    <textarea
                      value={editForm.optionsText}
                      onChange={(e) => setEditForm({ ...editForm, optionsText: e.target.value })}
                      rows={4}
                      placeholder={'A. 选项一\nB. 选项二\nC. 选项三\nD. 选项四'}
                      className="w-full px-3 py-2 text-sm font-sans rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                    />
                  </div>
                )}

                {/* 答案 */}
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">
                    答案{editForm.type === 'choice' ? '（填字母如 B）' : ''}
                  </label>
                  <input
                    type="text"
                    value={editForm.answer}
                    onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                    placeholder="输入正确答案"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50"
                  />
                </div>

                {/* 解析 */}
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">解析（可选）</label>
                  <textarea
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    rows={2}
                    placeholder="输入解析内容"
                    className="w-full px-3 py-2 text-sm font-serif rounded-[3px] border border-ink-600/15 bg-paper-100 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 resize-y"
                  />
                </div>
              </div>

              {/* 操作栏 */}
              <div className="sticky bottom-0 bg-paper-50 border-t border-ink-600/10 px-5 py-3 flex items-center justify-end gap-2">
                <VintageButton variant="ghost" size="sm" onClick={() => setEditForm(null)}>
                  取消
                </VintageButton>
                <VintageButton variant="primary" size="sm" onClick={handleSave}>
                  <Save size={14} className="mr-1" /> 保存
                </VintageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认 */}
      <AnimatePresence>
        {pendingDeleteId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPendingDeleteId(null)}
          >
            <motion.div
              className="bg-paper-50 rounded-paper border border-ink-600/20 shadow-paper-hover max-w-sm w-full p-5"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-sm text-ink-900 mb-4">确定删除该题目？此操作不可撤销。</p>
              <div className="flex items-center justify-end gap-2">
                <VintageButton variant="ghost" size="sm" onClick={() => setPendingDeleteId(null)}>
                  取消
                </VintageButton>
                <VintageButton
                  variant="primary"
                  size="sm"
                  className="bg-terracotta hover:bg-terracotta-dark border-terracotta-dark"
                  onClick={handleConfirmDelete}
                >
                  <Trash2 size={14} className="mr-1" /> 删除
                </VintageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
