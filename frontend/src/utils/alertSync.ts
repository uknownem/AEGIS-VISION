import { API_BASE_URL } from '../config';

export type IncursionType = 
  | 'NON_HUMAN_INTRUSION'
  | 'UAV_PERIMETER_BREACH'
  | 'ARMOR_CONVOY_MOVEMENT'
  | 'LASER_TRIPWIRE_BREACH'
  | 'THERMAL_SIGNATURE_BREACH'
  | 'PERIMETER_SENTRY_BREACH';

export type ObjectCategory =
  | 'ELECTRONIC_GADGET'
  | 'METALLIC_TOOL'
  | 'UAV_DRONE'
  | 'ARMORED_VEHICLE'
  | 'THERMAL_HEAT_SOURCE'
  | 'UNAUTHORIZED_HUMAN'
  | 'UNKNOWN_ANOMALY';

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'ADVISORY';

export interface SecurityAlert {
  id: number;
  alert_type: IncursionType | string;
  incursion_category: string;
  object_category: ObjectCategory | string;
  target_class: string;
  threat_level: ThreatLevel;
  confidence: number;
  camera_id: string;
  sector: string;
  siren_triggered: number | boolean;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  distance_meters: number;
  origin_operator?: string;
  origin_base?: string;
  notes: string;
  timestamp: string;
}

export const SAMPLE_SECURITY_ALERTS: SecurityAlert[] = [
  { 
    id: 101, 
    alert_type: 'ARMOR_CONVOY_MOVEMENT',
    incursion_category: 'HEAVY ARMOR ADVANCE',
    object_category: 'ARMORED_VEHICLE',
    target_class: 'Main Battle Tank / BMP-2', 
    threat_level: 'CRITICAL',
    confidence: 0.965, 
    camera_id: 'CAM-01', 
    sector: 'LAC Northern Sector', 
    siren_triggered: 1, 
    status: 'ACTIVE', 
    distance_meters: 48.2, 
    origin_operator: 'IA-948201 (Subedar Vikram Singh)',
    origin_base: 'LAC Northern Outpost',
    notes: 'Armored vehicle detected traversing snow corridor // AUTOMATED TACTICAL SIREN ENGAGED', 
    timestamp: '2026-10-01 14:24:12' 
  },
  { 
    id: 102, 
    alert_type: 'NON_HUMAN_INTRUSION',
    incursion_category: 'RESTRICTED OBJECT INTRUSION',
    object_category: 'METALLIC_TOOL',
    target_class: 'Metallic Spoon / Tool / Phone / Charger', 
    threat_level: 'HIGH',
    confidence: 0.935, 
    camera_id: 'CAM-01', 
    sector: 'Perimeter Checkpoint Alpha', 
    siren_triggered: 1, 
    status: 'ACTIVE', 
    distance_meters: 1.4, 
    origin_operator: 'IA-773194 (Major Rajesh Sharma)',
    origin_base: 'Main HQ Alpha',
    notes: 'Non-human prohibited object detected in perimeter perimeter zone // CONTINUOUS SIREN ACTIVE', 
    timestamp: '2026-10-01 14:10:00' 
  },
  { 
    id: 103, 
    alert_type: 'UAV_PERIMETER_BREACH',
    incursion_category: 'AIRSPACE INFILTRATION',
    object_category: 'UAV_DRONE',
    target_class: 'Hostile Surveillance Quadcopter UAV', 
    threat_level: 'CRITICAL',
    confidence: 0.942, 
    camera_id: 'CAM-04', 
    sector: 'Eastern Ridge Pass', 
    siren_triggered: 1, 
    status: 'ACKNOWLEDGED', 
    distance_meters: 125.0, 
    origin_operator: 'IA-829104 (Captain Ananya Roy)',
    origin_base: 'Eastern Ridge Base',
    notes: 'Low-altitude radar-evading drone detected crossing perimeter // Operator acknowledged', 
    timestamp: '2026-10-01 13:58:30' 
  },
  { 
    id: 104, 
    alert_type: 'THERMAL_SIGNATURE_BREACH',
    incursion_category: 'NIGHT FLIR CAMOUFLAGE ANOMALY',
    object_category: 'THERMAL_HEAT_SOURCE',
    target_class: 'High-Heat Thermal Signature (840nm)', 
    threat_level: 'ELEVATED',
    confidence: 0.890, 
    camera_id: 'CAM-03', 
    sector: 'Main Gate Corridor', 
    siren_triggered: 0, 
    status: 'RESOLVED', 
    distance_meters: 18.5, 
    origin_operator: 'IA-661038 (Havildar Gurpreet Singh)',
    origin_base: 'Siachen Sentry Post',
    notes: 'Thermal heat bloom verified as authorized convoy exhaust // Threat neutralized & resolved', 
    timestamp: '2026-10-01 13:30:00' 
  }
];

