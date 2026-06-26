import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface FallbackViewProps {
  children?: ReactNode;
}

export default function FallbackView({ children }: FallbackViewProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-paper-50 border border-ink-600/10 rounded shadow-paper p-8 text-center">
          <div className="text-4xl mb-4">📔</div>
          <h2 className="font-serif text-xl text-ink-800 font-bold mb-2">
            页面暂时无法打开
          </h2>
          <p className="text-ink-600 font-serif text-sm mb-6">
            手账的这一页似乎粘住了，请稍后再试
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-paper-100 border border-ink-600/20 rounded text-ink-700 font-serif text-sm hover:bg-paper-200 transition-colors"
            >
              <RefreshCw size={16} />
              <span>刷新</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-ink-800 text-paper-50 rounded font-serif text-sm hover:bg-ink-700 transition-colors"
            >
              <Home size={16} />
              <span>回到首页</span>
            </button>
          </div>
          {children && (
            <div className="mt-6 pt-6 border-t border-ink-600/10">
              {children}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
