import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import { ToastContainer } from '@/components/Toast';

export default function App() {
  return (
    <Router basename="/mdlnyy">
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
