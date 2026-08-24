import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Chip, Slider, Alert, IconButton, Tooltip, Divider } from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SyncIcon from '@mui/icons-material/Sync';
import MapIcon from '@mui/icons-material/Map';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import GrainIcon from '@mui/icons-material/Grain';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  getMissionRoute,
  saveMissionRoute,
  deleteMissionRoute,
  generateRouteFromBoundary,
  buildRoutePreview,
} from '../../services/missionRouteService';
import { exportMission, validateDjiMission } from '../../services/djiMissionService';
import { checkBackendHealth, syncWaylineToBackend } from '../../services/djiCloudService';
import { geoJSONToLatLngs } from '../../services/boundaryService';

const statusColors = {
  Draft: '#64748B',
  Prepared: '#2563EB',
  Exported: '#7C3AED',
  'Waiting for DJI': '#D97706',
  Synced: '#16A34A',
  'Ready on DJI': '#16A34A',
  Executed: '#16A34A',
  Failed: '#EF4444',
};

/**
 * Mission Route Panel — map-based route editor and DJI export.
 * Shows field boundary, generated spray route, and route parameters.
 */
export default function MissionRoutePanel({ mission, onRouteChange }) {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Route parameters
  const [params, setParams] = useState({
    swathWidth: 7,
    overlap: 0,
    altitude: 3,
    speed: 7,
    flightDirection: 0,
    headlandWidth: 0,
    applicationRate: 15,
  });

  // Load existing route
  const fetchRoute = useCallback(async () => {
    if (!mission?.id) return;
    setLoading(true);
    try {
      const r = await getMissionRoute(mission.id);
      if (r) {
        setRoute(r);
        setParams({
          swathWidth: r.swath_width || 7,
          overlap: r.overlap_pct || 0,
          altitude: r.altitude || 3,
          speed: r.speed || 7,
          flightDirection: r.flight_direction || 0,
          headlandWidth: r.headland_width || 0,
          applicationRate: r.application_rate || mission?.application_rate || 15,
        });
      }
    } catch (err) { console.warn('Route fetch:', err.message); }
    finally { setLoading(false); }
  }, [mission?.id]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  // Parse field boundary — supports GeoJSON Polygon format
  const boundary = mission?.fields?.boundary;
  let boundaryPoints = null;
  if (boundary?.coordinates?.[0]) {
    // GeoJSON Polygon: convert [lng, lat] to {lat, lng}
    boundaryPoints = geoJSONToLatLngs(boundary);
  } else if (Array.isArray(boundary) && boundary.length >= 3) {
    // Already flat array of {lat, lng}
    boundaryPoints = boundary;
  } else if (typeof boundary === 'string') {
    try {
      const parsed = JSON.parse(boundary);
      if (parsed?.coordinates?.[0]) {
        boundaryPoints = geoJSONToLatLngs(parsed);
      } else if (Array.isArray(parsed)) {
        boundaryPoints = parsed;
      }
    } catch { /* invalid JSON */ }
  }
  const hasBoundary = Array.isArray(boundaryPoints) && boundaryPoints.length >= 3;

  // Map center from boundary
  const mapCenter = hasBoundary
    ? [
        boundaryPoints.reduce((s, p) => s + (p.lat || p.latitude), 0) / boundaryPoints.length,
        boundaryPoints.reduce((s, p) => s + (p.lng || p.longitude), 0) / boundaryPoints.length,
      ]
    : [-29.0, 26.0]; // Default South Africa

  // Generate route from boundary
  const handleGenerate = () => {
    if (!hasBoundary) { showToast('Field boundary required to generate route', 'error'); return; }
    setGenerating(true);
    try {
      const generated = generateRouteFromBoundary(boundaryPoints, params);
      setRoute(prev => ({
        ...prev,
        ...generated,
        status: 'Draft',
        sync_status: 'none',
      }));
      showToast(`Route generated — ${generated.line_count} flight lines`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save route
  const handleSave = async () => {
    if (!mission?.id || !company?.id || !route) return;
    setSaving(true);
    try {
      const saved = await saveMissionRoute(mission.id, company.id, {
        field_id: mission.field_id,
        route_name: `Route — ${mission.mission_number}`,
        flight_direction: params.flightDirection,
        swath_width: params.swathWidth,
        overlap_pct: params.overlap,
        altitude: params.altitude,
        speed: params.speed,
        headland_width: params.headlandWidth,
        application_rate: params.applicationRate,
        total_distance: route.total_distance,
        estimated_time: route.estimated_time,
        estimated_volume: route.estimated_volume,
        route_geojson: route.route_geojson,
        exclusion_zones: route.exclusion_zones || [],
        obstacles: route.obstacles || [],
        status: 'Prepared',
      });
      setRoute(saved);
      onRouteChange?.(saved);
      showToast('Route saved');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  // Sync to DJI Cloud Backend
  const handleExport = async () => {
    if (!route) return;
    try {
      // Ensure route is saved before syncing
      let savedRoute = route;
      if (!route.id && mission?.id && company?.id) {
        try {
          savedRoute = await saveMissionRoute(mission.id, company.id, {
            field_id: mission.field_id,
            route_name: `Route — ${mission.mission_number}`,
            flight_direction: params.flightDirection,
            swath_width: params.swathWidth,
            overlap_pct: params.overlap,
            altitude: params.altitude,
            speed: params.speed,
            headland_width: params.headlandWidth,
            application_rate: params.applicationRate,
            total_distance: route.total_distance,
            estimated_time: route.estimated_time,
            estimated_volume: route.estimated_volume,
            route_geojson: route.route_geojson,
            exclusion_zones: route.exclusion_zones || [],
            obstacles: route.obstacles || [],
            status: 'Prepared',
            sync_status: 'none',
          });
          setRoute(savedRoute);
        } catch (saveErr) {
          console.warn('[FlyBy] Auto-save before sync failed:', saveErr.message);
        }
      }

      // Try real DJI Cloud backend sync
      const health = await checkBackendHealth();
      if (health.available) {
        showToast('Syncing to DJI backend...', 'info');
        const result = await syncWaylineToBackend(mission?.fields || {}, savedRoute, mission, company?.id);
        if (result.success) {
          setRoute(prev => ({
            ...prev,
            sync_status: 'synced',
            status: 'Synced',
            provider_ref: result.wayline_id,
            provider: 'dji_cloud',
            last_sync_at: new Date().toISOString(),
          }));
          showToast('Synced to FlyBy DJI Backend');
        } else {
          setRoute(prev => ({ ...prev, sync_status: 'failed', status: 'Failed' }));
          showToast(result.error || 'Sync failed', 'error');
        }
      } else {
        // Fallback: JSON file export (backend not available)
        const result = await exportMission(savedRoute, mission);
        if (result.success) {
          showToast(result.message || 'Exported as file — DJI backend unavailable');
        } else {
          showToast(result.errors?.join('; ') || 'Export failed', 'error');
        }
      }
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Delete route
  const handleDelete = async () => {
    if (!mission?.id) return;
    try {
      await deleteMissionRoute(mission.id);
      setRoute(null);
      onRouteChange?.(null);
      showToast('Route deleted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const preview = buildRoutePreview(route, mission);

  // Parse route coordinates for map display
  const routeCoords = route?.route_geojson?.coordinates?.map(c => [c[1], c[0]]) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RouteIcon sx={{ fontSize: '1.1rem', color: '#16A34A' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Flight Route</Typography>
          {route?.status && (
            <Chip
              label={route.status}
              size="small"
              sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${statusColors[route.status] || '#64748B'}15`, color: statusColors[route.status] || '#64748B' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {route && (
            <>
              <Tooltip title="Export for DJI" arrow>
                <IconButton size="small" onClick={handleExport} sx={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: '8px' }}>
                  <DownloadIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Route" arrow>
                <IconButton size="small" onClick={handleDelete} sx={{ border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
                  <DeleteIcon sx={{ fontSize: '1rem', color: '#EF4444' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Map */}
      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', mb: 2, height: 280 }}>
        {hasBoundary ? (
          <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri"
            />
            {/* Field boundary */}
            <Polygon
              positions={boundaryPoints.map(p => [p.lat || p.latitude, p.lng || p.longitude])}
              pathOptions={{ color: '#16A34A', weight: 2, fillColor: '#16A34A', fillOpacity: 0.1 }}
            />
            {/* Route lines */}
            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} pathOptions={{ color: '#2563EB', weight: 1.5, opacity: 0.8, dashArray: '4 4' }} />
            )}
            {/* Entry/exit markers */}
            {routeCoords.length > 0 && (
              <>
                <CircleMarker center={routeCoords[0]} radius={5} pathOptions={{ color: '#16A34A', fillColor: '#16A34A', fillOpacity: 1 }}>
                  <MapTooltip>Entry Point</MapTooltip>
                </CircleMarker>
                <CircleMarker center={routeCoords[routeCoords.length - 1]} radius={5} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1 }}>
                  <MapTooltip>Exit Point</MapTooltip>
                </CircleMarker>
              </>
            )}
          </MapContainer>
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC' }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600 }}>No field boundary</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary' }}>Map the field boundary to generate a flight route</Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Route Parameters */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 2 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
          Route Parameters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Swath Width (m)" type="number" value={params.swathWidth}
              onChange={e => setParams(p => ({ ...p, swathWidth: Number(e.target.value) || 7 }))}
              inputProps={{ min: 1, max: 20, step: 0.5 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Overlap (%)" type="number" value={params.overlap}
              onChange={e => setParams(p => ({ ...p, overlap: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 50 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Altitude (m)" type="number" value={params.altitude}
              onChange={e => setParams(p => ({ ...p, altitude: Number(e.target.value) || 3 }))}
              inputProps={{ min: 1, max: 30 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Speed (m/s)" type="number" value={params.speed}
              onChange={e => setParams(p => ({ ...p, speed: Number(e.target.value) || 7 }))}
              inputProps={{ min: 1, max: 15, step: 0.5 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Direction (°)" type="number" value={params.flightDirection}
              onChange={e => setParams(p => ({ ...p, flightDirection: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 359 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Application Rate (L/ha)" type="number" value={params.applicationRate}
              onChange={e => setParams(p => ({ ...p, applicationRate: Number(e.target.value) || 15 }))}
              inputProps={{ min: 1, max: 100 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Headland (m)" type="number" value={params.headlandWidth}
              onChange={e => setParams(p => ({ ...p, headlandWidth: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 50 }} />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleGenerate}
            disabled={!hasBoundary || generating}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            {generating ? 'Generating...' : route ? 'Regenerate Route' : 'Generate Route'}
          </Button>
          {route && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,23,42,0.12)' }}
            >
              {saving ? 'Saving...' : 'Save Route'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Route Preview / Summary */}
      {preview && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>
            Route Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MapIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Distance</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.distance}</Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimelineIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Flight Time</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.estimatedTime}</Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <HeightIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Altitude</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.altitude}</Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Speed</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.speed}</Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GrainIcon sx={{ fontSize: '0.8rem', color: 'text.tertiary' }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>App Rate</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.applicationRate}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Est. Volume</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.estimatedVolume}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Swath</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.swathWidth}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Lines</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{preview.lineCount}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* DJI Export Status */}
      {route?.status && route.status !== 'Draft' && (
        <Alert
          severity={route.status === 'Exported' || route.status === 'Prepared' ? 'info' : route.status === 'Synced' || route.status === 'Ready on DJI' ? 'success' : 'warning'}
          icon={route.sync_status === 'synced' ? <CheckCircleIcon /> : route.status === 'Exported' ? <CheckCircleIcon /> : <WarningAmberIcon />}
          sx={{ borderRadius: '10px', mb: 2 }}
        >
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {route.status === 'Exported' && 'Mission data prepared. Awaiting DJI SmartFarm sync.'}
            {route.status === 'Prepared' && 'Route prepared. Ready to sync to DJI SmartFarm.'}
            {route.status === 'Synced' && '🟢 Mission synced to DJI SmartFarm.'}
            {route.status === 'Ready on DJI' && '🟢 Route available on T50 remote controller.'}
            {route.status === 'Waiting for DJI' && 'Syncing to DJI SmartFarm...'}
            {route.status === 'Failed' && 'Sync failed. Use Import Flight Data as fallback.'}
          </Typography>
          {route.status === 'Exported' && route.sync_status !== 'synced' && (
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>
              Official DJI SmartFarm integration will sync automatically when connected. Use Import Flight Data as fallback.
            </Typography>
          )}
        </Alert>
      )}

      {/* Primary action: Sync to DJI SmartFarm */}
      {route && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={handleExport}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Sync to DJI SmartFarm
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={() => window.open('https://www.djiag.com/za/login', '_blank', 'noopener,noreferrer')}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(15,23,42,0.12)', color: 'text.primary' }}
          >
            Open SmartFarm
          </Button>
        </Box>
      )}

      {/* Sync explanation */}
      {route && !route.sync_status?.includes('synced') && route.status !== 'Synced' && (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', mt: 1.5 }}>
          When DJI SmartFarm integration is connected, this will sync directly to your T50 remote. Until then, the mission data is prepared and exported for manual transfer.
        </Typography>
      )}
    </Box>
  );
}
