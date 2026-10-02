import { useState } from 'react';
import { Printer, Shield, X } from 'lucide-react';
import { type SecurityAlert } from '../utils/alertSync';
import { getExactLocalTimestamp } from '../utils/dateUtils';

interface Props {
  alert: SecurityAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function IncidentReportModal({ alert, isOpen, onClose }: Props) {
  const [operatorSignature, setOperatorSignature] = useState('Subedar Vikram Singh (IA-948201)');

  if (!isOpen || !alert) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card animate-fade-in" style={{ maxWidth: 640, width: '100%', borderColor: 'var(--color-accent)', backgroundColor: '#090d0a', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        {/* Printable Section */}
        <div id="printable-incident-report" style={{ padding: 10 }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-accent)', letterSpacing: 2, fontWeight: 'bold' }}>
                INDIAN ARMED FORCES // AEGIS-VISION COMMAND
              </div>
              <h2 style={{ fontSize: 18, color: '#fff', marginTop: 4, letterSpacing: 1 }}>
                TACTICAL DEFENSE INCIDENT AUDIT REPORT
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-alert)', fontWeight: 'bold', fontSize: 11 }}>
                CLASSIFICATION: TOP SECRET (COSMIC)
              </span>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>
                REPORT ID: #REP-2026-{alert.id}
              </div>
            </div>
          </div>

          {/* Incident Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
            <div style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block' }}>INCUSION TYPE / CATEGORY</span>
              <strong style={{ color: 'var(--color-alert)', fontSize: 13 }}>{alert.incursion_category || alert.alert_type}</strong>
            </div>

            <div style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block' }}>THREAT LEVEL & CONFIDENCE</span>
              <strong style={{ color: alert.threat_level === 'CRITICAL' ? 'var(--color-alert)' : 'var(--color-warning)', fontSize: 13 }}>
                {alert.threat_level} ({(alert.confidence * 100).toFixed(1)}%)
              </strong>
            </div>

            <div style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block' }}>COMBAT SECTOR / CAMERA</span>
              <strong style={{ color: 'var(--color-accent)' }}>{alert.sector} ({alert.camera_id})</strong>
            </div>

            <div style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 4, border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block' }}>TIMESTAMP (EXACT LOCAL)</span>
              <strong style={{ color: '#fff' }}>{alert.timestamp || getExactLocalTimestamp()}</strong>
            </div>
          </div>

          {/* Object & Threat Description */}
          <div style={{ padding: 12, backgroundColor: 'var(--color-surface)', borderRadius: 4, border: '1px solid var(--color-border)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 'bold', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> FORENSIC ANALYTICS & THREAT DETAILS
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
              {alert.notes || 'Automated Computer Vision threat detection logged at perimeter watch grid. Surroundings analyzed and verified.'}
            </p>
          </div>

          {/* Commander Sign-Off */}
          <div style={{ padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 4, border: '1px dashed var(--color-accent)', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>DUTY COMMANDER APPROVAL SIGNATURE:</div>
            <input
              type="text"
              value={operatorSignature}
              onChange={e => setOperatorSignature(e.target.value)}
              style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--color-accent)', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--color-accent)', width: '100%' }}
            />
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={handlePrint}
            style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-accent)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Printer size={16} /> PRINT / EXPORT INCIDENT PDF
          </button>
          <button
            onClick={onClose}
            style={{ padding: '10px 18px', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
