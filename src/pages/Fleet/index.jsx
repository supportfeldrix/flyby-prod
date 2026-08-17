import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, InputAdornment, MenuItem, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getAircraft, searchAircraft, createAircraft, updateAircraft, deleteAircraft, uploadAircraftPhoto, getAircraftStats } from '../../services/aircraftService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AircraftCard from './AircraftCard';
import AircraftForm from './AircraftForm';
import AircraftDetailsDialog from './AircraftDetailsDialog';

const MotionBox = motion.create(Box);

export default function Fleet() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [aircraftList, setAircraftList] = useState([]);
  const [stats, setStats] = useState({ total: 0, ready: 0, inMission: 0, maintenance: 0, avgFlightHours: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [viewAircraft, setViewAircraft] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search ? await searchAircraft(company.id, search) : await getAircraft(company.id);
      setAircraftList(data);
      const s = await getAircraftStats(company.id);
      setStats(s);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = () => { setEditingAircraft(null); setFormOpen(true); };
  const handleEdit = (a) => { setEditingAircraft(a); setFormOpen(true); };

  const handleSave = async (formData, photoFile) => {
    try {
      let record;
      if (editingAircraft) {
        record = await updateAircraft(editingAircraft.id, formData);
        showToast('Aircraft updated');
      } else {
        record = await createAircraft({ ...formData, company_id: company.id });
        showToast('Aircraft registered');
      }
      // Upload photo if selected
      if (photoFile && record) {
        const url = await uploadAircraftPhoto(photoFile, record.id);
        await updateAircraft(record.id, { photo_url: url });
      }
      setFormOpen(false);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAircraft(deleteTarget.id);
      showToast('Aircraft removed');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const filtered = statusFilter === 'all' ? aircraftList : aircraftList.filter((a) => a.status === statusFilter);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Fleet</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aircraft management, maintenance, and readiness</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreate}>Register Aircraft</Button>
        </Box>

        {/* Fleet summary bar */}
        {stats.total > 0 && (
          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16A34A' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Ready: {stats.ready}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2563EB' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>In Mission: {stats.inMission}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Maintenance: {stats.maintenance}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Total: {stats.total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Avg Hours: {stats.avgFlightHours}h</Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Search & Filter */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              fullWidth size="small" placeholder="Search aircraft..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }}
            />
            <TextField
              select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Ready">Ready</MenuItem>
              <MenuItem value="In Mission">In Mission</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Offline">Offline</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* Content */}
        {!loading && filtered.length === 0 && aircraftList.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState
              icon={<AirplanemodeActiveIcon />}
              title="No aircraft registered"
              description="Register your first drone to begin managing your fleet, tracking flight hours, and scheduling maintenance."
              actionLabel="Register Aircraft"
              onAction={handleCreate}
            />
          </Paper>
        ) : !loading && filtered.length === 0 ? (
          <Paper sx={{ p: 4, bgcolor: '#FFFFFF', textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary' }}>No aircraft match the current filter.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((aircraft, i) => (
              <Grid item xs={12} sm={6} lg={4} key={aircraft.id}>
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <AircraftCard aircraft={aircraft} onEdit={handleEdit} onDelete={setDeleteTarget} onView={setViewAircraft} />
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        )}
      </MotionBox>

      <AircraftForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} aircraft={editingAircraft} />
      <AircraftDetailsDialog open={!!viewAircraft} onClose={() => setViewAircraft(null)} aircraft={viewAircraft} onEdit={handleEdit} />
      <ConfirmDialog open={!!deleteTarget} title="Remove Aircraft" message={`Remove "${deleteTarget?.aircraft_name}" from fleet? This action cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
