import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getMissionReports, deleteReport } from '../../services/missionReportService';
import { downloadPDF } from '../../services/pdfReportService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ReportCard from '../../components/reports/ReportCard';
import MissionReportPreview from '../../components/reports/MissionReportPreview';

const MotionBox = motion.create(Box);

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'generated', label: 'Generated' },
  { value: 'downloaded', label: 'Downloaded' },
  { value: 'printed', label: 'Printed' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

function getDateRange(filter) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  switch (filter) {
    case 'today':
      return { dateFrom: startOfDay };
    case 'week': {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      return { dateFrom: monday.toISOString() };
    }
    case 'month': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: firstOfMonth.toISOString() };
    }
    default:
      return {};
  }
}

export default function Reports() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [previewReport, setPreviewReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const dateRange = getDateRange(dateFilter);
      const data = await getMissionReports(company.id, {
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        sortOrder,
      });
      setReports(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [company?.id, search, dateFilter, statusFilter, sortOrder, showToast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handlePreview = (report) => {
    setPreviewReport(report);
  };

  const handleDownload = (report) => {
    try {
      downloadPDF(report.report_data, report.filename);
      showToast('Report downloaded');
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReport(deleteTarget.id);
      showToast('Report deleted');
      setDeleteTarget(null);
      fetchReports();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Mission Reports</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Professional mission documentation and compliance reports
            </Typography>
          </Box>
          {reports.length > 0 && (
            <Chip
              label={`${reports.length} report${reports.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }}
            />
          )}
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search by mission number, customer, farm, pilot, aircraft..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Date filter */}
            <TextField
              select
              size="small"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              sx={{ minWidth: 130 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} />
                  </InputAdornment>
                ),
              }}
            >
              {DATE_FILTERS.map((f) => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </TextField>

            {/* Status filter */}
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {STATUS_FILTERS.map((f) => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </TextField>

            {/* Sort */}
            <TextField
              select
              size="small"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ minWidth: 140 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SortIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} />
                  </InputAdornment>
                ),
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Content */}
        {!loading && reports.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState
              icon={<AssessmentIcon />}
              title="No reports available"
              description={
                search || dateFilter !== 'all' || statusFilter !== 'all'
                  ? 'No reports match your current filters. Try adjusting your search or date range.'
                  : 'Mission reports are automatically generated when missions are completed. Complete your first mission to see reports here.'
              }
            />
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {reports.map((report, i) => (
              <ReportCard
                key={report.id}
                report={report}
                index={i}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={setDeleteTarget}
              />
            ))}
          </Box>
        )}
      </MotionBox>

      {/* Preview Dialog */}
      <MissionReportPreview
        open={!!previewReport}
        onClose={() => setPreviewReport(null)}
        report={previewReport}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Report"
        message={`Delete report "${deleteTarget?.report_number}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
