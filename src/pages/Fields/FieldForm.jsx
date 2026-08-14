import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { getFarms } from '../../services/farmService';

export default function FieldForm({ open, onClose, onSave, field }) {
  const { company } = useAuth();
  const [form, setForm] = useState({ field_name: '', farm_id: '', crop: '', area_hectares: '', latitude: '', longitude: '', wind_limit: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    if (open && company?.id) {
      getFarms(company.id).then(setFarms).catch(() => {});
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
    if (form.latitude && (isNaN(form.latitude) || form.latitude < -90 || form.latitude > 90)) e.latitude = 'Latitude must be -90 to 90';
    if (form.longitude && (isNaN(form.longitude) || form.longitude < -180 || form.longitude > 180)) e.longitude = 'Longitude must be -180 to 180';
    if (form.wind_limit && (isNaN(form.wind_limit) || parseFloat(form.wind_limit) <= 0)) e.wind_limit = 'Must be a positive number';
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

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
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
            <TextField label="Latitude" value={form.latitude} onChange={handleChange('latitude')} error={!!errors.latitude} helperText={errors.latitude} placeholder="-25.7461" fullWidth />
            <TextField label="Longitude" value={form.longitude} onChange={handleChange('longitude')} error={!!errors.longitude} helperText={errors.longitude} placeholder="28.1881" fullWidth />
          </Box>
          <TextField label="Wind Limit (km/h)" value={form.wind_limit} onChange={handleChange('wind_limit')} error={!!errors.wind_limit} helperText={errors.wind_limit} placeholder="15" fullWidth />
          <TextField label="Notes" value={form.notes} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : field ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}
