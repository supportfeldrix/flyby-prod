import { Box, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

/**
 * Displays pilot compliance summary — X of Y documents valid + overall status.
 */
export default function ComplianceSummary({ compliance, sx = {} }) {
  if (!compliance) return null;

  const { compliant, validCount, totalMandatory, totalDocuments, validDocuments, expiredDocuments, expiringDocuments } = compliance;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '14px',
        border: `1px solid ${compliant ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)'}`,
        bgcolor: compliant ? 'rgba(22,163,74,0.02)' : 'rgba(239,68,68,0.02)',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left — Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: compliant ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {compliant ? (
              <VerifiedUserIcon sx={{ fontSize: '1.3rem', color: '#16A34A' }} />
            ) : (
              <ErrorIcon sx={{ fontSize: '1.3rem', color: '#EF4444' }} />
            )}
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>
              Pilot Compliance
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {validCount} of {totalMandatory} mandatory documents valid
            </Typography>
          </Box>
        </Box>

        {/* Right — Overall Badge */}
        <Chip
          icon={compliant ? <CheckCircleIcon /> : <ErrorIcon />}
          label={compliant ? 'Compliant' : 'Non-Compliant'}
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 30,
            bgcolor: compliant ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
            color: compliant ? '#16A34A' : '#EF4444',
            '& .MuiChip-icon': { color: compliant ? '#16A34A' : '#EF4444' },
          }}
        />
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 3, mt: 2, pt: 2, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CheckCircleIcon sx={{ fontSize: '0.8rem', color: '#16A34A' }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
            {validDocuments} valid
          </Typography>
        </Box>
        {expiringDocuments > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <WarningAmberIcon sx={{ fontSize: '0.8rem', color: '#D97706' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#D97706' }}>
              {expiringDocuments} expiring
            </Typography>
          </Box>
        )}
        {expiredDocuments > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ErrorIcon sx={{ fontSize: '0.8rem', color: '#EF4444' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#EF4444' }}>
              {expiredDocuments} expired
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
          {totalDocuments} total document{totalDocuments !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
}
