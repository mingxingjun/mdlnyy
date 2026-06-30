import { useEffect, useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

/** 右下角手绘线稿：一摞书 + 书签，贴合备考主题 */
function BookStack({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="96"
      height="76"
      viewBox="0 0 96 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 底层书 */}
      <rect x="6" y="54" width="84" height="16" rx="1.5" fill="rgba(139,37,0,0.10)" stroke="rgba(92,64,51,0.28)" strokeWidth="0.9" />
      <line x1="12" y1="62" x2="84" y2="62" stroke="rgba(92,64,51,0.18)" strokeWidth="0.5" />
      {/* 中层书 */}
      <rect x="14" y="38" width="68" height="16" rx="1.5" fill="rgba(184,134,11,0.12)" stroke="rgba(92,64,51,0.28)" strokeWidth="0.9" />
      <line x1="20" y1="46" x2="76" y2="46" stroke="rgba(92,64,51,0.18)" strokeWidth="0.5" />
      {/* 顶层书（微斜） */}
      <g transform="rotate(-5 46 30)">
        <rect x="20" y="22" width="54" height="15" rx="1.5" fill="rgba(107,142,35,0.12)" stroke="rgba(92,64,51,0.28)" strokeWidth="0.9" />
        <line x1="26" y1="29.5" x2="68" y2="29.5" stroke="rgba(92,64,51,0.18)" strokeWidth="0.5" />
      </g>
      {/* 书签 */}
      <rect x="60" y="22" width="3.5" height="18" fill="rgba(139,37,0,0.32)" />
      <path d="M60 40 L61.75 37 L63.5 40 Z" fill="rgba(139,37,0,0.32)" />
    </svg>
  );
}

export default function ThreeLayerBackground({ children, className }: ThreeLayerBackgroundProps) {
  const reduce = useReducedMotion();

  // 鼠标视差：装饰层根据鼠标位置做微弱平移，增加层次感。
  // 用 rAF 节流避免 mousemove 高频触发；reduce 时不启用。
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 });
  const parallaxX = useTransform(smoothX, (v) => v * 8);
  const parallaxY = useTransform(smoothY, (v) => v * 8);

  useEffect(() => {
    if (reduce) return;
    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;
    const onMove = (e: MouseEvent) => {
      pendingX = (e.clientX / window.innerWidth - 0.5) * 2;
      pendingY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          mouseX.set(pendingX);
          mouseY.set(pendingY);
        });
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [reduce, mouseX, mouseY]);

  const decorItems = useMemo<DecorItem[]>(() => {
    const colors = [
      'rgba(139,37,0,0.35)',
      'rgba(184,134,11,0.35)',
      'rgba(45,90,39,0.25)',
      'rgba(92,64,51,0.2)',
    ];
    const snippetColors = ['#FFF9C4', '#FFCDD2'];

    const items: DecorItem[] = [];

    // 精简至 6 个装饰元素（原 12 个），降低无限循环动画数量
    items.push({
      id: 1, type: 'feather', top: '8%', left: '2%', size: 80, rotation: -15,
      color: 'rgba(92,64,51,0.3)', floatDelay: 0, animated: true,
    });

    items.push({
      id: 2, type: 'confetti', top: '5%', right: '8%', size: 10, rotation: 25,
      color: colors[0], floatDelay: 1.2, animated: true,
    });
    items.push({
      id: 3, type: 'confetti', top: '3%', right: '15%', size: 7, rotation: 60,
      color: colors[2], floatDelay: 2, animated: true,
    });

    items.push({
      id: 5, type: 'snippet', bottom: '6%', left: '3%', size: 0, rotation: -8,
      color: snippetColors[0], floatDelay: 0.8, animated: true,
    });

    items.push({
      id: 7, type: 'inkdot', top: '20%', right: '2%', size: 30, rotation: 0,
      color: colors[3], floatDelay: 0.3, animated: false,
    });

    items.push({
      id: 9, type: 'petal', top: '40%', left: '1%', size: 18, rotation: 30,
      color: colors[0], floatDelay: 0, animated: true,
    });

    return items;
  }, []);

  const floatAnimation = (delay: number, duration = 5) => {
    if (reduce) {
      return { animate: { y: 0, rotate: 0 }, transition: { duration: 0 } };
    }
    return {
      // 简化 keyframes：5 帧 → 3 帧，减少每帧计算
      animate: {
        y: [0, -4, 0],
        rotate: [0, 0.8, 0],
      },
      transition: {
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    };
  };

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

      {/* Canvas 动态粒子背景已移除（性能消耗大），改用轻量 CSS/SVG 装饰层 */}

      <div className="relative z-10">{children}</div>

      <motion.div
        className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
        style={{ x: parallaxX, y: parallaxY }}
      >
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
                {...floatAnimation(item.floatDelay, 4 + (item.id % 4))}
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
        {/* 右下角手绘书堆插画，受视差影响 */}
        <BookStack style={{ position: 'absolute', bottom: '3%', right: '2%', opacity: 0.55 }} />
      </motion.div>

      {/* 噪点纹理层：静态展示，不做 backgroundPosition 动画（避免持续重绘） */}
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
