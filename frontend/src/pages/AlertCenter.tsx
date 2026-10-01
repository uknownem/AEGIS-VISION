import { useState, useEffect } from 'react';
import { Clock, MapPin, Eye, CheckCircle, Siren, RefreshCw, Filter, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tacticalSiren } from '../utils/siren';

interface SecurityAlert {
  id: number;
  alert_type: string;
  target_class: string;
  confidence: number;
  camera_id: string;
  sector: string;
  siren_triggered: number | boolean;
  status: string;
  distance_meters: number;
  notes: string;
  timestamp: string;
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingSiren, setTestingSiren] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Fetch persistent alerts from FastAPI SQLite Database
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL' 
        ? 'http://localhost:8000/api/alerts'
        : `http://localhost:8000/api/alerts?status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setAlerts(json.data);
        }
      } else {
        // Fallback demo records if backend is standalone
        setAlerts([
          { id: 1, alert_type: 'NON_HUMAN_INTRUSION', target_class: 'Main Battle Tank / BMP', confidence: 0.965, camera_id: 'CAM-07', sector: 'LAC Northern Sector', siren_triggered: 1, status: 'ACTIVE', distance_meters: 48.2, notes: 'Armored vehicle detected at snow transit corridor', timestamp: '2026-10-01 14:24:12' },
          { id: 2, alert_type: 'NON_HUMAN_INTRUSION', target_class: 'charger / spoon / object', confidence: 0.930, camera_id: 'CAM-01', sector: 'Perimeter Fence Alpha', siren_triggered: 1, status: 'ACKNOWLEDGED', distance_meters: 1.4, notes: 'Non-human object detected within restricted base radius', timestamp: '2026-10-01 14:10:00' },
          { id: 3, alert_type: 'CAMOUFLAGE_BREACH', target_class: 'Thermal Signature (Unknown)', confidence: 0.88, camera_id: 'CAM-02', sector: 'Hangar North', siren_triggered: 0, status: 'RESOLVED', distance_meters: 12.0, notes: 'Night vision perimeter movement verified by operator', timestamp: '2026-10-01 13:45:00' }
        ]);
      }
    } catch {
      setAlerts([
        { id: 1, alert_type: 'NON_HUMAN_INTRUSION', target_class: 'Main Battle Tank / BMP', confidence: 0.965, camera_id: 'CAM-07', sector: 'LAC Northern Sector', siren_triggered: 1, status: 'ACTIVE', distance_meters: 48.2, notes: 'Armored vehicle detected at snow transit corridor', timestamp: '2026-10-01 14:24:12' },
        { id: 2, alert_type: 'NON_HUMAN_INTRUSION', target_class: 'charger / spoon / object', confidence: 0.930, camera_id: 'CAM-01', sector: 'Perimeter Fence Alpha', siren_triggered: 1, status: 'ACKNOWLEDGED', distance_meters: 1.4, notes: 'Non-human object detected within restricted base radius', timestamp: '2026-10-01 14:10:00' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleTestSiren = () => {
    setTestingSiren(true);
    tacticalSiren.playTestSiren(1400);
    setTimeout(() => {
      setTestingSiren(false);
    }, 1450);
  };

  // Update status in SQLite Database
  const handleAcknowledgeOrResolve = async (id: number, nextStatus: string) => {
    try {
      await fetch(`http://localhost:8000/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, notes: `Operator acknowledged at ${new Date().toLocaleTimeString()}` })
      });
      fetchAlerts();
    } catch {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
    }
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="animate-fade-in">
      {/* Header & Siren Test */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>SECURITY ALERT & SIREN LOG CENTER</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            SQLITE PERSISTED INCURSIONS, NON-HUMAN DETECTION LOGS & SIREN DISPATCHES
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            onClick={fetchAlerts}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> REFRESH
          </button>

          <button 
            onClick={handleTestSiren}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: testingSiren ? 'var(--color-alert)' : 'rgba(239, 68, 68, 0.18)',
              border: '1px solid var(--color-alert)',
              color: '#fff',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 'bold'
            }}
          >
            <Siren size={16} className={testingSiren ? "animate-pulse" : ""} />
            {testingSiren ? 'SIREN WAILING...' : 'TEST TACTICAL SIREN'}
          </button>
        </div>
      </div>

      {/* Filter and Status Counts Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: 'var(--color-surface)', padding: '10px 16px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>FILTER BY STATUS:</span>
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 3,
                backgroundColor: filterStatus === st ? 'var(--color-accent)' : 'transparent',
                color: filterStatus === st ? '#000' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontWeight: filterStatus === st ? 'bold' : 'normal'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontFamily: "'Share Tech Mono', monospace", display: 'flex', gap: 14 }}>
          <span style={{ color: activeAlertsCount > 0 ? 'var(--color-alert)' : 'var(--color-success)', fontWeight: 'bold' }}>
            ● {activeAlertsCount} ACTIVE INTRUSIONS
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            TOTAL PERSISTED: {alerts.length}
          </span>
        </div>
      </div>
      
      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {alerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 30 }}>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>No security alerts found matching the selected filter.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className="card" 
              style={{ 
                borderColor: alert.status === 'ACTIVE' ? 'var(--color-alert)' : 'var(--color-border)', 
                backgroundColor: alert.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-surface)',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                {/* Security Snapshot Image Preview */}
                <div style={{ position: 'relative', width: 110, height: 75, borderRadius: 4, overflow: 'hidden', border: alert.status === 'ACTIVE' ? '1px solid var(--color-alert)' : '1px solid var(--color-border)', flexShrink: 0 }}>
                  <img 
                    src={alert.camera_id === 'CAM-07' || alert.target_class.includes('Tank') ? '/cctv_himalayan_feed.jpg' : '/thermal_flir_alert.jpg'} 
                    alt="Incursion Snapshot" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 3px', borderRadius: 2, fontFamily: "'Share Tech Mono', monospace" }}>
                    {alert.camera_id}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, color: alert.status === 'ACTIVE' ? 'var(--color-alert)' : 'var(--color-text)', fontSize: 15 }}>
                      #{alert.id} &bull; {alert.alert_type.replace(/_/g, ' ')}
                    </h3>
                    <span className="badge" style={{ 
                      backgroundColor: alert.status === 'ACTIVE' ? 'var(--color-alert)' : (alert.status === 'ACKNOWLEDGED' ? 'var(--color-warning)' : 'var(--color-success)'), 
                      color: '#fff', 
                      fontSize: 10 
                    }}>
                      {alert.status}
                    </span>
                    {alert.siren_triggered && (
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-alert)', border: '1px solid var(--color-alert)', fontSize: 10 }}>
                        🚨 SIREN LOGGED
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} /> {alert.timestamp}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {alert.sector} ({alert.camera_id})
                    </span>
                    <span>
                      Target: <strong style={{ color: 'var(--color-accent)' }}>{alert.target_class.toUpperCase()}</strong> ({((alert.confidence || 0.9) * 100).toFixed(0)}%)
                    </span>
                    {alert.distance_meters > 0 && (
                      <span>Dist: <strong>{alert.distance_meters}m</strong></span>
                    )}
                  </div>
                  {alert.notes && (
                    <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 4, fontStyle: 'italic' }}>
                      {alert.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link 
                  to={`/dashboard/camera/${alert.camera_id || 'CAM-01'}`} 
                  className="btn-secondary" 
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12 }}
                >
                  <Eye size={15} /> VIEW STREAM
                </Link>

                {alert.status === 'ACTIVE' && (
                  <button 
                    onClick={() => handleAcknowledgeOrResolve(alert.id, 'ACKNOWLEDGED')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <ShieldAlert size={15} /> ACKNOWLEDGE
                  </button>
                )}

                {alert.status !== 'RESOLVED' ? (
                  <button 
                    onClick={() => handleAcknowledgeOrResolve(alert.id, 'RESOLVED')}
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
                  >
                    <CheckCircle size={15} /> RESOLVE
                  </button>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 12, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>
                    <CheckCircle size={15} /> RESOLVED
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
