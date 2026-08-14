import { Box, Typography, Paper, Grid, Chip, Button } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import GrassIcon from '@mui/icons-material/Grass';
import { fields } from '../../data/mockData';

const MotionBox = motion.create(Box);

const statusStyles = {
  'Active': { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  'In Progress': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  'Scheduled': { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
  'Completed': { color: '#64748B', bg: 'rgba(15, 23, 42, 0.06)' },
};

export default function Fields() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Fields</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage farm fields and spray zones
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add Field
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {fields.map((field, i) => {
            const style = statusStyles[field.status] || statusStyles.Active;
            return (
              <Grid item xs={12} sm={6} md={4} key={field.id}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Paper
                    sx={{
                      p: 2.5,
                      bgcolor: '#FFFFFF',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(22, 163, 74, 0.08)',
                          color: 'primary.main',
                        }}
                      >
                        <GrassIcon />
                      </Box>
                      <Chip
                        label={field.status}
                        size="small"
                        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 0.5 }}>{field.name}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5 }}>{field.farm}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Crop</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{field.crop}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Area</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{field.area} ha</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </MotionBox>
              </Grid>
            );
          })}
        </Grid>
      </MotionBox>
    </Box>
  );
}
