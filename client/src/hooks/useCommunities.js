import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';
import { track, Events } from '../lib/analytics.js';

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
        .is('archived_at', null)
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
    const nameCheck = checkText(name);
    if (!nameCheck.ok) return { data: null, error: null, moderation: nameCheck };
    if (description) {
      const descCheck = checkText(description);
      if (!descCheck.ok) return { data: null, error: null, moderation: descCheck };
    }
    const { data, error } = await supabase
      .from('communities')
      .insert({ name: name.trim(), description: description?.trim() || null, created_by: user.id })
      .select()
      .single();
    if (!error) {
      track(Events.COMMUNITY_CREATED);
      // Auto-join as admin
      const { error: membershipError } = await supabase
        .from('community_memberships')
        .insert({ community_id: data.id, user_id: user.id, role: 'admin' });
      if (membershipError) return { data, error: membershipError };
      setCommunities((prev) => [data, ...prev]);
      setMyMemberships((prev) => [...prev, data.id]);
    }
    return { data, error };
  }, [user]);

  const updateCommunity = useCallback(async (communityId, { name, description }) => {
    const nameCheck = checkText(name);
    if (!nameCheck.ok) return { data: null, error: null, moderation: nameCheck };
    if (description) {
      const descCheck = checkText(description);
      if (!descCheck.ok) return { data: null, error: null, moderation: descCheck };
    }
    const { data, error } = await supabase
      .from('communities')
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq('id', communityId)
      .select()
      .single();
    if (!error) setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, ...data } : c)));
    return { data, error };
  }, []);

  const archiveCommunity = useCallback(async (communityId) => {
    const { error } = await supabase
      .from('communities')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', communityId);
    if (!error) setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    return { error };
  }, []);

  const joinCommunity = useCallback(async (communityId) => {
    if (!user) return;
    const { error } = await supabase
      .from('community_memberships')
      .insert({ community_id: communityId, user_id: user.id, role: 'member' });
    if (!error) {
      track(Events.COMMUNITY_JOINED);
      setMyMemberships((prev) => [...prev, communityId]);
    }
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
    updateCommunity,
    archiveCommunity,
    joinCommunity,
    leaveCommunity,
    refetch: fetchAll,
  };
};
