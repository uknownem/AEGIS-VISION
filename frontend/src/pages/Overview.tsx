import { useState, useEffect } from 'react';
import { cameraManager, type CameraItem } from '../utils/cameraManager';
import { Video, Thermometer, ShieldAlert, AlertTriangle, Activity, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import CameraThumbnail from '../components/CameraThumbnail';
import { API_BASE_URL } from '../config';

export default function Overview() {
  const [cameras, setCameras] = useState<CameraItem[]>(() => cameraManager.getCameras());
  const [backendAlive, setBackendAlive] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());
  const [deletedNotice, setDeletedNotice] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const handleCamerasUpdate = () => {
      setCameras(cameraManager.getCameras());
    };

    window.addEventListener('aegis_cameras_updated', handleCamerasUpdate);
    window.addEventListener('storage', handleCamerasUpdate);

    // Check if backend is alive
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.status === 'ok') {
            setBackendAlive(true);
            return;
          }
        }
        setBackendAlive(false);
      } catch {
        setBackendAlive(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      window.removeEventListener('aegis_cameras_updated', handleCamerasUpdate);
      window.removeEventListener('storage', handleCamerasUpdate);
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleDeleteCamera = (e: React.MouseEvent, cam: CameraItem) => {
    e.stopPropagation();
    e.preventDefault();
    cameraManager.deleteCamera(cam.id);
    setDeletedNotice({ id: cam.id, name: cam.name });
  };

  const handleUndoDelete = () => {
    cameraManager.undoDeleteCamera();
    setDeletedNotice(null);
  };

  const handleResetCameras = () => {
    cameraManager.resetToDefault();
    setDeletedNotice(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid-summary">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <h4 style={{ color: 'var(--color-text-muted)' }}>Active Optical Units</h4>
            <Video size={20} />
          </div>
          <h2 style={{ marginTop: 15, fontSize: 32 }}>{cameras.length}</h2>
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

      {/* Deleted Notice Toast with UNDO button */}
      {deletedNotice && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--color-alert)',
          color: 'var(--color-alert)',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          fontFamily: "'Share Tech Mono', monospace"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={16} />
            <span>
              Camera <strong>"{deletedNotice.name}" ({deletedNotice.id})</strong> removed from tactical grid.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleUndoDelete}
              style={{
                padding: '4px 12px',
                backgroundColor: 'var(--color-accent)',
                color: '#000',
                border: 'none',
                borderRadius: 4,
                fontWeight: 'bold',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <RotateCcw size={13} /> UNDO DELETE
            </button>
            <button
              onClick={() => setDeletedNotice(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Header controls with generous spacing */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
        <h3 style={{ color: 'var(--color-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} /> LIVE CAMERA MULTI-VIEW ({cameras.length} UNITS)
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
          <button
            onClick={handleResetCameras}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              borderRadius: 3,
              fontSize: 11,
              cursor: 'pointer'
            }}
            title="Restore default tactical cameras list"
          >
            <RefreshCw size={12} /> RESTORE DEFAULT CAMERAS
          </button>
          <span style={{ color: backendAlive ? 'var(--color-success)' : 'var(--color-warning)' }}>
            AI ENGINE: {backendAlive ? 'ONLINE (PORT 8000)' : 'STANDALONE MODE'}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>UTC: {currentTime}</span>
        </div>
      </div>
      
      {/* Cameras Grid */}
      {cameras.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldAlert size={40} color="var(--color-warning)" style={{ marginBottom: 12 }} />
          <h4 style={{ color: 'var(--color-warning)', marginBottom: 8 }}>ALL CAMERAS REMOVED</h4>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            No cameras active in the tactical grid. Click "+ PAIR WIFI CAM" or "RESTORE DEFAULT CAMERAS".
          </p>
          <button
            onClick={handleResetCameras}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 12, fontWeight: 'bold' }}
          >
            RESTORE DEFAULT CAMERAS
          </button>
        </div>
      ) : (
        <div className="grid-cameras">
          {cameras.map((cam, idx) => {
            const coverImages: Record<string, string> = {
              'CAM-01': '/cctv_himalayan_feed.jpg',
              'CAM-02': '/cam02_main_gate.jpg',
              'CAM-03': '/thermal_flir_alert.jpg',
              'CAM-04': '/drone_aerial_recon.jpg'
            };
            const imageSrc = coverImages[cam.id] || '/cctv_himalayan_feed.jpg';

            return (
              <Link to={`/dashboard/camera/${cam.id}`} key={cam.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-accent)', fontSize: 14 }}>{cam.id} // {cam.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>{cam.zone}</p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: cam.status === 'live' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        <span className={`status-dot ${cam.status}`}></span> {cam.status.toUpperCase()}
                      </div>

                      {/* Delete Camera Button */}
                      <button
                        onClick={(e) => handleDeleteCamera(e, cam)}
                        title={`Delete ${cam.name} from grid`}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          padding: 5,
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Video Preview Box */}
                  <div style={{ height: 210, backgroundColor: '#060907', position: 'relative', overflow: 'hidden' }}>
                    {idx === 0 && backendAlive ? (
                      <img 
                        src={`${API_BASE_URL}/video_feed`} 
                        alt="Live feed preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <CameraThumbnail 
                        camId={cam.id}
                        zone={cam.zone}
                        isThermal={cam.id === 'CAM-03' || cam.type.toLowerCase().includes('thermal')}
                        imageSrc={imageSrc}
                        hasDetection={cam.id === 'CAM-01' || cam.id === 'CAM-02' || cam.id === 'CAM-03'}
                        hasNonHumanThreat={cam.id === 'CAM-01' || cam.id === 'CAM-02'}
                        nonHumanObject={cam.id === 'CAM-01' ? 'Armored Tank / BMP' : 'Military Transport 8x8'}
                        fps={29.8}
                      />
                    )}

                    <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: 'var(--color-accent)', backgroundColor: 'rgba(0,0,0,0.75)', padding: '2px 8px', borderRadius: 3, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace", zIndex: 10 }}>
                      CLICK TO VIEW STREAM &rarr;
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
