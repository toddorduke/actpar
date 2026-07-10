import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

// Excludes phone and stripe_customer_id — internal/unused fields that should
// never round-trip through the client (see profiles RLS: SELECT is public).
const PROFILE_COLUMNS = `
  id, first_name, last_name, alter_ego_name, city, account_type, gender, age,
  avatar_url, bio, created_at, tagline, onboarding_complete, reflection_questions,
  looking_for, working_on, affirmation_start_date, notification_prefs,
  coach_specialty, coach_tagline, coach_rate, coach_rate_num, coach_experience,
  coach_clients_helped, coach_session_types, coach_tags, coach_bio, coach_verified,
  coach_credentials, coach_links, coach_philosophy, coach_values, coach_testimonials,
  coach_sessions, coach_programs, state, profile_setup_complete,
  alter_ego_change_count, alter_ego_last_changed, is_premium, total_xp,
  milestones_count, referred_by
`;

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
      .select(PROFILE_COLUMNS)
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
      .select(PROFILE_COLUMNS)
      .single();
    if (!error) setProfile(data);
    return { data, error };
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
