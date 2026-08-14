import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Alert,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import BusinessIcon from '@mui/icons-material/Business';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PublicIcon from '@mui/icons-material/Public';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { useAuth } from '../../hooks/useAuth';
import { createCompany } from '../../services/companyService';

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

export default function CompanySetup() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    country: 'South Africa',
    province: '',
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);

    try {
      await createCompany(user.id, formData);
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 560 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'text.primary',
            }}
          >
            FLY
            <Box component="span" sx={{ color: 'primary.main' }}>BY</Box>
          </Typography>
          <Typography
            sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', color: 'text.tertiary', textTransform: 'uppercase', mt: 0.5 }}
          >
            by Feldrix
          </Typography>
        </Box>

        <Paper sx={{ p: { xs: 3, md: 5 }, bgcolor: '#FFFFFF' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>Set up your company</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
              Tell us about your drone operations company. This information helps us configure
              Mission Control for your team.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.companyName}
              onChange={handleChange('companyName')}
              placeholder="e.g. FlyBy Operations"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Company Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="info@company.co.za"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="082 555 1234"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={handleChange('country')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                select
                label="Province / State"
                value={formData.province}
                onChange={handleChange('province')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">Select province</MenuItem>
                {SOUTH_AFRICAN_PROVINCES.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'Creating company...' : 'Complete Setup'}
            </Button>
          </Box>
        </Paper>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: 'text.tertiary' }}>
          FlyBy by Feldrix &copy; {new Date().getFullYear()}
        </Typography>
      </motion.div>
    </Box>
  );
}
