import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Chip } from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import { useAuth } from '../../hooks/useAuth';
import { getMissionProfitability, getProfitabilitySummary } from '../../services/profitabilityService';

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function ProfitabilityTab() {
  const { company } = useAuth();
  const [missions, setMissions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [groupBy, setGroupBy] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    Promise.all([
      getMissionProfitability(company.id),
      getProfitabilitySummary(company.id, groupBy),
    ]).then(([m, s]) => { setMissions(m); setSummary(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company?.id, groupBy]);

  return (
    <Box>
      {/* Summary Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>{missions.length} completed mission{missions.length !== 1 ? 's' : ''}</Typography>
        <TextField
          select
          size="small"
          value={groupBy}
          onChange={e => setGroupBy(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="month">By Month</MenuItem>
          <MenuItem value="customer">By Customer</MenuItem>
          <MenuItem value="pilot">By Pilot</MenuItem>
          <MenuItem value="aircraft">By Aircraft</MenuItem>
        </TextField>
      </Box>

      {/* Summary Cards */}
      {summary.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>
            Summary — {groupBy}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {summary.map((s, i) => (
              <Paper key={i} sx={{ p: 2, borderRadius: '10px', border: '1px solid rgba(15,23,42,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.name || s.month || '—'}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{s.missions} mission{s.missions !== 1 ? 's' : ''}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>Revenue</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatCurrency(s.revenue)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>Cost</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444' }}>{formatCurrency(s.cost)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>Profit</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: s.profit >= 0 ? '#16A34A' : '#EF4444' }}>{formatCurrency(s.profit)}</Typography>
                  </Box>
                  <Chip
                    label={`${s.margin}%`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: s.margin >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', color: s.margin >= 0 ? '#16A34A' : '#EF4444' }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Mission-Level Detail */}
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>
        Mission Profitability
      </Typography>

      {!loading && missions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PieChartIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1 }} />
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>No profitability data yet</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>Complete missions and generate invoices to see profitability</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {missions.slice(0, 20).map(m => (
            <Paper key={m.mission_id} sx={{ p: 2, borderRadius: '10px', border: '1px solid rgba(15,23,42,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>{m.mission_number}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{m.customer_name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                    {formatDate(m.scheduled_date)} • {m.actual_area || '—'} ha • {m.actual_duration || '—'} min
                  </Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Revenue</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{formatCurrency(m.revenue)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Cost</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{formatCurrency(m.total_cost)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Profit</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: m.net_profit >= 0 ? '#16A34A' : '#EF4444' }}>{formatCurrency(m.net_profit)}</Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${m.profit_margin_pct || 0}%`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: m.profit_margin_pct >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', color: m.profit_margin_pct >= 0 ? '#16A34A' : '#EF4444', minWidth: 50 }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
