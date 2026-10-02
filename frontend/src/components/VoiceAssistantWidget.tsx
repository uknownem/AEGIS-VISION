import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, HelpCircle, Terminal } from 'lucide-react';
import { voiceAssistant, type VoiceState } from '../utils/voiceAssistant';

interface Props {
  onNavigate?: (path: string) => void;
  onSetVisionMode?: (mode: string) => void;
  onOpenReportModal?: () => void;
  onOpenAddCamModal?: () => void;
  onSetDefcon?: (level: string) => void;
}

export default function VoiceAssistantWidget({
  onNavigate,
  onSetVisionMode,
  onOpenReportModal,
  onOpenAddCamModal,
  onSetDefcon
}: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState<string>('');
  const [responseMsg, setResponseMsg] = useState<string>('');
  const [showCheatsheet, setShowCheatsheet] = useState<boolean>(false);

  useEffect(() => {
    // Register UI callbacks
    voiceAssistant.registerCallbacks({
      navigate: onNavigate,
      setVisionMode: onSetVisionMode,
      openReportModal: onOpenReportModal,
      openAddCamModal: onOpenAddCamModal,
      setDefcon: onSetDefcon
    });

    // Subscribe to voice state updates
    const unsubscribe = voiceAssistant.subscribe((state, trans, resp) => {
      setVoiceState(state);
      if (trans) setTranscript(trans);
      if (resp) setResponseMsg(resp);
    });

    return () => {
      unsubscribe();
    };
  }, [onNavigate, onSetVisionMode, onOpenReportModal, onOpenAddCamModal, onSetDefcon]);

  const isListening = voiceState === 'LISTENING' || voiceState === 'PROCESSING';

  return (
    <>
      {/* Floating Tactical Microphone Control Pill */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        {/* Help Cheatsheet Button */}
        <button
          onClick={() => setShowCheatsheet(true)}
          title="Open Voice Command Cheatsheet"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
        >
          <HelpCircle size={20} />
        </button>

        {/* Main Microphone Toggle Button */}
        <button
          onClick={() => voiceAssistant.toggleListening()}
          title="Click to toggle AEGIS Tactical Voice Assistant (Press V)"
          style={{
            padding: '10px 18px',
            borderRadius: 30,
            backgroundColor: isListening ? '#ef4444' : 'var(--color-surface)',
            border: `2px solid ${isListening ? '#ef4444' : 'var(--color-accent)'}`,
            color: isListening ? '#ffffff' : 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 12,
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: 1,
            boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.8)' : '0 4px 20px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.2s ease'
          }}
        >
          {isListening ? (
            <Mic size={18} className="animate-pulse" />
          ) : (
            <MicOff size={18} />
          )}
          <span>{isListening ? 'LISTENING (SPEAK COMMAND)' : '🎤 AEGIS VOICE'}</span>
        </button>
      </div>

      {/* Live Command HUD Banner */}
      {(transcript || responseMsg) && (
        <div style={{
          position: 'fixed',
          bottom: 76,
          right: 24,
          maxWidth: 420,
          width: 'calc(100vw - 48px)',
          backgroundColor: 'rgba(9, 13, 10, 0.95)',
          border: '1px solid var(--color-accent)',
          borderRadius: 6,
          padding: '12px 16px',
          zIndex: 9989,
          fontFamily: "'Share Tech Mono', monospace",
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--color-accent)', fontWeight: 'bold', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={13} /> AEGIS VOICE HUD // {voiceState}
            </span>
            <button
              onClick={() => { setTranscript(''); setResponseMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {transcript && (
            <div style={{ fontSize: 12, color: '#fff', marginBottom: 4 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>SPOKEN:</span> "{transcript}"
            </div>
          )}

          {responseMsg && (
            <div style={{ fontSize: 12, color: responseMsg.includes('Negative') ? 'var(--color-alert)' : 'var(--color-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Volume2 size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{responseMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL TACTICAL VOICE COMMANDS CHEATSHEET MODAL */}
      {showCheatsheet && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 640, width: '100%', borderColor: 'var(--color-accent)', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowCheatsheet(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <h3 style={{ color: 'var(--color-accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={20} /> AEGIS VOICE COMMANDS CHEATSHEET
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              AEGIS AI enforces strict tactical command pattern matching. Only commands listed below will be executed.
            </p>

            {/* Category 1: Defense Readiness & Siren */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--color-alert)', letterSpacing: 1.5, marginBottom: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                1. 🚨 DEFENSE READINESS & SIREN ALARMS
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px' }}>VALID VOICE COMMAND</th>
                    <th style={{ padding: '6px 10px' }}>TACTICAL ACTION EXECUTED</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Set DEFCON 1" / "DEFCON 2"</td>
                    <td style={{ padding: '8px 10px' }}>Switches defense readiness level (DEFCON 1 to 5)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Aegis, silence siren" / "Mute alarm"</td>
                    <td style={{ padding: '8px 10px' }}>Silences active wailing sirens immediately</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Aegis, test siren" / "Test alarm"</td>
                    <td style={{ padding: '8px 10px' }}>Executes 2-second audio siren test pulse</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category 2: Camera Navigation & Optics */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--color-accent)', letterSpacing: 1.5, marginBottom: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                2. 📹 CAMERA NAVIGATION & VISION OPTICS
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px' }}>VALID VOICE COMMAND</th>
                    <th style={{ padding: '6px 10px' }}>TACTICAL ACTION EXECUTED</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Show camera 1" / "Camera 2" / "UAV"</td>
                    <td style={{ padding: '8px 10px' }}>Opens camera feed (CAM-01, CAM-02, CAM-03, CAM-04)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Switch to thermal vision" / "FLIR"</td>
                    <td style={{ padding: '8px 10px' }}>Activates FLIR thermal optical filter</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Switch to night vision" / "NVG mode"</td>
                    <td style={{ padding: '8px 10px' }}>Activates green night vision optics</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Normal mode" / "Standard feed"</td>
                    <td style={{ padding: '8px 10px' }}>Resets optics filter to standard RGB visual</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Pair WiFi camera" / "Add phone camera"</td>
                    <td style={{ padding: '8px 10px' }}>Opens external camera pairing wizard modal</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category 3: Alert Audit & Navigation */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--color-warning)', letterSpacing: 1.5, marginBottom: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                3. 🛡️ ALERTS, INCIDENT AUDIT & NAVIGATION
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px' }}>VALID VOICE COMMAND</th>
                    <th style={{ padding: '6px 10px' }}>TACTICAL ACTION EXECUTED</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Aegis, acknowledge threat"</td>
                    <td style={{ padding: '8px 10px' }}>Acknowledges active perimeter incursion alert</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Aegis, resolve alert"</td>
                    <td style={{ padding: '8px 10px' }}>Marks active threat as resolved & clear</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Generate incident report"</td>
                    <td style={{ padding: '8px 10px' }}>Opens Top Secret military PDF report modal</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Show overview" / "Analytics" / "Status"</td>
                    <td style={{ padding: '8px 10px' }}>Navigates to Overview, Analytics, or System Status</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category 4: Status & Personnel Queries */}
            <div>
              <h4 style={{ fontSize: 12, color: 'var(--color-success)', letterSpacing: 1.5, marginBottom: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                4. 📊 STATUS REPORTS & PERSONNEL QUERIES
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px' }}>VALID VOICE COMMAND</th>
                    <th style={{ padding: '6px 10px' }}>TACTICAL ACTION EXECUTED</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Aegis, report status"</td>
                    <td style={{ padding: '8px 10px' }}>Reads active threat counts & backend server health</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', color: 'var(--color-accent)' }}>"Who is on duty?" / "Check personnel"</td>
                    <td style={{ padding: '8px 10px' }}>Reads authenticated Commander on duty</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowCheatsheet(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: 20, padding: '10px 0', fontSize: 12, fontWeight: 'bold' }}
            >
              CLOSE CHEATSHEET
            </button>
          </div>
        </div>
      )}
    </>
  );
}
