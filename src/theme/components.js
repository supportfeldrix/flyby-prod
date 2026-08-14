// FlyBy by Feldrix — MUI Component Overrides
// Premium cards, buttons, inputs matching Feldrix ecosystem quality
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: '#F8FAFC',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: '10px 24px',
        fontWeight: 600,
        fontSize: '0.875rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
        },
      },
      containedSecondary: {
        background: '#0F172A',
        '&:hover': {
          background: '#1E293B',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)',
        },
      },
      outlined: {
        borderColor: 'rgba(15, 23, 42, 0.12)',
        '&:hover': {
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.04)',
        },
      },
      sizeSmall: {
        padding: '6px 16px',
        fontSize: '0.8125rem',
        borderRadius: 10,
      },
      sizeLarge: {
        padding: '14px 32px',
        fontSize: '1rem',
        borderRadius: 14,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          '& fieldset': {
            borderColor: 'rgba(15, 23, 42, 0.1)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(22, 163, 74, 0.4)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#16A34A',
            borderWidth: '2px',
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.06)',
      },
      bar: {
        borderRadius: 4,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: 'rgba(22, 163, 74, 0.08)',
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '8px 12px',
        backgroundColor: '#0F172A',
      },
    },
  },
};

export default components;
