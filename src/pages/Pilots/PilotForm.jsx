import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography, Avatar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../hooks/useAuth';
import { getAircraft } from '../../services/aircraftService';
import { uploadPilotPhoto } from '../../services/pilotService';

const STATUS_OPTIONS = ['Available', 'Flying', 'Standby', 'Training', 'On Leave', 'Off Duty', 'Inactive'];
const LICENCE_TYPES = ['Private RPL', 'Commercial RPL', 'Instructor', 'Student', 'Other'];

export default function PilotForm({ open, onClose, onSave, pilot }) {
  const { company } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);

  useEffect(() => {
    if (open && company?.id) {
      getAircraft(company.id).then(setAircraftList).catch(() => {});
      setForm(pilot ? {
        first_name: pilot.first_name || '', last_name: pilot.last_name || '', display_name: pilot.display_name || '',
        pilot_code: pilot.pilot_code || '', email: pilot.email || '', phone: pilot.phone || '',
        date_of_birth: pilot.date_of_birth || '', hire_date: pilot.hire_date || '',
        licence_number: pilot.licence_number || '', licence_type: pilot.licence_type || 'Commercial RPL',
        licence_expiry: pilot.licence_expiry || '', medical_expiry: pilot.medical_expiry || '',
        preferred_aircraft: pilot.preferred_aircraft || '', status: pilot.status || 'Available', notes: pilot.notes || '',
        total_flight_hours: pilot.total_flight_hours ?? 0,
      } : {
        first_name: '', last_name: '', display_name: '', pilot_code: '', email: '', phone: '',
        date_of_birth: '', hire_date: '', licence_number: '', licence_type: 'Commercial RPL',
        licence_expiry: '', medical_expiry: '', preferred_aircraft: '', status: 'Available', notes: '',
        total_flight_hours: 0,
      });
      setPhotoFile(null);
      setPhotoPreview(pilot?.photo_url || null);
      setErrors({});
    }
  }, [open, pilot, company?.id]);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.total_flight_hours < 0) e.total_flight_hours = 'Cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      payload.total_flight_hours = parseFloat(payload.total_flight_hours) || 0;
      await onSave(payload, photoFile);
    } finally { setSaving(false); }
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const initials = `${(form.first_name || '')[0] || ''}${(form.last_name || '')[0] || ''}`.toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{pilot ? 'Edit Pilot' : 'Register New Pilot'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Photo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar src={photoPreview || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.2rem', fontWeight: 700 }}>{initials}</Avatar>
            <Box>
              <Button size="small" startIcon={<CloudUploadIcon />} variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}>JPG, PNG. Max 5MB.</Typography>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
          </Box>

          {/* Name */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="First Name" value={form.first_name || ''} onChange={handleChange('first_name')} error={!!errors.first_name} helperText={errors.first_name} required fullWidth />
            <TextField label="Last Name" value={form.last_name || ''} onChange={handleChange('last_name')} error={!!errors.last_name} helperText={errors.last_name} required fullWidth />
            <TextField label="Display Name" value={form.display_name || ''} onChange={handleChange('display_name')} placeholder="Callsign or nickname" fullWidth />
          </Box>

          {/* Code & Contact */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Pilot Code" value={form.pilot_code || ''} onChange={handleChange('pilot_code')} placeholder="P001" fullWidth />
            <TextField label="Email" type="email" value={form.email || ''} onChange={handleChange('email')} error={!!errors.email} helperText={errors.email} fullWidth />
            <TextField label="Phone" value={form.phone || ''} onChange={handleChange('phone')} fullWidth />
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Date of Birth" type="date" value={form.date_of_birth || ''} onChange={handleChange('date_of_birth')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Hire Date" type="date" value={form.hire_date || ''} onChange={handleChange('hire_date')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField select label="Status" value={form.status || 'Available'} onChange={handleChange('status')} fullWidth>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>

          {/* Licence */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Licence Number" value={form.licence_number || ''} onChange={handleChange('licence_number')} fullWidth />
            <TextField select label="Licence Type" value={form.licence_type || 'Commercial RPL'} onChange={handleChange('licence_type')} fullWidth>
              {LICENCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>

          {/* Expiry dates */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Licence Expiry" type="date" value={form.licence_expiry || ''} onChange={handleChange('licence_expiry')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Medical Expiry" type="date" value={form.medical_expiry || ''} onChange={handleChange('medical_expiry')} InputLabelProps={{ shrink: true }} fullWidth />
          </Box>

          {/* Aircraft & Hours */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Preferred Aircraft" value={form.preferred_aircraft || ''} onChange={handleChange('preferred_aircraft')} fullWidth>
              <MenuItem value="">None</MenuItem>
              {aircraftList.map((a) => <MenuItem key={a.id} value={a.id}>{a.aircraft_name}</MenuItem>)}
            </TextField>
            <TextField label="Flight Hours" type="number" value={form.total_flight_hours ?? 0} onChange={handleChange('total_flight_hours')} error={!!errors.total_flight_hours} helperText={errors.total_flight_hours} fullWidth />
          </Box>

          <TextField label="Notes" value={form.notes || ''} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : pilot ? 'Update' : 'Register Pilot'}</Button>
      </DialogActions>
    </Dialog>
  );
}
