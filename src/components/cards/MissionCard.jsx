import { Box, Typography, Chip, LinearProgress, Avatar } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const statusColors = {
  'In Progress': { bg: 'rgba(22, 163, 74, 0.08)', color: '#16A34A', label: 'In Progress' },
  'Scheduled': { bg: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', label: 'Scheduled' },
  'Completed': { bg: 'rgba(15, 23, 42, 0.06)', color: '#64748B', label: 'Completed' },
  'Delayed': { bg: 'rgba(245, 158, 11, 0.08)', color: '#D97706', label: 'Delayed' },
};

const priorityDots = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#16A34A',
};

export default function MissionCard({ mission }) {
  const status = statusColors[mission.status] || statusColors.Scheduled;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        bgcolor: '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(15, 23, 42, 0.02)',
          borderColor: 'rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Priority dot + icon */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: status.bg,
              color: status.color,
            }}
          >
            <FlightTakeoffIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: priorityDots[mission.priority] || priorityDots.medium,
              border: '2px solid #FFFFFF',
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
                {mission.field}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {mission.farm} • {mission.crop} • {mission.area} ha
              </Typography>
            </Box>
            <Chip
              label={status.label}
              size="small"
              sx={{
                bgcolor: status.bg,
                color: status.color,
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 22,
              }}
            />
          </Box>

          {/* Details row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar sx={{ width: 20, height: 20, fontSize: '0.55rem', bgcolor: 'primary.main' }}>
                {mission.pilot.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{mission.pilot}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>•</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{mission.drone}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>•</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: '0.75rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                {mission.takeoff} – {mission.landing}
              </Typography>
            </Box>
          </Box>

          {/* Progress bar for active missions */}
          {mission.status === 'In Progress' && (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Progress</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'primary.main' }}>
                  {mission.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={mission.progress}
                sx={{
                  bgcolor: 'rgba(22, 163, 74, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #16A34A, #22C55E)',
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
