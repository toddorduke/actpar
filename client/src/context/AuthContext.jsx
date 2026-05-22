import React, { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Never sign out during a password recovery flow — the reset page needs the session
    const isRecovery = window.location.hash.includes('type=recovery') ||
      window.location.pathname === '/reset-password';

    // INITIAL_SESSION fires after the SDK finishes processing any URL auth codes
    // (email confirmation, OAuth callback, etc.), so it's the right place to
    // initialise user state — getSession() can return null before code exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        const noRemember = localStorage.getItem('actpar_no_remember');
        const sameSession = sessionStorage.getItem('actpar_session_active');
        if (noRemember && !sameSession && session && !isRecovery) {
          supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else {
        // USER_UPDATED and any other events
        setUser(session?.user ?? null);
      }
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
