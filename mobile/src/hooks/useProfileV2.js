import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Mirrors client/src/hooks/useProfile.js, trimmed of coach_* columns --
// the coach marketplace is disabled and mobile has no coach UI yet.
const PROFILE_COLUMNS = `
  id, first_name, last_name, alter_ego_name, city, account_type, gender, age,
  avatar_url, bio, created_at, tagline, onboarding_complete,
  looking_for, working_on, accountability_style, checkin_frequency,
  notification_prefs, is_premium, total_xp, milestones_count
`;

export function useProfileV2(userId, viewUserId = null) {
  const targetId = viewUserId ?? userId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', targetId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }, [targetId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single();
    if (!error) setProfile(data);
    return { data, error };
  }, [userId]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
