import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={isSetupComplete ? <Navigate to="/dashboard" replace /> : <Onboarding onComplete={() => setIsSetupComplete(true)} />} 
        />
        <Route 
          path="/setup" 
          element={<Onboarding onComplete={() => setIsSetupComplete(true)} />} 
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
