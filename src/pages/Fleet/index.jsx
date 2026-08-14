import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import EmptyState from '../../components/common/EmptyState';

const MotionBox = motion.create(Box);

export default function Fleet() {
  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Fleet</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aircraft management, maintenance, and readiness</Typography>
        </Box>
        <Paper sx={{ bgcolor: '#FFFFFF' }}>
          <EmptyState
            icon={<AirplanemodeActiveIcon />}
            title="No aircraft added yet"
            description="Fleet management including battery tracking, maintenance schedules, and firmware updates will be available in Sprint 4."
          />
        </Paper>
      </MotionBox>
    </Box>
  );
}
