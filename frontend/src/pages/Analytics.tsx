import { mockAnalytics } from '../mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Analytics() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>SYSTEM ANALYTICS</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>DETECTION FREQUENCY AND ALERT METRICS</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Alerts Over Time */}
        <div className="card">
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5 }}>THREAT CONTACT INCIDENTS (LAST 24 HOURS)</h4>
          <div style={{ height: 300, width: '100%' }}>
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
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5 }}>AI DETECTIONS BY COMBAT SECTOR</h4>
          <div style={{ height: 300, width: '100%' }}>
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
