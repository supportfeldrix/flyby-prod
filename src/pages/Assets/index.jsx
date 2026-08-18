import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, TextField, InputAdornment, MenuItem, Chip, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BuildIcon from '@mui/icons-material/Build';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getAssets, getAssetStats, deleteAsset, retireAsset } from '../../services/assetService';
import { getAssetCategories } from '../../services/assetCategoryService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AssetDialog from './AssetDialog';
import AssetDetailsDialog from './AssetDetailsDialog';

const MotionBox = motion.create(Box);

const statusStyles = {
  Available: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  Reserved: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  'In Mission': { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  Maintenance: { color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  'Out of Service': { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  Retired: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
};

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.04)', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
        {Icon && <Icon sx={{ fontSize: '1rem', color }} />}
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
    </Paper>
  );
}

export default function Assets() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [detailAsset, setDetailAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [a, s, c] = await Promise.all([
        getAssets(company.id, { category: categoryFilter !== 'all' ? categoryFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined, search: search.trim() || undefined }),
        getAssetStats(company.id),
        getAssetCategories(company.id),
      ]);
      setAssets(a);
      setStats(s);
      setCategories(c);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, categoryFilter, statusFilter, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAsset(deleteTarget.id);
      showToast('Asset deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const handleEdit = (asset) => { setEditAsset(asset); setDialogOpen(true); };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Assets</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Field equipment, power systems, and operational assets</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => { setEditAsset(null); setDialogOpen(true); }}>
            Add Asset
          </Button>
        </Box>

        {/* Stats */}
        {stats && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
            <StatCard label="Total" value={stats.total} color="#0F172A" icon={InventoryIcon} />
            <StatCard label="Available" value={stats.available} color="#16A34A" icon={CheckCircleIcon} />
            <StatCard label="Reserved" value={stats.reserved} color="#2563EB" icon={BookmarkIcon} />
            <StatCard label="In Mission" value={stats.inMission} color="#7C3AED" icon={FlightTakeoffIcon} />
            <StatCard label="Maintenance" value={stats.maintenance} color="#D97706" icon={BuildIcon} />
            <StatCard label="Retired" value={stats.retired} color="#94A3B8" />
          </Box>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              fullWidth size="small" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }}
            />
            <TextField select size="small" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} sx={{ minWidth: 160 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}>
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="all">All Status</MenuItem>
              {Object.keys(statusStyles).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
        </Paper>

        {/* Asset List */}
        {!loading && assets.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState
              icon={<InventoryIcon />}
              title="No assets registered"
              description="Register your field equipment, generators, charging stations, and other operational assets."
              actionLabel="Add Asset"
              onAction={() => { setEditAsset(null); setDialogOpen(true); }}
            />
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {assets.map((asset, i) => {
              const style = statusStyles[asset.status] || statusStyles.Available;
              return (
                <MotionBox key={asset.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }}>
                  <Paper
                    onClick={() => setDetailAsset(asset)}
                    sx={{ p: 2.5, bgcolor: '#FFFFFF', cursor: 'pointer', borderRadius: '14px', border: '1px solid rgba(15,23,42,0.04)', transition: 'all 0.15s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderColor: 'rgba(22,163,74,0.15)' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Photo / Icon */}
                      <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {asset.photo_url ? (
                          <img src={asset.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <InventoryIcon sx={{ fontSize: '1.2rem', color: style.color }} />
                        )}
                      </Box>

                      {/* Main info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{asset.asset_name}</Typography>
                          <Chip label={asset.status} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: style.bg, color: style.color }} />
                          {asset.asset_number && <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'monospace', color: 'text.tertiary' }}>{asset.asset_number}</Typography>}
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {[asset.category_name || asset.asset_categories?.name, asset.brand, asset.model].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>

                      {/* Meta */}
                      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        {asset.serial_number && <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace' }}>{asset.serial_number}</Typography>}
                        {asset.current_location && <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>{asset.current_location}</Typography>}
                      </Box>
                    </Box>
                  </Paper>
                </MotionBox>
              );
            })}
          </Box>
        )}
      </MotionBox>

      {/* Create/Edit Dialog */}
      <AssetDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditAsset(null); }}
        onSaved={() => { setDialogOpen(false); setEditAsset(null); fetchAll(); }}
        asset={editAsset}
        categories={categories}
      />

      {/* Details Dialog */}
      <AssetDetailsDialog
        open={!!detailAsset}
        onClose={() => setDetailAsset(null)}
        asset={detailAsset}
        onEdit={handleEdit}
        onDelete={(a) => { setDetailAsset(null); setDeleteTarget(a); }}
        onRefresh={fetchAll}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Asset"
        message={`Delete "${deleteTarget?.asset_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
