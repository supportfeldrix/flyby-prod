import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, Chip, Grid, Alert, Divider, IconButton, Tooltip } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ScienceIcon from '@mui/icons-material/Science';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GrassIcon from '@mui/icons-material/Grass';
import SpeedIcon from '@mui/icons-material/Speed';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getMissionFlightData, importFlightDataFromFile, generateTestFlightData } from '../../services/djiMissionService';
import { DATA_SOURCES } from '../../services/providers/flightDataProvider';

const SOURCE_LABELS = {
  [DATA_SOURCES.DJI_RECORDED]: { label: 'DJI Recorded', color: '#16A34A' },
  [DATA_SOURCES.DJI_ESTIMATED]: { label: 'DJI Estimated', color: '#D97706' },
  [DATA_SOURCES.SMARTFARM_RECORDED]: { label: 'SmartFarm', color: '#16A34A' },
  [DATA_SOURCES.FLYBY_CALCULATED]: { label: 'FlyBy Calculated', color: '#2563EB' },
  [DATA_SOURCES.MANUAL]: { label: 'Manual', color: '#64748B' },
  [DATA_SOURCES.IMPORTED]: { label: 'Imported', color: '#7C3AED' },
  [DATA_SOURCES.TEST]: { label: 'TEST DATA', color: '#EF4444' },
};

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SourceBadge({ source }) {
  if (!source) return null;
  const config = SOURCE_LABELS[source] || { label: source, color: '#64748B' };
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: `${config.color}12`, color: config.color, ml: 0.5 }}
    />
  );
}

function DataRow({ icon: Icon, label, value, source, unit }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
      {Icon && <Icon sx={{ fontSize: '0.9rem', color: 'text.tertiary' }} />}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
          {value != null ? `${value}${unit || ''}` : '—'}
        </Typography>
        <SourceBadge source={source} />
      </Box>
    </Box>
  );
}

/**
 * Flight Data Panel — displays actual flight data from DJI/manual import.
 * Shows data with source labels (DJI Recorded, Estimated, Manual, Test).
 */
export default function FlightDataPanel({ mission }) {
  const { company } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!mission?.id) return;
    setLoading(true);
    getMissionFlightData(mission.id)
      .then(setFlightData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mission?.id]);

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const record = await importFlightDataFromFile(file, company.id, mission?.pilot_id, mission?.aircraft_id);
      setFlightData(record);
      showToast('Flight data imported');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleGenerateTest = async () => {
    if (!mission?.id || !company?.id) return;
    try {
      const record = await generateTestFlightData(mission, company.id);
      setFlightData(record);
      showToast('Test flight data generated');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const ds = flightData?.data_sources || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FlightIcon sx={{ fontSize: '1.1rem', color: '#2563EB' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Flight Data</Typography>
          {flightData && (
            <Chip
              label={flightData.is_test_data ? 'TEST DATA' : flightData.source?.toUpperCase() || 'RECORDED'}
              size="small"
              sx={{
                height: 20, fontSize: '0.55rem', fontWeight: 700,
                bgcolor: flightData.is_test_data ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
                color: flightData.is_test_data ? '#EF4444' : '#16A34A',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(15,23,42,0.12)' }}
          >
            {importing ? 'Importing...' : 'Import Flight Data'}
          </Button>
          <input ref={fileRef} type="file" hidden accept=".json,.csv" onChange={handleFileImport} />
        </Box>
      </Box>

      {/* No Data State */}
      {!loading && !flightData && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
          <FlightIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
            Waiting for Flight Data
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', mb: 2, maxWidth: 360, mx: 'auto' }}>
            Flight data will appear here after the pilot completes the mission with DJI, or when flight records are imported.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
            <Button size="small" variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => fileRef.current?.click()} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}>
              Import from DJI
            </Button>
            <Button size="small" variant="text" onClick={handleGenerateTest} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: 'text.tertiary' }}>
              Generate Test Data
            </Button>
          </Box>
        </Paper>
      )}

      {/* Flight Data Display */}
      {flightData && (
        <>
          {/* Test Data Warning */}
          {flightData.is_test_data && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px' }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>This is test data — not real DJI data</Typography>
              <Typography sx={{ fontSize: '0.7rem' }}>Generated for demonstration purposes only. Do not use in reports or invoices.</Typography>
            </Alert>
          )}

          {/* Aircraft Info */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 2 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>
              Actual Flight Data{flightData.source !== 'test' ? ' — ' + (flightData.source === 'dji_smartfarm' ? 'DJI SmartFarm' : flightData.source === 'dji' ? 'DJI' : 'Manual') : ''}
            </Typography>

            <DataRow icon={AccessTimeIcon} label="Flight Duration" value={formatDuration(flightData.flight_duration)} source={ds.flight_duration} />
            <DataRow icon={GrassIcon} label="Area Covered" value={flightData.area_covered} unit=" ha" source={ds.area_covered} />
            <DataRow icon={BatteryChargingFullIcon} label="Battery" value={flightData.battery_start && flightData.battery_end ? `${flightData.battery_start}% → ${flightData.battery_end}%` : null} source={ds.battery_used} />
            <DataRow icon={BatteryChargingFullIcon} label="Battery Used" value={flightData.battery_used} unit="%" source={ds.battery_used} />
            <DataRow icon={WaterDropIcon} label="Application Rate" value={flightData.application_rate} unit=" L/ha" source={ds.application_rate} />
            <DataRow icon={WaterDropIcon} label="Application Volume" value={flightData.application_volume} unit=" L" source={ds.application_volume} />
            {flightData.flow_rate && <DataRow icon={SpeedIcon} label="Flow Rate" value={flightData.flow_rate} unit=" L/min" source={ds.flow_rate} />}
            {flightData.chemical_name && <DataRow icon={ScienceIcon} label="Chemical" value={flightData.chemical_name} source={ds.chemical_name} />}

            {/* Usage comparison */}
            {(flightData.estimated_usage || flightData.actual_usage) && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1 }}>
                  Application Usage
                </Typography>
                {flightData.estimated_usage && <DataRow label="Estimated Usage" value={flightData.estimated_usage} unit=" L" source={DATA_SOURCES.FLYBY_CALCULATED} />}
                {flightData.actual_usage && <DataRow label="Actual/Recorded Usage" value={flightData.actual_usage} unit=" L" source={ds.actual_usage || DATA_SOURCES.DJI_RECORDED} />}
              </>
            )}
          </Paper>

          {/* GPS Track */}
          {flightData.gps_track && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#16A34A' }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>GPS Track Available</Typography>
              </Box>
            </Paper>
          )}

          {/* Match Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            {flightData.match_status === 'auto_matched' && <Chip icon={<CheckCircleIcon />} label="Auto-matched to mission" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A', '& .MuiChip-icon': { color: '#16A34A' } }} />}
            {flightData.match_status === 'manual_matched' && <Chip icon={<CheckCircleIcon />} label="Manually matched" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563EB', '& .MuiChip-icon': { color: '#2563EB' } }} />}
            {flightData.match_status === 'unmatched' && <Chip icon={<WarningAmberIcon />} label="Unmatched flight data" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(217,119,6,0.08)', color: '#D97706', '& .MuiChip-icon': { color: '#D97706' } }} />}
          </Box>
        </>
      )}
    </Box>
  );
}
