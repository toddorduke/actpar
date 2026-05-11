import React, { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on mount (handles page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep in sync with any auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout: () => supabase.auth.signOut(),
    }),
    [user, loading]
  );

  // Hold render until session is confirmed — prevents flash redirect to /login on refresh
  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
