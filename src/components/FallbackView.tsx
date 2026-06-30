import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Brain, NotebookPen, Headphones, Sparkles, ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

const planets = [
  {
    path: '/dashboard',
    name: '驾驶舱星',
    description: '主控制台与导航中心',
    color: '#00c8ff',
    icon: Rocket,
  },
  {
    path: '/ai-engine',
    name: 'AI核星',
    description: 'AI智能核心引擎',
    color: '#b040ff',
    icon: Brain,
  },
  {
    path: '/flow-chamber',
    name: '专注星',
    description: '沉浸式专注工作区',
    color: '#ff8800',
    icon: Headphones,
  },
  {
    path: '/my-notes',
    name: '知识星',
    description: '知识库与学习资源',
    color: '#44ddaa',
    icon: NotebookPen,
  },
];

const planetPathMap: Record<string, typeof planets[0]> = {
  '/dashboard': planets[0],
  '/ai-engine': planets[1],
  '/flow-chamber': planets[2],
  '/my-notes': planets[3],
};

function StarFieldCSS() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%, #0a1830 0%, #030a18 45%, #010308 100%),
            radial-gradient(ellipse 70% 50% at 15% 35%, rgba(99, 91, 255, 0.15) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 85% 65%, rgba(0, 212, 255, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 50% 80%, rgba(176, 64, 255, 0.08) 0%, transparent 50%)
          `
        }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent),
          radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 230px 80px, #fff, transparent),
          radial-gradient(2px 2px at 300px 150px, rgba(168,180,255,0.9), transparent),
          radial-gradient(1.5px 1.5px at 350px 60px, rgba(255,215,0,0.8), transparent),
          radial-gradient(1px 1px at 420px 180px, #fff, transparent)
        `,
        backgroundSize: '400px 250px',
        animation: 'twinkle 8s ease-in-out infinite',
      }} />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(1px 1px at 50px 100px, rgba(255,255,255,0.6), transparent),
          radial-gradient(1.5px 1.5px at 180px 50px, rgba(200,220,255,0.7), transparent),
          radial-gradient(1px 1px at 280px 200px, rgba(255,255,255,0.5), transparent),
          radial-gradient(2px 2px at 380px 130px, rgba(255,200,100,0.6), transparent)
        `,
        backgroundSize: '500px 300px',
        animation: 'twinkle 10s ease-in-out infinite reverse',
        opacity: 0.7,
      }} />
    </>
  );
}

interface GalaxyFallbackProps {
  onNavigate: (path: string) => void;
}

function GalaxyFallback({ onNavigate }: GalaxyFallbackProps) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mb-12 pointer-events-auto"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #635BFF 0%, #7C5CFF 50%, #00D4FF 100%)',
                boxShadow: '0 8px 40px rgba(99,91,255,0.5), 0 0 80px rgba(99,91,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Sparkles size={28} className="text-white" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.6))' }} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl -z-10"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'linear-gradient(135deg, #635BFF, #00D4FF)', filter: 'blur(16px)' }}
            />
          </motion.div>
          <div className="flex flex-col">
            <span
              className="font-bold text-3xl tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #ffffff, #a8b4ff, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(99,91,255,0.3)',
              }}
            >
              UniFlow
            </span>
            <span className="text-sm text-white/40 tracking-[0.3em] uppercase font-medium">知识宇宙 · 兼容模式</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 md:gap-8 pointer-events-auto max-w-3xl px-4">
        {planets.map((planet, index) => {
          const Icon = planet.icon;
          return (
            <motion.button
              key={planet.path}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(planet.path)}
              className="relative group"
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: planet.color,
                  filter: 'blur(30px)',
                  transform: 'scale(0.9)',
                }}
              />
              <div
                className="relative p-4 sm:p-6 md:p-8 rounded-3xl flex flex-col items-center gap-4 transition-all duration-300"
                style={{
                  background: 'rgba(5, 12, 25, 0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `2px solid ${planet.color}40`,
                  boxShadow: `0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 30px ${planet.color}40, 0 0 60px ${planet.color}20`,
                      `0 0 50px ${planet.color}60, 0 0 80px ${planet.color}30`,
                      `0 0 30px ${planet.color}40, 0 0 60px ${planet.color}20`,
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${planet.color}80, ${planet.color}40, ${planet.color}10)`,
                    border: `2px solid ${planet.color}60`,
                  }}
                >
                  <Icon size={32} style={{ color: planet.color, filter: `drop-shadow(0 0 8px ${planet.color})` }} className="md:w-10 md:h-10" />
                </motion.div>

                <div className="text-center">
                  <h3
                    className="text-lg md:text-xl font-bold mb-1"
                    style={{
                      color: planet.color,
                      textShadow: `0 0 20px ${planet.color}60`,
                    }}
                  >
                    {planet.name}
                  </h3>
                  <p className="text-white/50 text-sm">{planet.description}</p>
                </div>

                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `${planet.color}20`,
                    border: `1px solid ${planet.color}40`,
                  }}
                >
                  <ChevronLeft size={16} style={{ color: planet.color }} className="rotate-180" />
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="mt-10 text-white/30 text-sm pointer-events-none"
      >
        2D 兼容模式 · WebGL 不可用
      </motion.p>
    </div>
  );
}

interface PlanetFallbackProps {
  children?: ReactNode;
}

function PlanetFallback({ children }: PlanetFallbackProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPlanet = planetPathMap[location.pathname];

  if (!currentPlanet) {
    return <GalaxyFallback onNavigate={navigate} />;
  }

  const otherPlanets = planets.filter(p => p.path !== location.pathname);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-4 left-4 z-20 pointer-events-auto"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(5, 12, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${currentPlanet.color}40`,
            boxShadow: `0 0 20px ${currentPlanet.color}20, 0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          <ChevronLeft size={18} style={{ color: currentPlanet.color }} />
          <span style={{ color: currentPlanet.color }} className="text-sm font-medium">返回星系</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="fixed top-4 right-4 z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{
          background: 'rgba(5, 12, 25, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentPlanet.color}80, ${currentPlanet.color}40)`,
              boxShadow: `0 0 20px ${currentPlanet.color}40`,
            }}
          >
            <currentPlanet.icon size={20} style={{ color: currentPlanet.color }} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg" style={{ color: currentPlanet.color }}>
              {currentPlanet.name}
            </span>
            <span className="text-white/50 text-xs">{currentPlanet.description}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
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
          {otherPlanets.map((planet) => {
            const PlanetIcon = planet.icon;
            return (
              <motion.button
                key={planet.path}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(planet.path)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: `linear-gradient(135deg, ${planet.color}10, transparent)`,
                  border: `1px solid ${planet.color}30`,
                }}
              >
                <PlanetIcon size={18} style={{ color: planet.color, opacity: 0.7 }} />
                <span className="text-[9px] font-medium" style={{ color: planet.color, opacity: 0.6 }}>
                  {planet.name.slice(0, 2)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-20 right-4 bottom-20 left-4 pointer-events-auto rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(5, 12, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${currentPlanet.color}30`,
          boxShadow: `0 0 60px ${currentPlanet.color}15, 0 0 120px ${currentPlanet.color}08, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <div className="w-full h-full overflow-auto p-6 lg:p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

interface FallbackViewProps {
  children?: ReactNode;
}

export default function FallbackView({ children }: FallbackViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPlanetView = Object.keys(planetPathMap).includes(location.pathname);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#010308' }}>
      <StarFieldCSS />
      {isPlanetView ? (
        <PlanetFallback>{children}</PlanetFallback>
      ) : (
        <GalaxyFallback onNavigate={navigate} />
      )}
    </div>
  );
}
