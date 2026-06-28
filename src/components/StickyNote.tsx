import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type StickyNoteColor = 'yellow' | 'pink' | 'blue' | 'green';

export interface StickyNoteProps {
  children: ReactNode;
  color?: StickyNoteColor;
  rotation?: number;
  className?: string;
}

const colorStyles: Record<StickyNoteColor, { bg: string; tape: string; text: string }> = {
  yellow: { bg: '#FFF9C4', tape: 'rgba(255,255,255,0.55)', text: '#5D4E37' },
  pink: { bg: '#FFCDD2', tape: 'rgba(255,255,255,0.55)', text: '#5D3A3A' },
  blue: { bg: '#BBDEFB', tape: 'rgba(255,255,255,0.55)', text: '#2C3E50' },
  green: { bg: '#C8E6C9', tape: 'rgba(255,255,255,0.55)', text: '#2E4A2E' },
};

export default function StickyNote({
  children,
  color = 'yellow',
  rotation,
  className,
}: StickyNoteProps) {
  const randomRotation = useMemo(() => {
    if (rotation !== undefined) return rotation;
    return (Math.random() - 0.5) * 6;
  }, [rotation]);

  // 胶带轻微旋转角度，用 useMemo 固定避免每次渲染重新计算导致抖动
  const tapeRotate = useMemo(() => (Math.random() - 0.5) * 4, []);

  const style = colorStyles[color];

  return (
    <motion.div
      className={cn('relative p-4 pt-6 min-h-[80px] shadow-note', className)}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        rotate: randomRotation,
      }}
      initial={{ opacity: 0, y: -10, rotate: randomRotation - 3 }}
      animate={{ opacity: 1, y: 0, rotate: randomRotation }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{
        rotate: [randomRotation, randomRotation + 1.5, randomRotation - 0.5, randomRotation + 0.8],
        zIndex: 30,
        transition: { duration: 0.5 },
      }}
    >
      <div
        className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-10 h-4 rounded-[1px]"
        style={{
          backgroundColor: style.tape,
          boxShadow: '0 1px 2px rgba(92,64,51,0.08)',
          transform: `translateX(-50%) rotate(${tapeRotate}deg)`,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-[1] font-serif text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
