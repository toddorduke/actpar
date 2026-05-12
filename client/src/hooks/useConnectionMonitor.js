import { useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useConnectionMonitor() {
  useEffect(() => {
    async function reconnect() {
      // Refresh the auth session so the token is valid again
      await supabase.auth.getSession();
      // Re-connect all active realtime channels
      supabase.realtime.connect();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') reconnect();
    }

    function handleOnline() {
      reconnect();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
