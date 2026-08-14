import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';

export default function CustomerForm({ open, onClose, onSave, customer }) {
  const [form, setForm] = useState({ customer_name: '', contact_person: '', email: '', phone: '', billing_address: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(customer ? {
        customer_name: customer.customer_name || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        billing_address: customer.billing_address || '',
        notes: customer.notes || '',
      } : { customer_name: '', contact_person: '', email: '', phone: '', billing_address: '', notes: '' });
      setErrors({});
    }
  }, [open, customer]);

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.phone && !/^[\d\s\-+()]{7,20}$/.test(form.phone)) e.phone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
        {customer ? 'Edit Customer' : 'New Customer'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField label="Customer Name" value={form.customer_name} onChange={handleChange('customer_name')} error={!!errors.customer_name} helperText={errors.customer_name} required fullWidth />
          <TextField label="Contact Person" value={form.contact_person} onChange={handleChange('contact_person')} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} error={!!errors.email} helperText={errors.email} fullWidth />
            <TextField label="Phone" value={form.phone} onChange={handleChange('phone')} error={!!errors.phone} helperText={errors.phone} fullWidth />
          </Box>
          <TextField label="Billing Address" value={form.billing_address} onChange={handleChange('billing_address')} multiline rows={2} fullWidth />
          <TextField label="Notes" value={form.notes} onChange={handleChange('notes')} multiline rows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : customer ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}
