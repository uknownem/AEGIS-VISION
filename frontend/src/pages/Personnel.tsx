import { useState, useEffect } from 'react';
import { mockPersonnel } from '../mockData';
import { User, ShieldCheck, ShieldAlert, Search, Clock, Plus, CheckCircle2, RefreshCw, Terminal, UserCheck, Activity } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface SoldierLog {
  id: number;
  service_number: string;
  name: string;
  rank: string;
  unit: string;
  action: string;
  terminal_id: string;
  ip_address: string;
  status: string;
  timestamp: string;
}

interface PersonnelActivity {
  id: number;
  soldier_id: string;
  soldier_name: string;
  rank: string;
  activity_type: string;
  details: string;
  terminal_id: string;
  timestamp: string;
}

export default function Personnel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'activity_logs' | 'login_logs' | 'directory'>('activity_logs');
  const [soldierLogs, setSoldierLogs] = useState<SoldierLog[]>([]);
  const [activities, setActivities] = useState<PersonnelActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form State for quick soldier login check-in
  const [newLogin, setNewLogin] = useState({
    service_number: 'IA-948201',
    name: 'Subedar Vikram Singh',
    rank: 'Subedar',
    unit: '14 Corps - High Altitude Recon',
    action: 'LOGIN',
    terminal_id: 'TERMINAL-LAC-NORTH'
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Soldier Login Logs & Activity History from SQLite Database
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Logins
      const resLogs = await fetch(`${API_BASE_URL}/api/auth/soldier-logs`);
      if (resLogs.ok) {
        const json = await resLogs.json();
        if (json.data && Array.isArray(json.data)) {
          setSoldierLogs(json.data);
        }
      }

      // 2. Fetch Activities
      const resActs = await fetch(`${API_BASE_URL}/api/personnel/activity`);
      if (resActs.ok) {
        const jsonActs = await resActs.json();
        if (jsonActs.data && Array.isArray(jsonActs.data)) {
          setActivities(jsonActs.data);
        }
      }
    } catch {
      // Offline mock fallback
      setSoldierLogs([
        { id: 1, service_number: 'IA-948201', name: 'Subedar Vikram Singh', rank: 'Subedar', unit: '14 Corps - High Altitude Recon', action: 'LOGIN', terminal_id: 'TERMINAL-LAC-NORTH', ip_address: '10.14.2.10', status: 'AUTHORIZED', timestamp: '2026-10-01 14:15:22' },
        { id: 2, service_number: 'IA-773194', name: 'Major Rajesh Sharma', rank: 'Major', unit: '9 Para Special Forces', action: 'LOGIN', terminal_id: 'TERMINAL-HQ-ALPHA', ip_address: '10.14.1.04', status: 'AUTHORIZED', timestamp: '2026-10-01 14:20:05' },
        { id: 3, service_number: 'IA-661038', name: 'Havildar Gurpreet Singh', rank: 'Havildar', unit: 'Sikh Light Infantry', action: 'LOGIN', terminal_id: 'TERMINAL-CHECKPOINT-4', ip_address: '10.14.3.18', status: 'AUTHORIZED', timestamp: '2026-10-01 14:28:40' }
      ]);
      setActivities([
        { id: 1, soldier_id: 'IA-948201', soldier_name: 'Subedar Vikram Singh', rank: 'Subedar', activity_type: 'DUTY_LOGIN', details: 'Authenticated to LAC Northern Sector command terminal', terminal_id: 'TERMINAL-LAC-NORTH', timestamp: '2026-10-01 14:15:22' },
        { id: 2, soldier_id: 'IA-948201', soldier_name: 'Subedar Vikram Singh', rank: 'Subedar', activity_type: 'CAMERA_FEED_ACCESSED', details: 'Opened 4K live tactical stream for CAM-07 (LAC Northern Sector)', terminal_id: 'TERMINAL-LAC-NORTH', timestamp: '2026-10-01 14:16:05' },
        { id: 3, soldier_id: 'IA-773194', soldier_name: 'Major Rajesh Sharma', rank: 'Major', activity_type: 'DEFCON_MODIFIED', details: 'Elevated facility readiness to DEFCON-2 following radar contact', terminal_id: 'TERMINAL-HQ-ALPHA', timestamp: '2026-10-01 14:22:10' },
        { id: 4, soldier_id: 'IA-773194', soldier_name: 'Major Rajesh Sharma', rank: 'Major', activity_type: 'SIREN_ARMED', details: 'Armed automated continuous tactical siren for non-human object intrusions', terminal_id: 'TERMINAL-HQ-ALPHA', timestamp: '2026-10-01 14:23:45' },
        { id: 5, soldier_id: 'IA-661038', soldier_name: 'Havildar Gurpreet Singh', rank: 'Havildar', activity_type: 'SNAPSHOT_CAPTURED', details: 'Saved incursion snapshot frame at Perimeter Checkpoint Alpha', terminal_id: 'TERMINAL-CHECKPOINT-4', timestamp: '2026-10-01 14:29:12' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Submit new Soldier Login into Database
  const handleSoldierLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogin.name || !newLogin.service_number) return;
    setSubmitting(true);
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/soldier-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogin)
      });

      if (res.ok) {
        setSuccessMsg('Soldier login & initial activity successfully logged into database!');
        setTimeout(() => {
          setShowLoginModal(false);
          setSuccessMsg('');
          fetchData();
        }, 800);
      }
    } catch {
      setShowLoginModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredActivities = activities.filter(act => 
    act.soldier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.soldier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = soldierLogs.filter(log => 
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.service_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPersonnel = mockPersonnel.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>PERSONNEL ACTIVITIES & DUTY AUDIT TRAIL</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            SQLITE PERSISTENT LOGS OF ALL SOLDIER LOGINS, SENSOR ACCESS & DEFENSE ACTIONS
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search soldier, action, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 13 }} 
            />
          </div>

          <button 
            onClick={() => setShowLoginModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 'bold' }}
          >
            <Plus size={15} /> RECORD SOLDIER LOGIN
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('activity_logs')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: activeTab === 'activity_logs' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeTab === 'activity_logs' ? '#000' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            fontWeight: activeTab === 'activity_logs' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Activity size={14} /> ALL SOLDIER ACTIVITIES ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('login_logs')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: activeTab === 'login_logs' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeTab === 'login_logs' ? '#000' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            fontWeight: activeTab === 'login_logs' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Clock size={14} /> DUTY LOGINS ({soldierLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: activeTab === 'directory' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeTab === 'directory' ? '#000' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            fontWeight: activeTab === 'directory' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <UserCheck size={14} /> PERSONNEL DIRECTORY ({mockPersonnel.length})
        </button>

        <button 
          onClick={fetchData}
          title="Refresh database logs"
          style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> REFRESH DB
        </button>
      </div>

      {/* TAB 1: Live Database Soldier Activity Logs */}
      {activeTab === 'activity_logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              LIVE PERSISTENT SOLDIER ACTION & AUDIT TRAIL (SQLITE DB)
            </h4>
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>
              ● REAL-TIME AUDITING ACTIVE
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-light)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>SOLDIER & RANK</th>
                  <th style={{ padding: '10px 16px' }}>SERVICE ID</th>
                  <th style={{ padding: '10px 16px' }}>ACTION / EVENT</th>
                  <th style={{ padding: '10px 16px' }}>ACTIVITY DETAILS</th>
                  <th style={{ padding: '10px 16px' }}>TERMINAL</th>
                  <th style={{ padding: '10px 16px' }}>EXACT TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>
                      <strong>{act.soldier_name}</strong>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--color-accent)' }}>{act.rank}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-accent)' }}>
                      {act.soldier_id}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ 
                        backgroundColor: act.activity_type.includes('SIREN') || act.activity_type.includes('ALERT') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(163, 230, 53, 0.15)',
                        color: act.activity_type.includes('SIREN') || act.activity_type.includes('ALERT') ? 'var(--color-alert)' : 'var(--color-accent)'
                      }}>
                        {act.activity_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                      {act.details}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-dim)' }}>
                      <Terminal size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {act.terminal_id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {act.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Live Database Soldier Login Logs */}
      {activeTab === 'login_logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              PERSISTENT SOLDIER DUTY LOGINS & ACCESS TIMESTAMPS
            </h4>
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>
              ● DATABASE: ACTIVE & SYNCED
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-light)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>SERVICE NO.</th>
                  <th style={{ padding: '10px 16px' }}>SOLDIER NAME</th>
                  <th style={{ padding: '10px 16px' }}>RANK</th>
                  <th style={{ padding: '10px 16px' }}>MILITARY UNIT</th>
                  <th style={{ padding: '10px 16px' }}>TERMINAL / STATION</th>
                  <th style={{ padding: '10px 16px' }}>LOGIN TIMESTAMP</th>
                  <th style={{ padding: '10px 16px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                      {log.service_number}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>
                      {log.name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        {log.rank}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                      {log.unit}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-dim)' }}>
                      <Terminal size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {log.terminal_id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-accent)' }}>
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4, 
                        color: log.status === 'AUTHORIZED' ? 'var(--color-success)' : 'var(--color-alert)',
                        fontWeight: 'bold',
                        fontSize: 11
                      }}>
                        <ShieldCheck size={13} /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Personnel Directory */}
      {activeTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredPersonnel.map(person => (
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
      )}

      {/* Quick Soldier Duty Login Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 480, width: '100%', borderColor: 'var(--color-accent)' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} /> RECORD SOLDIER DUTY LOGIN & ACTIONS
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Logs the soldier's authentication timestamp, duty post, and activities in the SQLite database.
            </p>

            {successMsg && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 4, marginBottom: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSoldierLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Service Number (ID)</label>
                <input 
                  type="text" 
                  value={newLogin.service_number} 
                  onChange={e => setNewLogin({ ...newLogin, service_number: e.target.value })}
                  placeholder="e.g. IA-948201" 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Soldier Full Name</label>
                <input 
                  type="text" 
                  value={newLogin.name} 
                  onChange={e => setNewLogin({ ...newLogin, name: e.target.value })} 
                  placeholder="e.g. Subedar Vikram Singh" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Rank</label>
                  <select 
                    value={newLogin.rank} 
                    onChange={e => setNewLogin({ ...newLogin, rank: e.target.value })}
                    style={{ width: '100%', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, padding: 8, outline: 'none' }}
                  >
                    <option value="Sepoy">Sepoy</option>
                    <option value="Naik">Naik</option>
                    <option value="Havildar">Havildar</option>
                    <option value="Naib Subedar">Naib Subedar</option>
                    <option value="Subedar">Subedar</option>
                    <option value="Subedar Major">Subedar Major</option>
                    <option value="Lieutenant">Lieutenant</option>
                    <option value="Captain">Captain</option>
                    <option value="Major">Major</option>
                    <option value="Colonel">Colonel</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Terminal Station</label>
                  <input 
                    type="text" 
                    value={newLogin.terminal_id} 
                    onChange={e => setNewLogin({ ...newLogin, terminal_id: e.target.value })}
                    placeholder="e.g. TERMINAL-LAC-01" 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Military Unit</label>
                <input 
                  type="text" 
                  value={newLogin.unit} 
                  onChange={e => setNewLogin({ ...newLogin, unit: e.target.value })}
                  placeholder="e.g. 14 Corps - High Altitude Recon" 
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary" 
                  style={{ flex: 1, padding: 10 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting}
                  style={{ flex: 1, padding: 10 }}
                >
                  {submitting ? 'Saving to DB...' : 'Save Soldier Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
