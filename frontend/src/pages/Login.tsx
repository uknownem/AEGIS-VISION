import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, MapPin, Camera, Video, Play, CheckCircle2, 
  Sparkles, Radio, Cpu, RefreshCw, AlertTriangle
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';

interface MilitaryBase {
  id: string;
  name: string;
  code: string;
  region: string;
  coordinates: string;
  camerasCount: number;
  threatLevel: 'DEFCON 1' | 'DEFCON 2' | 'DEFCON 3' | 'DEFCON 4';
  coverImage: string;
}

const MILITARY_BASES: MilitaryBase[] = [
  {
    id: 'BASE-LAC-NORTH',
    name: 'LAC Northern Sector (Eastern Ladakh / Sub-Sector North)',
    code: 'HQ-14-CORPS',
    region: 'Himalayan Frontier Outpost',
    coordinates: '34.2268° N, 77.5619° E',
    camerasCount: 8,
    threatLevel: 'DEFCON 2',
    coverImage: '/cctv_himalayan_feed.jpg'
  },
  {
    id: 'BASE-SIACHEN',
    name: 'Siachen High Altitude Base (Forward Operating Base)',
    code: 'FOB-SIACHEN-01',
    region: 'Glacier Tactical Zone',
    coordinates: '35.4212° N, 77.1095° E',
    camerasCount: 6,
    threatLevel: 'DEFCON 1',
    coverImage: '/drone_aerial_recon.jpg'
  },
  {
    id: 'BASE-TAWANG',
    name: 'Eastern Command LAC Ridge (Tawang Sector)',
    code: 'EC-TAWANG-ALPHA',
    region: 'Northeast Frontier Grid',
    coordinates: '27.5861° N, 91.8594° E',
    camerasCount: 12,
    threatLevel: 'DEFCON 3',
    coverImage: '/cam02_main_gate.jpg'
  },
  {
    id: 'BASE-THAR',
    name: 'Western Border Command (Thar Checkpoint 04)',
    code: 'WC-THAR-DESERT',
    region: 'Desert Border Corridor',
    coordinates: '26.9157° N, 70.9083° E',
    camerasCount: 5,
    threatLevel: 'DEFCON 4',
    coverImage: '/thermal_flir_alert.jpg'
  },
  {
    id: 'BASE-KARWAR',
    name: 'Southern Coastal Defense Hub (Karwar Naval Base)',
    code: 'SND-KARWAR-HQ',
    region: 'Maritime Security Zone',
    coordinates: '14.8156° N, 74.1298° E',
    camerasCount: 9,
    threatLevel: 'DEFCON 3',
    coverImage: '/satellite_base_map.jpg'
  }
];

