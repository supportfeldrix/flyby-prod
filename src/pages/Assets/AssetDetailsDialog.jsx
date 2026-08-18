import { Dialog, Box, Typography, Button, Chip, Grid, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory2';
import { updateAssetStatus } from '../../services/assetService';
import { useToast } from '../../context/ToastContext';

const statusStyles = {
  Available: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  Reserved: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  'In Mission': { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  Maintenance: { color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  'Out of Service': { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  Retired: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
};

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function formatCurrency(v) { return v ? `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'; }

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

export default function AssetDetailsDialog({ open, onClose, asset, onEdit, onDelete, onRefresh }) {
  const { showToast } = useToast();

  if (!asset) return null;
  const style = statusStyles[asset.status] || statusStyles.Available;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateAssetStatus(asset.id, newStatus);
      showToast(`Asset marked as ${newStatus}`);
      onRefresh?.();
      onClose();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '12px', bgcolor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {asset.photo_url ? (
            <img src={asset.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <InventoryIcon sx={{ fontSize: '1.5rem', color: style.color }} />
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{asset.asset_name}</Typography>
            <Chip label={asset.status} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: style.bg, color: style.color }} />
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {[asset.category_name || asset.asset_categories?.name, asset.brand, asset.model].filter(Boolean).join(' • ')}
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={6}><DetailRow label="Serial Number" value={asset.serial_number} /></Grid>
          <Grid item xs={6}><DetailRow label="Asset Number" value={asset.asset_number} /></Grid>
          <Grid item xs={6}><DetailRow label="Brand" value={asset.brand} /></Grid>
          <Grid item xs={6}><DetailRow label="Model" value={asset.model} /></Grid>
          <Grid item xs={6}><DetailRow label="Category" value={asset.category_name || asset.asset_categories?.name} /></Grid>
          <Grid item xs={6}><DetailRow label="Location" value={asset.current_location} /></Grid>
          <Grid item xs={6}><DetailRow label="Purchase Date" value={formatDate(asset.purchase_date)} /></Grid>
          <Grid item xs={6}><DetailRow label="Purchase Price" value={formatCurrency(asset.purchase_price)} /></Grid>
          <Grid item xs={6}><DetailRow label="Warranty Expiry" value={formatDate(asset.warranty_expiry)} /></Grid>
          <Grid item xs={6}><DetailRow label="Supplier" value={asset.supplier} /></Grid>
          {asset.notes && <Grid item xs={12}><DetailRow label="Notes" value={asset.notes} /></Grid>}
        </Grid>

        {/* Status Quick Actions */}
        <Divider sx={{ my: 2.5 }} />
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>Quick Status</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['Available', 'Maintenance', 'Out of Service'].filter(s => s !== asset.status).map(s => {
            const st = statusStyles[s];
            return (
              <Chip key={s} label={s} size="small" onClick={() => handleStatusChange(s)} sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', bgcolor: st.bg, color: st.color, '&:hover': { opacity: 0.8 } }} />
            );
          })}
        </Box>

        {/* Future placeholders */}
        <Divider sx={{ my: 2.5 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['QR Code', 'Service History', 'Fuel Tracking', 'Inspection', 'Calibration'].map(item => (
            <Chip key={item} label={item} size="small" variant="outlined" disabled sx={{ fontSize: '0.6rem', borderColor: 'rgba(15,23,42,0.08)' }} />
          ))}
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ px: 3, pb: 2.5, display: 'flex', justifyContent: 'space-between' }}>
        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete?.(asset)} sx={{ textTransform: 'none' }}>Delete</Button>
        <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => { onClose(); onEdit?.(asset); }} sx={{ textTransform: 'none' }}>Edit Asset</Button>
      </Box>
    </Dialog>
  );
}
