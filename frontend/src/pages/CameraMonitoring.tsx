import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCameras } from '../mockData';
import { 
  ArrowLeft, Maximize2, AlertTriangle, ShieldCheck, X, Camera, 
  Eye, RefreshCw, VolumeX, Crosshair, ZoomIn, ZoomOut, Siren
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';

type StreamSource = 'backend' | 'webcam' | 'simulated';
type VisionMode = 'normal' | 'thermal' | 'nvg' | 'flir';

export default function CameraMonitoring() {
  const { id } = useParams();
  const navigate = useNavigate();
  const camera = mockCameras.find(c => c.id === id) || mockCameras[0];
  
  const [streamSource, setStreamSource] = useState<StreamSource>('backend');
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [alertEscalated, setAlertEscalated] = useState(false);
  const [sirenEnabled, setSirenEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fps, setFps] = useState(29.8);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  
  // Real-time detection state from Backend WebSocket
  const [detections, setDetections] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
  const [backendImageError, setBackendImageError] = useState(false);

  // References for Webcam & Canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Non-human target detection calculation
  const nonHumanDetections = detections.filter(d => d.class_id !== 0 && (d.is_non_human !== false));
  const hasNonHumanThreat = nonHumanDetections.length > 0;
  const hasHumanThreat = detections.some(d => d.class_id === 0);
  const latestHuman = detections.find(d => d.class_id === 0);
  const latestNonHuman = nonHumanDetections[0];

  // Siren Trigger: Sounds pitch-sweeping emergency siren when non-human object is detected
  useEffect(() => {
    if (hasNonHumanThreat && sirenEnabled) {
      tacticalSiren.startSiren();
    } else {
      tacticalSiren.stop();
    }

    return () => {
      tacticalSiren.stop();
    };
  }, [hasNonHumanThreat, sirenEnabled]);

  // 1. WebSocket connection for live detections & vector distances
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/stream');
        
        ws.onopen = () => {
          setWsStatus('CONNECTED');
          setBackendImageError(false);
        };

        ws.onclose = () => {
          setWsStatus('OFFLINE');
          reconnectTimer = setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setWsStatus('OFFLINE');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'detections' && Array.isArray(payload.data)) {
              setDetections(payload.data);
              if (payload.data.some((d: any) => d.class_id === 0)) {
                setAlertEscalated(false);
              }
            }
          } catch (e) {
            console.error(e);
          }
        };
      } catch {
        setWsStatus('OFFLINE');
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // 2. Setup Local Webcam Stream
  useEffect(() => {
    if (streamSource === 'webcam') {
      navigator.mediaDevices?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unavailable:', err);
          setStreamSource('simulated');
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamSource]);

  // 3. Simulated Tactical Feed Canvas Animator (renders simulated human + non-human vehicle/drone targets)
  useEffect(() => {
    let animationFrameId: number;
    let t = 0;

    const renderSimulated = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = visionMode === 'nvg' ? '#041508' : (visionMode === 'thermal' ? '#180424' : '#0a0d0a');
      ctx.fillRect(0, 0, w, h);

      // Grid matrix
      ctx.strokeStyle = visionMode === 'nvg' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0, 255, 100, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Target 1: Simulated Human
      const targetX = w / 2 + Math.sin(t * 0.8) * 140;
      const targetY = h / 2 + Math.cos(t * 0.5) * 60;
      
      ctx.strokeStyle = visionMode === 'nvg' ? '#4ade80' : (visionMode === 'thermal' ? '#f43f5e' : '#22c55e');
      ctx.lineWidth = 2;
      ctx.strokeRect(targetX - 25, targetY - 45, 50, 90);
      
      // Target Reticle Corner Brackets
      const bw = 8;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(targetX - 25, targetY - 45, bw, 2);
      ctx.fillRect(targetX - 25, targetY - 45, 2, bw);
      ctx.fillRect(targetX + 25 - bw, targetY - 45, bw, 2);
      ctx.fillRect(targetX + 25, targetY - 45, 2, bw);

      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.fillText('TARGET: HUMAN [0.96]', targetX - 25, targetY - 52);
      ctx.fillText('DIST: 14.2m // 3.2m/s', targetX - 25, targetY + 60);

      // Target 2: NON-HUMAN Target (Simulated Charger / Spoon / Electronic Device / Object)
      const vX = 180 + Math.cos(t * 0.4) * 120;
      const vY = 380 + Math.sin(t * 0.6) * 30;
      ctx.strokeStyle = '#ef4444'; // Red alarm for non-human object intrusion
      ctx.lineWidth = 2.5;
      ctx.strokeRect(vX - 35, vY - 25, 70, 50);

      ctx.fillStyle = '#ef4444';
      ctx.fillText('NON-HUMAN: CHARGER / OBJECT [0.93] 🚨 SIREN', vX - 35, vY - 32);
      ctx.fillText('DIST: 1.4m // OBJECT LOCATED', vX - 35, vY + 40);

      // Radar Scanline sweep
      const sweepY = (t * 120) % h;
      const gradient = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, sweepY - 30, w, 30);

      // Update synthetic detections if backend offline
      if (wsStatus === 'OFFLINE' && streamSource === 'simulated') {
        setDetections([
          {
            class_id: 0,
            class_name: 'person',
            confidence: 0.96,
            bbox: [targetX - 25, targetY - 45, targetX + 25, targetY + 45],
            distance_data: { distance_meters: 14.2, relative_vector: [4.1, 13.6] },
            is_non_human: false
          },
          {
            class_id: 67,
            class_name: 'charger / spoon / object',
            confidence: 0.93,
            bbox: [vX - 35, vY - 25, vX + 35, vY + 25],
            distance_data: { distance_meters: 1.4, relative_vector: [0.8, 1.2] },
            is_non_human: true
          }
        ]);
      }

      animationFrameId = requestAnimationFrame(renderSimulated);
    };

    if (streamSource === 'simulated') {
      renderSimulated();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [streamSource, visionMode, wsStatus]);

  // FPS ticker simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(+(29.5 + Math.random() * 0.9).toFixed(1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 800);
  };

  // Vision Filter CSS
  const getVisionFilterStyle = () => {
    switch (visionMode) {
      case 'thermal':
        return { filter: 'hue-rotate(280deg) saturate(2.5) contrast(1.4)' };
      case 'nvg':
        return { filter: 'sepia(1) hue-rotate(85deg) saturate(3) brightness(1.1) contrast(1.3)' };
      case 'flir':
        return { filter: 'invert(1) grayscale(1) contrast(1.6)' };
      default:
        return {};
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              padding: '8px 12px', 
              border: '1px solid var(--color-border)', 
              borderRadius: 4, 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={16} /> BACK
          </button>
          <div>
            <h2 style={{ fontSize: 20, color: 'var(--color-accent)' }}>{camera.id} // {camera.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
              ZONE: {camera.zone} &bull; SENSOR: {camera.type} &bull; FEED: LIVE ENCRYPTED
            </p>
          </div>
        </div>

        {/* Source Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>SOURCE:</span>
          <button 
            onClick={() => { setStreamSource('backend'); setBackendImageError(false); }}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontFamily: "'Share Tech Mono', monospace",
              borderRadius: 3,
              backgroundColor: streamSource === 'backend' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: streamSource === 'backend' ? '#000' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontWeight: streamSource === 'backend' ? 'bold' : 'normal'
            }}
          >
            AI BACKEND (PORT 8000)
          </button>

          <button 
            onClick={() => setStreamSource('webcam')}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontFamily: "'Share Tech Mono', monospace",
              borderRadius: 3,
              backgroundColor: streamSource === 'webcam' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: streamSource === 'webcam' ? '#000' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontWeight: streamSource === 'webcam' ? 'bold' : 'normal'
            }}
          >
            LOCAL WEBCAM
          </button>

          <button 
            onClick={() => setStreamSource('simulated')}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontFamily: "'Share Tech Mono', monospace",
              borderRadius: 3,
              backgroundColor: streamSource === 'simulated' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: streamSource === 'simulated' ? '#000' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontWeight: streamSource === 'simulated' ? 'bold' : 'normal'
            }}
          >
            TACTICAL SIM
          </button>
        </div>
      </div>

      {/* Main Monitoring Grid */}
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 170px)' }}>
        {/* Main Video Screen Container */}
        <div 
          className={`camera-feed ${hasNonHumanThreat ? 'animate-pulse' : ''}`}
          style={{ 
            flex: 2.2, 
            borderRadius: 6, 
            border: hasNonHumanThreat ? '3px solid #ef4444' : (hasHumanThreat ? '2px solid var(--color-warning)' : '1px solid var(--color-border)'), 
            boxShadow: hasNonHumanThreat ? '0 0 35px rgba(239, 68, 68, 0.65)' : 'none',
            position: isFullScreen ? 'fixed' : 'relative', 
            top: isFullScreen ? 0 : 'auto',
            left: isFullScreen ? 0 : 'auto',
            width: isFullScreen ? '100vw' : 'auto',
            height: isFullScreen ? '100vh' : 'auto',
            zIndex: isFullScreen ? 9999 : 1,
            backgroundColor: '#050705',
            overflow: 'hidden',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          {/* Emergency Siren Visual Flasher Banner */}
          {hasNonHumanThreat && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: 13,
              fontWeight: 900,
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: 2,
              zIndex: 30,
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.8)'
            }}>
              <Siren size={18} className="animate-spin" />
              NON-HUMAN OBJECT INTRUSION DETECTED // TACTICAL SIREN ACTIVE // {latestNonHuman?.class_name?.toUpperCase() || 'OBJECT'}
              <Siren size={18} className="animate-spin" />
            </div>
          )}

          {/* Flash animation on snapshot */}
          {snapshotTaken && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 100 }} />
          )}

          {/* 1. AI Backend Live Stream */}
          {streamSource === 'backend' && (
            !backendImageError ? (
              <img 
                src="http://localhost:8000/video_feed" 
                alt="AI Live Video Stream"
                onError={() => setBackendImageError(true)}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease',
                  ...getVisionFilterStyle()
                }} 
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <AlertTriangle size={36} color="var(--color-warning)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--color-text)', fontSize: 14, marginBottom: 8 }}>
                  FastAPI Video Backend Stream (Port 8000) not responding.
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 16 }}>
                  Run <code>npm run backend</code> or switch to Local Webcam / Tactical Sim.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button 
                    onClick={() => setBackendImageError(false)}
                    style={{ padding: '6px 14px', backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', borderRadius: 4, cursor: 'pointer' }}
                  >
                    <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> RETRY STREAM
                  </button>
                  <button 
                    onClick={() => setStreamSource('webcam')}
                    style={{ padding: '6px 14px', backgroundColor: 'var(--color-accent)', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ENABLE LOCAL WEBCAM
                  </button>
                  <button 
                    onClick={() => setStreamSource('simulated')}
                    style={{ padding: '6px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 4, cursor: 'pointer' }}
                  >
                    OPEN TACTICAL SIM
                  </button>
                </div>
              </div>
            )
          )}

          {/* 2. Direct Browser Webcam */}
          {streamSource === 'webcam' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel})`,
                  ...getVisionFilterStyle()
                }} 
              />
              {/* Tactical Crosshair overlay on webcam */}
              <div style={{ position: 'absolute', pointerEvents: 'none', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crosshair size={48} color="rgba(34, 197, 94, 0.4)" />
              </div>
            </div>
          )}

          {/* 3. Tactical Synthetic Surveillance Mode */}
          {streamSource === 'simulated' && (
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={550} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                transform: `scale(${zoomLevel})`,
                ...getVisionFilterStyle()
              }} 
            />
          )}

          {/* Tactical HUD Overlays */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 10, zIndex: 10 }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 4, color: 'var(--color-accent)', fontSize: 12, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
              {camera.type} // {camera.id}
            </span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 4, color: 'var(--color-success)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
              <span className="status-dot live" style={{ marginRight: 0 }}></span> REC {fps} FPS
            </span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 4, color: wsStatus === 'CONNECTED' ? 'var(--color-success)' : 'var(--color-alert)', fontSize: 12, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
              WS: {wsStatus}
            </span>
          </div>

          {/* Bottom HUD Controls: Filters, Zoom, Snapshot, Fullscreen */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.75)', padding: '8px 14px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
            {/* Vision Mode Filters */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", marginRight: 4 }}>
                <Eye size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> MODE:
              </span>
              {(['normal', 'thermal', 'nvg', 'flir'] as VisionMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setVisionMode(mode)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    borderRadius: 3,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    backgroundColor: visionMode === mode ? 'var(--color-accent)' : 'transparent',
                    color: visionMode === mode ? '#000' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    fontWeight: visionMode === mode ? 'bold' : 'normal'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Quick Actions: Zoom, Audio, Snapshot, Fullscreen */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 0.25).toFixed(2)))}
                title="Zoom Out"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: 6, borderRadius: 4, cursor: 'pointer' }}
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: 11, color: 'var(--color-accent)', fontFamily: "'Share Tech Mono', monospace" }}>
                {zoomLevel.toFixed(1)}x
              </span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(3, +(prev + 0.25).toFixed(2)))}
                title="Zoom In"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: 6, borderRadius: 4, cursor: 'pointer' }}
              >
                <ZoomIn size={15} />
              </button>

              <button 
                onClick={triggerSnapshot}
                title="Capture Snapshot"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-accent)', padding: 6, borderRadius: 4, cursor: 'pointer' }}
              >
                <Camera size={15} />
              </button>

              {/* Siren Alert Toggle Button */}
              <button 
                onClick={() => {
                  const next = !sirenEnabled;
                  setSirenEnabled(next);
                  tacticalSiren.setMuted(!next);
                  if (next) tacticalSiren.playTestSiren(400);
                }}
                title={sirenEnabled ? 'Tactical Siren Armed (Click to Mute)' : 'Siren Muted (Click to Arm)'}
                style={{ 
                  background: sirenEnabled && hasNonHumanThreat ? 'var(--color-alert)' : (sirenEnabled ? 'rgba(239, 68, 68, 0.15)' : 'transparent'), 
                  border: sirenEnabled ? '1px solid var(--color-alert)' : '1px solid var(--color-border)', 
                  color: sirenEnabled ? (hasNonHumanThreat ? '#fff' : 'var(--color-alert)') : 'var(--color-text-muted)', 
                  padding: '5px 10px', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 'bold'
                }}
              >
                {sirenEnabled ? <Siren size={14} className={hasNonHumanThreat ? "animate-pulse" : ""} /> : <VolumeX size={14} />}
                SIREN: {sirenEnabled ? (hasNonHumanThreat ? 'WAILING' : 'ARMED') : 'MUTED'}
              </button>

              <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                style={{ background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', padding: 6, borderRadius: 4, cursor: 'pointer' }}
              >
                {isFullScreen ? <X size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Intelligence & Telemetry Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Non-Human Threat Warning Banner */}
          {hasNonHumanThreat && (
            <div className="card animate-pulse" style={{ borderColor: 'var(--color-alert)', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Siren size={24} color="var(--color-alert)" />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--color-alert)', fontSize: 13, letterSpacing: 1 }}>
                  NON-HUMAN OBJECT INTRUSION
                </h4>
                <p style={{ fontSize: 11, color: '#fff', fontFamily: "'Share Tech Mono', monospace" }}>
                  TACTICAL SIREN ACTIVE &bull; OBJECT: {latestNonHuman?.class_name?.toUpperCase() || 'UNKNOWN OBJECT'}
                </p>
              </div>
            </div>
          )}

          {/* Sensor Telemetry */}
          <div className="card">
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 12, fontSize: 13, letterSpacing: 1.5 }}>
              SENSOR TELEMETRY
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>CAMERA ID</span>
                <strong style={{ color: 'var(--color-accent)' }}>{camera.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>SECTOR</span>
                <span>{camera.zone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>LAT / LON</span>
                <span>35.6895° N, 139.6917° E</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>ALARM TRIGGER</span>
                <span style={{ color: 'var(--color-alert)' }}>NON-HUMAN OBJECT SIREN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>STATUS</span>
                <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> LIVE OPERATIONAL
                </span>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Target Tracking */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderColor: hasNonHumanThreat || hasHumanThreat ? 'var(--color-alert)' : 'var(--color-border)' }}>
            <h4 style={{ color: hasNonHumanThreat ? 'var(--color-alert)' : 'var(--color-text-muted)', marginBottom: 14, fontSize: 13, letterSpacing: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AI TARGET TRACKING</span>
              <span className="badge" style={{ backgroundColor: hasNonHumanThreat ? 'var(--color-alert)' : 'rgba(34, 197, 94, 0.2)', color: hasNonHumanThreat ? '#fff' : 'var(--color-success)' }}>
                {detections.length} TARGETS {hasNonHumanThreat && '🚨 SIREN'}
              </span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
              {/* Non-Human Detection Box */}
              <div style={{ padding: 12, backgroundColor: hasNonHumanThreat ? 'rgba(239, 68, 68, 0.16)' : 'var(--color-surface-light)', border: hasNonHumanThreat ? '1px solid var(--color-alert)' : '1px solid var(--color-border)', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h5 style={{ color: hasNonHumanThreat ? 'var(--color-alert)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    {hasNonHumanThreat ? <Siren size={15} /> : <ShieldCheck size={15} />} 
                    {hasNonHumanThreat ? 'NON-HUMAN OBJECT: SIREN ACTIVE' : 'NO NON-HUMAN OBJECTS'}
                  </h5>
                  {hasNonHumanThreat && (
                    <span className="badge" style={{ backgroundColor: 'var(--color-alert)', color: '#fff', fontSize: 10 }}>
                      SIREN {sirenEnabled ? 'ACTIVE' : 'MUTED'}
                    </span>
                  )}
                </div>
                
                {hasNonHumanThreat ? (
                  <div style={{ fontSize: 12, color: 'var(--color-text)', fontFamily: "'Share Tech Mono', monospace", display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>TARGET OBJECT:</span>
                      <strong style={{ color: 'var(--color-alert)' }}>{latestNonHuman?.class_name?.toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>ESTIMATED DISTANCE:</span>
                      <strong>{latestNonHuman?.distance_data?.distance_meters || 1.4} METERS</strong>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                    Perimeter clear of spoons, chargers, phones, tools, and non-human objects.
                  </p>
                )}
              </div>

              {/* Human Detection Status Box */}
              <div style={{ padding: 10, backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h5 style={{ color: hasHumanThreat ? 'var(--color-warning)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <AlertTriangle size={14} /> Human Presence
                  </h5>
                  <span style={{ fontSize: 11, color: hasHumanThreat ? 'var(--color-warning)' : 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                    {hasHumanThreat ? 'DETECTED' : 'NONE'}
                  </span>
                </div>
                {hasHumanThreat && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
                    Human target identified at {latestHuman?.distance_data?.distance_meters || 14.2}m.
                  </span>
                )}
              </div>

              {/* Active Target Detections List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                  OBJECT CLASSIFICATION LOG:
                </span>
                {detections.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: d.class_id !== 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface)', border: d.class_id !== 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--color-border)', borderRadius: 3, fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                    <span style={{ color: d.class_id !== 0 ? 'var(--color-alert)' : 'var(--color-accent)' }}>
                      #{idx + 1} {d.class_name?.toUpperCase() || 'OBJECT'} {d.class_id !== 0 && '🚨 [SIREN TRIGGER]'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {(d.confidence * 100).toFixed(0)}% &bull; {d.distance_data?.distance_meters ? `${d.distance_data.distance_meters}m` : 'TRACKING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Escalation Action */}
            <div style={{ marginTop: 'auto', paddingTop: 14 }}>
              {!alertEscalated ? (
                <div>
                  <div style={{ backgroundColor: hasNonHumanThreat ? 'var(--color-alert)' : (hasHumanThreat ? 'var(--color-warning)' : 'rgba(245, 158, 11, 0.2)'), color: hasNonHumanThreat || hasHumanThreat ? '#fff' : 'var(--color-warning)', padding: '8px 12px', borderRadius: 4, textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 10, fontFamily: "'Share Tech Mono', monospace" }}>
                    {hasNonHumanThreat ? 'NON-HUMAN INTRUDER // SIREN WAILING' : (hasHumanThreat ? 'HUMAN IN SECTOR' : 'STANDBY // SYSTEM ARMED')}
                  </div>
                  <button 
                    onClick={() => {
                      setAlertEscalated(true);
                      tacticalSiren.stop();
                    }}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      backgroundColor: 'transparent', 
                      border: '1px solid var(--color-alert)', 
                      color: 'var(--color-alert)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: "'Share Tech Mono', monospace",
                      letterSpacing: 1
                    }}
                  >
                    ACKNOWLEDGE & ESCALATE DEFCON
                  </button>
                </div>
              ) : (
                <div style={{ padding: 10, backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 4, textAlign: 'center', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
                  <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  INCIDENT ACKNOWLEDGED // SIREN SILENCED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
