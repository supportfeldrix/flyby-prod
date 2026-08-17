import { useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Chip, Grid, Tab, Tabs, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FlightIcon from '@mui/icons-material/Flight';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import LockIcon from '@mui/icons-material/Lock';

const statusStyles = {
  Ready: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Maintenance: { color: '#D97706', bg: 'rgba(245, 158, 11, 0.08)' },
  Offline: { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
  Retired: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'text.primary' }}>{value}</Typography>
    </Box>
  );
}

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;
}

function getWarnings(aircraft) {
  const warnings = [];
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  if (aircraft.next_service_date && new Date(aircraft.next_service_date) < today) warnings.push('Service overdue');
  if (aircraft.insurance_expiry) {
    const exp = new Date(aircraft.insurance_expiry);
    if (exp < today) warnings.push('Insurance expired');
    else if (exp < thirtyDays) warnings.push('Insurance expiring soon');
  }
  return warnings;
}

export default function AircraftDetailsDialog({ open, onClose, aircraft, onEdit }) {
  const [tab, setTab] = useState(0);

  if (!aircraft) return null;
  const style = statusStyles[aircraft.status] || statusStyles.Ready;
  const warnings = getWarnings(aircraft);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      {/* Hero header */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ height: 200, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {aircraft.photo_url ? (
            <Box component="img" src={aircraft.photo_url} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <AirplanemodeActiveIcon sx={{ fontSize: '5rem', color: 'rgba(15,23,42,0.06)' }} />
          )}
        </Box>

        {/* Close button */}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
          <CloseIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>

        {/* Title bar over photo */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, px: 3, py: 2, background: 'linear-gradient(transparent, rgba(255,255,255,0.95))' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{aircraft.aircraft_name}</Typography>
            <Chip label={aircraft.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{aircraft.manufacturer} {aircraft.model} • {aircraft.aircraft_type}</Typography>
        </Box>
      </Box>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box sx={{ px: 3, pt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {warnings.map((w, i) => (
            <Chip key={i} icon={<WarningAmberIcon sx={{ fontSize: '0.8rem' }} />} label={w} size="small"
              sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: 'warning.dark', fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: 'warning.dark' } }} />
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ px: 3, borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, px: 2 },
            '& .Mui-selected': { color: 'primary.main' },
            '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 2 },
          }}
        >
          <Tab icon={<FlightIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Overview" />
          <Tab icon={<BuildIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Maintenance" />
          <Tab icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Documents" />
          <Tab icon={<HistoryIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Missions" disabled />
          <Tab icon={<BatteryChargingFullIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Batteries" disabled />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3, pt: 0 }}>
        {/* OVERVIEW TAB */}
        <TabPanel value={tab} index={0}>
          {/* Stats row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
            {[
              { label: 'Flight Hours', value: `${aircraft.flight_hours || 0}h`, color: '#16A34A' },
              { label: 'Total Missions', value: aircraft.total_missions || 0, color: '#2563EB' },
              { label: 'Hectares Sprayed', value: `${aircraft.total_hectares || 0} ha`, color: '#7C3AED' },
              { label: 'Last Flight', value: aircraft.last_flight_date ? formatDate(aircraft.last_flight_date) : 'Never', color: '#64748B' },
            ].map((item, i) => (
              <Box key={i} sx={{ p: 2, borderRadius: '10px', bgcolor: `${item.color}06`, border: `1px solid ${item.color}15`, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.value}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', mt: 0.25 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Specifications */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>Specifications</Typography>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4}><DetailRow label="Manufacturer" value={aircraft.manufacturer} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Model" value={aircraft.model} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Type" value={aircraft.aircraft_type} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Serial Number" value={aircraft.serial_number} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Registration" value={aircraft.registration_number} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Firmware" value={aircraft.firmware_version} /></Grid>
          </Grid>

          {/* Purchase */}
          {(aircraft.purchase_date || aircraft.purchase_price) && (
            <>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>Purchase Information</Typography>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={6}><DetailRow label="Purchase Date" value={formatDate(aircraft.purchase_date)} /></Grid>
                <Grid item xs={6}><DetailRow label="Purchase Price" value={aircraft.purchase_price ? `R ${Number(aircraft.purchase_price).toLocaleString()}` : null} /></Grid>
              </Grid>
            </>
          )}

          {aircraft.notes && (
            <>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Notes</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6 }}>{aircraft.notes}</Typography>
            </>
          )}
        </TabPanel>

        {/* MAINTENANCE TAB */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.1)' }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Last Service</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{formatDate(aircraft.last_service_date)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: aircraft.next_service_date && new Date(aircraft.next_service_date) < new Date() ? 'rgba(245,158,11,0.06)' : 'rgba(37,99,235,0.04)', border: `1px solid ${aircraft.next_service_date && new Date(aircraft.next_service_date) < new Date() ? 'rgba(245,158,11,0.15)' : 'rgba(37,99,235,0.1)'}` }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Next Service</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{formatDate(aircraft.next_service_date)}</Typography>
                {aircraft.next_service_date && new Date(aircraft.next_service_date) < new Date() && (
                  <Chip icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />} label="Overdue" size="small" sx={{ mt: 1, bgcolor: 'rgba(245,158,11,0.1)', color: 'warning.dark', fontWeight: 600, fontSize: '0.65rem', height: 20, '& .MuiChip-icon': { color: 'warning.dark' } }} />
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)' }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Insurance Expiry</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{formatDate(aircraft.insurance_expiry)}</Typography>
                {aircraft.insurance_expiry && new Date(aircraft.insurance_expiry) < new Date() && (
                  <Chip icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />} label="Expired" size="small" sx={{ mt: 1, bgcolor: 'rgba(239,68,68,0.08)', color: 'error.main', fontWeight: 600, fontSize: '0.65rem', height: 20, '& .MuiChip-icon': { color: 'error.main' } }} />
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)' }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Firmware Version</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{aircraft.firmware_version || '—'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* DOCUMENTS TAB */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DescriptionIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1.5 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Document management coming soon</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', maxWidth: 320, mx: 'auto' }}>
              Upload and manage insurance certificates, registration documents, purchase invoices, and warranty papers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
              {['Insurance Certificate', 'Registration', 'Purchase Invoice', 'Warranty'].map((doc) => (
                <Chip
                  key={doc}
                  icon={<LockIcon sx={{ fontSize: '0.7rem' }} />}
                  label={doc}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', '& .MuiChip-icon': { color: 'text.tertiary' } }}
                  disabled
                />
              ))}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
        <Button onClick={() => { onClose(); onEdit(aircraft); }} variant="contained">Edit Aircraft</Button>
      </DialogActions>
    </Dialog>
  );
}
