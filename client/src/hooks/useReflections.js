import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export const DEFAULT_QUESTIONS = [
  "What's one thing you're grateful for today?",
  "What's your biggest win this week?",
  "What's one challenge your tribe can help with?",
];

export const useReflections = () => {
  const { user } = useContext(AuthContext);
  const [reflections, setReflections] = useState([]);
  const [affirmations, setAffirmations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    const all = data ?? [];
    setReflections(all.filter((r) => (r.type ?? 'reflection') === 'reflection'));
    setAffirmations(all.filter((r) => r.type === 'affirmation'));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveAnswer = useCallback(async ({ question, answer, isPublic }) => {
    if (!user) return { error: 'Not authenticated' };
    const modCheck = checkText(answer);
    if (!modCheck.ok) return { data: null, error: null, moderation: modCheck };
    const { data, error } = await supabase
      .from('reflections')
      .insert({ user_id: user.id, question, answer, is_public: isPublic, type: 'reflection' })
      .select()
      .single();
    if (!error) setReflections((prev) => [data, ...prev]);
    return { data, error };
  }, [user]);

  const saveAffirmation = useCallback(async ({ answer, isPublic }) => {
    if (!user) return { error: 'Not authenticated' };
    const modCheck = checkText(answer);
    if (!modCheck.ok) return { data: null, error: null, moderation: modCheck };
    const { data, error } = await supabase
      .from('reflections')
      .insert({ user_id: user.id, question: 'Daily Affirmation', answer, is_public: isPublic, type: 'affirmation' })
      .select()
      .single();
    if (!error) setAffirmations((prev) => [data, ...prev]);
    return { data, error };
  }, [user]);

  return { reflections, affirmations, loading, saveAnswer, saveAffirmation, refetch: fetchAll };
};
