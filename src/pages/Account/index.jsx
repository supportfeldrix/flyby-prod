import { Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import FlightIcon from '@mui/icons-material/Flight';
import VerifiedIcon from '@mui/icons-material/Verified';
import { currentPilot } from '../../data/mockData';

const MotionBox = motion.create(Box);

export default function Account() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Account</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage your profile and settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#FFFFFF' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {currentPilot.initials}
              </Avatar>
              <Typography variant="h5" sx={{ mb: 0.5 }}>{currentPilot.name}</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>{currentPilot.role}</Typography>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: '0.9rem' }} />}
                label="Licensed Pilot"
                size="small"
                sx={{
                  bgcolor: 'rgba(22, 163, 74, 0.08)',
                  color: 'success.main',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'success.main' },
                }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 0.5 }}>Email</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{currentPilot.email}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 0.5 }}>Licence Number</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{currentPilot.licenceNumber}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 0.5 }}>Total Flight Hours</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentPilot.totalFlightHours}h</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Settings */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, bgcolor: '#FFFFFF', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Profile Settings</Typography>
                <Button variant="outlined" startIcon={<EditIcon />} size="small">
                  Edit
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name" defaultValue={currentPilot.name} size="small" disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Call Sign" defaultValue={currentPilot.callSign} size="small" disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" defaultValue={currentPilot.email} size="small" disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company" defaultValue={currentPilot.company} size="small" disabled />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 4, bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Licence Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(22, 163, 74, 0.04)', border: '1px solid rgba(22, 163, 74, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <BadgeIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>RPL Status</Typography>
                    </Box>
                    <Chip label="Valid" size="small" sx={{ bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main', fontWeight: 600 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1 }}>
                      Expires: {currentPilot.licenceExpiry}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <FlightIcon sx={{ color: 'info.main', fontSize: '1.2rem' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Flight Hours</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'info.main' }}>
                      {currentPilot.totalFlightHours}h
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                      Commercial RPL Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </MotionBox>
    </Box>
  );
}
