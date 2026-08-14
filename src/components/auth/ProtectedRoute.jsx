import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

/**
 * Wraps protected routes. Redirects to login if unauthenticated,
 * redirects to company-setup if the user hasn't created a company yet.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, needsCompanySetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but hasn't set up their company,
  // redirect to company setup (unless they're already there)
  if (needsCompanySetup && location.pathname !== '/company-setup') {
    return <Navigate to="/company-setup" replace />;
  }

  return children;
}
