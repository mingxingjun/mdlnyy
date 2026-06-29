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
  // paper 体系配色：sage(成功) / seal(错误) / gold(警告) / ink(信息)
  success: { bg: '#FBF7F0', border: 'rgba(107,142,35,0.35)', text: '#4A6315', iconBg: 'rgba(107,142,35,0.15)' },
  error: { bg: '#FBF7F0', border: 'rgba(139,37,0,0.35)', text: '#8B2500', iconBg: 'rgba(139,37,0,0.12)' },
  warning: { bg: '#FBF7F0', border: 'rgba(184,134,11,0.4)', text: '#8B6914', iconBg: 'rgba(184,134,11,0.15)' },
  info: { bg: '#FBF7F0', border: 'rgba(92,64,51,0.25)', text: '#3D2A20', iconBg: 'rgba(92,64,51,0.08)' },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

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
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-paper min-w-[260px] max-w-[calc(100vw-32px)] sm:max-w-sm shadow-paper"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-paper flex items-center justify-center flex-shrink-0"
                style={{ background: colors.iconBg }}
              >
                <Icon size={14} style={{ color: colors.text }} aria-hidden="true" />
              </div>
              <p className="text-sm font-serif flex-1" style={{ color: colors.text }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="关闭通知"
                className="p-1 rounded-paper hover:bg-ink-600/10 transition-colors flex-shrink-0"
              >
                <X size={12} className="text-ink-500" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
