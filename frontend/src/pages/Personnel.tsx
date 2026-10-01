import { useState, useEffect } from 'react';
import { User, ShieldCheck, ShieldAlert, Search, Clock, Plus, CheckCircle2, RefreshCw, Terminal, Sparkles, Trash2, Database } from 'lucide-react';
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

interface PersonnelMember {
  id: string;
  name: string;
  role: string;
  unit: string;
  zones: string[];
  status: string;
}

const SAMPLE_DATASET_LOGS: SoldierLog[] = [
  { id: 1, service_number: 'IA-948201', name: 'Subedar Vikram Singh', rank: 'Subedar', unit: '14 Corps - High Altitude Recon', action: 'DUTY_LOGIN', terminal_id: 'TERMINAL-LAC-NORTH', ip_address: '10.14.2.10', status: 'AUTHORIZED', timestamp: '2026-10-01 14:15:22' },
  { id: 2, service_number: 'IA-773194', name: 'Major Rajesh Sharma', rank: 'Major', unit: '9 Para Special Forces', action: 'DUTY_LOGIN', terminal_id: 'TERMINAL-HQ-ALPHA', ip_address: '10.14.1.04', status: 'AUTHORIZED', timestamp: '2026-10-01 14:20:05' },
  { id: 3, service_number: 'IA-661038', name: 'Havildar Gurpreet Singh', rank: 'Havildar', unit: 'Sikh Light Infantry', action: 'DUTY_LOGIN', terminal_id: 'TERMINAL-CHECKPOINT-4', ip_address: '10.14.3.18', status: 'AUTHORIZED', timestamp: '2026-10-01 14:28:40' },
  { id: 4, service_number: 'IA-829104', name: 'Captain Ananya Roy', rank: 'Captain', unit: 'Signals Intelligence Wing', action: 'STATION_CHECK_IN', terminal_id: 'TERMINAL-DRONE-OPS', ip_address: '10.14.1.88', status: 'AUTHORIZED', timestamp: '2026-10-01 14:32:10' },
  { id: 5, service_number: 'IA-550192', name: 'Lieutenant Karan Verma', rank: 'Lieutenant', unit: 'Armored Corps - 1st Cavalry', action: 'DUTY_LOGIN', terminal_id: 'TERMINAL-ARMOR-DEPOT', ip_address: '10.14.4.12', status: 'AUTHORIZED', timestamp: '2026-10-01 14:35:18' }
];

const SAMPLE_DATASET_ACTIVITIES: PersonnelActivity[] = [
  { id: 1, soldier_id: 'IA-948201', soldier_name: 'Subedar Vikram Singh', rank: 'Subedar', activity_type: 'DUTY_LOGIN', details: 'Authenticated to LAC Northern Sector command terminal', terminal_id: 'TERMINAL-LAC-NORTH', timestamp: '2026-10-01 14:15:22' },
  { id: 2, soldier_id: 'IA-948201', soldier_name: 'Subedar Vikram Singh', rank: 'Subedar', activity_type: 'CAMERA_FEED_ACCESSED', details: 'Opened 4K live tactical stream for CAM-07 (LAC Northern Sector)', terminal_id: 'TERMINAL-LAC-NORTH', timestamp: '2026-10-01 14:16:05' },
  { id: 3, soldier_id: 'IA-773194', soldier_name: 'Major Rajesh Sharma', rank: 'Major', activity_type: 'DEFCON_MODIFIED', details: 'Elevated facility readiness to DEFCON-2 following radar contact', terminal_id: 'TERMINAL-HQ-ALPHA', timestamp: '2026-10-01 14:22:10' },
  { id: 4, soldier_id: 'IA-773194', soldier_name: 'Major Rajesh Sharma', rank: 'Major', activity_type: 'SIREN_ARMED', details: 'Armed automated continuous tactical siren for non-human object intrusions', terminal_id: 'TERMINAL-HQ-ALPHA', timestamp: '2026-10-01 14:23:45' },
  { id: 5, soldier_id: 'IA-661038', soldier_name: 'Havildar Gurpreet Singh', rank: 'Havildar', activity_type: 'SNAPSHOT_CAPTURED', details: 'Saved incursion snapshot frame at Perimeter Checkpoint Alpha', terminal_id: 'TERMINAL-CHECKPOINT-4', timestamp: '2026-10-01 14:29:12' }
];

