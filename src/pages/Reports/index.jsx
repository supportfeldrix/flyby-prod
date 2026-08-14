import { Box, Typography, Paper, Grid, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightIcon from '@mui/icons-material/Flight';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

const MotionBox = motion.create(Box);

const reports = [
  { id: 1, title: 'Weekly Operations Summary', type: 'Operations', date: '14 Aug 2026', pages: 12, status: 'Ready' },
  { id: 2, title: 'Spray Application Report - Bosveld', type: 'Chemical', date: '13 Aug 2026', pages: 8, status: 'Ready' },
  { id: 3, title: 'Fleet Maintenance Log', type: 'Fleet', date: '12 Aug 2026', pages: 6, status: 'Ready' },
  { id: 4, title: 'Pilot Flight Hours - July 2026', type: 'Compliance', date: '01 Aug 2026', pages: 4, status: 'Ready' },
  { id: 5, title: 'Monthly Customer Invoice Summary', type: 'Finance', date: '31 Jul 2026', pages: 15, status: 'Draft' },
  { id: 6, title: 'Hectares Sprayed - Q2 2026', type: 'Operations', date: '30 Jun 2026', pages: 18, status: 'Ready' },
];

export default function Reports() {
  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Reports</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Operations reports, compliance documents, and analytics
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AssessmentIcon />} size="large">
            Generate Report
          </Button>
        </Box>

        {/* Summary cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: 'Reports Generated', value: '47', sub: 'This quarter', icon: <AssessmentIcon />, color: '#16A34A' },
            { label: 'Flight Logs', value: '312', sub: 'Total entries', icon: <FlightIcon />, color: '#2563EB' },
            { label: 'Chemical Records', value: '89', sub: 'Applications logged', icon: <LocalFloristIcon />, color: '#7C3AED' },
          ].map((item, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#FFFFFF' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${item.color}12`, color: item.color }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{item.value}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{item.sub}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Reports list */}
        <Paper sx={{ p: 3, bgcolor: '#FFFFFF' }}>
          <Typography variant="h6" sx={{ mb: 2.5, fontSize: '1rem' }}>Recent Reports</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reports.map((report) => (
              <Box
                key={report.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: '10px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.02)' },
                }}
              >
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'primary.main' }}>
                  <AssessmentIcon sx={{ fontSize: '1.1rem' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{report.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.25 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{report.type}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{report.date}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>{report.pages} pages</Typography>
                  </Box>
                </Box>
                <Chip
                  label={report.status}
                  size="small"
                  sx={{
                    bgcolor: report.status === 'Ready' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    color: report.status === 'Ready' ? 'success.main' : 'warning.dark',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 22,
                  }}
                />
                <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontSize: '0.75rem' }}>
                  Download
                </Button>
              </Box>
            ))}
          </Box>
        </Paper>
      </MotionBox>
    </Box>
  );
}
