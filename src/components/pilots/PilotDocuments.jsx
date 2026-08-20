import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  getPilotDocuments,
  deleteDocument,
  downloadDocument,
  calculateCompliance,
} from '../../services/pilotDocumentService';
import DocumentCard from './DocumentCard';
import ComplianceSummary from './ComplianceSummary';
import DocumentUploadDialog from './DocumentUploadDialog';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import ConfirmDialog from '../common/ConfirmDialog';

/**
 * Complete pilot document management panel.
 * Replaces the old placeholder in the Pilots Documents tab.
 */
export default function PilotDocuments({ pilot }) {
  const { company, profile } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!pilot?.id) return;
    setLoading(true);
    try {
      const data = await getPilotDocuments(pilot.id);
      setDocuments(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [pilot?.id, showToast]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const compliance = calculateCompliance(documents);

  const handleDownload = async (doc) => {
    try {
      const url = await downloadDocument(doc.storage_path);
      window.open(url, '_blank');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      showToast('Document deleted');
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadForType = (type) => {
    setUploadType(type);
    setReplaceTarget(null);
    setUploadOpen(true);
  };

  const handleReplace = (doc) => {
    setReplaceTarget(doc);
    setUploadType(doc.document_type);
    setUploadOpen(true);
  };

  const handleUploadComplete = () => {
    setUploadOpen(false);
    setUploadType(null);
    setReplaceTarget(null);
    fetchDocuments();
  };

  return (
    <Box>
      {/* Compliance Summary */}
      <ComplianceSummary compliance={compliance} sx={{ mb: 3 }} />

      {/* Upload Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Documents
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleUploadForType(null)}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
        >
          Upload Document
        </Button>
      </Box>

      {/* Document Cards — only show uploaded documents */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.tertiary' }}>
              No documents uploaded yet. Click "Upload Document" to add compliance documents.
            </Typography>
          </Box>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPreview={(d) => setPreviewDoc(d)}
              onDownload={handleDownload}
              onReplace={handleReplace}
              onDelete={(d) => setDeleteTarget(d)}
              onUpload={() => handleUploadForType(doc.document_type)}
            />
          ))
        )}
      </Box>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); setReplaceTarget(null); }}
        onComplete={handleUploadComplete}
        pilot={pilot}
        documentType={uploadType}
        replaceDocument={replaceTarget}
      />

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Delete "${deleteTarget?.document_name}"? This will permanently remove the file.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
