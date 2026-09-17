import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Mirrors client/src/hooks/useBlock.js -- kept mobile-local (not in
// @actpar/shared) because it reads AuthContext directly, matching this
// screen's other local hooks (useGoalsV2, useNotificationsV2). Also tracks
// the blocked profiles themselves (not just ids), since Settings needs to
// list who's blocked, not just check membership.
export function useBlock() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id, profiles:blocked_id(id, first_name, last_name, alter_ego_name)')
      .eq('blocker_id', userId);
    setBlockedIds(new Set((data ?? []).map((r) => r.blocked_id)));
    setBlockedProfiles((data ?? []).map((r) => r.profiles).filter(Boolean));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const blockUser = useCallback(async (targetId) => {
    if (!userId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('blocked_users').insert({ blocker_id: userId, blocked_id: targetId });
    if (!error) fetchBlocked();
    return { error };
  }, [userId, fetchBlocked]);

  const unblockUser = useCallback(async (targetId) => {
    if (!userId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('blocked_users').delete().eq('blocker_id', userId).eq('blocked_id', targetId);
    if (!error) fetchBlocked();
    return { error };
  }, [userId, fetchBlocked]);

  const isBlocked = useCallback((targetId) => blockedIds.has(targetId), [blockedIds]);

  return { blockedIds, blockedProfiles, loading, blockUser, unblockUser, isBlocked, refetch: fetchBlocked };
}
