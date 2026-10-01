import { useState, useEffect } from 'react';
import { mockCameras } from '../mockData';
import { Video, Thermometer, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import CameraThumbnail from '../components/CameraThumbnail';

export default function Overview() {
  const [backendAlive, setBackendAlive] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    // Check if backend is alive
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          setBackendAlive(true);
        } else {
          setBackendAlive(false);
        }
      } catch {
        setBackendAlive(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid-summary">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ color: 'var(--color-text-muted)' }}>Active Optical Units</h4>
            <Video size={20} />
          </div>
          <h2 style={{ marginTop: 15, fontSize: 32 }}>12</h2>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ color: 'var(--color-text-muted)' }}>Thermal / IR Sensors</h4>
            <Thermometer size={20} />
          </div>
          <h2 style={{ marginTop: 15, fontSize: 32 }}>6</h2>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ color: 'var(--color-text-muted)' }}>Restricted Sectors</h4>
            <ShieldAlert size={20} />
          </div>
          <h2 style={{ marginTop: 15, fontSize: 32 }}>4</h2>
        </div>
        <div className="card" style={{ borderColor: 'var(--color-alert)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-alert)' }}>
            <h4 style={{ color: 'var(--color-text-muted)' }}>Active Incursions</h4>
            <AlertTriangle size={20} />
          </div>
          <h2 style={{ marginTop: 15, fontSize: 32, color: 'var(--color-alert)' }}>2</h2>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
        <h3 style={{ color: 'var(--color-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} /> LIVE CAMERA MULTI-VIEW
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
          <span style={{ color: backendAlive ? 'var(--color-success)' : 'var(--color-warning)' }}>
            AI ENGINE: {backendAlive ? 'ONLINE (PORT 8000)' : 'STANDALONE MODE'}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>UTC: {currentTime}</span>
        </div>
      </div>
      
      {/* Cameras Grid */}
      <div className="grid-cameras">
        {mockCameras.map((cam, idx) => (
          <Link to={`/dashboard/camera/${cam.id}`} key={cam.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
                <div>
                  <h4 style={{ color: 'var(--color-accent)', fontSize: 14 }}>{cam.id} // {cam.name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>{cam.zone}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: cam.status === 'live' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  <span className={`status-dot ${cam.status}`}></span> {cam.status.toUpperCase()}
                </div>
              </div>

              {/* Video Preview Box using CameraThumbnail */}
              <div style={{ height: 210, backgroundColor: '#060907', position: 'relative', overflow: 'hidden' }}>
                {cam.status === 'live' ? (
                  idx === 0 && backendAlive ? (
                    <img 
                      src="http://localhost:8000/video_feed" 
                      alt="Live feed preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <CameraThumbnail 
                      camId={cam.id}
                      zone={cam.zone}
                      isThermal={cam.type.toLowerCase().includes('thermal') || cam.type.toLowerCase().includes('flir')}
                      imageSrc={idx === 1 || cam.zone.toLowerCase().includes('north') ? '/cctv_himalayan_feed.jpg' : undefined}
                      hasDetection={idx === 0 || idx === 1}
                      hasNonHumanThreat={idx === 1}
                      nonHumanObject="Armored BMP / Tank"
                      fps={29.8}
                    />
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--color-alert)', letterSpacing: 1.5, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>
                      [ SIGNAL OFFLINE ]
                    </span>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>CHECK HARDWARE LINK</p>
                  </div>
                )}

                <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: 'var(--color-accent)', backgroundColor: 'rgba(0,0,0,0.75)', padding: '2px 8px', borderRadius: 3, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace", zIndex: 10 }}>
                  CLICK TO VIEW STREAM &rarr;
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

