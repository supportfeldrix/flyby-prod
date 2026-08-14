import { Box, Typography, Grid, Button, Paper, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import FleetStatusCard from '../../components/cards/FleetStatusCard';
import { fleet } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function Fleet() {
  const ready = fleet.filter(d => d.status === 'Ready').length;
  const inMission = fleet.filter(d => d.status === 'In Mission').length;
  const maintenance = fleet.filter(d => d.status === 'Maintenance').length;

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Fleet</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Aircraft management, maintenance, and readiness
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add Aircraft
          </Button>
        </Box>

        {/* Fleet summary */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16A34A' }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Ready: {ready}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2563EB' }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>In Mission: {inMission}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Maintenance: {maintenance}</Typography>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={2.5}>
          {fleet.map((drone, i) => (
            <Grid item xs={12} sm={6} lg={4} key={drone.id}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <FleetStatusCard drone={drone} />
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>
    </Box>
  );
}
