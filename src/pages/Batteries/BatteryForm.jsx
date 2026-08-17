import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { getAircraft } from '../../services/aircraftService';

const STATUS_OPTIONS = ['Charging', 'Ready', 'Cooling', 'In Use', 'Maintenance', 'Retired'];

export default function BatteryForm({ open, onClose, onSave, battery }) {
  const { company } = useAuth();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [aircraftList, setAircraftList] = useState([]);

  useEffect(() => {
    if (open && company?.id) {
      getAircraft(company.id).then(setAircraftList).catch(() => {});
      setForm(battery ? {
        battery_code: battery.battery_code || '', aircraft_id: battery.aircraft_id || '',
        manufacturer: battery.manufacturer || '', model: battery.model || '', serial_number: battery.serial_number || '',
        capacity_mah: battery.capacity_mah ?? '', charge_cycles: battery.charge_cycles ?? 0,
        battery_health: battery.battery_health ?? 100, current_charge: battery.current_charge ?? 0,
        temperature: battery.temperature ?? '', status: battery.status || 'Ready', notes: battery.notes || '',
      } : {
        battery_code: '', aircraft_id: '', manufacturer: 'DJI', model: '', serial_number: '',
        capacity_mah: '', charge_cycles: 0, battery_health: 100, current_charge: 100,
        temperature: '', status: 'Ready', notes: '',
      });
      setErrors({});
    }
  }, [open, battery, company?.id]);

  const validate = () => {
    const e = {};
    if (!form.battery_code.trim()) e.battery_code = 'Required';
    if (form.current_charge < 0 || form.current_charge > 100) e.current_charge = '0–100%';
    if (form.battery_health < 0 || form.battery_health > 100) e.battery_health = '0–100%';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form };
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
    payload.charge_cycles = parseInt(payload.charge_cycles) || 0;
    payload.battery_health = parseInt(payload.battery_health) || 100;
    payload.current_charge = parseInt(payload.current_charge) || 0;
    if (payload.capacity_mah) payload.capacity_mah = parseInt(payload.capacity_mah);
    if (payload.temperature) payload.temperature = parseFloat(payload.temperature);
    await onSave(payload);
    setSaving(false);
  };

  const handleChange = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{battery ? 'Edit Battery' : 'Register Battery'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Battery Code" value={form.battery_code || ''} onChange={handleChange('battery_code')} error={!!errors.battery_code} helperText={errors.battery_code} required fullWidth />
            <TextField select label="Status" value={form.status || 'Ready'} onChange={handleChange('status')} fullWidth>
              {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
          <TextField select label="Assigned Aircraft" value={form.aircraft_id || ''} onChange={handleChange('aircraft_id')} fullWidth>
            <MenuItem value="">Unassigned</MenuItem>
            {aircraftList.map(a => <MenuItem key={a.id} value={a.id}>{a.aircraft_name}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Manufacturer" value={form.manufacturer || ''} onChange={handleChange('manufacturer')} fullWidth />
            <TextField label="Model" value={form.model || ''} onChange={handleChange('model')} fullWidth />
            <TextField label="Serial Number" value={form.serial_number || ''} onChange={handleChange('serial_number')} fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Capacity (mAh)" type="number" value={form.capacity_mah || ''} onChange={handleChange('capacity_mah')} fullWidth />
            <TextField label="Charge %" type="number" value={form.current_charge ?? 0} onChange={handleChange('current_charge')} error={!!errors.current_charge} helperText={errors.current_charge} fullWidth />
            <TextField label="Health %" type="number" value={form.battery_health ?? 100} onChange={handleChange('battery_health')} error={!!errors.battery_health} helperText={errors.battery_health} fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Charge Cycles" type="number" value={form.charge_cycles ?? 0} onChange={handleChange('charge_cycles')} fullWidth />
            <TextField label="Temperature (°C)" type="number" value={form.temperature || ''} onChange={handleChange('temperature')} fullWidth />
          </Box>
          <TextField label="Notes" value={form.notes || ''} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : battery ? 'Update' : 'Register'}</Button>
      </DialogActions>
    </Dialog>
  );
}
