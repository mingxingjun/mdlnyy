import { useEffect, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaperCard from './PaperCard';
import VintageButton from './VintageButton';
import { loadModelSettings, saveModelSettings } from '@/lib/models/api';
import type { ModelConfig, ModelProvider, ModelSettings } from '@/lib/models/types';
import { DEFAULT_PROVIDERS } from '@/lib/models/types';
import { useToastStore } from './Toast';

interface ModelSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  deepseek: 'DeepSeek',
  ollama: 'Ollama本地',
  openai: 'OpenAI兼容',
  custom: '自定义',
};

const PROVIDER_KEYS = Object.keys(DEFAULT_PROVIDERS) as ModelProvider[];

const EMPTY_SHOW: Record<ModelProvider, boolean> = {
  deepseek: false,
  ollama: false,
  openai: false,
  custom: false,
};

const inputClass =
  'w-full bg-paper-50 border border-ink-600/20 rounded-[3px] px-3 py-2 text-sm text-ink-800 font-sans placeholder-ink-300/60 focus:outline-none focus:border-seal/40 focus:ring-1 focus:ring-seal/20 transition-colors';

export default function ModelSettingsModal({ open, onClose }: ModelSettingsModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [settings, setSettings] = useState<ModelSettings>(loadModelSettings);
  const [showKeys, setShowKeys] = useState<Record<ModelProvider, boolean>>(EMPTY_SHOW);

  // Reload fresh settings each time the modal opens (in case localStorage changed elsewhere)
  useEffect(() => {
    if (open) {
      setSettings(loadModelSettings());
      setShowKeys(EMPTY_SHOW);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const updateProvider = (
    provider: ModelProvider,
    field: keyof ModelConfig,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], [field]: value },
      },
    }));
  };

  const setActive = (provider: ModelProvider) => {
    setSettings((prev) => ({ ...prev, activeProvider: provider }));
  };

  const toggleShowKey = (provider: ModelProvider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = () => {
    saveModelSettings(settings);
    addToast('success', '配置已保存');
    onClose();
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto"
          style={{ background: 'rgba(92,64,51,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="w-full max-w-2xl my-4"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <PaperCard className="p-6 md:p-8" rotation={0}>
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="font-serif text-2xl text-ink-900 font-bold leading-tight">AI 模型配置</h2>
                  <p className="font-serif text-sm text-ink-500 mt-1">选择当前使用的模型服务并填写凭据</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ink-500 hover:text-ink-800 text-xl leading-none px-2 -mt-1 transition-colors"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>

              {/* Active provider selector */}
              <h3 className="font-serif text-base text-ink-800 font-semibold mb-3 mt-6">当前服务</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {PROVIDER_KEYS.map((key) => {
                  const isActive = settings.activeProvider === key;
                  const config = settings.providers[key];
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setActive(key)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative px-3 py-3 rounded-[3px] border text-left transition-colors ${
                        isActive
                          ? 'bg-paper-50 border-seal/50 shadow-paper'
                          : 'bg-paper-200/50 border-ink-600/15 hover:bg-paper-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'border-seal' : 'border-ink-600/30'
                          }`}
                        >
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-seal" />}
                        </span>
                        <span className="font-serif text-sm text-ink-800 font-medium leading-tight">
                          {PROVIDER_LABELS[key]}
                        </span>
                      </div>
                      <p className="text-[10px] font-serif text-ink-500 mt-1.5 truncate">
                        {config.model || '未设置'}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Per-provider configs */}
              <div className="space-y-4">
                {PROVIDER_KEYS.map((key) => {
                  const config = settings.providers[key];
                  return (
                    <div
                      key={key}
                      className="bg-paper-100/60 border border-ink-600/15 rounded-[3px] p-4"
                    >
                      {/* Header row: name + enabled toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              config.enabled ? 'bg-sage' : 'bg-ink-400/50'
                            }`}
                          />
                          <h4 className="font-serif text-sm text-ink-800 font-semibold">
                            {PROVIDER_LABELS[key]}
                          </h4>
                          {settings.activeProvider === key && (
                            <span className="text-[10px] font-serif text-seal border border-seal/30 bg-seal/5 rounded-[2px] px-1.5 py-0.5">
                              当前
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-serif text-ink-500">启用</span>
                          <button
                            type="button"
                            onClick={() => updateProvider(key, 'enabled', !config.enabled)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              config.enabled ? 'bg-seal/70' : 'bg-ink-600/20'
                            }`}
                            aria-label={`${PROVIDER_LABELS[key]} 启用开关`}
                          >
                            <motion.span
                              className="absolute top-0.5 w-4 h-4 rounded-full bg-paper-50 shadow-sm"
                              animate={{ x: config.enabled ? 20 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Model name */}
                      <div className="mb-3">
                        <label className="block text-xs font-serif text-ink-600 mb-1">模型名称</label>
                        <input
                          type="text"
                          value={config.model}
                          onChange={(e) => updateProvider(key, 'model', e.target.value)}
                          placeholder="模型名称"
                          className={inputClass}
                        />
                      </div>

                      {/* Base URL */}
                      <div className="mb-3">
                        <label className="block text-xs font-serif text-ink-600 mb-1">Base URL</label>
                        <input
                          type="text"
                          value={config.baseUrl}
                          onChange={(e) => updateProvider(key, 'baseUrl', e.target.value)}
                          placeholder="API 端点地址"
                          className={inputClass}
                        />
                      </div>

                      {/* API Key with show/hide */}
                      <div>
                        <label className="block text-xs font-serif text-ink-600 mb-1">API Key</label>
                        <div className="relative">
                          <input
                            type={showKeys[key] ? 'text' : 'password'}
                            value={config.apiKey}
                            onChange={(e) => updateProvider(key, 'apiKey', e.target.value)}
                            placeholder="输入 API Key"
                            className={`${inputClass} pr-14`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(key)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-serif text-ink-500 hover:text-ink-800 px-1 transition-colors"
                          >
                            {showKeys[key] ? '隐藏' : '显示'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-ink-600/15">
                <VintageButton variant="ghost" onClick={onClose}>
                  关闭
                </VintageButton>
                <VintageButton variant="primary" onClick={handleSave}>
                  保存配置
                </VintageButton>
              </div>
            </PaperCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
