import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Box, Typography, Button, Chip, Checkbox, FormControlLabel, LinearProgress, IconButton, Grid, Alert, TextField, Paper, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getChecklist, toggleChecklistItem, isChecklistComplete, getChecklistProgress } from '../../services/checklistService';
import { getFlightLog, addLogEntry } from '../../services/flightLogService';
import { dispatchMission, startMission, pauseMission, resumeMission, completeMission, abortMission, cancelMission } from '../../services/missionExecutionService';
import { updateMission, getMissions } from '../../services/missionPlannerService';
import { generateMissionReport } from '../../services/missionReportService';
import MissionReportDialog from '../../components/reports/MissionReportDialog';
import MissionReportPreview from '../../components/reports/MissionReportPreview';
import { supabase } from '../../lib/supabase';

const statusColors = {
  Draft: '#64748B', Planned: '#2563EB', Ready: '#16A34A', Dispatched: '#7C3AED',
  'Pre Flight': '#0EA5E9', Flying: '#16A34A', Paused: '#D97706', Completed: '#16A34A',
  Cancelled: '#94A3B8', Aborted: '#EF4444', Emergency: '#EF4444',
};

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MissionExecutionPanel({ open, onClose, mission: initialMission, onUpdated, mode = 'pilot' }) {
  const { profile, company } = useAuth();
  const { showToast } = useToast();
  const [mission, setMission] = useState(initialMission);
  const [checklist, setChecklist] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abortReason, setAbortReason] = useState('');
  const [showAbort, setShowAbort] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completionReport, setCompletionReport] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const timerRef = useRef(null);

  // Sync mission from prop
  useEffect(() => { setMission(initialMission); }, [initialMission]);

  // Re-fetch mission data to get fresh status
  const refreshMission = useCallback(async () => {
    if (!mission?.id) return;
    const { data } = await supabase
      .from('missions')
      .select('*, customers(customer_name), farms(farm_name), fields(field_name, crop, area_hectares), aircraft(aircraft_name, status), pilots(first_name, last_name, display_name, status), battery_sets:battery_id(battery_code, current_charge)')
      .eq('id', mission.id)
      .single();
    if (data) setMission(data);
  }, [mission?.id]);

  const fetchData = useCallback(async () => {
    if (!mission?.id) return;
    try {
      const [cl, lg] = await Promise.all([getChecklist(mission.id), getFlightLog(mission.id)]);
      setChecklist(cl || []);
      setLogs(lg || []);
    } catch (e) { /* optional */ }
  }, [mission?.id]);

  useEffect(() => {
    if (open && mission?.id) {
      fetchData();
      refreshMission();
    }
  }, [open, mission?.id, fetchData, refreshMission]);

  // Live timer when flying
  useEffect(() => {
    if (mission?.status === 'Flying' && mission?.started_at) {
      const startTime = new Date(mission.started_at).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
  }, [mission?.status, mission?.started_at]);

  const progress = getChecklistProgress(checklist);
  const allChecked = isChecklistComplete(checklist);
  const status = mission?.status || 'Draft';
  const pilotName = mission?.pilots ? (mission.pilots.display_name || `${mission.pilots.first_name} ${mission.pilots.last_name}`) : 'Unassigned';

  const handleToggle = async (item) => {
    try {
      await toggleChecklistItem(item.id, !item.checked, profile?.id, profile?.full_name);
      fetchData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      switch (action) {
        case 'dispatch':
          await dispatchMission(mission, company.id, profile);
          showToast('Mission dispatched — complete pre-flight checklist');
          break;
        case 'start':
          // Log checklist complete first
          await addLogEntry(mission.id, company.id, 'checklist_complete', 'Pre-flight checklist complete', profile?.id, profile?.full_name);
          await startMission(mission, company.id, profile);
          showToast('Mission started — aircraft airborne');
          break;
        case 'pause':
          await pauseMission(mission.id, company.id, profile, 'Pilot-initiated pause');
          showToast('Mission paused');
          break;
        case 'resume':
          await resumeMission(mission.id, company.id, profile);
          showToast('Mission resumed');
          break;
        case 'complete':
          await completeMission(mission, company.id, profile);
          // Auto-generate mission report after completion
          try {
            console.log('[FlyBy] Mission completed. Generating report for mission:', mission.id);
            const report = await generateMissionReport(mission.id, company.id, profile?.id, profile?.full_name);
            console.log('[FlyBy] Report generated successfully:', report.report_number);
            setCompletionReport(report);
            setShowReportDialog(true);
            showToast('Mission completed — report generated');
          } catch (reportErr) {
            console.error('[FlyBy] Report generation failed:', reportErr);
            showToast('Mission completed but report generation failed. Check console for details.', 'warning');
          }
          break;
        case 'abort':
          await abortMission(mission, company.id, profile, abortReason, false);
          showToast('Mission aborted');
          setShowAbort(false);
          break;
        case 'emergency':
          await abortMission(mission, company.id, profile, 'Emergency stop', true);
          showToast('EMERGENCY STOP executed', 'error');
          break;
        case 'cancel':
          await cancelMission(mission.id, company.id, profile, 'Cancelled by dispatcher');
          showToast('Mission cancelled');
          break;
      }
      await refreshMission();
      await fetchData();
      onUpdated?.();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  if (!mission) return null;

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FlightTakeoffIcon sx={{ color: statusColors[status] }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>{mission.mission_number}</Typography>
              <Chip label={status} size="small" sx={{ bgcolor: `${statusColors[status]}15`, color: statusColors[status], fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {mission.fields?.field_name} • {mission.fields?.crop} • {mission.estimated_area || mission.fields?.area_hectares || '?'} ha
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Live timer */}
          {(status === 'Flying' || status === 'Paused') && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '0.9rem' }} />}
              label={formatTimer(elapsed)}
              sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', bgcolor: status === 'Flying' ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)', color: status === 'Flying' ? '#16A34A' : '#D97706', '& .MuiChip-icon': { color: status === 'Flying' ? '#16A34A' : '#D97706' } }}
            />
          )}
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3, py: 3, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Left — Mission Info, Actions & Checklist */}
          <Grid item xs={12} md={7}>
            {/* Mission Information Card */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 2 }}>Mission Resources</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Pilot</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{pilotName}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AirplanemodeActiveIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Aircraft</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{mission.aircraft?.aircraft_name || 'Unassigned'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <BatteryChargingFullIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Battery</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {mission.battery_sets?.battery_code || 'None'}{mission.battery_sets?.current_charge != null ? ` (${mission.battery_sets.current_charge}%)` : ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTimeIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary' }}>Dispatched</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {mission.dispatched_at ? new Date(mission.dispatched_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {mission.dispatcher_notes && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mb: 0.5 }}>Dispatcher Notes</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{mission.dispatcher_notes}</Typography>
                </Box>
              )}
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              {/* Dispatcher actions */}
              {status === 'Planned' && <Button variant="contained" startIcon={<SendIcon />} onClick={() => handleAction('dispatch')} disabled={loading} size="large">Dispatch Mission</Button>}
              {(status === 'Planned' || status === 'Draft') && <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleAction('cancel')} disabled={loading}>Cancel</Button>}

              {/* Pilot-only actions (hidden in dispatcher mode) */}
              {mode === 'pilot' && status === 'Dispatched' && allChecked && <Button variant="contained" startIcon={<FlightTakeoffIcon />} onClick={() => handleAction('start')} disabled={loading} size="large">Start Mission</Button>}
              {mode === 'pilot' && status === 'Dispatched' && !allChecked && <Button variant="outlined" disabled startIcon={<FlightTakeoffIcon />} size="large">Complete Checklist to Start</Button>}
              {mode === 'pilot' && status === 'Flying' && <Button variant="outlined" startIcon={<PauseIcon />} onClick={() => handleAction('pause')} disabled={loading}>Pause</Button>}
              {mode === 'pilot' && status === 'Paused' && <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => handleAction('resume')} disabled={loading}>Resume</Button>}
              {mode === 'pilot' && (status === 'Flying' || status === 'Paused') && <Button variant="contained" color="primary" startIcon={<CheckCircleIcon />} onClick={() => handleAction('complete')} disabled={loading} size="large">Complete Mission</Button>}
              {mode === 'pilot' && (status === 'Flying' || status === 'Paused') && <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={() => setShowAbort(true)} disabled={loading}>Abort</Button>}
              {mode === 'pilot' && (status === 'Flying' || status === 'Paused') && <Button variant="contained" color="error" startIcon={<WarningAmberIcon />} onClick={() => handleAction('emergency')} disabled={loading} sx={{ fontWeight: 700 }}>EMERGENCY</Button>}

              {/* Dispatcher monitoring message */}
              {mode === 'dispatcher' && ['Dispatched', 'Pre Flight', 'Flying', 'Paused'].includes(status) && (
                <Chip label="Awaiting pilot execution" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
              )}
            </Box>

            {/* Abort reason */}
            {showAbort && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>Abort Reason</Typography>
                <TextField size="small" fullWidth value={abortReason} onChange={e => setAbortReason(e.target.value)} placeholder="Enter reason..." sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" color="error" onClick={() => handleAction('abort')} disabled={!abortReason}>Confirm Abort</Button>
                  <Button size="small" onClick={() => setShowAbort(false)}>Cancel</Button>
                </Box>
              </Alert>
            )}

            {/* Pre-Flight Checklist — shown when Dispatched */}
            {status === 'Dispatched' && checklist.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Pre-Flight Checklist</Typography>
                  <Chip label={`${progress}%`} size="small" sx={{ bgcolor: progress === 100 ? 'rgba(22,163,74,0.08)' : 'rgba(37,99,235,0.08)', color: progress === 100 ? '#16A34A' : '#2563EB', fontWeight: 700, fontSize: '0.75rem' }} />
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(15,23,42,0.04)', '& .MuiLinearProgress-bar': { bgcolor: progress === 100 ? '#16A34A' : '#2563EB', borderRadius: 3 } }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {checklist.map((item) => (
                    <FormControlLabel
                      key={item.id}
                      control={<Checkbox checked={item.checked} onChange={() => mode === 'pilot' && handleToggle(item)} size="small" sx={{ '&.Mui-checked': { color: '#16A34A' } }} disabled={mode !== 'pilot'} />}
                      label={<Typography sx={{ fontSize: '0.8rem', textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'text.tertiary' : 'text.primary' }}>{item.item_label}</Typography>}
                    />
                  ))}
                </Box>
                {allChecked && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All checks passed — ready for takeoff.</Typography>
                  </Alert>
                )}
              </Paper>
            )}

            {/* Completed state */}
            {status === 'Completed' && (
              <Alert severity="success" sx={{ borderRadius: '12px' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Mission Completed</Typography>
                <Typography sx={{ fontSize: '0.8rem' }}>
                  Duration: {mission.actual_duration || '—'} min • Area: {mission.actual_area || '—'} ha • Battery used: {mission.actual_battery_used || '—'}%
                </Typography>
              </Alert>
            )}

            {(status === 'Cancelled' || status === 'Aborted' || status === 'Emergency') && (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Mission {status}</Typography>
                {mission.completion_notes && <Typography sx={{ fontSize: '0.8rem' }}>{mission.completion_notes}</Typography>}
              </Alert>
            )}
          </Grid>

          {/* Right — Flight Log Timeline */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Flight Log</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 450, overflow: 'auto' }}>
              {logs.length === 0 && <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', textAlign: 'center', py: 3 }}>No log entries yet.</Typography>}
              {logs.map((log, i) => (
                <Box key={log.id} sx={{ display: 'flex', gap: 1.5, pb: 2, position: 'relative' }}>
                  {/* Connector line */}
                  {i < logs.length - 1 && (
                    <Box sx={{ position: 'absolute', left: 4, top: 14, width: 1, height: 'calc(100% - 8px)', bgcolor: 'rgba(15,23,42,0.08)' }} />
                  )}
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: statusColors[log.event_type] || '#64748B', mt: 0.6, flexShrink: 0, position: 'relative', zIndex: 1, border: '2px solid #FFFFFF' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.event_label}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary' }}>
                      {new Date(log.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {log.user_name || 'System'}
                    </Typography>
                    {log.notes && <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>{log.notes}</Typography>}
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Dialog>

    {/* Mission Report Completion Dialog */}
    <MissionReportDialog
      open={showReportDialog}
      onClose={() => {
        setShowReportDialog(false);
        setCompletionReport(null);
      }}
      report={completionReport}
      onPreview={(report) => {
        setShowReportDialog(false);
        setPreviewReport(report);
      }}
    />

    {/* Mission Report Preview */}
    <MissionReportPreview
      open={!!previewReport}
      onClose={() => setPreviewReport(null)}
      report={previewReport}
    />
    </>
  );
}
