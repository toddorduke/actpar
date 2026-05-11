import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const useCommunities = () => {
  const { user } = useContext(AuthContext);
  const [communities, setCommunities] = useState([]);   // all communities
  const [myMemberships, setMyMemberships] = useState([]); // community_ids the user belongs to
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: allComms }, { data: memberships }] = await Promise.all([
      supabase
        .from('communities')
        .select('*, community_memberships(count)')
        .order('created_at', { ascending: false }),
      supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', user.id),
    ]);

    setCommunities(allComms ?? []);
    setMyMemberships((memberships ?? []).map((m) => m.community_id));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const myCommunities = communities.filter((c) => myMemberships.includes(c.id));

  const createCommunity = useCallback(async ({ name, description }) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('communities')
      .insert({ name: name.trim(), description: description?.trim() || null, created_by: user.id })
      .select()
      .single();
    if (!error) {
      // Auto-join as admin
      await supabase
        .from('community_memberships')
        .insert({ community_id: data.id, user_id: user.id, role: 'admin' });
      setCommunities((prev) => [data, ...prev]);
      setMyMemberships((prev) => [...prev, data.id]);
    }
    return { data, error };
  }, [user]);

  const joinCommunity = useCallback(async (communityId) => {
    if (!user) return;
    const { error } = await supabase
      .from('community_memberships')
      .insert({ community_id: communityId, user_id: user.id, role: 'member' });
    if (!error) setMyMemberships((prev) => [...prev, communityId]);
    return { error };
  }, [user]);

  const leaveCommunity = useCallback(async (communityId) => {
    if (!user) return;
    const { error } = await supabase
      .from('community_memberships')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);
    if (!error) setMyMemberships((prev) => prev.filter((id) => id !== communityId));
    return { error };
  }, [user]);

  return {
    communities,
    myCommunities,
    myMemberships,
    loading,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    refetch: fetchAll,
  };
};
