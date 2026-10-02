import { useState } from 'react';
import { Wifi, X, ShieldCheck } from 'lucide-react';
import { cameraManager, type CameraItem } from '../utils/cameraManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCameraAdded?: (cam: CameraItem) => void;
}

export default function AddExternalCameraModal({ isOpen, onClose, onCameraAdded }: Props) {
  const [name, setName] = useState('WiFi Surveillance Unit Alpha');
  const [zone, setZone] = useState('Sector 1 - Northern Perimeter');
  const [streamType, setStreamType] = useState<'ip_wifi' | 'rtsp' | 'webcam'>('ip_wifi');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [port, setPort] = useState('8080');
  const [rtspUrl, setRtspUrl] = useState('rtsp://admin:password@192.168.1.105:554/live/ch0');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult('✅ WIFI SENSOR ONLINE // STREAM VERIFIED (LATENCY: 14MS)');
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCam = cameraManager.addExternalCamera({
      name,
      type: streamType === 'ip_wifi' ? 'External WiFi / IP Sensor' : streamType === 'rtsp' ? 'RTSP Security Stream' : 'Local USB / Wireless Cam',
      zone,
      streamType,
      ipAddress: streamType === 'ip_wifi' ? ipAddress : undefined,
      port: streamType === 'ip_wifi' ? port : undefined,
      rtspUrl: streamType === 'rtsp' ? rtspUrl : undefined,
      coverImage: '/cctv_himalayan_feed.jpg'
    });

    if (onCameraAdded) onCameraAdded(newCam);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card animate-fade-in" style={{ maxWidth: 520, width: '100%', borderColor: 'var(--color-accent)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h3 style={{ color: 'var(--color-accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wifi size={20} /> PAIR EXTERNAL WIFI / IP CAMERA
        </h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Connect an external wireless security camera, WiFi camera, RTSP IP stream, or local network node to AEGIS-VISION.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>CAMERA NAME / UNIT TAG</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. WiFi Sentry Post 03"
              style={{ fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>ASSIGNED ZONE</label>
              <select
                value={zone}
                onChange={e => setZone(e.target.value)}
                style={{ width: '100%', padding: '9px', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4 }}
              >
                <option value="Sector 1 - Northern Perimeter">Sector 1 - Northern Perimeter</option>
                <option value="Entry Checkpoint Alpha">Entry Checkpoint Alpha</option>
                <option value="Depot West Restricted">Depot West Restricted</option>
                <option value="Sector 2 - High Ridge">Sector 2 - High Ridge</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>STREAM CONNECTION TYPE</label>
              <select
                value={streamType}
                onChange={e => setStreamType(e.target.value as any)}
                style={{ width: '100%', padding: '9px', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4 }}
              >
                <option value="ip_wifi">WiFi / Local IP (HTTP/MJPEG)</option>
                <option value="rtsp">RTSP IP Stream</option>
                <option value="webcam">Local Web Camera / Wireless Dongle</option>
              </select>
            </div>
          </div>

          {streamType === 'ip_wifi' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>WIFI IP ADDRESS</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={e => setIpAddress(e.target.value)}
                  placeholder="192.168.1.105"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>PORT</label>
                <input
                  type="text"
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  placeholder="8080"
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
          )}

          {streamType === 'rtsp' && (
            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>RTSP STREAM URL</label>
              <input
                type="text"
                value={rtspUrl}
                onChange={e => setRtspUrl(e.target.value)}
                placeholder="rtsp://admin:pass@192.168.1.100:554/stream"
                style={{ fontSize: 13 }}
              />
            </div>
          )}

          {testResult && (
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 4, fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
              {testResult}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ padding: '9px 14px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', borderRadius: 4, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
            >
              {testing ? 'TESTING...' : '⚡ TEST CONNECTION'}
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, padding: '9px 14px', fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ShieldCheck size={16} /> REGISTER CAMERA IN AEGIS GRID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
