import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Chip, Button, CircularProgress, TextField, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentWeather, getHourlyForecast, getDailyForecast } from '../../services/weatherService';
import { evaluateFieldConditions, generateOperationalRecommendation } from '../../services/weatherDecisionService';
import { getTodaySprayWindow, formatSprayWindow } from '../../services/sprayWindowService';
import { getFields } from '../../services/fieldService';
import { resolveFieldLocation } from '../../services/boundaryService';

const MotionBox = motion.create(Box);

const statusIcons = { SAFE: <CheckCircleIcon />, CAUTION: <WarningAmberIcon />, 'DO NOT FLY': <CancelIcon /> };
const statusColors = { SAFE: '#16A34A', CAUTION: '#D97706', 'DO NOT FLY': '#EF4444' };

export default function Weather() {
  const { company } = useAuth();
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Load fields on mount
  useEffect(() => {
    if (!company?.id) return;
    getFields(company.id).then(fieldData => {
      setFields(fieldData);
      // Auto-select first field with a valid location
      const firstValid = fieldData.find(f => resolveFieldLocation(f));
      if (firstValid) setSelectedFieldId(firstValid.id);
    }).catch(() => {});
  }, [company?.id]);

  // Get the selected field object and its resolved location
  const selectedField = fields.find(f => f.id === selectedFieldId) || null;
  const fieldLocation = selectedField ? resolveFieldLocation(selectedField) : null;

  // Fetch weather for the current field location
  const fetchWeather = useCallback(async () => {
    if (!fieldLocation) {
      setLocationError(selectedField ? 'This field has no GPS coordinates or boundary. Add a boundary to get weather.' : null);
      setLoading(false);
      return;
    }

    setLocationError(null);
    setLoading(true);
    try {
      const [current, hourlyData, dailyData] = await Promise.all([
        getCurrentWeather(fieldLocation.lat, fieldLocation.lng),
        getHourlyForecast(fieldLocation.lat, fieldLocation.lng),
        getDailyForecast(fieldLocation.lat, fieldLocation.lng),
      ]);
      setWeather(current);
      setHourly(hourlyData);
      setDaily(dailyData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Weather fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [fieldLocation?.lat, fieldLocation?.lng]);

  // Fetch when field location changes
  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Fields with resolvable locations (for the dropdown)
  const fieldsWithLocation = fields.filter(f => resolveFieldLocation(f));

  if (loading && !weather && !locationError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  const evaluation = weather ? evaluateFieldConditions(weather) : null;
  const recommendation = weather ? generateOperationalRecommendation(weather) : null;
  const sprayWindow = hourly.length > 0 ? getTodaySprayWindow(hourly) : null;
  const formattedWindow = formatSprayWindow(sprayWindow);

  // Day/Night from sunrise/sunset
  const isDaytime = weather?.sunrise && weather?.sunset
    ? (new Date() >= weather.sunrise && new Date() <= weather.sunset)
    : (new Date().getHours() >= 6 && new Date().getHours() < 18);

  const isMockData = weather?._isMock;

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Weather Intelligence</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedField ? `Weather for ${selectedField.field_name}` : 'Operational weather analysis for drone spray operations'}
              {lastRefresh && ` • Updated ${Math.round((Date.now() - lastRefresh.getTime()) / 60000) < 1 ? 'just now' : `${Math.round((Date.now() - lastRefresh.getTime()) / 60000)} min ago`}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Field Selector */}
            {fieldsWithLocation.length > 0 && (
              <TextField
                select
                size="small"
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.8rem', height: 36 },
                }}
              >
                {fieldsWithLocation.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.field_name}</MenuItem>
                ))}
              </TextField>
            )}
            <Button variant="outlined" startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />} onClick={fetchWeather} disabled={loading} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: 36 }}>
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Location Error */}
        {locationError && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#D97706', mb: 0.5 }}>Weather location unavailable for this field</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{locationError}</Typography>
          </Paper>
        )}

        {/* No fields at all */}
        {fields.length > 0 && fieldsWithLocation.length === 0 && !locationError && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#D97706', mb: 0.5 }}>No fields with locations available</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Add GPS coordinates or draw field boundaries to get weather data.</Typography>
          </Paper>
        )}

        {weather && (
          <Grid container spacing={3}>
            {/* Left column */}
            <Grid item xs={12} lg={8}>
              {/* Operational Status Banner */}
              {recommendation && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF', borderLeft: `4px solid ${recommendation.color}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${recommendation.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: recommendation.color }}>
                      {statusIcons[evaluation?.status] || <WbSunnyIcon />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: recommendation.color }}>{recommendation.label}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{recommendation.description}</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Current Conditions + Spray Window */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: '#FFFFFF', height: '100%' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Current Conditions</Typography>
                    {isMockData && (
                      <Chip label="Demo Data — Add VITE_OPENWEATHER_API_KEY to .env for live weather" size="small" sx={{ mb: 2, fontSize: '0.6rem', height: 22, bgcolor: 'rgba(245,158,11,0.08)', color: '#D97706', fontWeight: 600 }} />
                    )}
                    <>
                      {/* Day/Night Indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>{isDaytime ? '☀️' : '🌙'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isDaytime ? '#D97706' : '#2563EB', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {isDaytime ? 'Day' : 'Night'}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, mb: 0.5 }}>{weather.temperature}°</Typography>
                      <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', textTransform: 'capitalize', mb: 0.5 }}>{weather.description}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 2.5 }}>Feels like {weather.feelsLike}°</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AirIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Wind</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{weather.windSpeed} km/h</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WaterDropIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Humidity</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{weather.humidity}%</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VisibilityIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Visibility</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{weather.visibility} km</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CloudIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Cloud Cover</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{weather.cloudCover}%</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: '#FFFFFF', height: '100%' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Safe Spray Window</Typography>
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: sprayWindow ? 'rgba(22,163,74,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${sprayWindow ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: sprayWindow ? '#16A34A' : '#EF4444', mb: 0.5 }}>
                        {formattedWindow.text}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{formattedWindow.subtext}</Typography>
                    </Box>
                    {weather && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.tertiary' }}>
                        <span>Sunrise: {weather.sunrise.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Sunset: {weather.sunset.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {/* Condition Checks */}
              {evaluation && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Operational Checks</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                    {evaluation.checks.map((check) => (
                      <Box key={check.label} sx={{ p: 2, borderRadius: '10px', bgcolor: `${statusColors[check.status]}06`, border: `1px solid ${statusColors[check.status]}20`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>{check.label}</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: statusColors[check.status] }}>{check.value}</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', mt: 0.25 }}>{check.threshold}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Hourly Timeline */}
              <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Hourly Spray Forecast</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                  {hourly.slice(0, 12).map((h, i) => {
                    const hEval = evaluateFieldConditions(h);
                    return (
                      <Box key={i} sx={{ minWidth: 64, textAlign: 'center', p: 1.5, borderRadius: '10px', bgcolor: `${statusColors[hEval.status]}04`, border: `1px solid ${statusColors[hEval.status]}15`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>{h.time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Typography>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[hEval.status], mx: 'auto', my: 1 }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{h.temperature}°</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>{h.windSpeed} km/h</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>{h.rainProbability}% rain</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            {/* Right column */}
            <Grid item xs={12} lg={4}>
              {/* 3-Day Outlook */}
              <Paper sx={{ p: 3, bgcolor: '#FFFFFF', mb: 3 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>3-Day Outlook</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {daily.slice(0, 3).map((day) => {
                    const safe = day.windMax <= 12 && day.rainProbability <= 30;
                    return (
                      <Box key={day.date} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '10px', bgcolor: safe ? 'rgba(22,163,74,0.03)' : 'rgba(245,158,11,0.03)', border: `1px solid ${safe ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)'}` }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{day.dayName}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{day.tempMin}° – {day.tempMax}°</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Wind {day.windMax} km/h</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{day.rainProbability}% rain</Typography>
                        </Box>
                        <Chip
                          label={safe ? 'Flyable' : 'Check'}
                          size="small"
                          sx={{ bgcolor: safe ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)', color: safe ? '#16A34A' : '#D97706', fontWeight: 600, fontSize: '0.6rem', height: 20 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Field Decisions */}
              {fields.filter((f) => resolveFieldLocation(f)).length > 0 && (
                <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Field Decisions</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {fields.filter((f) => resolveFieldLocation(f)).slice(0, 5).map((field) => {
                      const fieldEval = weather ? evaluateFieldConditions(weather, field.wind_limit) : null;
                      const statusLabel = fieldEval?.status === 'SAFE' ? 'Safe to Spray' : fieldEval?.status === 'CAUTION' ? 'Caution' : 'Do Not Spray';
                      return (
                        <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '8px', border: `1px solid ${field.id === selectedFieldId ? 'rgba(22,163,74,0.2)' : 'rgba(15,23,42,0.04)'}`, bgcolor: field.id === selectedFieldId ? 'rgba(22,163,74,0.02)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedFieldId(field.id)}>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{field.field_name}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{field.wind_limit ? `≤${field.wind_limit} km/h` : 'Default limits'}</Typography>
                          </Box>
                          <Chip
                            label={statusLabel}
                            size="small"
                            sx={{ bgcolor: `${statusColors[fieldEval?.status || 'SAFE']}08`, color: statusColors[fieldEval?.status || 'SAFE'], fontWeight: 600, fontSize: '0.6rem', height: 20 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
      </MotionBox>
    </Box>
  );
}
