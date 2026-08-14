import { Box, Typography, Paper, Chip } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { weather } from '../../data/mockData';

export default function WeatherCard() {
  const isSafe = weather.sprayWindow.safe;

  return (
    <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Weather Intelligence</Typography>
        <Chip
          icon={isSafe ? <CheckCircleOutlineIcon sx={{ fontSize: '0.9rem' }} /> : <WarningAmberIcon sx={{ fontSize: '0.9rem' }} />}
          label={isSafe ? 'Safe to Spray' : 'Check Conditions'}
          size="small"
          sx={{
            bgcolor: isSafe ? 'rgba(22, 163, 74, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            color: isSafe ? 'success.main' : 'warning.dark',
            fontWeight: 600,
            fontSize: '0.7rem',
            '& .MuiChip-icon': { color: isSafe ? 'success.main' : 'warning.dark' },
          }}
        />
      </Box>

      {/* Temperature display */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography sx={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
          {weather.temperature}°C
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 3 }}>
        {weather.condition}
      </Typography>

      {/* Weather details */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <WeatherStat icon={<AirIcon />} label="Wind" value={`${weather.windSpeed} km/h`} sub={weather.windDirection} />
        <WeatherStat icon={<WaterDropIcon />} label="Humidity" value={`${weather.humidity}%`} />
        <WeatherStat icon={<UmbrellaIcon />} label="Rain Chance" value={`${weather.rainChance}%`} />
        <WeatherStat icon={<ThermostatIcon />} label="Temp Range" value={`${weather.tempRange.min}° / ${weather.tempRange.max}°`} />
      </Box>

      {/* Spray window */}
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          bgcolor: isSafe ? 'rgba(22, 163, 74, 0.04)' : 'rgba(245, 158, 11, 0.04)',
          border: '1px solid',
          borderColor: isSafe ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {isSafe ? (
            <CheckCircleOutlineIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
          ) : (
            <WarningAmberIcon sx={{ fontSize: '1rem', color: 'warning.dark' }} />
          )}
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isSafe ? 'success.main' : 'warning.dark' }}>
            {weather.sprayWindow.recommendation}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {isSafe ? `Until ${weather.sprayWindow.end}` : 'Delay spraying until conditions improve.'}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mt: 0.5 }}>
          {weather.sprayWindow.note}
        </Typography>
      </Box>
    </Paper>
  );
}

function WeatherStat({ icon, label, value, sub }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(15, 23, 42, 0.04)',
          color: 'text.secondary',
          '& svg': { fontSize: '1rem' },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 0.25 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
          {value}
          {sub && <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.tertiary', ml: 0.5 }}>{sub}</Box>}
        </Typography>
      </Box>
    </Box>
  );
}
