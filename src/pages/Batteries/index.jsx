import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, InputAdornment, MenuItem, Chip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { IconButton } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getBatteries, createBattery, updateBattery, deleteBattery, getBatteryStats } from '../../services/batteryService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BatteryForm from './BatteryForm';

const MotionBox = motion.create(Box);

const statusStyles = {
  Charging: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  Ready: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  Cooling: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
  'In Use': { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.08)' },
  Maintenance: { color: '#D97706', bg: 'rgba(245, 158, 11, 0.08)' },
  Retired: { color: '#94A3B8', bg: 'rgba(15, 23, 42, 0.04)' },
};

export default function Batteries() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [batteries, setBatteries] = useState([]);
  const [stats, setStats] = useState({ total: 0, ready: 0, charging: 0, cooling: 0, maintenance: 0, lowCharge: 0, lowHealth: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBattery, setEditingBattery] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!company?.id) return;
    try {
      const [data, s] = await Promise.all([getBatteries(company.id), getBatteryStats(company.id)]);
      setBatteries(data);
      setStats(s);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (formData) => {
    try {
      if (editingBattery) { await updateBattery(editingBattery.id, formData); showToast('Battery updated'); }
      else { await createBattery({ ...formData, company_id: company.id }); showToast('Battery registered'); }
      setFormOpen(false);
      fetchAll();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBattery(deleteTarget.id); showToast('Battery removed'); setDeleteTarget(null); fetchAll(); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const filtered = statusFilter === 'all' ? batteries : batteries.filter(b => b.status === statusFilter);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Batteries</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Battery set management, health, and assignment</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => { setEditingBattery(null); setFormOpen(true); }}>Register Battery</Button>
        </Box>

        {/* Summary */}
        {stats.total > 0 && (
          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(7, 1fr)' }, gap: 2 }}>
              {[
                { label: 'Ready', value: stats.ready, color: '#16A34A', dot: true },
                { label: 'Charging', value: stats.charging, color: '#2563EB', dot: true },
                { label: 'Cooling', value: stats.cooling, color: '#7C3AED', dot: true },
                { label: 'Maintenance', value: stats.maintenance, color: '#D97706', dot: true },
                { label: 'Total', value: stats.total },
                { label: 'Low Charge', value: stats.lowCharge, color: stats.lowCharge > 0 ? '#EF4444' : undefined },
                { label: 'Low Health', value: stats.lowHealth, color: stats.lowHealth > 0 ? '#EF4444' : undefined },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.dot && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />}
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: item.color || 'text.primary' }}>{item.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}>
            <MenuItem value="all">All Status</MenuItem>
            {Object.keys(statusStyles).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Paper>

        {/* Content */}
        {!loading && batteries.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState icon={<BatteryChargingFullIcon />} title="No battery sets registered" description="Register your first battery pack to begin tracking charge status and aircraft assignment." actionLabel="Register Battery" onAction={() => { setEditingBattery(null); setFormOpen(true); }} />
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((battery, i) => {
              const style = statusStyles[battery.status] || statusStyles.Ready;
              const chargeColor = battery.current_charge >= 70 ? '#16A34A' : battery.current_charge >= 30 ? '#F59E0B' : '#EF4444';
              const warnings = [];
              if (battery.current_charge < 30) warnings.push('Low charge');
              if (battery.battery_health < 80) warnings.push('Low health');

              return (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={battery.id}>
                  <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                    <Paper sx={{ p: 2.5, bgcolor: '#FFFFFF', height: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{battery.battery_code}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{battery.manufacturer} {battery.model}</Typography>
                        </Box>
                        <Chip label={battery.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.6rem', height: 22 }} />
                      </Box>

                      {/* Charge bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', fontWeight: 600 }}>CHARGE</Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: chargeColor }}>{battery.current_charge}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={battery.current_charge} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(15,23,42,0.04)', '& .MuiLinearProgress-bar': { bgcolor: chargeColor, borderRadius: 3 } }} />
                      </Box>

                      {/* Metrics */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600 }}>HEALTH</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{battery.battery_health}%</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600 }}>CYCLES</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{battery.charge_cycles}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600 }}>TEMP</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{battery.temperature ? `${battery.temperature}°C` : '—'}</Typography>
                        </Box>
                      </Box>

                      {/* Aircraft */}
                      {battery.aircraft?.aircraft_name && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5 }}>✈ {battery.aircraft.aircraft_name}</Typography>
                      )}

                      {/* Warnings */}
                      {warnings.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                          {warnings.map((w, i) => (
                            <Chip key={i} icon={<WarningAmberIcon sx={{ fontSize: '0.7rem' }} />} label={w} size="small" sx={{ fontSize: '0.6rem', height: 20, bgcolor: 'rgba(245,158,11,0.08)', color: 'warning.dark', fontWeight: 600, '& .MuiChip-icon': { color: 'warning.dark' } }} />
                          ))}
                        </Box>
                      )}

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, pt: 1.5, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                        <IconButton size="small" onClick={() => { setEditingBattery(battery); setFormOpen(true); }}><EditIcon sx={{ fontSize: '1rem' }} /></IconButton>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size="small" onClick={() => setDeleteTarget(battery)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
                      </Box>
                    </Paper>
                  </MotionBox>
                </Grid>
              );
            })}
          </Grid>
        )}
      </MotionBox>

      <BatteryForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} battery={editingBattery} />
      <ConfirmDialog open={!!deleteTarget} title="Remove Battery" message={`Remove "${deleteTarget?.battery_code}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
