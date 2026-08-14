import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Full-screen loading indicator shown while auth state is being restored.
 */
export default function LoadingScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0B1120',
        gap: 3,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          sx={{
            fontSize: '1.8rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#FFFFFF',
            lineHeight: 1,
          }}
        >
          FLY
          <Box component="span" sx={{ color: '#22C55E' }}>
            BY
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            mt: 0.5,
          }}
        >
          by Feldrix
        </Typography>
      </Box>
      <CircularProgress
        size={28}
        thickness={4}
        sx={{
          color: '#22C55E',
        }}
      />
    </Box>
  );
}
