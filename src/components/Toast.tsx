import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertCircle, Info, Stamp } from 'lucide-react';

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
  success: { bg: 'rgba(45,90,39,0.08)', border: 'rgba(45,90,39,0.25)', text: '#2D5A27', iconBg: 'rgba(45,90,39,0.12)' },
  error: { bg: 'rgba(139,37,0,0.08)', border: 'rgba(139,37,0,0.25)', text: '#8B2500', iconBg: 'rgba(139,37,0,0.12)' },
  warning: { bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.25)', text: '#B8860B', iconBg: 'rgba(184,134,11,0.12)' },
  info: { bg: 'rgba(92,64,51,0.08)', border: 'rgba(92,64,51,0.2)', text: '#5C4033', iconBg: 'rgba(92,64,51,0.1)' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col items-center sm:items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const colors = colorMap[toast.type];
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, y: -20, rotate: 3, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: -1, scale: 1 }}
              exit={{ opacity: 0, x: 60, y: -20, rotate: 3, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto relative"
            >
              <div
                className="flex items-center gap-3 px-5 py-3 min-w-[260px] max-w-[calc(100vw-32px)] sm:max-w-sm rounded-sm"
                style={{
                  background: '#FBF7F0',
                  border: `1.5px solid ${colors.border}`,
                  boxShadow: '2px 3px 8px rgba(92,64,51,0.15), 0 0 0 1px rgba(92,64,51,0.05) inset',
                }}
              >
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.iconBg }}
                >
                  <Icon size={16} style={{ color: colors.text, strokeWidth: 2.5 }} />
                </div>
                <p className="font-serif text-sm flex-1" style={{ color: colors.text }}>
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded hover:bg-ink-600/10 transition-colors flex-shrink-0"
                >
                  <X size={14} style={{ color: 'rgba(92,64,51,0.5)' }} />
                </button>

                <Stamp
                  size={14}
                  className="absolute -bottom-1 -right-1 opacity-20"
                  style={{ color: colors.text, transform: 'rotate(-12deg)' }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
