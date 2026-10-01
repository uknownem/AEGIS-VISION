import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Eye, CheckCircle, Siren, RefreshCw, 
  Filter, ShieldAlert, PlusCircle, CheckCheck, Trash2, Database, AlertTriangle, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { tacticalSiren } from '../utils/siren';
import { API_BASE_URL } from '../config';

export interface SecurityAlert {
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

export const SAMPLE_SECURITY_ALERTS: SecurityAlert[] = [
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
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [hasSampleAlerts, setHasSampleAlerts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingSiren, setTestingSiren] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for creating a new alert
  const [newAlertForm, setNewAlertForm] = useState({
    alert_type: 'NON_HUMAN_INTRUSION',
    target_class: 'Armored Tank / Electronic Intruder',
    confidence: 0.95,
    camera_id: 'CAM-01',
    sector: 'LAC Northern Sector',
    siren_triggered: true,
    distance_meters: 2.5,
    notes: 'Manual security dispatch logged by operator'
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  // Read saved alerts from localStorage / Backend
  const refreshAlerts = async () => {
    setLoading(true);
    let storedAlerts: SecurityAlert[] = [];
    const sampleFlag = localStorage.getItem('aegis_sample_alerts_loaded') === 'true' || localStorage.getItem('aegis_sample_dataset_loaded') === 'true';
    setHasSampleAlerts(sampleFlag);

    try {
      const saved = localStorage.getItem('aegis_alerts_cache') || localStorage.getItem('aegis_alerts');
      if (saved) {
        storedAlerts = JSON.parse(saved);
      }
    } catch {}

    // If sample flag is enabled and stored alerts are empty, populate samples
    if (sampleFlag && storedAlerts.length === 0) {
      storedAlerts = [...SAMPLE_SECURITY_ALERTS];
      localStorage.setItem('aegis_alerts', JSON.stringify(storedAlerts));
      localStorage.setItem('aegis_alerts_cache', JSON.stringify(storedAlerts));
    }

    // Attempt backend sync
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          // Merge with local without losing un-synced entries
          const map = new Map<number, SecurityAlert>();
          json.data.forEach((a: SecurityAlert) => map.set(a.id, a));
          storedAlerts.forEach((a: SecurityAlert) => {
            if (!map.has(a.id)) map.set(a.id, a);
          });
          storedAlerts = Array.from(map.values()).sort((a, b) => b.id - a.id);
        }
      }
    } catch {}

    setAlerts(storedAlerts);
    setLoading(false);
  };

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to persist alerts locally & state
  const persistAlertsList = (updated: SecurityAlert[]) => {
    setAlerts(updated);
    localStorage.setItem('aegis_alerts', JSON.stringify(updated));
    localStorage.setItem('aegis_alerts_cache', JSON.stringify(updated));
  };

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Load sample dataset
  const handleLoadSampleAlerts = () => {
    localStorage.setItem('aegis_sample_alerts_loaded', 'true');
    setHasSampleAlerts(true);
    
    // Merge sample alerts with any existing alerts
    const map = new Map<number, SecurityAlert>();
    SAMPLE_SECURITY_ALERTS.forEach(a => map.set(a.id, a));
    alerts.forEach(a => map.set(a.id, a));
    const merged = Array.from(map.values()).sort((a, b) => b.id - a.id);
    
    persistAlertsList(merged);
    showNotification('Sample defense intrusion alerts loaded successfully!');
  };

