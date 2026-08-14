import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// SVG Drone component
const DroneIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Drone Arms */}
    <line x1="60" y1="60" x2="28" y2="38" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    <line x1="60" y1="60" x2="92" y2="38" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    <line x1="60" y1="60" x2="28" y2="72" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    <line x1="60" y1="60" x2="92" y2="72" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    {/* Propellers */}
    <ellipse cx="28" cy="38" rx="14" ry="4" fill="rgba(34, 197, 94, 0.4)" />
    <ellipse cx="92" cy="38" rx="14" ry="4" fill="rgba(34, 197, 94, 0.4)" />
    <ellipse cx="28" cy="72" rx="14" ry="4" fill="rgba(34, 197, 94, 0.4)" />
    <ellipse cx="92" cy="72" rx="14" ry="4" fill="rgba(34, 197, 94, 0.4)" />
    {/* Motor hubs */}
    <circle cx="28" cy="38" r="4" fill="#16A34A" />
    <circle cx="92" cy="38" r="4" fill="#16A34A" />
    <circle cx="28" cy="72" r="4" fill="#16A34A" />
    <circle cx="92" cy="72" r="4" fill="#16A34A" />
    {/* Body */}
    <rect x="48" y="50" width="24" height="20" rx="6" fill="#1E293B" />
    {/* Camera */}
    <circle cx="60" cy="74" r="3" fill="#16A34A" />
    {/* Landing gear */}
    <line x1="48" y1="72" x2="42" y2="80" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="72" x2="78" y2="80" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <line x1="38" y1="80" x2="46" y2="80" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="74" y1="80" x2="82" y2="80" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Crop rows SVG
const CropField = () => (
  <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" fill="none">
    {[...Array(12)].map((_, i) => (
      <motion.path
        key={i}
        d={`M${-50 + i * 70} 200 Q${-20 + i * 70} 100 ${i * 70} 0`}
        stroke="rgba(34, 197, 94, 0.15)"
        strokeWidth="40"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.8 + i * 0.05, ease: 'easeOut' }}
      />
    ))}
    {[...Array(12)].map((_, i) => (
      <motion.path
        key={`detail-${i}`}
        d={`M${-50 + i * 70} 200 Q${-20 + i * 70} 100 ${i * 70} 0`}
        stroke="rgba(22, 163, 74, 0.3)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, delay: 1.0 + i * 0.05, ease: 'easeOut' }}
      />
    ))}
  </svg>
);

export default function StartupAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=black, 1=drone+fields, 2=logo, 3=done

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),    // Drone appears
      setTimeout(() => setPhase(2), 2800),   // Logo fades in
      setTimeout(() => setPhase(3), 5000),   // Complete
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 3) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0B1120',
            overflow: 'hidden',
          }}
        >
          {/* Subtle ambient glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 0.4 : 0.15 }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22, 163, 74, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Crop field background */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              opacity: phase >= 1 ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          >
            <CropField />
          </Box>

          {/* Drone animation */}
          {phase >= 1 && (
            <motion.div
              initial={{ x: -200, opacity: 0, y: 20 }}
              animate={
                phase === 1
                  ? { x: 0, opacity: 1, y: [20, -10, 0] }
                  : { x: 200, opacity: 0, y: -30 }
              }
              transition={{
                duration: phase === 1 ? 2 : 1.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                y: { duration: 2.5, repeat: phase === 1 ? Infinity : 0, repeatType: 'reverse' },
              }}
              style={{
                position: 'absolute',
                top: '35%',
                zIndex: 2,
              }}
            >
              <DroneIcon size={100} />
            </motion.div>
          )}

          {/* Logo & Tagline */}
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ textAlign: 'center', zIndex: 3 }}
            >
              {/* FlyBy Logo */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '3rem', md: '4.5rem' },
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: '#FFFFFF',
                  }}
                >
                  FLY
                  <Box component="span" sx={{ color: '#22C55E' }}>
                    BY
                  </Box>
                </Typography>
              </Box>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    mb: 3,
                  }}
                >
                  by Feldrix
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 400,
                    letterSpacing: '0.06em',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  Precision Agriculture from Above
                </Typography>
              </motion.div>
            </motion.div>
          )}

          {/* Loading indicator */}
          {phase < 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              style={{
                position: 'absolute',
                bottom: 60,
                width: 40,
                height: 2,
                borderRadius: 1,
                background: 'rgba(34, 197, 94, 0.6)',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
