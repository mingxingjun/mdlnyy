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
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const variantClasses: Record<VintageButtonVariant, string> = {
  primary: cn(
    'bg-ink-800 text-paper-50 border border-ink-900/30',
    'shadow-[inset_0_1px_0_rgba(251,247,240,0.12),0_2px_6px_rgba(61,43,31,0.2)]',
    'hover:bg-ink-700 hover:shadow-[inset_0_1px_0_rgba(251,247,240,0.15),0_4px_12px_rgba(139,37,0,0.15)]'
  ),
  secondary: cn(
    'bg-paper-200 text-ink-800 border border-ink-600/20',
    'shadow-[0_1px_3px_rgba(92,64,51,0.08)]',
    'hover:bg-paper-300 hover:shadow-[0_2px_6px_rgba(92,64,51,0.12)]'
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

/**
 * VintageButton 性能优化要点：
 * 1. 非 stamp 变体从 motion.button 改为普通 button —— 移除 whileHover（boxShadow 触发 paint）、
 *    whileTap（每帧 JS 驱动），改用 CSS :hover/:active + transition（合成层直接处理）
 * 2. hover 阴影变化用 CSS 类切换（Tailwind hover:shadow-*），而非 framer-motion 每帧驱动
 * 3. stamp 变体保留 motion（盖章 spring 手感需要物理动画，且 stamp 按钮数量少）
 */
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
    sm: 'w-10 h-10 text-[10px]',
    md: 'w-16 h-16 text-xs',
    lg: 'w-20 h-20 text-sm',
  };

  // stamp 变体保留 motion（spring 手感 + 数量少，开销可控）
  if (isStamp) {
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
          stampSizeClass[size],
          variantClasses[variant],
          'btn-stamp-press',
          className
        )}
        style={{ rotate: -8, letterSpacing: '1px' }}
        whileTap={!disabled ? { scale: 0.92 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        {children}
      </motion.button>
    );
  }

  // 非 stamp 变体：普通 button + CSS hover/active（无 framer-motion JS 开销）
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-serif font-medium select-none',
        // CSS transition 替代 framer-motion spring（transform 走合成层，无 JS 开销）
        'transition-[transform,box-shadow,background-color] duration-150 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-seal/40 focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        'rounded-[4px]',
        sizeClasses[size],
        variantClasses[variant],
        // hover 上浮 + active 下压，纯 CSS 合成层动画
        !disabled && 'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        className
      )}
    >
      {children}
    </button>
  );
}
