import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import { useAppStore } from '@/store/useAppStore';
import type { ModelConfig } from '@/store/useAppStore';
import { PRESET_BASE_URLS } from '@/lib/llm';
import { cn } from '@/lib/utils';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PresetId = 'deepseek-single' | 'kimi-deepseek' | 'custom';

const PRESETS: { id: PresetId; label: string; desc: string; emoji: string }[] = [
  { id: 'deepseek-single', label: 'DeepSeek', desc: '单模型通用', emoji: '🧠' },
  { id: 'kimi-deepseek', label: 'Kimi + DeepSeek', desc: '双模型分工', emoji: '⚡' },
  { id: 'custom', label: '自定义', desc: '自由搭配', emoji: '🎛️' },
];

const ROLE_INFO = [
  { key: 'document', label: '文档解析', emoji: '📄', desc: '长文档理解、知识点提取' },
  { key: 'quiz', label: '出题生成', emoji: '🧠', desc: '逻辑推理、设计题目选项' },
  { key: 'explanation', label: '错题讲解', emoji: '💬', desc: '解析、举一反三（预留）' },
] as const;

export default function LLMSettingsModal({ isOpen, onClose }: LLMSettingsModalProps) {
  const { modelConfigs, modelRoles, addModelConfig, updateModelConfig, removeModelConfig, setModelRole, resetModelPreset } = useAppStore();
  const [activePreset, setActivePreset] = useState<PresetId>('custom');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', baseUrl: '', apiKey: '', model: '', enabled: true });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [presetId, setPresetId] = useState('deepseek');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ name: '', baseUrl: '', apiKey: '', model: '', enabled: true });
      setPresetId('deepseek');
      
      if (modelConfigs.length === 0) {
        setActivePreset('custom');
      } else if (modelConfigs.length === 1) {
        setActivePreset('deepseek-single');
      } else if (modelConfigs.length === 2) {
        setActivePreset('kimi-deepseek');
      } else {
        setActivePreset('custom');
      }
    }
  }, [isOpen, modelConfigs.length]);

  const enabledModels = useMemo(() => modelConfigs.filter(m => m.enabled && m.apiKey), [modelConfigs]);

  const handleSelectPreset = (preset: PresetId) => {
    setActivePreset(preset);
    if (preset !== 'custom') {
      resetModelPreset(preset);
    }
    setError('');
  };

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const preset = PRESET_BASE_URLS.find(p => p.id === id);
    if (preset && preset.id !== 'custom') {
      setFormData(prev => ({ ...prev, baseUrl: preset.baseUrl, model: preset.defaultModel }));
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ name: '', baseUrl: PRESET_BASE_URLS[0].baseUrl, apiKey: '', model: PRESET_BASE_URLS[0].defaultModel, enabled: true });
    setPresetId(PRESET_BASE_URLS[0].id);
    setError('');
  };

  const handleEdit = (m: ModelConfig) => {
    setShowAddForm(true);
    setEditingId(m.id);
    setFormData({ name: m.name, baseUrl: m.baseUrl, apiKey: m.apiKey, model: m.model, enabled: m.enabled });
    const matched = PRESET_BASE_URLS.find(p => p.baseUrl === m.baseUrl);
    setPresetId(matched?.id || 'custom');
    setError('');
  };

  const handleSaveModel = () => {
    if (!formData.name.trim()) {
      setError('请输入模型名称');
      return;
    }
    if (!formData.baseUrl.trim()) {
      setError('请输入 API Base URL');
      return;
    }
    if (!formData.model.trim()) {
      setError('请输入模型名称');
      return;
    }

    if (editingId) {
      updateModelConfig(editingId, formData);
    } else {
      const id = addModelConfig(formData);
      if (modelConfigs.length === 0) {
        setModelRole('document', id);
        setModelRole('quiz', id);
        setModelRole('explanation', id);
      }
    }
    setShowAddForm(false);
    setEditingId(null);
    setError('');
  };

  const handleRemove = (id: string) => {
    removeModelConfig(id);
  };

  const handleRoleChange = (role: keyof typeof modelRoles, modelId: string | null) => {
    setModelRole(role, modelId);
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto py-8"
        style={{ backgroundColor: 'rgba(61,43,31,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <PaperCard status="active" className="overflow-hidden">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-ink-800 font-semibold flex items-center gap-2">
                  <span>⚙️</span>
                  <span>AI模型设置</span>
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-paper-200 transition-colors font-serif text-lg"
                >
                  ×
                </button>
              </div>

              <div className="mb-5">
                <label className="block font-serif text-sm text-ink-700 mb-2">快速方案</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className={cn(
                        'p-3 rounded-[4px] border text-left transition-all font-serif',
                        activePreset === p.id
                          ? 'border-seal/50 bg-seal/5 shadow-sm'
                          : 'border-ink-600/15 bg-paper-50 hover:bg-paper-100'
                      )}
                    >
                      <div className="text-xl mb-1">{p.emoji}</div>
                      <div className="text-sm font-semibold text-ink-800">{p.label}</div>
                      <div className="text-[10px] text-ink-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-serif text-sm text-ink-700">已配置模型</label>
                  <button
                    onClick={handleAddNew}
                    className="text-xs font-serif text-seal hover:text-seal-dark underline underline-offset-2"
                  >
                    + 添加模型
                  </button>
                </div>

                <div className="space-y-2">
                  {modelConfigs.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-ink-600/15 rounded-[4px] bg-paper-50/50">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="font-serif text-sm text-ink-500">还没有配置模型</p>
                      <p className="font-serif text-xs text-ink-400 mt-1">点击上方"添加模型"或选择快速方案</p>
                    </div>
                  )}

                  {modelConfigs.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ rotate: (idx % 2 === 0 ? -0.3 : 0.3) }}
                      className={cn(
                        'p-3 rounded-[4px] border bg-paper-50',
                        m.enabled ? 'border-ink-600/15' : 'border-ink-600/10 opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-serif text-sm font-semibold text-ink-800 truncate">{m.name}</span>
                            {m.enabled && m.apiKey ? (
                              <VintageTag color="green" className="text-[10px]">已启用</VintageTag>
                            ) : m.apiKey ? (
                              <VintageTag color="worn" className="text-[10px]">已禁用</VintageTag>
                            ) : (
                              <VintageTag color="gold" className="text-[10px]">待填Key</VintageTag>
                            )}
                          </div>
                          <div className="font-serif text-[11px] text-ink-500 truncate">
                            {m.model} · {m.baseUrl.replace(/^https?:\/\//, '')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(m)}
                            className="px-2 py-1 text-[11px] font-serif text-ink-600 hover:text-ink-800 hover:bg-paper-200 rounded-[3px] transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="px-2 py-1 text-[11px] font-serif text-seal hover:bg-seal/10 rounded-[3px] transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block font-serif text-sm text-ink-700 mb-2">角色分配</label>
                <div className="space-y-2">
                  {ROLE_INFO.map((role) => {
                    const modelId = modelRoles[role.key as keyof typeof modelRoles];
                    const assignedModel = modelConfigs.find(m => m.id === modelId);
                    return (
                      <div
                        key={role.key}
                        className="p-3 rounded-[4px] border border-ink-600/15 bg-paper-50/80 flex items-center gap-3"
                      >
                        <div className="text-xl shrink-0">{role.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-sm font-semibold text-ink-800">{role.label}</div>
                          <div className="font-serif text-[11px] text-ink-500">{role.desc}</div>
                        </div>
                        <select
                          value={modelId || ''}
                          onChange={(e) => handleRoleChange(role.key as keyof typeof modelRoles, e.target.value || null)}
                          className="px-2 py-1.5 text-xs font-serif bg-paper-100 border border-ink-600/20 rounded-[3px] text-ink-800 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                          disabled={enabledModels.length === 0}
                        >
                          <option value="">-- 选择模型 --</option>
                          {modelConfigs.map(m => (
                            <option key={m.id} value={m.id} disabled={!m.enabled || !m.apiKey}>
                              {m.name} {(!m.enabled || !m.apiKey) ? '(不可用)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                {enabledModels.length > 0 && modelRoles.document !== modelRoles.quiz && (
                  <p className="mt-2 font-serif text-[11px] text-ink-500">
                    💡 双模式运行：文档解析用「{modelConfigs.find(m => m.id === modelRoles.document)?.name || '-'}」，出题用「{modelConfigs.find(m => m.id === modelRoles.quiz)?.name || '-'}」
                  </p>
                )}
                {enabledModels.length > 0 && modelRoles.document === modelRoles.quiz && modelRoles.document !== null && (
                  <p className="mt-2 font-serif text-[11px] text-ink-500">
                    ⚙️ 单模式运行：所有任务使用「{modelConfigs.find(m => m.id === modelRoles.document)?.name || '-'}」
                  </p>
                )}
              </div>

              <div className="bg-paper-100/60 border border-ink-600/10 rounded-[3px] p-3">
                <p className="font-serif text-xs text-ink-600 leading-relaxed">
                  💡 你的API Key仅保存在本地浏览器中，不会上传到任何服务器。
                </p>
                <p className="font-serif text-xs text-ink-600 leading-relaxed mt-1.5">
                  🔌 支持任何OpenAI兼容API（DeepSeek / Kimi / OpenAI / 通义千问 / 智谱等）。
                </p>
                <p className="font-serif text-xs text-ink-500 leading-relaxed mt-1.5">
                  📝 没有API Key也可以使用内置演示题目。
                </p>
              </div>

              {error && (
                <p className="font-serif text-xs text-seal mt-3">{error}</p>
              )}

              <div className="flex items-center justify-end mt-6 pt-4 border-t border-ink-600/10 gap-2">
                <VintageButton variant="ghost" size="md" onClick={onClose}>
                  完成
                </VintageButton>
              </div>
            </div>
          </PaperCard>
        </motion.div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(61,43,31,0.6)' }}
              onClick={() => setShowAddForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <PaperCard status="active" className="overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-serif text-lg text-ink-800 font-semibold mb-4 flex items-center gap-2">
                      <span>{editingId ? '✏️' : '➕'}</span>
                      <span>{editingId ? '编辑模型' : '添加模型'}</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-serif text-sm text-ink-700 mb-1.5">
                          模型显示名称
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="例如：我的DeepSeek"
                          className="w-full px-3 py-2.5 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block font-serif text-sm text-ink-700 mb-1.5">
                          API 服务商
                        </label>
                        <select
                          value={presetId}
                          onChange={(e) => handlePresetChange(e.target.value)}
                          className="w-full px-3 py-2.5 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                        >
                          {PRESET_BASE_URLS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-serif text-sm text-ink-700 mb-1.5">
                          API Base URL
                        </label>
                        <input
                          type="text"
                          value={formData.baseUrl}
                          onChange={(e) => { setFormData(prev => ({ ...prev, baseUrl: e.target.value })); setPresetId('custom'); }}
                          placeholder="https://api.openai.com/v1"
                          className="w-full px-3 py-2.5 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block font-serif text-sm text-ink-700 mb-1.5">
                          模型名称
                        </label>
                        <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                          placeholder="gpt-4o-mini / deepseek-chat / moonshot-v1-8k"
                          className="w-full px-3 py-2.5 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block font-serif text-sm text-ink-700 mb-1.5">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showKey['form'] ? 'text' : 'password'}
                            value={formData.apiKey}
                            onChange={(e) => { setFormData(prev => ({ ...prev, apiKey: e.target.value })); setError(''); }}
                            placeholder="sk-..."
                            className="w-full px-3 py-2.5 pr-12 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(prev => ({ ...prev, ['form']: !prev['form'] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-500 hover:text-ink-700 text-sm"
                          >
                            {showKey['form'] ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enabled-check"
                          checked={formData.enabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                          className="w-4 h-4 rounded border-ink-600/30 text-seal focus:ring-seal/30"
                        />
                        <label htmlFor="enabled-check" className="font-serif text-sm text-ink-700">
                          启用该模型
                        </label>
                      </div>

                      {error && (
                        <p className="font-serif text-xs text-seal">{error}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-600/10">
                      <VintageButton variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                        取消
                      </VintageButton>
                      <VintageButton variant="primary" size="md" onClick={handleSaveModel}>
                        {editingId ? '保存修改' : '添加模型'}
                      </VintageButton>
                    </div>
                  </div>
                </PaperCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
