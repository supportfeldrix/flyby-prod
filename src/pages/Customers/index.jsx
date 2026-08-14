import { Box, Typography, Paper, Grid, Button, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { customers } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function Customers() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Customers</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage farm owners and spray clients
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add Customer
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {customers.map((customer, i) => (
            <Grid item xs={12} sm={6} lg={4} key={customer.id}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: '#FFFFFF',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'primary.main',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>{customer.name}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{customer.contact}</Typography>
                    </Box>
                    {customer.activeMissions > 0 && (
                      <Chip
                        label={`${customer.activeMissions} active`}
                        size="small"
                        sx={{ bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main', fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Farms</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{customer.farms}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Hectares</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{customer.totalHectares}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Missions</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{customer.activeMissions}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: '0.75rem', color: 'text.tertiary' }} />
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{customer.phone}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>
    </Box>
  );
}
