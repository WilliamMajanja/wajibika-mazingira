import * as React from 'react';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { useI18n } from '../config/i18n';
import {
  CarbonPassport, SensorType, CarbonProject, PassportEventType,
  SignedObservation, PassportEvent, CommunityVerification,
} from '../types';

const ALL_SENSORS: SensorType[] = ['acoustic', 'visual', 'salinity', 'water_level', 'biomass', 'weather', 'gps', 'water_quality'];

const sensorLabels: Record<SensorType, { icon: string; label: string; unit: string }> = {
  acoustic: { icon: '🎤', label: 'Acoustic', unit: 'dB' },
  visual: { icon: '📷', label: 'Visual', unit: 'index' },
  salinity: { icon: '🧂', label: 'Salinity', unit: 'ppt' },
  water_level: { icon: '📏', label: 'Water Level', unit: 'm' },
  biomass: { icon: '🌿', label: 'Biomass', unit: 'kg/m²' },
  weather: { icon: '🌤️', label: 'Weather', unit: '°C' },
  gps: { icon: '📍', label: 'GPS', unit: 'coord' },
  water_quality: { icon: '💧', label: 'Water Quality', unit: 'pH' },
};

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-slate-100 text-slate-600',
  calibrated: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
};

const eventIcons: Record<string, string> = {
  restoration: '🌱',
  degradation: '⚠️',
  monitoring: '📡',
  verification: '✅',
  intervention: '🛠️',
};

const EVENT_TYPES: PassportEventType[] = ['restoration', 'degradation', 'monitoring', 'verification', 'intervention'];

const MS_DAY = 86400000;
const MS_HOUR = 3600000;

function generateBoundary(centerLat: number, centerLng: number): { latitude: number; longitude: number }[] {
  const offsets = [
    { lat: 0.01, lng: 0.01 },
    { lat: 0.01, lng: -0.01 },
    { lat: -0.01, lng: -0.01 },
    { lat: -0.01, lng: 0.01 },
  ];
  const randomFloat = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
  return offsets.map(o => ({
    latitude: Math.round((centerLat + o.lat + (randomFloat() - 0.5) * 0.005) * 10000) / 10000,
    longitude: Math.round((centerLng + o.lng + (randomFloat() - 0.5) * 0.005) * 10000) / 10000,
  }));
}

function generateObservations(deviceId: string, count: number, startOffsetHours: number): SignedObservation[] {
  return Array.from({ length: count }, (_, i) => {
    const sensorType = ALL_SENSORS[i % ALL_SENSORS.length];
    let value: number;
    if (sensorType === 'gps') {
      value = Math.round((20 + Math.random() * 80) * 100) / 100;
    } else if (sensorType === 'water_quality') {
      value = Math.round((6.0 + Math.random() * 2.5) * 100) / 100;
    } else {
      value = Math.round((20 + Math.random() * 80) * 100) / 100;
    }
    const ts = Date.now() - (startOffsetHours - i) * MS_HOUR;
    return {
      id: `obs-${Date.now().toString(36)}-${i}`,
      deviceId,
      sensorType,
      timestamp: new Date(ts).toISOString(),
      value,
      unit: sensorLabels[sensorType].unit,
      signature: `sig_${Date.now().toString(36)}_${i}`,
      minAnchoredAt: new Date(ts + 5000).toISOString(),
      minTxId: `tx_${Date.now().toString(36)}_${i}`,
    };
  });
}

