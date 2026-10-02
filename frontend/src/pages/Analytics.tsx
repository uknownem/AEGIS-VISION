import { useState, useEffect } from 'react';
import { alertSync, type SecurityAlert } from '../utils/alertSync';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plane, Activity, Crosshair, ShieldAlert, CheckCircle2, AlertTriangle, Eye, RefreshCw, Zap } from 'lucide-react';

export default function Analytics() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    // Subscribe to unified live alert service
    const unsubscribe = alertSync.subscribe((liveAlerts) => {
      setAlerts(liveAlerts);
      setLastSyncTime(new Date().toLocaleTimeString());
    });

    return () => unsubscribe();
  }, []);

  // Compute key metrics
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalThreats = alerts.filter(a => a.threat_level === 'CRITICAL').length;
  const acknowledgedAlerts = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED').length;

  // Process alerts for Sector Distribution Chart
  const sectorCounts: { [key: string]: number } = {};
  alerts.forEach(a => {
    const sec = a.sector || 'Unassigned Sector';
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
  });

  const detectionsByZone = Object.keys(sectorCounts).length > 0
    ? Object.keys(sectorCounts).map(sec => ({ name: sec, value: sectorCounts[sec] }))
    : [
        { name: 'LAC Northern Sector', value: 0 },
        { name: 'Perimeter Checkpoint Alpha', value: 0 },
        { name: 'Eastern Ridge Pass', value: 0 },
        { name: 'Main Gate Corridor', value: 0 }
      ];

  // Process alerts for Object Category Breakdown Chart
  const categoryCounts: { [key: string]: number } = {};
  alerts.forEach(a => {
    const cat = a.object_category || a.target_class || 'UNKNOWN ANOMALY';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const detectionsByCategory = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).map(cat => ({ name: cat.replace('_', ' '), count: categoryCounts[cat] }))
    : [
        { name: 'ELECTRONIC GADGET', count: 0 },
        { name: 'METALLIC TOOL', count: 0 },
        { name: 'UAV DRONE', count: 0 },
        { name: 'ARMORED VEHICLE', count: 0 },
        { name: 'THERMAL HEAT SOURCE', count: 0 }
      ];

  // Process alerts for Threat Contact Incident Timeline (Last 24 Hours / Hourly)
  const hourlyDataMap: { [key: string]: number } = {};
  const hours = ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'];
  hours.forEach(h => { hourlyDataMap[h] = 0; });

  alerts.forEach(a => {
    if (a.timestamp) {
      const timePart = a.timestamp.split(' ')[1] || a.timestamp;
      const hourNum = parseInt(timePart.split(':')[0], 10);
      if (!isNaN(hourNum)) {
        if (hourNum < 4) hourlyDataMap['02:00']++;
        else if (hourNum < 8) hourlyDataMap['06:00']++;
        else if (hourNum < 12) hourlyDataMap['10:00']++;
        else if (hourNum < 16) hourlyDataMap['14:00']++;
        else if (hourNum < 20) hourlyDataMap['18:00']++;
        else hourlyDataMap['22:00']++;
      }
    }
  });

  const alertsOverTime = Object.keys(hourlyDataMap).map(time => ({
    time,
    alerts: hourlyDataMap[time]
  }));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>SYSTEM ANALYTICS & RECONNAISSANCE INTELLIGENCE</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            REAL-TIME THREAT TELEMETRY, SECTOR INCURSIONS & TARGET CLASSIFICATION ANALYTICS
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: 'var(--color-success)' }}>
          <RefreshCw size={13} className="animate-spin" />
          <span>LIVE DATA ENGINE SYNCED ({lastSyncTime || 'ACTIVE'})</span>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid-summary" style={{ marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--color-alert)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-alert)' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 'bold' }}>TOTAL INCURSIONS</span>
            <ShieldAlert size={18} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>{totalAlerts}</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            {criticalThreats} CRITICAL // {activeAlerts} ACTIVE ALARMS
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f59e0b' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 'bold' }}>ACTIVE ALERTS</span>
            <AlertTriangle size={18} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: '#f59e0b' }}>{activeAlerts}</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            REQUIRES IMMEDIATE SECTOR ACTION
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-accent)' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 'bold' }}>ACKNOWLEDGED</span>
            <Eye size={18} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-accent)' }}>{acknowledgedAlerts}</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            SENTRY VERIFIED & WATCHED
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-success)' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 'bold' }}>RESOLVED</span>
            <CheckCircle2 size={18} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-success)' }}>{resolvedAlerts}</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
            NEUTRALIZED OR CLEARED
          </div>
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

        <div style={{ position: 'relative', height: 280, backgroundColor: '#050705', overflow: 'hidden' }}>
          <img 
            src="/drone_aerial_recon.jpg" 
            alt="Drone Reconnaissance Feed" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            backgroundColor: 'rgba(0,0,0,0.85)',
            border: '1px solid var(--color-border)',
            padding: '6px 14px',
            borderRadius: 4,
            fontSize: 11,
            color: '#fff',
            fontFamily: "'Share Tech Mono', monospace",
            display: 'flex',
            gap: 16
          }}>
            <span>SPEED: 68 KM/H</span>
            <span>HDG: 235°</span>
            <span style={{ color: 'var(--color-accent)' }}>SECTOR: NORTHERN PERIMETER PASS</span>
            <span style={{ color: 'var(--color-success)' }}>ANOMALY DETECTOR: ACTIVE</span>
          </div>
        </div>
      </div>
      
      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        
        {/* Chart 1: Threat Contact Incidents over time */}
        <div className="card">
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={15} color="var(--color-alert)" /> THREAT INCIDENT TIMELINE (HOURLY DENSITY)
          </h4>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent)', fontFamily: 'Share Tech Mono', color: 'var(--color-text)' }} />
                <Line type="monotone" dataKey="alerts" stroke="var(--color-alert)" strokeWidth={2.5} dot={{ fill: 'var(--color-alert)', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: AI Detections by Combat Sector */}
        <div className="card">
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Crosshair size={15} color="var(--color-accent)" /> INCURSIONS BY COMBAT SECTOR
          </h4>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={detectionsByZone} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent)', fontFamily: 'Share Tech Mono', color: 'var(--color-text)' }} />
                <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Object Category Breakdown */}
      <div className="card">
        <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={15} color="var(--color-warning)" /> TARGET OBJECT CLASSIFICATION BREAKDOWN
        </h4>
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer>
            <BarChart data={detectionsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 10 }} />
              <YAxis stroke="var(--color-text-muted)" tick={{ fontFamily: 'Share Tech Mono', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent)', fontFamily: 'Share Tech Mono', color: 'var(--color-text)' }} />
              <Bar dataKey="count" fill="var(--color-warning)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
