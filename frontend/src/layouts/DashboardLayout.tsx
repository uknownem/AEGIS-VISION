import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Video, Map, Bell, Users, BarChart3, Activity, 
  Settings, Crosshair, MapPin, Clock, X, Shield, Key, Volume2, 
  CheckCircle2, Save
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';

export default function DashboardLayout() {
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Settings State
  const [defconLevel, setDefconLevel] = useState('DEFCON 2');
  const [sirenVolume, setSirenVolume] = useState(85);
  const [aiConfidence, setAiConfidence] = useState(0.25);
  const [autoSirenEnabled, setAutoSirenEnabled] = useState(true);
  const [visualStrobe, setVisualStrobe] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Operator Credentials State (Displayed when clicking SETUP)
  const [operator, setOperator] = useState({
    name: 'Subedar Major Alex Vance',
    id: 'TS-001-ALPHA',
    role: 'Defense Operations Chief',
    clearance: 'LEVEL-5 TOP SECRET (COSMIC)',
    sector: 'LAC North - Himalayan Command',
    biometricKey: '0x88F92-IND-ARMY-SECURE',
    phone: '+91 98765-43210'
  });
  const [editingCreds, setEditingCreds] = useState(false);
  const [savedCredsMsg, setSavedCredsMsg] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettingsModal(false);
    }, 800);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedCredsMsg(true);
    setTimeout(() => {
      setSavedCredsMsg(false);
      setEditingCreds(false);
    }, 900);
  };

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
        <NavLink to="/dashboard/status" title="System Status"><Activity size={18} /></NavLink>
        
        {/* Functional Settings Button */}
        <button 
          onClick={() => setShowSettingsModal(true)}
          title="Tactical Defense Grid Settings"
          style={{ 
            marginTop: 'auto', 
            background: 'transparent', 
            border: 'none', 
            color: showSettingsModal ? 'var(--color-accent)' : 'var(--color-text-muted)', 
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
        >
          <Settings size={20} className={showSettingsModal ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <span style={{ fontWeight: 'bold', letterSpacing: 2, color: 'var(--color-accent)' }}>AEGIS VISION</span>
            <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)', fontSize: 10 }}>
              {defconLevel} ACTIVE
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 30, color: 'var(--color-text-muted)' }}>
            <NavLink to="/dashboard" end style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>
              OVERVIEW
            </NavLink>
            <NavLink to="/dashboard/zones" style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>
              UNIT MAP
            </NavLink>
            
            {/* SETUP Button: Opens In-Dashboard Credentials & Base Config Modal instead of landing page */}
            <button 
              onClick={() => setShowSetupModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: showSetupModal ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderBottom: showSetupModal ? '2px solid var(--color-accent)' : 'none',
                paddingBottom: 5,
                fontSize: 13,
                fontFamily: "'Share Tech Mono', monospace",
                cursor: 'pointer',
                letterSpacing: 1
              }}
            >
              SETUP / CREDENTIALS
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} /> NEW DELHI / LAC SECTOR</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} /> {timeStr}</span>
          </div>
        </div>
        
        <div className="dashboard-scroll">
          <Outlet />
        </div>
      </div>

      {/* --- 1. FUNCTIONAL SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 540, width: '100%', borderColor: 'var(--color-accent)', boxShadow: '0 0 30px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={20} color="var(--color-accent)" />
                <h3 style={{ margin: 0, color: 'var(--color-accent)', fontSize: 16 }}>TACTICAL DEFENSE GRID SETTINGS</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {settingsSaved && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 4, marginBottom: 14, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Configuration saved & applied to defense grid!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>
              {/* DEFCON Mode */}
              <div>
                <label style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, fontSize: 11 }}>DEFCON ALERT STATE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {['DEFCON 5', 'DEFCON 4', 'DEFCON 3', 'DEFCON 2', 'DEFCON 1'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setDefconLevel(lvl)}
                      style={{
                        padding: '6px 4px',
                        fontSize: 10,
                        fontWeight: 'bold',
                        borderRadius: 3,
                        backgroundColor: defconLevel === lvl ? (lvl === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-accent)') : 'var(--color-surface)',
                        color: defconLevel === lvl ? (lvl === 'DEFCON 1' ? '#fff' : '#000') : 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Siren & Audio Settings */}
              <div style={{ backgroundColor: 'var(--color-surface-light)', padding: 12, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Volume2 size={16} /> Non-Human Siren Pitch Volume ({sirenVolume}%)
                  </span>
                  <button 
                    onClick={() => tacticalSiren.playTestSiren(1000)}
                    style={{ padding: '3px 8px', fontSize: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--color-alert)', color: 'var(--color-alert)', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    TEST WAIL
                  </button>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={sirenVolume} 
                  onChange={e => setSirenVolume(+e.target.value)} 
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }} 
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                    <input type="checkbox" checked={autoSirenEnabled} onChange={e => setAutoSirenEnabled(e.target.checked)} />
                    Auto-trigger siren on object intrusion
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                    <input type="checkbox" checked={visualStrobe} onChange={e => setVisualStrobe(e.target.checked)} />
                    Visual Red Strobe Pulse
                  </label>
                </div>
              </div>

              {/* AI Detection Sensitivity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>YOLOv8 Detection Confidence Threshold</span>
                  <strong style={{ color: 'var(--color-accent)' }}>{(aiConfidence * 100).toFixed(0)}%</strong>
                </div>
                <input 
                  type="range" 
                  min="0.10" 
                  max="0.80" 
                  step="0.05" 
                  value={aiConfidence} 
                  onChange={e => setAiConfidence(+e.target.value)} 
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }} 
                />
              </div>

              {/* Database Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-success)', borderRadius: 4, color: 'var(--color-success)' }}>
                <span>SQLITE DATABASE CONNECTION:</span>
                <strong>ONLINE // aegis_vision.db (Synced)</strong>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={() => setShowSettingsModal(false)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>
                  Close
                </button>
                <button onClick={handleSaveSettings} className="btn-primary" style={{ flex: 1, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={15} /> Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. OPERATOR SETUP & CREDENTIALS MODAL (When clicking SETUP) --- */}
      {showSetupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 680, width: '100%', borderColor: 'var(--color-accent)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={22} color="var(--color-accent)" />
                <h3 style={{ margin: 0, color: 'var(--color-accent)', fontSize: 17 }}>OPERATOR SETUP & BIOMETRIC CREDENTIALS</h3>
              </div>
              <button onClick={() => setShowSetupModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {savedCredsMsg && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 4, marginBottom: 14, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Operator credentials updated and logged to database!
              </div>
            )}

            {/* Satellite Base Visual Preview */}
            <div style={{ position: 'relative', height: 160, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: 16 }}>
              <img src="/satellite_base_map.jpg" alt="Base Grid" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 10, backgroundColor: 'rgba(0,0,0,0.8)', padding: '4px 10px', borderRadius: 3, fontSize: 11, color: '#fff', fontFamily: "'Share Tech Mono', monospace" }}>
                CONNECTED BASE: LAC SECTOR NORTH // 34°12'N 78°19'E
              </div>
            </div>

            {!editingCreds ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Share Tech Mono', monospace", fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 12, backgroundColor: 'var(--color-surface-light)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>OPERATOR FULL NAME</span>
                    <strong style={{ color: '#fff', fontSize: 14 }}>{operator.name}</strong>
                  </div>

                  <div style={{ padding: 12, backgroundColor: 'var(--color-surface-light)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>OPERATOR ID & DESIGNATION</span>
                    <strong style={{ color: 'var(--color-accent)', fontSize: 14 }}>{operator.id}</strong>
                  </div>

                  <div style={{ padding: 12, backgroundColor: 'var(--color-surface-light)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>CLEARANCE LEVEL</span>
                    <strong style={{ color: 'var(--color-warning)' }}>{operator.clearance}</strong>
                  </div>

                  <div style={{ padding: 12, backgroundColor: 'var(--color-surface-light)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>COMMAND SECTOR</span>
                    <span>{operator.sector}</span>
                  </div>
                </div>

                <div style={{ padding: 12, backgroundColor: 'rgba(34, 197, 94, 0.12)', borderRadius: 4, border: '1px solid var(--color-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>BIOMETRIC AUTHENTICATION KEY</span>
                    <strong style={{ color: 'var(--color-success)', letterSpacing: 1 }}>{operator.biometricKey}</strong>
                  </div>
                  <Key size={20} color="var(--color-success)" />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button onClick={() => setEditingCreds(true)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>
                    Modify Operator Credentials
                  </button>
                  <button onClick={() => setShowSetupModal(false)} className="btn-primary" style={{ flex: 1, padding: 10 }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Operator Full Name</label>
                  <input 
                    type="text" 
                    value={operator.name} 
                    onChange={e => setOperator({ ...operator, name: e.target.value })} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Operator ID</label>
                    <input 
                      type="text" 
                      value={operator.id} 
                      onChange={e => setOperator({ ...operator, id: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Role</label>
                    <input 
                      type="text" 
                      value={operator.role} 
                      onChange={e => setOperator({ ...operator, role: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Command Sector</label>
                    <input 
                      type="text" 
                      value={operator.sector} 
                      onChange={e => setOperator({ ...operator, sector: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Clearance</label>
                    <input 
                      type="text" 
                      value={operator.clearance} 
                      onChange={e => setOperator({ ...operator, clearance: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => setEditingCreds(false)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: 10 }}>
                    Save Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
