import { Box, Typography, Grid, Button } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import PilotCard from '../../components/cards/PilotCard';
import { pilots } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function Pilots() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Pilots</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage pilot roster, licences, and scheduling
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add Pilot
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {pilots.map((pilot, i) => (
            <Grid item xs={12} sm={6} lg={4} key={pilot.id}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PilotCard pilot={pilot} />
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>
    </Box>
  );
}
