import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import RouteIcon from '@mui/icons-material/Route';
import CloudIcon from '@mui/icons-material/Cloud';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { signIn } from '../../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please try again.'
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <RouteIcon />, text: 'Mission Planning' },
    { icon: <CloudIcon />, text: 'Weather Intelligence' },
    { icon: <AgricultureIcon />, text: 'Precision Spraying' },
    { icon: <FlightTakeoffIcon />, text: 'Professional Drone Operations' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left Panel — Cinematic Hero */}
      <Box
        sx={{
          flex: { xs: '0 0 200px', md: 1 },
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0B1120 0%, #1A2332 40%, #0F172A 100%)',
        }}
      >
        {/* Subtle grid pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle, #16A34A 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Green glow orb */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22, 163, 74, 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'relative', zIndex: 1, padding: '48px', maxWidth: 500 }}
        >
          {/* Logo */}
          <Box sx={{ mb: 6 }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              FLY
              <Box component="span" sx={{ color: '#22C55E' }}>
                BY
              </Box>
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                mt: 0.5,
              }}
            >
              by Feldrix
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              mb: 5,
              lineHeight: 1.6,
            }}
          >
            Precision Agriculture from Above
          </Typography>

          {/* Feature list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(22, 163, 74, 0.1)',
                      border: '1px solid rgba(22, 163, 74, 0.2)',
                      color: '#22C55E',
                      fontSize: '1.2rem',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.75)',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                    }}
                  >
                    {feature.text}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Box>

      {/* Right Panel — Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 520px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          background: '#FFFFFF',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, color: 'text.primary' }}>
              Welcome back
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Sign in to Mission Control
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@flybyops.co.za"
              required
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
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    size="small"
                    sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                underline="hover"
                sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'primary.main' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  underline="hover"
                  sx={{ fontWeight: 600, color: 'primary.main' }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 4, color: 'text.tertiary' }}
          >
            FlyBy by Feldrix &copy; {new Date().getFullYear()}
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}
