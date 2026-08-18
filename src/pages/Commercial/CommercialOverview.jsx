import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../../hooks/useAuth';
import { getRecentPayments, getInvoicesDue, getTopCustomers } from '../../services/commercialService';

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function CommercialOverview({ kpis, onRefresh, onGenerateInvoice }) {
  const { company } = useAuth();
  const [recentPayments, setRecentPayments] = useState([]);
  const [dueInvoices, setDueInvoices] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    if (!company?.id) return;
    getRecentPayments(company.id).then(setRecentPayments).catch(() => {});
    getInvoicesDue(company.id).then(setDueInvoices).catch(() => {});
    getTopCustomers(company.id).then(setTopCustomers).catch(() => {});
  }, [company?.id]);

  return (
    <Box>
      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={onGenerateInvoice} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          Generate Invoice
        </Button>
        <Button variant="outlined" startIcon={<PaymentsIcon />} size="small" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,23,42,0.12)' }}>
          Record Payment
        </Button>
        <Button variant="outlined" startIcon={<VisibilityIcon />} size="small" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,23,42,0.12)' }}>
          View Outstanding
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Revenue Summary */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon sx={{ fontSize: '1rem', color: '#16A34A' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Revenue Summary
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase' }}>This Month</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A' }}>{formatCurrency(kpis?.revenueThisMonth)}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Outstanding</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706' }}>{formatCurrency(kpis?.outstandingTotal)}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Total Invoices</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800 }}>{kpis?.totalInvoices || 0}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Profit Margin</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: kpis?.avgProfitMargin >= 0 ? '#16A34A' : '#EF4444' }}>{kpis?.avgProfitMargin || 0}%</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Invoices Due */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptLongIcon sx={{ fontSize: '1rem', color: '#D97706' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Invoices Due
            </Typography>
            {dueInvoices.length > 0 && (
              <Chip label={dueInvoices.length} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(217,119,6,0.08)', color: '#D97706' }} />
            )}
          </Box>
          {dueInvoices.length === 0 ? (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', py: 2, textAlign: 'center' }}>No invoices due this week</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dueInvoices.slice(0, 5).map(inv => (
                <Box key={inv.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{inv.invoice_number}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{inv.customers?.customer_name}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>{formatCurrency(inv.balance_due)}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Due {formatDate(inv.due_date)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Recent Payments */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PaymentsIcon sx={{ fontSize: '1rem', color: '#16A34A' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Recent Payments
            </Typography>
          </Box>
          {recentPayments.length === 0 ? (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', py: 2, textAlign: 'center' }}>No payments recorded yet</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentPayments.map(p => (
                <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.customers?.customer_name || '—'}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{p.invoices?.invoice_number} • {p.payment_method}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>{formatCurrency(p.amount)}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>{formatDate(p.payment_date)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Top Customers */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon sx={{ fontSize: '1rem', color: '#2563EB' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Top Customers
            </Typography>
          </Box>
          {topCustomers.length === 0 ? (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', py: 2, textAlign: 'center' }}>No customer revenue data yet</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {topCustomers.map((c, i) => (
                <Box key={c.customer_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#2563EB' }}>{i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.customer_name}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{formatCurrency(c.total_revenue)}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>{c.invoice_count} invoices</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
