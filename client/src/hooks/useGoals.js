import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';
import { track, Events } from '../lib/analytics.js';
import { awardXP, XP_VALUES, milestoneXP } from '../lib/xp.js';
import { checkText } from '../utils/contentModeration.js';
import { computeCheckInStreak } from '../utils/streak.js';

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
      supabase.from('goals_v2').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true }),
      supabase.from('goals_v2').select('*').eq('user_id', user.id).eq('status', 'completed').order('completed_at', { ascending: false }),
    ]);
    setGoals(active ?? []);
    setCompletedGoals(completed ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = useCallback(async (title, category = null, options = {}) => {
    if (!user) return { error: 'Not authenticated' };
    const titleCheck = checkText(title);
    if (!titleCheck.ok) return { data: null, error: null, moderation: titleCheck };
    const { goal_type = 'habit', target_value, target_unit, target_period, tier, reminder_utc_hour, description } = options;
    if (description) {
      const whyCheck = checkText(description);
      if (!whyCheck.ok) return { data: null, error: null, moderation: whyCheck };
    }
    const { data, error } = await supabase
      .from('goals_v2')
      .insert({
        user_id: user.id,
        title,
        tag: category ?? 'custom',
        goal_type,
        frequency: goal_type === 'numeric' ? null : 'daily',
        tier: tier ?? null,
        target_value: target_value ?? null,
        target_unit: target_unit ?? null,
        target_period: target_period ?? null,
        reminder_utc_hour: reminder_utc_hour ?? null,
        description: description?.trim() || null,
      })
      .select()
      .single();
    if (error) {
      if (error.message?.includes('ACTIVE_GOAL_CAP_REACHED')) {
        return { data: null, error: { code: 'CAP_REACHED' } };
      }
      return { data: null, error };
    }
    setGoals((prev) => [...prev, data]);
    track(Events.GOAL_CREATED, { tier: tier ?? null, category, goal_type });
    awardXP(user.id, XP_VALUES.GOAL_CREATED);
    return { data, error: null };
  }, [user]);

  // Check in for today — only once per day
  const checkIn = useCallback(async (goalId, logType = 'manual', note = null) => {
    const today = todayStr();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    if (goal.last_checked_in === today) return { alreadyDone: true };

    const { newCount, graceUsedWeek, graceConsumed } = computeCheckInStreak(goal, today);
    const now = new Date().toISOString();
    const [{ error: goalError }, { error: logError }] = await Promise.all([
      supabase
        .from('goals_v2')
        .update({ day_count: newCount, last_checked_in: today, grace_used_week: graceUsedWeek, updated_at: now })
        .eq('id', goalId),
      supabase
        .from('goal_checkins_v2')
        .upsert({ user_id: user.id, goal_id: goalId, date: today, done: true }, { onConflict: 'goal_id,date' }),
    ]);
    const error = goalError ?? logError;

    const milestone = STREAK_MILESTONES.includes(newCount) ? newCount : null;
    if (!error) {
      track(Events.GOAL_CHECKED_IN, { day_count: newCount, is_milestone: !!milestone });
      awardXP(user.id, XP_VALUES.CHECKIN);
      if (milestone) {
        awardXP(user.id, milestoneXP(milestone));
        supabase.from('profiles')
          .select('milestones_count')
          .eq('id', user.id)
          .single()
          .then(({ data: p }) =>
            supabase.from('profiles')
              .update({ milestones_count: (p?.milestones_count ?? 0) + 1 })
              .eq('id', user.id)
          );
      }
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, day_count: newCount, last_checked_in: today, grace_used_week: graceUsedWeek } : g
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
    return { error, milestone, goalTitle: goal.title, graceConsumed };
  }, [goals, user]);

  // Log a check-in for a past day — doesn't change streak, just records the history
  const backdatedCheckIn = useCallback(async (goalId, dateStr, note = null) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    const { data: existing } = await supabase
      .from('goal_checkins_v2')
      .select('id')
      .eq('goal_id', goalId)
      .eq('date', dateStr)
      .maybeSingle();
    if (existing) return { alreadyLogged: true };
    const { error } = await supabase
      .from('goal_checkins_v2')
      .insert({
        user_id: user.id,
        goal_id: goalId,
        date: dateStr,
        done: true,
      });
    return { error };
  }, [goals, user]);

  const updateTier = useCallback(async (goalId, tier) => {
    const { error } = await supabase
      .from('goals_v2')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, tier } : g)));
    return { error };
  }, []);

  const updateProgress = useCallback(async (goalId, progress) => {
    const { error } = await supabase
      .from('goals_v2')
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)));
    return { error };
  }, []);

  const deleteGoal = useCallback(async (goalId) => {
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'archived' })
      .eq('id', goalId);
    if (!error) setGoals((prev) => prev.filter((g) => g.id !== goalId));
    return { error };
  }, []);

  const completeGoal = useCallback(async (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: new Error('Goal not found') };
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'completed', completed_at: now })
      .eq('id', goalId);
    if (!error) {
      track(Events.GOAL_COMPLETED, { day_count: goal.day_count ?? 0, category: goal.tag });
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setCompletedGoals((prev) => [{ ...goal, status: 'completed', completed_at: now }, ...prev]);
    }
    return { error };
  }, [goals]);

  return { goals, completedGoals, loading, addGoal, checkIn, backdatedCheckIn, updateProgress, updateTier, deleteGoal, completeGoal, refetch: fetchGoals };
};
