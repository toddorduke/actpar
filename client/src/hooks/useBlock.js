import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const useBlock = () => {
  const { user } = useContext(AuthContext);
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        setBlockedIds(new Set((data ?? []).map((r) => r.blocked_id)));
      });
  }, [user]);

  const blockUser = useCallback(async (targetId) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: user.id, blocked_id: targetId });
    if (!error) setBlockedIds((prev) => new Set([...prev, targetId]));
    return { error };
  }, [user]);

  const unblockUser = useCallback(async (targetId) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetId);
    if (!error) setBlockedIds((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
    return { error };
  }, [user]);

  const isBlocked = useCallback((targetId) => blockedIds.has(targetId), [blockedIds]);

  return { blockedIds, blockUser, unblockUser, isBlocked };
};
