import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, TextField, InputAdornment, MenuItem, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getInvoices, cancelInvoice, duplicateInvoice, updateInvoiceStatus } from '../../services/invoiceService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import InvoicePreviewDialog from './InvoicePreviewDialog';

const statusStyles = {
  Draft: { color: '#64748B', bg: 'rgba(15,23,42,0.06)' },
  Sent: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  Viewed: { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  Paid: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  Partial: { color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  Overdue: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  Cancelled: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
};

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoicesTab({ onGenerateInvoice }) {
  const { company, profile } = useAuth();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const data = await getInvoices(company.id, { status: statusFilter !== 'all' ? statusFilter : undefined, search: search.trim() || undefined });
      setInvoices(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, statusFilter, showToast]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelInvoice(cancelTarget.id);
      showToast('Invoice cancelled');
      setCancelTarget(null);
      fetchInvoices();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCancelling(false); }
  };

  const handleDuplicate = async (invoice) => {
    try {
      await duplicateInvoice(invoice.id, company.id, profile?.id, profile?.full_name);
      showToast('Invoice duplicated');
      fetchInvoices();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleMarkSent = async (invoice) => {
    try {
      await updateInvoiceStatus(invoice.id, 'Sent');
      showToast('Invoice marked as sent');
      fetchInvoices();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search invoices..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.1rem' }} /></InputAdornment> }}
        />
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}
        >
          <MenuItem value="all">All Status</MenuItem>
          {Object.keys(statusStyles).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onGenerateInvoice} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          Generate Invoice
        </Button>
      </Box>

      {/* Invoice List */}
      {!loading && invoices.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <ReceiptLongIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1 }} />
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>No invoices yet</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>Generate your first invoice from a completed mission</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {invoices.map(inv => {
            const style = statusStyles[inv.status] || statusStyles.Draft;
            return (
              <Paper key={inv.id} onClick={() => setPreviewInvoiceId(inv.id)} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderColor: 'rgba(22,163,74,0.15)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Invoice icon */}
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ReceiptLongIcon sx={{ fontSize: '1.1rem', color: style.color }} />
                  </Box>

                  {/* Main info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{inv.invoice_number}</Typography>
                      <Chip label={inv.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: style.bg, color: style.color }} />
                      {inv.missions?.mission_number && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>• {inv.missions.mission_number}</Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {inv.customers?.customer_name || 'No customer'} • {formatDate(inv.invoice_date)}
                    </Typography>
                  </Box>

                  {/* Amounts */}
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{formatCurrency(inv.total_amount)}</Typography>
                    {inv.balance_due > 0 && inv.status !== 'Draft' && (
                      <Typography sx={{ fontSize: '0.65rem', color: '#D97706', fontWeight: 600 }}>Due: {formatCurrency(inv.balance_due)}</Typography>
                    )}
                  </Box>

                  {/* Due date */}
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' }, minWidth: 80 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Due</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{formatDate(inv.due_date)}</Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                    {inv.status === 'Draft' && (
                      <Tooltip title="Mark as Sent" arrow>
                        <IconButton size="small" onClick={() => handleMarkSent(inv)}>
                          <ReceiptLongIcon sx={{ fontSize: '0.9rem', color: '#2563EB' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Duplicate" arrow>
                      <IconButton size="small" onClick={() => handleDuplicate(inv)}>
                        <ContentCopyIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                      </IconButton>
                    </Tooltip>
                    {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                      <Tooltip title="Cancel Invoice" arrow>
                        <IconButton size="small" onClick={() => setCancelTarget(inv)}>
                          <CancelIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Invoice"
        message={`Cancel invoice "${cancelTarget?.invoice_number}"? This cannot be undone.`}
        confirmLabel="Cancel Invoice"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={cancelling}
      />

      <InvoicePreviewDialog
        open={!!previewInvoiceId}
        onClose={() => { setPreviewInvoiceId(null); fetchInvoices(); }}
        invoiceId={previewInvoiceId}
        onVoid={(inv) => setCancelTarget(inv)}
        onRefresh={fetchInvoices}
      />
    </Box>
  );
}
