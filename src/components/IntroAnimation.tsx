import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

type ParticleShape = 'circle' | 'rect' | 'triangle';

interface Particle {
  id: number;
  shape: ParticleShape;
  size: number;
  color: string;
  rotation: number;
  startX: number;
  startY: number;
  delay: number;
}

interface PaperSheet {
  id: number;
  widthPct: number;
  height: number;
  rotation: number;
  offsetY: number;
  delay: number;
  xSway: number;
}

const PARTICLE_COLORS = ['#8B2500', '#5C4033', '#B8860B', '#C8B89E'];

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  const shapes: ParticleShape[] = ['circle', 'rect', 'triangle'];
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  for (let i = 0; i < count; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    let size: number;
    if (shape === 'circle') {
      size = 4 + Math.random() * 4;
    } else if (shape === 'rect') {
      size = 3 + Math.random() * 3;
    } else {
      size = 5 + Math.random() * 3;
    }

    const edge = Math.floor(Math.random() * 4);
    const offset = 120 + Math.random() * 100;
    let startX: number, startY: number;

    switch (edge) {
      case 0:
        startX = Math.random() * vw;
        startY = -offset;
        break;
      case 1:
        startX = Math.random() * vw;
        startY = vh + offset;
        break;
      case 2:
        startX = -offset;
        startY = Math.random() * vh;
        break;
      default:
        startX = vw + offset;
        startY = Math.random() * vh;
        break;
    }

    particles.push({
      id: i,
      shape,
      size,
      color,
      rotation: Math.random() * 360,
      startX,
      startY,
      delay: Math.random() * 60,
    });
  }

  return particles;
}

function generatePapers(count: number): PaperSheet[] {
  const papers: PaperSheet[] = [];

  for (let i = 0; i < count; i++) {
    papers.push({
      id: i,
      widthPct: 0.6 + Math.random() * 0.2,
      height: 42 + Math.floor(Math.random() * 16),
      rotation: (Math.random() - 0.5) * 3,
      offsetY: i * 6 - (count - 1) * 3,
      delay: 500 + i * 80,
      xSway: (Math.random() - 0.5) * 20,
    });
  }

  return papers;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const particles = useMemo(() => generateParticles(22), []);
  const papers = useMemo(() => generatePapers(4), []);

  const skipAnimation = useCallback(() => {
    if (isSkipping) return;
    setIsSkipping(true);
    setIsFading(true);
    onComplete();
    setTimeout(() => {
      setIsVisible(false);
    }, 100);
  }, [isSkipping, onComplete]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('introAnimationPlayed')) {
        onComplete();
        setIsVisible(false);
        return;
      }
      sessionStorage.setItem('introAnimationPlayed', 'true');
    } catch {
      // sessionStorage not available
    }

    const completeTimer = setTimeout(() => {
      onComplete();
      setIsFading(true);
    }, 1100);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    return () => {
      clearTimeout(completeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        skipAnimation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipAnimation]);

  if (!isVisible) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cx = vw / 2;
  const cy = vh / 2;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 cursor-pointer overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F5EDE0 0%, #EDE4D3 100%)',
          willChange: 'opacity',
        }}
        initial={{ opacity: 1 }}
        animate={isFading || isSkipping ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: isSkipping ? 0.08 : 0.4, ease: 'easeOut' }}
        onClick={skipAnimation}
      >
        {particles.map((p) => {
          const targetX = cx - p.startX;
          const targetY = cy - p.startY;

          if (p.shape === 'circle') {
            return (
              <motion.div
                key={`p-${p.id}`}
                style={{
                  position: 'absolute',
                  left: p.startX,
                  top: p.startY,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  willChange: 'transform, opacity',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: targetX,
                  y: targetY,
                  opacity: 0,
                  scale: 0.15,
                }}
                transition={{
                  duration: 0.42,
                  delay: p.delay / 1000,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          }

          if (p.shape === 'rect') {
            return (
              <motion.div
                key={`p-${p.id}`}
                style={{
                  position: 'absolute',
                  left: p.startX,
                  top: p.startY,
                  width: p.size * 1.8,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: 1,
                  willChange: 'transform, opacity',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
                animate={{
                  x: targetX,
                  y: targetY,
                  opacity: 0,
                  scale: 0.15,
                  rotate: p.rotation + 120,
                }}
                transition={{
                  duration: 0.42,
                  delay: p.delay / 1000,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          }

          return (
            <motion.div
              key={`p-${p.id}`}
              style={{
                position: 'absolute',
                left: p.startX,
                top: p.startY,
                width: 0,
                height: 0,
                borderLeft: `${p.size}px solid transparent`,
                borderRight: `${p.size}px solid transparent`,
                borderBottom: `${p.size * 1.6}px solid ${p.color}`,
                willChange: 'transform, opacity',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
              animate={{
                x: targetX,
                y: targetY,
                opacity: 0,
                scale: 0.15,
                rotate: p.rotation + 180,
              }}
              transition={{
                duration: 0.42,
                delay: p.delay / 1000,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          );
        })}

        {papers.map((paper) => {
          const pw = paper.widthPct * vw;
          return (
            <motion.div
              key={`paper-${paper.id}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: pw,
                height: paper.height,
                marginLeft: -pw / 2,
                marginTop: paper.offsetY - paper.height / 2,
                backgroundColor: '#FBF7F0',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(92, 64, 51, 0.08), 0 1px 3px rgba(92, 64, 51, 0.06), inset 1px 1px 0 rgba(255,255,255,0.4)',
                willChange: 'transform, opacity',
                border: '1px solid rgba(92,64,51,0.08)',
              }}
              initial={{ y: -vh - 200, opacity: 0, rotate: -5, x: 0 }}
              animate={{
                y: [-vh - 200, -30, 8, 0],
                opacity: [0, 1, 1, 1],
                rotate: [-5, -1, 2, paper.rotation],
                x: [0, paper.xSway * 0.5, paper.xSway * -0.15, 0],
              }}
              transition={{
                duration: 0.42,
                delay: paper.delay / 1000,
                ease: 'easeOut',
                times: [0, 0.5, 0.8, 1],
              }}
            />
          );
        })}

        <div
          className="absolute bottom-6 right-6 text-ink-500 text-xs font-serif select-none pointer-events-none"
          style={{ opacity: 0.6 }}
        >
          点击任意位置跳过
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
