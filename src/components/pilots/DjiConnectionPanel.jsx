import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FlightIcon from '@mui/icons-material/Flight';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import SyncIcon from '@mui/icons-material/Sync';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getDjiConnection, getDjiDevices, importFlightDataFromFile } from '../../services/djiMissionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

const DJI_SMARTFARM_URL = 'https://www.djiag.com/za/login';

const connectionStatusConfig = {
  not_connected: { color: '#64748B', bg: 'rgba(100,116,139,0.08)', label: 'Not Connected', icon: RadioButtonUncheckedIcon },
  not_configured: { color: '#64748B', bg: 'rgba(100,116,139,0.08)', label: 'Not Connected', icon: RadioButtonUncheckedIcon },
  connecting: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Connecting', icon: SyncIcon },
  pending: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Pending', icon: SyncIcon },
  connected: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', label: 'Connected', icon: CheckCircleIcon },
  syncing: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)', label: 'Syncing', icon: SyncIcon },
  synced: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', label: 'Synced', icon: CheckCircleIcon },
  import_required: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Import Required', icon: CloudUploadIcon },
  error: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Error', icon: WarningAmberIcon },
  disconnected: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Disconnected', icon: LinkOffIcon },
};

/**
 * DJI SmartFarm Connection Centre — Pilot Profile → Drone Data
 * 
 * Clearly separates:
 * 1. FlyBy Fleet aircraft (what the company owns)
 * 2. DJI SmartFarm connection (pilot's DJI environment)
 * 3. DJI-discovered aircraft (from official integration)
 * 4. Link between DJI aircraft and FlyBy Fleet aircraft
 */
