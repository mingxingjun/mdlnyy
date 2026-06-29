import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import IntroAnimation from '@/components/IntroAnimation';
import { ToastContainer } from '@/components/Toast';

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  return (
    <BrowserRouter>
      <ToastContainer />
      <AnimatePresence>
        {!introDone && <IntroAnimation onComplete={() => setIntroDone(true)} />}
      </AnimatePresence>
      <Layout />
    </BrowserRouter>
  );
}
