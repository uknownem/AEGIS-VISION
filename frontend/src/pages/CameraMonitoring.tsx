import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCameras } from '../mockData';
import { 
  ArrowLeft, Maximize2, AlertTriangle, ShieldCheck, X, Camera, 
  Eye, VolumeX, ZoomIn, ZoomOut, Siren
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';
import { API_BASE_URL, WS_BASE_URL } from '../config';

type StreamSource = 'backend' | 'webcam' | 'simulated';
type VisionMode = 'normal' | 'thermal' | 'nvg' | 'flir';

export default function CameraMonitoring() {
  const { id } = useParams();
  const navigate = useNavigate();
  const camera = mockCameras.find(c => c.id === id) || mockCameras[0];
  
  // Default to High-Definition Tactical Reconnaissance simulation feed
  const [streamSource, setStreamSource] = useState<StreamSource>('simulated');

  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [alertEscalated, setAlertEscalated] = useState(false);
  const [sirenEnabled, setSirenEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fps, setFps] = useState(29.8);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  
  // Simulated Intruder Threat Toggle (to test sirens interactively on cloud/Vercel)
  const [simulatedThreatActive, setSimulatedThreatActive] = useState(true);

  // Real-time detection state from Backend WebSocket or Tactical Simulator
  const [detections, setDetections] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
  const [backendImageError, setBackendImageError] = useState(false);

  // References for Webcam, Canvas & Background Image
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [aiModelStatus, setAiModelStatus] = useState<string>('INITIALIZING AI VISION...');

  // Determine cover picture path based on camera ID
  const getCameraCover = (camId: string) => {
    if (camId === 'CAM-01') return '/cctv_himalayan_feed.jpg';
    if (camId === 'CAM-02') return '/cam02_main_gate.jpg';
    if (camId === 'CAM-03') return '/thermal_flir_alert.jpg';
    if (camId === 'CAM-04') return '/drone_aerial_recon.jpg';
    return '/cctv_himalayan_feed.jpg';
  };

  // Preload background image for high-def tactical simulation canvas
  useEffect(() => {
    const img = new Image();
    img.src = getCameraCover(camera.id);
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, [camera.id]);

  // Continuous Siren State with Hysteresis (Persistence Hold to prevent frame drops from stopping siren)
  const [activeSirenAlert, setActiveSirenAlert] = useState(false);
  const lastThreatTimeRef = useRef<number>(0);
  const sirenHoldTimerRef = useRef<any>(null);

  // Non-human target detection calculation
  const nonHumanDetections = detections.filter(d => d.class_id !== 0 && (d.is_non_human !== false));
  const hasRawNonHuman = nonHumanDetections.length > 0;
  const hasHumanThreat = detections.some(d => d.class_id === 0);
  const latestHuman = detections.find(d => d.class_id === 0);
  const latestNonHuman = nonHumanDetections[0];

  // Object Detection Persistence Tracker: keeps siren ON continuously until object completely exits
  useEffect(() => {
    if (hasRawNonHuman) {
      lastThreatTimeRef.current = Date.now();
      setActiveSirenAlert(true);
      if (sirenHoldTimerRef.current) {
        clearTimeout(sirenHoldTimerRef.current);
        sirenHoldTimerRef.current = null;
      }
    } else {
      // If object was detected, hold the siren active for 1.5s of sustained absence before shutting off
      if (activeSirenAlert && !sirenHoldTimerRef.current) {
        sirenHoldTimerRef.current = setTimeout(() => {
          const elapsed = Date.now() - lastThreatTimeRef.current;
          if (elapsed >= 1500) {
            setActiveSirenAlert(false);
          }
          sirenHoldTimerRef.current = null;
        }, 1500);
      }
    }
  }, [hasRawNonHuman, activeSirenAlert]);

  // Master Continuous Siren Trigger: continuously wails while non-human object is present
  useEffect(() => {
    if (activeSirenAlert && sirenEnabled && !alertEscalated) {
      tacticalSiren.startSiren();
    } else {
      tacticalSiren.stop();
    }

    return () => {
      tacticalSiren.stop();
    };
  }, [activeSirenAlert, sirenEnabled, alertEscalated]);

  const hasNonHumanThreat = activeSirenAlert;

  // 1. WebSocket connection for live detections & vector distances
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(WS_BASE_URL);
        
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

  // 2b. In-Browser Real-Time AI Object Detection on Local Webcam (TensorFlow COCO-SSD)
  useEffect(() => {
    if (streamSource !== 'webcam') return;

    let isRunning = true;
    let animId: number;
    let detectorModel: any = null;

    const initDetector = async () => {
      setAiModelStatus('INITIALIZING AI NEURAL NET...');

      // Dynamic script injector helper
      const ensureScripts = async (): Promise<any> => {
        if ((window as any).cocoSsd) return (window as any).cocoSsd;
        
        if (!document.getElementById('tfjs-script')) {
          const s1 = document.createElement('script');
          s1.id = 'tfjs-script';
          s1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
          document.head.appendChild(s1);
          await new Promise(r => { s1.onload = r; });
        }
        if (!document.getElementById('coco-script')) {
          const s2 = document.createElement('script');
          s2.id = 'coco-script';
          s2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
          document.head.appendChild(s2);
          await new Promise(r => { s2.onload = r; });
        }
        return (window as any).cocoSsd;
      };

      try {
        const coco = await ensureScripts();
        if (coco) {
          detectorModel = await coco.load({ base: 'lite_mobilenet_v2' }).catch(() => coco.load());
          if (isRunning) setAiModelStatus('ACTIVE (YOLO/COCO-SSD NEURAL NET)');
        }
      } catch (err) {
        console.warn('COCO-SSD neural net loading note:', err);
        if (isRunning) setAiModelStatus('ACTIVE (TACTICAL OPTICAL SENSOR)');
      }

      // Detection loop on every webcam frame
      const runDetection = async () => {
        if (!isRunning) return;

        const video = videoRef.current;
        const canvas = webcamCanvasRef.current;

        if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;

            if (detectorModel) {
              try {
                const predictions = await detectorModel.detect(video);
                const detectedItems: any[] = [];

                predictions.forEach((pred: any) => {
                  const [bx, by, bw, bh] = pred.bbox;
                  const isHuman = pred.class.toLowerCase() === 'person';
                  const isNonHuman = !isHuman;
                  
                  // Estimated distance calculation based on bounding box size
                  const estDist = Math.max(0.3, +( (110 / Math.max(bw, bh)) * (isHuman ? 1.8 : 0.45) ).toFixed(1));

                  // Draw Tactical Bounding Box
                  ctx.strokeStyle = isNonHuman ? '#ef4444' : '#22c55e';
                  ctx.lineWidth = isNonHuman ? 3.5 : 2.5;
                  ctx.strokeRect(bx, by, bw, bh);

                  // Semi-transparent box background fill
                  ctx.fillStyle = isNonHuman ? 'rgba(239, 68, 68, 0.16)' : 'rgba(34, 197, 94, 0.12)';
                  ctx.fillRect(bx, by, bw, bh);

                  // Reticle Corner Brackets
                  const bLen = Math.min(16, bw * 0.2, bh * 0.2);
                  ctx.fillStyle = ctx.strokeStyle;
                  ctx.fillRect(bx, by, bLen, 3);
                  ctx.fillRect(bx, by, 3, bLen);
                  ctx.fillRect(bx + bw - bLen, by, bLen, 3);
                  ctx.fillRect(bx + bw, by, 3, bLen);
                  ctx.fillRect(bx, by + bh, bLen, 3);
                  ctx.fillRect(bx, by + bh - bLen, 3, bLen);
                  ctx.fillRect(bx + bw - bLen, by + bh, bLen, 3);
                  ctx.fillRect(bx + bw, by + bh - bLen, 3, bLen);

                  // Text Label
                  ctx.font = 'bold 13px "Share Tech Mono", monospace';
                  if (isNonHuman) {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillText(`🚨 NON-HUMAN: ${pred.class.toUpperCase()} [${Math.round(pred.score * 100)}%] // SIREN ACTIVE`, bx, by > 18 ? by - 8 : by + 18);
                    ctx.fillText(`DIST: ${estDist}m // TRACKING`, bx, by + bh + 18);
                  } else {
                    ctx.fillStyle = '#22c55e';
                    ctx.fillText(`SOLDIER: HUMAN [${Math.round(pred.score * 100)}%]`, bx, by > 18 ? by - 8 : by + 18);
                    ctx.fillText(`DIST: ${estDist}m // AUTHORIZED`, bx, by + bh + 18);
                  }

                  detectedItems.push({
                    class_id: isHuman ? 0 : 67,
                    class_name: pred.class,
                    confidence: pred.score,
                    bbox: [bx, by, bx + bw, by + bh],
                    distance_data: { distance_meters: estDist, relative_vector: [bx, by] },
                    is_non_human: isNonHuman
                  });
                });

                setDetections(detectedItems);
              } catch (e) {
                // Ignore transient frame drop
              }
            } else {
              // Heuristic / Optical movement tracker while neural net initializes
              ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
              ctx.lineWidth = 1;
              ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.6);
              ctx.font = '12px "Share Tech Mono", monospace';
              ctx.fillStyle = 'var(--color-accent)';
              ctx.fillText('TACTICAL OPTICAL GRID: SCANNING FOR INTRUDERS...', w * 0.25, h * 0.2 - 8);
            }
          }
        }

        animId = requestAnimationFrame(runDetection);
      };

      runDetection();
    };

    initDetector();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [streamSource]);

  // 3. High-Fidelity Tactical Surveillance Feed Canvas Animator
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

      // Draw preloaded tactical background image or fallback gradient
      const bg = bgImageRef.current;
      if (bg && bg.complete && bg.naturalWidth > 0) {
        ctx.drawImage(bg, 0, 0, w, h);
        // Dimming & color grading overlay based on vision mode
        if (visionMode === 'nvg') {
          ctx.fillStyle = 'rgba(10, 45, 15, 0.45)';
        } else if (visionMode === 'thermal') {
          ctx.fillStyle = 'rgba(50, 10, 60, 0.45)';
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        }
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = visionMode === 'nvg' ? '#041508' : (visionMode === 'thermal' ? '#180424' : '#0a0d0a');
        ctx.fillRect(0, 0, w, h);
      }

      // Tactical Matrix Grid Lines
      ctx.strokeStyle = visionMode === 'nvg' ? 'rgba(74, 222, 128, 0.18)' : 'rgba(163, 230, 53, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Target 1: Tracked Soldier / Person
      const targetX = w / 2 + Math.sin(t * 0.8) * 140;
      const targetY = h / 2 + Math.cos(t * 0.5) * 60;
      
      ctx.strokeStyle = visionMode === 'nvg' ? '#4ade80' : (visionMode === 'thermal' ? '#f43f5e' : '#22c55e');
      ctx.lineWidth = 2;
      ctx.strokeRect(targetX - 25, targetY - 45, 50, 90);
      
      // Target Corner Reticle Brackets
      const bw = 8;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(targetX - 25, targetY - 45, bw, 2);
      ctx.fillRect(targetX - 25, targetY - 45, 2, bw);
      ctx.fillRect(targetX + 25 - bw, targetY - 45, bw, 2);
      ctx.fillRect(targetX + 25, targetY - 45, 2, bw);

      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.fillText('SOLDIER: AUTHORIZED [0.97]', targetX - 25, targetY - 52);
      ctx.fillText('DIST: 14.2m // 3.2m/s', targetX - 25, targetY + 60);

      // Target 2: NON-HUMAN Target (Spoon / Charger / Vehicle / Drone Threat)
      const vX = 220 + Math.cos(t * 0.45) * 130;
      const vY = 360 + Math.sin(t * 0.6) * 40;

      if (simulatedThreatActive) {
        ctx.strokeStyle = '#ef4444'; // Red alarm for non-human object intrusion
        ctx.lineWidth = 2.5;
        ctx.strokeRect(vX - 35, vY - 25, 70, 50);

        // Flashy warning box
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(vX - 35, vY - 25, 70, 50);

        ctx.fillStyle = '#ef4444';
        const threatName = camera.id === 'CAM-01' ? 'SPOON / CHARGER / OBJECT' : (camera.id === 'CAM-04' ? 'UAV DRONE BREACH' : 'ARMORED VEHICLE / TANK');
        ctx.fillText(`🚨 NON-HUMAN: ${threatName} [0.94]`, vX - 35, vY - 32);
        ctx.fillText('DIST: 1.4m // SIREN ACTIVE', vX - 35, vY + 42);
      }

      // Radar Scanline sweep
      const sweepY = (t * 130) % h;
      const gradient = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, sweepY - 30, w, 30);

      // Update synthetic detections if backend offline or in simulation mode
      if ((wsStatus === 'OFFLINE' || streamSource === 'simulated' || backendImageError)) {
        const synDetections: any[] = [
          {
            class_id: 0,
            class_name: 'person',
            confidence: 0.97,
            bbox: [targetX - 25, targetY - 45, targetX + 25, targetY + 45],
            distance_data: { distance_meters: 14.2, relative_vector: [4.1, 13.6] },
            is_non_human: false
          }
        ];

        if (simulatedThreatActive) {
          synDetections.push({
            class_id: 67,
            class_name: camera.id === 'CAM-01' ? 'spoon / charger / object' : (camera.id === 'CAM-04' ? 'unauthorized UAV' : 'armored tank'),
            confidence: 0.94,
            bbox: [vX - 35, vY - 25, vX + 35, vY + 25],
            distance_data: { distance_meters: 1.4, relative_vector: [0.8, 1.2] },
            is_non_human: true
          });
        }

        setDetections(synDetections);
      }

      animationFrameId = requestAnimationFrame(renderSimulated);
    };

    if (streamSource === 'simulated' || (streamSource === 'backend' && backendImageError)) {
      renderSimulated();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [streamSource, visionMode, wsStatus, backendImageError, simulatedThreatActive, camera.id]);

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
            TACTICAL RECON (LIVE)
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
          {streamSource === 'backend' && !backendImageError && (
            <img 
              src={`${API_BASE_URL}/video_feed`} 
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
          )}

          {/* Cloud Standalone Notice Banner when Backend is Offline */}
          {streamSource === 'backend' && backendImageError && (
            <div style={{
              position: 'absolute',
              top: 50,
              left: 16,
              right: 16,
              backgroundColor: 'rgba(234, 179, 8, 0.2)',
              border: '1px solid var(--color-warning)',
              borderRadius: 4,
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 25,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11
            }}>
              <span style={{ color: 'var(--color-warning)' }}>
                ⚡ CLOUD MODE: FastAPI backend offline — High-Res Tactical Recon Stream Engaged
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setStreamSource('webcam')} 
                  style={{ background: 'var(--color-accent)', color: '#000', border: 'none', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold', fontSize: 10 }}
                >
                  USE WEBCAM
                </button>
                <button 
                  onClick={() => setBackendImageError(false)} 
                  style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}
                >
                  RETRY
                </button>
              </div>
            </div>
          )}

          {/* 2. Direct Browser Webcam with Real-Time AI Object Detection Overlay */}
          {streamSource === 'webcam' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020402', overflow: 'hidden' }}>
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
              <canvas
                ref={webcamCanvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  transform: `scale(${zoomLevel})`,
                  zIndex: 5
                }}
              />
              {/* Tactical Status Pill for Webcam AI Detector */}
              <div style={{ position: 'absolute', bottom: 12, left: 16, backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--color-accent)', padding: '5px 12px', borderRadius: 4, color: 'var(--color-accent)', fontSize: 11, fontFamily: "'Share Tech Mono', monospace", zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-dot live" style={{ margin: 0 }}></span>
                WEBCAM AI VISION: <strong>{aiModelStatus}</strong>
                {detections.length > 0 && <span style={{ color: hasNonHumanThreat ? 'var(--color-alert)' : 'var(--color-success)', fontWeight: 'bold' }}>({detections.length} TARGETS DETECTED)</span>}
              </div>
            </div>
          )}

          {/* 3. Tactical Synthetic Surveillance Canvas Feed (Active in simulated mode OR when backend is offline) */}
          {(streamSource === 'simulated' || (streamSource === 'backend' && backendImageError)) && (
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

            {/* Interactive Threat & Siren Test Button (Ideal for testing on Vercel) */}
            <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
              <button
                onClick={() => {
                  const next = !simulatedThreatActive;
                  setSimulatedThreatActive(next);
                  if (next) {
                    setAlertEscalated(false);
                    tacticalSiren.startSiren();
                  } else {
                    tacticalSiren.stop();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: simulatedThreatActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                  border: `1px solid ${simulatedThreatActive ? 'var(--color-alert)' : 'var(--color-success)'}`,
                  color: simulatedThreatActive ? 'var(--color-alert)' : 'var(--color-success)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 8
                }}
              >
                <Siren size={14} className={simulatedThreatActive ? "animate-spin" : ""} />
                {simulatedThreatActive ? 'SIMULATING THREAT (SIREN ACTIVE)' : 'SIMULATE NON-HUMAN THREAT'}
              </button>
            </div>

            {/* Operator Escalation Action */}
            <div style={{ marginTop: 'auto', paddingTop: 6 }}>
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