export default function DjiConnectionPanel({ pilot }) {
  const { company } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [connection, setConnection] = useState(null);
  const [devices, setDevices] = useState([]);
  const [fleetAircraft, setFleetAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  useEffect(() => {
    if (!pilot?.id || !company?.id) return;
    setLoading(true);
    Promise.all([
      getDjiConnection(pilot.id).catch(() => null),
      getDjiDevices(company.id).catch(() => []),
      // Get Fleet aircraft (DJI manufacturer) to show in the panel
      supabase.from('aircraft').select('id, aircraft_name, manufacturer, model, serial_number, registration_number, status')
        .eq('company_id', company.id).eq('is_active', true)
        .ilike('manufacturer', '%DJI%')
        .then(({ data }) => data || []).catch(() => []),
    ]).then(([conn, devs, fleet]) => {
      setConnection(conn);
      setDevices(devs || []);
      setFleetAircraft(fleet);
    }).finally(() => setLoading(false));
  }, [pilot?.id, company?.id]);

  const connStatus = connection?.connection_status || 'not_connected';
  const isConnected = connStatus === 'connected' || connStatus === 'synced';
  const config = connectionStatusConfig[connStatus] || connectionStatusConfig.not_connected;
  const StatusIcon = config.icon;

  // Check if any DJI device is linked to a Fleet aircraft
  const linkedDevices = devices.filter(d => d.aircraft_id);
  const unlinkedDevices = devices.filter(d => !d.aircraft_id);

  const handleOpenSmartFarm = () => {
    window.open(DJI_SMARTFARM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleConnectClick = () => {
    // Check if official DJI OAuth is configured
    // Since it's not currently available for T50, show explanation dialog
    setConnectDialogOpen(true);
  };

  const handleImportFlightData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importFlightDataFromFile(file, company.id, pilot.id, null);
      showToast('Flight data imported successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: DJI SMARTFARM CONNECTION                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px', mb: 3, border: `1px solid ${isConnected ? 'rgba(22,163,74,0.2)' : 'rgba(15,23,42,0.06)'}` }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StatusIcon sx={{ fontSize: '1.3rem', color: config.color }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>DJI SmartFarm</Typography>
              <Chip label={config.label} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: config.bg, color: config.color, mt: 0.25 }} />
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenSmartFarm}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}
          >
            Open SmartFarm
          </Button>
        </Box>

        {/* Connected State */}
        {isConnected && (
          <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'rgba(22,163,74,0.03)', border: '1px solid rgba(22,163,74,0.1)', mb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {connection?.last_sync_at && (
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Last Sync</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {new Date(connection.last_sync_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Provider</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>DJI SmartFarm</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#16A34A' }}>Active</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Not Connected — explanation */}
        {!isConnected && (
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
            Connect your DJI SmartFarm environment to FlyBy to prepare missions and bring flight data back into FlyBy when supported.
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {isConnected && (
            <Button variant="contained" size="small" startIcon={<SyncIcon />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Sync Data
            </Button>
          )}
          <Button
            variant={isConnected ? 'outlined' : 'contained'}
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', ...(isConnected ? { borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' } : {}) }}
          >
            {importing ? 'Importing...' : 'Import Flight Data'}
          </Button>
          <input ref={fileRef} type="file" hidden accept=".json,.csv" onChange={handleImportFlightData} />
          {!isConnected && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LinkIcon />}
              onClick={handleConnectClick}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}
            >
              Connect DJI / SmartFarm
            </Button>
          )}
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: FLYBY FLEET AIRCRAFT                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            FlyBy Fleet Aircraft
          </Typography>
          <Chip label="Fleet" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(37,99,235,0.08)', color: '#2563EB' }} />
        </Box>

        {fleetAircraft.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <AirplanemodeActiveIcon sx={{ fontSize: '1.5rem', color: 'text.tertiary', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>
              No DJI aircraft registered in Fleet. Register your T50 in the Fleet module.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {fleetAircraft.map(ac => {
              // Check if this Fleet aircraft is linked to a DJI device
              const linkedDevice = devices.find(d => d.aircraft_id === ac.id);
              return (
                <Box key={ac.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '10px', border: '1px solid rgba(15,23,42,0.06)', bgcolor: linkedDevice ? 'rgba(22,163,74,0.02)' : 'transparent' }}>
                  <AirplanemodeActiveIcon sx={{ fontSize: '1.3rem', color: '#2563EB' }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{ac.aircraft_name}</Typography>
                      <Chip label="✓ Registered" size="small" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
                      {[ac.manufacturer, ac.model].filter(Boolean).join(' ')} {ac.serial_number ? `• S/N: ${ac.serial_number}` : ''} {ac.registration_number ? `• Reg: ${ac.registration_number}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={ac.status}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.55rem', fontWeight: 700,
                        bgcolor: ac.status === 'Ready' ? 'rgba(22,163,74,0.08)' : 'rgba(100,116,139,0.08)',
                        color: ac.status === 'Ready' ? '#16A34A' : '#64748B',
                      }}
                    />
                    {linkedDevice && (
                      <Typography sx={{ fontSize: '0.6rem', color: '#16A34A', fontWeight: 600, mt: 0.5 }}>DJI Linked ✓</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: DJI SMARTFARM STATUS                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            DJI SmartFarm
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Not Connected'}
            size="small"
            sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: isConnected ? 'rgba(22,163,74,0.08)' : 'rgba(100,116,139,0.06)', color: isConnected ? '#16A34A' : '#94A3B8' }}
          />
        </Box>

        {/* DJI Discovered Aircraft */}
        {devices.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {devices.map(d => {
              const linkedFleet = fleetAircraft.find(ac => ac.id === d.aircraft_id);
              return (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '10px', border: `1px solid ${linkedFleet ? 'rgba(22,163,74,0.15)' : 'rgba(217,119,6,0.15)'}`, bgcolor: linkedFleet ? 'rgba(22,163,74,0.02)' : 'rgba(217,119,6,0.02)' }}>
                  <FlightIcon sx={{ fontSize: '1.1rem', color: linkedFleet ? '#16A34A' : '#D97706' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.manufacturer} {d.model || 'Aircraft'}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                      {d.serial_number ? `S/N: ${d.serial_number}` : 'No serial'} {d.remote_controller ? `• Remote: ${d.remote_controller}` : ''}
                    </Typography>
                  </Box>
                  {linkedFleet ? (
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label="✓ Linked to Fleet" size="small" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', mt: 0.25 }}>{linkedFleet.aircraft_name}</Typography>
                    </Box>
                  ) : (
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, borderRadius: '8px', borderColor: 'rgba(217,119,6,0.3)', color: '#D97706' }}>
                      Link to Fleet
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.04)' }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>
              {isConnected ? 'No DJI aircraft discovered yet.' : 'DJI aircraft will appear here when SmartFarm is connected.'}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
              Your Fleet aircraft above can still be used for FlyBy missions without a DJI connection.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: WORKFLOW GUIDE                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          How It Works
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { step: '1', label: 'Plan in FlyBy', desc: 'Map field, create route, assign aircraft & pilot' },
            { step: '2', label: 'Export Field to SmartFarm', desc: 'Prepare field/route package for your T50' },
            { step: '3', label: 'Import in SmartFarm', desc: 'Complete the DJI SmartFarm import/share workflow' },
            { step: '4', label: 'Fly with T50', desc: 'Execute the operation with your DJI remote' },
            { step: '5', label: 'Import Flight Data', desc: 'Sync or import actual flight records back to FlyBy' },
            { step: '6', label: 'Report & Invoice', desc: 'Generate mission report and invoice with real data' },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '8px', bgcolor: 'rgba(22,163,74,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#16A34A' }}>{item.step}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{item.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: CAPABILITIES                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Capabilities
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            { label: 'Field & Route Export', available: true },
            { label: 'Import Flight Records', available: true },
            { label: 'Mission Matching', available: true },
            { label: 'Application / Litre Data', available: true },
            { label: 'Direct Route Sync to T50', available: false },
            { label: 'Live Flight Telemetry', available: false },
            { label: 'Automatic Flight Sync', available: false },
          ].map((cap, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: cap.available ? 'text.primary' : 'text.tertiary' }}>{cap.label}</Typography>
              <Chip
                label={cap.available ? 'Available' : 'Requires DJI API'}
                size="small"
                sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: cap.available ? 'rgba(22,163,74,0.08)' : 'rgba(148,163,184,0.06)', color: cap.available ? '#16A34A' : '#94A3B8' }}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Future Placeholders */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['OAuth Integration', 'Live Telemetry', 'Flight History Sync', 'Battery Analytics', 'Firmware Updates', 'FlightHub 2'].map(item => (
          <Chip key={item} label={item} size="small" variant="outlined" disabled sx={{ fontSize: '0.6rem', borderColor: 'rgba(15,23,42,0.08)' }} />
        ))}
      </Box>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONNECT DIALOG                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>DJI SmartFarm Connection</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
            Direct DJI SmartFarm synchronization is not currently configured for this FlyBy environment.
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
            Your DJI SmartFarm account remains managed through DJI's official environment.
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
            FlyBy can currently prepare fields and missions and import/export flight data using the supported workflow:
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            {[
              'Map fields and create spray routes in FlyBy',
              'Export prepared fields to SmartFarm',
              'Fly missions using your DJI remote controller',
              'Import flight data back into FlyBy after missions',
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: '0.8rem', color: '#16A34A' }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{item}</Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="info" sx={{ borderRadius: '10px' }}>
            <Typography sx={{ fontSize: '0.75rem' }}>
              When official DJI SmartFarm API access becomes available for the Agras T50, FlyBy will support direct connection and automatic synchronization through this screen.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, display: 'flex', gap: 1 }}>
          <Button onClick={() => setConnectDialogOpen(false)} sx={{ color: 'text.secondary' }}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => { setConnectDialogOpen(false); fileRef.current?.click(); }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}
          >
            Import Flight Data
          </Button>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={() => { setConnectDialogOpen(false); handleOpenSmartFarm(); }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Open DJI SmartFarm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
