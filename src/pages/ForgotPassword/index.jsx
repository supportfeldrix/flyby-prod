import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { resetPassword } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
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
        {/* Back link */}
        <Link
          component={RouterLink}
          to="/login"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.85rem',
            color: 'text.secondary',
            mb: 4,
            fontWeight: 500,
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '1rem' }} />
          Back to Sign In
        </Link>

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
            <Typography variant="h4" sx={{ mb: 1.5 }}>Check your email</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
              We've sent password reset instructions to <strong>{email}</strong>.
              Check your inbox and follow the link to reset your password.
            </Typography>
            <Button component={RouterLink} to="/login" variant="contained" size="large">
              Back to Sign In
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h4" sx={{ mb: 1 }}>Forgot password?</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
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