const SAMPLE_DATASET_MEMBERS: PersonnelMember[] = [
  { id: 'IA-948201', name: 'Subedar Vikram Singh', role: 'High Altitude Recon Chief', unit: '14 Corps - High Altitude Recon', zones: ['Zone Alpha', 'Ridge Line'], status: 'ACCESS ACTIVE' },
  { id: 'IA-773194', name: 'Major Rajesh Sharma', role: 'Special Forces Commander', unit: '9 Para Special Forces', zones: ['Zone Alpha', 'Zone Bravo', 'Armory'], status: 'ACCESS ACTIVE' },
  { id: 'IA-661038', name: 'Havildar Gurpreet Singh', role: 'Perimeter Sentry Guard', unit: 'Sikh Light Infantry', zones: ['Northern Perimeter'], status: 'ACCESS ACTIVE' },
  { id: 'IA-829104', name: 'Captain Ananya Roy', role: 'Cyber & Radar Specialist', unit: 'Signals Intelligence Wing', zones: ['Radar Outpost', 'Terminal Hub'], status: 'ACCESS ACTIVE' }
];

export default function Personnel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'login_logs' | 'activity_logs' | 'directory'>('login_logs');
  const [soldierLogs, setSoldierLogs] = useState<SoldierLog[]>([]);
  const [activities, setActivities] = useState<PersonnelActivity[]>([]);
  const [personnelList, setPersonnelList] = useState<PersonnelMember[]>([]);
  const [hasSampleDataset, setHasSampleDataset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form State for manual soldier duty check-in
  const [newLogin, setNewLogin] = useState({
    service_number: 'IA-948201',
    name: 'Subedar Vikram Singh',
    rank: 'Subedar',
    unit: '14 Corps - High Altitude Recon',
    action: 'DUTY_LOGIN',
    terminal_id: 'TERMINAL-LAC-NORTH'
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch & Sync Live Logins from localStorage + Backend API
  const refreshPersonnelData = async () => {
    setLoading(true);

    // Read active operator session
    let currentSession: any = null;
    try {
      const storedSession = localStorage.getItem('aegis_session');
      if (storedSession) {
        currentSession = JSON.parse(storedSession);
      }
    } catch {}

    // Read live duty logins stored in browser
    let storedLogins: SoldierLog[] = [];
    let storedActs: PersonnelActivity[] = [];
    try {
      const l = localStorage.getItem('aegis_duty_logins');
      if (l) storedLogins = JSON.parse(l);
      const a = localStorage.getItem('aegis_personnel_activities');
      if (a) storedActs = JSON.parse(a);
    } catch {}

    // If current user is logged in, ensure their entry exists in live logs
    if (currentSession && currentSession.serviceId) {
      const existsInLogs = storedLogins.some(l => l.service_number.toUpperCase() === currentSession.serviceId.toUpperCase());
      if (!existsInLogs) {
        const activeEntry: SoldierLog = {
          id: Date.now(),
          service_number: currentSession.serviceId,
          name: currentSession.operatorName,
          rank: currentSession.rank || 'Operator',
          unit: currentSession.unit || 'Defense Outpost',
          action: 'DUTY_LOGIN',
          terminal_id: `TERMINAL-${currentSession.base?.code || 'MAIN-GRID'}`,
          ip_address: '10.14.0.12',
          status: 'AUTHORIZED',
          timestamp: currentSession.loginTimestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        storedLogins = [activeEntry, ...storedLogins];
        localStorage.setItem('aegis_duty_logins', JSON.stringify(storedLogins));
      }

      const existsInActs = storedActs.some(a => a.soldier_id.toUpperCase() === currentSession.serviceId.toUpperCase());
      if (!existsInActs) {
        const activeAct: PersonnelActivity = {
          id: Date.now(),
          soldier_id: currentSession.serviceId,
          soldier_name: currentSession.operatorName,
          rank: currentSession.rank || 'Operator',
          activity_type: 'DUTY_LOGIN',
          details: `Active operator authenticated to ${currentSession.base?.name || 'Sector Command'}`,
          terminal_id: `TERMINAL-${currentSession.base?.code || 'MAIN-GRID'}`,
          timestamp: currentSession.loginTimestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        storedActs = [activeAct, ...storedActs];
        localStorage.setItem('aegis_personnel_activities', JSON.stringify(storedActs));
      }
    }

    // Check if sample dataset is enabled
    const sampleFlag = localStorage.getItem('aegis_sample_dataset_loaded') === 'true';
    setHasSampleDataset(sampleFlag);

    let finalLogs = [...storedLogins];
    let finalActs = [...storedActs];
    let finalMembers: PersonnelMember[] = [];

    // Current logged-in operator as personnel member
    if (currentSession && currentSession.serviceId) {
      finalMembers.push({
        id: currentSession.serviceId,
        name: currentSession.operatorName,
        role: `${currentSession.rank || 'Operator'} // Active Commander`,
        unit: currentSession.unit || 'Defense Recon Command',
        zones: ['Zone Alpha', 'Command Hub', currentSession.base?.name || 'Northern Outpost'],
        status: 'ACCESS ACTIVE'
      });
    }

    // If sample dataset loaded, append sample records
    if (sampleFlag) {
      SAMPLE_DATASET_LOGS.forEach(sLog => {
        if (!finalLogs.some(l => l.service_number.toUpperCase() === sLog.service_number.toUpperCase())) {
          finalLogs.push(sLog);
        }
      });
      SAMPLE_DATASET_ACTIVITIES.forEach(sAct => {
        if (!finalActs.some(a => a.soldier_id.toUpperCase() === sAct.soldier_id.toUpperCase())) {
          finalActs.push(sAct);
        }
      });
      SAMPLE_DATASET_MEMBERS.forEach(sMem => {
        if (!finalMembers.some(m => m.id.toUpperCase() === sMem.id.toUpperCase())) {
          finalMembers.push(sMem);
        }
      });
    }

    setSoldierLogs(finalLogs);
    setActivities(finalActs);
    setPersonnelList(finalMembers);
    setLoading(false);
  };

  useEffect(() => {
    refreshPersonnelData();
    const interval = setInterval(refreshPersonnelData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load Sample Military Datasets on Demand
  const handleLoadSampleDataset = () => {
    localStorage.setItem('aegis_sample_dataset_loaded', 'true');
    setHasSampleDataset(true);
    refreshPersonnelData();
    setSuccessMsg('Sample defense personnel dataset (14 Corps & 9 Para SF) loaded successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // 3. Clear Data & Return to Clean Slate (Only active user's login)
  const handleClearToCleanSlate = () => {
    localStorage.removeItem('aegis_sample_dataset_loaded');
    setHasSampleDataset(false);
    refreshPersonnelData();
    setSuccessMsg('Cleared sample data. Showing only your live authenticated operator account.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // 4. Submit new Soldier Duty Login into Directory
  const handleSoldierLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogin.name || !newLogin.service_number) return;
    setSubmitting(true);
    setSuccessMsg('');

    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newLog: SoldierLog = {
      id: Date.now(),
      service_number: newLogin.service_number.toUpperCase(),
      name: newLogin.name,
      rank: newLogin.rank,
      unit: newLogin.unit,
      action: newLogin.action,
      terminal_id: newLogin.terminal_id,
      ip_address: '10.14.0.55',
      status: 'AUTHORIZED',
      timestamp: timeStr
    };

    const newAct: PersonnelActivity = {
      id: Date.now(),
      soldier_id: newLogin.service_number.toUpperCase(),
      soldier_name: newLogin.name,
      rank: newLogin.rank,
      activity_type: newLogin.action,
      details: `Operator checked in at station ${newLogin.terminal_id}`,
      terminal_id: newLogin.terminal_id,
      timestamp: timeStr
    };

    // Save to persistent browser storage
    const currentStoredLogins = JSON.parse(localStorage.getItem('aegis_duty_logins') || '[]');
    localStorage.setItem('aegis_duty_logins', JSON.stringify([newLog, ...currentStoredLogins]));

    const currentStoredActs = JSON.parse(localStorage.getItem('aegis_personnel_activities') || '[]');
    localStorage.setItem('aegis_personnel_activities', JSON.stringify([newAct, ...currentStoredActs]));

    // Try backend sync if available
    try {
      await fetch(`${API_BASE_URL}/api/auth/soldier-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogin)
      });
    } catch {}

    refreshPersonnelData();
    setSuccessMsg('Soldier duty login verified and registered in live database!');
    setTimeout(() => {
      setShowLoginModal(false);
      setSuccessMsg('');
    }, 800);
    setSubmitting(false);
  };

  const filteredLogs = soldierLogs.filter(log => 
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.service_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivities = activities.filter(act => 
    act.soldier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.soldier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPersonnel = personnelList.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: 'var(--color-accent)' }}>PERSONNEL & SOLDIER DUTY DIRECTORY</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            LIVE AUTHENTICATED OPERATOR LOGINS & DEFENSE ACTION AUDIT TRAIL
          </p>
        </div>
        
        {/* Controls: Search, Load Dataset, Clean Slate, Add Login */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search soldier or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 12 }} 
            />
          </div>

          {/* Live Refresh Button */}
          <button
            onClick={() => refreshPersonnelData()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid var(--color-accent)',
              color: 'var(--color-accent)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Refresh live operator duty logins"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'SYNCING...' : 'LIVE SYNC'}
          </button>

          {/* Load Sample Dataset Button */}
          {!hasSampleDataset ? (
            <button
              onClick={handleLoadSampleDataset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid var(--color-warning)',
                color: 'var(--color-warning)',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Populate sample 14 Corps / 9 Para SF military duty dataset"
            >
              <Database size={14} /> LOAD SAMPLE DATASET
            </button>
          ) : (
            <button
              onClick={handleClearToCleanSlate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-alert)',
                color: 'var(--color-alert)',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Reset and only show your own live account"
            >
              <Trash2 size={14} /> CLEAR SAMPLE DATA
            </button>
          )}

          <button 
            onClick={() => setShowLoginModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 'bold' }}
          >
            <Plus size={15} /> RECORD SOLDIER LOGIN
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '8px 14px',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid var(--color-success)',
          color: 'var(--color-success)',
          borderRadius: 4,
          marginBottom: 16,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
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
          <ShieldCheck size={14} />
          LIVE SOLDIER DUTY LOGINS ({filteredLogs.length})
        </button>

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
          <Clock size={14} />
          SECURITY ACTION AUDIT ({filteredActivities.length})
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
          <User size={14} />
          PERSONNEL DIRECTORY ({filteredPersonnel.length})
        </button>
      </div>

      {/* Clean Slate Prompt when only 1 record and sample not loaded */}
      {!hasSampleDataset && soldierLogs.length <= 1 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          border: '1px dashed var(--color-accent)',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="var(--color-accent)" />
            <span>
              <strong>CLEAN SLATE ACTIVE:</strong> Displaying your live authenticated session. You can record soldiers manually or load the sample military dataset.
            </span>
          </div>
          <button
            onClick={handleLoadSampleDataset}
            style={{
              padding: '5px 12px',
              backgroundColor: 'var(--color-accent)',
              color: '#000',
              border: 'none',
              borderRadius: 3,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 11
            }}
          >
            📥 LOAD SAMPLE DATASET
          </button>
        </div>
      )}

      {/* TAB 1: Live Database Soldier Login Logs */}
      {activeTab === 'login_logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              LIVE SOLDIER DUTY LOGINS & ACCESS TIMESTAMPS
            </h4>
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: "'Share Tech Mono', monospace" }}>
              ● LIVE SYNCED
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
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No soldier login records found. Click "+ RECORD SOLDIER LOGIN" or "LOAD SAMPLE DATASET".
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Live Activity Logs */}
      {activeTab === 'activity_logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-accent)', letterSpacing: 1 }}>
              AUDIT TRAIL: OPERATOR ACCESS & SURVEILLANCE ACTIONS
            </h4>
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontFamily: "'Share Tech Mono', monospace" }}>
              RECORD COUNT: {filteredActivities.length}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-light)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>OPERATOR</th>
                  <th style={{ padding: '10px 16px' }}>SERVICE ID</th>
                  <th style={{ padding: '10px 16px' }}>ACTION TYPE</th>
                  <th style={{ padding: '10px 16px' }}>ACTION DETAILS</th>
                  <th style={{ padding: '10px 16px' }}>TERMINAL</th>
                  <th style={{ padding: '10px 16px' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No activity logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
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
                  ))
                )}
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
              <ShieldCheck size={20} /> RECORD SOLDIER DUTY CHECK-IN
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Logs the soldier's authentication timestamp, duty post, and station in the live database.
            </p>

            <form onSubmit={handleSoldierLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>SERVICE NO.</label>
                  <input 
                    type="text" 
                    value={newLogin.service_number} 
                    onChange={e => setNewLogin({ ...newLogin, service_number: e.target.value })}
                    required
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>RANK</label>
                  <select
                    value={newLogin.rank}
                    onChange={e => setNewLogin({ ...newLogin, rank: e.target.value })}
                    style={{ width: '100%', padding: '9px', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4 }}
                  >
                    <option value="Subedar Major">Subedar Major</option>
                    <option value="Subedar">Subedar</option>
                    <option value="Major">Major</option>
                    <option value="Colonel">Colonel</option>
                    <option value="Captain">Captain</option>
                    <option value="Lieutenant">Lieutenant</option>
                    <option value="Havildar">Havildar</option>
                    <option value="Sepoy">Sepoy</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>SOLDIER FULL NAME</label>
                <input 
                  type="text" 
                  value={newLogin.name} 
                  onChange={e => setNewLogin({ ...newLogin, name: e.target.value })}
                  required
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>MILITARY UNIT / REGIMENT</label>
                <input 
                  type="text" 
                  value={newLogin.unit} 
                  onChange={e => setNewLogin({ ...newLogin, unit: e.target.value })}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>ASSIGNED TERMINAL / POST</label>
                <select
                  value={newLogin.terminal_id}
                  onChange={e => setNewLogin({ ...newLogin, terminal_id: e.target.value })}
                  style={{ width: '100%', padding: '9px', backgroundColor: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: 4 }}
                >
                  <option value="TERMINAL-LAC-NORTH">TERMINAL-LAC-NORTH (Himalayan Ridge)</option>
                  <option value="TERMINAL-HQ-ALPHA">TERMINAL-HQ-ALPHA (Central Command)</option>
                  <option value="TERMINAL-CHECKPOINT-4">TERMINAL-CHECKPOINT-4 (Perimeter Watch)</option>
                  <option value="TERMINAL-DRONE-OPS">TERMINAL-DRONE-OPS (UAV Air Recon)</option>
                  <option value="TERMINAL-RADAR-MAST">TERMINAL-RADAR-MAST (Thermal Sentry)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  REGISTER LOGIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
