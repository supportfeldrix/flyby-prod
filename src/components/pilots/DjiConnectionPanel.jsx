import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FlightIcon from '@mui/icons-material/Flight';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getDjiConnection, getDjiDevices } from '../../services/djiMissionService';
import { useAuth } from '../../hooks/useAuth';

const statusConfig = {
  not_configured: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', label: 'Not Configured', icon: LinkOffIcon },
  pending: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Pending', icon: SyncIcon },
  connected: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', label: 'Connected', icon: LinkIcon },
  disconnected: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Disconnected', icon: LinkOffIcon },
  error: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Error', icon: WarningAmberIcon },
};

/**
 * DJI/SmartFarm connection panel for Pilot Profile → Drone Data tab.
 * Shows connection status, discovered devices, and import options.
 */
export default function DjiConnectionPanel({ pilot }) {
  const { company } = useAuth();
  const [connection, setConnection] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pilot?.id || !company?.id) return;
    setLoading(true);
    Promise.all([
      getDjiConnection(pilot.id).catch(() => null),
      getDjiDevices(company.id).catch(() => []),
    ]).then(([conn, devs]) => {
      setConnection(conn);
      setDevices(devs || []);
    }).finally(() => setLoading(false));
  }, [pilot?.id, company?.id]);

  const status = connection?.connection_status || 'not_configured';
  const config = statusConfig[status] || statusConfig.not_configured;
  const StatusIcon = config.icon;

  return (
    <Box>
      {/* Connection Status */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StatusIcon sx={{ fontSize: '1.1rem', color: config.color }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>DJI / SmartFarm</Typography>
              <Chip label={config.label} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: config.bg, color: config.color }} />
            </Box>
          </Box>
        </Box>

        {/* Not Configured Message */}
        {status === 'not_configured' && (
          <Alert severity="info" sx={{ borderRadius: '10px', mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5 }}>
              Direct DJI synchronization is not currently configured for this aircraft.
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              DJI SmartFarm API access for the Agras T50 requires official DJI developer integration. Use file import/export in the meantime.
            </Typography>
          </Alert>
        )}

        {/* Connection details */}
        {connection?.last_sync_at && (
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Last Sync</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {new Date(connection.last_sync_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Provider</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{connection.provider === 'dji_smartfarm' ? 'DJI SmartFarm' : 'DJI'}</Typography>
            </Box>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(15,23,42,0.12)' }}
          >
            Import Flight Data
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled
            startIcon={<LinkIcon />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(15,23,42,0.08)', opacity: 0.5 }}
          >
            Connect DJI / SmartFarm
          </Button>
        </Box>
      </Paper>

      {/* Discovered Devices */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Connected Aircraft
        </Typography>
        {devices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <FlightIcon sx={{ fontSize: '1.5rem', color: 'text.tertiary', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>
              No DJI devices discovered. Register aircraft in Fleet or connect DJI when available.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {devices.map(d => (
              <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '10px', border: '1px solid rgba(15,23,42,0.06)' }}>
                <FlightIcon sx={{ fontSize: '1rem', color: '#2563EB' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.model || 'DJI Aircraft'}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                    {d.serial_number || '—'} {d.aircraft?.aircraft_name ? `• Linked: ${d.aircraft.aircraft_name}` : ''}
                  </Typography>
                </Box>
                <Chip
                  label={d.connection_status || 'unknown'}
                  size="small"
                  sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: d.connection_status === 'online' ? 'rgba(22,163,74,0.08)' : 'rgba(148,163,184,0.08)', color: d.connection_status === 'online' ? '#16A34A' : '#94A3B8' }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Available Data */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Available Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { label: 'Import Flight Records', desc: 'Upload DJI/SmartFarm flight data', available: true },
            { label: 'Export/Import Routes', desc: 'Transfer routes via file', available: true },
            { label: 'Live Flight Data Sync', desc: 'Requires DJI API access', available: false },
            { label: 'Device Discovery', desc: 'Requires DJI connection', available: false },
            { label: 'Route Push to Remote', desc: 'Requires DJI SmartFarm integration', available: false },
          ].map((action, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: action.available ? 'text.primary' : 'text.tertiary' }}>{action.label}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{action.desc}</Typography>
              </Box>
              <Chip
                label={action.available ? 'Available' : 'Not Connected'}
                size="small"
                sx={{ height: 18, fontSize: '0.5rem', fontWeight: 700, bgcolor: action.available ? 'rgba(22,163,74,0.08)' : 'rgba(148,163,184,0.06)', color: action.available ? '#16A34A' : '#94A3B8' }}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Future Placeholders */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['OAuth Integration', 'Live Telemetry', 'Flight History Sync', 'Battery Analytics', 'Firmware Updates'].map(item => (
          <Chip key={item} label={item} size="small" variant="outlined" disabled sx={{ fontSize: '0.6rem', borderColor: 'rgba(15,23,42,0.08)' }} />
        ))}
      </Box>
    </Box>
  );
}
