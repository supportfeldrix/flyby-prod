import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getDocumentTypeLabel, getDaysRemaining } from '../../services/pilotDocumentService';

const statusConfig = {
  valid: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', label: 'Valid', icon: CheckCircleIcon },
  expiring_soon: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Expiring Soon', icon: WarningAmberIcon },
  expired: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Expired', icon: ErrorIcon },
  not_uploaded: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', label: 'Not Uploaded', icon: CloudUploadIcon },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Premium document card showing document status, dates, and actions.
 */
export default function DocumentCard({ document, onPreview, onDownload, onReplace, onDelete, onUpload }) {
  const isUploaded = !!document;
  const status = isUploaded ? document.status : 'not_uploaded';
  const config = statusConfig[status] || statusConfig.not_uploaded;
  const StatusIcon = config.icon;
  const daysRemaining = isUploaded && document.expiry_date ? getDaysRemaining(document.expiry_date) : null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '14px',
        border: `1px solid ${isUploaded ? 'rgba(15,23,42,0.06)' : 'rgba(15,23,42,0.08)'}`,
        bgcolor: isUploaded ? '#FFFFFF' : '#FAFBFC',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          borderColor: isUploaded ? config.color + '30' : 'rgba(22,163,74,0.2)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Status Icon */}
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '11px',
            bgcolor: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isUploaded ? (
            <StatusIcon sx={{ fontSize: '1.2rem', color: config.color }} />
          ) : (
            <DescriptionIcon sx={{ fontSize: '1.2rem', color: '#94A3B8' }} />
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>
              {isUploaded ? document.document_name : getDocumentTypeLabel(document?.document_type || '')}
            </Typography>
            <Chip
              label={config.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                fontWeight: 700,
                bgcolor: config.bg,
                color: config.color,
              }}
            />
          </Box>

          {/* Details */}
          {isUploaded ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Uploaded</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>{formatDate(document.uploaded_at)}</Typography>
              </Box>
              {document.expiry_date && (
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expiry</Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: status === 'expired' ? '#EF4444' : status === 'expiring_soon' ? '#D97706' : 'text.secondary' }}>
                    {formatDate(document.expiry_date)}
                  </Typography>
                </Box>
              )}
              {daysRemaining !== null && (
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Days Left</Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: daysRemaining < 0 ? '#EF4444' : daysRemaining <= 30 ? '#D97706' : '#16A34A' }}>
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>File</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{document.file_name} • {formatFileSize(document.file_size)}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', mt: 0.5 }}>
              No document uploaded. Click to upload.
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {isUploaded ? (
            <>
              <Tooltip title="Preview" arrow>
                <IconButton size="small" onClick={() => onPreview?.(document)}>
                  <VisibilityIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download" arrow>
                <IconButton size="small" onClick={() => onDownload?.(document)}>
                  <DownloadIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Replace" arrow>
                <IconButton size="small" onClick={() => onReplace?.(document)}>
                  <SwapHorizIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" arrow>
                <IconButton size="small" onClick={() => onDelete?.(document)}>
                  <DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Upload Document" arrow>
              <IconButton size="small" onClick={() => onUpload?.()}>
                <CloudUploadIcon sx={{ fontSize: '1.1rem', color: '#16A34A' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}
