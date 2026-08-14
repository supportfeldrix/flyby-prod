import { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '../../hooks/useAuth';
import { getFields } from '../../services/fieldService';

export default function MapPanel() {
  const { company } = useAuth();
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (company?.id) {
      getFields(company.id).then(setFields).catch(() => {});
    }
  }, [company?.id]);

  const fieldsWithCoords = fields.filter((f) => f.latitude && f.longitude);

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        bgcolor: '#FFFFFF',
      }}
    >
      {/* Map header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Operations Map</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {fieldsWithCoords.length > 0 && (
            <Chip icon={<GpsFixedIcon sx={{ fontSize: '0.8rem' }} />} label={`${fieldsWithCoords.length} fields`} size="small" sx={{ fontSize: '0.7rem', height: 26, bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main' }} />
          )}
        </Box>
      </Box>

      {/* Map area */}
      <Box
        sx={{
          height: { xs: 200, md: 280 },
          position: 'relative',
          background: fieldsWithCoords.length > 0
            ? 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 30%, #A5D6A7 60%, #81C784 100%)'
            : 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {fieldsWithCoords.length > 0 ? (
          <>
            {/* Grid pattern */}
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(15,23,42,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Field markers */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice">
              {fieldsWithCoords.map((field, i) => {
                // Spread markers across the map area
                const x = 100 + ((i * 200) % 600);
                const y = 60 + ((i * 70) % 160);
                return (
                  <g key={field.id}>
                    <circle cx={x} cy={y} r="6" fill="#16A34A" />
                    <circle cx={x} cy={y} r="12" fill="none" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
                    <text x={x} y={y - 16} textAnchor="middle" fontSize="10" fill="#0F172A" fontWeight="600">{field.field_name}</text>
                  </g>
                );
              })}
            </svg>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', zIndex: 1 }}>
            <LocationOnIcon sx={{ fontSize: '2rem', color: 'text.tertiary', mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>No operational fields available.</Typography>
            <Typography sx={{ color: 'text.tertiary', fontSize: '0.75rem', mt: 0.5 }}>Add fields with GPS coordinates to see them on the map.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
