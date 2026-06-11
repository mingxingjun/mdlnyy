import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import ThreeBackground from '@/components/ThreeBackground';
import Dashboard from '@/pages/Dashboard';
import AIEngine from '@/pages/AIEngine';
import MyNotes from '@/pages/MyNotes';
import FlowChamber from '@/pages/FlowChamber';
import { ToastContainer } from '@/components/Toast';

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <ThreeBackground />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-engine" element={<AIEngine />} />
          <Route path="my-notes" element={<MyNotes />} />
          <Route path="flow-chamber" element={<FlowChamber />} />
        </Route>
      </Routes>
    </Router>
  );
}
