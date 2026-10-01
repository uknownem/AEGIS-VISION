export const mockCameras = [
  { id: 'CAM-01', name: 'Northern Perimeter', type: 'RGB + Thermal', zone: 'Zone Alpha', status: 'live' },
  { id: 'CAM-02', name: 'Main Gate', type: 'RGB Camera', zone: 'Entry Corridor', status: 'live' },
  { id: 'CAM-03', name: 'Equipment Storage', type: 'Thermal Sensor', zone: 'Storage Area', status: 'offline' },
  { id: 'CAM-04', name: 'Eastern Wall', type: 'RGB + Thermal', zone: 'Zone Bravo', status: 'live' },
];

export const mockAlerts = [
  { id: 1, severity: 'HIGH', time: '11:42:18', camera: 'CAM-04', zone: 'Zone Bravo', type: 'Human Presence Detected', identity: 'Unknown', status: 'Awaiting Review' },
  { id: 2, severity: 'MEDIUM', time: '10:15:22', camera: 'CAM-01', zone: 'Zone Alpha', type: 'Thermal Anomaly', identity: 'N/A', status: 'Reviewed' }
];

export const mockZones = [
  { id: 'Z-01', name: 'Zone Alpha', priority: 'CRITICAL', cameras: 4, status: 'SECURE' },
  { id: 'Z-02', name: 'Zone Bravo', priority: 'HIGH', cameras: 2, status: 'SECURE' },
  { id: 'Z-03', name: 'Entry Corridor', priority: 'MEDIUM', cameras: 3, status: 'SECURE' },
  { id: 'Z-04', name: 'Equipment Storage', priority: 'HIGH', cameras: 1, status: 'OFFLINE' },
];

export const mockPersonnel = [
  { id: 'TS-001', name: 'Operator A', role: 'Security Personnel', zones: ['Zone Alpha', 'Northern Perimeter'], status: 'ACCESS ACTIVE' },
  { id: 'TS-002', name: 'Operator B', role: 'System Admin', zones: ['All Zones'], status: 'ACCESS ACTIVE' },
  { id: 'TS-003', name: 'Contractor X', role: 'Maintenance', zones: ['Entry Corridor'], status: 'ACCESS REVOKED' },
  { id: 'TS-004', name: 'Officer C', role: 'Command', zones: ['Zone Alpha', 'Zone Bravo'], status: 'ACCESS ACTIVE' },
];

export const mockAnalytics = {
  alertsOverTime: [
    { time: '08:00', alerts: 1 },
    { time: '10:00', alerts: 3 },
    { time: '12:00', alerts: 0 },
    { time: '14:00', alerts: 5 },
    { time: '16:00', alerts: 2 }
  ],
  detectionsByZone: [
    { name: 'Zone Alpha', value: 40 },
    { name: 'Zone Bravo', value: 30 },
    { name: 'Entry', value: 20 },
    { name: 'Storage', value: 10 }
  ]
};