const STORAGE_KEYS = ['aegis_global_alerts', 'aegis_alerts', 'aegis_alerts_cache'];
const BROADCAST_CHANNEL_NAME = 'aegis_defense_alert_bus';

class AlertSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(alerts: SecurityAlert[]) => void> = new Set();
  private isPolling = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'ALERTS_UPDATED') {
            this.notifyListeners(event.data.alerts);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel fallback note:', e);
      }

      // Storage event for cross-tab live synchronization
      window.addEventListener('storage', (e) => {
        if (e.key && STORAGE_KEYS.includes(e.key) && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              this.notifyListeners(parsed);
            }
          } catch {}
        }
      });

      this.startLivePolling();
    }
  }

  // Get current active operator session
  private getActiveOperatorSession(): { id: string; name: string; base: string } {
    try {
      const s = localStorage.getItem('aegis_session');
      if (s) {
        const parsed = JSON.parse(s);
        return {
          id: parsed.serviceId || 'OPERATOR-HQ',
          name: parsed.operatorName || 'Defense Operator',
          base: parsed.base?.name || 'Northern Command'
        };
      }
    } catch {}
    return { id: 'OP-LOCAL', name: 'Command Operator', base: 'Sector Command' };
  }

  // Read all persistent alerts across all unified keys
  public getAlerts(): SecurityAlert[] {
    if (typeof window === 'undefined') return [];
    
    // Check if sample dataset loaded flag
    const sampleFlag = localStorage.getItem('aegis_sample_alerts_loaded') === 'true' || localStorage.getItem('aegis_sample_dataset_loaded') === 'true';

    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }

    if (sampleFlag) {
      return [...SAMPLE_SECURITY_ALERTS];
    }

    return [];
  }

  // Save and broadcast alerts across all accounts & browser tabs
  public saveAndBroadcastAlerts(alerts: SecurityAlert[]) {
    if (typeof window === 'undefined') return;

    // Write to all unified storage keys
    const jsonStr = JSON.stringify(alerts);
    STORAGE_KEYS.forEach(key => {
      try {
        localStorage.setItem(key, jsonStr);
      } catch {}
    });

    // Broadcast live to all open tabs and accounts
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'ALERTS_UPDATED', alerts });
      } catch {}
    }

    this.notifyListeners(alerts);
  }

  // Record a new incursion alert from ANY account or detection sensor
  public async broadcastNewAlert(alertData: Partial<SecurityAlert>): Promise<SecurityAlert> {
    const session = this.getActiveOperatorSession();
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newId = alertData.id || (Date.now() % 1000000);

    // Determine Incursion & Object Category
    const alertType = (alertData.alert_type || 'NON_HUMAN_INTRUSION') as IncursionType;
    let incursionCategory = alertData.incursion_category || 'RESTRICTED SECTOR INTRUSION';
    let objectCategory: ObjectCategory = (alertData.object_category as ObjectCategory) || 'METALLIC_TOOL';
    let threatLevel: ThreatLevel = alertData.threat_level || 'HIGH';

    if (alertType === 'UAV_PERIMETER_BREACH') {
      incursionCategory = 'HOSTILE AIRSPACE INFILTRATION';
      objectCategory = 'UAV_DRONE';
      threatLevel = 'CRITICAL';
    } else if (alertType === 'ARMOR_CONVOY_MOVEMENT') {
      incursionCategory = 'MECHANIZED ARMOR ADVANCE';
      objectCategory = 'ARMORED_VEHICLE';
      threatLevel = 'CRITICAL';
    } else if (alertType === 'THERMAL_SIGNATURE_BREACH') {
      incursionCategory = 'FLIR THERMAL CAMOUFLAGE ANOMALY';
      objectCategory = 'THERMAL_HEAT_SOURCE';
      threatLevel = 'ELEVATED';
    } else if (alertType === 'LASER_TRIPWIRE_BREACH') {
      incursionCategory = 'LASER PERIMETER TRIPWIRE BREACH';
      objectCategory = 'UNAUTHORIZED_HUMAN';
      threatLevel = 'CRITICAL';
    }

    const newAlert: SecurityAlert = {
      id: newId,
      alert_type: alertType,
      incursion_category: incursionCategory,
      object_category: objectCategory,
      target_class: alertData.target_class || 'Non-Human Target Object',
      threat_level: threatLevel,
      confidence: alertData.confidence || 0.95,
      camera_id: alertData.camera_id || 'CAM-01',
      sector: alertData.sector || session.base || 'LAC Northern Sector',
      siren_triggered: alertData.siren_triggered !== undefined ? alertData.siren_triggered : 1,
      status: alertData.status || 'ACTIVE',
      distance_meters: alertData.distance_meters || 1.8,
      origin_operator: `${session.id} (${session.name})`,
      origin_base: session.base,
      notes: alertData.notes || `Incursion logged live by ${session.name} // Sector Alarm Engaged`,
      timestamp: alertData.timestamp || timeStr
    };

    const currentAlerts = this.getAlerts();
    // Filter out if duplicate ID exists, prepend new alert
    const updated = [newAlert, ...currentAlerts.filter(a => a.id !== newId)];
    this.saveAndBroadcastAlerts(updated);

    // Send to backend API if available
    try {
      await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });
    } catch {}

    return newAlert;
  }

  // Update status of an existing alert (ACKNOWLEDGE / RESOLVE)
  public async updateAlertStatus(id: number, newStatus: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED', notes?: string) {
    const session = this.getActiveOperatorSession();
    const timeStr = new Date().toLocaleTimeString();
    const currentAlerts = this.getAlerts();

    const updated = currentAlerts.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus,
          notes: notes || `${newStatus} by ${session.id} (${session.name}) at ${timeStr}`
        };
      }
      return a;
    });

    this.saveAndBroadcastAlerts(updated);

    // Backend sync
    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: notes || `${newStatus} by ${session.name}` })
      });
    } catch {}
  }

  // Delete a single alert
  public deleteAlert(id: number) {
    const current = this.getAlerts();
    const updated = current.filter(a => a.id !== id);
    this.saveAndBroadcastAlerts(updated);
  }

  // Clear all alerts
  public clearAllAlerts() {
    localStorage.removeItem('aegis_sample_alerts_loaded');
    localStorage.removeItem('aegis_sample_dataset_loaded');
    this.saveAndBroadcastAlerts([]);
  }

  // Load sample dataset
  public loadSampleAlerts() {
    localStorage.setItem('aegis_sample_alerts_loaded', 'true');
    const current = this.getAlerts();
    const map = new Map<number, SecurityAlert>();
    SAMPLE_SECURITY_ALERTS.forEach(a => map.set(a.id, a));
    current.forEach(a => map.set(a.id, a));
    const merged = Array.from(map.values()).sort((a, b) => b.id - a.id);
    this.saveAndBroadcastAlerts(merged);
  }

  // Subscribe to live alert updates across any account
  public subscribe(callback: (alerts: SecurityAlert[]) => void): () => void {
    this.listeners.add(callback);
    // Trigger initial callback
    callback(this.getAlerts());

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(alerts: SecurityAlert[]) {
    this.listeners.forEach(cb => {
      try {
        cb(alerts);
      } catch {}
    });
  }

  // Background polling to sync with backend database
  private startLivePolling() {
    if (this.isPolling) return;
    this.isPolling = true;

    const pollBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
            const current = this.getAlerts();
            const map = new Map<number, SecurityAlert>();
            json.data.forEach((a: SecurityAlert) => map.set(a.id, a));
            current.forEach((a: SecurityAlert) => {
              if (!map.has(a.id)) map.set(a.id, a);
            });
            const merged = Array.from(map.values()).sort((a, b) => b.id - a.id);
            if (JSON.stringify(merged) !== JSON.stringify(current)) {
              this.saveAndBroadcastAlerts(merged);
            }
          }
        }
      } catch {}
    };

    setInterval(pollBackend, 2500);
  }
}

export const alertSync = new AlertSyncService();
