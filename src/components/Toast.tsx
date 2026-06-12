import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const iconMap: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colorMap: Record<ToastType, { bg: string; border: string; text: string; iconBg: string }> = {
  success: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', text: '#34d399', iconBg: 'rgba(52,211,153,0.15)' },
  error: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: '#f87171', iconBg: 'rgba(248,113,113,0.15)' },
  warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24', iconBg: 'rgba(251,191,36,0.15)' },
  info: { bg: 'rgba(108,124,255,0.1)', border: 'rgba(108,124,255,0.25)', text: '#6C7CFF', iconBg: 'rgba(108,124,255,0.15)' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col items-center sm:items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const colors = colorMap[toast.type];
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[12px] min-w-[260px] max-w-[calc(100vw-32px)] sm:max-w-sm"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: colors.iconBg }}
              >
                <Icon size={14} style={{ color: colors.text }} />
              </div>
              <p className="text-sm font-sans flex-1" style={{ color: colors.text }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <X size={12} className="text-[#5c5f73]" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
