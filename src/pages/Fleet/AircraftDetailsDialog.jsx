import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip, Divider, Grid } from '@mui/material';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const statusStyles = {
  Ready: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Maintenance: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  Offline: { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
  Retired: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

export default function AircraftDetailsDialog({ open, onClose, aircraft, onEdit }) {
  if (!aircraft) return null;
  const style = statusStyles[aircraft.status] || statusStyles.Ready;

  const today = new Date();
  const warnings = [];
  if (aircraft.next_service_date && new Date(aircraft.next_service_date) < today) warnings.push('Service overdue');
  if (aircraft.insurance_expiry) {
    const exp = new Date(aircraft.insurance_expiry);
    if (exp < today) warnings.push('Insurance expired');
    else if (exp < new Date(today.getTime() + 30 * 86400000)) warnings.push('Insurance expiring soon');
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 2 }}>
        {aircraft.aircraft_name}
        <Chip label={aircraft.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.7rem' }} />
      </DialogTitle>
      <DialogContent>
        {/* Photo */}
        <Box sx={{ height: 180, borderRadius: '12px', bgcolor: '#F1F5F9', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {aircraft.photo_url ? (
            <Box component="img" src={aircraft.photo_url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <AirplanemodeActiveIcon sx={{ fontSize: '4rem', color: 'rgba(15,23,42,0.08)' }} />
          )}
        </Box>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {warnings.map((w, i) => (
              <Chip key={i} icon={<WarningAmberIcon sx={{ fontSize: '0.75rem' }} />} label={w} size="small"
                sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: 'warning.dark', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: 'warning.dark' } }} />
            ))}
          </Box>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={6}><DetailRow label="Manufacturer" value={aircraft.manufacturer} /></Grid>
          <Grid item xs={6}><DetailRow label="Model" value={aircraft.model} /></Grid>
          <Grid item xs={6}><DetailRow label="Serial Number" value={aircraft.serial_number} /></Grid>
          <Grid item xs={6}><DetailRow label="Registration" value={aircraft.registration_number} /></Grid>
          <Grid item xs={6}><DetailRow label="Type" value={aircraft.aircraft_type} /></Grid>
          <Grid item xs={6}><DetailRow label="Firmware" value={aircraft.firmware_version} /></Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Grid container spacing={2.5}>
          <Grid item xs={4}><DetailRow label="Flight Hours" value={`${aircraft.flight_hours || 0}h`} /></Grid>
          <Grid item xs={4}><DetailRow label="Total Missions" value={aircraft.total_missions || 0} /></Grid>
          <Grid item xs={4}><DetailRow label="Hectares Sprayed" value={`${aircraft.total_hectares || 0} ha`} /></Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Grid container spacing={2.5}>
          <Grid item xs={6}><DetailRow label="Last Flight" value={aircraft.last_flight_date ? new Date(aircraft.last_flight_date).toLocaleDateString('en-ZA') : 'Never'} /></Grid>
          <Grid item xs={6}><DetailRow label="Last Service" value={aircraft.last_service_date ? new Date(aircraft.last_service_date).toLocaleDateString('en-ZA') : 'Not recorded'} /></Grid>
          <Grid item xs={6}><DetailRow label="Next Service" value={aircraft.next_service_date ? new Date(aircraft.next_service_date).toLocaleDateString('en-ZA') : 'Not scheduled'} /></Grid>
          <Grid item xs={6}><DetailRow label="Insurance Expiry" value={aircraft.insurance_expiry ? new Date(aircraft.insurance_expiry).toLocaleDateString('en-ZA') : 'Not recorded'} /></Grid>
          <Grid item xs={6}><DetailRow label="Purchase Date" value={aircraft.purchase_date ? new Date(aircraft.purchase_date).toLocaleDateString('en-ZA') : null} /></Grid>
          <Grid item xs={6}><DetailRow label="Purchase Price" value={aircraft.purchase_price ? `R ${Number(aircraft.purchase_price).toLocaleString()}` : null} /></Grid>
        </Grid>

        {aircraft.notes && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <DetailRow label="Notes" value={aircraft.notes} />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
        <Button onClick={() => { onClose(); onEdit(aircraft); }} variant="outlined">Edit Aircraft</Button>
      </DialogActions>
    </Dialog>
  );
}
