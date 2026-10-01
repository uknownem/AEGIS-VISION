import { mockPersonnel } from '../mockData';
import { User, ShieldCheck, ShieldAlert, Search } from 'lucide-react';

export default function Personnel() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>PERSONNEL DIRECTORY</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>AUTHORIZED FACILITY STAFF AND CLEARANCE LEVELS</p>
        </div>
        
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="Search by name or ID..." style={{ paddingLeft: 38 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {mockPersonnel.map(person => (
          <div key={person.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--color-accent)" />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ marginBottom: 2 }}>{person.name}</h4>
                <span className="badge" style={{ fontSize: 10 }}>{person.id}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-accent)', marginBottom: 4 }}>{person.role}</p>
              <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginBottom: 8 }}>
                Zones: {person.zones.join(', ')}
              </div>
              
              <div style={{ fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, color: person.status === 'ACCESS ACTIVE' ? 'var(--color-accent)' : 'var(--color-alert)' }}>
                {person.status === 'ACCESS ACTIVE' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {person.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
