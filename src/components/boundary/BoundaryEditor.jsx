import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Box, Typography, Button, IconButton, Chip, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { convertToGeoJSON, geoJSONToLatLngs, calculateArea, validateBoundary, saveBoundary } from '../../services/boundaryService';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const vertexIcon = L.divIcon({
  className: 'boundary-vertex',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#16A34A;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Map click handler component
function DrawHandler({ points, setPoints, isDrawing }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        setPoints((prev) => [...prev, e.latlng]);
      }
    },
  });
  return null;
}

// Auto-fit map to polygon
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points.length > 1]); // Only fit once on load
  return null;
}

export default function BoundaryEditor({ open, onClose, field, onSaved }) {
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mapCenter = field?.latitude && field?.longitude
    ? [field.latitude, field.longitude]
    : [-25.75, 28.19]; // Default to Pretoria area

  const mapZoom = field?.boundary ? 15 : field?.latitude ? 15 : 6;

  // Load existing boundary on open
  useEffect(() => {
    if (open && field?.boundary) {
      const existingPoints = geoJSONToLatLngs(field.boundary);
      setPoints(existingPoints);
      setIsDrawing(false);
    } else if (open) {
      setPoints([]);
      setIsDrawing(true);
    }
    setError('');
  }, [open, field]);

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
    setIsDrawing(true);
  };

  const handleSave = async () => {
    if (points.length < 4) {
      setError('A field boundary requires at least 4 points.');
      return;
    }

    const geojson = convertToGeoJSON(points);
    const validation = validateBoundary(geojson);

    if (!validation.valid) {
      setError(validation.errors.join(' '));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await saveBoundary(field.id, geojson);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const area = points.length >= 3 ? calculateArea(
    [...points.map(p => [p.lng, p.lat]), [points[0].lng, points[0].lat]]
  ) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: '#0F172A' } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          zIndex: 1000,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>
            {field?.field_name} — Boundary Editor
          </Typography>
          {points.length >= 4 && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '0.8rem' }} />}
              label={`${area?.hectares} ha • ${points.length} points`}
              size="small"
              sx={{ bgcolor: 'rgba(22, 163, 74, 0.15)', color: '#22C55E', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#22C55E' } }}
            />
          )}
          {points.length > 0 && points.length < 4 && (
            <Chip
              label={`${points.length}/4 points minimum`}
              size="small"
              sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            startIcon={<UndoIcon />}
            onClick={handleUndo}
            disabled={points.length === 0}
            sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}
          >
            Undo
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleClear}
            disabled={points.length === 0}
            sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={points.length < 4 || saving}
            sx={{ ml: 1 }}
          >
            {saving ? 'Saving...' : 'Save Boundary'}
          </Button>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)', ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 1, borderRadius: '10px' }}>{error}</Alert>
      )}

      {/* Instructions */}
      <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '10px', px: 3, py: 1.5, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', textAlign: 'center' }}>
            {isDrawing
              ? points.length === 0
                ? 'Click on the map to place boundary points. Minimum 4 points required.'
                : `${points.length} point${points.length !== 1 ? 's' : ''} placed. ${points.length < 4 ? `Need ${4 - points.length} more.` : 'Ready to save.'}`
              : 'Boundary loaded. Click Clear to redraw, or Save to keep changes.'}
          </Typography>
        </Box>
      </Box>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <DrawHandler points={points} setPoints={setPoints} isDrawing={isDrawing} />

          {points.length > 0 && field?.boundary && !isDrawing && (
            <FitBounds points={points} />
          )}

          {/* Draw polygon outline */}
          {points.length >= 3 && (
            <Polygon
              positions={points}
              pathOptions={{
                color: '#16A34A',
                weight: 3,
                fillColor: '#16A34A',
                fillOpacity: 0.15,
                dashArray: isDrawing ? '6, 6' : null,
              }}
            />
          )}

          {/* Vertex markers */}
          {points.map((point, idx) => (
            <Marker key={idx} position={point} icon={vertexIcon} />
          ))}
        </MapContainer>
      </Box>
    </Dialog>
  );
}