  // Clear to clean slate
  const handleClearAlerts = () => {
    localStorage.removeItem('aegis_sample_alerts_loaded');
    setHasSampleAlerts(false);
    persistAlertsList([]);
    showNotification('All alerts cleared. Defense alert center is now clean.');
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

  // 1. Acknowledge Alert (Instant UI Feedback + Persistent Sync)
  const handleAcknowledge = async (id: number) => {
    const timeStr = new Date().toLocaleTimeString();
    const updated = alerts.map(a => 
      a.id === id 
        ? { ...a, status: 'ACKNOWLEDGED', notes: `Operator acknowledged at ${timeStr}` } 
        : a
    );
    persistAlertsList(updated);
    showNotification(`Alert #${id} status changed to ACKNOWLEDGED`);

    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACKNOWLEDGED', notes: `Operator acknowledged at ${timeStr}` })
      });
    } catch {}
  };

  // 2. Resolve Alert (Instant UI Feedback + Persistent Sync)
  const handleResolve = async (id: number) => {
    const timeStr = new Date().toLocaleTimeString();
    const updated = alerts.map(a => 
      a.id === id 
        ? { ...a, status: 'RESOLVED', notes: `Resolved & Cleared by Operator at ${timeStr}` } 
        : a
    );
    persistAlertsList(updated);
    showNotification(`Alert #${id} marked as RESOLVED`);

    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', notes: `Resolved & Cleared by Operator at ${timeStr}` })
      });
    } catch {}
  };

  // 3. Delete / Dismiss Single Alert
  const handleDeleteAlert = (id: number) => {
    const updated = alerts.filter(a => a.id !== id);
    persistAlertsList(updated);
    showNotification(`Alert #${id} dismissed and deleted from registry.`);
  };

  // 4. Resolve All Active Alerts
  const handleResolveAll = () => {
    const timeStr = new Date().toLocaleTimeString();
    const updated = alerts.map(a => ({
      ...a,
      status: 'RESOLVED',
      notes: `Batch resolved by Operator at ${timeStr}`
    }));
    persistAlertsList(updated);
    showNotification('All active and acknowledged alerts marked as RESOLVED');
  };

  // 5. Submit New Custom Incursion Alert
  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.target_class || !newAlertForm.sector) return;
    setCreatingAlert(true);

    const newId = Date.now() % 100000;
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newAlert: SecurityAlert = {
      id: newId,
      alert_type: newAlertForm.alert_type,
      target_class: newAlertForm.target_class,
      confidence: Number(newAlertForm.confidence),
      camera_id: newAlertForm.camera_id,
      sector: newAlertForm.sector,
      siren_triggered: newAlertForm.siren_triggered ? 1 : 0,
      status: 'ACTIVE',
      distance_meters: Number(newAlertForm.distance_meters),
      notes: newAlertForm.notes,
      timestamp: timeStr
    };

    const updated = [newAlert, ...alerts];
    persistAlertsList(updated);

    if (newAlertForm.siren_triggered) {
      tacticalSiren.playTestSiren(1500);
    }

    // Try backend sync
    try {
      await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });
    } catch {}

    showNotification(`🚨 Security Alert #${newId} saved permanently!`);
    setCreatingAlert(false);
    setShowCreateModal(false);
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
          {/* Refresh / Live Sync Button */}
          <button 
            onClick={refreshAlerts}
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '8px 12px', 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              border: '1px solid var(--color-accent)', 
              color: 'var(--color-accent)', 
              borderRadius: 4, 
              cursor: 'pointer', 
              fontSize: 12, 
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 'bold'
            }}
            title="Sync latest alerts from local storage and defense server"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? 'SYNCING...' : 'LIVE SYNC'}
          </button>

          {/* Load Sample Dataset Button */}
          {!hasSampleAlerts ? (
            <button
              onClick={handleLoadSampleAlerts}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid var(--color-warning)',
                color: 'var(--color-warning)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Populate sample incursion dataset"
            >
              <Database size={14} /> LOAD SAMPLE DATASET
            </button>
          ) : (
            <button
              onClick={handleClearAlerts}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-alert)',
                color: 'var(--color-alert)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Clear all alerts and return to clean slate"
            >
              <Trash2 size={14} /> CLEAR ALERTS
            </button>
          )}

          {/* Record New Incursion Alert Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
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
            <PlusCircle size={14} /> + RECORD INCURSION ALERT
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
            TOTAL SAVED: {alerts.length}
          </span>
        </div>
      </div>
      
      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayedAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <ShieldAlert size={42} color="var(--color-text-muted)" style={{ marginBottom: 12 }} />
            <h4 style={{ color: 'var(--color-accent)', marginBottom: 6 }}>CLEAN SLATE // NO SAVED ALERTS</h4>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: 13, maxWidth: 500, margin: '0 auto 18px auto' }}>
              Your account currently has zero active alerts. You can manually record an incursion, trigger detections from the live cameras/demo page, or load the defense sample dataset.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={handleLoadSampleAlerts}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid var(--color-warning)',
                  color: 'var(--color-warning)',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📥 LOAD SAMPLE DATASET
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 'bold' }}
              >
                + RECORD NEW ALERT
              </button>
            </div>
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
                    {alert.siren_triggered ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-alert)', border: '1px solid var(--color-alert)', fontSize: 10 }}>
                        🚨 SIREN LOGGED
                      </span>
                    ) : null}
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

              {/* 3 Core Functional Action Buttons: View Stream, Acknowledge, Resolve */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* 1. VIEW STREAM */}
                <Link 
                  to={`/dashboard/camera/${alert.camera_id || 'CAM-01'}`} 
                  title={`Open live video & thermal optical stream for ${alert.camera_id || 'CAM-01'}`}
                  style={{ 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    padding: '7px 12px', 
                    fontSize: 12,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-accent)',
                    borderRadius: 4,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Eye size={14} /> VIEW STREAM
                </Link>

                {/* 2. ACKNOWLEDGE */}
                <button 
                  onClick={() => handleAcknowledge(alert.id)}
                  title="Acknowledge active incursion / threat"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    padding: '7px 12px', 
                    fontSize: 12, 
                    fontFamily: "'Share Tech Mono', monospace",
                    fontWeight: 'bold',
                    backgroundColor: alert.status === 'ACKNOWLEDGED' ? 'var(--color-warning)' : 'rgba(245, 158, 11, 0.15)', 
                    border: '1px solid var(--color-warning)', 
                    color: alert.status === 'ACKNOWLEDGED' ? '#000' : 'var(--color-warning)', 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldAlert size={14} /> {alert.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                </button>

                {/* 3. RESOLVE */}
                <button 
                  onClick={() => handleResolve(alert.id)}
                  title="Resolve and clear threat"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    padding: '7px 12px', 
                    fontSize: 12, 
                    fontFamily: "'Share Tech Mono', monospace",
                    fontWeight: 'bold',
                    backgroundColor: alert.status === 'RESOLVED' ? 'var(--color-success)' : 'rgba(34, 197, 94, 0.15)', 
                    border: '1px solid var(--color-success)', 
                    color: alert.status === 'RESOLVED' ? '#000' : 'var(--color-success)', 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle size={14} /> {alert.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVE'}
                </button>

                {/* Optional Dismiss / Delete */}
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  title="Purge alert from database"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--color-alert)',
                    padding: '7px 9px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Incursion Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div className="card" style={{
            maxWidth: 540,
            width: '100%',
            backgroundColor: '#0a0f0a',
            border: '1px solid var(--color-alert)',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.3)',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              <h3 style={{ color: 'var(--color-alert)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> RECORD DEFENSE INCURSION ALERT
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>INCURSION / THREAT TYPE</label>
                <select
                  value={newAlertForm.alert_type}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, alert_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                >
                  <option value="NON_HUMAN_INTRUSION">NON-HUMAN INTRUSION (Spoon / Weapon / Device)</option>
                  <option value="UAV_PERIMETER_BREACH">UAV DRONE AIRSPACE BREACH</option>
                  <option value="ARMOR_MOVEMENT">HOSTILE ARMOR / VEHICLE ADVANCE</option>
                  <option value="CAMOUFLAGE_BREACH">CAMOUFLAGE / THERMAL SIGNATURE</option>
                  <option value="TRIPWIRE_BREACH">LASER TRIPWIRE PERIMETER BREACH</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>TARGET OBJECT / CLASS</label>
                  <input
                    type="text"
                    required
                    value={newAlertForm.target_class}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, target_class: e.target.value })}
                    placeholder="e.g. Armored BMP / Electronic Object"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>OPTICAL SENSOR UNIT</label>
                  <select
                    value={newAlertForm.camera_id}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, camera_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  >
                    <option value="CAM-01">CAM-01 (LAC Northern Sector)</option>
                    <option value="CAM-02">CAM-02 (Main Gate Perimeter)</option>
                    <option value="CAM-03">CAM-03 (FLIR Thermal Sector)</option>
                    <option value="CAM-04">CAM-04 (Eastern Ridge UAV Recon)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>SECTOR / LOCATION</label>
                  <input
                    type="text"
                    required
                    value={newAlertForm.sector}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, sector: e.target.value })}
                    placeholder="e.g. LAC Northern Sector"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>ESTIMATED DISTANCE (M)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlertForm.distance_meters}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, distance_meters: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>OPERATIONAL NOTES / INTEL</label>
                <textarea
                  rows={2}
                  value={newAlertForm.notes}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4, fontFamily: "'Share Tech Mono', monospace", resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <input
                  type="checkbox"
                  id="siren_chk"
                  checked={newAlertForm.siren_triggered}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, siren_triggered: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="siren_chk" style={{ fontSize: 12, color: 'var(--color-alert)', cursor: 'pointer', fontWeight: 'bold' }}>
                  🚨 Trigger Tactical Siren Dispatch on Save
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creatingAlert}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: 12, fontWeight: 'bold', backgroundColor: 'var(--color-alert)', borderColor: 'var(--color-alert)', color: '#fff' }}
                >
                  {creatingAlert ? 'SAVING ALERT...' : 'RECORD & SAVE ALERT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
