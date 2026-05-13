import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

const MILESTONES = new Set([7, 30, 60, 90]);

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function useConnectionActivity(acceptedConnections) {
  const { user } = useContext(AuthContext);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const connectionIds = acceptedConnections
    .map((c) => (c.requester_id === user?.id ? c.receiver_id : c.requester_id))
    .filter(Boolean);

  const fetch = useCallback(async () => {
    if (!user || connectionIds.length === 0) {
      setActivity([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const cutoff = daysAgoStr(3);
    const { data } = await supabase
      .from('goals')
      .select('id, title, day_count, last_checked_in, updated_at, user_id, profiles(id, first_name, last_name, avatar_url, alter_ego_name)')
      .in('user_id', connectionIds)
      .eq('is_active', true)
      .gte('last_checked_in', cutoff)
      .not('last_checked_in', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(30);

    setActivity(data ?? []);
    setLoading(false);
  }, [user, connectionIds.join(',')]);

  useEffect(() => { fetch(); }, [fetch]);

  return { activity, loading, refetch: fetch };
}

export function isMilestone(dayCount) {
  return MILESTONES.has(dayCount);
}
