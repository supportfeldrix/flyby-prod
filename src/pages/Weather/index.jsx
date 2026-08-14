import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { weather } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function Weather() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Weather Intelligence</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Real-time weather conditions and spray window analysis
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Current conditions */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 4, bgcolor: '#FFFFFF', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '5rem', fontWeight: 700, lineHeight: 1, mb: 1 }}>
                {weather.temperature}°
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary', mb: 3 }}>
                {weather.condition}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <AirIcon sx={{ color: 'text.tertiary', fontSize: '1.5rem', mb: 0.5 }} />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary' }}>Wind</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{weather.windSpeed} km/h {weather.windDirection}</Typography>
                </Box>
                <Box>
                  <WaterDropIcon sx={{ color: 'text.tertiary', fontSize: '1.5rem', mb: 0.5 }} />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary' }}>Humidity</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{weather.humidity}%</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Spray Window */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                p: 4,
                bgcolor: '#FFFFFF',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>Today's Spray Window</Typography>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: weather.sprayWindow.safe ? 'rgba(22, 163, 74, 0.04)' : 'rgba(245, 158, 11, 0.04)',
                  border: '2px solid',
                  borderColor: weather.sprayWindow.safe ? 'rgba(22, 163, 74, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  mb: 2,
                }}
              >
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: weather.sprayWindow.safe ? 'success.main' : 'warning.dark', mb: 1 }}>
                  {weather.sprayWindow.recommendation}
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', color: 'text.primary', fontWeight: 500 }}>
                  {weather.sprayWindow.start} – {weather.sprayWindow.end}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 1 }}>
                  {weather.sprayWindow.note}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 5 Day Forecast */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ mb: 3, fontSize: '1rem' }}>5-Day Forecast</Typography>
              <Grid container spacing={2}>
                {weather.forecast.map((day, i) => (
                  <Grid item xs={6} sm key={i}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        textAlign: 'center',
                        bgcolor: day.safe ? 'rgba(22, 163, 74, 0.03)' : 'rgba(245, 158, 11, 0.03)',
                        border: '1px solid',
                        borderColor: day.safe ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>{day.day}</Typography>
                      {day.safe ? (
                        <WbSunnyIcon sx={{ color: '#F59E0B', fontSize: '1.5rem', mb: 1 }} />
                      ) : (
                        <CloudIcon sx={{ color: '#64748B', fontSize: '1.5rem', mb: 1 }} />
                      )}
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 0.5 }}>{day.temp}°</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>
                        Wind: {day.wind} km/h
                      </Typography>
                      <Chip
                        icon={day.safe ? <CheckCircleIcon sx={{ fontSize: '0.7rem' }} /> : <CancelIcon sx={{ fontSize: '0.7rem' }} />}
                        label={day.safe ? 'Flyable' : 'No Fly'}
                        size="small"
                        sx={{
                          bgcolor: day.safe ? 'rgba(22, 163, 74, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: day.safe ? 'success.main' : 'error.main',
                          fontWeight: 600,
                          fontSize: '0.6rem',
                          height: 20,
                          '& .MuiChip-icon': { color: day.safe ? 'success.main' : 'error.main' },
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </MotionBox>
    </Box>
  );
}
