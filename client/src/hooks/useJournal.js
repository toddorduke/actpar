import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export const useJournal = () => {
  const { user } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const createEntry = useCallback(async ({ subject, body, is_public }) => {
    const bodyCheck = checkText(body);
    if (!bodyCheck.ok) return { data: null, error: null, moderation: bodyCheck };
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: user.id, subject, body, is_public })
      .select()
      .single();
    if (!error) setEntries((prev) => [data, ...prev]);
    return { data, error };
  }, [user]);

  const updateEntry = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error) setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    return { data, error };
  }, []);

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id));
    return { error };
  }, []);

  return { entries, loading, createEntry, updateEntry, deleteEntry, refetch: fetchEntries };
};
