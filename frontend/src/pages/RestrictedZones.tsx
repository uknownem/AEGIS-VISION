import { useState } from 'react';
import { mockZones } from '../mockData';
import { Map, Video, ShieldAlert, ShieldCheck, Maximize2, X, Crosshair } from 'lucide-react';

export default function RestrictedZones() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2>RESTRICTED ZONES</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>MONITORED FACILITY BOUNDARIES & ACTIVE SURVEILLANCE</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 165px)' }}>
        {/* Radar & Satellite Military GIS Map */}
        <div 
          className="radar-map" 
          onClick={() => !isFullScreen && setIsFullScreen(true)}
          style={{ 
            flex: 2, 
            borderRadius: 6, 
            border: '1px solid var(--color-border)', 
            position: isFullScreen ? 'fixed' : 'relative',
            top: isFullScreen ? 0 : 'auto',
            left: isFullScreen ? 0 : 'auto',
            width: isFullScreen ? '100vw' : 'auto',
            height: isFullScreen ? '100vh' : 'auto',
            zIndex: isFullScreen ? 9999 : 1,
            cursor: isFullScreen ? 'default' : 'pointer',
            overflow: 'hidden',
            backgroundColor: '#050705'
          }}
        >
          {/* Real Military Satellite Map Background */}
          <img 
            src="/satellite_base_map.jpg" 
            alt="Tactical Satellite Base Map" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'brightness(0.9) contrast(1.1)'
            }} 
          />

          {isFullScreen && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
              style={{ position: 'absolute', top: 24, right: 24, zIndex: 10000, backgroundColor: 'rgba(9, 13, 10, 0.85)', padding: 10, borderRadius: 4, border: '1px solid var(--color-accent)', cursor: 'pointer' }}
            >
              <X size={22} color="var(--color-accent)" />
            </button>
          )}
          {!isFullScreen && (
             <Maximize2 size={20} color="var(--color-accent)" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.9, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 4, borderRadius: 3 }} />
          )}

          {/* Top GIS Coordinate HUD */}
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: '6px 14px', borderRadius: 4, border: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Map size={16} color="var(--color-accent)" />
            <span style={{ fontSize: 11, color: '#fff', fontFamily: "'Share Tech Mono', monospace" }}>
              GIS SAT-EO // 1:25,000 // 34°12'N 78°19'E // HIGH-ALTITUDE PERIMETER
            </span>
          </div>

          {/* Interactive Zone overlays on satellite imagery */}
          <div 
            onClick={(e) => { e.stopPropagation(); setActiveZone('Z-01'); }}
            style={{ 
              position: 'absolute', top: '24%', left: '26%', width: '48%', height: '52%', 
              border: activeZone === 'Z-01' ? '3px solid #a3e635' : '2px solid rgba(239, 68, 68, 0.85)', 
              backgroundColor: activeZone === 'Z-01' ? 'rgba(163, 230, 53, 0.25)' : 'rgba(239, 68, 68, 0.12)', 
              borderRadius: 8,
              zIndex: 5, transition: 'all 0.3s',
              boxShadow: activeZone === 'Z-01' ? '0 0 20px rgba(163, 230, 53, 0.5)' : 'none'
            }}
          >
            <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 10, color: '#fff', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(239, 68, 68, 0.85)', padding: '2px 6px', borderRadius: 2, fontWeight: 'bold' }}>
              ZONE ALPHA (RESTRICTED RUNWAY & ARMORY)
            </span>
          </div>
          
          <div 
            onClick={(e) => { e.stopPropagation(); setActiveZone('Z-02'); }}
            style={{ 
              position: 'absolute', top: '15%', left: '16%', width: '68%', height: '70%', 
              border: activeZone === 'Z-02' ? '3px solid #a3e635' : '2px dashed rgba(245, 158, 11, 0.85)', 
              backgroundColor: activeZone === 'Z-02' ? 'rgba(163, 230, 53, 0.2)' : 'transparent', 
              borderRadius: 12,
              pointerEvents: 'none',
              zIndex: 4, transition: 'all 0.3s' 
            }}
          >
            <span style={{ position: 'absolute', bottom: 10, left: 20, fontSize: 10, color: 'var(--color-tan)', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: 2 }}>
              ZONE BETA (BUFFER ZONE 1KM PERIMETER)
            </span>
          </div>
        </div>

        {/* Zones List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {mockZones.map(zone => (
            <div 
              key={zone.id} 
              onClick={() => setActiveZone(zone.id === activeZone ? null : zone.id)}
              className="card" 
              style={{ 
                cursor: 'pointer',
                borderColor: activeZone === zone.id ? 'var(--color-accent)' : (zone.priority === 'CRITICAL' ? 'var(--color-alert)' : 'var(--color-border)'),
                backgroundColor: activeZone === zone.id ? 'rgba(31, 44, 32, 0.95)' : 'var(--color-surface-card)',
                transform: activeZone === zone.id ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s',
                padding: '16px 20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, color: activeZone === zone.id ? 'var(--color-accent)' : 'var(--color-text)' }}>{zone.name}</h3>
                {activeZone === zone.id && <Crosshair size={18} color="var(--color-accent)" className="animate-fade-in" />}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>DEFCON PRIORITY</span>
                  <strong style={{ color: zone.priority === 'CRITICAL' ? 'var(--color-alert)' : 'var(--color-accent)' }}>{zone.priority}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}><Video size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} /> OPTICAL UNITS</span>
                  <span>{zone.cameras} ACTIVE</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>SECTOR STATUS</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: zone.status === 'SECURE' ? 'var(--color-accent)' : 'var(--color-alert)' }}>
                    {zone.status === 'SECURE' ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                    {zone.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
