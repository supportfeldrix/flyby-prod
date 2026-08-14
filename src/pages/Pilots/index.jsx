import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import EmptyState from '../../components/common/EmptyState';

const MotionBox = motion.create(Box);

export default function Pilots() {
  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Pilots</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage pilot roster, licences, and scheduling</Typography>
        </Box>
        <Paper sx={{ bgcolor: '#FFFFFF' }}>
          <EmptyState
            icon={<PersonIcon />}
            title="No pilots added yet"
            description="Pilot management including licence tracking, flight hours, and scheduling will be available in Sprint 4."
          />
        </Paper>
      </MotionBox>
    </Box>
  );
}
