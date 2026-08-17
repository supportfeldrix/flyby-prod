import { Box, Typography, Chip, IconButton, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const statusStyles = {
  Ready: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Maintenance: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  Offline: { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
  Retired: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

function getWarnings(aircraft) {
  const warnings = [];
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (aircraft.next_service_date && new Date(aircraft.next_service_date) < today) {
    warnings.push('Service overdue');
  }
  if (aircraft.insurance_expiry && new Date(aircraft.insurance_expiry) < thirtyDaysFromNow) {
    warnings.push(new Date(aircraft.insurance_expiry) < today ? 'Insurance expired' : 'Insurance expiring soon');
  }
  return warnings;
}

export default function AircraftCard({ aircraft, onEdit, onDelete, onView }) {
  const style = statusStyles[aircraft.status] || statusStyles.Ready;
  const warnings = getWarnings(aircraft);

  return (
    <Paper sx={{ overflow: 'hidden', bgcolor: '#FFFFFF', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Photo */}
      <Box sx={{ height: 140, bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {aircraft.photo_url ? (
          <Box component="img" src={aircraft.photo_url} alt={aircraft.aircraft_name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <AirplanemodeActiveIcon sx={{ fontSize: '3rem', color: 'rgba(15, 23, 42, 0.1)' }} />
        )}
        <Chip
          label={aircraft.status}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.65rem', height: 22, backdropFilter: 'blur(4px)' }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }} noWrap>{aircraft.aircraft_name}</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{aircraft.manufacturer} {aircraft.model}</Typography>
          </Box>
        </Box>

        {/* Details grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, flex: 1 }}>
          {aircraft.registration_number && (
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Registration</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{aircraft.registration_number}</Typography>
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Flight Hours</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{aircraft.flight_hours || 0}h</Typography>
          </Box>
          {aircraft.firmware_version && (
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Firmware</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{aircraft.firmware_version}</Typography>
            </Box>
          )}
          {aircraft.next_service_date && (
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Next Service</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{new Date(aircraft.next_service_date).toLocaleDateString('en-ZA')}</Typography>
            </Box>
          )}
        </Box>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {warnings.map((w, i) => (
              <Chip key={i} icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />} label={w} size="small"
                sx={{ fontSize: '0.6rem', height: 20, bgcolor: 'rgba(245, 158, 11, 0.08)', color: 'warning.dark', fontWeight: 600, '& .MuiChip-icon': { color: 'warning.dark' } }} />
            ))}
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, pt: 1, borderTop: '1px solid rgba(15, 23, 42, 0.04)' }}>
          <IconButton size="small" onClick={() => onView(aircraft)} sx={{ color: 'text.secondary' }}><VisibilityIcon sx={{ fontSize: '1rem' }} /></IconButton>
          <IconButton size="small" onClick={() => onEdit(aircraft)}><EditIcon sx={{ fontSize: '1rem' }} /></IconButton>
          <IconButton size="small" onClick={() => onDelete(aircraft)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
