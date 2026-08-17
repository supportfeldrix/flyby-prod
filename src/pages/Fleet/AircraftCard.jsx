import { Box, Typography, Chip, IconButton, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';

const statusStyles = {
  Ready: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.15)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.15)' },
  Maintenance: { color: '#D97706', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.15)' },
  Offline: { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)', border: 'rgba(15, 23, 42, 0.08)' },
  Retired: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)', border: 'rgba(15, 23, 42, 0.06)' },
};

const typeLabels = {
  'Spray Drone': { label: 'Sprayer', color: '#16A34A' },
  'Survey Drone': { label: 'Survey', color: '#2563EB' },
  'Mapping Drone': { label: 'Mapping', color: '#7C3AED' },
  'Multirole': { label: 'Multi', color: '#0EA5E9' },
  'Other': { label: 'Other', color: '#64748B' },
};

function getWarnings(aircraft) {
  const warnings = [];
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);

  if (aircraft.next_service_date && new Date(aircraft.next_service_date) < today) {
    warnings.push('Service overdue');
  }
  if (aircraft.insurance_expiry) {
    const exp = new Date(aircraft.insurance_expiry);
    if (exp < today) warnings.push('Insurance expired');
    else if (exp < thirtyDays) warnings.push('Insurance expiring');
  }
  return warnings;
}

const MotionPaper = motion.create(Paper);

export default function AircraftCard({ aircraft, onEdit, onDelete, onView }) {
  const style = statusStyles[aircraft.status] || statusStyles.Ready;
  const typeInfo = typeLabels[aircraft.aircraft_type] || typeLabels.Other;
  const warnings = getWarnings(aircraft);

  return (
    <MotionPaper
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      sx={{ overflow: 'hidden', bgcolor: '#FFFFFF', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      onClick={() => onView(aircraft)}
    >
      {/* Photo — fixed height, object-contain for no crop */}
      <Box
        sx={{
          height: 160,
          bgcolor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
        }}
      >
        {aircraft.photo_url ? (
          <Box
            component="img"
            src={aircraft.photo_url}
            alt={aircraft.aircraft_name}
            sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
          />
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <AirplanemodeActiveIcon sx={{ fontSize: '2.5rem', color: 'rgba(15, 23, 42, 0.08)' }} />
            <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', mt: 0.5 }}>No photo</Typography>
          </Box>
        )}

        {/* Status badge - top right */}
        <Chip
          label={aircraft.status}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(255,255,255,0.92)',
            color: style.color,
            fontWeight: 700,
            fontSize: '0.6rem',
            height: 22,
            border: `1px solid ${style.border}`,
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Type badge - top left */}
        <Chip
          label={typeInfo.label}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'rgba(255,255,255,0.92)',
            color: typeInfo.color,
            fontWeight: 600,
            fontSize: '0.6rem',
            height: 20,
            backdropFilter: 'blur(4px)',
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name & Model */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }} noWrap>
            {aircraft.aircraft_name}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}>
            {aircraft.manufacturer} {aircraft.model}
          </Typography>
        </Box>

        {/* Key metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2, flex: 1 }}>
          {aircraft.registration_number && (
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Registration</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mt: 0.25 }}>{aircraft.registration_number}</Typography>
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Flight Hours</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mt: 0.25 }}>{aircraft.flight_hours || 0}h</Typography>
          </Box>
          {aircraft.firmware_version && (
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Firmware</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, mt: 0.25 }}>{aircraft.firmware_version}</Typography>
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Battery</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <BatteryUnknownIcon sx={{ fontSize: '0.85rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', fontStyle: 'italic' }}>Not assigned</Typography>
            </Box>
          </Box>
        </Box>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {warnings.map((w, i) => (
              <Chip
                key={i}
                icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />}
                label={w}
                size="small"
                sx={{ fontSize: '0.6rem', height: 20, bgcolor: 'rgba(245, 158, 11, 0.08)', color: 'warning.dark', fontWeight: 600, '& .MuiChip-icon': { color: 'warning.dark' } }}
              />
            ))}
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, pt: 1.5, borderTop: '1px solid rgba(15, 23, 42, 0.04)' }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onView(aircraft); }}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'rgba(22,163,74,0.06)' } }}
          >
            <VisibilityIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onEdit(aircraft); }}
            sx={{ '&:hover': { color: 'primary.main', bgcolor: 'rgba(22,163,74,0.06)' } }}
          >
            <EditIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(aircraft); }}
            sx={{ '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.06)' } }}
          >
            <DeleteIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Box>
    </MotionPaper>
  );
}
