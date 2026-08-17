import { useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Chip, Grid, Tab, Tabs, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlightIcon from '@mui/icons-material/Flight';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';

const statusStyles = {
  Available: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  Flying: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Standby: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
  Training: { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.08)' },
  'On Leave': { color: '#D97706', bg: 'rgba(245, 158, 11, 0.08)' },
  'Off Duty': { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
  Inactive: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;
}

export default function PilotDetailsDialog({ open, onClose, pilot, onEdit }) {
  const [tab, setTab] = useState(0);
  if (!pilot) return null;

  const style = statusStyles[pilot.status] || statusStyles.Available;
  const displayName = pilot.display_name || `${pilot.first_name} ${pilot.last_name}`;
  const initials = `${pilot.first_name?.[0] || ''}${pilot.last_name?.[0] || ''}`.toUpperCase();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  const warnings = [];
  if (pilot.licence_expiry && new Date(pilot.licence_expiry) < thirtyDays) warnings.push(new Date(pilot.licence_expiry) < today ? 'Licence expired' : 'Licence expiring soon');
  if (pilot.medical_expiry && new Date(pilot.medical_expiry) < thirtyDays) warnings.push(new Date(pilot.medical_expiry) < today ? 'Medical expired' : 'Medical expiring soon');
  if (!pilot.preferred_aircraft) warnings.push('No aircraft assigned');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 2.5, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
        <Avatar src={pilot.photo_url || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.3rem', fontWeight: 700 }}>{initials}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{displayName}</Typography>
            <Chip label={pilot.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            {pilot.pilot_code && `${pilot.pilot_code} • `}{pilot.licence_type} • {pilot.total_flight_hours || 0}h total
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, px: 2 }, '& .Mui-selected': { color: 'primary.main' }, '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 2 } }}>
          <Tab icon={<FlightIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Overview" />
          <Tab icon={<BadgeIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Qualifications" />
          <Tab icon={<WorkIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Employment" />
          <Tab icon={<BarChartIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Statistics" />
          <Tab icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Documents" />
          <Tab icon={<HistoryIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Missions" disabled />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3, pt: 0 }}>
        {/* OVERVIEW */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
            {[
              { label: 'Flight Hours', value: `${pilot.total_flight_hours || 0}h`, color: '#16A34A' },
              { label: 'Total Missions', value: pilot.total_missions || 0, color: '#2563EB' },
              { label: 'Hectares Sprayed', value: `${pilot.total_hectares || 0} ha`, color: '#7C3AED' },
              { label: 'Status', value: pilot.status, color: style.color },
            ].map((item, i) => (
              <Box key={i} sx={{ p: 2, borderRadius: '10px', bgcolor: `${item.color}06`, border: `1px solid ${item.color}15`, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.value}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', mt: 0.25 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
          <Grid container spacing={2.5}>
            <Grid item xs={6} sm={4}><DetailRow label="Email" value={pilot.email} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Phone" value={pilot.phone} /></Grid>
            <Grid item xs={6} sm={4}><DetailRow label="Preferred Aircraft" value={pilot.aircraft?.aircraft_name || 'None assigned'} /></Grid>
          </Grid>
          {pilot.notes && <Box sx={{ mt: 2.5 }}><DetailRow label="Notes" value={pilot.notes} /></Box>}
        </TabPanel>

        {/* QUALIFICATIONS */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={6}><Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.1)' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Licence</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{pilot.licence_number || '—'}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>{pilot.licence_type}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Expires: {formatDate(pilot.licence_expiry)}</Typography>
            </Box></Grid>
            <Grid item xs={6}><Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>Medical</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Class II</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>Expires: {formatDate(pilot.medical_expiry)}</Typography>
            </Box></Grid>
          </Grid>
        </TabPanel>

        {/* EMPLOYMENT */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2.5}>
            <Grid item xs={6}><DetailRow label="Hire Date" value={formatDate(pilot.hire_date)} /></Grid>
            <Grid item xs={6}><DetailRow label="Date of Birth" value={formatDate(pilot.date_of_birth)} /></Grid>
            <Grid item xs={6}><DetailRow label="Pilot Code" value={pilot.pilot_code} /></Grid>
            <Grid item xs={6}><DetailRow label="Status" value={pilot.status} /></Grid>
          </Grid>
        </TabPanel>

        {/* STATISTICS */}
        <TabPanel value={tab} index={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { label: 'Total Flight Hours', value: `${pilot.total_flight_hours || 0}h` },
              { label: 'Total Missions', value: pilot.total_missions || 0 },
              { label: 'Hectares Sprayed', value: `${pilot.total_hectares || 0} ha` },
            ].map((item, i) => (
              <Box key={i} sx={{ p: 3, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>{item.value}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', mt: 0.5 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* DOCUMENTS */}
        <TabPanel value={tab} index={4}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DescriptionIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1.5 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Document management coming soon</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', maxWidth: 320, mx: 'auto' }}>
              Upload licences, medical certificates, operator certificates, and training records.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
              {['Pilot Licence', 'Medical Certificate', 'Operator Certificate', 'Training Records'].map((doc) => (
                <Chip key={doc} icon={<LockIcon sx={{ fontSize: '0.7rem' }} />} label={doc} size="small" variant="outlined" sx={{ fontSize: '0.7rem', '& .MuiChip-icon': { color: 'text.tertiary' } }} disabled />
              ))}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
        <Button onClick={() => { onClose(); onEdit(pilot); }} variant="contained">Edit Pilot</Button>
      </DialogActions>
    </Dialog>
  );
}
