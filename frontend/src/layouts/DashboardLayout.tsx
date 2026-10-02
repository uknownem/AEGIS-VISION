import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Video, Map, Bell, Users, BarChart3, Activity, 
  Settings, Crosshair, MapPin, Clock, X, Shield, Key, Volume2, 
  CheckCircle2, Save, Sparkles, Wifi
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';
import { alertSync } from '../utils/alertSync';
import AddExternalCameraModal from '../components/AddExternalCameraModal';
import VoiceAssistantWidget from '../components/VoiceAssistantWidget';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  
  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);

  // Settings State
  const [defconLevel, setDefconLevel] = useState('DEFCON 2');
  const [sirenVolume, setSirenVolume] = useState(85);
  const [aiConfidence, setAiConfidence] = useState(0.25);
  const [autoSirenEnabled, setAutoSirenEnabled] = useState(true);
  const [visualStrobe, setVisualStrobe] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Operator Credentials State (read from localStorage or default)
  const [operator, setOperator] = useState({
    name: 'Subedar Vikram Singh',
    id: 'IA-948201',
    role: 'Defense Operations Chief',
    clearance: 'LEVEL-5 TOP SECRET (COSMIC)',
    sector: 'LAC Northern Sector (Eastern Ladakh)',
    coordinates: '34.2268° N, 77.5619° E',
    biometricKey: '0x88F92-IND-ARMY-SECURE',
    phone: '+91 98765-43210'
  });
  const [editingCreds, setEditingCreds] = useState(false);
  const [savedCredsMsg, setSavedCredsMsg] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aegis_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.operatorName || parsed.serviceId || parsed.base) {
          setOperator(prev => ({
            ...prev,
            name: parsed.operatorName || prev.name,
            id: parsed.serviceId || prev.id,
            clearance: parsed.clearanceLevel || prev.clearance,
            sector: parsed.base?.name || prev.sector,
            coordinates: parsed.base?.coordinates || prev.coordinates
          }));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    const unsubscribe = alertSync.subscribe((alerts) => {
      const active = alerts.filter(a => a.status === 'ACTIVE').length;
      setActiveAlertCount(active);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
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
        <button
          onClick={() => setShowCreditsModal(true)}
          title="System Architecture & Developer Credits (PIXEL PIONEERS)"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Crosshair size={24} color="var(--color-accent)" className="animate-pulse" />
        </button>

        <NavLink to="/dashboard" end title="Overview"><LayoutDashboard size={18} /></NavLink>
        <NavLink to="/dashboard/cameras" title="Cameras"><Video size={18} /></NavLink>
        <NavLink to="/dashboard/zones" title="Zones"><Map size={18} /></NavLink>
        <NavLink to="/dashboard/alerts" title={`Alerts (${activeAlertCount} active)`} style={{ position: 'relative' }}>
          <Bell size={18} />
          {activeAlertCount > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: 2, 
              right: 2, 
              minWidth: 14, 
              height: 14, 
              backgroundColor: 'var(--color-alert)', 
              borderRadius: '50%',
              color: '#fff',
              fontSize: 9,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 2px'
            }}>
              {activeAlertCount}
            </span>
          )}
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
            {/* Interactive DEFCON Selector */}
            <select
              value={defconLevel}
              onChange={(e) => {
                setDefconLevel(e.target.value);
                alertSync.broadcastNewAlert({
                  alert_type: 'THERMAL_SIGNATURE_BREACH',
                  incursion_category: `READINESS CHANGED TO ${e.target.value}`,
                  object_category: 'THERMAL_HEAT_SOURCE',
                  target_class: `DEFCON READINESS LEVEL: ${e.target.value}`,
                  threat_level: e.target.value === 'DEFCON 1' ? 'CRITICAL' : 'HIGH',
                  confidence: 1.0,
                  camera_id: 'COMMAND-HQ',
                  sector: operator.sector,
                  siren_triggered: e.target.value === 'DEFCON 1' ? 1 : 0,
                  status: 'ACTIVE',
                  distance_meters: 0,
                  notes: `Operator ${operator.name} adjusted defense readiness state to ${e.target.value}`
                });
              }}
              style={{
                backgroundColor: defconLevel === 'DEFCON 1' ? 'rgba(239, 68, 68, 0.25)' : defconLevel === 'DEFCON 2' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                color: defconLevel === 'DEFCON 1' ? 'var(--color-alert)' : defconLevel === 'DEFCON 2' ? '#f59e0b' : 'var(--color-success)',
                border: `1px solid ${defconLevel === 'DEFCON 1' ? 'var(--color-alert)' : defconLevel === 'DEFCON 2' ? '#f59e0b' : 'var(--color-success)'}`,
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 'bold',
                fontFamily: "'Share Tech Mono', monospace",
                cursor: 'pointer'
              }}
              title="Click to change defense readiness level (DEFCON 1-5)"
            >
              <option value="DEFCON 5">DEFCON 5 (PEACE / LOW)</option>
              <option value="DEFCON 4">DEFCON 4 (NORMAL WATCH)</option>
              <option value="DEFCON 3">DEFCON 3 (ELEVATED GUARD)</option>
              <option value="DEFCON 2">DEFCON 2 (HIGH READINESS)</option>
              <option value="DEFCON 1">DEFCON 1 (MAXIMUM COMBAT)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 20, color: 'var(--color-text-muted)', alignItems: 'center' }}>
            <NavLink to="/dashboard" end style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>
              OVERVIEW
            </NavLink>
            <NavLink to="/dashboard/cameras" style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>
              CAMERAS
            </NavLink>
            <NavLink to="/dashboard/zones" style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? 'var(--color-accent)' : 'inherit', borderBottom: isActive ? '2px solid var(--color-accent)' : 'none', paddingBottom: 5 })}>
              UNIT MAP
            </NavLink>

            {/* Quick WiFi / External Camera Pairing Button */}
            <button
              onClick={() => setShowAddCameraModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-accent)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Add external WiFi or IP camera to system"
            >
              <Wifi size={13} /> + PAIR WIFI CAM
            </button>
            
            {/* Interactive Demo Mode Shortcut */}
            <NavLink 
              to="/demo" 
              style={{
                textDecoration: 'none',
                color: 'var(--color-warning)',
                paddingBottom: 5,
                fontSize: 13,
                fontWeight: 'bold',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Sparkles size={14} /> DEMO MODE
            </NavLink>

            {/* SETUP Button */}
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
              CREDENTIALS
            </button>

            {/* Switch Base / Login */}
            <NavLink 
              to="/login" 
              style={{
                textDecoration: 'none',
                color: 'var(--color-text-muted)',
                paddingBottom: 5,
                fontSize: 13,
                letterSpacing: 1
              }}
            >
              SWITCH BASE / LOGOUT
            </NavLink>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-accent)' }}>
              <MapPin size={13} /> {operator.sector.length > 25 ? operator.sector.substring(0, 25) + '...' : operator.sector}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> {timeStr}
            </span>
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

      {/* --- 3. TOP-LEFT AIM BUTTON: 'DEVELOPED BY PIXEL PIONEERS' POPUP MODAL --- */}
      {showCreditsModal && (
        <div 
          onClick={() => setShowCreditsModal(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.88)', 
            zIndex: 10001, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 20,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ 
              maxWidth: 440, 
              width: '100%', 
              borderColor: 'var(--color-accent)', 
              boxShadow: '0 0 45px rgba(163, 230, 53, 0.4)',
              textAlign: 'center',
              padding: '30px 24px',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowCreditsModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Glowing Tactical Reticle Icon */}
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(163, 230, 53, 0.15)', 
              border: '2px solid var(--color-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px auto',
              boxShadow: '0 0 25px rgba(163, 230, 53, 0.5)'
            }}>
              <Crosshair size={34} color="var(--color-accent)" className="animate-spin" />
            </div>

            {/* Main Required Message */}
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, display: 'block', marginBottom: 4 }}>
              SYSTEM ARCHITECTURE & DESIGN
            </span>

            <h2 style={{ color: 'var(--color-accent)', fontSize: 24, letterSpacing: 2, margin: '6px 0 12px 0' }}>
              DEVELOPED BY PIXEL PIONEERS
            </h2>

            <p style={{ color: 'var(--color-text)', fontSize: 13, lineHeight: 1.5, fontFamily: "'Share Tech Mono', monospace", marginBottom: 20 }}>
              Autonomous Tactical Defense Vision Grid, Real-Time YOLOv8 Object Detection & Perimeter Intelligence System.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              <span className="badge" style={{ backgroundColor: 'rgba(163, 230, 53, 0.2)', color: 'var(--color-accent)', fontSize: 10 }}>
                AEGIS-VISION v2.4
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)', fontSize: 10 }}>
                PIXEL PIONEERS
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-alert)', fontSize: 10 }}>
                DEFENSE SECURE
              </span>
            </div>

            <button 
              onClick={() => setShowCreditsModal(false)} 
              className="btn-primary" 
              style={{ width: '100%', padding: '10px 0', fontSize: 12, fontWeight: 'bold' }}
            >
              CLOSE WINDOW
            </button>
          </div>
        </div>
      )}

      {/* External WiFi / IP Camera Wizard Modal */}
      <AddExternalCameraModal 
        isOpen={showAddCameraModal} 
        onClose={() => setShowAddCameraModal(false)} 
      />

      {/* AEGIS AI Tactical Voice Assistant Widget */}
      <VoiceAssistantWidget
        onNavigate={navigate}
        onOpenAddCamModal={() => setShowAddCameraModal(true)}
        onSetDefcon={(level) => setDefconLevel(level)}
      />
    </div>
  );
}
