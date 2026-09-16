import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';

// Excludes phone and stripe_customer_id -- internal/unused fields that
// should never round-trip through the client (see profiles RLS: SELECT is
// public). coach_* columns are included for web's coach-profile editing;
// mobile just won't touch them (no coach UI there, marketplace disabled).
const PROFILE_COLUMNS = `
  id, first_name, last_name, alter_ego_name, city, account_type, gender, age,
  avatar_url, bio, created_at, tagline, onboarding_complete, reflection_questions,
  looking_for, working_on, accountability_style, checkin_frequency,
  affirmation_start_date, notification_prefs,
  coach_specialty, coach_tagline, coach_rate, coach_rate_num, coach_experience,
  coach_clients_helped, coach_session_types, coach_tags, coach_bio, coach_verified,
  coach_credentials, coach_links, coach_philosophy, coach_values, coach_testimonials,
  coach_sessions, coach_programs, state, profile_setup_complete,
  alter_ego_change_count, alter_ego_last_changed, is_premium, total_xp,
  milestones_count, referred_by
`;

// userId: the signed-in user (needed for updateProfile, and as the default
// fetch target). viewUserId: pass this to view someone *else's* profile
// (e.g. UserProfilePage) -- when set, it's fetched instead of userId's own.
export function useProfile(userId, viewUserId = null) {
  const targetId = viewUserId ?? userId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const { data } = await getSupabaseClient()
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
    const { data, error } = await getSupabaseClient()
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