function generateMockPassport(projects: CarbonProject[]): CarbonPassport | null {
  if (projects.length === 0) return null;
  const project = projects[0];
  // Derive center coordinates from location hash for variety
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseLat = -1.0 - (hash % 5) * 0.1;
  const baseLng = 36.0 + (hash % 5) * 0.2;
  const boundary = generateBoundary(baseLat, baseLng);
  const centerLat = boundary.reduce((s, p) => s + p.latitude, 0) / boundary.length;
  const centerLng = boundary.reduce((s, p) => s + p.longitude, 0) / boundary.length;

  return {
    id: `CP-${Date.now().toString(36).toUpperCase()}`,
    projectId: project.id,
    projectName: project.name,
    ecosystemLocation: project.location,
    boundary,
    device: {
      id: `VS-${(hash % 900) + 100}`,
      name: `VEIN Sense Station ${['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'][hash % 5]}`,
      firmwareVersion: '2.4.1',
      calibrationStatus: 'calibrated',
      lastCalibration: new Date(Date.now() - 7 * MS_DAY).toISOString(),
      sensors: ALL_SENSORS,
      location: { latitude: centerLat, longitude: centerLng },
      installedAt: new Date(Date.now() - 90 * MS_DAY).toISOString(),
      batteryLevel: 60 + Math.floor(Math.random() * 35),
    },
    observations: generateObservations(`VS-${(hash % 900) + 100}`, 12, 12),
    edgeAiOutputs: [
      {
        id: `ai-${Date.now().toString(36)}-1`,
        deviceId: `VS-${(hash % 900) + 100}`,
        modelName: 'bioacoustic-classifier-v3',
        inferenceTimestamp: new Date(Date.now() - MS_HOUR).toISOString(),
        result: 'Species detected: 12 bird species, biodiversity index: 0.78',
        confidence: 0.89,
        metrics: { species_count: 12, biodiversity_index: 0.78, signal_quality: 0.92 },
      },
      {
        id: `ai-${Date.now().toString(36)}-2`,
        deviceId: `VS-${(hash % 900) + 100}`,
        modelName: 'biomass-estimator-v2',
        inferenceTimestamp: new Date(Date.now() - 2 * MS_HOUR).toISOString(),
        result: 'Above-ground biomass: 45.3 t/ha, Carbon stock: 22.6 tC/ha',
        confidence: 0.85,
        metrics: { biomass_tpha: 45.3, carbon_tpha: 22.6, canopy_cover: 0.67 },
      },
    ],
    totalSequestered: project.totalTonnesSequestered,
    lastUpdated: new Date().toISOString(),
    events: [
      {
        id: `evt-${Date.now().toString(36)}-1`,
        type: 'monitoring',
        timestamp: new Date(Date.now() - MS_DAY).toISOString(),
        description: 'Routine environmental monitoring completed. All sensors operational.',
        actor: `VEIN Sense Station ${['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'][hash % 5]}`,
        evidenceRefs: [],
        minTxId: `tx_${Date.now().toString(36)}_evt1`,
      },
      {
        id: `evt-${Date.now().toString(36)}-2`,
        type: 'verification',
        timestamp: new Date(Date.now() - 3 * MS_DAY).toISOString(),
        description: 'Community verification conducted. 5 members verified ecosystem state.',
        actor: 'Kijiji Conservation Group',
        evidenceRefs: [],
        minTxId: `tx_${Date.now().toString(36)}_evt2`,
      },
    ],
    verifications: [
      {
        id: `ver-${Date.now().toString(36)}-1`,
        passportId: `CP-${Date.now().toString(36).toUpperCase()}`,
        verifier: 'Maria Mwangi',
        verifierRole: 'Community Elder',
        timestamp: new Date(Date.now() - 3 * MS_DAY).toISOString(),
        status: 'verified',
        notes: 'Forest boundary intact. No signs of encroachment.',
        signature: `ver_sig_${Date.now().toString(36)}`,
      },
    ],
    auditTrail: [
      { timestamp: new Date(Date.now() - 90 * MS_DAY).toISOString(), action: 'Device Installed', actor: 'VEIN Sense Technician', minTxId: `tx_${Date.now().toString(36)}_a0`, details: `Station deployed at ${project.location}.` },
      { timestamp: new Date(Date.now() - 7 * MS_DAY).toISOString(), action: 'Calibration', actor: 'System', minTxId: `tx_${Date.now().toString(36)}_a1`, details: 'All sensors calibrated successfully.' },
      { timestamp: new Date(Date.now() - MS_DAY).toISOString(), action: 'Observation Batch Anchored', actor: 'VEIN Sense', minTxId: `tx_${Date.now().toString(36)}_a2`, details: '12 observations signed and anchored to Minima.' },
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 90 * MS_DAY).toISOString(),
  };
}

const SensorBadge: React.FC<{ type: SensorType }> = ({ type }) => {
  const info = sensorLabels[type];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
};

