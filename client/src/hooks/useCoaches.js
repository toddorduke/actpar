import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { getDisplayName } from '../utils/displayName.js';

const COACH_FIELDS = [
  'id', 'first_name', 'last_name', 'avatar_url', 'city',
  'coach_specialty', 'coach_tagline', 'coach_rate', 'coach_rate_num',
  'coach_experience', 'coach_clients_helped', 'coach_session_types',
  'coach_tags', 'coach_bio', 'coach_verified', 'coach_credentials',
  'coach_links', 'coach_philosophy', 'coach_values', 'coach_testimonials',
  'coach_sessions', 'coach_programs',
].join(', ');

export function profileToCoach(p) {
  return {
    id: p.id,
    isReal: true,
    name: getDisplayName(p),
    tagline: p.coach_tagline ?? p.tagline ?? '',
    specialty: p.coach_specialty ?? '',
    location: p.city ?? '',
    rating: null,
    reviewCount: 0,
    rate: p.coach_rate ?? '',
    rateNum: p.coach_rate_num ?? 0,
    experience: p.coach_experience ?? '',
    clientsHelped: p.coach_clients_helped ?? '',
    sessionTypes: p.coach_session_types ?? [],
    verified: p.coach_verified ?? false,
    tags: p.coach_tags ?? [],
    bio: p.coach_bio?.length ? p.coach_bio : [],
    philosophy: p.coach_philosophy ?? {},
    credentials: p.coach_credentials ?? [],
    links: p.coach_links ?? [],
    values: p.coach_values ?? [],
    testimonials: p.coach_testimonials ?? [],
    sessions: p.coach_sessions ?? [],
    workouts: p.coach_programs ?? [],
    videos: [],
    team: [],
    awards: [],
    avatar_url: p.avatar_url,
  };
}

export function useCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select(COACH_FIELDS)
      .eq('account_type', 'Coach')
      .order('created_at', { ascending: false });
    setCoaches((data ?? []).map(profileToCoach));
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

  return { coaches, loading, refetch: fetchCoaches };
}

export function useCoachProfile(coachId) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select(COACH_FIELDS)
        .eq('id', coachId)
        .eq('account_type', 'Coach')
        .maybeSingle();
      setCoach(data ? profileToCoach(data) : null);
      setLoading(false);
    };
    fetch();
  }, [coachId]);

  return { coach, loading };
}
