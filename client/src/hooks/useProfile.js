import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const useProfile = (userId = null) => {
  const { user } = useContext(AuthContext);
  const targetId = userId ?? user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }, [targetId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