export default function Login() {
  const navigate = useNavigate();

  // Authentication Credentials State
  const [serviceId, setServiceId] = useState('IA-948201');
  const [operatorName, setOperatorName] = useState('Subedar Vikram Singh');
  const [passcode, setPasscode] = useState('••••••••••');
  const [clearanceLevel, setClearanceLevel] = useState('LEVEL-5 TOP SECRET (COSMIC)');
  const [authError, setAuthError] = useState('');

  // Selected Military Base Location
  const [selectedBase, setSelectedBase] = useState<MilitaryBase>(MILITARY_BASES[0]);

  // Camera Provisioning State
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [ipCameraUrl, setIpCameraUrl] = useState('rtsp://10.14.2.55:554/live/stream1');
  const [backendStreamEnabled, setBackendStreamEnabled] = useState(true);
  const [cameraTestStatus, setCameraTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Quick active tab inside Login
  const [activeStep, setActiveStep] = useState<'CREDENTIALS' | 'LOCATION' | 'CAMERAS'>('CREDENTIALS');

  // Test local webcam stream
  const testWebcam = async () => {
    setCameraTestStatus('TESTING');
    try {
      // Unlock audio on click
      tacticalSiren.initContext();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setWebcamStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(console.error);
      }
      setCameraTestStatus('SUCCESS');
    } catch (err) {
      console.warn('Webcam test note:', err);
      setCameraTestStatus('FAILED');
    }
  };

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [webcamStream]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId.trim() || !operatorName.trim()) {
      setAuthError('Please enter valid military Service ID and Operator Name');
      return;
    }

    // Save session to localStorage
    const sessionData = {
      serviceId,
      operatorName,
      clearanceLevel,
      base: selectedBase,
      webcamEnabled,
      ipCameraUrl,
      backendStreamEnabled,
      loginTimestamp: new Date().toISOString()
    };
    localStorage.setItem('aegis_session', JSON.stringify(sessionData));

    // Unlock audio context for immediate siren readiness
    tacticalSiren.initContext();

    // Navigate to live dashboard
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050805',
      color: 'var(--color-text)',
      fontFamily: "'Share Tech Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.08) 0%, rgba(5, 8, 5, 0.95) 75%)',
      padding: '24px 20px',
      boxSizing: 'border-box'
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto 24px auto',
        paddingBottom: 16,
        borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} color="var(--color-accent)" className="animate-pulse" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, letterSpacing: 3, color: 'var(--color-accent)', fontWeight: 900 }}>
              AEGIS-VISION
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
              TACTICAL DEFENSE SURVEILLANCE & AI PERIMETER SYSTEM
            </p>
          </div>
        </div>

        {/* Action Header Links: Launch Demo & System Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/demo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid var(--color-warning)',
              borderRadius: 4,
              color: 'var(--color-warning)',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={14} className="animate-spin" />
            LAUNCH INTERACTIVE DEMO MODE
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--color-success)'
          }}>
            <span className="status-dot live" style={{ margin: 0 }}></span>
            MIL-SPEC 256-BIT ENCRYPTED
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: 28,
        flex: 1
      }}>
        {/* Left Column: Multi-Step Login & Provisioning Card */}
        <div className="card" style={{
          backgroundColor: '#0a0f0a',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          padding: 24
        }}>
          {/* Step Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 4,
            borderRadius: 6,
            marginBottom: 20,
            border: '1px solid var(--color-border)'
          }}>
            <button
              type="button"
              onClick={() => setActiveStep('CREDENTIALS')}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: activeStep === 'CREDENTIALS' ? 'var(--color-accent)' : 'transparent',
                color: activeStep === 'CREDENTIALS' ? '#000' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              1. OPERATOR LOGIN
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('LOCATION')}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: activeStep === 'LOCATION' ? 'var(--color-accent)' : 'transparent',
                color: activeStep === 'LOCATION' ? '#000' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              2. SELECT LOCATION
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('CAMERAS')}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: activeStep === 'CAMERAS' ? 'var(--color-accent)' : 'transparent',
                color: activeStep === 'CAMERAS' ? '#000' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              3. CONNECT CAMERAS
            </button>
          </div>

          {authError && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid var(--color-alert)',
              color: 'var(--color-alert)',
              borderRadius: 4,
              marginBottom: 16,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={15} /> {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* STEP 1: OPERATOR CREDENTIALS */}
            {activeStep === 'CREDENTIALS' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--color-accent)' }}>
                    OPERATOR CREDENTIALS VERIFICATION
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Enter military service identification to authenticate to the defense terminal.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    SERVICE NUMBER / CALLSIGN
                  </label>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="e.g. IA-948201"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-accent)',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    OPERATOR NAME & RANK
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="e.g. Subedar Vikram Singh"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: '#ffffff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    SECURITY CLEARANCE LEVEL
                  </label>
                  <select
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-warning)',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="LEVEL-5 TOP SECRET (COSMIC)">LEVEL-5: TOP SECRET (COSMIC DEFENSE OVERRIDE)</option>
                    <option value="LEVEL-4 SECRET (OPERATIONAL)">LEVEL-4: SECRET (SECTOR RECON COMMAND)</option>
                    <option value="LEVEL-3 CONFIDENTIAL (PATROL)">LEVEL-3: CONFIDENTIAL (PERIMETER WATCH)</option>
                    <option value="LEVEL-2 RESTRICTED (SENTRY)">LEVEL-2: RESTRICTED (LOCAL SENTRY)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    ENCRYPTED PASSCODE / BIOMETRIC PIN
                  </label>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Security Key"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: '#ffffff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep('LOCATION')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    NEXT: SELECT BASE LOCATION &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & SECTOR SELECTION */}
            {activeStep === 'LOCATION' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--color-accent)' }}>
                    ASSIGN MONITORING BASE & SECTOR
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Select the active operational base and geopolitical border corridor to patrol.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                  {MILITARY_BASES.map(base => (
                    <div
                      key={base.id}
                      onClick={() => setSelectedBase(base)}
                      style={{
                        padding: '12px',
                        borderRadius: 6,
                        border: selectedBase.id === base.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: selectedBase.id === base.id ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0, 0, 0, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <MapPin size={14} color={selectedBase.id === base.id ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
                          <strong style={{ fontSize: 13, color: selectedBase.id === base.id ? 'var(--color-accent)' : '#fff' }}>
                            {base.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {base.code} &bull; {base.coordinates} &bull; {base.camerasCount} SENSORS
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 3,
                        backgroundColor: base.threatLevel === 'DEFCON 1' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: base.threatLevel === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-warning)',
                        border: `1px solid ${base.threatLevel === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-warning)'}`
                      }}>
                        {base.threatLevel}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep('CREDENTIALS')}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    &larr; BACK
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep('CAMERAS')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    NEXT: CONNECT CAMERAS &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONNECT CAMERAS & SENSORS */}
            {activeStep === 'CAMERAS' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--color-accent)' }}>
                    PROVISION CAMERA FEEDS & SENSORS
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Configure local optical sensors, RTSP IP video feeds, and AI neural net processors.
                  </p>
                </div>

                {/* 1. Local Webcam Toggle & Test */}
                <div style={{
                  padding: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Camera size={16} color="var(--color-accent)" />
                      <strong style={{ fontSize: 12 }}>LOCAL OPTICAL WEBCAM (AI DETECTOR)</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={webcamEnabled}
                        onChange={(e) => setWebcamEnabled(e.target.checked)}
                      />
                      ENABLED
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={testWebcam}
                      disabled={cameraTestStatus === 'TESTING'}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--color-accent)',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshCw size={12} className={cameraTestStatus === 'TESTING' ? 'animate-spin' : ''} />
                      {cameraTestStatus === 'TESTING' ? 'PROBING SENSOR...' : 'TEST WEBCAM SIGNAL'}
                    </button>
                    {cameraTestStatus === 'SUCCESS' && (
                      <span style={{ fontSize: 11, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} /> SIGNAL LOCKED (60 FPS)
                      </span>
                    )}
                    {cameraTestStatus === 'FAILED' && (
                      <span style={{ fontSize: 11, color: 'var(--color-alert)' }}>
                        ⚠️ SENSOR BLOCKED OR PERMISSION DENIED
                      </span>
                    )}
                  </div>
                  {/* Live Video Preview Box */}
                  {webcamStream && (
                    <div style={{ width: '100%', height: 110, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-success)', marginTop: 4 }}>
                      <video ref={videoPreviewRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                {/* 2. RTSP IP Camera Stream Input */}
                <div style={{
                  padding: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Video size={16} color="var(--color-warning)" />
                    <strong style={{ fontSize: 12 }}>RTSP / IP SURVEILLANCE FEED URL</strong>
                  </div>
                  <input
                    type="text"
                    value={ipCameraUrl}
                    onChange={(e) => setIpCameraUrl(e.target.value)}
                    placeholder="rtsp://admin:pass@192.168.1.100:554/stream"
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-text)',
                      fontSize: 12,
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  />
                </div>

                {/* 3. AI Backend Fast Inference Engine */}
                <div style={{
                  padding: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cpu size={16} color="var(--color-accent)" />
                    <div>
                      <strong style={{ fontSize: 12, display: 'block' }}>YOLOV8 FASTAPI ENGINE</strong>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Port 8000 Stream / Cloud WebSocket</span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={backendStreamEnabled}
                      onChange={(e) => setBackendStreamEnabled(e.target.checked)}
                    />
                    ACTIVE
                  </label>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep('LOCATION')}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    &larr; BACK
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    <Play size={16} fill="#000" />
                    AUTHENTICATE & ENTER DEFENSE GRID
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Base Preview & Live Tactical Intelligence Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected Base Satellite / Recon Card */}
          <div className="card" style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#0a0f0a',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            position: 'relative',
            height: 270
          }}>
            <img
              src={selectedBase.coverImage}
              alt={selectedBase.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
            />
            {/* Dark gradient overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(5,8,5,0.95) 0%, rgba(5,8,5,0.3) 60%, rgba(5,8,5,0.7) 100%)'
            }} />

            {/* Top HUD badge */}
            <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: 4,
                color: 'var(--color-accent)',
                fontSize: 11,
                border: '1px solid var(--color-accent)'
              }}>
                SECTOR RECON: {selectedBase.code}
              </span>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: 4,
                color: 'var(--color-warning)',
                fontSize: 11,
                border: '1px solid var(--color-warning)'
              }}>
                {selectedBase.threatLevel} READY
              </span>
            </div>

            {/* Bottom Base Info */}
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#fff' }}>
                {selectedBase.name}
              </h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {selectedBase.coordinates}</span>
                <span><Radio size={12} style={{ verticalAlign: 'middle' }} /> {selectedBase.region}</span>
              </div>
            </div>
          </div>

          {/* Quick Interactive Features Showcase Card */}
          <div className="card" style={{
            backgroundColor: '#0a0f0a',
            borderColor: 'var(--color-border)',
            padding: 20,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color="var(--color-accent)" />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--color-accent)' }}>
                  ACTIVE DEFENSE CAPABILITIES INCLUDED
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                <li><strong>Dual-Layer In-Browser AI:</strong> TensorFlow.js neural net + real-time pixel saliency.</li>
                <li><strong>Threat vs Soldier Partitioning:</strong> Authorized soldiers (Green) vs non-human items (Red).</li>
                <li><strong>Continuous Acoustic Siren:</strong> Auto-triggers Web Audio synthesis on intrusion breach.</li>
                <li><strong>Multi-Spectral Optics:</strong> Normal Visible Light, Thermal IR, NVG, and FLIR.</li>
                <li><strong>Polygon Geofencing:</strong> Perimeter tripwires and automated incident telemetry.</li>
              </ul>
            </div>

            {/* Direct Demo Link Button */}
            <Link
              to="/demo"
              style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid var(--color-warning)',
                borderRadius: 4,
                color: 'var(--color-warning)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} />
              OPEN INTERACTIVE DEMO & CAPABILITY SANDBOX &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
