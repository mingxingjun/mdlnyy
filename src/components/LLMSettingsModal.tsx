import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import { useAppStore } from '@/store/useAppStore';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LLMSettingsModal({ isOpen, onClose }: LLMSettingsModalProps) {
  const { llmConfig, setLLMConfig } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (llmConfig) {
        setApiKey(llmConfig.apiKey);
        setBaseUrl(llmConfig.baseUrl);
        setModel(llmConfig.model);
      } else {
        setApiKey('');
        setBaseUrl('https://api.openai.com/v1');
        setModel('gpt-4o-mini');
      }
      setError('');
      setShowKey(false);
    }
  }, [isOpen, llmConfig]);

  const handleSave = () => {
    if (!apiKey || apiKey.trim().length < 10) {
      setError('API Key至少需要10个字符');
      return;
    }
    setLLMConfig({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || 'https://api.openai.com/v1',
      model: model.trim() || 'gpt-4o-mini',
    });
    onClose();
  };

  const handleClear = () => {
    setLLMConfig(null);
    setApiKey('');
    setBaseUrl('https://api.openai.com/v1');
    setModel('gpt-4o-mini');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(61,43,31,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <PaperCard status="active" className="overflow-hidden">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-ink-800 font-semibold flex items-center gap-2">
                  <span>⚙️</span>
                  <span>AI出题设置</span>
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-paper-200 transition-colors font-serif text-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-serif text-sm text-ink-700 mb-1.5">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                      placeholder="sk-..."
                      className="w-full px-3 py-2.5 pr-12 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-500 hover:text-ink-700 text-sm"
                    >
                      {showKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-serif text-sm text-ink-700 mb-1.5">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
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
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="w-full px-3 py-2.5 font-serif text-sm bg-paper-50 border border-ink-600/20 rounded-[3px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-seal/50 focus:ring-1 focus:ring-seal/20 transition-colors"
                  />
                </div>

                {error && (
                  <p className="font-serif text-xs text-red-600">{error}</p>
                )}

                <div className="bg-paper-100/60 border border-ink-600/10 rounded-[3px] p-3 mt-2">
                  <p className="font-serif text-xs text-ink-600 leading-relaxed">
                    💡 你的API Key仅保存在本地浏览器中，不会上传到任何服务器。
                  </p>
                  <p className="font-serif text-xs text-ink-600 leading-relaxed mt-1.5">
                    🔌 支持任何OpenAI兼容API（OpenAI / DeepSeek / 通义千问 / 智谱等）。
                  </p>
                  <p className="font-serif text-xs text-ink-500 leading-relaxed mt-1.5">
                    📝 没有API Key也可以使用内置演示题目。
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-600/10">
                <VintageButton
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={!llmConfig}
                >
                  清除配置
                </VintageButton>
                <div className="flex items-center gap-2">
                  <VintageButton variant="ghost" size="md" onClick={onClose}>
                    取消
                  </VintageButton>
                  <VintageButton variant="primary" size="md" onClick={handleSave}>
                    保存
                  </VintageButton>
                </div>
              </div>
            </div>
          </PaperCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
