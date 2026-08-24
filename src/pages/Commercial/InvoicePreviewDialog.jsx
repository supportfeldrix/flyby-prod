import { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsIcon from '@mui/icons-material/Payments';
import EmailIcon from '@mui/icons-material/Email';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../hooks/useAuth';
import { getInvoiceById } from '../../services/invoiceService';
import { getCommercialSettings } from '../../services/commercialService';
import jsPDF from 'jspdf';

const statusStyles = {
  Draft: { color: '#64748B', bg: 'rgba(15,23,42,0.06)' },
  Sent: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  Viewed: { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  Paid: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  Partial: { color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  Overdue: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  Cancelled: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
};

function formatCurrency(amount, symbol = 'R') {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Professional Invoice Preview Dialog with full document layout.
 */
export default function InvoicePreviewDialog({ open, onClose, invoiceId, onRecordPayment, onVoid, onRefresh }) {
  const { company } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !invoiceId) return;
    setLoading(true);
    Promise.all([
      getInvoiceById(invoiceId),
      company?.id ? getCommercialSettings(company.id) : Promise.resolve(null),
    ]).then(([inv, s]) => {
      setInvoice(inv);
      setSettings(s);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [open, invoiceId, company?.id]);

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const sym = settings?.currency_symbol || 'R';

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FLY', 20, 22);
    doc.setTextColor(22, 163, 74);
    doc.text('BY', 20 + doc.getTextWidth('FLY'), 22);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Smart Drone Operations', 20, 28);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 20, 38);
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(invoice.invoice_number, 190, 22, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(formatDate(invoice.invoice_date), 190, 28, { align: 'right' });

    let y = 55;

    // Customer & Mission
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO', 20, y);
    doc.text('MISSION', 110, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customers?.customer_name || '—', 20, y);
    doc.text(invoice.missions?.mission_number || '—', 110, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    if (invoice.customers?.contact_person) { doc.text(invoice.customers.contact_person, 20, y); y += 4; }
    if (invoice.customers?.email) { doc.text(invoice.customers.email, 20, y); y += 4; }

    y = Math.max(y, 78);
    // Dates
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('INVOICE DATE', 20, y); doc.text('DUE DATE', 80, y); doc.text('STATUS', 140, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.invoice_date), 20, y);
    doc.text(formatDate(invoice.due_date), 80, y);
    doc.text(invoice.status, 140, y);
    y += 12;

    // Line items header
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y - 2, 170, 8, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 22, y + 3);
    doc.text('QTY', 110, y + 3);
    doc.text('UNIT PRICE', 130, y + 3);
    doc.text('AMOUNT', 170, y + 3, { align: 'right' });
    y += 10;

    // Line items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    (invoice.invoice_items || []).forEach(item => {
      doc.text((item.description || '').substring(0, 50), 22, y);
      doc.text(`${item.quantity} ${item.unit || ''}`, 110, y);
      doc.text(`${sym} ${Number(item.unit_price).toFixed(2)}`, 130, y);
      doc.text(`${sym} ${Number(item.amount).toFixed(2)}`, 170, y, { align: 'right' });
      y += 6;
    });

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(100, y, 190, y);
    y += 6;

    // Totals
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', 130, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sym} ${Number(invoice.subtotal).toFixed(2)}`, 190, y, { align: 'right' });
    y += 6;
    if (Number(invoice.vat_amount) > 0) {
      doc.setTextColor(100, 116, 139);
      doc.text(`VAT (${invoice.vat_percentage || 15}%)`, 130, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`${sym} ${Number(invoice.vat_amount).toFixed(2)}`, 190, y, { align: 'right' });
      y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL', 130, y + 2);
    doc.setTextColor(22, 163, 74);
    doc.text(`${sym} ${Number(invoice.total_amount).toFixed(2)}`, 190, y + 2, { align: 'right' });
    y += 12;

    if (Number(invoice.amount_paid) > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Amount Paid', 130, y);
      doc.setTextColor(22, 163, 74);
      doc.text(`${sym} ${Number(invoice.amount_paid).toFixed(2)}`, 190, y, { align: 'right' });
      y += 6;
      doc.setTextColor(100, 116, 139);
      doc.text('Balance Due', 130, y);
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${sym} ${Number(invoice.balance_due).toFixed(2)}`, 190, y, { align: 'right' });
      y += 10;
    }

    // Banking details
    if (settings?.bank_name) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('BANKING DETAILS', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${settings.bank_name}`, 20, y); y += 4;
      if (settings.bank_account_name) { doc.text(`Account: ${settings.bank_account_name}`, 20, y); y += 4; }
      if (settings.bank_account_number) { doc.text(`Number: ${settings.bank_account_number}`, 20, y); y += 4; }
      if (settings.bank_branch_code) { doc.text(`Branch: ${settings.bank_branch_code}`, 20, y); y += 4; }
      if (settings.bank_reference) { doc.text(`Reference: ${settings.bank_reference}`, 20, y); y += 4; }
    }

    // Notes & Footer
    if (invoice.notes) {
      y += 6;
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('NOTES', 20, y); y += 4;
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const noteLines = doc.splitTextToSize(invoice.notes, 170);
      doc.text(noteLines, 20, y); y += noteLines.length * 4;
    }

    // Footer
    const footerY = 280;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY - 4, 190, footerY - 4);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('FlyBy by Feldrix • Smart Drone Operations • www.feldrix.com', 20, footerY);
    doc.text(invoice.invoice_number, 190, footerY, { align: 'right' });

    doc.save(`${invoice.invoice_number}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice && !loading) return null;

  const style = statusStyles[invoice?.status] || statusStyles.Draft;
  const sym = settings?.currency_symbol || 'R';

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: '#F1F5F9' } }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, bgcolor: '#FFFFFF', borderBottom: '1px solid rgba(15,23,42,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onClose} size="small" sx={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: '8px' }}>
            <CloseIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>Invoice</Typography>
              <Chip label={invoice?.invoice_number || '—'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
              {invoice && <Chip label={invoice.status} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: style.bg, color: style.color }} />}
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
              {invoice?.missions?.mission_number} • {formatDate(invoice?.invoice_date)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {invoice?.status !== 'Paid' && invoice?.status !== 'Cancelled' && (
            <Button variant="contained" size="small" startIcon={<PaymentsIcon />} onClick={() => { onClose(); onRecordPayment?.(invoice); }} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Record Payment
            </Button>
          )}
          <Tooltip title="Email Invoice — Coming Soon" arrow>
            <span><IconButton disabled size="small" sx={{ border: '1px solid rgba(15,23,42,0.06)', borderRadius: '8px', opacity: 0.4 }}><EmailIcon sx={{ fontSize: '1rem' }} /></IconButton></span>
          </Tooltip>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}>Print</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadPDF} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}>PDF</Button>
          {invoice?.status !== 'Paid' && invoice?.status !== 'Cancelled' && (
            <Tooltip title="Void Invoice" arrow>
              <IconButton size="small" onClick={() => { onClose(); onVoid?.(invoice); }} sx={{ border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
                <CancelIcon sx={{ fontSize: '1rem', color: '#EF4444' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Document */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', py: 4, px: 2 }}>
        {loading ? (
          <Typography sx={{ color: 'text.tertiary', mt: 8 }}>Loading...</Typography>
        ) : invoice && (
          <Paper elevation={3} sx={{ width: '100%', maxWidth: 780, bgcolor: '#FFFFFF', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {/* Document Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', px: 5, py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em' }}>FLY</Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#16A34A', letterSpacing: '-0.04em' }}>BY</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', mt: -0.5 }}>Smart Drone Operations</Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', mt: 2 }}>INVOICE</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#16A34A' }}>{invoice.invoice_number}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>{formatDate(invoice.invoice_date)}</Typography>
                  <Chip label={invoice.status} size="small" sx={{ mt: 1.5, height: 22, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${style.color}20`, color: style.color }} />
                </Box>
              </Box>
            </Box>

            {/* Body */}
            <Box sx={{ px: 5, py: 4 }}>
              {/* Bill To & Mission */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>Bill To</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{invoice.customers?.customer_name || '—'}</Typography>
                  {invoice.customers?.contact_person && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{invoice.customers.contact_person}</Typography>}
                  {invoice.customers?.email && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{invoice.customers.email}</Typography>}
                  {invoice.customers?.phone && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{invoice.customers.phone}</Typography>}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>Mission Details</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{invoice.missions?.mission_number || '—'}</Typography>
                  {invoice.missions?.actual_area && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Area: {invoice.missions.actual_area} ha</Typography>}
                  {invoice.missions?.scheduled_date && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Date: {formatDate(invoice.missions.scheduled_date)}</Typography>}
                </Box>
              </Box>

              {/* Dates Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Invoice Date</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatDate(invoice.invoice_date)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due Date</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatDate(invoice.due_date)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Terms</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{invoice.payment_terms || '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Currency</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{invoice.currency || 'ZAR'}</Typography>
                </Box>
              </Box>

              {/* Line Items */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Description</Typography>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'center' }}>Qty</Typography>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'right' }}>Unit Price</Typography>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'right' }}>Amount</Typography>
                </Box>
                {(invoice.invoice_items || []).map((item, i) => (
                  <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 1, py: 1.5, px: 1.5, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.description}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', textAlign: 'center', color: 'text.secondary' }}>{item.quantity} {item.unit}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', textAlign: 'right', color: 'text.secondary' }}>{formatCurrency(item.unit_price, sym)}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount, sym)}</Typography>
                  </Box>
                ))}
                {(!invoice.invoice_items || invoice.invoice_items.length === 0) && (
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', py: 2, textAlign: 'center' }}>No line items</Typography>
                )}
              </Box>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                <Box sx={{ minWidth: 260 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Subtotal</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(invoice.subtotal, sym)}</Typography>
                  </Box>
                  {Number(invoice.vat_amount) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>VAT ({invoice.vat_percentage}%)</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(invoice.vat_amount, sym)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>Total</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#16A34A' }}>{formatCurrency(invoice.total_amount, sym)}</Typography>
                  </Box>
                  {Number(invoice.amount_paid) > 0 && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Paid</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#16A34A' }}>{formatCurrency(invoice.amount_paid, sym)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Balance Due</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>{formatCurrency(invoice.balance_due, sym)}</Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Banking Details */}
              {settings?.bank_name && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', mb: 3 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>Banking Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Bank</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{settings.bank_name}</Typography>
                    </Box>
                    {settings.bank_account_name && <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Account Name</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{settings.bank_account_name}</Typography>
                    </Box>}
                    {settings.bank_account_number && <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Account Number</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{settings.bank_account_number}</Typography>
                    </Box>}
                    {settings.bank_branch_code && <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Branch Code</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{settings.bank_branch_code}</Typography>
                    </Box>}
                    {settings.bank_reference && <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Reference</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{settings.bank_reference}</Typography>
                    </Box>}
                  </Box>
                </Paper>
              )}

              {/* Notes */}
              {invoice.notes && (
                <Box sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', textTransform: 'uppercase', mb: 0.5 }}>Notes</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{invoice.notes}</Typography>
                </Box>
              )}
              {invoice.footer && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', textAlign: 'center' }}>{invoice.footer}</Typography>
                </Box>
              )}
            </Box>

            {/* Document Footer */}
            <Box sx={{ px: 5, py: 2, borderTop: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>FlyBy by Feldrix • Smart Drone Operations • www.feldrix.com</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>{invoice.invoice_number}</Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Dialog>
  );
}
