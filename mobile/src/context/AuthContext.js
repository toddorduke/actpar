import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { identifyUserForErrors } from '../lib/errorReporting';

export const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      identifyUserForErrors(newSession?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
}
