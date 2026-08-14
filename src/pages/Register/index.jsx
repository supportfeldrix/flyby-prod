import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { signUp } from '../../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await signUp({ email, password, fullName });

      // If email confirmation is required, show success message
      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists.');
      } else if (data?.user && !data?.session) {
        // Email confirmation required
        setSuccess(true);
      } else {
        // Auto-confirmed — redirect to company setup
        navigate('/company-setup', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', maxWidth: 440 }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              bgcolor: 'rgba(22, 163, 74, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" sx={{ mb: 1.5 }}>Check your email</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
            We've sent a verification link to <strong>{email}</strong>.
            Click the link to activate your account, then return to sign in.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
          >
            Back to Sign In
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          flex: { xs: '0 0 160px', md: 1 },
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0B1120 0%, #1A2332 40%, #0F172A 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle, #16A34A 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22, 163, 74, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1, padding: '48px', maxWidth: 460 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              FLY
              <Box component="span" sx={{ color: '#22C55E' }}>BY</Box>
            </Typography>
            <Typography
              sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', mt: 0.5 }}
            >
              by Feldrix
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
            Start your drone operations
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Create your account and set up your company to access Mission Control, flight planning, fleet management, and weather intelligence.
          </Typography>
        </motion.div>
      </Box>

      {/* Right Panel — Register Form */}
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
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1, color: 'text.primary' }}>
              Create your account
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Register to get started with FlyBy
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tienie van Rooyen"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@company.co.za"
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
              placeholder="Minimum 6 characters"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: '1.2rem' }} /> : <VisibilityOutlinedIcon sx={{ fontSize: '1.2rem' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: 'text.tertiary' }}>
            FlyBy by Feldrix &copy; {new Date().getFullYear()}
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}
