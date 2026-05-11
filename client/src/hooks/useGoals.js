import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

const STREAK_MILESTONES = [7, 30, 60, 90];

const todayStr = () => new Date().toISOString().split('T')[0];

export const useGoals = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (!error) setGoals(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = useCallback(async (title, category = null, options = {}) => {
    if (!user) return { error: 'Not authenticated' };
    const { goal_type = 'habit', target_value, target_unit, target_period } = options;
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        category,
        goal_type,
        target_value: target_value ?? null,
        target_unit: target_unit ?? null,
        target_period: target_period ?? null,
      })
      .select()
      .single();
    if (!error) setGoals((prev) => [...prev, data]);
    return { data, error };
  }, [user]);

  // Check in for today — only once per day
  const checkIn = useCallback(async (goalId) => {
    const today = todayStr();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    if (goal.last_checked_in === today) return { alreadyDone: true };

    const newCount = (goal.day_count ?? 0) + 1;
    const { error } = await supabase
      .from('goals')
      .update({ day_count: newCount, last_checked_in: today, updated_at: new Date().toISOString() })
      .eq('id', goalId);

    if (!error) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, day_count: newCount, last_checked_in: today } : g
        )
      );
      if (STREAK_MILESTONES.includes(newCount)) {
        createNotification({
          userId: user.id,
          actorId: null,
          type: 'streak_milestone',
          refId: goalId,
          body: `🔥 ${newCount}-day streak on "${goal.title}"! Keep it up!`,
        });
      }
    }
    return { error };
  }, [goals, user]);

  const updateTier = useCallback(async (goalId, tier) => {
    const { error } = await supabase
      .from('goals')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, tier } : g)));
    return { error };
  }, []);

  const updateProgress = useCallback(async (goalId, progress) => {
    const { error } = await supabase
      .from('goals')
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)));
    return { error };
  }, []);

  const deleteGoal = useCallback(async (goalId) => {
    const { error } = await supabase
      .from('goals')
      .update({ is_active: false })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.filter((g) => g.id !== goalId));
    return { error };
  }, []);

  return { goals, loading, addGoal, checkIn, updateProgress, updateTier, deleteGoal, refetch: fetchGoals };
};
