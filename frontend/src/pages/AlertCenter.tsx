import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Eye, CheckCircle, Siren, RefreshCw, 
  Filter, ShieldAlert, PlusCircle, CheckCheck, Trash2, Database, AlertTriangle, X, Radio, Crosshair, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { tacticalSiren } from '../utils/siren';
import { alertSync, type SecurityAlert, type IncursionType, type ObjectCategory, type ThreatLevel } from '../utils/alertSync';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [hasSampleAlerts, setHasSampleAlerts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingSiren, setTestingSiren] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for manually creating an incursion alert
  const [newAlertForm, setNewAlertForm] = useState({
    alert_type: 'NON_HUMAN_INTRUSION' as IncursionType,
    incursion_category: 'RESTRICTED SECTOR OBJECT INTRUSION',
    object_category: 'METALLIC_TOOL' as ObjectCategory,
    target_class: 'Metallic Spoon / Tool / Phone / Charger',
    threat_level: 'HIGH' as ThreatLevel,
    confidence: 0.95,
    camera_id: 'CAM-01',
    sector: 'LAC Northern Sector',
    siren_triggered: true,
    distance_meters: 1.8,
    notes: 'Non-human prohibited object detected in restricted security perimeter'
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  // 1. Subscribe to Live Cross-Account Alerts
  useEffect(() => {
    const unsubscribe = alertSync.subscribe((liveAlerts) => {
      setAlerts(liveAlerts);
      const isSample = localStorage.getItem('aegis_sample_alerts_loaded') === 'true';
      setHasSampleAlerts(isSample);
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Manual Trigger to re-sync
  const handleLiveSync = () => {
    setLoading(true);
    const latest = alertSync.getAlerts();
    setAlerts(latest);
    showNotification('⚡ Live alert bus synchronized across all defense terminals');
    setTimeout(() => setLoading(false), 500);
  };

  // Load sample dataset
  const handleLoadSampleAlerts = () => {
    alertSync.loadSampleAlerts();
    setHasSampleAlerts(true);
    showNotification('Sample defense intrusion dataset loaded across all terminals!');
  };

  // Clear to clean slate
  const handleClearAlerts = () => {
    alertSync.clearAllAlerts();
    setHasSampleAlerts(false);
    showNotification('All alerts cleared. Defense alert network reset to clean slate.');
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

  // Option 1: Acknowledge Alert
  const handleAcknowledge = async (id: number) => {
    await alertSync.updateAlertStatus(id, 'ACKNOWLEDGED');
    showNotification(`Alert #${id} marked as ACKNOWLEDGED across all operator accounts`);
  };

  // Option 2: Resolve Alert
  const handleResolve = async (id: number) => {
    await alertSync.updateAlertStatus(id, 'RESOLVED');
    tacticalSiren.stop();
    showNotification(`Alert #${id} RESOLVED & secured`);
  };

  // Delete / Dismiss
  const handleDeleteAlert = (id: number) => {
    alertSync.deleteAlert(id);
    showNotification(`Alert #${id} purged from defense registry`);
  };

  // Batch Resolve All Active
  const handleResolveAll = async () => {
    const active = alerts.filter(a => a.status === 'ACTIVE');
    for (const a of active) {
      await alertSync.updateAlertStatus(a.id, 'RESOLVED');
    }
    tacticalSiren.stop();
    showNotification('All active incursion threats batch-resolved');
  };

  // Submit New Custom Incursion Alert (Broadcasts LIVE to all accounts)
  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.target_class || !newAlertForm.sector) return;
    setCreatingAlert(true);

    await alertSync.broadcastNewAlert({
      alert_type: newAlertForm.alert_type,
      incursion_category: newAlertForm.incursion_category,
      object_category: newAlertForm.object_category,
      target_class: newAlertForm.target_class,
      threat_level: newAlertForm.threat_level,
      confidence: Number(newAlertForm.confidence),
      camera_id: newAlertForm.camera_id,
      sector: newAlertForm.sector,
      siren_triggered: newAlertForm.siren_triggered ? 1 : 0,
      status: 'ACTIVE',
      distance_meters: Number(newAlertForm.distance_meters),
      notes: newAlertForm.notes
    });

    if (newAlertForm.siren_triggered) {
      tacticalSiren.playTestSiren(1500);
    }

    showNotification(`🚨 Incursion Alert broadcasted live to all defense accounts!`);
    setCreatingAlert(false);
    setShowCreateModal(false);
  };

  // Filter alerts by status and category
  const displayedAlerts = alerts.filter(a => {
    const matchStatus = filterStatus === 'ALL' || a.status.toUpperCase() === filterStatus.toUpperCase();
    const matchCat = filterCategory === 'ALL' || a.alert_type === filterCategory;
    return matchStatus && matchCat;
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
          <h2 style={{ color: 'var(--color-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={22} className="animate-pulse" /> LIVE INCURSION ALERT & SIREN CENTER
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            REAL-TIME CROSS-ACCOUNT BREACH SYNC &bull; AUTOMATIC INCURSION & OBJECT CLASSIFICATION
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Live Sync Button */}
          <button 
            onClick={handleLiveSync}
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
            title="Real-time multi-terminal broadcast sync"
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
            <PlusCircle size={14} /> + BROADCAST INCURSION ALERT
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Filter size={15} color="var(--color-text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>STATUS:</span>
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '4px 10px',
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

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>CATEGORY:</span>
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'NON_HUMAN_INTRUSION', label: 'NON-HUMAN' },
              { id: 'UAV_PERIMETER_BREACH', label: 'UAV DRONE' },
              { id: 'ARMOR_CONVOY_MOVEMENT', label: 'ARMOR' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  fontFamily: "'Share Tech Mono', monospace",
                  borderRadius: 3,
                  backgroundColor: filterCategory === cat.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  color: filterCategory === cat.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  border: filterCategory === cat.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontWeight: filterCategory === cat.id ? 'bold' : 'normal'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
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
            TOTAL BROADCASTED: {alerts.length}
          </span>
        </div>
      </div>
      
      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayedAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <ShieldAlert size={42} color="var(--color-text-muted)" style={{ marginBottom: 12 }} />
            <h4 style={{ color: 'var(--color-accent)', marginBottom: 6 }}>CLEAN SLATE // NO LIVE INCURSIONS DETECTED</h4>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: 13, maxWidth: 540, margin: '0 auto 18px auto' }}>
              Your account currently has zero active alerts. Incursions detected on any defense camera or triggered from the demo page sync live to all operators automatically.
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
                + BROADCAST NEW ALERT
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
                <div style={{ position: 'relative', width: 120, height: 80, borderRadius: 4, overflow: 'hidden', border: alert.status === 'ACTIVE' ? '1px solid var(--color-alert)' : '1px solid var(--color-border)', flexShrink: 0 }}>
                  <img 
                    src={alert.camera_id === 'CAM-04' ? '/drone_aerial_recon.jpg' : (alert.camera_id === 'CAM-02' ? '/cam02_main_gate.jpg' : (alert.alert_type === 'THERMAL_SIGNATURE_BREACH' || alert.target_class.includes('Thermal') ? '/thermal_flir_alert.jpg' : '/cctv_himalayan_feed.jpg'))} 
                    alt="Incursion Snapshot" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.75)', padding: '1px 4px', borderRadius: 2, fontFamily: "'Share Tech Mono', monospace" }}>
                    {alert.camera_id || 'CAM-01'}
                  </div>
                </div>

                <div>
                  {/* Alert Header & Rich Classification Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: alert.status === 'ACTIVE' ? 'var(--color-alert)' : 'var(--color-text)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Crosshair size={16} /> #{alert.id} &bull; {alert.target_class.toUpperCase()}
                    </h3>

                    {/* Incursion Type Badge */}
                    <span className="badge" style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                      border: '1px solid var(--color-alert)', 
                      color: 'var(--color-alert)', 
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      BREACH: {alert.incursion_category || alert.alert_type.replace(/_/g, ' ')}
                    </span>

                    {/* Object Type Badge */}
                    <span className="badge" style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                      border: '1px solid var(--color-accent)', 
                      color: 'var(--color-accent)', 
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      OBJECT: {alert.object_category || 'NON-HUMAN ITEM'}
                    </span>

                    {/* Status Badge */}
                    <span className="badge" style={{ 
                      backgroundColor: alert.status === 'ACTIVE' ? 'var(--color-alert)' : (alert.status === 'ACKNOWLEDGED' ? 'var(--color-warning)' : 'var(--color-success)'), 
                      color: '#fff', 
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      {alert.status}
                    </span>

                    {alert.siren_triggered ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--color-alert)', border: '1px solid var(--color-alert)', fontSize: 10 }}>
                        🚨 SIREN ENGAGED
                      </span>
                    ) : null}
                  </div>

                  {/* Metadata Row: Timestamp, Sector, Distance, Confidence, Origin Operator */}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} /> {alert.timestamp}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {alert.sector} ({alert.camera_id})
                    </span>
                    <span>
                      Confidence: <strong style={{ color: 'var(--color-accent)' }}>{((alert.confidence || 0.9) * 100).toFixed(0)}%</strong>
                    </span>
                    {alert.distance_meters > 0 && (
                      <span>Dist: <strong>{alert.distance_meters}m</strong></span>
                    )}
                    {alert.origin_operator && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-dim)' }}>
                        <UserCheck size={13} /> {alert.origin_operator}
                      </span>
                    )}
                  </div>

                  {alert.notes && (
                    <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                      {alert.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* 3 Core Options: VIEW STREAM, ACKNOWLEDGE, RESOLVE */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* 1. VIEW STREAM */}
                <Link 
                  to={`/dashboard/camera/${alert.camera_id || 'CAM-01'}`} 
                  title={`Open live optical & thermal stream for ${alert.camera_id || 'CAM-01'}`}
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

                {/* Optional Delete */}
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

      {/* Record & Broadcast Incursion Modal */}
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
            maxWidth: 580,
            width: '100%',
            backgroundColor: '#0a0f0a',
            border: '1px solid var(--color-alert)',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.3)',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              <h3 style={{ color: 'var(--color-alert)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> BROADCAST INCURSION ALERT ACROSS ALL OPERATORS
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>INCURSION / BREACH TYPE</label>
                  <select
                    value={newAlertForm.alert_type}
                    onChange={(e) => {
                      const val = e.target.value as IncursionType;
                      let objCat: ObjectCategory = 'METALLIC_TOOL';
                      let label = 'Metallic Spoon / Tool / Phone / Charger';
                      if (val === 'UAV_PERIMETER_BREACH') { objCat = 'UAV_DRONE'; label = 'Hostile Surveillance Drone UAV'; }
                      else if (val === 'ARMOR_CONVOY_MOVEMENT') { objCat = 'ARMORED_VEHICLE'; label = 'Main Battle Tank (T-90 / BMP-2)'; }
                      else if (val === 'THERMAL_SIGNATURE_BREACH') { objCat = 'THERMAL_HEAT_SOURCE'; label = 'High-Heat Thermal Signature'; }
                      else if (val === 'LASER_TRIPWIRE_BREACH') { objCat = 'UNAUTHORIZED_HUMAN'; label = 'Laser Tripwire Infiltrator'; }

                      setNewAlertForm({ 
                        ...newAlertForm, 
                        alert_type: val,
                        object_category: objCat,
                        target_class: label
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  >
                    <option value="NON_HUMAN_INTRUSION">NON-HUMAN INTRUSION</option>
                    <option value="UAV_PERIMETER_BREACH">UAV DRONE AIRSPACE BREACH</option>
                    <option value="ARMOR_CONVOY_MOVEMENT">MECHANIZED ARMOR / TANK ADVANCE</option>
                    <option value="THERMAL_SIGNATURE_BREACH">FLIR THERMAL CAMOUFLAGE ANOMALY</option>
                    <option value="LASER_TRIPWIRE_BREACH">LASER PERIMETER TRIPWIRE BREACH</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>OBJECT CLASSIFICATION CATEGORY</label>
                  <select
                    value={newAlertForm.object_category}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, object_category: e.target.value as ObjectCategory })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  >
                    <option value="METALLIC_TOOL">METALLIC TOOL (Spoon / Blade / Tool)</option>
                    <option value="ELECTRONIC_GADGET">ELECTRONIC GADGET (Phone / Charger / Device)</option>
                    <option value="ARMORED_VEHICLE">ARMORED VEHICLE (Tank / BMP / 8x8 Transport)</option>
                    <option value="UAV_DRONE">UAV DRONE (Quadcopter / Surveillance Drone)</option>
                    <option value="THERMAL_HEAT_SOURCE">THERMAL HEAT SOURCE (FLIR Infrared Anomaly)</option>
                    <option value="UNAUTHORIZED_HUMAN">UNAUTHORIZED HUMAN (Sentry / Infiltrator)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>TARGET OBJECT SPECIFIC NAME</label>
                  <input
                    type="text"
                    required
                    value={newAlertForm.target_class}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, target_class: e.target.value })}
                    placeholder="e.g. Metallic Spoon / Tank BMP-2 / Drone"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>OPTICAL / THERMAL CAMERA</label>
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
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>ESTIMATED DISTANCE (METERS)</label>
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
                  🚨 Trigger Tactical Siren Dispatch on Broadcast
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
                  {creatingAlert ? 'BROADCASTING...' : 'BROADCAST ALERT LIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
