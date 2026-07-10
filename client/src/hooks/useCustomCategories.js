import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export function useCustomCategories(userId) {
  const [categories, setCategories] = useState([]);

  async function fetchCategories() {
    if (!userId) return;
    const { data } = await supabase
      .from('custom_categories')
      .select('id, name, use_count, status, created_by')
      .or(`status.eq.active,created_by.eq.${userId}`)
      .neq('status', 'archived')
      .order('use_count', { ascending: false });
    setCategories(data ?? []);
  }

  useEffect(() => { fetchCategories(); }, [userId]);

  const search = useCallback((query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories]);

  const createOrAdopt = useCallback(async (name) => {
    if (!userId || !name.trim()) return { error: new Error('Missing name') };
    const nameCheck = checkText(name.trim());
    if (!nameCheck.ok) return { error: null, moderation: nameCheck };
    const { error } = await supabase.rpc('increment_custom_category', {
      cat_name: name.trim(),
      p_user_id: userId,
    });
    if (!error) await fetchCategories();
    return { error };
  }, [userId, categories]);

  return { categories, search, createOrAdopt };
}
