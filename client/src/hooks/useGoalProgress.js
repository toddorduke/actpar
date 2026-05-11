import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

function periodStart(period) {
  const now = new Date();
  if (period === 'weekly') {
    const d = new Date(now);
    const diff = (d.getDay() + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return null; // 'total' — no date filter
}

export function useGoalProgress(goals) {
  const { user } = useContext(AuthContext);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);

  const numericGoals = goals.filter((g) => g.goal_type === 'numeric');
  const goalIds = numericGoals.map((g) => g.id);

  const fetchProgress = useCallback(async () => {
    if (!user || goalIds.length === 0) { setProgressMap({}); return; }
    setLoading(true);

    // Fetch last 35 days — covers weekly and monthly periods
    const since = new Date();
    since.setDate(since.getDate() - 35);

    const { data } = await supabase
      .from('goal_progress')
      .select('*')
      .in('goal_id', goalIds)
      .eq('user_id', user.id)
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
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, goalIds.join(',')]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const logProgress = useCallback(async (goalId, value, note = '') => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('goal_progress')
      .insert({ goal_id: goalId, user_id: user.id, value, note: note.trim() || null })
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
            userId: user.id,
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
  }, [user, goals]);

  return { progressMap, loading, logProgress, refetch: fetchProgress };
}
