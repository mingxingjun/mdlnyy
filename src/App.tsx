import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import AIEngine from '@/pages/AIEngine';
import MyNotes from '@/pages/MyNotes';
import FlowChamber from '@/pages/FlowChamber';
import { ToastContainer } from '@/components/Toast';

function GalaxyView() {
  return null;
}

export default function App() {
  return (
    <Router basename="/mdlnyy">
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GalaxyView />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-engine" element={<AIEngine />} />
          <Route path="/my-notes" element={<MyNotes />} />
          <Route path="/flow-chamber" element={<FlowChamber />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
