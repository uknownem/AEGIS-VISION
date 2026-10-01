import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DemoPage from './pages/DemoPage';
import Onboarding from './pages/Onboarding';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import CameraMonitoring from './pages/CameraMonitoring';
import AlertCenter from './pages/AlertCenter';
import RestrictedZones from './pages/RestrictedZones';
import Personnel from './pages/Personnel';
import Analytics from './pages/Analytics';
import SystemStatus from './pages/SystemStatus';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Tactical Operator Login & Base Location / Camera Setup */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* 2. Interactive Tactical Capabilities Demo Showcase */}
        <Route path="/demo" element={<DemoPage />} />

        {/* 3. Setup Wizard */}
        <Route path="/setup" element={<Onboarding />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* 4. Full Tactical Command & Defense Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="cameras" element={<Navigate to="/dashboard/camera/CAM-01" replace />} />
          <Route path="camera/:id" element={<CameraMonitoring />} />
          <Route path="alerts" element={<AlertCenter />} />
          <Route path="zones" element={<RestrictedZones />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="status" element={<SystemStatus />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
