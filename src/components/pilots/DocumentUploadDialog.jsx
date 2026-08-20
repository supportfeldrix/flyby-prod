import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  uploadDocument,
  replaceDocument as replaceDocumentService,
  DOCUMENT_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  getDocumentTypeLabel,
} from '../../services/pilotDocumentService';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Document upload dialog with drag & drop, file selection, and metadata fields.
 */
export default function DocumentUploadDialog({ open, onClose, onComplete, pilot, documentType, replaceDocument }) {
  const { company, profile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState(documentType || '');
  const [docName, setDocName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isReplace = !!replaceDocument;

  // Reset form when dialog opens
  const handleEnter = () => {
    setFile(null);
    setDocType(documentType || replaceDocument?.document_type || '');
    setDocName(replaceDocument?.document_name || '');
    setIssueDate(replaceDocument?.issue_date || '');
    setExpiryDate(replaceDocument?.expiry_date || '');
    setNotes(replaceDocument?.notes || '');
    setDragOver(false);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      showToast('Unsupported file type. Use PDF, PNG, or JPG.', 'error');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      showToast('File too large. Maximum 25 MB.', 'error');
      return;
    }
    setFile(selectedFile);
    if (!docName) setDocName(getDocumentTypeLabel(docType || documentType || ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleSubmit = async () => {
    if (!file) { showToast('Please select a file', 'error'); return; }
    if (!docType && !isReplace) { showToast('Please select document type', 'error'); return; }

    setUploading(true);
    try {
      if (isReplace) {
        await replaceDocumentService(replaceDocument.id, {
          file,
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          notes: notes || null,
          userId: profile?.id,
          userName: profile?.full_name,
        });
        showToast('Document replaced');
      } else {
        await uploadDocument({
          file,
          pilotId: pilot.id,
          companyId: company.id,
          documentType: docType,
          documentName: docName || getDocumentTypeLabel(docType),
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          notes: notes || null,
          userId: profile?.id,
          userName: profile?.full_name,
        });
        showToast('Document uploaded');
      }
      onComplete?.();
    } catch (err) {
      const msg = err.message?.includes('Bucket not found') || err.message?.includes('bucket')
        ? 'Storage bucket "pilot-documents" not found. Create it in Supabase Dashboard → Storage.'
        : err.message;
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleEnter }}
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
        {isReplace ? 'Replace Document' : 'Upload Document'}
      </DialogTitle>
      <DialogContent>
        {/* Drag & Drop Zone */}
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragOver ? '#16A34A' : file ? 'rgba(22,163,74,0.3)' : 'rgba(15,23,42,0.12)'}`,
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragOver ? 'rgba(22,163,74,0.04)' : file ? 'rgba(22,163,74,0.02)' : 'transparent',
            transition: 'all 0.2s ease',
            mb: 3,
            '&:hover': { borderColor: '#16A34A', bgcolor: 'rgba(22,163,74,0.04)' },
          }}
        >
          {file ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <InsertDriveFileIcon sx={{ color: '#16A34A' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{file.name}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{formatFileSize(file.size)}</Typography>
              </Box>
              <Chip label="Change" size="small" sx={{ fontSize: '0.65rem', height: 22 }} />
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>
                Drag & drop or click to browse
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mt: 0.5 }}>
                PDF, PNG, JPG — Max 25 MB
              </Typography>
            </>
          )}
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />

        {/* Form Fields */}
        <Grid container spacing={2}>
          {!isReplace && (
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Document Type"
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  if (!docName) setDocName(getDocumentTypeLabel(e.target.value));
                }}
              >
                {DOCUMENT_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label} {t.mandatory && <Chip label="Required" size="small" sx={{ ml: 1, height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.08)', color: '#EF4444' }} />}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Document Name" value={docName} onChange={(e) => setDocName(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Notes" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={uploading || !file}
          sx={{ minWidth: 120 }}
        >
          {uploading ? 'Uploading...' : isReplace ? 'Replace' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
