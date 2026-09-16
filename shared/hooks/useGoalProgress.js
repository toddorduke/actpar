import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { createNotification } from './useNotifications.js';
import { checkText } from '../lib/contentModeration.js';

function periodStart(period) {
  const d = new Date();
  if (period === 'daily') return d.toISOString().split('T')[0];
  if (period === 'weekly') {
    const diff = (d.getDay() + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  }
  if (period === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return d.toISOString().split('T')[0];
}

export function useGoalProgress(userId, goals) {
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);

  const numericGoals = goals.filter((g) => g.goal_type === 'numeric');
  const goalIds = numericGoals.map((g) => g.id);

  const fetchProgress = useCallback(async () => {
    if (!userId || goalIds.length === 0) { setProgressMap({}); return; }
    setLoading(true);

    // Fetch last 35 days — covers weekly and monthly periods
    const since = new Date();
    since.setDate(since.getDate() - 35);

    const { data } = await getSupabaseClient()
      .from('goal_progress_v2')
      .select('*')
      .in('goal_id', goalIds)
      .eq('user_id', userId)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: false });

    const map = {};
    for (const goal of numericGoals) {
      const start = periodStart(goal.target_period);
      const entries = (data ?? []).filter((e) => e.goal_id === goal.id && e.logged_at >= start);
      const total = entries.reduce((sum, e) => sum + parseFloat(e.value), 0);
      map[goal.id] = { entries, total };
    }
    setProgressMap(map);
    setLoading(false);
  }, [userId, goalIds.join(',')]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const logProgress = useCallback(async (goalId, value, note = '') => {
    if (!userId) return { error: 'Not authenticated' };
    if (note.trim()) {
      const noteCheck = checkText(note);
      if (!noteCheck.ok) return { data: null, error: null, moderation: noteCheck };
    }
    const { data, error } = await getSupabaseClient()
      .from('goal_progress_v2')
      .insert({ goal_id: goalId, user_id: userId, value, note: note.trim() || null })
      .select()
      .single();

    if (!error && data) {
      setProgressMap((prev) => {
        const existing = prev[goalId] ?? { entries: [], total: 0 };
        const newTotal = existing.total + parseFloat(value);
        const goal = goals.find((g) => g.id === goalId);
        const wasUnder = goal?.target_value && existing.total < goal.target_value;
        const nowOver = goal?.target_value && newTotal >= goal.target_value;
        if (wasUnder && nowOver) {
          createNotification({
            userId,
            actorId: null,
            type: 'progress_complete',
            refId: goalId,
            body: `🎯 You hit your ${goal.target_period ?? ''} target for "${goal.title}"!`.trim(),
          });
        }
        return {
          ...prev,
          [goalId]: { entries: [data, ...existing.entries], total: newTotal },
        };
      });
    }
    return { data, error };
  }, [userId, goals]);

  return { progressMap, loading, logProgress, refetch: fetchProgress };
}
