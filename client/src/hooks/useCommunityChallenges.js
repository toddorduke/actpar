import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const useCommunityChallenges = (communityId) => {
  const { user } = useContext(AuthContext);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    const { data } = await supabase
      .from('community_challenges')
      .select('*, challenge_entries(user_id, value, note, logged_at, profiles(first_name, last_name))')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    setChallenges(data ?? []);
    setLoading(false);
  }, [communityId]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const createChallenge = useCallback(async ({ title, description, target_value, unit, start_date, end_date }) => {
    const { data, error } = await supabase
      .from('community_challenges')
      .insert({ community_id: communityId, created_by: user.id, title, description, target_value, unit, start_date, end_date })
      .select('*, challenge_entries(user_id, value, note, logged_at, profiles(first_name, last_name))')
      .single();
    if (!error) setChallenges((prev) => [data, ...prev]);
    return { data, error };
  }, [communityId, user]);

  const logEntry = useCallback(async (challengeId, value, note) => {
    const { data, error } = await supabase
      .from('challenge_entries')
      .insert({ challenge_id: challengeId, user_id: user.id, value, note })
      .select('*, profiles(first_name, last_name)')
      .single();
    if (!error) {
      setChallenges((prev) => prev.map((c) =>
        c.id === challengeId
          ? { ...c, challenge_entries: [...(c.challenge_entries ?? []), data] }
          : c
      ));
    }
    return { data, error };
  }, [user]);

  return { challenges, loading, createChallenge, logEntry, refetch: fetchChallenges };
};
