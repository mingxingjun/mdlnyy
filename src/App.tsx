import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import IntroAnimation from '@/components/IntroAnimation';
import { ToastContainer } from '@/components/Toast';

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  return (
    <BrowserRouter basename="/mdlnyy">
      <ToastContainer />
      {!introDone && <IntroAnimation onComplete={() => setIntroDone(true)} />}
      <Layout />
    </BrowserRouter>
  );
}
