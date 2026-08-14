import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import MapIcon from '@mui/icons-material/Map';
import EmptyState from '../../components/common/EmptyState';

const MotionBox = motion.create(Box);

export default function FlightPlanner() {
  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Flight Planner</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Plan, schedule, and manage spray missions</Typography>
        </Box>
        <Paper sx={{ bgcolor: '#FFFFFF' }}>
          <EmptyState
            icon={<MapIcon />}
            title="Flight planning coming soon"
            description="Mission planning and scheduling will be available in Sprint 4. Add customers, farms, and fields first to prepare."
          />
        </Paper>
      </MotionBox>
    </Box>
  );
}
