import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Drawer,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MapIcon from '@mui/icons-material/Map';
import GrassIcon from '@mui/icons-material/Grass';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import CloudIcon from '@mui/icons-material/Cloud';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { signOut } from '../../services/authService';

const navItems = [
  { label: 'Mission Control', icon: <DashboardIcon />, path: '/' },
  { label: "Today's Missions", icon: <FlightTakeoffIcon />, path: '/flight-planner' },
  { label: 'Flight Planner', icon: <MapIcon />, path: '/flight-planner' },
  { label: 'Fields', icon: <GrassIcon />, path: '/fields' },
  { label: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { label: 'Pilots', icon: <PersonIcon />, path: '/pilots' },
  { label: 'Fleet', icon: <AirplanemodeActiveIcon />, path: '/fleet' },
  { label: 'Weather Intelligence', icon: <CloudIcon />, path: '/weather' },
  { label: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
];

const bottomItems = [
  { label: 'Account', icon: <AccountCircleIcon />, path: '/account' },
];

export default function Sidebar({
  width,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  isMobile,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        borderRight: '1px solid rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 3,
          pb: collapsed ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 72,
        }}
      >
        {collapsed ? (
          <Typography
            sx={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'text.primary' }}
          >
            F<Box component="span" sx={{ color: 'primary.main' }}>B</Box>
          </Typography>
        ) : (
          <Box>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'text.primary',
              }}
            >
              FLY
              <Box component="span" sx={{ color: 'primary.main' }}>
                BY
              </Box>
            </Typography>
            <Typography
              sx={{
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'text.tertiary',
                textTransform: 'uppercase',
                mt: 0.25,
              }}
            >
              by Feldrix
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: collapsed ? 1 : 2, borderColor: 'rgba(15, 23, 42, 0.04)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, py: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    minHeight: 44,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    bgcolor: active ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: active ? 'rgba(22, 163, 74, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      color: active ? 'primary.main' : 'text.secondary',
                      fontSize: '1.3rem',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? 'primary.main' : 'text.primary',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Section */}
      <Box sx={{ px: collapsed ? 1 : 1.5, pb: 2 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(15, 23, 42, 0.04)' }} />
        {bottomItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    minHeight: 44,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    bgcolor: active ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.04)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}

        {/* Logout */}
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '10px',
                minHeight: 44,
                px: collapsed ? 1.5 : 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.06)', '& .MuiListItemIcon-root': { color: 'error.main' } },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'text.secondary' }}>
                <LogoutIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* Collapse toggle */}
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{
                border: '1px solid rgba(15, 23, 42, 0.08)',
                borderRadius: '8px',
                width: 28,
                height: 28,
              }}
            >
              {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width, boxSizing: 'border-box' },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width,
        height: '100vh',
        zIndex: 1100,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {sidebarContent}
    </Box>
  );
}
