import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StartupAnimation from './components/animations/StartupAnimation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompanySetup from './pages/CompanySetup';
import AppLayout from './components/layout/AppLayout';
import MissionControl from './pages/MissionControl';
import FlightPlanner from './pages/FlightPlanner';
import Fields from './pages/Fields';
import Farms from './pages/Farms';
import Customers from './pages/Customers';
import Pilots from './pages/Pilots';
import Fleet from './pages/Fleet';
import Assets from './pages/Assets';
import Batteries from './pages/Batteries';
import Weather from './pages/Weather';
import Reports from './pages/Reports';
import Commercial from './pages/Commercial';
import Account from './pages/Account';

function App() {
  const [showStartup, setShowStartup] = useState(true);

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem('flyby_animated');
    if (hasSeenAnimation) {
      setShowStartup(false);
    }
  }, []);

  const handleAnimationComplete = () => {
    sessionStorage.setItem('flyby_animated', 'true');
    setShowStartup(false);
  };

  if (showStartup) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StartupAnimation onComplete={handleAnimationComplete} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Company Setup (authenticated but no company yet) */}
              <Route
                path="/company-setup"
                element={
                  <ProtectedRoute>
                    <CompanySetup />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MissionControl />} />
                <Route path="flight-planner" element={<FlightPlanner />} />
                <Route path="fields" element={<Fields />} />
                <Route path="farms" element={<Farms />} />
                <Route path="customers" element={<Customers />} />
                <Route path="pilots" element={<Pilots />} />
                <Route path="fleet" element={<Fleet />} />
                <Route path="assets" element={<Assets />} />
              <Route path="batteries" element={<Batteries />} />
                <Route path="weather" element={<Weather />} />
                <Route path="commercial" element={<Commercial />} />
                <Route path="reports" element={<Reports />} />
                <Route path="account" element={<Account />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
