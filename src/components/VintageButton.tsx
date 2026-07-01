import { type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type VintageButtonVariant = 'primary' | 'secondary' | 'ghost' | 'stamp';
export type VintageButtonSize = 'sm' | 'md' | 'lg';

export interface VintageButtonProps {
  children: ReactNode;
  variant?: VintageButtonVariant;
  size?: VintageButtonSize;
  className?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const sizeClasses: Record<VintageButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const variantClasses: Record<VintageButtonVariant, string> = {
  primary: cn(
    'bg-ink-800 text-paper-50 border border-ink-900/30',
    'shadow-[inset_0_1px_0_rgba(251,247,240,0.12),0_2px_6px_rgba(61,43,31,0.2)]',
    'hover:bg-ink-700'
  ),
  secondary: cn(
    'bg-paper-200 text-ink-800 border border-ink-600/20',
    'shadow-[0_1px_3px_rgba(92,64,51,0.08)]',
    'hover:bg-paper-300'
  ),
  ghost: cn(
    'bg-transparent text-ink-700 border border-dashed border-ink-600/30',
    'hover:bg-paper-200/50'
  ),
  stamp: cn(
    'bg-seal text-paper-50',
    'shadow-stamp',
    'rounded-full',
    'opacity-85',
    'border-2 border-seal-dark/40',
    'hover:opacity-100'
  ),
};

export default function VintageButton({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}: VintageButtonProps) {
  const isStamp = variant === 'stamp';

  const stampSizeClass = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-xs',
    lg: 'w-20 h-20 text-sm',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-serif font-medium select-none',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-seal/40 focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
        isStamp ? stampSizeClass[size] : cn('rounded-[4px]', sizeClasses[size]),
        variantClasses[variant],
        // stamp 变体用 CSS stampPress keyframe 替代 framer-motion（盖章回弹手感更贴主题）
        isStamp && 'btn-stamp-press',
        className
      )}
      style={isStamp ? { rotate: -8, letterSpacing: '1px' } : undefined}
      // 非 stamp 变体补 whileHover 目标值，让所有按钮都有 motion 手感
      whileHover={
        !isStamp && !disabled
          ? { y: -2, boxShadow: '0 4px 12px rgba(139,37,0,0.15)', transition: { duration: 0.15, ease: 'easeOut' } }
          : undefined
      }
      whileTap={!disabled ? (isStamp ? { scale: 0.92 } : { scale: 0.97 }) : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}
