// High-fidelity Tactical Camera and Thermal Feed Renderer

interface Props {
  isThermal?: boolean;
  hasDetection?: boolean;
  resolution?: string;
  fps?: number;
  camId?: string;
  timestamp?: string;
}

export default function CameraThumbnail({
  isThermal = false,
  hasDetection = false,
  resolution = '4K UltraHD',
  fps = 30
}: Props) {
  if (isThermal) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 140, overflow: 'hidden', backgroundColor: '#070014' }}>
        {/* Thermal FLIR Ironbow Canvas/SVG rendering */}
        <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="thermalSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b021d" />
              <stop offset="60%" stopColor="#250942" />
              <stop offset="100%" stopColor="#450d54" />
            </linearGradient>
            <linearGradient id="thermalGround" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d0a4e" />
              <stop offset="100%" stopColor="#1a0430" />
            </linearGradient>
            <radialGradient id="humanHeat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffea00" />
              <stop offset="60%" stopColor="#ff5500" />
              <stop offset="100%" stopColor="#800060" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="vehicleEngineHeat" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#ffea00" />
              <stop offset="70%" stopColor="#ff3700" />
              <stop offset="100%" stopColor="#990066" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="thermalBar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#ffea00" />
              <stop offset="50%" stopColor="#ff3700" />
              <stop offset="75%" stopColor="#990066" />
              <stop offset="100%" stopColor="#1a0430" />
            </linearGradient>
          </defs>

          {/* Sky & Background */}
          <rect width="400" height="130" fill="url(#thermalSky)" />
          <rect y="130" width="400" height="90" fill="url(#thermalGround)" />

          {/* Fence Posts in Thermal */}
          <g stroke="#6e1d7a" strokeWidth="2" opacity="0.8">
            <line x1="20" y1="90" x2="20" y2="170" />
            <line x1="80" y1="95" x2="80" y2="170" />
            <line x1="140" y1="100" x2="140" y2="170" />
            <line x1="200" y1="105" x2="200" y2="170" />
            <line x1="260" y1="110" x2="260" y2="170" />
            <line x1="320" y1="115" x2="320" y2="170" />
            <line x1="10" y1="105" x2="350" y2="135" strokeDasharray="4 2" />
            <line x1="10" y1="125" x2="350" y2="155" strokeDasharray="4 2" />
          </g>

          {/* Thermal Human Figure Heat Signature */}
          <g transform="translate(135, 120)">
            <ellipse cx="10" cy="10" rx="14" ry="24" fill="url(#humanHeat)" />
            {/* Person silhouette in white/yellow */}
            <circle cx="10" cy="0" r="4" fill="#ffffff" />
            <line x1="10" y1="4" x2="10" y2="20" stroke="#ffea00" strokeWidth="4" strokeLinecap="round" />
            <line x1="10" y1="20" x2="6" y2="34" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" />
            <line x1="10" y1="20" x2="14" y2="34" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" />
            <line x1="6" y1="10" x2="14" y2="10" stroke="#ffea00" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Thermal Vehicle Heat Signature */}
          <g transform="translate(210, 110)">
            <ellipse cx="40" cy="25" rx="55" ry="30" fill="url(#vehicleEngineHeat)" />
            {/* Truck chassis heat */}
            <path d="M5,35 L15,15 L50,15 L70,25 L75,35 Z" fill="#ff7700" opacity="0.9" />
            <rect x="18" y="18" width="18" height="12" fill="#ffea00" />
            <circle cx="20" cy="38" r="8" fill="#ffffff" />
            <circle cx="60" cy="38" r="8" fill="#ffffff" />
          </g>

          {/* Thermal Scale Bar on Right */}
          <g transform="translate(378, 20)">
            <rect x="0" y="0" width="8" height="130" fill="url(#thermalBar)" rx="2" stroke="#444" strokeWidth="0.5" />
            <text x="-4" y="8" fill="#ffffff" fontSize="8" fontFamily="Share Tech Mono" textAnchor="end">45°C</text>
            <text x="-4" y="68" fill="#ff9900" fontSize="8" fontFamily="Share Tech Mono" textAnchor="end">32°C</text>
            <text x="-4" y="130" fill="#9900cc" fontSize="8" fontFamily="Share Tech Mono" textAnchor="end">18°C</text>
          </g>
        </svg>

        {/* Top left and bottom right overlays */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, zIndex: 3 }}>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 2, color: 'var(--color-accent)', fontSize: 10, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
            ● {resolution}
          </span>
        </div>

        <div style={{ position: 'absolute', bottom: 6, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: 2, color: '#f59e0b', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
          {fps} FPS
        </div>
      </div>
    );
  }

  // Optical Day / Perimeter Camera View
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 140, overflow: 'hidden', backgroundColor: '#9aa0a6' }}>
      <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b0bec5" />
            <stop offset="100%" stopColor="#cfd8dc" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d7ccc8" />
            <stop offset="100%" stopColor="#bcaaa4" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="400" height="95" fill="url(#skyGrad)" />
        
        {/* Concrete Wall & Ground */}
        <rect y="95" width="400" height="125" fill="url(#groundGrad)" />

        {/* Concrete Barracks / Bunkers in background */}
        <rect x="180" y="70" width="70" height="28" fill="#8d99ae" />
        <rect x="255" y="72" width="60" height="26" fill="#788596" />
        <rect x="320" y="75" width="70" height="23" fill="#8d99ae" />

        {/* Guard Tower / Mast */}
        <g transform="translate(40, 30)">
          <rect x="12" y="30" width="16" height="22" fill="#5c677d" />
          <polygon points="8,30 20,18 32,30" fill="#474f60" />
          <line x1="14" y1="52" x2="6" y2="120" stroke="#333d29" strokeWidth="2.5" />
          <line x1="26" y1="52" x2="34" y2="120" stroke="#333d29" strokeWidth="2.5" />
          <line x1="8" y1="75" x2="32" y2="75" stroke="#333d29" strokeWidth="1.5" />
          <line x1="7" y1="95" x2="33" y2="95" stroke="#333d29" strokeWidth="1.5" />
        </g>

        {/* Perimeter Chainlink Fence with Barbed Wire */}
        <g stroke="#6c757d" strokeWidth="1.2" opacity="0.85">
          {/* Main Diagonal Fence Mesh */}
          <line x1="0" y1="120" x2="400" y2="155" strokeWidth="2" stroke="#495057" />
          <line x1="0" y1="180" x2="400" y2="215" strokeWidth="2" stroke="#495057" />
          {/* Vertical concrete posts */}
          <line x1="30" y1="110" x2="30" y2="190" strokeWidth="3" stroke="#343a40" />
          <line x1="110" y1="117" x2="110" y2="197" strokeWidth="3" stroke="#343a40" />
          <line x1="190" y1="124" x2="190" y2="204" strokeWidth="3" stroke="#343a40" />
          <line x1="270" y1="131" x2="270" y2="211" strokeWidth="3" stroke="#343a40" />
          <line x1="350" y1="138" x2="350" y2="218" strokeWidth="3" stroke="#343a40" />
        </g>

        {/* Military Patrol Truck */}
        <g transform="translate(280, 140)">
          <rect x="0" y="8" width="42" height="18" fill="#4f5d2f" rx="2" />
          <path d="M10,8 L18,0 L32,0 L38,8 Z" fill="#3c4a24" />
          <circle cx="10" cy="26" r="6" fill="#212529" stroke="#6c757d" strokeWidth="1.5" />
          <circle cx="32" cy="26" r="6" fill="#212529" stroke="#6c757d" strokeWidth="1.5" />
        </g>

        {/* AI Detection Box overlay if detected */}
        {hasDetection && (
          <g transform="translate(265, 125)">
            <rect x="0" y="0" width="70" height="50" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
            <rect x="0" y="-14" width="68" height="14" fill="#ef4444" />
            <text x="3" y="-3" fill="#ffffff" fontSize="9" fontFamily="Share Tech Mono" fontWeight="bold">HUMAN [0.94]</text>
          </g>
        )}
      </svg>

      {/* Top Left Resolution Pill */}
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, zIndex: 3 }}>
        <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 2, color: 'var(--color-accent)', fontSize: 10, border: '1px solid var(--color-border)', fontFamily: "'Share Tech Mono', monospace" }}>
          ● {resolution}
        </span>
      </div>

      {/* Detection Event Pill */}
      {hasDetection && (
        <div style={{ position: 'absolute', bottom: 26, left: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', padding: '2px 6px', borderRadius: 2, fontSize: 10, fontWeight: 'bold', fontFamily: "'Share Tech Mono', monospace" }}>
          🚨 DETECTION EVENT
        </div>
      )}

      {/* Bottom FPS */}
      <div style={{ position: 'absolute', bottom: 6, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: 2, color: 'var(--color-accent)', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
        {fps} FPS
      </div>
    </div>
  );
}
