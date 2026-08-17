import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, TextField, InputAdornment, MenuItem, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getMissions, searchMissions, deleteMission, getMissionStats } from '../../services/missionPlannerService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MissionWizard from './MissionWizard';
import MissionExecutionPanel from './MissionExecutionPanel';

const MotionBox = motion.create(Box);

const statusStyles = {
  Draft: { color: '#64748B', bg: 'rgba(15,23,42,0.06)' },
  Planned: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  Ready: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  Dispatched: { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  'In Progress': { color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
  Completed: { color: '#16A34A', bg: 'rgba(22,163,74,0.06)' },
  Cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
};

const priorityColors = { Critical: '#EF4444', High: '#D97706', Normal: '#64748B', Low: '#94A3B8' };

export default function FlightPlanner() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [execMission, setExecMission] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search ? await searchMissions(company.id, search) : await getMissions(company.id);
      setMissions(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteMission(deleteTarget.id); showToast('Mission deleted'); setDeleteTarget(null); fetchAll(); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const filtered = statusFilter === 'all' ? missions : missions.filter(m => m.status === statusFilter);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Flight Planner</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Plan, schedule, and manage spray missions</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => setWizardOpen(true)}>Create Mission</Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField fullWidth size="small" placeholder="Search missions..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment> }} />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: 'text.tertiary', fontSize: '1rem' }} /></InputAdornment> }}>
              <MenuItem value="all">All Status</MenuItem>
              {Object.keys(statusStyles).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
        </Paper>

        {/* Content */}
        {!loading && filtered.length === 0 && missions.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState icon={<FlightTakeoffIcon />} title="No missions planned" description="Plan your first drone mission. The wizard will guide you through customer, field, aircraft, and weather selection." actionLabel="Create Mission" onAction={() => setWizardOpen(true)} />
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((mission, i) => {
              const style = statusStyles[mission.status] || statusStyles.Draft;
              return (
                <MotionBox key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }}>
                  <Paper sx={{ p: 2.5, bgcolor: '#FFFFFF', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } }} onClick={() => setExecMission(mission)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Priority dot */}
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: priorityColors[mission.priority] || '#64748B', flexShrink: 0 }} />

                      {/* Main info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{mission.mission_number}</Typography>
                          <Chip label={mission.status} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                          <Chip label={mission.priority} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20, borderColor: priorityColors[mission.priority], color: priorityColors[mission.priority] }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {mission.customers?.customer_name} • {mission.fields?.field_name} • {mission.fields?.crop || 'No crop'} • {mission.estimated_area || '?'} ha
                        </Typography>
                      </Box>

                      {/* Meta */}
                      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{new Date(mission.scheduled_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {mission.pilots ? `${mission.pilots.first_name} ${mission.pilots.last_name}` : 'No pilot'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{mission.aircraft?.aircraft_name || 'No aircraft'}</Typography>
                      </Box>

                      {/* Risk */}
                      {mission.flight_risk_score != null && (
                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: mission.flight_risk_score > 50 ? 'rgba(239,68,68,0.08)' : mission.flight_risk_score > 25 ? 'rgba(245,158,11,0.08)' : 'rgba(22,163,74,0.08)' }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: mission.flight_risk_score > 50 ? '#EF4444' : mission.flight_risk_score > 25 ? '#D97706' : '#16A34A' }}>{mission.flight_risk_score}</Typography>
                        </Box>
                      )}

                      <IconButton size="small" onClick={() => setDeleteTarget(mission)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
                    </Box>
                  </Paper>
                </MotionBox>
              );
            })}
          </Box>
        )}
      </MotionBox>

      <MissionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={fetchAll} />
      <MissionExecutionPanel open={!!execMission} onClose={() => setExecMission(null)} mission={execMission} onUpdated={fetchAll} mode="dispatcher" />
      <ConfirmDialog open={!!deleteTarget} title="Delete Mission" message={`Delete mission "${deleteTarget?.mission_number}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </Box>
  );
}
