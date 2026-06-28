import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VintageTagColor = 'seal' | 'ink' | 'gold' | 'green' | 'worn';

export interface VintageTagProps {
  children: ReactNode;
  color?: VintageTagColor;
  className?: string;
  closable?: boolean;
  onClose?: () => void;
}

const colorStyles: Record<VintageTagColor, string> = {
  seal: 'bg-seal/10 text-seal border border-seal/20',
  ink: 'bg-ink-700/8 text-ink-800 border border-ink-600/20',
  gold: 'bg-gold/10 text-gold border border-gold/20',
  green: 'bg-[rgba(45,90,39,0.1)] text-[#2D5A27] border border-[rgba(45,90,39,0.2)]',
  worn: 'bg-ink-500/10 text-ink-600 border border-ink-500/15',
};

export default function VintageTag({
  children,
  color = 'ink',
  className,
  closable = false,
  onClose,
}: VintageTagProps) {
  const rotation = useMemo(() => (Math.random() - 0.5) * 3, []);

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-serif',
        'shadow-note relative',
        colorStyles[color],
        closable && 'pr-1',
        className
      )}
      initial={{ opacity: 0, scale: 0.9, rotate: rotation - 5 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ scale: 1.08, rotate: rotation + 2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      <span className="relative z-[1] leading-tight">{children}</span>
      {closable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="relative z-[1] inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </motion.span>
  );
}
