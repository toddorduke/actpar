import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

const STREAK_MILESTONES = [7, 30, 60, 90];

const todayStr = () => new Date().toISOString().split('T')[0];

export const useGoals = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: active }, { data: completed }] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', false).not('completed_at', 'is', null).order('completed_at', { ascending: false }),
    ]);
    setGoals(active ?? []);
    setCompletedGoals(completed ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = useCallback(async (title, category = null, options = {}) => {
    if (!user) return { error: 'Not authenticated' };
    const { goal_type = 'habit', target_value, target_unit, target_period, tier } = options;
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        category,
        goal_type,
        tier: tier ?? null,
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
  const checkIn = useCallback(async (goalId, logType = 'manual') => {
    const today = todayStr();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    if (goal.last_checked_in === today) return { alreadyDone: true };

    const newCount = (goal.day_count ?? 0) + 1;
    const now = new Date().toISOString();
    const [{ error }] = await Promise.all([
      supabase
        .from('goals')
        .update({ day_count: newCount, last_checked_in: today, updated_at: now })
        .eq('id', goalId),
      supabase
        .from('checkin_logs')
        .insert({ user_id: user.id, goal_id: goalId, checked_in_at: now, log_type: logType }),
    ]);

    const milestone = STREAK_MILESTONES.includes(newCount) ? newCount : null;
    if (!error) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, day_count: newCount, last_checked_in: today } : g
        )
      );
      if (milestone) {
        // Notify the user themselves
        createNotification({
          userId: user.id,
          actorId: null,
          type: 'streak_milestone',
          refId: goalId,
          body: `🔥 ${newCount}-day streak on "${goal.title}"! Keep it up!`,
        });
        // Notify all accepted connections so they see it in their feed
        supabase
          .from('connections')
          .select('requester_id, receiver_id')
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .then(({ data: conns }) => {
            (conns ?? []).forEach((c) => {
              const friendId = c.requester_id === user.id ? c.receiver_id : c.requester_id;
              createNotification({
                userId: friendId,
                actorId: user.id,
                type: 'streak_milestone',
                refId: goalId,
                body: `🔥 hit a ${newCount}-day streak on "${goal.title}"!`,
              });
            });
          });
      }
    }
    return { error, milestone, goalTitle: goal.title };
  }, [goals, user]);

  // Log a check-in for a past day — doesn't change streak, just records the history
  const backdatedCheckIn = useCallback(async (goalId, dateStr, note = null) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    // Check for duplicate log on that date
    const { data: existing } = await supabase
      .from('checkin_logs')
      .select('id')
      .eq('goal_id', goalId)
      .gte('checked_in_at', `${dateStr}T00:00:00.000Z`)
      .lt('checked_in_at', `${dateStr}T23:59:59.999Z`)
      .maybeSingle();
    if (existing) return { alreadyLogged: true };
    const { error } = await supabase
      .from('checkin_logs')
      .insert({
        user_id: user.id,
        goal_id: goalId,
        checked_in_at: `${dateStr}T12:00:00.000Z`,
        log_type: 'backdated',
        note: note?.trim() || null,
      });
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

  const completeGoal = useCallback(async (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('goals')
      .update({ is_active: false, completed_at: now })
      .eq('id', goalId);
    if (!error) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setCompletedGoals((prev) => [{ ...goal, is_active: false, completed_at: now }, ...prev]);
    }
    return { error };
  }, [goals]);

  return { goals, completedGoals, loading, addGoal, checkIn, backdatedCheckIn, updateProgress, updateTier, deleteGoal, completeGoal, refetch: fetchGoals };
};
