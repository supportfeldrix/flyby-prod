import { useState, useEffect } from 'react';
import { Dialog, Box, Typography, Button, Stepper, Step, StepLabel, Paper, Grid, Chip, TextField, MenuItem, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { getCustomers } from '../../services/customerService';
import { getFarmsByCustomer } from '../../services/farmService';
import { getFieldsByFarm } from '../../services/fieldService';
import { getAircraft } from '../../services/aircraftService';
import { getPilots } from '../../services/pilotService';
import { getBatteries } from '../../services/batteryService';
import { getAssets } from '../../services/assetService';
import { assignAssetsToMission } from '../../services/missionAssetService';
import { getCurrentWeather, getHourlyForecast } from '../../services/weatherService';
import { evaluateFieldConditions, calculateFlightRisk } from '../../services/weatherDecisionService';
import { getTodaySprayWindow, formatSprayWindow } from '../../services/sprayWindowService';
import { createMission, generateMissionNumber, calculateDuration, estimateBatteryUsage } from '../../services/missionPlannerService';
import { validateMission } from '../../services/missionValidationService';

const steps = ['Customer', 'Farm', 'Field', 'Weather', 'Aircraft', 'Pilot', 'Battery', 'Equipment', 'Details', 'Review'];
const statusColors = { SAFE: '#16A34A', CAUTION: '#D97706', 'DO NOT FLY': '#EF4444' };

export default function MissionWizard({ open, onClose, onCreated }) {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Data pools
  const [customers, setCustomers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [aircraftList, setAircraftList] = useState([]);
  const [pilotList, setPilotList] = useState([]);
  const [batteryList, setBatteryList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  // Selections
  const [sel, setSel] = useState({ customer: null, farm: null, field: null, aircraft: null, pilot: null, battery: null, equipment: null });
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [details, setDetails] = useState({ scheduled_date: new Date().toISOString().split('T')[0], priority: 'Normal', application_type: 'Spray', chemical_name: '', application_rate: '', dispatcher_notes: '' });

  // Load customers on open
  useEffect(() => {
    if (open && company?.id) {
      getCustomers(company.id).then(setCustomers).catch(() => {});
      getAircraft(company.id).then(setAircraftList).catch(() => {});
      getPilots(company.id).then(setPilotList).catch(() => {});
      getBatteries(company.id).then(setBatteryList).catch(() => {});
      getAssets(company.id, { status: 'Available' }).then(setEquipmentList).catch(() => {});
      setSel({ customer: null, farm: null, field: null, aircraft: null, pilot: null, battery: null, equipment: null });
      setSelectedAssetIds([]);
      setStep(0);
      setWeather(null);
      setDetails({ scheduled_date: new Date().toISOString().split('T')[0], priority: 'Normal', application_type: 'Spray', chemical_name: '', application_rate: '', dispatcher_notes: '' });
    }
  }, [open, company?.id]);

  // Load farms when customer selected
  useEffect(() => {
    if (sel.customer) getFarmsByCustomer(sel.customer.id).then(setFarms).catch(() => {});
    else setFarms([]);
  }, [sel.customer]);

  // Load fields when farm selected
  useEffect(() => {
    if (sel.farm) getFieldsByFarm(sel.farm.id).then(setFields).catch(() => {});
    else setFields([]);
  }, [sel.farm]);

  // Load weather when field selected
  useEffect(() => {
    if (sel.field?.latitude && sel.field?.longitude) {
      Promise.all([
        getCurrentWeather(sel.field.latitude, sel.field.longitude),
        getHourlyForecast(sel.field.latitude, sel.field.longitude),
      ]).then(([w, h]) => { setWeather(w); setHourly(h); }).catch(() => {});
    }
  }, [sel.field]);

  const weatherEval = weather ? evaluateFieldConditions(weather, sel.field?.wind_limit) : null;
  const riskScore = weather ? calculateFlightRisk(weather) : 0;
  const sprayWindow = hourly.length > 0 ? getTodaySprayWindow(hourly, sel.field?.wind_limit) : null;
  const duration = calculateDuration(sel.field?.area_hectares);
  const batteryUsage = estimateBatteryUsage(duration);

  const canNext = () => {
    switch (step) {
      case 0: return !!sel.customer;
      case 1: return !!sel.farm;
      case 2: return !!sel.field;
      case 3: return true; // weather is informational
      case 4: return !!sel.aircraft;
      case 5: return !!sel.pilot;
      case 6: return true; // battery optional
      case 7: return true; // equipment optional
      case 8: return !!details.scheduled_date;
      case 9: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const missionNumber = await generateMissionNumber(company.id);
      const fmtWindow = formatSprayWindow(sprayWindow);
      const mission = {
        company_id: company.id,
        mission_number: missionNumber,
        customer_id: sel.customer?.id,
        farm_id: sel.farm?.id,
        field_id: sel.field?.id,
        aircraft_id: sel.aircraft?.id,
        pilot_id: sel.pilot?.id,
        battery_id: sel.battery?.id || null,
        equipment_id: sel.equipment?.id || null,
        scheduled_date: details.scheduled_date,
        recommended_start: fmtWindow.start || null,
        recommended_finish: fmtWindow.end || null,
        priority: details.priority,
        status: 'Planned',
        crop: sel.field?.crop || details.crop || null,
        application_type: details.application_type,
        chemical_name: details.chemical_name || null,
        application_rate: details.application_rate ? parseFloat(details.application_rate) : null,
        estimated_area: sel.field?.area_hectares || null,
        estimated_duration: duration || null,
        estimated_battery_usage: batteryUsage || null,
        weather_snapshot: weather ? { temperature: weather.temperature, windSpeed: weather.windSpeed, humidity: weather.humidity, condition: weather.condition } : null,
        flight_risk_score: riskScore,
        dispatcher_notes: details.dispatcher_notes || null,
      };
      await createMission(mission);
      // Assign selected assets to mission
      if (selectedAssetIds.length > 0) {
        try {
          const { data: created } = await supabase.from('missions').select('id').eq('mission_number', missionNumber).eq('company_id', company.id).single();
          if (created) await assignAssetsToMission(created.id, selectedAssetIds, company.id);
        } catch (assetErr) { console.warn('[FlyBy] Asset assignment skipped:', assetErr.message); }
      }
      showToast(`Mission ${missionNumber} created successfully`);
      onCreated?.();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  };

  // Selection helpers
  const SelectionCard = ({ item, selected, onClick, primary, secondary, chip }) => (
    <Paper onClick={onClick} sx={{ p: 2, cursor: 'pointer', border: selected ? '2px solid #16A34A' : '1px solid rgba(15,23,42,0.06)', borderRadius: '12px', bgcolor: selected ? 'rgba(22,163,74,0.03)' : '#FFFFFF', transition: 'all 0.15s', '&:hover': { borderColor: selected ? '#16A34A' : 'rgba(15,23,42,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{primary}</Typography>
          {secondary && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{secondary}</Typography>}
        </Box>
        {chip}
        {selected && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: '1.2rem' }} />}
      </Box>
    </Paper>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {customers.map(c => <SelectionCard key={c.id} item={c} selected={sel.customer?.id === c.id} onClick={() => setSel(p => ({ ...p, customer: c, farm: null, field: null }))} primary={c.customer_name} secondary={c.contact_person} />)}
          {customers.length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No customers. Create one first.</Typography>}
        </Box>
      );
      case 1: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {farms.map(f => <SelectionCard key={f.id} item={f} selected={sel.farm?.id === f.id} onClick={() => setSel(p => ({ ...p, farm: f, field: null }))} primary={f.farm_name} secondary={`${f.province || ''} ${f.town || ''}`} />)}
          {farms.length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No farms for this customer.</Typography>}
        </Box>
      );
      case 2: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {fields.map(f => <SelectionCard key={f.id} item={f} selected={sel.field?.id === f.id} onClick={() => setSel(p => ({ ...p, field: f }))} primary={f.field_name} secondary={`${f.crop || 'No crop'} • ${f.area_hectares || '?'} ha`} chip={f.boundary ? <Chip label="Boundary ✓" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} /> : null} />)}
          {fields.length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No fields for this farm.</Typography>}
        </Box>
      );
      case 3: return (
        <Box>
          {weatherEval ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 3, borderLeft: `4px solid ${statusColors[weatherEval.status]}`, bgcolor: '#FFFFFF' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: statusColors[weatherEval.status], mb: 0.5 }}>
                  {weatherEval.status === 'SAFE' ? 'Safe to Fly' : weatherEval.status === 'CAUTION' ? 'Proceed with Caution' : 'Do Not Fly'}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{weatherEval.recommendation}</Typography>
              </Paper>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                {weatherEval.checks.map(c => (
                  <Box key={c.label} sx={{ p: 1.5, borderRadius: '8px', textAlign: 'center', bgcolor: `${statusColors[c.status]}06`, border: `1px solid ${statusColors[c.status]}15` }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600 }}>{c.label}</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: statusColors[c.status] }}>{c.value}</Typography>
                  </Box>
                ))}
              </Box>
              {sprayWindow && (
                <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.1)' }}>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Recommended Spray Window</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#16A34A' }}>{formatSprayWindow(sprayWindow).text}</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>Select a field with GPS coordinates to load weather.</Typography>
          )}
        </Box>
      );
      case 4: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {aircraftList.filter(a => a.status === 'Ready').map(a => (
            <SelectionCard key={a.id} selected={sel.aircraft?.id === a.id} onClick={() => setSel(p => ({ ...p, aircraft: a }))} primary={a.aircraft_name} secondary={`${a.manufacturer} ${a.model} • ${a.flight_hours}h`} chip={<Chip label="Ready" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />} />
          ))}
          {aircraftList.filter(a => a.status === 'Ready').length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No aircraft ready for dispatch.</Typography>}
        </Box>
      );
      case 5: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {pilotList.filter(p => p.status === 'Available' || p.status === 'Standby').map(p => (
            <SelectionCard key={p.id} selected={sel.pilot?.id === p.id} onClick={() => setSel(prev => ({ ...prev, pilot: p }))} primary={p.display_name || `${p.first_name} ${p.last_name}`} secondary={`${p.licence_type} • ${p.total_flight_hours}h`} chip={<Chip label={p.status} size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />} />
          ))}
          {pilotList.filter(p => p.status === 'Available' || p.status === 'Standby').length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No pilots available.</Typography>}
        </Box>
      );
      case 6: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>Optional — select a battery pack for this mission.</Typography>
          {batteryList.filter(b => b.status === 'Ready' && b.current_charge >= 30 && b.battery_health >= 80).map(b => (
            <SelectionCard key={b.id} selected={sel.battery?.id === b.id} onClick={() => setSel(p => ({ ...p, battery: sel.battery?.id === b.id ? null : b }))} primary={b.battery_code} secondary={`${b.current_charge}% charge • ${b.battery_health}% health`} chip={b.aircraft?.aircraft_name ? <Chip label={b.aircraft.aircraft_name} size="small" sx={{ fontSize: '0.6rem', height: 18 }} variant="outlined" /> : null} />
          ))}
          {batteryList.filter(b => b.status === 'Ready' && b.current_charge >= 30).length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No batteries ready. Charge or register batteries.</Typography>}
        </Box>
      );
      case 7: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>Optional — select assets for this mission (generators, chargers, water systems, etc.)</Typography>
          {equipmentList.length === 0 && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No available assets. Register assets in the Assets module.</Typography>}
          {equipmentList.map(a => {
            const checked = selectedAssetIds.includes(a.id);
            return (
              <Paper
                key={a.id}
                onClick={() => {
                  setSelectedAssetIds(prev => checked ? prev.filter(id => id !== a.id) : [...prev, a.id]);
                }}
                sx={{ p: 2, cursor: 'pointer', border: checked ? '2px solid #16A34A' : '1px solid rgba(15,23,42,0.06)', borderRadius: '12px', bgcolor: checked ? 'rgba(22,163,74,0.03)' : '#FFFFFF', transition: 'all 0.15s', '&:hover': { borderColor: checked ? '#16A34A' : 'rgba(15,23,42,0.15)' } }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.asset_name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {[a.category_name || a.asset_categories?.name, a.brand, a.model].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                  {checked && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: '1.2rem' }} />}
                </Box>
              </Paper>
            );
          })}
          {selectedAssetIds.length > 0 && (
            <Chip label={`${selectedAssetIds.length} asset${selectedAssetIds.length !== 1 ? 's' : ''} selected`} sx={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
          )}
        </Box>
      );
      case 8: return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Mission Date" type="date" value={details.scheduled_date} onChange={e => setDetails(p => ({ ...p, scheduled_date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField select label="Priority" value={details.priority} onChange={e => setDetails(p => ({ ...p, priority: e.target.value }))} fullWidth>
              {['Critical', 'High', 'Normal', 'Low'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Application Type" value={details.application_type} onChange={e => setDetails(p => ({ ...p, application_type: e.target.value }))} fullWidth>
              {['Spray', 'Spread', 'Survey', 'Mapping', 'Inspection', 'Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Chemical" value={details.chemical_name} onChange={e => setDetails(p => ({ ...p, chemical_name: e.target.value }))} placeholder="Roundup PowerMAX" fullWidth />
          </Box>
          <TextField label="Application Rate (L/ha)" type="number" value={details.application_rate} onChange={e => setDetails(p => ({ ...p, application_rate: e.target.value }))} placeholder="15" sx={{ maxWidth: 300 }} />
          <TextField label="Dispatcher Notes" value={details.dispatcher_notes} onChange={e => setDetails(p => ({ ...p, dispatcher_notes: e.target.value }))} multiline rows={3} fullWidth />
        </Box>
      );
      case 9: {
        const validation = validateMission(
          { customer_id: sel.customer?.id, farm_id: sel.farm?.id, field_id: sel.field?.id, aircraft_id: sel.aircraft?.id, pilot_id: sel.pilot?.id },
          { aircraft: sel.aircraft, pilot: sel.pilot, battery: sel.battery, weatherEval, field: sel.field }
        );
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Customer</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.customer?.customer_name}</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Farm</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.farm?.farm_name}</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Field</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.field?.field_name} • {sel.field?.area_hectares} ha</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Aircraft</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.aircraft?.aircraft_name}</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Pilot</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.pilot?.display_name || `${sel.pilot?.first_name} ${sel.pilot?.last_name}`}</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Battery</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{sel.battery?.battery_code || 'None'}</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Est. Duration</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{duration} min</Typography></Box>
              <Box><Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase' }}>Flight Risk</Typography><Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: riskScore > 50 ? '#EF4444' : riskScore > 25 ? '#D97706' : '#16A34A' }}>{riskScore}/100</Typography></Box>
            </Box>

            {/* Validation */}
            {validation.errors.length > 0 && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {validation.errors.map((e, i) => <Typography key={i} sx={{ fontSize: '0.8rem' }}>{e}</Typography>)}
              </Alert>
            )}
            {validation.warnings.length > 0 && (
              <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                {validation.warnings.map((w, i) => <Typography key={i} sx={{ fontSize: '0.8rem' }}>{w}</Typography>)}
              </Alert>
            )}
            {validation.canDispatch && validation.warnings.length === 0 && (
              <Alert severity="success" sx={{ borderRadius: '10px' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All checks passed. Mission ready to plan.</Typography>
              </Alert>
            )}
          </Box>
        );
      }
      default: return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', height: '85vh' } }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FlightTakeoffIcon sx={{ color: 'primary.main' }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Mission Planner</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(15,23,42,0.04)', overflowX: 'auto' }}>
        <Stepper activeStep={step} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.65rem' }, '& .Mui-active': { color: 'primary.main' }, '& .Mui-completed': { color: 'primary.main' } }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>{steps[step]}</Typography>
        {renderStep()}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => step > 0 ? setStep(step - 1) : onClose()} sx={{ color: 'text.secondary' }}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < 9 ? (
          <Button variant="contained" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={saving} startIcon={<FlightTakeoffIcon />}>
            {saving ? 'Creating...' : 'Create Mission'}
          </Button>
        )}
      </Box>
    </Dialog>
  );
}
