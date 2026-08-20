import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FlightIcon from '@mui/icons-material/Flight';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import SyncIcon from '@mui/icons-material/Sync';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HistoryIcon from '@mui/icons-material/History';
import { getDjiConnection, getDjiDevices, importFlightDataFromFile } from '../../services/djiMissionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

const DJI_SMARTFARM_URL = 'https://www.djiag.com/za/login';

const connectionStatusConfig = {
  not_connected: { color: '#64748B', bg: 'rgba(100,116,139,0.08)', label: 'Not Connected', icon: RadioButtonUncheckedIcon },
  not_configured: { color: '#64748B', bg: 'rgba(100,116,139,0.08)', label: 'Integration Not Configured', icon: RadioButtonUncheckedIcon },
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
 * Primary workflow: FlyBy → Sync → DJI SmartFarm → T50 → Flight Data → FlyBy
 * Fallback: Import/Export when official integration isn't configured.
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

  const handleOpenSmartFarm = () => {
    window.open(DJI_SMARTFARM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleConnectClick = () => {
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
      {/* DJI SMARTFARM CONNECTION                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px', mb: 3, border: `1px solid ${isConnected ? 'rgba(22,163,74,0.2)' : 'rgba(15,23,42,0.06)'}` }}>
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

        {/* Not Connected — primary CTA is Connect */}
        {!isConnected && (
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
            Connect your DJI SmartFarm to sync missions directly from FlyBy to your T50 remote controller, and automatically receive flight data after every operation.
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {isConnected ? (
            <Button variant="contained" size="small" startIcon={<SyncIcon />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Sync Now
            </Button>
          ) : (
            <Button variant="contained" size="small" startIcon={<LinkIcon />} onClick={handleConnectClick} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Connect DJI SmartFarm
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}
          >
            {importing ? 'Importing...' : 'Import Flight Data'}
          </Button>
          <input ref={fileRef} type="file" hidden accept=".json,.csv" onChange={handleImportFlightData} />
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FLYBY FLEET AIRCRAFT                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Fleet Aircraft
          </Typography>
          <Chip label="FlyBy Fleet" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(37,99,235,0.08)', color: '#2563EB' }} />
        </Box>

        {fleetAircraft.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <AirplanemodeActiveIcon sx={{ fontSize: '1.5rem', color: 'text.tertiary', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>
              No DJI aircraft registered in Fleet. Register your T50 in Fleet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {fleetAircraft.map(ac => {
              const linkedDevice = devices.find(d => d.aircraft_id === ac.id);
              return (
                <Box key={ac.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '10px', border: '1px solid rgba(15,23,42,0.06)' }}>
                  <AirplanemodeActiveIcon sx={{ fontSize: '1.3rem', color: '#2563EB' }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{ac.aircraft_name}</Typography>
                      <Chip label="✓ Registered" size="small" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
                      {[ac.manufacturer, ac.model].filter(Boolean).join(' ')} {ac.serial_number ? `• S/N: ${ac.serial_number}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={ac.status} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: ac.status === 'Ready' ? 'rgba(22,163,74,0.08)' : 'rgba(100,116,139,0.08)', color: ac.status === 'Ready' ? '#16A34A' : '#64748B' }} />
                    {linkedDevice && <Typography sx={{ fontSize: '0.6rem', color: '#16A34A', fontWeight: 600, mt: 0.5 }}>DJI Linked</Typography>}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DJI SMARTFARM STATUS                                          */}
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

        {devices.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {devices.map(d => {
              const linkedFleet = fleetAircraft.find(ac => ac.id === d.aircraft_id);
              return (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '10px', border: `1px solid ${linkedFleet ? 'rgba(22,163,74,0.15)' : 'rgba(217,119,6,0.15)'}` }}>
                  <FlightIcon sx={{ fontSize: '1.1rem', color: linkedFleet ? '#16A34A' : '#D97706' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.manufacturer} {d.model || 'Aircraft'}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                      {d.serial_number ? `S/N: ${d.serial_number}` : ''} {d.remote_controller ? `• Remote: ${d.remote_controller}` : ''}
                    </Typography>
                  </Box>
                  {linkedFleet ? (
                    <Chip label={`✓ Linked: ${linkedFleet.aircraft_name}`} size="small" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
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
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>
            {isConnected ? 'No aircraft discovered from SmartFarm yet.' : 'Aircraft will appear here when SmartFarm is connected.'}
          </Typography>
        )}
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TARGET WORKFLOW                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Workflow
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { step: '1', label: 'Plan in FlyBy', desc: 'Map field, create route, configure mission', status: 'available' },
            { step: '2', label: 'Sync to DJI SmartFarm', desc: 'Push mission to your T50 remote', status: isConnected ? 'available' : 'requires_connection' },
            { step: '3', label: 'Fly with T50', desc: 'Execute the operation next morning', status: 'available' },
            { step: '4', label: 'Flight data syncs back', desc: 'SmartFarm sends actual data to FlyBy', status: isConnected ? 'available' : 'requires_connection' },
            { step: '5', label: 'Report, Invoice, Profit', desc: 'Automatically generated from actual flight data', status: 'available' },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '8px', bgcolor: item.status === 'available' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: item.status === 'available' ? '#16A34A' : '#D97706' }}>{item.step}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{item.desc}</Typography>
              </Box>
              {item.status !== 'available' && (
                <Chip label="Requires Connection" size="small" sx={{ height: 16, fontSize: '0.45rem', fontWeight: 700, bgcolor: 'rgba(217,119,6,0.06)', color: '#D97706' }} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CAPABILITIES                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Capabilities
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            { label: 'Mission Planning', available: true },
            { label: 'Field & Route Preparation', available: true },
            { label: 'Sync Mission to SmartFarm', available: isConnected },
            { label: 'Receive Flight Data', available: isConnected },
            { label: 'Import Flight Data (fallback)', available: true },
            { label: 'Auto Mission Matching', available: true },
            { label: 'Application / Litre Tracking', available: true },
          ].map((cap, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: cap.available ? 'text.primary' : 'text.tertiary' }}>{cap.label}</Typography>
              <Chip
                label={cap.available ? 'Available' : 'Connect SmartFarm'}
                size="small"
                sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: cap.available ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.06)', color: cap.available ? '#16A34A' : '#D97706' }}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Future Placeholders */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['OAuth Integration', 'Live Telemetry', 'Automatic Flight Sync', 'Battery Analytics', 'Firmware Updates'].map(item => (
          <Chip key={item} label={item} size="small" variant="outlined" disabled sx={{ fontSize: '0.6rem', borderColor: 'rgba(15,23,42,0.08)' }} />
        ))}
      </Box>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONNECT DIALOG                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Connect DJI SmartFarm</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ borderRadius: '10px', mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Official DJI SmartFarm integration is not yet configured for this FlyBy environment.
            </Typography>
          </Alert>

          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
            When official DJI SmartFarm API access is available, FlyBy will connect directly to your SmartFarm account. This will enable:
          </Typography>

          <Box sx={{ pl: 2, mb: 2.5 }}>
            {[
              'Automatic mission sync from FlyBy to your T50 remote',
              'Flight data automatically returned after operations',
              'Aircraft and battery discovery',
              'No manual file export/import needed',
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: '0.8rem', color: '#16A34A' }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{item}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>In the meantime</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.6 }}>
            You can plan missions in FlyBy and use the Import Flight Data button to bring DJI/SmartFarm flight records into FlyBy after your operations. This lets you generate reports, invoices, and track profitability with actual flight data.
          </Typography>
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
            Open SmartFarm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
