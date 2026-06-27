import { ReactNode, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Sparkles, Signal } from 'lucide-react';
import { loadModelSettings } from '@/lib/models/api';
import { useAppStore } from '@/store/useAppStore';

interface HUDOverlayProps {
  children: ReactNode;
}

function CornerBracket({ color, position }: { color: string; position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const getPositionStyle = () => {
    switch (position) {
      case 'tl': return { top: -1, left: -1 };
      case 'tr': return { top: -1, right: -1 };
      case 'bl': return { bottom: -1, left: -1 };
      case 'br': return { bottom: -1, right: -1 };
    }
  };

  const getRotation = () => {
    switch (position) {
      case 'tl': return 0;
      case 'tr': return 90;
      case 'br': return 180;
      case 'bl': return 270;
    }
  };

  return (
    <div
      className="absolute w-6 h-6 pointer-events-none"
      style={{
        ...getPositionStyle(),
        transform: `rotate(${getRotation()}deg)`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <div
        className="absolute top-0 left-0 h-full w-[2px]"
        style={{
          background: `linear-gradient(180deg, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

function ScanLine({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[1px] pointer-events-none overflow-hidden"
      style={{ top: 0 }}
      initial={{ y: 0 }}
      animate={{ y: ['0%', '100%', '0%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}80, ${color}, ${color}80, transparent)`,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
        }}
      />
    </motion.div>
  );
}

function ModelStatusIndicator() {
  const setActiveView = useAppStore(s => s.setActiveView);
  const [modelSettings, setModelSettings] = useState(loadModelSettings);

  useEffect(() => {
    const refresh = () => setModelSettings(loadModelSettings());
    window.addEventListener('uniflow-model-settings-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('uniflow-model-settings-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const providerDisplay = useMemo(() => {
    switch (modelSettings.activeProvider) {
      case 'deepseek': return 'DeepSeek';
      case 'ollama': return '本地模型';
      case 'openai': return 'OpenAI';
      case 'custom': return '自定义';
      default: return 'DeepSeek';
    }
  }, [modelSettings.activeProvider]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveView('ai')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: 'rgba(5, 12, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="relative">
        <Cpu size={14} style={{ color: '#00D924', filter: 'drop-shadow(0 0 4px rgba(0,217,36,0.5))' }} />
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: '#00D924', filter: 'blur(4px)' }}
        />
      </div>
      <span className="text-[11px] text-white/80 font-medium">{providerDisplay}</span>
      <div className="relative flex h-2 w-2">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full"
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: '#00D924' }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: '#00D924', boxShadow: '0 0 8px #00D924' }}
        />
      </div>
    </motion.button>
  );
}

const ACCENT = '#00c8ff';

export default function HUDOverlay({ children }: HUDOverlayProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* 左上：品牌标识 */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-4 left-4 z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #635BFF 0%, #7C5CFF 50%, #00D4FF 100%)',
              boxShadow: '0 8px 32px rgba(99,91,255,0.4), 0 0 60px rgba(99,91,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Sparkles size={20} className="text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
          </div>
          <div className="flex flex-col">
            <span
              className="font-bold text-lg tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #ffffff, #a8b4ff, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              UniFlow
            </span>
            <div className="flex items-center gap-1">
              <Signal size={8} style={{ color: '#00D924' }} />
              <span className="text-[9px] text-[#00D924] tracking-wide">在线</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 右下：模型状态 */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-20 pointer-events-auto"
      >
        <ModelStatusIndicator />
      </motion.div>

      {/* 内容容器 */}
      <AnimatePresence>
        <motion.div
          key="content-container"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-20 right-4 bottom-4 left-4 pointer-events-auto rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(5, 12, 25, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 0 60px ${ACCENT}20, 0 0 120px ${ACCENT}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <CornerBracket color={ACCENT} position="tl" />
          <CornerBracket color={ACCENT} position="tr" />
          <CornerBracket color={ACCENT} position="bl" />
          <CornerBracket color={ACCENT} position="br" />
          <ScanLine color={ACCENT} />
          <div className="w-full h-full overflow-auto p-6 lg:p-8">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
