import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import AIEngine from '@/pages/AIEngine';
import PeerHub from '@/pages/PeerHub';
import FlowChamber from '@/pages/FlowChamber';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-engine" element={<AIEngine />} />
          <Route path="peer-hub" element={<PeerHub />} />
          <Route path="flow-chamber" element={<FlowChamber />} />
        </Route>
      </Routes>
    </Router>
  );
}
