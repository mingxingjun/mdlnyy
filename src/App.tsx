import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import AIEngine from '@/pages/AIEngine';
import MyNotes from '@/pages/MyNotes';
import FlowChamber from '@/pages/FlowChamber';
import { ToastContainer } from '@/components/Toast';

export default function App() {
  return (
    <Router basename="/mdlnyy">
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-engine" element={<AIEngine />} />
          <Route path="/my-notes" element={<MyNotes />} />
          <Route path="/flow-chamber" element={<FlowChamber />} />
        </Route>
      </Routes>
    </Router>
  );
}