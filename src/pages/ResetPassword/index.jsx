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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { updatePassword } from '../../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
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
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
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
        style={{ width: '100%', maxWidth: 420 }}
      >
        {success ? (
          <Box sx={{ textAlign: 'center' }}>
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
            <Typography variant="h4" sx={{ mb: 1.5 }}>Password updated</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
              Your password has been successfully reset. Redirecting you to sign in...
            </Typography>
            <Button component={RouterLink} to="/login" variant="contained" size="large">
              Sign In Now
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h4" sx={{ mb: 1 }}>Set new password</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
              Enter your new password below. Make sure it's at least 6 characters.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="New Password"
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
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
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
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </Box>
          </>
        )}

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 5, color: 'text.tertiary' }}>
          FlyBy by Feldrix &copy; {new Date().getFullYear()}
        </Typography>
      </motion.div>
    </Box>
  );
}
