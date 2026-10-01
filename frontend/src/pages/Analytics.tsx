import { mockAnalytics } from '../mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plane, Activity, Crosshair } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>SYSTEM ANALYTICS & RECONNAISSANCE INTELLIGENCE</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            HIGH-ALTITUDE UAV PATROL FEEDS, INCIDENT FREQUENCY & SENSOR TELEMETRY
          </p>
        </div>
      </div>

      {/* Top Banner: UAV Drone Recon Aerial Imagery */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20, borderColor: 'var(--color-accent)' }}>
        <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plane size={16} color="var(--color-accent)" />
            <h4 style={{ color: 'var(--color-accent)', fontSize: 13, letterSpacing: 1 }}>
              UAV-07 TACTICAL RIDGE PATROL // HIGH-ALTITUDE RECONNAISSANCE
            </h4>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>
            ● GIMBAL: AUTO-TRACKING (ALT: 1,450m AGL)
          </span>
        </div>

        <div style={{ position: 'relative', height: 320, backgroundColor: '#050705', overflow: 'hidden' }}>
          <img 
            src="/drone_aerial_recon.jpg" 
            alt="Drone Reconnaissance Feed" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '1px solid var(--color-border)',
            padding: '6px 12px',
            borderRadius: 4,
            fontSize: 11,
            color: '#fff',
            fontFamily: "'Share Tech Mono', monospace",
            display: 'flex',
            gap: 14
          }}>
            <span>SPEED: 68 KM/H</span>
            <span>HDG: 235°</span>
            <span style={{ color: 'var(--color-accent)' }}>SECTOR: NORTHERN PERIMETER PASS</span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Alerts Over Time */}
        <div className="card">
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={15} color="var(--color-alert)" /> THREAT CONTACT INCIDENTS (LAST 24 HOURS)
          </h4>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={mockAnalytics.alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent)', fontFamily: 'Share Tech Mono', color: 'var(--color-text)' }} />
                <Line type="monotone" dataKey="alerts" stroke="var(--color-alert)" strokeWidth={2.5} dot={{ fill: 'var(--color-alert)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detections by Zone */}
        <div className="card">
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Crosshair size={15} color="var(--color-accent)" /> AI DETECTIONS BY COMBAT SECTOR
          </h4>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={mockAnalytics.detectionsByZone} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent)', fontFamily: 'Share Tech Mono', color: 'var(--color-text)' }} />
                <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
