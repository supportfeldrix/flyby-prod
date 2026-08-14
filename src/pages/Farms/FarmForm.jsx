import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { getCustomers } from '../../services/customerService';

export default function FarmForm({ open, onClose, onSave, farm }) {
  const { company } = useAuth();
  const [form, setForm] = useState({ farm_name: '', customer_id: '', province: '', town: '', latitude: '', longitude: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (open && company?.id) {
      getCustomers(company.id).then(setCustomers).catch(() => {});
      setForm(farm ? {
        farm_name: farm.farm_name || '',
        customer_id: farm.customer_id || '',
        province: farm.province || '',
        town: farm.town || '',
        latitude: farm.latitude ?? '',
        longitude: farm.longitude ?? '',
        notes: farm.notes || '',
      } : { farm_name: '', customer_id: '', province: '', town: '', latitude: '', longitude: '', notes: '' });
      setErrors({});
    }
  }, [open, farm, company?.id]);

  const validate = () => {
    const e = {};
    if (!form.farm_name.trim()) e.farm_name = 'Farm name is required';
    if (!form.customer_id) e.customer_id = 'Customer is required';
    if (form.latitude && (isNaN(form.latitude) || form.latitude < -90 || form.latitude > 90)) e.latitude = 'Latitude must be -90 to 90';
    if (form.longitude && (isNaN(form.longitude) || form.longitude < -180 || form.longitude > 180)) e.longitude = 'Longitude must be -180 to 180';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    };
    await onSave(payload);
    setSaving(false);
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{farm ? 'Edit Farm' : 'New Farm'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField label="Farm Name" value={form.farm_name} onChange={handleChange('farm_name')} error={!!errors.farm_name} helperText={errors.farm_name} required fullWidth />
          <TextField select label="Customer" value={form.customer_id} onChange={handleChange('customer_id')} error={!!errors.customer_id} helperText={errors.customer_id} required fullWidth>
            <MenuItem value="">Select customer</MenuItem>
            {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.customer_name}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Province" value={form.province} onChange={handleChange('province')} fullWidth />
            <TextField label="Town" value={form.town} onChange={handleChange('town')} fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Latitude" value={form.latitude} onChange={handleChange('latitude')} error={!!errors.latitude} helperText={errors.latitude} placeholder="-25.7461" fullWidth />
            <TextField label="Longitude" value={form.longitude} onChange={handleChange('longitude')} error={!!errors.longitude} helperText={errors.longitude} placeholder="28.1881" fullWidth />
          </Box>
          <TextField label="Notes" value={form.notes} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : farm ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}
