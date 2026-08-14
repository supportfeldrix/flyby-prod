import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';

const statusStyles = {
  'Ready': { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Mission': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  'Maintenance': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
};

const signalColors = {
  'Strong': '#16A34A',
  'Moderate': '#F59E0B',
  'Weak': '#EF4444',
};

export default function FleetStatusCard({ drone }) {
  const style = statusStyles[drone.status] || statusStyles.Ready;
  const batteryColor = drone.battery > 70 ? '#16A34A' : drone.battery > 30 ? '#F59E0B' : '#EF4444';

  return (
    <Box
      sx={{
        p: 2,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: style.bg,
              color: style.color,
            }}
          >
            <AirplanemodeActiveIcon sx={{ fontSize: '1.1rem' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
              {drone.name}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
              {drone.model}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={drone.status}
          size="small"
          sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
        />
      </Box>

      {/* Battery */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BatteryChargingFullIcon sx={{ fontSize: '0.85rem', color: batteryColor }} />
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Battery</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: batteryColor }}>
            {drone.battery}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={drone.battery}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.04)',
            '& .MuiLinearProgress-bar': { bgcolor: batteryColor },
          }}
        />
      </Box>

      {/* Details */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Signal</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SignalCellularAltIcon sx={{ fontSize: '0.75rem', color: signalColors[drone.signal] }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{drone.signal}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Flight Hours</Typography>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{drone.flightHours}h</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Firmware</Typography>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{drone.firmware}</Typography>
        </Box>
      </Box>

      {drone.currentMission && (
        <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: 'rgba(37, 99, 235, 0.04)' }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'info.main', fontWeight: 500 }}>
            Active: {drone.currentMission}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
