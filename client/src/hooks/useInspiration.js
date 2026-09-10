import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Module-level cache: the same query (e.g. everyone with a "fitness" goal
// landing in the same quiet community) shouldn't re-hit the edge function
// on every mount -- Pexels results for a given phrase don't change fast
// enough to matter.
const cache = new Map();

export const useInspiration = (query) => {
  const [items, setItems] = useState(() => cache.get(query) ?? null);
  const [loading, setLoading] = useState(!!query && !cache.has(query));

  useEffect(() => {
    if (!query) { setItems(null); setLoading(false); return; }
    if (cache.has(query)) { setItems(cache.get(query)); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (!cancelled) setLoading(false); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-inspiration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query }),
        },
      );

      if (cancelled) return;
      if (!res.ok) { setLoading(false); return; }

      const { items: fetched } = await res.json();
      cache.set(query, fetched ?? []);
      setItems(fetched ?? []);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [query]);

  return { items, loading };
};
