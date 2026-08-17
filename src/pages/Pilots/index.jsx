import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, InputAdornment, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getPilots, searchPilots, createPilot, updatePilot, deletePilot, getPilotStats, uploadPilotPhoto } from '../../services/pilotService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PilotCard from './PilotCard';
import PilotForm from './PilotForm';
import PilotDetailsDialog from './PilotDetailsDialog';

const MotionBox = motion.create(Box);

export default function Pilots() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [pilotList, setPilotList] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, flying: 0, onLeave: 0, training: 0, avgHours: 0, licenceExpiring: 0, medicalExpiring: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPilot, setEditingPilot] = useState(null);
  const [viewPilot, setViewPilot] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search ? await searchPilots(company.id, search) : await getPilots(company.id);
      setPilotList(data);
      const s = await getPilotStats(company.id);
      setStats(s);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = () => { setEditingPilot(null); setFormOpen(true); };
  const handleEdit = (p) => { setEditingPilot(p); setFormOpen(true); };

  const handleSave = async (formData, photoFile) => {
    try {
      let record;
      if (editingPilot) {
        record = await updatePilot(editingPilot.id, formData);
        showToast('Pilot updated');
      } else {
        record = await createPilot({ ...formData, company_id: company.id });
        showToast('Pilot registered');
      }
      if (photoFile && record) {
        const url = await uploadPilotPhoto(photoFile, record.id);
        await updatePilot(record.id, { photo_url: url });
      }
      setFormOpen(false);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePilot(deleteTarget.id);
      showToast('Pilot removed');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const filtered = statusFilter === 'all' ? pilotList : pilotList.filter((p) => p.status === statusFilter);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Pilots</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage pilot roster, licences, and availability</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreate}>Register Pilot</Button>
        </Box>

        {/* Summary bar */}
        {stats.total > 0 && (
          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(8, 1fr)' }, gap: 2 }}>
              {[
                { label: 'Available', value: stats.available, color: '#16A34A', dot: true },
                { label: 'Flying', value: stats.flying, color: '#2563EB', dot: true },
                { label: 'Training', value: stats.training, color: '#0EA5E9', dot: true },
                { label: 'On Leave', value: stats.onLeave, color: '#D97706', dot: true },
                { label: 'Total', value: stats.total },
                { label: 'Avg Hours', value: `${stats.avgHours}h` },
                { label: 'Licence Due', value: stats.licenceExpiring, color: stats.licenceExpiring > 0 ? '#EF4444' : undefined },
                { label: 'Medical Due', value: stats.medicalExpiring, color: stats.medicalExpiring > 0 ? '#EF4444' : undefined },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.dot && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />}
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: item.color || 'text.primary' }}>{item.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Search & Filter */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField fullWidth size="small" placeholder="Search pilots..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }} />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}>
              <MenuItem value="all">All Status</MenuItem>
              {['Available', 'Flying', 'Standby', 'Training', 'On Leave', 'Off Duty', 'Inactive'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
        </Paper>

        {/* Content */}
        {!loading && filtered.length === 0 && pilotList.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState icon={<PersonIcon />} title="No pilots registered" description="Register your first pilot to begin assigning aircraft and creating missions." actionLabel="Register Pilot" onAction={handleCreate} />
          </Paper>
        ) : !loading && filtered.length === 0 ? (
          <Paper sx={{ p: 4, bgcolor: '#FFFFFF', textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary' }}>No pilots match the current filter.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((pilot, i) => (
              <Grid item xs={12} sm={6} lg={4} key={pilot.id}>
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <PilotCard pilot={pilot} onEdit={handleEdit} onDelete={setDeleteTarget} onView={setViewPilot} />
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        )}
      </MotionBox>

      <PilotForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} pilot={editingPilot} />
      <PilotDetailsDialog open={!!viewPilot} onClose={() => setViewPilot(null)} pilot={viewPilot} onEdit={handleEdit} />
      <ConfirmDialog open={!!deleteTarget} title="Remove Pilot" message={`Remove "${deleteTarget?.first_name} ${deleteTarget?.last_name}" from the roster? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
