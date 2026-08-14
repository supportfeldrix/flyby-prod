import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getFarms, searchFarms, createFarm, updateFarm, deleteFarm } from '../../services/farmService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FarmForm from './FarmForm';

const MotionBox = motion.create(Box);

export default function Farms() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFarms = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search ? await searchFarms(company.id, search) : await getFarms(company.id);
      setFarms(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchFarms(); }, [fetchFarms]);

  const handleCreate = () => { setEditingFarm(null); setFormOpen(true); };
  const handleEdit = (farm) => { setEditingFarm(farm); setFormOpen(true); };

  const handleSave = async (formData) => {
    try {
      if (editingFarm) {
        await updateFarm(editingFarm.id, formData);
        showToast('Farm updated successfully');
      } else {
        await createFarm({ ...formData, company_id: company.id });
        showToast('Farm created successfully');
      }
      setFormOpen(false);
      fetchFarms();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFarm(deleteTarget.id);
      showToast('Farm deleted');
      setDeleteTarget(null);
      fetchFarms();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Farms</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage farm locations for spray operations</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreate}>Add Farm</Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <TextField fullWidth size="small" placeholder="Search farms..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }}
          />
        </Paper>

        {!loading && farms.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState icon={<AgricultureIcon />} title="No farms yet" description="Add your first farm to start organizing fields and missions." actionLabel="Add Farm" onAction={handleCreate} />
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {farms.map((farm, i) => (
              <Grid item xs={12} sm={6} lg={4} key={farm.id}>
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <Paper sx={{ p: 3, bgcolor: '#FFFFFF', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }} noWrap>{farm.farm_name}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{farm.customers?.customer_name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleEdit(farm)}><EditIcon sx={{ fontSize: '1rem' }} /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteTarget(farm)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {farm.province && <Chip label={farm.province} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />}
                      {farm.town && <Chip label={farm.town} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />}
                      {farm.latitude && (
                        <Chip icon={<LocationOnIcon sx={{ fontSize: '0.75rem' }} />} label={`${farm.latitude.toFixed(4)}, ${farm.longitude?.toFixed(4)}`} size="small" sx={{ fontSize: '0.65rem', height: 22 }} />
                      )}
                    </Box>
                  </Paper>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        )}
      </MotionBox>

      <FarmForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} farm={editingFarm} />
      <ConfirmDialog open={!!deleteTarget} title="Delete Farm" message={`Delete "${deleteTarget?.farm_name}"? All fields in this farm will also be removed.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
