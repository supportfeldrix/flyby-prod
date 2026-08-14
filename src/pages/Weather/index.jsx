import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import CloudIcon from '@mui/icons-material/Cloud';
import EmptyState from '../../components/common/EmptyState';

const MotionBox = motion.create(Box);

export default function Weather() {
  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Weather Intelligence</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Real-time weather conditions and spray window analysis</Typography>
        </Box>
        <Paper sx={{ bgcolor: '#FFFFFF' }}>
          <EmptyState
            icon={<CloudIcon />}
            title="Weather intelligence coming soon"
            description="Live weather data, spray window analysis, and 5-day forecasts will be available in a future sprint."
          />
        </Paper>
      </MotionBox>
    </Box>
  );
}
