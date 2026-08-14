// FlyBy by Feldrix — Typography Scale
// Matches Feldrix's Inter font system with tight heading letter-spacing
const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  h1: {
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.035em',
  },
  h2: {
    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
    fontWeight: 750,
    lineHeight: 1.15,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.015em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 650,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.005em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.7,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.65,
  },
  subtitle1: {
    fontSize: '1.125rem',
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#64748B',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#64748B',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#94A3B8',
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};

export default typography;
