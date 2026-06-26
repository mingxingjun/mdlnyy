import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThreeLayerBackgroundProps {
  children: ReactNode;
  className?: string;
}

interface DecorItem {
  id: number;
  type: 'confetti' | 'inkdot' | 'snippet' | 'feather' | 'petal';
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  rotation: number;
  color: string;
  floatDelay: number;
  animated: boolean;
}

function FeatherPen({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M55 10C48 15 38 25 32 38C28 47 24 55 20 62L25 65C30 58 36 50 42 42C48 34 55 22 62 15C64 13 60 8 55 10Z"
        fill="rgba(92,64,51,0.2)"
        stroke="rgba(92,64,51,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M20 62L15 70L22 66"
        stroke="rgba(92,64,51,0.3)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="32"
        y1="38"
        x2="20"
        y2="62"
        stroke="rgba(92,64,51,0.15)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

function InkSplash({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="8" fill={color} opacity="0.3" />
      <circle cx="28" cy="14" r="2" fill={color} opacity="0.2" />
      <circle cx="12" cy="26" r="1.5" fill={color} opacity="0.15" />
      <circle cx="30" cy="26" r="1" fill={color} opacity="0.2" />
      <circle cx="14" cy="12" r="1.2" fill={color} opacity="0.18" />
    </svg>
  );
}

function Confetti({ size, color, rotation }: { size: number; color: string; rotation: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: 1,
        transform: `rotate(${rotation}deg)`,
        opacity: 0.35,
      }}
    />
  );
}

function SmallSnippet({ color, rotation }: { color: string; rotation: number }) {
  return (
    <div
      style={{
        width: 36,
        height: 28,
        backgroundColor: color,
        borderRadius: 1,
        transform: `rotate(${rotation}deg)`,
        opacity: 0.3,
        boxShadow: '1px 1px 3px rgba(92,64,51,0.08)',
      }}
    />
  );
}

function Petal({ size, color, rotation }: { size: number; color: string; rotation: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ transform: `rotate(${rotation}deg)` }}>
      <ellipse cx="10" cy="10" rx="6" ry="9" fill={color} opacity="0.3" />
    </svg>
  );
}

export default function ThreeLayerBackground({ children, className }: ThreeLayerBackgroundProps) {
  const decorItems = useMemo<DecorItem[]>(() => {
    const colors = [
      'rgba(139,37,0,0.35)',
      'rgba(184,134,11,0.35)',
      'rgba(45,90,39,0.25)',
      'rgba(92,64,51,0.2)',
      'rgba(139,37,0,0.2)',
    ];
    const snippetColors = ['#FFF9C4', '#FFCDD2', '#BBDEFB', '#C8E6C9'];

    const items: DecorItem[] = [];

    items.push({
      id: 1, type: 'feather', top: '8%', left: '2%', size: 80, rotation: -15,
      color: 'rgba(92,64,51,0.3)', floatDelay: 0, animated: true,
    });

    items.push({
      id: 2, type: 'confetti', top: '5%', right: '8%', size: 10, rotation: 25,
      color: colors[0], floatDelay: 1.2, animated: false,
    });
    items.push({
      id: 3, type: 'confetti', top: '12%', right: '4%', size: 8, rotation: -40,
      color: colors[1], floatDelay: 0.5, animated: true,
    });
    items.push({
      id: 4, type: 'confetti', top: '3%', right: '15%', size: 7, rotation: 60,
      color: colors[2], floatDelay: 2, animated: false,
    });

    items.push({
      id: 5, type: 'snippet', bottom: '6%', left: '3%', size: 0, rotation: -8,
      color: snippetColors[0], floatDelay: 0.8, animated: true,
    });
    items.push({
      id: 6, type: 'snippet', bottom: '12%', left: '8%', size: 0, rotation: 5,
      color: snippetColors[1], floatDelay: 1.5, animated: false,
    });

    items.push({
      id: 7, type: 'inkdot', top: '20%', right: '2%', size: 30, rotation: 0,
      color: colors[3], floatDelay: 0.3, animated: false,
    });
    items.push({
      id: 8, type: 'inkdot', bottom: '25%', right: '3%', size: 24, rotation: 0,
      color: colors[0], floatDelay: 1.8, animated: false,
    });

    items.push({
      id: 9, type: 'petal', top: '40%', left: '1%', size: 18, rotation: 30,
      color: colors[0], floatDelay: 0, animated: true,
    });
    items.push({
      id: 10, type: 'petal', bottom: '35%', left: '2%', size: 14, rotation: -50,
      color: colors[1], floatDelay: 2.2, animated: false,
    });

    items.push({
      id: 11, type: 'confetti', top: '60%', right: '1%', size: 9, rotation: 15,
      color: colors[2], floatDelay: 1, animated: false,
    });
    items.push({
      id: 12, type: 'confetti', bottom: '5%', right: '10%', size: 6, rotation: -20,
      color: colors[4], floatDelay: 0.7, animated: false,
    });

    return items;
  }, []);

  const floatAnimation = (delay: number) => ({
    animate: {
      y: [0, -4, 2, -2, 0],
      rotate: [0, 0.8, -0.5, 0.3, 0],
    },
    transition: {
      duration: 5,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  return (
    <div className={cn('relative overflow-hidden min-h-screen', className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            linear-gradient(135deg, #EDE4D3 0%, #E0D4C0 30%, #EDE4D3 60%, #E5D8C5 100%)
          `,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 3px,
                rgba(139,110,80,0.03) 3px,
                rgba(139,110,80,0.03) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(139,110,80,0.025) 40px,
                rgba(139,110,80,0.025) 42px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 80px,
                rgba(160,130,90,0.04) 80px,
                rgba(160,130,90,0.04) 82px
              )
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(160,130,90,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 30%, rgba(140,110,80,0.06) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%, rgba(120,95,70,0.05) 0%, transparent 45%)
            `,
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>

      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {decorItems.map((item) => {
          const posStyle: React.CSSProperties = {
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            position: 'absolute',
          };

          if (item.animated) {
            return (
              <motion.div
                key={item.id}
                style={posStyle}
                {...floatAnimation(item.floatDelay)}
                className="backdrop-blur-[1px]"
              >
                {item.type === 'feather' && <FeatherPen style={{ opacity: 0.4 }} />}
                {item.type === 'confetti' && <Confetti size={item.size} color={item.color} rotation={item.rotation} />}
                {item.type === 'snippet' && <SmallSnippet color={item.color} rotation={item.rotation} />}
                {item.type === 'inkdot' && <InkSplash size={item.size} color={item.color} />}
                {item.type === 'petal' && <Petal size={item.size} color={item.color} rotation={item.rotation} />}
              </motion.div>
            );
          }

          return (
            <div key={item.id} style={posStyle} className="backdrop-blur-[1px]">
              {item.type === 'feather' && <FeatherPen style={{ opacity: 0.4 }} />}
              {item.type === 'confetti' && <Confetti size={item.size} color={item.color} rotation={item.rotation} />}
              {item.type === 'snippet' && <SmallSnippet color={item.color} rotation={item.rotation} />}
              {item.type === 'inkdot' && <InkSplash size={item.size} color={item.color} />}
              {item.type === 'petal' && <Petal size={item.size} color={item.color} rotation={item.rotation} />}
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
