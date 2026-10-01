import { mockCameras } from '../mockData';
import { Server, Database, Wifi } from 'lucide-react';

export default function SystemStatus() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>SYSTEM STATUS</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>CORE SERVICES AND SENSOR HEALTH MONITORING</p>
        </div>
      </div>

      <div className="grid-summary">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>MAIN COMMAND SERVER</h4>
            <Server size={18} />
          </div>
          <span style={{ fontSize: 24, color: 'var(--color-accent)' }}>OPERATIONAL</span>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>UPTIME: 99.98% // 42 DAYS</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>ENCRYPTED LOG DATABASE</h4>
            <Database size={18} />
          </div>
          <span style={{ fontSize: 24, color: 'var(--color-text)' }}>SYNCHRONIZED</span>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>LATENCY: 8MS // POSTGRES+VECTOR</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
            <h4 style={{ fontSize: 13, letterSpacing: 1.5 }}>TACTICAL RADIO / MESH</h4>
            <Wifi size={18} />
          </div>
          <span style={{ fontSize: 24, color: 'var(--color-warning)' }}>DEGRADED (2%)</span>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>PACKET LOSS ON SEC-B RELAY</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: 'var(--color-accent)' }}>OPTICAL & THERMAL SENSOR TELEMETRY</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mockCameras.map(cam => (
            <div key={cam.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', backgroundColor: 'var(--color-surface-light)', borderRadius: 3, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tac-badge tac-badge-accent" style={{ fontSize: 11 }}>{cam.id}</span>
                <span style={{ color: 'var(--color-text)', fontSize: 13 }}>{cam.name}</span>
                <span style={{ color: 'var(--color-tan)', fontSize: 12 }}>({cam.type})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: cam.status === 'live' ? 'var(--color-accent)' : 'var(--color-alert)', fontSize: 12 }}>
                <span className={`status-dot ${cam.status}`}></span>
                {cam.status === 'live' ? 'ONLINE // FEED NORMAL' : 'DATA-LINK LOST'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
