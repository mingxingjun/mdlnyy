import { forwardRef, useMemo, type ReactNode, type MouseEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type PaperCardStatus = 'active' | 'has-reward' | 'inactive' | 'completed' | 'default';

export interface PaperCardProps {
  children: ReactNode;
  className?: string;
  status?: PaperCardStatus;
  rotation?: number;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

/**
 * PaperCard 性能优化要点：
 * 1. 容器从 motion.div 改为普通 div —— 移除 layout（列表场景 GPU 重负载源）、
 *    whileHover/whileTap（每帧 JS 驱动），改用 CSS :hover/:active + transition（合成层直接处理）
 * 2. 入场动画用 CSS keyframe（paperFall）替代 framer-motion initial/animate
 * 3. has-reward 印章、completed 斜划线、active 顶条改用 CSS animation（一次性入场，开销小）
 * 4. 折角 filter:drop-shadow 改为 box-shadow（filter 触发 paint，box-shadow 可走合成层）
 *
 * 视觉质量保持不变：所有动画时长、曲线、最终状态都与原版一致。
 */
const PaperCard = forwardRef<HTMLDivElement, PaperCardProps>(
  ({ children, className, status = 'default', rotation, onClick }, ref) => {
    const reduce = useReducedMotion();
    const randomRotation = useMemo(() => {
      if (rotation !== undefined) return rotation;
      return (Math.random() - 0.5) * 2.4;
    }, [rotation]);

    const finalRotation = status === 'active' ? 0 : randomRotation;
    const isInteractive = status !== 'inactive';
    const isClickable = !!onClick;

    const animateY = status === 'active' ? -3 : 0;

    const baseClasses = cn(
      'paper-card relative bg-paper-50 border border-[rgba(92,64,51,0.12)] rounded-[3px] shadow-paper',
      // CSS hover/tap 替代 framer-motion whileHover/whileTap（合成层直接处理，无 JS 开销）
      'transition-[transform,box-shadow] duration-200 ease-out',
      isClickable && 'cursor-pointer',
      isInteractive && status !== 'active' && 'hover:shadow-paper-hover hover:-translate-y-0.5',
      isInteractive && 'active:translate-y-0 active:scale-[0.99]',
      status === 'active' && 'paper-card-active shadow-paper-hover',
      status === 'has-reward' && (reduce ? 'border-seal/30' : 'paper-card-reward border-seal/30'),
      status === 'inactive' && 'opacity-60 saturate-50',
      status === 'completed' && 'opacity-50 paper-card-completed',
      // 入场动画：用 CSS paperFall 替代 framer-motion initial/animate
      !reduce && 'paper-fall-in',
      className
    );

    return (
      <div
        ref={ref}
        className={baseClasses}
        onClick={onClick}
        style={{
          transform: `rotate(${finalRotation}deg) translateY(${animateY}px)`,
        }}
        data-rotation={finalRotation.toFixed(2)}
      >
        {status === 'has-reward' && (
          <span
            className="absolute -top-1 -right-1 z-10 w-3 h-3 rounded-full bg-seal shadow-stamp paper-card-badge-in"
          />
        )}

        {status === 'completed' && (
          <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[3px]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <line
                x1="0"
                y1="100%"
                x2="100%"
                y2="0"
                stroke="rgba(92,64,51,0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="paper-card-line-in"
              />
            </svg>
          </div>
        )}

        {status === 'active' && (
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 z-[4] h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent rounded-t-[3px] paper-card-bar-in"
            style={{ transformOrigin: 'left' }}
          />
        )}

        <div className="pointer-events-none absolute bottom-0 right-0 z-[2] w-6 h-6 overflow-hidden">
          <div className="absolute bottom-0 right-0 w-6 h-6">
            {/* 折角：filter:drop-shadow 改为 box-shadow 模拟（filter 触发 paint，box-shadow 可走合成层） */}
            <div
              className="absolute bottom-0 right-0 w-0 h-0"
              style={{
                borderBottom: '24px solid rgba(199,185,165,0.5)',
                borderLeft: '24px solid transparent',
                boxShadow: '-1px -1px 1px rgba(92,64,51,0.08)',
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-0 h-0"
              style={{
                borderBottom: '22px solid #FBF7F0',
                borderLeft: '22px solid transparent',
              }}
            />
          </div>
        </div>

        <div className="relative z-[1]">{children}</div>
      </div>
    );
  }
);

PaperCard.displayName = 'PaperCard';

export default PaperCard;
