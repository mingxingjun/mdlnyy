import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function PageTransition() {
  const location = useLocation();

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{
            initial: { opacity: 0, x: 20 },
            animate: {
              opacity: 1,
              x: 0,
              transition: {
                opacity: { duration: 0.2, ease: 'easeOut' },
                x: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
              },
            },
            exit: {
              opacity: 0,
              x: -20,
              transition: {
                opacity: { duration: 0.15, ease: 'easeIn' },
                x: { duration: 0.15, ease: 'easeIn' },
              },
            },
          }}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
