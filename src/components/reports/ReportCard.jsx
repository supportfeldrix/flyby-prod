import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  getReportSummary,
  getReportStatusStyle,
  formatReportDate,
  formatReportTime,
  formatDuration,
  formatArea,
} from '../../services/reportTemplateService';

const MotionBox = motion.create(Box);

/**
 * Report card component for the reports listing page.
 * Displays key mission info, report number, and quick actions.
 */
export default function ReportCard({ report, index = 0, onPreview, onDownload, onDelete }) {
  const summary = getReportSummary(report);
  const statusStyle = getReportStatusStyle(report.status);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid rgba(15,23,42,0.04)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            transform: 'translateY(-1px)',
            borderColor: 'rgba(22,163,74,0.15)',
          },
        }}
        onClick={() => onPreview?.(report)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Report icon */}
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              bgcolor: 'rgba(22,163,74,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FlightTakeoffIcon sx={{ fontSize: '1.2rem', color: '#16A34A' }} />
          </Box>

          {/* Main info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'text.primary' }}>
                {summary.missionNumber || '—'}
              </Typography>
              <Chip
                label={report.report_number}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(22,163,74,0.06)',
                  color: '#16A34A',
                }}
              />
              <Chip
                label={statusStyle.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {[summary.customer, summary.farm, summary.field].filter(Boolean).join(' • ') || 'No details'}
            </Typography>
          </Box>

          {/* Meta column */}
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mb: 0.5 }}>
              <PersonIcon sx={{ fontSize: '0.7rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.primary' }}>
                {summary.pilot || '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: '0.7rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                {formatReportDate(summary.date)}
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            {summary.area && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>
                  {formatArea(summary.area)}
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>
                  Area
                </Typography>
              </Box>
            )}
            {summary.duration && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>
                  {formatDuration(summary.duration)}
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>
                  Duration
                </Typography>
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Preview Report" arrow>
              <IconButton size="small" onClick={() => onPreview?.(report)}>
                <VisibilityIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download PDF" arrow>
              <IconButton size="small" onClick={() => onDownload?.(report)}>
                <DownloadIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Report" arrow>
              <IconButton size="small" onClick={() => onDelete?.(report)}>
                <DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </MotionBox>
  );
}
