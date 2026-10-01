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
        {/* Radar Map */}
        <div 
          className="radar-map" 
          onClick={() => !isFullScreen && setIsFullScreen(true)}
          style={{ 
            flex: 2, 
            borderRadius: 4, 
            border: '1px solid var(--color-border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: isFullScreen ? 'fixed' : 'relative',
            top: isFullScreen ? 0 : 'auto',
            left: isFullScreen ? 0 : 'auto',
            width: isFullScreen ? '100vw' : 'auto',
            height: isFullScreen ? '100vh' : 'auto',
            zIndex: isFullScreen ? 9999 : 1,
            cursor: isFullScreen ? 'default' : 'pointer'
          }}
        >
          {isFullScreen && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
              style={{ position: 'absolute', top: 30, right: 30, zIndex: 10000, backgroundColor: 'rgba(9, 13, 10, 0.8)', padding: 10, borderRadius: 4, border: '1px solid var(--color-accent)' }}
            >
              <X size={22} color="var(--color-accent)" />
            </button>
          )}
          {!isFullScreen && (
             <Maximize2 size={20} color="var(--color-accent)" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.8 }} />
          )}

          <div style={{ zIndex: 10, textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'rgba(9, 13, 10, 0.85)', padding: '16px 24px', borderRadius: 4, border: '1px solid var(--color-border)' }}>
            <Map size={36} style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
            <p style={{ color: 'var(--color-text)', letterSpacing: 2, fontSize: 13, fontWeight: 'bold' }}>TACTICAL SECTOR RADAR GRID</p>
            <span style={{ fontSize: 11, color: 'var(--color-tan)', fontFamily: "'Share Tech Mono', monospace" }}>SWEEP FREQUENCY: 12.4 GHz</span>
          </div>

          {/* Mock Zone overlays */}
          <div style={{ 
            position: 'absolute', top: '20%', left: '30%', width: '160px', height: '110px', 
            border: activeZone === 'Z-01' ? '2px solid var(--color-accent)' : '2px solid var(--color-alert)', 
            backgroundColor: activeZone === 'Z-01' ? 'rgba(163, 230, 53, 0.25)' : 'rgba(239, 68, 68, 0.15)', 
            zIndex: 5, transition: 'all 0.3s' 
          }}>
            <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: 'var(--color-accent)', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 4px' }}>SECTOR ALPHA</span>
          </div>
          
          <div style={{ 
            position: 'absolute', top: '55%', left: '55%', width: '210px', height: '130px', 
            border: activeZone === 'Z-02' ? '2px solid var(--color-accent)' : '2px dashed var(--color-warning)', 
            backgroundColor: activeZone === 'Z-02' ? 'rgba(163, 230, 53, 0.25)' : 'rgba(245, 158, 11, 0.15)', 
            zIndex: 5, transition: 'all 0.3s' 
          }}>
            <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: 'var(--color-tan)', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 4px' }}>PERIMETER NORTH</span>
          </div>

          <div style={{ 
            position: 'absolute', top: '10%', left: '10%', width: '90px', height: '320px', 
            border: activeZone === 'Z-03' ? '2px solid var(--color-accent)' : '2px solid var(--color-border)', 
            backgroundColor: activeZone === 'Z-03' ? 'rgba(163, 230, 53, 0.25)' : 'rgba(39, 56, 41, 0.3)', 
            zIndex: 5, transition: 'all 0.3s' 
          }}>
            <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: 'var(--color-text-muted)', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 4px' }}>DEPOT WEST</span>
          </div>

          <div style={{ 
            position: 'absolute', bottom: '10%', left: '40%', width: '130px', height: '130px', 
            border: activeZone === 'Z-04' ? '2px solid var(--color-accent)' : '2px solid var(--color-alert)', 
            backgroundColor: activeZone === 'Z-04' ? 'rgba(163, 230, 53, 0.25)' : 'rgba(239, 68, 68, 0.2)', 
            zIndex: 5, transition: 'all 0.3s' 
          }}>
            <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: 'var(--color-alert)', fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 4px' }}>FLIGHTLINE SOUTH</span>
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
