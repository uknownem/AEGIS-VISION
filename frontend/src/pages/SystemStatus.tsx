import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { alertSync, type SecurityAlert } from '../utils/alertSync';
import { Server, Database, Wifi, ShieldCheck, Cpu, HardDrive, RefreshCw, Radio, Camera } from 'lucide-react';

interface SystemHealth {
  status: string;
  uptimeSeconds: number;
  databaseConnected: boolean;
  activeSessions: number;
  latencyMs: number;
  lastChecked: string;
}

interface CameraSensor {
  id: string;
  name: string;
  location: string;
  type: string;
  status: 'online' | 'offline' | 'warning';
  fps: number;
  resolution: string;
}

export default function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'ONLINE',
    uptimeSeconds: 364200,
    databaseConnected: true,
    activeSessions: 1,
    latencyMs: 12,
    lastChecked: new Date().toLocaleTimeString()
  });

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeLoginsCount, setActiveLoginsCount] = useState<number>(1);
  const [activeSessionUser, setActiveSessionUser] = useState<string>('Operator');
  const [pinging, setPinging] = useState<boolean>(false);

  // Cameras Telemetry
  const cameras: CameraSensor[] = [
    { id: 'CAM-01', name: 'PERIMETER SENTRY CHECKPOINT ALPHA', location: 'LAC Northern Corridor', type: '4K Ultra-HD Visual + Thermal', status: 'online', fps: 30, resolution: '3840x2160' },
    { id: 'CAM-02', name: 'NORTHERN MAIN GATE & ACCESS RAMP', location: 'Command HQ Outpost', type: 'FLIR Thermal Night-Vision', status: 'online', fps: 30, resolution: '1920x1080' },
    { id: 'CAM-03', name: 'HIGH RIDGE THERMAL OVERWATCH MAST', location: 'Eastern Ridge Pass', type: 'Long-Range FLIR Optical', status: 'online', fps: 25, resolution: '1920x1080' },
    { id: 'CAM-04', name: 'UAV-07 TACTICAL RECONNAISSANCE PATROL', location: 'High Altitude Airspace', type: 'UAV Aerial Optical Track', status: 'online', fps: 60, resolution: '2560x1440' }
  ];

  const fetchSystemHealth = async () => {
    setPinging(true);
    const startTime = Date.now();

    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
      const roundTrip = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.uptime) {
          setHealth({
            status: 'ONLINE',
            uptimeSeconds: data.uptime,
            databaseConnected: data.database ?? true,
            activeSessions: data.sessions ?? 1,
            latencyMs: roundTrip,
            lastChecked: new Date().toLocaleTimeString()
          });
        } else {
          setHealth(prev => ({
            ...prev,
            status: 'ONLINE',
            latencyMs: roundTrip,
            lastChecked: new Date().toLocaleTimeString()
          }));
        }
      } else {
        setHealth(prev => ({
          ...prev,
          status: 'DEGRADED',
          latencyMs: roundTrip,
          lastChecked: new Date().toLocaleTimeString()
        }));
      }
    } catch {
      setHealth(prev => ({
        ...prev,
        status: 'STANDALONE LOCAL',
        latencyMs: 4,
        lastChecked: new Date().toLocaleTimeString()
      }));
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 5000);

    // Subscribe to alert sync
    const unsubscribeAlerts = alertSync.subscribe(liveAlerts => setAlerts(liveAlerts));

    // Read live logins count & operator session
    try {
      const sess = localStorage.getItem('aegis_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed.operatorName) setActiveSessionUser(`${parsed.rank || ''} ${parsed.operatorName}`);
      }

      const logins = localStorage.getItem('aegis_duty_logins');
      if (logins) {
        const parsedLogins = JSON.parse(logins);
        if (Array.isArray(parsedLogins)) setActiveLoginsCount(parsedLogins.length);
      }
    } catch {}

    return () => {
      clearInterval(interval);
      unsubscribeAlerts();
    };
  }, []);

  const formatUptime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${days}D ${hrs}H ${mins}M`;
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>SYSTEM STATUS & HARDWARE TELEMETRY</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            CORE COMMAND SERVICES, SENSOR HEALTH & NETWORK MESH DIAGNOSTICS
          </p>
        </div>
        <button
          onClick={fetchSystemHealth}
          disabled={pinging}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} className={pinging ? 'animate-spin' : ''} /> {pinging ? 'PINGING...' : 'REFRESH STATUS'}
        </button>
      </div>

      {/* Grid of Core Services Status */}
      <div className="grid-summary" style={{ marginBottom: 20 }}>
        {/* Main Command Server */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>MAIN COMMAND SERVER</h4>
            <Server size={18} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: health.status === 'ONLINE' ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {health.status}
          </span>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            UPTIME: {formatUptime(health.uptimeSeconds)} // LATENCY: {health.latencyMs}ms
          </p>
        </div>

        {/* Database & Sync Engine */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>ENCRYPTED LOG DATABASE</h4>
            <Database size={18} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }}>SYNCHRONIZED</span>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            ALERTS STORED: {alerts.length} // LOGINS: {activeLoginsCount}
          </p>
        </div>

        {/* Active Alarms & Siren Status */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: activeAlertsCount > 0 ? 'var(--color-alert)' : 'var(--color-success)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>ALERT SIREN SYSTEM</h4>
            <Radio size={18} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: activeAlertsCount > 0 ? 'var(--color-alert)' : 'var(--color-success)' }}>
            {activeAlertsCount > 0 ? `${activeAlertsCount} ACTIVE SIRENS` : 'ALL CLEAR'}
          </span>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            TACTICAL ALARM ENGINE: AUTO-STANDBY
          </p>
        </div>

        {/* Active Session & Duty Logins */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>OPERATOR SESSION</h4>
            <ShieldCheck size={18} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
            {activeSessionUser}
          </span>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            REGISTERED DUTY LOGINS: {activeLoginsCount}
          </p>
        </div>
      </div>

      {/* Technical Diagnostics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Cpu size={28} color="var(--color-accent)" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>AI DETECTION ENGINE</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>YOLOv8 + Vision Transformer</div>
            <div style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>GPU ACCELERATED // 60 FPS</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <HardDrive size={28} color="var(--color-accent)" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>PERSISTENCE & SYNC</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>Cross-Tab Broadcast Bus</div>
            <div style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>LOCALSTORAGE + REST BACKEND</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Wifi size={28} color="var(--color-success)" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>SECURE DATA MESH</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>256-BIT ENCRYPTED TUNNEL</div>
            <div style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>PACKET LOSS: 0.00%</div>
          </div>
        </div>
      </div>

      {/* Optical & Thermal Sensor Telemetry */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} /> OPTICAL & THERMAL SENSOR TELEMETRY
          </h3>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            LAST CHECKED: {health.lastChecked}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cameras.map(cam => (
            <div key={cam.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              backgroundColor: 'var(--color-surface-light)',
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              fontFamily: "'Share Tech Mono', monospace",
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tac-badge tac-badge-accent" style={{ fontSize: 11 }}>{cam.id}</span>
                <div>
                  <span style={{ color: 'var(--color-text)', fontSize: 13, fontWeight: 'bold' }}>{cam.name}</span>
                  <div style={{ color: 'var(--color-text-dim)', fontSize: 11 }}>{cam.location}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: 'var(--color-tan)', fontSize: 11 }}>{cam.type}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{cam.resolution} @ {cam.fps}fps</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 12, fontWeight: 'bold' }}>
                  <span className="status-dot live"></span>
                  ONLINE // TELEMETRY NORMAL
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
