import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getPayments, recordPayment } from '../../services/paymentService';
import { getInvoices } from '../../services/invoiceService';

const methodColors = {
  EFT: '#2563EB', Cash: '#16A34A', Card: '#7C3AED', Cheque: '#D97706', Other: '#64748B',
};

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentsTab() {
  const { company, profile } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({ invoice_id: '', amount: '', payment_method: 'EFT', payment_date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const data = await getPayments(company.id);
      setPayments(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, showToast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const openDialog = async () => {
    try {
      const inv = await getInvoices(company.id, { status: undefined });
      setInvoices(inv.filter(i => ['Sent', 'Viewed', 'Partial', 'Overdue'].includes(i.status)));
    } catch (err) { /* ignore */ }
    setForm({ invoice_id: '', amount: '', payment_method: 'EFT', payment_date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.invoice_id || !form.amount) { showToast('Select an invoice and enter amount', 'error'); return; }
    setSubmitting(true);
    try {
      const selectedInv = invoices.find(i => i.id === form.invoice_id);
      await recordPayment({ ...form, customer_id: selectedInv?.customer_id }, company.id, profile?.id, profile?.full_name);
      showToast('Payment recorded');
      setDialogOpen(false);
      fetchPayments();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openDialog} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          Record Payment
        </Button>
      </Box>

      {!loading && payments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PaymentsIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1 }} />
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>No payments recorded</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>Record payments against invoices to track revenue</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {payments.map(p => (
            <Paper key={p.id} sx={{ p: 2, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(22,163,74,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PaymentsIcon sx={{ fontSize: '1rem', color: '#16A34A' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.invoices?.invoice_number || '—'}</Typography>
                    <Chip label={p.payment_method} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: `${methodColors[p.payment_method] || '#64748B'}12`, color: methodColors[p.payment_method] || '#64748B' }} />
                    <Chip label={p.status} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: p.status === 'Paid' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)', color: p.status === 'Paid' ? '#16A34A' : '#D97706' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
                    {p.customers?.customer_name || '—'} • {formatDate(p.payment_date)}{p.reference ? ` • Ref: ${p.reference}` : ''}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#16A34A' }}>{formatCurrency(p.amount)}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Invoice" value={form.invoice_id} onChange={e => setForm(f => ({ ...f, invoice_id: e.target.value }))}>
                {invoices.map(inv => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {inv.customers?.customer_name || '—'} — Due: {formatCurrency(inv.balance_due)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Amount (R)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Method" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                {['EFT', 'Cash', 'Card', 'Cheque', 'Other'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Payment Date" type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Reference" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Recording...' : 'Record Payment'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
