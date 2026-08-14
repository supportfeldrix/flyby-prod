import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{
        textAlign: 'center',
        py: { xs: 6, md: 8 },
        px: 3,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            bgcolor: 'rgba(22, 163, 74, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            color: 'primary.main',
            '& svg': { fontSize: '1.8rem' },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: actionLabel ? 3 : 0, maxWidth: 360, mx: 'auto' }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} size="large">
          {actionLabel}
        </Button>
      )}
    </MotionBox>
  );
}