export const CarbonPassportComponent: React.FC = () => {
  const [projects] = useLocalStorage<CarbonProject[]>('carbonProjects', []);
  const [passports, setPassports] = useLocalStorage<CarbonPassport[]>('carbonPassports', []);
  const [activePassportId, setActivePassportId] = useLocalStorage<string | null>('passportActiveId', null);
  const [expandedDevice, setExpandedDevice] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [sensorFilter, setSensorFilter] = useLocalStorage<SensorType | 'all'>('passportSensorFilter', 'all');
  const [expandedObs, setExpandedObs] = React.useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useLocalStorage('passportShowAddEvent', false);
  const [showAddVerification, setShowAddVerification] = useLocalStorage('passportShowAddVerification', false);
  const [newEvent, setNewEvent] = useLocalStorage('passportNewEvent', { type: 'monitoring' as PassportEventType, description: '', actor: '' });
  const [newVerification, setNewVerification] = useLocalStorage('passportNewVerification', { verifier: '', verifierRole: '', notes: '', status: 'verified' as 'verified' | 'disputed' | 'pending' });
  const { addToast } = useToasts();
  const { t } = useI18n();

  const passport = React.useMemo(() => {
    if (activePassportId) return passports.find(p => p.id === activePassportId) || null;
    return passports[0] || null;
  }, [passports, activePassportId]);

  const filteredObservations = React.useMemo(() => {
    if (!passport) return [];
    if (sensorFilter === 'all') return passport.observations;
    return passport.observations.filter(o => o.sensorType === sensorFilter);
  }, [passport, sensorFilter]);

  const handleCreatePassport = () => {
    if (projects.length === 0) {
      addToast({ type: 'error', message: t('passport.noProjects') });
      return;
    }
    const mock = generateMockPassport(projects);
    if (!mock) {
      addToast({ type: 'error', message: t('passport.noProjects') });
      return;
    }
    const exists = passports.some(p => p.projectId === mock.projectId);
    if (exists) {
      addToast({ type: 'info', message: t('passport.projectHasPassport') });
      return;
    }
    setPassports([mock, ...passports]);
    setActivePassportId(mock.id);
    addToast({ type: 'success', message: t('passport.create.success') });
  };

  const handleDeletePassport = () => {
    if (!deleteTarget) return;
    const updated = passports.filter(p => p.id !== deleteTarget);
    setPassports(updated);
    if (activePassportId === deleteTarget) {
      setActivePassportId(updated[0]?.id || null);
    }
    setDeleteTarget(null);
    addToast({ type: 'info', message: t('passport.delete.success') });
  };

  const handleStatusChange = (newStatus: 'active' | 'pending' | 'archived') => {
    if (!passport) return;
    const updated = passports.map(p =>
      p.id === passport.id ? { ...p, status: newStatus, lastUpdated: new Date().toISOString() } : p
    );
    setPassports(updated);
    addToast({ type: 'success', message: t('passport.statusChanged') });
  };

  const handleRefreshObservations = () => {
    if (!passport) return;
    const newObs = generateObservations(passport.device.id, 4, 0);
    const updated = passports.map(p =>
      p.id === passport.id
        ? { ...p, observations: [...newObs, ...p.observations], lastUpdated: new Date().toISOString() }
        : p
    );
    setPassports(updated);
    addToast({ type: 'success', message: t('passport.refresh.success') });
  };

  const handleExportPassport = () => {
    if (!passport) return;
    const data = JSON.stringify(passport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-passport-${passport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'info', message: t('passport.export.success') });
  };

  const handleExportPdf = () => {
    if (!passport) return;
    const reportLines = [
      `Carbon Passport: ${passport.projectName}`,
      `Location: ${passport.ecosystemLocation}`,
      `Status: ${passport.status}`,
      `Total Sequestered: ${Math.round(passport.totalSequestered)} tCO₂`,
      `Created: ${new Date(passport.createdAt).toLocaleDateString()}`,
      '',
      'Boundary Coordinates:',
      ...passport.boundary.map((p, i) => `  ${i + 1}. ${p.latitude}, ${p.longitude}`),
      '',
      `Device: ${passport.device.name} (${passport.device.id})`,
      `Battery: ${passport.device.batteryLevel}%`,
      `Sensors: ${passport.device.sensors.join(', ')}`,
      '',
      `Observations: ${passport.observations.length} signed readings`,
      `Events: ${passport.events.length}`,
      `Verifications: ${passport.verifications.length}`,
      `Audit Trail: ${passport.auditTrail.length} entries`,
    ];
    const text = reportLines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-passport-${passport.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'info', message: t('passport.exportPdf.success') });
  };

  const handleAddEvent = () => {
    if (!passport || !newEvent.description.trim()) return;
    const event: PassportEvent = {
      id: `evt-${Date.now().toString(36)}`,
      type: newEvent.type,
      timestamp: new Date().toISOString(),
      description: newEvent.description.trim(),
      actor: newEvent.actor.trim() || 'Community Member',
      evidenceRefs: [],
      minTxId: `tx_${Date.now().toString(36)}`,
    };
    const updated = passports.map(p =>
      p.id === passport.id
        ? { ...p, events: [event, ...p.events], lastUpdated: new Date().toISOString() }
        : p
    );
    setPassports(updated);
    setNewEvent({ type: 'monitoring', description: '', actor: '' });
    setShowAddEvent(false);
    addToast({ type: 'success', message: t('passport.eventAdded') });
  };

  const handleAddVerification = () => {
    if (!passport || !newVerification.verifier.trim() || !newVerification.notes.trim()) return;
    const verification: CommunityVerification = {
      id: `ver-${Date.now().toString(36)}`,
      passportId: passport.id,
      verifier: newVerification.verifier.trim(),
      verifierRole: newVerification.verifierRole.trim() || 'Community Member',
      timestamp: new Date().toISOString(),
      status: newVerification.status,
      notes: newVerification.notes.trim(),
      signature: `ver_sig_${Date.now().toString(36)}`,
    };
    const updated = passports.map(p =>
      p.id === passport.id
        ? { ...p, verifications: [verification, ...p.verifications], lastUpdated: new Date().toISOString() }
        : p
    );
    setPassports(updated);
    setNewVerification({ verifier: '', verifierRole: '', notes: '', status: 'verified' });
    setShowAddVerification(false);
    addToast({ type: 'success', message: t('passport.verificationAdded') });
  };

  const isDeviceExpanded = expandedDevice === passport?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('passport.title')}</h2>
          <p className="text-sm text-slate-500">{t('passport.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCreatePassport}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
            {t('passport.create')}
          </button>
          {passport && (
            <>
              <button onClick={handleRefreshObservations}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                title={t('passport.refresh.tooltip')}>
                {t('passport.refresh')}
              </button>
              <button onClick={handleExportPassport}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400">
                {t('passport.export')}
              </button>
              <button onClick={handleExportPdf}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400">
                {t('passport.exportPdf')}
              </button>
              <button onClick={() => setDeleteTarget(passport.id)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400">
                {t('passport.delete')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Passport Selector — always visible when passports exist */}
      {passports.length > 0 && (
        <Card>
          <div className="p-3">
            <label className="block text-xs font-semibold text-slate-500 mb-2">{t('passport.selectPassport')}</label>
            <div className="flex flex-wrap gap-2">
              {passports.map(p => (
                <button key={p.id} onClick={() => { setActivePassportId(p.id); setSensorFilter('all'); setExpandedObs(null); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-500 ${
                    passport?.id === p.id ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {p.projectName}
                  <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-400' : p.status === 'pending' ? 'bg-yellow-400' : 'bg-slate-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!passport ? (
        <Card>
          <div className="p-12 text-center text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="font-semibold text-lg mb-2">{t('passport.empty.title')}</p>
            <p className="text-sm">{t('passport.empty.desc')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Passport Overview */}
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800">{passport.projectName}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[passport.status]}`}>{passport.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{t('passport.updated')}: {new Date(passport.lastUpdated).toLocaleDateString()}</span>
                <select
                  value={passport.status}
                  onChange={(e) => handleStatusChange(e.target.value as 'active' | 'pending' | 'archived')}
                  className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-green-500"
                  aria-label={t('passport.changeStatus')}
                >
                  <option value="active">{t('passport.status.active')}</option>
                  <option value="pending">{t('passport.status.pending')}</option>
                  <option value="archived">{t('passport.status.archived')}</option>
                </select>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.location')}</p>
                <p className="font-semibold text-slate-700">{passport.ecosystemLocation}</p>
                <p className="text-xs text-slate-400">{passport.boundary.length} {t('passport.boundary')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.sequestered')}</p>
                <p className="text-2xl font-bold text-brand-green-700">{Math.round(passport.totalSequestered)} tCO₂</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.created')}</p>
                <p className="font-semibold text-slate-700">{new Date(passport.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.deviceId')}</p>
                <p className="font-semibold text-slate-700">{passport.device.name}</p>
                <p className="text-xs text-slate-400">FW {passport.device.firmwareVersion}</p>
              </div>
            </div>
            {/* Quick stats bar */}
            <div className="px-4 pb-4 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{passport.observations.length}</span> {t('passport.observations').toLowerCase()}</span>
              <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{passport.edgeAiOutputs.length}</span> AI outputs</span>
              <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{passport.events.length}</span> events</span>
              <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{passport.verifications.length}</span> verifications</span>
              <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{passport.auditTrail.length}</span> audit entries</span>
            </div>
          </Card>

          {/* Boundary Coordinates */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.boundary.title')}</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {passport.boundary.map((point, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 flex items-center justify-center bg-brand-green-100 text-brand-green-700 rounded-full text-xs font-bold">{i + 1}</span>
                    <span className="text-slate-600">{t('passport.boundary.point')} {i + 1}:</span>
                    <span className="font-mono text-xs text-slate-700">{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* VEIN Sense Device */}
          <Card>
            <button
              onClick={() => setExpandedDevice(isDeviceExpanded ? null : passport.id)}
              className="w-full p-4 border-b border-slate-200 flex justify-between items-center hover:bg-slate-50 transition-colors"
              aria-expanded={isDeviceExpanded}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔬</span>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">{passport.device.name}</h3>
                  <p className="text-xs text-slate-500">{t('passport.deviceId')}: {passport.device.id} · FW {passport.device.firmwareVersion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[passport.device.calibrationStatus]}`}>{passport.device.calibrationStatus}</span>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${isDeviceExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </button>
            {isDeviceExpanded && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.battery')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full">
                        <div className={`h-2 rounded-full ${passport.device.batteryLevel > 50 ? 'bg-green-500' : passport.device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${passport.device.batteryLevel}%` }} />
                      </div>
                      <span className="text-sm font-semibold">{passport.device.batteryLevel}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.installed')}</p>
                    <p className="text-sm font-semibold">{new Date(passport.device.installedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.lastCalibration')}</p>
                    <p className="text-sm font-semibold">{new Date(passport.device.lastCalibration).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.coordinates')}</p>
                    <p className="text-xs font-semibold">{passport.device.location.latitude.toFixed(4)}, {passport.device.location.longitude.toFixed(4)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{t('passport.sensors')}</p>
                  <div className="flex flex-wrap gap-2">
                    {passport.device.sensors.map(s => <SensorBadge key={s} type={s} />)}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Observations */}
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">{t('passport.observations')}</h3>
                <p className="text-xs text-slate-500">{filteredObservations.length} {t('passport.signedReadings')}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSensorFilter('all')}
                  className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors ${
                    sensorFilter === 'all' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {t('passport.filter.all')}
                </button>
                {passport.device.sensors.map(s => (
                  <button
                    key={s}
                    onClick={() => setSensorFilter(s)}
                    className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors ${
                      sensorFilter === s ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {sensorLabels[s].icon} {sensorLabels[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredObservations.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 italic">{t('passport.noObservations')}</p>
              ) : (
                filteredObservations.slice().reverse().map(obs => {
                  const info = sensorLabels[obs.sensorType];
                  const isExpanded = expandedObs === obs.id;
                  return (
                    <div key={obs.id}>
                      <button
                        onClick={() => setExpandedObs(isExpanded ? null : obs.id)}
                        className="w-full p-3 flex justify-between items-center hover:bg-slate-50 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{info.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{info.label}</p>
                            <p className="text-xs text-slate-400">{new Date(obs.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{obs.value} {obs.unit}</p>
                            {obs.minTxId && <p className="text-[10px] text-brand-green-600 font-mono">✓ {t('passport.anchored')}</p>}
                          </div>
                          <svg className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 bg-slate-50 text-xs space-y-1 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-slate-500">ID: <span className="font-mono text-slate-700">{obs.id}</span></span>
                            <span className="text-slate-500">Device: <span className="font-mono text-slate-700">{obs.deviceId}</span></span>
                            <span className="text-slate-500">Signature: <span className="font-mono text-slate-700 truncate">{obs.signature}</span></span>
                            {obs.minTxId && <span className="text-slate-500">TxID: <span className="font-mono text-brand-green-600">{obs.minTxId}</span></span>}
                            {obs.minAnchoredAt && <span className="text-slate-500">Anchored: <span className="text-slate-700">{new Date(obs.minAnchoredAt).toLocaleString()}</span></span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Edge AI Outputs */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.edgeAi')}</h3>
            </div>
            {passport.edgeAiOutputs.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 italic">{t('passport.noEdgeAi')}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {passport.edgeAiOutputs.map(ai => (
                  <div key={ai.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{ai.modelName}</p>
                        <p className="text-xs text-slate-400">{new Date(ai.inferenceTimestamp).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{(ai.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-slate-600">{ai.result}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(ai.metrics).map(([k, v]) => (
                        <span key={k} className="text-xs bg-slate-50 px-2 py-0.5 rounded text-slate-600">{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Event Log */}
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{t('passport.events')}</h3>
              <button onClick={() => setShowAddEvent(!showAddEvent)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100 transition-colors">
                {showAddEvent ? t('passport.cancel') : t('passport.addEvent')}
              </button>
            </div>
            {showAddEvent && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('passport.eventType')}</label>
                    <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as PassportEventType })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                      {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('passport.eventDescription')}</label>
                    <input type="text" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder={t('passport.eventDescription.placeholder')}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="text" value={newEvent.actor} onChange={e => setNewEvent({ ...newEvent, actor: e.target.value })}
                    placeholder={t('passport.eventActor.placeholder')}
                    className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  <button onClick={handleAddEvent} disabled={!newEvent.description.trim()}
                    className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {t('passport.save')}
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {passport.events.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 italic">{t('passport.noEvents')}</p>
              ) : (
                passport.events.slice().reverse().map(evt => (
                  <div key={evt.id} className="p-3 flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{eventIcons[evt.type] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-slate-700">{evt.description}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{new Date(evt.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500">{evt.actor}</p>
                      {evt.minTxId && <p className="text-[10px] text-brand-green-600 font-mono">✓ {evt.minTxId}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Community Verification */}
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{t('passport.verifications')}</h3>
              <button onClick={() => setShowAddVerification(!showAddVerification)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100 transition-colors">
                {showAddVerification ? t('passport.cancel') : t('passport.addVerification')}
              </button>
            </div>
            {showAddVerification && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('passport.verifierName')}</label>
                    <input type="text" value={newVerification.verifier} onChange={e => setNewVerification({ ...newVerification, verifier: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('passport.verifierRole')}</label>
                    <input type="text" value={newVerification.verifierRole} onChange={e => setNewVerification({ ...newVerification, verifierRole: e.target.value })}
                      placeholder={t('passport.verifierRole.placeholder')}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('passport.verificationNotes')}</label>
                  <textarea value={newVerification.notes} onChange={e => setNewVerification({ ...newVerification, notes: e.target.value })}
                    rows={2}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                </div>
                <div className="flex items-center gap-3">
                  <select value={newVerification.status} onChange={e => setNewVerification({ ...newVerification, status: e.target.value as 'verified' | 'disputed' | 'pending' })}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                    <option value="verified">{t('passport.status.verified')}</option>
                    <option value="pending">{t('passport.status.pending')}</option>
                    <option value="disputed">{t('passport.status.disputed')}</option>
                  </select>
                  <button onClick={handleAddVerification} disabled={!newVerification.verifier.trim() || !newVerification.notes.trim()}
                    className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {t('passport.save')}
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {passport.verifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 italic">{t('passport.noVerifications')}</p>
              ) : (
                passport.verifications.map(v => (
                  <div key={v.id} className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{v.verifier}</p>
                        <p className="text-xs text-slate-500">{v.verifierRole}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[v.status]}`}>{v.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{v.notes}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(v.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Audit Trail */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.auditTrail')}</h3>
            </div>
            {passport.auditTrail.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 italic">{t('passport.noAuditTrail')}</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="p-2 text-left">{t('passport.date')}</th>
                      <th className="p-2 text-left">{t('passport.action')}</th>
                      <th className="p-2 text-left">{t('passport.actor')}</th>
                      <th className="p-2 text-left hidden md:table-cell">{t('passport.details')}</th>
                      <th className="p-2 text-left">Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passport.auditTrail.slice().reverse().map((entry, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-xs text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</td>
                        <td className="p-2 font-medium text-slate-700">{entry.action}</td>
                        <td className="p-2 text-xs text-slate-500">{entry.actor}</td>
                        <td className="p-2 text-xs text-slate-500 hidden md:table-cell">{entry.details}</td>
                        <td className="p-2"><span className="text-[10px] text-brand-green-600 font-mono">✓</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('passport.delete.title')}
        message={t('passport.delete.message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleDeletePassport}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
