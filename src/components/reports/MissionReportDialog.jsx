import { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GrassIcon from '@mui/icons-material/Grass';
import CloudIcon from '@mui/icons-material/Cloud';
import { downloadPDF, printReport } from '../../services/pdfReportService';
import { formatDuration, formatArea } from '../../services/reportTemplateService';

/**
 * Premium Mission Completion Dialog
 * 
 * Shown immediately after a mission is completed.
 * Displays mission success stats and provides report actions.
 */
export default function MissionReportDialog({ open, onClose, report, onPreview }) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!report) return null;

  const rd = report.report_data;
  const mission = rd?.mission;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      downloadPDF(rd, report.filename);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      printReport(rd);
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          maxWidth: 480,
        },
      }}
    >
      {/* Success Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
          px: 4,
          pt: 4,
          pb: 3,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
        >
          <CloseIcon />
        </IconButton>

        {/* Success icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>

        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', mb: 0.5 }}>
          Mission Completed Successfully
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
          {mission?.mission_number}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ px: 4, py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mb: 3,
          }}
        >
          {/* Area Sprayed */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(22,163,74,0.04)',
              border: '1px solid rgba(22,163,74,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <GrassIcon sx={{ fontSize: '0.9rem', color: '#16A34A' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Area Sprayed
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: 'text.primary' }}>
              {formatArea(mission?.actual_area || mission?.estimated_area)}
            </Typography>
          </Box>

          {/* Duration */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(37,99,235,0.04)',
              border: '1px solid rgba(37,99,235,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: '0.9rem', color: '#2563EB' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Duration
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: 'text.primary' }}>
              {formatDuration(mission?.actual_duration)}
            </Typography>
          </Box>

          {/* Aircraft */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(15,23,42,0.02)',
              border: '1px solid rgba(15,23,42,0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <FlightTakeoffIcon sx={{ fontSize: '0.9rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Aircraft
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.primary' }}>
              {rd?.aircraft?.name || '—'}
            </Typography>
          </Box>

          {/* Weather */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(15,23,42,0.02)',
              border: '1px solid rgba(15,23,42,0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CloudIcon sx={{ fontSize: '0.9rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Weather
              </Typography>
            </Box>
            <Chip
              label={rd?.weather?.risk_level || 'Good'}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: rd?.weather?.risk_level === 'High' ? 'rgba(239,68,68,0.08)' :
                         rd?.weather?.risk_level === 'Medium' ? 'rgba(245,158,11,0.08)' : 'rgba(22,163,74,0.08)',
                color: rd?.weather?.risk_level === 'High' ? '#EF4444' :
                       rd?.weather?.risk_level === 'Medium' ? '#D97706' : '#16A34A',
              }}
            />
          </Box>
        </Box>

        {/* Report Generated Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
            py: 1.5,
            borderRadius: '10px',
            bgcolor: 'rgba(22,163,74,0.04)',
            border: '1px solid rgba(22,163,74,0.1)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#16A34A' }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#16A34A' }}>
            Mission Report Generated — {report.report_number}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<VisibilityIcon />}
            onClick={() => onPreview?.(report)}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              fontWeight: 700,
              fontSize: '0.9rem',
              textTransform: 'none',
            }}
          >
            Preview Mission Report
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{
                flex: 1,
                borderRadius: '12px',
                py: 1.2,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                borderColor: 'rgba(15,23,42,0.12)',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(22,163,74,0.04)' },
              }}
            >
              Download PDF
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={printing ? <CircularProgress size={16} /> : <PrintIcon />}
              onClick={handlePrint}
              disabled={printing}
              sx={{
                flex: 1,
                borderRadius: '12px',
                py: 1.2,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                borderColor: 'rgba(15,23,42,0.12)',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(22,163,74,0.04)' },
              }}
            >
              Print Report
            </Button>
          </Box>

          <Button
            onClick={onClose}
            sx={{
              borderRadius: '12px',
              py: 1.2,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(15,23,42,0.04)' },
            }}
          >
            Return to Mission Control
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
