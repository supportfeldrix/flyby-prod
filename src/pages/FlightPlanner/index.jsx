import { Box, Typography, Paper, Grid, Button, Chip, TextField, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import MissionCard from '../../components/cards/MissionCard';
import { missions } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function FlightPlanner() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Flight Planner</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Plan, schedule, and manage all spray missions
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            New Mission
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterListIcon sx={{ color: 'text.tertiary' }} />
            <TextField
              select
              size="small"
              label="Status"
              defaultValue="all"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Pilot"
              defaultValue="all"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All Pilots</MenuItem>
              <MenuItem value="tienie">Tienie van Rooyen</MenuItem>
              <MenuItem value="johan">Johan Pretorius</MenuItem>
              <MenuItem value="riaan">Riaan Botha</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Priority"
              defaultValue="all"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* Mission list */}
        <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              All Missions
              <Chip label={missions.length} size="small" sx={{ ml: 1.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </Box>
        </Paper>
      </MotionBox>
    </Box>
  );
}
