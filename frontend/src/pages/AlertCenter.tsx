import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Eye, CheckCircle, Siren, RefreshCw, 
  Filter, ShieldAlert, PlusCircle, CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { tacticalSiren } from '../utils/siren';
import { API_BASE_URL } from '../config';

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

const INITIAL_ALERTS: SecurityAlert[] = [
  { 
    id: 1, 
    alert_type: 'NON_HUMAN_INTRUSION', 
    target_class: 'Main Battle Tank / BMP', 
    confidence: 0.965, 
    camera_id: 'CAM-01', 
    sector: 'LAC Northern Sector', 
    siren_triggered: 1, 
    status: 'ACTIVE', 
    distance_meters: 48.2, 
    notes: 'Armored vehicle detected at snow transit corridor // TACTICAL SIREN ACTIVATED', 
    timestamp: '2026-10-01 14:24:12' 
  },
  { 
    id: 2, 
    alert_type: 'NON_HUMAN_INTRUSION', 
    target_class: 'spoon / charger / electronic device', 
    confidence: 0.930, 
    camera_id: 'CAM-01', 
    sector: 'Perimeter Fence Alpha', 
    siren_triggered: 1, 
    status: 'ACTIVE', 
    distance_meters: 1.4, 
    notes: 'Non-human object detected within restricted base radius // CONTINUOUS SIREN ENGAGED', 
    timestamp: '2026-10-01 14:10:00' 
  },
  { 
    id: 3, 
    alert_type: 'UAV_PERIMETER_BREACH', 
    target_class: 'Unidentified Aerial Drone (UAV)', 
    confidence: 0.942, 
    camera_id: 'CAM-04', 
    sector: 'Eastern Ridge Pass', 
    siren_triggered: 1, 
    status: 'ACKNOWLEDGED', 
    distance_meters: 125.0, 
    notes: 'Low-altitude unauthorized drone breach // Operator notified', 
    timestamp: '2026-10-01 13:58:30' 
  },
  { 
    id: 4, 
    alert_type: 'CAMOUFLAGE_BREACH', 
    target_class: 'Thermal Heat Signature', 
    confidence: 0.890, 
    camera_id: 'CAM-02', 
    sector: 'Main Gate Corridor', 
    siren_triggered: 0, 
    status: 'RESOLVED', 
    distance_meters: 18.5, 
    notes: 'Thermal target verified as authorized convoy movement', 
    timestamp: '2026-10-01 13:30:00' 
  }
];

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aegis_alerts_cache');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_ALERTS;
  });

  const [loading, setLoading] = useState(false);
  const [testingSiren, setTestingSiren] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Persist alerts to localStorage
  useEffect(() => {
    if (alerts.length > 0) {
      localStorage.setItem('aegis_alerts_cache', JSON.stringify(alerts));
    }
  }, [alerts]);

  // Fetch persistent alerts from FastAPI SQLite Database if available
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setAlerts(json.data);
        }
      }
    } catch {
      // Keep existing memory state on standalone
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Test Tactical Audio Siren
  const handleTestSiren = () => {
    setTestingSiren(true);
    tacticalSiren.playTestSiren(1800);
    showNotification('🚨 Tactical Audio Siren Test Activated (1.8s Pulse)');
    setTimeout(() => {
      setTestingSiren(false);
    }, 1850);
  };

  // 1. Acknowledge Alert (Instant UI Feedback + Background DB Sync)
  const handleAcknowledge = async (id: number) => {
    const timeStr = new Date().toLocaleTimeString();
    setAlerts(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: 'ACKNOWLEDGED', notes: `Operator acknowledged at ${timeStr}` } 
        : a
    ));
    showNotification(`Alert #${id} status changed to ACKNOWLEDGED`);

    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACKNOWLEDGED', notes: `Operator acknowledged at ${timeStr}` })
      });
    } catch {}
  };

  // 2. Resolve Alert (Instant UI Feedback + Background DB Sync)
  const handleResolve = async (id: number) => {
    const timeStr = new Date().toLocaleTimeString();
    setAlerts(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: 'RESOLVED', notes: `Resolved & Cleared by Operator at ${timeStr}` } 
        : a
    ));
    showNotification(`Alert #${id} marked as RESOLVED`);

    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', notes: `Resolved & Cleared by Operator at ${timeStr}` })
      });
    } catch {}
  };

  // 3. Resolve All Active Alerts
  const handleResolveAll = () => {
    const timeStr = new Date().toLocaleTimeString();
    setAlerts(prev => prev.map(a => ({
      ...a,
      status: 'RESOLVED',
      notes: `Batch resolved by Operator at ${timeStr}`
    })));
    showNotification('All active and acknowledged alerts marked as RESOLVED');
  };

  // 4. Simulate New Incursion Threat in Real-Time
  const handleSimulateNewAlert = () => {
    const newId = Date.now() % 10000;
    const timeStr = new Date().toLocaleTimeString();
    const newAlert: SecurityAlert = {
      id: newId,
      alert_type: 'NON_HUMAN_INTRUSION',
      target_class: 'charger / spoon / electronic intruder',
      confidence: 0.958,
      camera_id: 'CAM-01',
      sector: 'Himalayan LAC Patrol Checkpoint',
      siren_triggered: 1,
      status: 'ACTIVE',
      distance_meters: 1.4,
      notes: 'New non-human object detected in sector // AUTOMATED SIREN WAILING',
      timestamp: `2026-10-01 ${timeStr}`
    };

    setAlerts(prev => [newAlert, ...prev]);
    tacticalSiren.playTestSiren(1200);
    showNotification(`🚨 New Intrusion Alert #${newId} Simulated! Siren Active.`);
  };

  // Filter alerts by status
  const displayedAlerts = alerts.filter(a => {
    if (filterStatus === 'ALL') return true;
    return a.status.toUpperCase() === filterStatus.toUpperCase();
  });

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="animate-fade-in">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-accent)',
          boxShadow: '0 0 25px rgba(163, 230, 53, 0.4)',
          color: 'var(--color-accent)',
          padding: '10px 18px',
          borderRadius: 6,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12,
          fontWeight: 'bold',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle size={16} /> {toastMsg}
        </div>
      )}

      {/* Header & Siren Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)', margin: 0 }}>SECURITY ALERT & SIREN LOG CENTER</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            PERSISTENT INCURSION AUDIT TRAIL, NON-HUMAN DETECTION LOGS & SIREN DISPATCHES
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Simulate New Threat Button */}
          <button 
            onClick={handleSimulateNewAlert}
            title="Simulate a new non-human intruder alert in real-time"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '8px 12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              border: '1px solid var(--color-alert)', 
              color: 'var(--color-alert)', 
              borderRadius: 4, 
              cursor: 'pointer', 
              fontSize: 12, 
              fontFamily: "'Share Tech Mono', monospace", 
              fontWeight: 'bold' 
            }}
          >
            <PlusCircle size={14} /> + SIMULATE INTRUSION ALERT
          </button>

          {/* Test Tactical Siren Button */}
          <button 
            onClick={handleTestSiren}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: testingSiren ? 'var(--color-alert)' : 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--color-alert)',
              color: '#fff',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 'bold'
            }}
          >
            <Siren size={16} className={testingSiren ? "animate-spin" : ""} />
            {testingSiren ? 'SIREN WAILING...' : 'TEST SIREN'}
          </button>

          {/* Refresh from DB Button */}
          <button 
            onClick={fetchAlerts}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> REFRESH
          </button>
        </div>
      </div>

      {/* Filter and Status Counts Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: 'var(--color-surface)', padding: '10px 16px', borderRadius: 6, border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>FILTER BY STATUS:</span>
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: filterStatus === st ? 'var(--color-accent)' : 'transparent',
                color: filterStatus === st ? '#000' : 'var(--color-text)',
                border: filterStatus === st ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                fontWeight: filterStatus === st ? 'bold' : 'normal',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontFamily: "'Share Tech Mono', monospace", display: 'flex', gap: 14, alignItems: 'center' }}>
          {activeAlertsCount > 0 && (
            <button
              onClick={handleResolveAll}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success)',
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <CheckCheck size={13} /> RESOLVE ALL ACTIVE
            </button>
          )}

          <span style={{ color: activeAlertsCount > 0 ? 'var(--color-alert)' : 'var(--color-success)', fontWeight: 'bold' }}>
            ● {activeAlertsCount} ACTIVE
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            TOTAL: {alerts.length}
          </span>
        </div>
      </div>
      
      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayedAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <ShieldAlert size={36} color="var(--color-text-muted)" style={{ marginBottom: 10 }} />
            <p style={{ color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
              No security alerts found under status filter: <strong>{filterStatus}</strong>.
            </p>
          </div>
        ) : (
          displayedAlerts.map(alert => (
            <div 
              key={alert.id} 
              className="card" 
              style={{ 
                borderColor: alert.status === 'ACTIVE' ? 'var(--color-alert)' : 'var(--color-border)', 
                backgroundColor: alert.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-surface)',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Security Snapshot Image Preview */}
                <div style={{ position: 'relative', width: 110, height: 75, borderRadius: 4, overflow: 'hidden', border: alert.status === 'ACTIVE' ? '1px solid var(--color-alert)' : '1px solid var(--color-border)', flexShrink: 0 }}>
                  <img 
                    src={alert.camera_id === 'CAM-04' ? '/drone_aerial_recon.jpg' : (alert.camera_id === 'CAM-02' ? '/cam02_main_gate.jpg' : (alert.target_class.includes('Thermal') ? '/thermal_flir_alert.jpg' : '/cctv_himalayan_feed.jpg'))} 
                    alt="Incursion Snapshot" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 3px', borderRadius: 2, fontFamily: "'Share Tech Mono', monospace" }}>
                    {alert.camera_id || 'CAM-01'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
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

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", flexWrap: 'wrap' }}>
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
                    <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                      {alert.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Functional Action Buttons */}
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
                    onClick={() => handleAcknowledge(alert.id)}
                    title="Acknowledge active intrusion"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      padding: '8px 14px', 
                      fontSize: 12, 
                      backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                      border: '1px solid var(--color-warning)', 
                      color: 'var(--color-warning)', 
                      borderRadius: 4, 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ShieldAlert size={15} /> ACKNOWLEDGE
                  </button>
                )}

                {alert.status !== 'RESOLVED' ? (
                  <button 
                    onClick={() => handleResolve(alert.id)}
                    className="btn-primary" 
                    title="Resolve and close alert"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <CheckCircle size={15} /> RESOLVE
                  </button>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 12, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>
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
