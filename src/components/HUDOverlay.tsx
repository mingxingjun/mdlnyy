import { ReactNode, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Brain, NotebookPen, Headphones, Cpu, Settings, Sparkles, ChevronRight, Signal } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { loadModelSettings } from '@/lib/models/api';
import { useNavigate } from 'react-router-dom';

const planetInfo: Record<string, { title: string; subtitle: string; color: string; icon: any; shortName: string }> = {
  '/dashboard': { title: '学习驾驶舱', subtitle: '你的知识宇宙控制台', color: '#00c8ff', icon: Rocket, shortName: '驾驶舱' },
  '/ai-engine': { title: 'AI 冲刺核', subtitle: '5 Agent 协同作战', color: '#b040ff', icon: Brain, shortName: 'AI核' },
  '/my-notes': { title: '知识星图', subtitle: '上传 · 整理 · 连接知识点', color: '#44ddaa', icon: NotebookPen, shortName: '知识' },
  '/flow-chamber': { title: '沉浸流空间', subtitle: '番茄钟 · 白噪音 · 深度专注', color: '#ff8800', icon: Headphones, shortName: '专注' },
};

const allPlanetPaths = ['/dashboard', '/ai-engine', '/my-notes', '/flow-chamber'];

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
  const navigate = useNavigate();
  const modelSettings = useMemo(() => loadModelSettings(), []);

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
      onClick={() => navigate('/ai-engine?tab=settings')}
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

function PlanetViewHUD({ currentPlanet }: { currentPlanet: string }) {
  const returnToGalaxy = useNavigationStore((s) => s.returnToGalaxy);
  const warpTo = useNavigationStore((s) => s.warpTo);
  const info = planetInfo[currentPlanet];

  const otherPlanets = allPlanetPaths.filter(p => p !== currentPlanet);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        returnToGalaxy(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnToGalaxy]);

  return (
    <>
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="fixed top-4 left-4 z-20 pointer-events-auto"
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(5, 12, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 0 20px ${info.color}30, 0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #635BFF 0%, #00D4FF 100%)',
                boxShadow: '0 0 12px rgba(99,91,255,0.4)',
              }}
            >
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/60 font-semibold tracking-wider">HUD</span>
            <div className="flex items-center gap-1">
              <Signal size={8} style={{ color: '#00D924' }} />
              <span className="text-[9px] text-[#00D924] tracking-wide">信号正常</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="fixed top-4 right-4 z-20 pointer-events-auto flex items-start gap-3"
      >
        <div className="flex flex-col items-end">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              color: info.color,
              textShadow: `0 0 20px ${info.color}80, 0 0 40px ${info.color}40`,
            }}
          >
            {info.title}
          </h1>
          <p className="text-[12px] text-white/50 mt-0.5">{info.subtitle}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => returnToGalaxy(true)}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(5, 12, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${info.color}40`,
            boxShadow: `0 0 20px ${info.color}30, 0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          <X size={20} style={{ color: info.color }} />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 z-20 pointer-events-auto"
      >
        <div
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{
            background: 'rgba(5, 12, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
          }}
        >
          {otherPlanets.map((path) => {
            const planet = planetInfo[path];
            const PlanetIcon = planet.icon;
            return (
              <motion.button
                key={path}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => warpTo(path, true)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: `linear-gradient(135deg, ${planet.color}10, transparent)`,
                  border: `1px solid ${planet.color}30`,
                }}
              >
                <PlanetIcon size={18} style={{ color: planet.color, opacity: 0.7 }} />
                <span className="text-[9px] font-medium" style={{ color: planet.color, opacity: 0.6 }}>
                  {planet.shortName}
                </span>
              </motion.button>
            );
          })}
          <div
            className="w-px h-10 mx-1"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => returnToGalaxy(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <ChevronRight size={18} className="text-white/50 rotate-180" />
            <span className="text-[9px] text-white/40 font-medium">返回</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-20 pointer-events-auto"
      >
        <ModelStatusIndicator />
      </motion.div>
    </>
  );
}

function GalaxyViewHUD() {
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-4 left-4 z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="relative"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #635BFF 0%, #7C5CFF 50%, #00D4FF 100%)',
                boxShadow: '0 8px 32px rgba(99,91,255,0.4), 0 0 60px rgba(99,91,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Sparkles size={22} className="text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl -z-10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'linear-gradient(135deg, #635BFF, #00D4FF)', filter: 'blur(12px)' }}
            />
          </motion.div>
          <div className="flex flex-col">
            <span
              className="font-bold text-xl tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #ffffff, #a8b4ff, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              UniFlow
            </span>
            <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-medium">知识宇宙</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className="fixed top-4 right-4 z-20 pointer-events-auto"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 45 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/ai-engine?tab=settings')}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(5, 12, 25, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <Settings size={18} className="text-white/60" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-3 px-5 py-3 rounded-full"
          style={{
            background: 'rgba(5, 12, 25, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 40px rgba(99,91,255,0.2)',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: '#00D4FF', boxShadow: '0 0 10px #00D4FF' }}
          />
          <span className="text-[13px] text-white/70 tracking-wide">点击任意行星开始探索</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight size={14} className="text-white/40" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-20 pointer-events-auto"
      >
        <ModelStatusIndicator />
      </motion.div>
    </>
  );
}

export default function HUDOverlay({ children }: HUDOverlayProps) {
  const view = useNavigationStore((s) => s.view);
  const targetPlanet = useNavigationStore((s) => s.targetPlanet);

  const isPlanetView = view === 'planet' && targetPlanet && planetInfo[targetPlanet];
  const currentColor = isPlanetView ? planetInfo[targetPlanet!].color : '#635BFF';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <AnimatePresence mode="wait">
        {view === 'galaxy' && <GalaxyViewHUD key="galaxy" />}
        {isPlanetView && <PlanetViewHUD key="planet" currentPlanet={targetPlanet!} />}
      </AnimatePresence>

      <AnimatePresence>
        {isPlanetView && (
          <motion.div
            key="content-container"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-20 right-4 bottom-20 left-4 pointer-events-auto rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(5, 12, 25, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: `0 0 60px ${currentColor}20, 0 0 120px ${currentColor}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <CornerBracket color={currentColor} position="tl" />
            <CornerBracket color={currentColor} position="tr" />
            <CornerBracket color={currentColor} position="bl" />
            <CornerBracket color={currentColor} position="br" />

            <ScanLine color={currentColor} />

            <div className="w-full h-full overflow-auto p-6 lg:p-8">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
