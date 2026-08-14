import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
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

// Auto-fit to bounds
function FitAllBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapPanel() {
  const { company } = useAuth();
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (company?.id) {
      getFields(company.id).then(setFields).catch(() => {});
    }
  }, [company?.id]);

  const fieldsWithBoundary = fields.filter((f) => f.boundary?.coordinates);
  const fieldsWithCoords = fields.filter((f) => f.latitude && f.longitude && !f.boundary);
  const hasAnyFields = fieldsWithBoundary.length > 0 || fieldsWithCoords.length > 0;

  // Calculate bounds for all fields
  let bounds = null;
  if (hasAnyFields) {
    const allPoints = [];
    fieldsWithBoundary.forEach((f) => {
      geoJSONToLatLngs(f.boundary).forEach((p) => allPoints.push([p.lat, p.lng]));
    });
    fieldsWithCoords.forEach((f) => allPoints.push([f.latitude, f.longitude]));
    if (allPoints.length > 0) {
      bounds = L.latLngBounds(allPoints);
    }
  }

  const defaultCenter = [-25.75, 28.19];
  const defaultZoom = 6;

  return (
    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(15, 23, 42, 0.06)', bgcolor: '#FFFFFF' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Operations Map</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {fieldsWithBoundary.length > 0 && (
            <Chip icon={<GpsFixedIcon sx={{ fontSize: '0.8rem' }} />} label={`${fieldsWithBoundary.length} boundaries`} size="small" sx={{ fontSize: '0.7rem', height: 26, bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main' }} />
          )}
          {fieldsWithCoords.length > 0 && (
            <Chip label={`${fieldsWithCoords.length} markers`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 26 }} />
          )}
        </Box>
      </Box>

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

            {bounds && <FitAllBounds bounds={bounds} />}

            {/* Polygon boundaries */}
            {fieldsWithBoundary.map((field) => {
              const positions = geoJSONToLatLngs(field.boundary);
              const area = calculateArea(field.boundary.coordinates[0]);
              return (
                <Polygon
                  key={field.id}
                  positions={positions}
                  pathOptions={{ color: '#16A34A', weight: 2.5, fillColor: '#16A34A', fillOpacity: 0.12 }}
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
