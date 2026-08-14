import { Box, Typography, Avatar, Chip } from '@mui/material';

const availabilityStyles = {
  'Available': { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  'Off Duty': { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
};

export default function PilotCard({ pilot, compact = false }) {
  const style = availabilityStyles[pilot.availability] || availabilityStyles.Available;

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          borderRadius: '10px',
          border: '1px solid rgba(15, 23, 42, 0.04)',
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.02)' },
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: style.bg,
            color: style.color,
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {pilot.initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
            {pilot.name}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {pilot.todayMissions} missions today • {pilot.flightHours}h total
          </Typography>
        </Box>
        <Chip
          label={pilot.availability}
          size="small"
          sx={{
            bgcolor: style.bg,
            color: style.color,
            fontWeight: 600,
            fontSize: '0.6rem',
            height: 20,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        bgcolor: '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(15, 23, 42, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: 'primary.main',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {pilot.initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{pilot.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{pilot.role} • "{pilot.callSign}"</Typography>
        </Box>
        <Chip
          label={pilot.availability}
          size="small"
          sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', mb: 0.25 }}>Today's Missions</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pilot.todayMissions}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', mb: 0.25 }}>Flight Hours</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pilot.flightHours}h</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', mb: 0.25 }}>Licence</Typography>
          <Chip
            label={pilot.licenceStatus}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              bgcolor: pilot.licenceStatus === 'Valid' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              color: pilot.licenceStatus === 'Valid' ? 'success.main' : 'warning.dark',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
