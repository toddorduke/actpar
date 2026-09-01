import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Mirrors client/src/hooks/useGoalProgress.js against goal_progress_v2.

function periodStart(period) {
  const now = new Date();
  if (period === 'weekly') {
    const d = new Date(now);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return null; // 'total' — no date filter
}

export function useGoalProgressV2(userId, numericGoals) {
  const [progressMap, setProgressMap] = useState({});
  const goalIds = numericGoals.map((g) => g.id);

  const fetchProgress = useCallback(async () => {
    if (!userId || goalIds.length === 0) { setProgressMap({}); return; }
    const since = new Date();
    since.setDate(since.getDate() - 35);

    const { data } = await supabase
      .from('goal_progress_v2')
      .select('*')
      .in('goal_id', goalIds)
      .eq('user_id', userId)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: false });

    const map = {};
    for (const goal of numericGoals) {
      const start = periodStart(goal.target_period);
      const entries = (data ?? []).filter((e) => {
        if (e.goal_id !== goal.id) return false;
        if (!start) return true;
        return new Date(e.logged_at) >= new Date(start);
      });
      const total = entries.reduce((sum, e) => sum + parseFloat(e.value ?? 0), 0);
      map[goal.id] = { entries, total };
    }
    setProgressMap(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, goalIds.join(',')]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const logProgress = useCallback(async (goalId, value, note = '') => {
    if (!userId) return { error: { message: 'Not authenticated' } };
    const { data, error } = await supabase
      .from('goal_progress_v2')
      .insert({ goal_id: goalId, user_id: userId, value, note: note.trim() || null })
      .select()
      .single();
    if (!error) await fetchProgress();
    return { data, error };
  }, [userId, fetchProgress]);

  return { progressMap, logProgress, refetch: fetchProgress };
}
