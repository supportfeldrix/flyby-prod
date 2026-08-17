import { Box, Typography, Chip, IconButton, Paper, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FlightIcon from '@mui/icons-material/Flight';

const statusStyles = {
  Available: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  Flying: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Standby: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
  Training: { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.08)' },
  'On Leave': { color: '#D97706', bg: 'rgba(245, 158, 11, 0.08)' },
  'Off Duty': { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
  Inactive: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

function getWarnings(pilot) {
  const warnings = [];
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  if (pilot.licence_expiry && new Date(pilot.licence_expiry) < thirtyDays) {
    warnings.push(new Date(pilot.licence_expiry) < today ? 'Licence expired' : 'Licence expiring');
  }
  if (pilot.medical_expiry && new Date(pilot.medical_expiry) < thirtyDays) {
    warnings.push(new Date(pilot.medical_expiry) < today ? 'Medical expired' : 'Medical expiring');
  }
  return warnings;
}

const MotionPaper = motion.create(Paper);

export default function PilotCard({ pilot, onEdit, onDelete, onView }) {
  const style = statusStyles[pilot.status] || statusStyles.Available;
  const warnings = getWarnings(pilot);
  const displayName = pilot.display_name || `${pilot.first_name} ${pilot.last_name}`;
  const initials = `${pilot.first_name?.[0] || ''}${pilot.last_name?.[0] || ''}`.toUpperCase();

  return (
    <MotionPaper
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      sx={{ p: 3, bgcolor: '#FFFFFF', height: '100%', cursor: 'pointer' }}
      onClick={() => onView(pilot)}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          src={pilot.photo_url || undefined}
          sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }} noWrap>{displayName}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {pilot.pilot_code && `${pilot.pilot_code} • `}{pilot.licence_type || 'No licence'}
          </Typography>
        </Box>
        <Chip label={pilot.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.6rem', height: 22 }} />
      </Box>

      {/* Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600 }}>Hours</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pilot.total_flight_hours || 0}h</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600 }}>Missions</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pilot.total_missions || 0}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600 }}>Hectares</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pilot.total_hectares || 0}</Typography>
        </Box>
      </Box>

      {/* Preferred aircraft */}
      {pilot.aircraft?.aircraft_name && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <FlightIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{pilot.aircraft.aircraft_name}</Typography>
        </Box>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {warnings.map((w, i) => (
            <Chip key={i} icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />} label={w} size="small"
              sx={{ fontSize: '0.6rem', height: 20, bgcolor: 'rgba(245,158,11,0.08)', color: 'warning.dark', fontWeight: 600, '& .MuiChip-icon': { color: 'warning.dark' } }} />
          ))}
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, pt: 1.5, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(pilot); }} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'rgba(22,163,74,0.06)' } }}>
          <VisibilityIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(pilot); }} sx={{ '&:hover': { color: 'primary.main', bgcolor: 'rgba(22,163,74,0.06)' } }}>
          <EditIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(pilot); }} sx={{ '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.06)' } }}>
          <DeleteIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Box>
    </MotionPaper>
  );
}
