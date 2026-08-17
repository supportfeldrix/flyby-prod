import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography, Avatar, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import { uploadAircraftPhoto } from '../../services/aircraftService';

const STATUS_OPTIONS = ['Ready', 'In Mission', 'Maintenance', 'Offline', 'Retired'];
const TYPE_OPTIONS = ['Spray Drone', 'Survey Drone', 'Mapping Drone', 'Multirole', 'Other'];

export default function AircraftForm({ open, onClose, onSave, aircraft }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(aircraft ? {
        aircraft_name: aircraft.aircraft_name || '',
        manufacturer: aircraft.manufacturer || '',
        model: aircraft.model || '',
        serial_number: aircraft.serial_number || '',
        registration_number: aircraft.registration_number || '',
        aircraft_type: aircraft.aircraft_type || 'Spray Drone',
        purchase_date: aircraft.purchase_date || '',
        purchase_price: aircraft.purchase_price ?? '',
        firmware_version: aircraft.firmware_version || '',
        status: aircraft.status || 'Ready',
        flight_hours: aircraft.flight_hours ?? 0,
        last_flight_date: aircraft.last_flight_date || '',
        last_service_date: aircraft.last_service_date || '',
        next_service_date: aircraft.next_service_date || '',
        insurance_expiry: aircraft.insurance_expiry || '',
        notes: aircraft.notes || '',
      } : {
        aircraft_name: '', manufacturer: 'DJI', model: '', serial_number: '', registration_number: '',
        aircraft_type: 'Spray Drone', purchase_date: '', purchase_price: '', firmware_version: '',
        status: 'Ready', flight_hours: 0, last_flight_date: '', last_service_date: '',
        next_service_date: '', insurance_expiry: '', notes: '',
      });
      setPhotoFile(null);
      setPhotoPreview(aircraft?.photo_url || null);
      setErrors({});
    }
  }, [open, aircraft]);

  const validate = () => {
    const e = {};
    if (!form.aircraft_name.trim()) e.aircraft_name = 'Aircraft name is required';
    if (form.flight_hours < 0) e.flight_hours = 'Cannot be negative';
    if (form.purchase_date && new Date(form.purchase_date) > new Date()) e.purchase_date = 'Cannot be in the future';
    if (form.next_service_date && form.last_service_date && new Date(form.next_service_date) < new Date(form.last_service_date)) {
      e.next_service_date = 'Must be after last service date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      // Clean empty strings to null
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      payload.flight_hours = parseFloat(payload.flight_hours) || 0;
      if (payload.purchase_price) payload.purchase_price = parseFloat(payload.purchase_price);

      await onSave(payload, photoFile);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{aircraft ? 'Edit Aircraft' : 'Register New Aircraft'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Photo upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{ width: 100, height: 80, borderRadius: '12px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(15,23,42,0.06)', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <Box component="img" src={photoPreview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <AirplanemodeActiveIcon sx={{ fontSize: '2rem', color: 'rgba(15,23,42,0.15)' }} />
              )}
            </Box>
            <Box>
              <Button size="small" startIcon={<CloudUploadIcon />} variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>JPG, PNG. Max 5MB.</Typography>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
          </Box>

          {/* Row 1 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Aircraft Name" value={form.aircraft_name || ''} onChange={handleChange('aircraft_name')} error={!!errors.aircraft_name} helperText={errors.aircraft_name} required fullWidth />
            <TextField select label="Status" value={form.status || 'Ready'} onChange={handleChange('status')} fullWidth>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>

          {/* Row 2 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Manufacturer" value={form.manufacturer || ''} onChange={handleChange('manufacturer')} placeholder="DJI" fullWidth />
            <TextField label="Model" value={form.model || ''} onChange={handleChange('model')} placeholder="Agras T40" fullWidth />
            <TextField select label="Type" value={form.aircraft_type || 'Spray Drone'} onChange={handleChange('aircraft_type')} fullWidth>
              {TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>

          {/* Row 3 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Serial Number" value={form.serial_number || ''} onChange={handleChange('serial_number')} fullWidth />
            <TextField label="Registration Number" value={form.registration_number || ''} onChange={handleChange('registration_number')} fullWidth />
            <TextField label="Firmware Version" value={form.firmware_version || ''} onChange={handleChange('firmware_version')} placeholder="v04.02.0301" fullWidth />
          </Box>

          {/* Row 4 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Flight Hours" type="number" value={form.flight_hours ?? 0} onChange={handleChange('flight_hours')} error={!!errors.flight_hours} helperText={errors.flight_hours} fullWidth />
            <TextField label="Purchase Date" type="date" value={form.purchase_date || ''} onChange={handleChange('purchase_date')} error={!!errors.purchase_date} helperText={errors.purchase_date} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Purchase Price (R)" type="number" value={form.purchase_price || ''} onChange={handleChange('purchase_price')} fullWidth />
          </Box>

          {/* Row 5 - Dates */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Last Flight" type="date" value={form.last_flight_date || ''} onChange={handleChange('last_flight_date')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Last Service" type="date" value={form.last_service_date || ''} onChange={handleChange('last_service_date')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Next Service" type="date" value={form.next_service_date || ''} onChange={handleChange('next_service_date')} error={!!errors.next_service_date} helperText={errors.next_service_date} InputLabelProps={{ shrink: true }} fullWidth />
          </Box>

          {/* Row 6 */}
          <TextField label="Insurance Expiry" type="date" value={form.insurance_expiry || ''} onChange={handleChange('insurance_expiry')} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 300 }} />

          {/* Notes */}
          <TextField label="Notes" value={form.notes || ''} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : aircraft ? 'Update' : 'Register Aircraft'}</Button>
      </DialogActions>
    </Dialog>
  );
}
