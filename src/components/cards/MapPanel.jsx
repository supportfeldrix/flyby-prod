import { Box, Typography, Chip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

export default function MapPanel() {
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
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Mission Map</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip icon={<LayersIcon sx={{ fontSize: '0.8rem' }} />} label="Layers" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 26 }} />
          <Chip icon={<GpsFixedIcon sx={{ fontSize: '0.8rem' }} />} label="Live" size="small" sx={{ fontSize: '0.7rem', height: 26, bgcolor: 'rgba(22, 163, 74, 0.08)', color: 'success.main' }} />
        </Box>
      </Box>

      {/* Map placeholder */}
      <Box
        sx={{
          height: { xs: 200, md: 300 },
          position: 'relative',
          background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 30%, #A5D6A7 60%, #81C784 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern to simulate map */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            backgroundImage: `
              linear-gradient(rgba(15, 23, 42, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15, 23, 42, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Field boundaries - simulated polygons */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Field 1 */}
          <polygon
            points="100,80 250,60 280,180 120,200"
            fill="rgba(22, 163, 74, 0.2)"
            stroke="#16A34A"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {/* Field 2 */}
          <polygon
            points="320,40 500,30 520,160 350,170"
            fill="rgba(37, 99, 235, 0.15)"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {/* Field 3 */}
          <polygon
            points="550,80 720,60 740,200 580,220"
            fill="rgba(124, 58, 237, 0.12)"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {/* Drone position */}
          <circle cx="400" cy="100" r="6" fill="#16A34A" />
          <circle cx="400" cy="100" r="12" fill="none" stroke="#16A34A" strokeWidth="2" opacity="0.5" />
          <circle cx="400" cy="100" r="20" fill="none" stroke="#16A34A" strokeWidth="1" opacity="0.2" />
          {/* Spray path */}
          <path
            d="M320,80 L320,150 L340,150 L340,80 L360,80 L360,150 L380,150 L380,80 L400,80 L400,100"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            opacity="0.6"
          />
        </svg>

        {/* Field labels */}
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <Chip
            label="Klipfontein Field 3"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        </Box>

        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip
            label="Rooiberg East"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        </Box>

        {/* Map icon overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          >
            <MapIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
