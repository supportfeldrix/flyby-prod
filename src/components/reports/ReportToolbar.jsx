import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import { downloadPDF, printReport } from '../../services/pdfReportService';
import { formatReportDate } from '../../services/reportTemplateService';

/**
 * Report toolbar — sits at the top of MissionReportPreview.
 * Provides Download PDF, Print, and future Email Customer actions.
 */
export default function ReportToolbar({ report, onClose, onRegenerate }) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!report) return null;

  const rd = report.report_data;

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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left — Report info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onClose} size="small" sx={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: '8px' }}>
          <CloseIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.primary' }}>
              Mission Report
            </Typography>
            <Chip
              label={rd?.generated?.report_number || report.report_number}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: 'rgba(22,163,74,0.08)',
                color: '#16A34A',
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
            {rd?.mission?.mission_number} • {formatReportDate(report.generated_at)}
          </Typography>
        </Box>
      </Box>

      {/* Right — Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Regenerate */}
        {onRegenerate && (
          <Tooltip title="Regenerate Report" arrow>
            <IconButton
              onClick={onRegenerate}
              size="small"
              sx={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: '8px' }}
            >
              <RefreshIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Email Customer — future placeholder */}
        <Tooltip title="Email Customer — Coming Soon" arrow>
          <span>
            <IconButton
              disabled
              size="small"
              sx={{ border: '1px solid rgba(15,23,42,0.06)', borderRadius: '8px', opacity: 0.4 }}
            >
              <EmailIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Print */}
        <Button
          variant="outlined"
          size="small"
          startIcon={printing ? <CircularProgress size={14} /> : <PrintIcon />}
          onClick={handlePrint}
          disabled={printing}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            borderColor: 'rgba(15,23,42,0.12)',
            color: 'text.primary',
            px: 2,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(22,163,74,0.04)' },
          }}
        >
          Print
        </Button>

        {/* Download PDF */}
        <Button
          variant="contained"
          size="small"
          startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            px: 2,
          }}
        >
          Download PDF
        </Button>
      </Box>
    </Box>
  );
}
