import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Map, Bell, Users, BarChart3, Activity, Settings, Crosshair, MapPin, Clock } from 'lucide-react';

export default function DashboardLayout() {
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="app-container">
      {/* Icon-only Sidebar */}
      <div className="sidebar">
        <Crosshair size={24} color="var(--color-accent)" style={{ marginBottom: 20 }} />
        <NavLink to="/dashboard" end title="Overview"><LayoutDashboard size={18} /></NavLink>
        <NavLink to="/dashboard/cameras" title="Cameras"><Video size={18} /></NavLink>
        <NavLink to="/dashboard/zones" title="Zones"><Map size={18} /></NavLink>
        <NavLink to="/dashboard/alerts" title="Alerts" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, backgroundColor: 'var(--color-alert)', borderRadius: '50%' }}></span>
        </NavLink>
        <NavLink to="/dashboard/personnel" title="Personnel"><Users size={18} /></NavLink>
        <NavLink to="/dashboard/analytics" title="Analytics"><BarChart3 size={18} /></NavLink>
        <NavLink to="/dashboard/status" title="System"><Activity size={18} /></NavLink>
        <div style={{ marginTop: 'auto', opacity: 0.5 }}><Settings size={18} /></div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <span style={{ fontWeight: 'bold', letterSpacing: 2 }}>AEGIS VISION</span>
          </div>
          
          <div style={{ display: 'flex', gap: 30, color: 'var(--color-text-muted)' }}>
            <NavLink to="/dashboard" end style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>OVERVIEW</NavLink>
            <NavLink to="/dashboard/zones" style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>UNIT MAP</NavLink>
            <NavLink to="/setup" style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>SETUP</NavLink>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} /> NEW DELHI, INDIA</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} /> {timeStr}</span>
          </div>
        </div>
        
        <div className="dashboard-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
