import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Volume2, VolumeX, Eye, Radio, Play, Sparkles, ArrowLeft, Siren
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';
import { API_BASE_URL } from '../config';

type VisionMode = 'normal' | 'thermal' | 'nvg' | 'flir';
type DefconLevel = 'DEFCON 5' | 'DEFCON 4' | 'DEFCON 3' | 'DEFCON 2' | 'DEFCON 1';

interface DemoTarget {
  id: string;
  type: 'HUMAN' | 'NON_HUMAN_OBJECT' | 'DRONE' | 'VEHICLE';
  name: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  distance: number;
  isThreat: boolean;
}

export default function DemoPage() {
  // Vision & Sensor Settings
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [defconLevel, setDefconLevel] = useState<DefconLevel>('DEFCON 2');
  const [sirenActive, setSirenActive] = useState(false);
  const [sirenMuted, setSirenMuted] = useState(false);

  // Targets on the interactive canvas
  const [targets, setTargets] = useState<DemoTarget[]>([
    {
      id: 'target-1',
      type: 'HUMAN',
      name: 'SOLDIER: AUTHORIZED SENTRY',
      confidence: 0.98,
      x: 220,
      y: 180,
      w: 80,
      h: 140,
      distance: 14.5,
      isThreat: false
    },
    {
      id: 'target-2',
      type: 'NON_HUMAN_OBJECT',
      name: 'NON-HUMAN: SPOON / CHARGER / OBJECT',
      confidence: 0.94,
      x: 480,
      y: 220,
      w: 70,
      h: 60,
      distance: 1.8,
      isThreat: true
    }
  ]);

  // Tripwire Breach Detection State
  const [tripwireBreached, setTripwireBreached] = useState(false);
  const [eventLogs, setEventLogs] = useState<string[]>([
    '[19:42:01] DEFENSE GRID INITIALIZED IN DEMO SIMULATION MODE',
    '[19:42:03] SENSOR MATRIX: 4K OPTICAL + FLIR THERMAL ACTIVE',
    '[19:42:05] TARGET DETECTED: SENTRY SOLDIER (AUTHORIZED)',
    '[19:42:08] TARGET DETECTED: NON-HUMAN OBJECT INTRUSION'
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const draggingTargetId = useRef<string | null>(null);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = '/cctv_himalayan_feed.jpg';
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, []);

  // Continuous Siren Controller
  useEffect(() => {
    const hasActiveThreat = targets.some(t => t.isThreat) || tripwireBreached;
    setSirenActive(hasActiveThreat);

    if (hasActiveThreat && !sirenMuted) {
      tacticalSiren.startSiren();
    } else {
      tacticalSiren.stop();
    }

    return () => {
      tacticalSiren.stop();
    };
  }, [targets, tripwireBreached, sirenMuted]);

  // Canvas Interactive Rendering Loop
  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      // Draw background or tactical gradient
      if (bgImageRef.current && bgImageRef.current.complete) {
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        // Dimming overlay based on vision mode
        if (visionMode === 'nvg') ctx.fillStyle = 'rgba(6, 45, 12, 0.45)';
        else if (visionMode === 'thermal') ctx.fillStyle = 'rgba(45, 8, 55, 0.45)';
        else if (visionMode === 'flir') ctx.fillStyle = 'rgba(10, 10, 30, 0.5)';
        else ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#050a05';
        ctx.fillRect(0, 0, w, h);
      }

      // Matrix Grid
      ctx.strokeStyle = visionMode === 'nvg' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(34, 197, 94, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Red Laser Tripwire line across middle
      const tripwireX = 400;
      ctx.strokeStyle = tripwireBreached ? '#ef4444' : 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = tripwireBreached ? 3.5 : 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(tripwireX, 0);
      ctx.lineTo(tripwireX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tripwire Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      ctx.fillText('⚡ LASER TRIPWIRE PERIMETER [RESTRICTED]', tripwireX + 8, 24);

      // Radar Scanline
      const sweepY = (t * 120) % h;
      const gradient = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, sweepY - 30, w, 30);

      // Draw all Interactive Targets with Tactical HUD Corner Brackets
      let isBreached = false;

      targets.forEach(tgt => {
        const isThreat = tgt.isThreat;
        const color = isThreat ? '#ef4444' : '#22c55e';
        const bgFill = isThreat ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.12)';

        // Check if target overlaps laser tripwire
        if (tgt.x < tripwireX && tgt.x + tgt.w > tripwireX) {
          isBreached = true;
        }

        // Bounding Box
        ctx.strokeStyle = color;
        ctx.lineWidth = isThreat ? 3 : 2;
        ctx.strokeRect(tgt.x, tgt.y, tgt.w, tgt.h);
        ctx.fillStyle = bgFill;
        ctx.fillRect(tgt.x, tgt.y, tgt.w, tgt.h);

        // Corner Reticle Brackets
        const bLen = 12;
        ctx.fillStyle = color;
        ctx.fillRect(tgt.x, tgt.y, bLen, 3);
        ctx.fillRect(tgt.x, tgt.y, 3, bLen);
        ctx.fillRect(tgt.x + tgt.w - bLen, tgt.y, bLen, 3);
        ctx.fillRect(tgt.x + tgt.w - 3, tgt.y, 3, bLen);
        ctx.fillRect(tgt.x, tgt.y + tgt.h - 3, bLen, 3);
        ctx.fillRect(tgt.x, tgt.y + tgt.h - bLen, 3, bLen);
        ctx.fillRect(tgt.x + tgt.w - bLen, tgt.y + tgt.h - 3, bLen, 3);
        ctx.fillRect(tgt.x + tgt.w - 3, tgt.y + tgt.h - bLen, 3, bLen);

        // Text Badges
        ctx.font = 'bold 12px "Share Tech Mono", monospace';
        ctx.fillStyle = color;
        ctx.fillText(`[${Math.round(tgt.confidence * 100)}%] ${tgt.name}`, tgt.x, tgt.y - 8);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillText(`DIST: ${tgt.distance}m // ${isThreat ? '🚨 ALARM ACTIVE' : 'AUTHORIZED'}`, tgt.x, tgt.y + tgt.h + 16);
      });

      setTripwireBreached(isBreached);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [targets, visionMode, tripwireBreached]);

  // Target Drag & Drop handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const clicked = targets.find(t => clickX >= t.x && clickX <= t.x + t.w && clickY >= t.y && clickY <= t.y + t.h);
    if (clicked) {
      draggingTargetId.current = clicked.id;
      tacticalSiren.initContext();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingTargetId.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const posX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const posY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setTargets(prev => prev.map(tgt => {
      if (tgt.id === draggingTargetId.current) {
        return {
          ...tgt,
          x: Math.max(10, Math.min(canvas.width - tgt.w - 10, posX - tgt.w / 2)),
          y: Math.max(10, Math.min(canvas.height - tgt.h - 10, posY - tgt.h / 2))
        };
      }
      return tgt;
    }));
  };

  const handleMouseUp = () => {
    draggingTargetId.current = null;
  };

  // Add Target helper
  const addTarget = (type: DemoTarget['type']) => {
    tacticalSiren.initContext();
    let newTgt: DemoTarget;
    const now = new Date().toLocaleTimeString();

    if (type === 'HUMAN') {
      newTgt = {
        id: `tgt-${Date.now()}`,
        type: 'HUMAN',
        name: 'SOLDIER: PATROL SENTRY',
        confidence: 0.97,
        x: 100 + Math.random() * 200,
        y: 120 + Math.random() * 100,
        w: 80,
        h: 140,
        distance: 12.0,
        isThreat: false
      };
      setEventLogs(prev => [`[${now}] AUTHENTICATED PATROL SOLDIER ENTERED SURVEILLANCE ZONE`, ...prev.slice(0, 7)]);
    } else if (type === 'NON_HUMAN_OBJECT') {
      newTgt = {
        id: `tgt-${Date.now()}`,
        type: 'NON_HUMAN_OBJECT',
        name: 'NON-HUMAN: SPOON / CHARGER / PHONE',
        confidence: 0.95,
        x: 450 + Math.random() * 150,
        y: 180 + Math.random() * 100,
        w: 65,
        h: 60,
        distance: 1.4,
        isThreat: true
      };
      setEventLogs(prev => [`[${now}] 🚨 NON-HUMAN OBJECT INTRUSION DETECTED // SIREN ACTIVE`, ...prev.slice(0, 7)]);
    } else if (type === 'DRONE') {
      newTgt = {
        id: `tgt-${Date.now()}`,
        type: 'DRONE',
        name: 'THREAT: UNAUTHORIZED UAV DRONE',
        confidence: 0.99,
        x: 520,
        y: 40,
        w: 110,
        h: 70,
        distance: 85.0,
        isThreat: true
      };
      setEventLogs(prev => [`[${now}] 🚨 AIRSPACE BREACH: HOSTILE UAV DRONE TRACKED`, ...prev.slice(0, 7)]);
    } else {
      newTgt = {
        id: `tgt-${Date.now()}`,
        type: 'VEHICLE',
        name: 'THREAT: ARMORED CONVOY VEHICLE',
        confidence: 0.96,
        x: 500,
        y: 280,
        w: 160,
        h: 90,
        distance: 45.0,
        isThreat: true
      };
      setEventLogs(prev => [`[${now}] 🚨 VEHICULAR PERIMETER INTRUSION AT PERIMETER GATE`, ...prev.slice(0, 7)]);
    }

    if (newTgt.isThreat) {
      try {
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const alertObj = {
          id: Date.now() % 100000,
          alert_type: type === 'NON_HUMAN_OBJECT' ? 'NON_HUMAN_INTRUSION' : (type === 'DRONE' ? 'UAV_PERIMETER_BREACH' : 'ARMOR_MOVEMENT'),
          target_class: newTgt.name,
          confidence: newTgt.confidence,
          camera_id: 'CAM-01',
          sector: 'LAC Northern Sector [DEMO SIM]',
          siren_triggered: 1,
          status: 'ACTIVE',
          distance_meters: newTgt.distance,
          notes: `Tactical simulation threat spawned (${newTgt.name}) // SIREN ENGAGED`,
          timestamp: timeStr
        };

        const existingAlerts = JSON.parse(localStorage.getItem('aegis_alerts') || localStorage.getItem('aegis_alerts_cache') || '[]');
        const updated = [alertObj, ...existingAlerts];
        localStorage.setItem('aegis_alerts', JSON.stringify(updated));
        localStorage.setItem('aegis_alerts_cache', JSON.stringify(updated));

        fetch(`${API_BASE_URL}/api/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertObj)
        }).catch(() => {});
      } catch {}
    }

    setTargets(prev => [...prev, newTgt]);
  };

  const clearThreats = () => {
    setTargets(prev => prev.filter(t => !t.isThreat));
    setTripwireBreached(false);
    const now = new Date().toLocaleTimeString();
    setEventLogs(prev => [`[${now}] THREATS CLEARED BY OPERATOR. SECTOR STABILIZED.`, ...prev.slice(0, 7)]);
  };

  // Vision Filter CSS
  const getVisionFilterStyle = () => {
    switch (visionMode) {
      case 'thermal':
        return { filter: 'hue-rotate(280deg) saturate(2.5) contrast(1.4)' };
      case 'nvg':
        return { filter: 'hue-rotate(90deg) saturate(3) brightness(1.2)' };
      case 'flir':
        return { filter: 'invert(0.85) contrast(2) saturate(0.2)' };
      default:
        return {};
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#040704',
      color: 'var(--color-text)',
      fontFamily: "'Share Tech Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      boxSizing: 'border-box'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1300,
        width: '100%',
        margin: '0 auto 16px auto',
        paddingBottom: 12,
        borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/login"
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={14} /> LOGIN / SETUP
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--color-accent)" className="animate-spin" />
              <h1 style={{ margin: 0, fontSize: 18, color: 'var(--color-accent)', letterSpacing: 2 }}>
                AEGIS-VISION INTERACTIVE CAPABILITIES DEMO
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
              LIVE DEFENSE SIMULATION SANDBOX & MULTI-SPECTRAL OPTICS LAB
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            to="/dashboard"
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--color-accent)',
              color: '#000',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 15px rgba(34,197,94,0.4)'
            }}
          >
            <Play size={14} fill="#000" />
            ENTER FULL COMMAND GRID &rarr;
          </Link>
        </div>
      </div>

      {/* Main Interactive Demo Container */}
      <div style={{
        maxWidth: 1300,
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '2.5fr 1fr',
        gap: 20,
        flex: 1
      }}>
        {/* Left: Interactive Canvas Feed & HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Active Alert Banner */}
          {(sirenActive || tripwireBreached) && (
            <div style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Siren size={18} className="animate-spin" />
                <span>🚨 INTRUSION ALERT ACTIVE: CONTINUOUS ACOUSTIC SIREN WAILING</span>
              </div>
              <button
                onClick={clearThreats}
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '1px solid #fff',
                  padding: '4px 10px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                CLEAR THREATS
              </button>
            </div>
          )}

          {/* Interactive Canvas */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: 480,
            backgroundColor: '#000',
            borderRadius: 6,
            border: sirenActive ? '3px solid #ef4444' : '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: sirenActive ? '0 0 35px rgba(239, 68, 68, 0.5)' : 'none'
          }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'grab',
                ...getVisionFilterStyle()
              }}
            />

            {/* Top Canvas HUD overlay */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 14,
              display: 'flex',
              gap: 8,
              fontFamily: "'Share Tech Mono', monospace"
            }}>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--color-accent)', padding: '4px 8px', borderRadius: 4, color: 'var(--color-accent)', fontSize: 11 }}>
                CAM-01 // LAC RIDGE NORTH
              </span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--color-success)', padding: '4px 8px', borderRadius: 4, color: 'var(--color-success)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot live" style={{ margin: 0 }}></span> 60 FPS
              </span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--color-warning)', padding: '4px 8px', borderRadius: 4, color: 'var(--color-warning)', fontSize: 11 }}>
                OPTICS: {visionMode.toUpperCase()}
              </span>
            </div>

            {/* Instructions overlay at bottom of canvas */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: 14,
              right: 14,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--color-text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>💡 <strong>DRAG TARGETS</strong> with your mouse across the red laser tripwire to trigger intrusion alarm & siren!</span>
              <span style={{ color: 'var(--color-accent)' }}>{targets.length} ACTIVE TARGETS</span>
            </div>
          </div>

          {/* Vision Mode & Sensor Selector Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 6,
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                <Eye size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                OPTICAL SENSOR:
              </span>
              {(['normal', 'thermal', 'nvg', 'flir'] as VisionMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setVisionMode(mode)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    borderRadius: 3,
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

            {/* Siren Audio Toggle */}
            <button
              onClick={() => {
                tacticalSiren.initContext();
                setSirenMuted(prev => !prev);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                backgroundColor: sirenMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                border: `1px solid ${sirenMuted ? 'var(--color-alert)' : 'var(--color-success)'}`,
                color: sirenMuted ? 'var(--color-alert)' : 'var(--color-success)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            >
              {sirenMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {sirenMuted ? 'AUDIO SIREN: MUTED' : 'AUDIO SIREN: ARMED (LIVE)'}
            </button>
          </div>
        </div>

        {/* Right: Interactive Control Deck & Spawner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Target Spawner Deck */}
          <div className="card" style={{ backgroundColor: '#0a0f0a', padding: 16 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              🎯 TARGET SPAWNER (TEST DETECTION)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => addTarget('HUMAN')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid var(--color-success)',
                  color: 'var(--color-success)',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>🟢 + SPAWN SENTRY SOLDIER</span>
                <span style={{ fontSize: 9 }}>AUTHORIZED</span>
              </button>

              <button
                onClick={() => addTarget('NON_HUMAN_OBJECT')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--color-alert)',
                  color: 'var(--color-alert)',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>🔴 + SPOON / CHARGER / PHONE</span>
                <span style={{ fontSize: 9 }}>THREAT // SIREN</span>
              </button>

              <button
                onClick={() => addTarget('DRONE')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid var(--color-warning)',
                  color: 'var(--color-warning)',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>🟡 + HOSTILE UAV DRONE</span>
                <span style={{ fontSize: 9 }}>AIRSPACE INVASION</span>
              </button>

              <button
                onClick={() => addTarget('VEHICLE')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--color-alert)',
                  color: 'var(--color-alert)',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>🚨 + ARMORED CONVOY TANK</span>
                <span style={{ fontSize: 9 }}>VEHICLE BREACH</span>
              </button>
            </div>
          </div>

          {/* DEFCON Readiness Selector */}
          <div className="card" style={{ backgroundColor: '#0a0f0a', padding: 16 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              🛡️ DEFCON READINESS STATE
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {(['DEFCON 5', 'DEFCON 4', 'DEFCON 3', 'DEFCON 2', 'DEFCON 1'] as DefconLevel[]).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setDefconLevel(lvl)}
                  style={{
                    padding: '6px 2px',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fontFamily: "'Share Tech Mono', monospace",
                    borderRadius: 3,
                    border: '1px solid var(--color-border)',
                    backgroundColor: defconLevel === lvl ? (lvl === 'DEFCON 1' ? '#ef4444' : 'var(--color-accent)') : 'transparent',
                    color: defconLevel === lvl ? '#000' : 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  {lvl.replace('DEFCON ', 'D-')}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
              CURRENT STATUS: <strong style={{ color: defconLevel === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-accent)' }}>{defconLevel}</strong>
            </div>
          </div>

          {/* Real-time Forensic Tactical Telemetry Logs */}
          <div className="card" style={{ backgroundColor: '#0a0f0a', padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Radio size={14} color="var(--color-accent)" className="animate-pulse" />
              <h3 style={{ margin: 0, fontSize: 12, color: 'var(--color-accent)' }}>
                LIVE INCIDENT TELEMETRY STREAM
              </h3>
            </div>

            <div style={{
              flex: 1,
              backgroundColor: '#000',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: 8,
              fontSize: 10,
              fontFamily: "'Share Tech Mono', monospace",
              color: 'var(--color-text-muted)',
              overflowY: 'auto',
              maxHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              {eventLogs.map((log, idx) => (
                <div key={idx} style={{ color: log.includes('🚨') ? 'var(--color-alert)' : (log.includes('AUTHENTICATED') ? 'var(--color-success)' : 'inherit') }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
