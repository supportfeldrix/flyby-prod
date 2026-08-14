import { Box, Typography, Grid, Paper, Chip, Avatar, Button, LinearProgress, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GrassIcon from '@mui/icons-material/Grass';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import CloudIcon from '@mui/icons-material/Cloud';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { stats, missions, weather, fleet, pilots, recentActivity } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import WeatherCard from '../../components/cards/WeatherCard';
import MissionCard from '../../components/cards/MissionCard';
import FleetStatusCard from '../../components/cards/FleetStatusCard';
import PilotCard from '../../components/cards/PilotCard';
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
      {/* Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22, 163, 74, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h4"
          sx={{ color: '#FFFFFF', mb: 0.5, fontWeight: 700 }}
        >
          {greeting}, {displayName}.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', mb: 3 }}>
          Mission Control is ready. Today's flight conditions are {weather.sprayWindow.safe ? 'excellent' : 'challenging'}.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 2, md: 4 },
          }}
        >
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
              First Spray Window
            </Typography>
            <Typography sx={{ color: '#22C55E', fontSize: '1.25rem', fontWeight: 700 }}>
              {weather.sprayWindow.start} – {weather.sprayWindow.end}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
              Today's Missions
            </Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
              {missions.length}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
              Pilots Ready
            </Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
              {pilots.filter(p => p.availability !== 'Off Duty').length}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
              Aircraft Ready
            </Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
              {fleet.filter(d => d.status !== 'Maintenance').length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </MotionBox>
  );
}

// Stats Cards
function StatsRow() {
  const items = [
    { label: 'Active Jobs', value: stats.activeMissions, sub: `${stats.missionsInProgress} in progress`, icon: <FlightTakeoffIcon />, color: '#16A34A' },
    { label: 'Jobs This Week', value: stats.jobsThisWeek, sub: stats.jobsChange + ' vs last week', icon: <CalendarTodayIcon />, color: '#2563EB' },
    { label: 'Hectares Sprayed', value: `${stats.hectaresSprayed} ha`, sub: 'This week', icon: <GrassIcon />, color: '#16A34A' },
    { label: 'Flight Hours', value: stats.flightHours, sub: 'This week', icon: <AccessTimeIcon />, color: '#7C3AED' },
  ];

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {items.map((item, i) => (
        <Grid item xs={6} md={3} key={i}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <Paper
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                bgcolor: '#FFFFFF',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${item.color}12`,
                  color: item.color,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                  {item.value}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mt: 0.25 }}>
                  {item.sub}
                </Typography>
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
  const actions = [
    { label: 'Create Mission', icon: <AddIcon />, color: '#16A34A' },
    { label: 'Flight Planner', icon: <MapIcon />, color: '#2563EB' },
    { label: 'Fleet Check', icon: <BuildIcon />, color: '#7C3AED' },
    { label: 'Pilot Assignment', icon: <PersonIcon />, color: '#F59E0B' },
    { label: 'Weather Briefing', icon: <CloudIcon />, color: '#0EA5E9' },
    { label: 'Generate Report', icon: <AssessmentIcon />, color: '#EF4444' },
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
            sx={{
              borderColor: 'rgba(15, 23, 42, 0.08)',
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.8rem',
              px: 2,
              '&:hover': {
                borderColor: action.color,
                bgcolor: `${action.color}08`,
                color: action.color,
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Paper>
  );
}

// Activity Feed
function ActivityFeed() {
  const typeStyles = {
    success: { icon: <CheckCircleIcon sx={{ fontSize: '1rem' }} />, color: '#16A34A' },
    warning: { icon: <WarningIcon sx={{ fontSize: '1rem' }} />, color: '#F59E0B' },
    info: { icon: <InfoIcon sx={{ fontSize: '1rem' }} />, color: '#3B82F6' },
    active: { icon: <PlayArrowIcon sx={{ fontSize: '1rem' }} />, color: '#7C3AED' },
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Recent Activity</Typography>
        <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontSize: '0.75rem' }}>
          View all
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {recentActivity.map((item) => {
          const style = typeStyles[item.type] || typeStyles.info;
          return (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${style.color}10`,
                  color: style.color,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {style.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
                  {item.action}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }} noWrap>
                  {item.detail}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', flexShrink: 0 }}>
                {item.time}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// Main Mission Control Page
export default function MissionControl() {
  const todayMissions = missions.filter(m => m.status !== 'Completed').slice(0, 4);
  const activePilots = pilots.filter(p => p.availability !== 'Off Duty');
  const readyFleet = fleet.filter(d => d.status !== 'Maintenance').slice(0, 4);

  return (
    <Box>
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Row */}
      <StatsRow />

      {/* Main grid */}
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} lg={8}>
          {/* Today's Missions */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Today's Missions</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontSize: '0.75rem' }}>
                View all
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {todayMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </Box>
          </Paper>

          {/* Map Panel */}
          <MapPanel />

          {/* Fleet Status */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Fleet Status</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontSize: '0.75rem' }}>
                View all
              </Button>
            </Box>
            <Grid container spacing={2}>
              {readyFleet.map((drone) => (
                <Grid item xs={12} sm={6} key={drone.id}>
                  <FleetStatusCard drone={drone} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} lg={4}>
          {/* Weather */}
          <WeatherCard />

          {/* Pilots */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Pilot Schedule</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontSize: '0.75rem' }}>
                View all
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activePilots.map((pilot) => (
                <PilotCard key={pilot.id} pilot={pilot} compact />
              ))}
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Box sx={{ mt: 3 }}>
            <QuickActions />
          </Box>

          {/* Activity Feed */}
          <Box sx={{ mt: 3 }}>
            <ActivityFeed />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
