import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PeopleIcon from '@mui/icons-material/People';
import GrassIcon from '@mui/icons-material/Grass';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import BuildIcon from '@mui/icons-material/Build';
import CloudIcon from '@mui/icons-material/Cloud';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerCount } from '../../services/customerService';
import { getFarmCount } from '../../services/farmService';
import { getFieldCount } from '../../services/fieldService';
import { getAircraftStats } from '../../services/aircraftService';
import { getPilotStats } from '../../services/pilotService';
import MapPanel from '../../components/cards/MapPanel';

const MotionBox = motion.create(Box);

// Welcome Banner
function WelcomeBanner() {
  const { profile } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.full_name?.split(' ')[0] || 'Captain';

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #0F172A 0%, #1A2332 50%, #0F172A 100%)',
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22, 163, 74, 0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ color: '#FFFFFF', mb: 0.5, fontWeight: 700 }}>
          {greeting}, {displayName}.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
          Mission Control is ready.
        </Typography>
      </Box>
    </MotionBox>
  );
}

// Stats Cards
function StatsRow({ stats }) {
  const items = [
    { label: 'Customers', value: stats.customers, icon: <PeopleIcon />, color: '#16A34A' },
    { label: 'Farms', value: stats.farms, icon: <AgricultureIcon />, color: '#2563EB' },
    { label: 'Fields', value: stats.fields, icon: <GrassIcon />, color: '#7C3AED' },
    { label: 'Missions Today', value: 0, icon: <FlightTakeoffIcon />, color: '#F59E0B', sub: 'Coming in Sprint 4' },
  ];

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {items.map((item, i) => (
        <Grid item xs={6} md={3} key={i}>
          <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2, bgcolor: '#FFFFFF' }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${item.color}12`, color: item.color, flexShrink: 0 }}>
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>{item.value}</Typography>
                {item.sub && <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', mt: 0.25 }}>{item.sub}</Typography>}
              </Box>
            </Paper>
          </MotionBox>
        </Grid>
      ))}
    </Grid>
  );
}

// Quick Actions
function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: 'Add Customer', icon: <PeopleIcon />, color: '#16A34A', action: () => navigate('/customers') },
    { label: 'Add Farm', icon: <AgricultureIcon />, color: '#2563EB', action: () => navigate('/farms') },
    { label: 'Add Field', icon: <GrassIcon />, color: '#7C3AED', action: () => navigate('/fields') },
    { label: 'Fleet (Sprint 4)', icon: <AirplanemodeActiveIcon />, color: '#F59E0B', action: null },
    { label: 'Weather (Sprint 4)', icon: <CloudIcon />, color: '#0EA5E9', action: null },
    { label: 'Reports (Sprint 4)', icon: <AssessmentIcon />, color: '#EF4444', action: null },
  ];

  return (
    <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
      <Typography variant="h6" sx={{ mb: 2.5, fontSize: '1rem' }}>Quick Actions</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {actions.map((action, i) => (
          <Button
            key={i}
            variant="outlined"
            size="small"
            startIcon={action.icon}
            onClick={action.action}
            disabled={!action.action}
            sx={{
              borderColor: 'rgba(15, 23, 42, 0.08)',
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.8rem',
              px: 2,
              '&:hover': { borderColor: action.color, bgcolor: `${action.color}08`, color: action.color },
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Paper>
  );
}

// Main Mission Control Page
export default function MissionControl() {
  const { company } = useAuth();
  const [stats, setStats] = useState({ customers: 0, farms: 0, fields: 0, fleet: { total: 0, ready: 0, inMission: 0, maintenance: 0, avgFlightHours: 0 }, pilots: { total: 0, available: 0, flying: 0, onLeave: 0, licenceExpiring: 0, medicalExpiring: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!company?.id) return;
    try {
      const [customers, farms, fields, fleetStats, pilotStats] = await Promise.all([
        getCustomerCount(company.id),
        getFarmCount(company.id),
        getFieldCount(company.id),
        getAircraftStats(company.id),
        getPilotStats(company.id),
      ]);
      setStats({ customers, farms, fields, fleet: fleetStats, pilots: pilotStats });
    } catch (err) {
      console.error('Failed to fetch stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <Box>
      <WelcomeBanner />
      <StatsRow stats={stats} />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <MapPanel />
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>Today's Missions</Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FlightTakeoffIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>No missions scheduled today.</Typography>
                <Typography sx={{ color: 'text.tertiary', fontSize: '0.8rem', mt: 0.5 }}>Mission planning available in Sprint 4.</Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <QuickActions />

          <Paper sx={{ p: 3, mt: 3, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>Fleet Status</Typography>
            {stats.fleet.total > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Ready</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#16A34A' }}>{stats.fleet.ready}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>In Mission</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB' }}>{stats.fleet.inMission}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Maintenance</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#F59E0B' }}>{stats.fleet.maintenance}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Total Fleet</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{stats.fleet.total}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Avg Flight Hours</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{stats.fleet.avgFlightHours}h</Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <AirplanemodeActiveIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>No aircraft added yet.</Typography>
                <Typography sx={{ color: 'text.tertiary', fontSize: '0.75rem', mt: 0.5 }}>Register your first drone in Fleet.</Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>Pilot Schedule</Typography>
            {stats.pilots.total > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Available</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#16A34A' }}>{stats.pilots.available}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Flying</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB' }}>{stats.pilots.flying}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>On Leave</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#D97706' }}>{stats.pilots.onLeave}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Total Pilots</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{stats.pilots.total}</Typography>
                </Box>
                {stats.pilots.licenceExpiring > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'warning.dark' }}>Licence Expiring</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'warning.dark' }}>{stats.pilots.licenceExpiring}</Typography>
                  </Box>
                )}
                {stats.pilots.medicalExpiring > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'warning.dark' }}>Medical Expiring</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'warning.dark' }}>{stats.pilots.medicalExpiring}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <PersonIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>No pilots registered yet.</Typography>
                <Typography sx={{ color: 'text.tertiary', fontSize: '0.75rem', mt: 0.5 }}>Register your first pilot in the Pilots module.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
