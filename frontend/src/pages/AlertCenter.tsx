import { useState } from 'react';
import { mockAlerts } from '../mockData';
import { AlertTriangle, Clock, MapPin, Eye, CheckCircle, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tacticalSiren } from '../utils/siren';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [testingSiren, setTestingSiren] = useState(false);

  const handleTestSiren = () => {
    setTestingSiren(true);
    tacticalSiren.playTestSiren(1200);
    setTimeout(() => {
      setTestingSiren(false);
    }, 1250);
  };

  const handleReview = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Reviewed' } : a));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>ALERT & THREAT CENTER</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>PERIMETER INCURSIONS & AUTOMATED SIREN DISPATCHES</p>
        </div>

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
          <Siren size={16} className={testingSiren ? "animate-pulse" : ""} />
          {testingSiren ? 'SIREN WAILING...' : 'TEST TACTICAL SIREN'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {/* Non-Human Automated Incursion Banner */}
        <div className="card" style={{ borderColor: 'var(--color-alert)', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ padding: 15, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
              <Siren color="var(--color-alert)" size={24} />
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h3 style={{ margin: 0, color: 'var(--color-alert)' }}>NON-HUMAN OBJECT INTRUSION</h3>
                <span className="badge" style={{ backgroundColor: 'var(--color-alert)', color: '#fff', fontSize: 10 }}>SIREN ARMED</span>
              </div>
              <div style={{ display: 'flex', gap: 15, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} /> ACTIVE</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} /> Flightline South (CAM-04)</span>
                <span>Type: <strong style={{ color: 'var(--color-text)' }}>Vehicle / Unidentified Entity</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/dashboard/camera/CAM-04" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13 }}>
              <Eye size={16} /> Monitor Feed
            </Link>
          </div>
        </div>

        {alerts.map(alert => (
          <div key={alert.id} className="card" style={{ borderColor: alert.severity === 'HIGH' ? 'var(--color-alert)' : 'var(--color-warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ padding: 15, backgroundColor: alert.severity === 'HIGH' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(245, 124, 0, 0.1)', borderRadius: 8 }}>
                <AlertTriangle color={alert.severity === 'HIGH' ? 'var(--color-alert)' : 'var(--color-warning)'} size={24} />
              </div>
              
              <div>
                <h3 style={{ marginBottom: 5 }}>{alert.type}</h3>
                <div style={{ display: 'flex', gap: 15, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} /> {alert.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} /> {alert.zone} ({alert.camera})</span>
                  <span>Identity: <strong style={{ color: 'var(--color-text)' }}>{alert.identity}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/dashboard/camera/${alert.camera}`} className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13 }}>
                <Eye size={16} /> View
              </Link>
              {alert.status === 'Awaiting Review' ? (
                <button 
                  onClick={() => handleReview(alert.id)}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
                >
                  <CheckCircle size={16} /> Review
                </button>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <CheckCircle size={16} /> Reviewed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
