import { useState, useEffect } from 'react';
import { Dialog, Box, Typography, IconButton, CircularProgress, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getDocumentPreviewUrl, downloadDocument, getDocumentTypeLabel } from '../../services/pilotDocumentService';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * In-browser document preview dialog for PDFs and images.
 */
export default function DocumentPreviewDialog({ open, onClose, document: doc }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !doc) return;
    setLoading(true);
    setError(null);
    getDocumentPreviewUrl(doc.storage_path)
      .then(setUrl)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, doc]);

  const handleDownload = async () => {
    try {
      const downloadUrl = await downloadDocument(doc.storage_path);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleOpenExternal = () => {
    if (url) window.open(url, '_blank');
  };

  if (!doc) return null;

  const isPDF = doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type?.startsWith('image/');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', height: '85vh', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)', flexShrink: 0 }}>
        <Box>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{doc.document_name}</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
            {getDocumentTypeLabel(doc.document_type)} • {doc.file_name} • Uploaded {formatDate(doc.uploaded_at)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenExternal}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            Open
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)' }}
          >
            Download
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: '#F1F5F9' }}>
        {loading && <CircularProgress size={32} sx={{ color: '#16A34A' }} />}
        {error && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 1 }}>Unable to load preview</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary' }}>{error}</Typography>
            <Button variant="outlined" size="small" onClick={handleDownload} sx={{ mt: 2, textTransform: 'none' }}>
              Download Instead
            </Button>
          </Box>
        )}
        {!loading && !error && url && isPDF && (
          <iframe
            src={url}
            title={doc.document_name}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
        {!loading && !error && url && isImage && (
          <Box sx={{ p: 3, maxHeight: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={url}
              alt={doc.document_name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            />
          </Box>
        )}
        {!loading && !error && url && !isPDF && !isImage && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 1 }}>Preview not available for this file type</Typography>
            <Button variant="contained" size="small" onClick={handleDownload} sx={{ textTransform: 'none' }}>
              Download File
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
