import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useAuth } from '../../hooks/useAuth';
import { getMonthlyRevenue, getRevenueByCustomer, getRevenueByPilot, getRevenueByAircraft, getProfitTrend } from '../../services/analyticsService';

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function BarVisualization({ data, maxValue, color = '#16A34A' }) {
  if (!maxValue) return null;
  return (
    <Box sx={{ width: 80, height: 8, borderRadius: '4px', bgcolor: 'rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      <Box sx={{ width: `${Math.min(100, (data / maxValue) * 100)}%`, height: '100%', borderRadius: '4px', bgcolor: color }} />
    </Box>
  );
}

function ChartSection({ title, data, labelKey = 'name', valueKey = 'revenue', color = '#16A34A', emptyText = 'No data' }) {
  const maxVal = data.length > 0 ? Math.max(...data.map(d => Number(d[valueKey] || 0))) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
        {title}
      </Typography>
      {data.length === 0 ? (
        <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', textAlign: 'center', py: 3 }}>{emptyText}</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.slice(0, 10).map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 20, textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.tertiary' }}>{i + 1}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item[labelKey] || '—'}
                </Typography>
              </Box>
              <BarVisualization data={Number(item[valueKey] || 0)} maxValue={maxVal} color={color} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                {formatCurrency(item[valueKey])}
              </Typography>
              {item.count !== undefined && (
                <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', minWidth: 40, textAlign: 'right' }}>
                  {item.count} inv
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default function AnalyticsTab() {
  const { company } = useAuth();
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [byCustomer, setByCustomer] = useState([]);
  const [byPilot, setByPilot] = useState([]);
  const [byAircraft, setByAircraft] = useState([]);
  const [profitTrend, setProfitTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    Promise.all([
      getMonthlyRevenue(company.id),
      getRevenueByCustomer(company.id),
      getRevenueByPilot(company.id),
      getRevenueByAircraft(company.id),
      getProfitTrend(company.id),
    ]).then(([mr, bc, bp, ba, pt]) => {
      setMonthlyRevenue(mr);
      setByCustomer(bc);
      setByPilot(bp);
      setByAircraft(ba);
      setProfitTrend(pt);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [company?.id]);

  if (!loading && monthlyRevenue.length === 0 && byCustomer.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <BarChartIcon sx={{ fontSize: '2.5rem', color: 'text.tertiary', mb: 1 }} />
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>No analytics data yet</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary' }}>Generate invoices and record payments to see business analytics</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {/* Monthly Revenue */}
      <ChartSection title="Monthly Revenue" data={monthlyRevenue} labelKey="label" valueKey="revenue" color="#16A34A" emptyText="No monthly data" />

      {/* Revenue by Customer */}
      <ChartSection title="Revenue by Customer" data={byCustomer} labelKey="name" valueKey="revenue" color="#2563EB" emptyText="No customer data" />

      {/* Revenue by Pilot */}
      <ChartSection title="Revenue by Pilot" data={byPilot} labelKey="name" valueKey="revenue" color="#7C3AED" emptyText="No pilot data" />

      {/* Revenue by Aircraft */}
      <ChartSection title="Revenue by Aircraft" data={byAircraft} labelKey="name" valueKey="revenue" color="#0EA5E9" emptyText="No aircraft data" />

      {/* Profit Trend */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', gridColumn: { md: '1 / -1' } }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Profit Trend
        </Typography>
        {profitTrend.length === 0 ? (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', textAlign: 'center', py: 3 }}>No profit data</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {profitTrend.map((m, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, minWidth: 60 }}>{m.label}</Typography>
                <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1, height: 8, borderRadius: '4px', bgcolor: 'rgba(22,163,74,0.08)', overflow: 'hidden' }}>
                    <Box sx={{ width: `${Math.min(100, (m.revenue / (Math.max(...profitTrend.map(p => p.revenue)) || 1)) * 100)}%`, height: '100%', borderRadius: '4px', bgcolor: '#16A34A' }} />
                  </Box>
                  <Box sx={{ flex: 1, height: 8, borderRadius: '4px', bgcolor: 'rgba(239,68,68,0.08)', overflow: 'hidden' }}>
                    <Box sx={{ width: `${Math.min(100, (m.cost / (Math.max(...profitTrend.map(p => p.revenue)) || 1)) * 100)}%`, height: '100%', borderRadius: '4px', bgcolor: '#EF4444' }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, minWidth: 200 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#16A34A' }}>{formatCurrency(m.revenue)}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#EF4444' }}>{formatCurrency(m.cost)}</Typography>
                  <Chip label={`${m.margin}%`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: m.margin >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', color: m.margin >= 0 ? '#16A34A' : '#EF4444' }} />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
