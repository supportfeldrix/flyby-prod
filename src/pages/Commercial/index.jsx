import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import PaymentsIcon from '@mui/icons-material/Payments';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getCommercialKPIs } from '../../services/commercialService';
import CommercialOverview from './CommercialOverview';
import InvoicesTab from './InvoicesTab';
import CustomersTab from './CustomersTab';
import PaymentsTab from './PaymentsTab';
import ProfitabilityTab from './ProfitabilityTab';
import AnalyticsTab from './AnalyticsTab';
import SettingsTab from './SettingsTab';

const MotionBox = motion.create(Box);

const TABS = [
  { label: 'Overview', icon: <TrendingUpIcon /> },
  { label: 'Invoices', icon: <ReceiptLongIcon /> },
  { label: 'Customers', icon: <PeopleIcon /> },
  { label: 'Payments', icon: <PaymentsIcon /> },
  { label: 'Profitability', icon: <PieChartIcon /> },
  { label: 'Analytics', icon: <BarChartIcon /> },
  { label: 'Settings', icon: <SettingsIcon /> },
];

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function KPICard({ label, value, prefix = '', suffix = '', color = '#0F172A', trend }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(15,23,42,0.04)',
        transition: 'all 0.2s ease',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transform: 'translateY(-1px)' },
      }}
    >
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        {prefix && <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color }}>{prefix}</Typography>}
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        {suffix && <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.tertiary' }}>{suffix}</Typography>}
      </Box>
      {trend !== undefined && (
        <Chip
          label={`${trend >= 0 ? '+' : ''}${trend}%`}
          size="small"
          sx={{
            mt: 1,
            height: 18,
            fontSize: '0.6rem',
            fontWeight: 700,
            bgcolor: trend >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
            color: trend >= 0 ? '#16A34A' : '#EF4444',
          }}
        />
      )}
    </Paper>
  );
}

export default function Commercial() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = await getCommercialKPIs(company.id);
      setKpis(data);
    } catch (err) {
      console.error('KPI fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Commercial</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Invoicing, payments, revenue management & business analytics
            </Typography>
          </Box>
        </Box>

        {/* KPI Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          <KPICard
            label="Revenue This Month"
            value={formatCurrency(kpis?.revenueThisMonth)}
            color="#16A34A"
          />
          <KPICard
            label="Outstanding Invoices"
            value={formatCurrency(kpis?.outstandingTotal)}
            color="#D97706"
          />
          <KPICard
            label="Awaiting Payment"
            value={String(kpis?.awaitingPayment || 0)}
            suffix="invoices"
            color="#2563EB"
          />
          <KPICard
            label="Invoices Paid"
            value={String(kpis?.paidInvoices || 0)}
            suffix="total"
            color="#16A34A"
          />
          <KPICard
            label="Avg Mission Value"
            value={formatCurrency(kpis?.avgMissionValue)}
            color="#0F172A"
          />
          <KPICard
            label="Avg Payment Time"
            value={String(kpis?.avgPaymentDays || 0)}
            suffix="days"
            color="#64748B"
          />
          <KPICard
            label="Profit This Month"
            value={formatCurrency(kpis?.profitThisMonth)}
            color={kpis?.profitThisMonth >= 0 ? '#16A34A' : '#EF4444'}
          />
          <KPICard
            label="Avg Profit Margin"
            value={String(kpis?.avgProfitMargin || 0)}
            suffix="%"
            color={kpis?.avgProfitMargin >= 0 ? '#16A34A' : '#EF4444'}
          />
        </Box>

        {/* Tabs */}
        <Paper sx={{ bgcolor: '#FFFFFF', borderRadius: '14px', overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(15,23,42,0.06)',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                minHeight: 52,
                gap: 1,
              },
              '& .Mui-selected': { color: '#16A34A' },
              '& .MuiTabs-indicator': { backgroundColor: '#16A34A', height: 2.5, borderRadius: '2px 2px 0 0' },
            }}
          >
            {TABS.map((t, i) => (
              <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
            ))}
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {tab === 0 && <CommercialOverview kpis={kpis} onRefresh={fetchKPIs} />}
            {tab === 1 && <InvoicesTab />}
            {tab === 2 && <CustomersTab />}
            {tab === 3 && <PaymentsTab />}
            {tab === 4 && <ProfitabilityTab />}
            {tab === 5 && <AnalyticsTab />}
            {tab === 6 && <SettingsTab />}
          </Box>
        </Paper>
      </MotionBox>
    </Box>
  );
}
