import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, CheckCircle2 } from 'lucide-react';

export default function Onboarding({ onComplete }: { onComplete?: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="card animate-fade-in" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }}></div>
              <span style={{ fontSize: 12, color: 'var(--color-success)', letterSpacing: 1, fontWeight: 'bold' }}>SYSTEM SECURE</span>
            </div>
            <h2>01 / Operator Setup</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 30, fontSize: 14 }}>Establish secure connection and verify operator credentials to access the defense grid.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, backgroundColor: 'var(--color-bg-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>Operator Full Name</label>
                <input type="text" placeholder="Enter Full Name" defaultValue="Alex Vance" style={{ backgroundColor: 'var(--color-surface)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>Operator ID / Designation</label>
                <input type="text" placeholder="Enter ID" defaultValue="TS-001" style={{ backgroundColor: 'var(--color-surface)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>Secure Mobile Line</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select defaultValue="+1" style={{ width: 100, backgroundColor: 'var(--color-surface)', color: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px', outline: 'none' }}>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+33">+33 (FR)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+86">+86 (CN)</option>
                    <option value="+971">+971 (AE)</option>
                  </select>
                  <input type="text" placeholder="555-0192" defaultValue="555-0192" style={{ backgroundColor: 'var(--color-surface)', flex: 1 }} />
                </div>
              </div>
            </div>
            
            <h4 style={{ marginTop: 25, marginBottom: 15, color: 'var(--color-accent)' }}>Critical Alert Protocol</h4>
            <div style={{ display: 'flex', gap: 20, padding: 15, backgroundColor: 'var(--color-surface-light)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Push Notifications</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" defaultChecked /> SMS Alerts</label>
            </div>
            
            <button className="btn-handshake" style={{ marginTop: 30, width: '100%', display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }} onClick={() => setStep(2)}>
              <Shield size={18} /> INITIATE SECURE HANDSHAKE
            </button>
          </div>
        );
      case 2:
        return (
          <div className="card animate-fade-in">
            <h2>02 / Configure Monitoring Base</h2>
            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input type="text" placeholder="Base / Facility Name" defaultValue="BASE ALPHA" />
                <input type="text" placeholder="Base ID" defaultValue="BA-99" />
                <div style={{ padding: 15, border: '1px solid var(--color-border)', borderRadius: 6, backgroundColor: 'var(--color-surface-light)' }}>
                  <p style={{ color: 'var(--color-accent)' }}><MapPin size={16} /> Coordinates</p>
                  <h3>LAT 18.5204° N</h3>
                  <h3>LON 73.8567° E</h3>
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--color-bg-dark)', borderRadius: 6, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>[ Mock Map Placeholder ]</p>
              </div>
            </div>
            <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="card animate-fade-in">
            <h2>03 / Define Restricted Zones</h2>
            <div style={{ backgroundColor: 'var(--color-bg-dark)', height: 200, borderRadius: 6, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
              <p style={{ color: 'var(--color-text-muted)' }}>[ Mock Satellite Zone Editor ]</p>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ padding: 10, borderLeft: '3px solid var(--color-accent)', backgroundColor: 'var(--color-surface-light)', marginBottom: 10 }}>
                Zone Alpha (Priority: Critical)
              </div>
              <div style={{ padding: 10, borderLeft: '3px solid var(--color-primary)', backgroundColor: 'var(--color-surface-light)' }}>
                Northern Perimeter (Priority: High)
              </div>
            </div>
            <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(4)}>Continue</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="card animate-fade-in">
            <h2>04 / Connect Visual Sensors</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Aegis Vision requires access to configured visual sensors to monitor selected restricted areas.</p>
            <div style={{ padding: 15, border: '1px solid var(--color-primary)', borderRadius: 6, marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>CAM-01 / Northern Perimeter</h4>
                <p style={{ fontSize: 14, color: 'var(--color-accent)' }}>RGB + Thermal</p>
              </div>
              <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={18} /> Connected
              </div>
            </div>
            <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (onComplete) onComplete();
                  navigate('/dashboard');
                }} 
                style={{ flex: 1, backgroundColor: 'var(--color-primary)' }}
              >
                GET STARTED
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Shield size={48} color="var(--color-primary)" />
          <h1 style={{ marginTop: 10, color: 'var(--color-accent)' }}>AEGIS VISION</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Visual Intelligence for Protected Environments</p>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
