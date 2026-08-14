import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/profileService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch the user's profile and company data
  const fetchProfile = useCallback(async (userId) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      setCompany(profileData?.companies || null);
      return profileData;
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      setProfile(null);
      setCompany(null);
      return null;
    }
  }, []);

  // Initialize: restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCompany(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        } else if (event === 'PASSWORD_RECOVERY') {
          // User clicked reset link — handled by the ResetPassword page
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Refresh profile data (call after company setup, profile updates, etc.)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Derived state
  const isAuthenticated = !!user;
  const hasCompany = !!profile?.company_id;
  const needsCompanySetup = isAuthenticated && !hasCompany;

  const value = {
    user,
    profile,
    company,
    loading,
    initialized,
    isAuthenticated,
    hasCompany,
    needsCompanySetup,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
