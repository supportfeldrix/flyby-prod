import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DrawIcon from '@mui/icons-material/Draw';
import { useAuth } from '../../hooks/useAuth';
import { getFarms } from '../../services/farmService';
import { calculateArea, geoJSONToLatLngs, deleteBoundary } from '../../services/boundaryService';
import BoundaryEditor from '../../components/boundary/BoundaryEditor';

export default function FieldForm({ open, onClose, onSave, field, onFieldUpdated }) {
  const { company } = useAuth();
  const [form, setForm] = useState({ field_name: '', farm_id: '', crop: '', area_hectares: '', latitude: '', longitude: '', wind_limit: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [farms, setFarms] = useState([]);
  const [boundaryEditorOpen, setBoundaryEditorOpen] = useState(false);
  const [localField, setLocalField] = useState(null);

  useEffect(() => {
    if (open && company?.id) {
      getFarms(company.id).then(setFarms).catch(() => {});
      setLocalField(field);
      setForm(field ? {
        field_name: field.field_name || '',
        farm_id: field.farm_id || '',
        crop: field.crop || '',
        area_hectares: field.area_hectares ?? '',
        latitude: field.latitude ?? '',
        longitude: field.longitude ?? '',
        wind_limit: field.wind_limit ?? '',
        notes: field.notes || '',
      } : { field_name: '', farm_id: '', crop: '', area_hectares: '', latitude: '', longitude: '', wind_limit: '', notes: '' });
      setErrors({});
    }
  }, [open, field, company?.id]);

  const validate = () => {
    const e = {};
    if (!form.field_name.trim()) e.field_name = 'Field name is required';
    if (!form.farm_id) e.farm_id = 'Farm is required';
    if (form.area_hectares && (isNaN(form.area_hectares) || parseFloat(form.area_hectares) <= 0)) e.area_hectares = 'Must be a positive number';
    if (form.latitude && (isNaN(form.latitude) || form.latitude < -90 || form.latitude > 90)) e.latitude = 'Must be -90 to 90';
    if (form.longitude && (isNaN(form.longitude) || form.longitude < -180 || form.longitude > 180)) e.longitude = 'Must be -180 to 180';
    if (form.wind_limit && (isNaN(form.wind_limit) || parseFloat(form.wind_limit) <= 0)) e.wind_limit = 'Must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      wind_limit: form.wind_limit ? parseFloat(form.wind_limit) : null,
    };
    await onSave(payload);
    setSaving(false);
  };

  const handleChange = (fld) => (e) => setForm((prev) => ({ ...prev, [fld]: e.target.value }));

  const handleBoundarySaved = (updatedField) => {
    setLocalField(updatedField);
    setForm((prev) => ({ ...prev, area_hectares: updatedField.area_hectares ?? prev.area_hectares }));
    if (onFieldUpdated) onFieldUpdated(updatedField);
  };

  const handleDeleteBoundary = async () => {
    if (!localField?.id) return;
    try {
      await deleteBoundary(localField.id);
      setLocalField((prev) => ({ ...prev, boundary: null }));
      if (onFieldUpdated) onFieldUpdated({ ...localField, boundary: null });
    } catch (err) {
      console.error(err);
    }
  };

  // Boundary info
  const hasBoundary = !!localField?.boundary;
  const boundaryPoints = hasBoundary ? geoJSONToLatLngs(localField.boundary).length : 0;
  const boundaryArea = hasBoundary ? calculateArea(localField.boundary.coordinates[0]) : null;

  // Area comparison
  const manualArea = form.area_hectares ? parseFloat(form.area_hectares) : null;
  const areasDiffer = hasBoundary && manualArea && boundaryArea &&
    Math.abs(boundaryArea.hectares - manualArea) / manualArea > 0.1;

  return (
    <>
      <Dialog open={open && !boundaryEditorOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{field ? 'Edit Field' : 'New Field'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Field Name" value={form.field_name} onChange={handleChange('field_name')} error={!!errors.field_name} helperText={errors.field_name} required fullWidth />
            <TextField select label="Farm" value={form.farm_id} onChange={handleChange('farm_id')} error={!!errors.farm_id} helperText={errors.farm_id} required fullWidth>
              <MenuItem value="">Select farm</MenuItem>
              {farms.map((f) => <MenuItem key={f.id} value={f.id}>{f.farm_name} — {f.customers?.customer_name}</MenuItem>)}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Crop" value={form.crop} onChange={handleChange('crop')} placeholder="Maize, Soybeans..." fullWidth />
              <TextField label="Area (Hectares)" value={form.area_hectares} onChange={handleChange('area_hectares')} error={!!errors.area_hectares} helperText={errors.area_hectares} placeholder="42" fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Reference Latitude" value={form.latitude} onChange={handleChange('latitude')} error={!!errors.latitude} helperText={errors.latitude || 'Approximate centre of the field'} placeholder="-25.7461" fullWidth />
              <TextField label="Reference Longitude" value={form.longitude} onChange={handleChange('longitude')} error={!!errors.longitude} helperText={errors.longitude || 'Before a boundary is created'} placeholder="28.1881" fullWidth />
            </Box>
            <TextField label="Wind Limit (km/h)" value={form.wind_limit} onChange={handleChange('wind_limit')} error={!!errors.wind_limit} helperText={errors.wind_limit} placeholder="15" fullWidth />
            <TextField label="Notes" value={form.notes} onChange={handleChange('notes')} multiline rows={2} fullWidth />

            {/* Boundary Section */}
            {field && (
              <>
                <Divider sx={{ mt: 1 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1.5 }}>Field Boundary</Typography>

                  {hasBoundary ? (
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(22, 163, 74, 0.04)', border: '1px solid rgba(22, 163, 74, 0.12)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'success.main' }}>Boundary Created</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Calculated Area</Typography>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{boundaryArea?.hectares} ha</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>Boundary Points</Typography>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{boundaryPoints}</Typography>
                        </Box>
                      </Box>

                      {areasDiffer && (
                        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', mb: 2 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'warning.dark', mb: 1 }}>
                            The calculated area ({boundaryArea?.hectares} ha) differs from the manually entered area ({manualArea} ha).
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setForm(prev => ({ ...prev, area_hectares: boundaryArea.hectares }))}
                            sx={{ fontSize: '0.7rem', height: 28 }}
                          >
                            Use Calculated Area
                          </Button>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" startIcon={<EditIcon />} variant="outlined" onClick={() => setBoundaryEditorOpen(true)} sx={{ fontSize: '0.75rem' }}>
                          Edit Boundary
                        </Button>
                        <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={handleDeleteBoundary} sx={{ fontSize: '0.75rem' }}>
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WarningAmberIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'text.secondary' }}>No Boundary Created</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', mb: 2, lineHeight: 1.6 }}>
                        Drawing the field boundary enables accurate area calculations, drone flight planning, spray volume estimation, and battery calculations.
                      </Typography>
                      <Button size="small" startIcon={<DrawIcon />} variant="contained" onClick={() => setBoundaryEditorOpen(true)} sx={{ fontSize: '0.75rem' }}>
                        Draw Boundary
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : field ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Boundary Editor (full-screen overlay) */}
      <BoundaryEditor
        open={boundaryEditorOpen}
        onClose={() => setBoundaryEditorOpen(false)}
        field={localField}
        onSaved={handleBoundarySaved}
      />
    </>
  );
}
