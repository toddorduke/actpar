import { createClient } from '@supabase/supabase-js';
import { setSupabaseClient } from '@actpar/shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 10000),
  },
});

// Wired here, not in index.jsx -- every shared hook is reached through a
// module that imports this file, so setting it at creation time guarantees
// it's ready before any shared hook can possibly run, with no ordering
// dependency on where index.jsx happens to import things.
setSupabaseClient(supabase);
