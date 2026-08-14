import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GrassIcon from '@mui/icons-material/Grass';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getFields, searchFields, createField, updateField, deleteField } from '../../services/fieldService';
import { geoJSONToLatLngs, calculateArea } from '../../services/boundaryService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FieldForm from './FieldForm';

const MotionBox = motion.create(Box);

export default function Fields() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFields = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search ? await searchFields(company.id, search) : await getFields(company.id);
      setFields(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const handleCreate = () => { setEditingField(null); setFormOpen(true); };
  const handleEdit = (field) => { setEditingField(field); setFormOpen(true); };

  const handleSave = async (formData) => {
    try {
      if (editingField) {
        await updateField(editingField.id, formData);
        showToast('Field updated successfully');
      } else {
        await createField({ ...formData, company_id: company.id });
        showToast('Field created successfully');
      }
      setFormOpen(false);
      fetchFields();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteField(deleteTarget.id);
      showToast('Field deleted');
      setDeleteTarget(null);
      fetchFields();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const handleFieldUpdated = (updatedField) => {
    setFields((prev) => prev.map((f) => f.id === updatedField.id ? { ...f, ...updatedField } : f));
    setEditingField((prev) => prev?.id === updatedField.id ? { ...prev, ...updatedField } : prev);
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Fields</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage spray fields and crop zones</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreate}>Add Field</Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <TextField fullWidth size="small" placeholder="Search fields by name or crop..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }}
          />
        </Paper>

        {!loading && fields.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState icon={<GrassIcon />} title="No fields yet" description="Add your first spray field to start planning missions." actionLabel="Add Field" onAction={handleCreate} />
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {fields.map((field, i) => {
              const hasBoundary = !!field.boundary;
              const boundaryPoints = hasBoundary ? geoJSONToLatLngs(field.boundary).length : 0;
              const boundaryArea = hasBoundary ? calculateArea(field.boundary.coordinates[0]) : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={field.id}>
                  <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                    <Paper sx={{ p: 2.5, bgcolor: '#FFFFFF', height: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'primary.main', flexShrink: 0 }}>
                            <GrassIcon sx={{ fontSize: '1.1rem' }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }} noWrap>{field.field_name}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }} noWrap>{field.farms?.farm_name} • {field.farms?.customers?.customer_name}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton size="small" onClick={() => handleEdit(field)}><EditIcon sx={{ fontSize: '1rem' }} /></IconButton>
                          <IconButton size="small" onClick={() => setDeleteTarget(field)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
                        </Box>
                      </Box>

                      {/* Boundary Status */}
                      <Box sx={{ mb: 1.5 }}>
                        {hasBoundary ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '0.75rem' }} />}
                            label={`Boundary Complete • ${boundaryArea?.hectares} ha • ${boundaryPoints} pts`}
                            size="small"
                            sx={{ bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main', fontWeight: 600, fontSize: '0.6rem', height: 22, '& .MuiChip-icon': { color: 'success.main' } }}
                          />
                        ) : (
                          <Chip
                            icon={<ErrorOutlineIcon sx={{ fontSize: '0.75rem' }} />}
                            label="Boundary Missing"
                            size="small"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', color: 'warning.dark', fontWeight: 600, fontSize: '0.6rem', height: 22, '& .MuiChip-icon': { color: 'warning.dark' } }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {field.crop && <Chip label={field.crop} size="small" sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'rgba(22, 163, 74, 0.06)', color: 'primary.dark', fontWeight: 500 }} />}
                        {field.area_hectares && !hasBoundary && <Chip label={`${field.area_hectares} ha (manual)`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />}
                        {field.wind_limit && <Chip label={`≤${field.wind_limit} km/h`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />}
                        {field.latitude && <Chip label={`${field.latitude.toFixed(4)}, ${field.longitude?.toFixed(4)}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />}
                      </Box>
                    </Paper>
                  </MotionBox>
                </Grid>
              );
            })}
          </Grid>
        )}
      </MotionBox>

      <FieldForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} field={editingField} onFieldUpdated={handleFieldUpdated} />
      <ConfirmDialog open={!!deleteTarget} title="Delete Field" message={`Delete "${deleteTarget?.field_name}"? This action cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
