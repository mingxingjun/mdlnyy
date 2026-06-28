import { motion } from 'framer-motion';

interface PaperSpinnerProps {
  text?: string;
}

export default function PaperSpinner({ text = '加载中...' }: PaperSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-seal"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.15, 0.7] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="font-serif text-sm text-ink-600">{text}</p>
    </div>
  );
}
