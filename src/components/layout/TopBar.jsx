import {
  Box,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Chip,
  InputBase,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../../hooks/useAuth';
export default function TopBar({ onMenuClick, isMobile }) {
  const { profile, company } = useAuth();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  // Derive user display info from auth context
  const displayName = profile?.full_name || 'Pilot';
  const companyName = company?.company_name || 'FlyBy Operations';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 4 },
        py: 1.5,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        minHeight: 64,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Mobile menu */}
      {isMobile && (
        <IconButton onClick={onMenuClick} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
      )}

      {/* Search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          maxWidth: 400,
          bgcolor: 'background.surface',
          borderRadius: '10px',
          px: 2,
          py: 0.75,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.08)',
          },
        }}
      >
        <SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} />
        <InputBase
          placeholder="Search missions, fields, pilots..."
          sx={{
            flex: 1,
            fontSize: '0.85rem',
            '& input::placeholder': { color: '#94A3B8', opacity: 1 },
          }}
        />
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Weather status */}
      <Tooltip title="Weather data coming in Sprint 4">
        <Chip
          icon={<CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} />}
          label="Operational"
          size="small"
          sx={{
            bgcolor: 'rgba(22, 163, 74, 0.08)',
            color: 'success.main',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid',
            borderColor: 'rgba(22, 163, 74, 0.2)',
            display: { xs: 'none', sm: 'flex' },
            '& .MuiChip-icon': {
              color: 'success.main',
            },
          }}
        />
      </Tooltip>

      {/* Notifications */}
      <IconButton size="small" sx={{ position: 'relative' }}>
        <Badge
          badgeContent={3}
          color="primary"
          sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}
        >
          <NotificationsNoneIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
        </Badge>
      </IconButton>

      {/* Time */}
      <Typography
        sx={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
          display: { xs: 'none', md: 'block' },
        }}
      >
        {timeStr}
      </Typography>

      {/* User */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pl: 2,
          borderLeft: '1px solid rgba(15, 23, 42, 0.06)',
          ml: 1,
        }}
      >
        <Avatar
          src={profile?.avatar_url || undefined}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }}>
            {displayName}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', lineHeight: 1.2 }}>
            {companyName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
