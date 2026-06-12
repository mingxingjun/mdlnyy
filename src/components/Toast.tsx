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
  success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', iconBg: '#d1fae5' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', iconBg: '#fee2e2' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', iconBg: '#fef3c7' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', iconBg: '#dbeafe' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
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
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[260px] max-w-[380px]"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: colors.iconBg }}
              >
                <Icon size={14} style={{ color: colors.text }} />
              </div>
              <p className="text-sm font-sans flex-1" style={{ color: colors.text }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
