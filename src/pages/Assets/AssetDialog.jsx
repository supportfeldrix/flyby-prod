import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Box, Typography, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { createAsset, updateAsset, uploadAssetPhoto } from '../../services/assetService';

const STATUS_OPTIONS = ['Available', 'Reserved', 'In Mission', 'Maintenance', 'Out of Service', 'Retired'];

export default function AssetDialog({ open, onClose, onSaved, asset, categories }) {
  const { company } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState({
    asset_name: '', category_id: '', category_name: '', brand: '', model: '',
    serial_number: '', asset_number: '', purchase_date: '', purchase_price: '',
    warranty_expiry: '', supplier: '', current_location: '', status: 'Available', notes: '',
  });

  useEffect(() => {
    if (open) {
      if (asset) {
        setForm({
          asset_name: asset.asset_name || '',
          category_id: asset.category_id || '',
          category_name: asset.category_name || '',
          brand: asset.brand || '',
          model: asset.model || '',
          serial_number: asset.serial_number || '',
          asset_number: asset.asset_number || '',
          purchase_date: asset.purchase_date || '',
          purchase_price: asset.purchase_price || '',
          warranty_expiry: asset.warranty_expiry || '',
          supplier: asset.supplier || '',
          current_location: asset.current_location || '',
          status: asset.status || 'Available',
          notes: asset.notes || '',
        });
      } else {
        setForm({ asset_name: '', category_id: '', category_name: '', brand: '', model: '', serial_number: '', asset_number: '', purchase_date: '', purchase_price: '', warranty_expiry: '', supplier: '', current_location: '', status: 'Available', notes: '' });
      }
      setPhotoFile(null);
    }
  }, [open, asset]);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleCategoryChange = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    setForm(f => ({ ...f, category_id: categoryId, category_name: cat?.name || '' }));
  };

  const handleSave = async () => {
    if (!form.asset_name.trim()) { showToast('Asset name is required', 'error'); return; }
    setSaving(true);
    try {
      let photoUrl = asset?.photo_url || null;

      if (asset) {
        // Update
        if (photoFile) {
          photoUrl = await uploadAssetPhoto(photoFile, company.id, asset.id);
        }
        await updateAsset(asset.id, { ...form, photo_url: photoUrl, purchase_price: form.purchase_price || null });
        showToast('Asset updated');
      } else {
        // Create
        const created = await createAsset({ ...form, purchase_price: form.purchase_price || null }, company.id);
        if (photoFile) {
          photoUrl = await uploadAssetPhoto(photoFile, company.id, created.id);
          await updateAsset(created.id, { photo_url: photoUrl });
        }
        showToast('Asset created');
      }
      onSaved?.();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{asset ? 'Edit Asset' : 'Add Asset'}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Asset Name *" value={form.asset_name} onChange={e => handleChange('asset_name', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth size="small" label="Category" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
              <MenuItem value="">None</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth size="small" label="Status" value={form.status} onChange={e => handleChange('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Brand" value={form.brand} onChange={e => handleChange('brand', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Model" value={form.model} onChange={e => handleChange('model', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Serial Number" value={form.serial_number} onChange={e => handleChange('serial_number', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Asset Number" value={form.asset_number} onChange={e => handleChange('asset_number', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Purchase Date" type="date" value={form.purchase_date} onChange={e => handleChange('purchase_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Purchase Price (R)" type="number" value={form.purchase_price} onChange={e => handleChange('purchase_price', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={e => handleChange('warranty_expiry', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Supplier" value={form.supplier} onChange={e => handleChange('supplier', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Current Location" value={form.current_location} onChange={e => handleChange('current_location', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />} onClick={() => fileRef.current?.click()} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,23,42,0.12)' }}>
              {photoFile ? photoFile.name : 'Upload Photo'}
            </Button>
            <input ref={fileRef} type="file" hidden accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : asset ? 'Update' : 'Create Asset'}</Button>
      </DialogActions>
    </Dialog>
  );
}
