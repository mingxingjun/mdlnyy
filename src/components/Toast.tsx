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

const TOAST_MAX = 5;
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => {
      const next = [...state.toasts, { id, type, message }];
      // Drop oldest toasts beyond the cap
      if (next.length > TOAST_MAX) {
        const dropped = next.slice(0, next.length - TOAST_MAX);
        dropped.forEach((t) => {
          const timer = toastTimers.get(t.id);
          if (timer) {
            clearTimeout(timer);
            toastTimers.delete(t.id);
          }
        });
        return { toasts: next.slice(next.length - TOAST_MAX) };
      }
      return { toasts: next };
    });
    const timer = setTimeout(() => {
      toastTimers.delete(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
    toastTimers.set(id, timer);
  },
  removeToast: (id) => {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

const iconMap: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colorMap: Record<ToastType, { bg: string; border: string; text: string; iconBg: string }> = {
  success: { bg: 'rgba(0,217,36,0.1)', border: 'rgba(0,217,36,0.25)', text: '#00D924', iconBg: 'rgba(0,217,36,0.15)' },
  error: { bg: 'rgba(255,61,0,0.1)', border: 'rgba(255,61,0,0.25)', text: '#FF3D00', iconBg: 'rgba(255,61,0,0.15)' },
  warning: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.25)', text: '#FFB800', iconBg: 'rgba(255,184,0,0.15)' },
  info: { bg: 'rgba(99,91,255,0.1)', border: 'rgba(99,91,255,0.25)', text: '#635BFF', iconBg: 'rgba(99,91,255,0.15)' },
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
                <X size={12} className="text-[#6b7c93]" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
