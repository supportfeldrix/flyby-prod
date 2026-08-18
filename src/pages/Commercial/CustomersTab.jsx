import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerBilling } from '../../services/commercialService';

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomersTab() {
  const { company } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    getCustomerBilling(company.id)
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company?.id]);

  const filtered = search.trim()
    ? customers.filter(c => c.customer_name?.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <Box>
      <TextField
        size="small"
        placeholder="Search customers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 3, minWidth: 280 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.1rem' }} /></InputAdornment> }}
      />

      {!loading && filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PeopleIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1 }} />
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>No billing data yet</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>Customer billing data will appear once invoices are generated</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map(c => (
            <Paper key={c.customer_id} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Avatar */}
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB' }}>
                    {c.customer_name?.charAt(0) || '?'}
                  </Typography>
                </Box>

                {/* Name & status */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.customer_name}</Typography>
                    <Chip
                      label={c.status}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        bgcolor: c.status === 'Outstanding' ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.08)',
                        color: c.status === 'Outstanding' ? '#D97706' : '#16A34A',
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>
                    {c.invoice_count} invoices • Avg {c.avg_payment_days} days to pay • Last invoice: {c.last_invoice_date || '—'}
                  </Typography>
                </Box>

                {/* Financial info */}
                <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Revenue</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatCurrency(c.total_revenue)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Paid</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>{formatCurrency(c.total_paid)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Outstanding</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: c.outstanding > 0 ? '#D97706' : 'text.primary' }}>{formatCurrency(c.outstanding)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
