import { forwardRef, useMemo, type ReactNode, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type PaperCardStatus = 'active' | 'has-reward' | 'inactive' | 'completed' | 'default';

export interface PaperCardProps {
  children: ReactNode;
  className?: string;
  status?: PaperCardStatus;
  rotation?: number;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** 是否启用 layout 动画（仅列表项重排时需要，默认关闭以避免性能消耗） */
  layout?: boolean;
}

const PaperCard = forwardRef<HTMLDivElement, PaperCardProps>(
  ({ children, className, status = 'default', rotation, onClick, layout: enableLayout = false }, ref) => {
    const reduce = useReducedMotion();
    const randomRotation = useMemo(() => {
      if (rotation !== undefined) return rotation;
      return (Math.random() - 0.5) * 2.4;
    }, [rotation]);

    const finalRotation = status === 'active' ? 0 : randomRotation;
    const isInteractive = status !== 'inactive';
    const isClickable = !!onClick;

    const animateY = status === 'active' ? -3 : 0;
    const animateRotate = status === 'completed' ? 1 : finalRotation;

    const baseClasses = cn(
      'paper-card relative bg-paper-50 border border-[rgba(92,64,51,0.12)] rounded-[3px] shadow-paper',
      'transition-shadow duration-300',
      isClickable && 'cursor-pointer',
      isInteractive && status !== 'active' && 'hover:shadow-paper-hover',
      status === 'active' && 'paper-card-active shadow-paper-hover',
      status === 'has-reward' && (reduce ? 'border-seal/30' : 'paper-card-reward border-seal/30'),
      status === 'inactive' && 'opacity-60 saturate-50',
      status === 'completed' && 'opacity-50 paper-card-completed',
      className
    );

    return (
      <motion.div
        ref={ref}
        layout={enableLayout}
        className={baseClasses}
        onClick={onClick}
        initial={{ rotate: animateRotate, y: animateY }}
        animate={{ rotate: animateRotate, y: animateY }}
        whileHover={isInteractive ? { scale: 1.01, y: animateY - 2 } : undefined}
        whileTap={isInteractive ? { scale: 0.99, y: animateY } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        data-rotation={finalRotation.toFixed(2)}
      >
        {status === 'has-reward' && (
          <motion.span
            className="absolute -top-1 -right-1 z-10 w-3 h-3 rounded-full bg-seal shadow-stamp"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          />
        )}

        {status === 'completed' && (
          <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[3px]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <motion.line
                x1="0"
                y1="100%"
                x2="100%"
                y2="0"
                stroke="rgba(92,64,51,0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
          </div>
        )}

        {status === 'active' && (
          <motion.div
            className="pointer-events-none absolute top-0 left-0 right-0 z-[4] h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent rounded-t-[3px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        )}

        <div className="pointer-events-none absolute bottom-0 right-0 z-[2] w-6 h-6 overflow-hidden">
          <div className="absolute bottom-0 right-0 w-6 h-6">
            <div
              className="absolute bottom-0 right-0 w-0 h-0"
              style={{
                borderBottom: '24px solid rgba(199,185,165,0.5)',
                borderLeft: '24px solid transparent',
                filter: 'drop-shadow(-1px -1px 1px rgba(92,64,51,0.08))',
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
      </motion.div>
    );
  }
);

PaperCard.displayName = 'PaperCard';

export default PaperCard;
