import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Checkbox, Paper, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory2';
import { getAvailableAssets } from '../../services/missionAssetService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Multi-select asset picker for mission planning.
 * Shows available assets with checkboxes.
 */
export default function MissionAssetSelector({ selectedAssetIds = [], onChange }) {
  const { company } = useAuth();
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    getAvailableAssets(company.id)
      .then(setAssets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company?.id]);

  const filtered = search.trim()
    ? assets.filter(a =>
        a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.category_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  const handleToggle = (assetId) => {
    const newIds = selectedAssetIds.includes(assetId)
      ? selectedAssetIds.filter(id => id !== assetId)
      : [...selectedAssetIds, assetId];
    onChange?.(newIds);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Mission Assets
        </Typography>
        {selectedAssetIds.length > 0 && (
          <Chip label={`${selectedAssetIds.length} selected`} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
        )}
      </Box>

      <TextField
        fullWidth size="small" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
        sx={{ mb: 1.5 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} /></InputAdornment> }}
      />

      <Box sx={{ maxHeight: 240, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {filtered.length === 0 && !loading && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', textAlign: 'center', py: 2 }}>
            {search ? 'No matching assets' : 'No available assets'}
          </Typography>
        )}
        {filtered.map(asset => {
          const checked = selectedAssetIds.includes(asset.id);
          return (
            <Paper
              key={asset.id}
              onClick={() => handleToggle(asset.id)}
              sx={{
                p: 1.5,
                borderRadius: '10px',
                border: `1px solid ${checked ? 'rgba(22,163,74,0.3)' : 'rgba(15,23,42,0.06)'}`,
                bgcolor: checked ? 'rgba(22,163,74,0.03)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                transition: 'all 0.15s',
                '&:hover': { borderColor: 'rgba(22,163,74,0.2)' },
              }}
            >
              <Checkbox checked={checked} size="small" sx={{ p: 0, '&.Mui-checked': { color: '#16A34A' } }} />
              <InventoryIcon sx={{ fontSize: '0.9rem', color: checked ? '#16A34A' : 'text.tertiary' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{asset.asset_name}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                  {[asset.asset_categories?.name || asset.category_name, asset.brand, asset.model].filter(Boolean).join(' • ')}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
