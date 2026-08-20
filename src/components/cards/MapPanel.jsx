import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, TextField, MenuItem } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../hooks/useAuth';
import { getFields } from '../../services/fieldService';
import { geoJSONToLatLngs, calculateArea } from '../../services/boundaryService';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const fieldMarkerIcon = L.divIcon({
  className: 'field-marker',
  html: '<div style="width:10px;height:10px;border-radius:50%;background:#16A34A;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Auto-fit to bounds when bounds change
function FitBounds({ bounds }) {
  const map = useMap();
  const prevBounds = useRef(null);

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      const boundsStr = bounds.toBBoxString();
      if (prevBounds.current !== boundsStr) {
        prevBounds.current = boundsStr;
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true, duration: 0.5 });
      }
    }
  }, [bounds, map]);
  return null;
}

export default function MapPanel() {
  const { company } = useAuth();
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('all');

  useEffect(() => {
    if (company?.id) {
      getFields(company.id).then(setFields).catch(() => {});
    }
  }, [company?.id]);

  const fieldsWithBoundary = fields.filter((f) => f.boundary?.coordinates);
  const fieldsWithCoords = fields.filter((f) => f.latitude && f.longitude && !f.boundary);
  const hasAnyFields = fieldsWithBoundary.length > 0 || fieldsWithCoords.length > 0;

  // Selected field data
  const selectedField = selectedFieldId !== 'all' ? fieldsWithBoundary.find(f => f.id === selectedFieldId) : null;

  // Calculate bounds based on selection
  let bounds = null;
  if (selectedField) {
    // Zoom to selected boundary
    const points = geoJSONToLatLngs(selectedField.boundary).map(p => [p.lat, p.lng]);
    if (points.length > 0) bounds = L.latLngBounds(points);
  } else if (hasAnyFields) {
    // Fit all
    const allPoints = [];
    fieldsWithBoundary.forEach((f) => {
      geoJSONToLatLngs(f.boundary).forEach((p) => allPoints.push([p.lat, p.lng]));
    });
    fieldsWithCoords.forEach((f) => allPoints.push([f.latitude, f.longitude]));
    if (allPoints.length > 0) bounds = L.latLngBounds(allPoints);
  }

  const defaultCenter = [-25.75, 28.19];
  const defaultZoom = 6;

  return (
    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(15, 23, 42, 0.06)', bgcolor: '#FFFFFF' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>Operations Map</Typography>
          {fieldsWithBoundary.length > 0 && (
            <Chip icon={<GpsFixedIcon sx={{ fontSize: '0.8rem' }} />} label={`${fieldsWithBoundary.length} boundaries`} size="small" sx={{ fontSize: '0.7rem', height: 24, bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main' }} />
          )}
        </Box>

        {/* Boundary Selector */}
        {fieldsWithBoundary.length > 0 && (
          <TextField
            select
            size="small"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.8rem', height: 34 },
              '& .MuiSelect-select': { py: 0.75 },
            }}
          >
            <MenuItem value="all">All Boundaries</MenuItem>
            {fieldsWithBoundary.map(f => (
              <MenuItem key={f.id} value={f.id}>
                {f.field_name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {/* Selected boundary info */}
      {selectedField && (
        <Box sx={{ px: 3, pb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A' }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedField.field_name}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {selectedField.area_hectares ? `${selectedField.area_hectares} ha` : calculateArea(selectedField.boundary.coordinates[0]).hectares + ' ha'}
            {selectedField.farms?.farm_name ? ` · ${selectedField.farms.farm_name}` : ''}
            {selectedField.crop ? ` · ${selectedField.crop}` : ''}
          </Typography>
        </Box>
      )}

      {/* Map */}
      <Box sx={{ height: { xs: 250, md: 350 } }}>
        {!hasAnyFields ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9' }}>
            <Box sx={{ textAlign: 'center' }}>
              <LocationOnIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>No operational fields available.</Typography>
              <Typography sx={{ color: 'text.tertiary', fontSize: '0.75rem', mt: 0.5 }}>Add fields with GPS coordinates or draw boundaries to see them here.</Typography>
            </Box>
          </Box>
        ) : (
          <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {bounds && <FitBounds bounds={bounds} />}

            {/* Polygon boundaries */}
            {fieldsWithBoundary.map((field) => {
              const positions = geoJSONToLatLngs(field.boundary);
              const area = calculateArea(field.boundary.coordinates[0]);
              const isSelected = selectedFieldId === field.id;
              const isSubdued = selectedFieldId !== 'all' && !isSelected;

              return (
                <Polygon
                  key={field.id}
                  positions={positions}
                  pathOptions={{
                    color: isSelected ? '#16A34A' : isSubdued ? '#94A3B8' : '#16A34A',
                    weight: isSelected ? 3.5 : isSubdued ? 1.5 : 2.5,
                    fillColor: isSelected ? '#16A34A' : isSubdued ? '#94A3B8' : '#16A34A',
                    fillOpacity: isSelected ? 0.2 : isSubdued ? 0.04 : 0.12,
                    opacity: isSubdued ? 0.4 : 1,
                  }}
                  eventHandlers={{
                    click: () => setSelectedFieldId(field.id),
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 180 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>{field.field_name}</Typography>
                      {field.crop && <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Crop: {field.crop}</Typography>}
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Area: {area.hectares} ha</Typography>
                      {field.wind_limit && <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Wind Limit: {field.wind_limit} km/h</Typography>}
                      <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', mt: 0.5 }}>{field.farms?.farm_name} • {field.farms?.customers?.customer_name}</Typography>
                    </Box>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Point markers for fields without boundaries */}
            {fieldsWithCoords.map((field) => (
              <Marker key={field.id} position={[field.latitude, field.longitude]} icon={fieldMarkerIcon}>
                <Popup>
                  <Box sx={{ minWidth: 150 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>{field.field_name}</Typography>
                    {field.crop && <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Crop: {field.crop}</Typography>}
                    {field.area_hectares && <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Area: {field.area_hectares} ha (manual)</Typography>}
                    <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', mt: 0.5 }}>{field.farms?.farm_name}</Typography>
                  </Box>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Box>
    </Box>
  );
}
