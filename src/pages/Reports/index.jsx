import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmptyState from '../../components/common/EmptyState';

const MotionBox = motion.create(Box);

export default function Reports() {
  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Reports</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Operations reports, compliance documents, and analytics</Typography>
        </Box>
        <Paper sx={{ bgcolor: '#FFFFFF' }}>
          <EmptyState
            icon={<AssessmentIcon />}
            title="No reports available"
            description="Operations reports, flight logs, and spray compliance records will be generated once missions are active."
          />
        </Paper>
      </MotionBox>
    </Box>
  );
}
