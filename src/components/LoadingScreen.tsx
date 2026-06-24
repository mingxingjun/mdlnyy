import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, #0a1830 0%, #030a18 50%, #010308 100%)
            `,
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 60px 70px, rgba(200,220,255,0.6), transparent),
                radial-gradient(1.5px 1.5px at 120px 40px, rgba(255,255,255,0.9), transparent),
                radial-gradient(1px 1px at 180px 100px, rgba(168,180,255,0.7), transparent),
                radial-gradient(1px 1px at 250px 60px, rgba(255,255,255,0.5), transparent)
              `,
              backgroundSize: '300px 180px',
              animation: 'twinkle 4s ease-in-out infinite',
            }} />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="relative mb-8"
            >
              <div
                className="w-24 h-24 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #635BFF, #00D4FF, #b040ff, #635BFF)',
                  padding: '3px',
                  boxShadow: '0 0 60px rgba(99,91,255,0.5), 0 0 100px rgba(0,212,255,0.3)',
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0a1830, #030a18)',
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles size={36} className="text-white" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.6))' }} />
                  </motion.div>
                </div>
              </div>

              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'linear-gradient(135deg, #635BFF, #00D4FF)',
                  filter: 'blur(20px)',
                  zIndex: -1,
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h1
                className="text-3xl font-bold tracking-tight mb-2"
                style={{
                  background: 'linear-gradient(90deg, #ffffff, #a8b4ff, #00D4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                UniFlow
              </h1>
              <motion.p
                className="text-white/50 text-sm tracking-wide"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                正在启动曲速引擎...
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="mt-8 h-1 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '60%',
                  background: 'linear-gradient(90deg, #635BFF, #00D4FF, #b040ff)',
                  boxShadow: '0 0 20px rgba(99,91,255,0.6)',
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
