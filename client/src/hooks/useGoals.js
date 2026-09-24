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

// Auto-posts a milestone to the community Feed -- but only if the user has
// opted in (Settings > Notifications > "Share Milestones to Feed",
// profiles.notification_prefs.auto_share_milestones). Off by default: this
// posts on the user's behalf, so it needs an explicit yes, not an assumed
// one. See the Feed-liveliness work this pairs with (inspiration cards +
// this) for the full context.
function maybeShareMilestonePost(userId, content, milestone) {
  supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', userId)
    .single()
    .then(({ data: p }) => {
      if (!p?.notification_prefs?.auto_share_milestones) return;
      supabase.from('tribe_posts').insert({ user_id: userId, content, post_type: 'achievement', milestone });
    });
}

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
    const { goal_type = 'habit', target_value, target_unit, target_period, tier, reminder_utc_hour, description, metrics } = options;
    if (description) {
      const whyCheck = checkText(description);
      if (!whyCheck.ok) return { data: null, error: null, moderation: whyCheck };
    }
    // 'multi' goals are a lightweight container -- frequency/target_*
    // all stay null, same as 'numeric', since the actual targets live
    // per-metric on goal_metrics_v2 instead. See addGoal's `metrics`
    // option below.
    if (goal_type === 'multi' && metrics?.length) {
      for (const m of metrics) {
        const metricNameCheck = checkText(m.name);
        if (!metricNameCheck.ok) return { data: null, error: null, moderation: metricNameCheck };
      }
    }
    const { data, error } = await supabase
      .from('goals_v2')
      .insert({
        user_id: user.id,
        title,
        tag: category ?? 'custom',
        goal_type,
        frequency: (goal_type === 'numeric' || goal_type === 'multi') ? null : 'daily',
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
    if (goal_type === 'multi' && metrics?.length) {
      const { error: metricsError } = await supabase.from('goal_metrics_v2').insert(
        metrics.map((m, i) => ({
          goal_id: data.id,
          user_id: user.id,
          name: m.name.trim(),
          value_type: m.valueType,
          unit: m.valueType === 'time' ? null : (m.unit || null),
          target_value: m.targetValue ?? null,
          position: i,
        }))
      );
      // The goal itself was created fine even if a metric row failed --
      // don't roll that back, just surface it so the UI can say so.
      if (metricsError) return { data, error: null, metricsError };
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
        maybeShareMilestonePost(user.id, `🔥 Hit a ${newCount}-day streak on "${goal.title}"!`, `${newCount}-day streak`);
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
      const dayNote = goal.day_count ? ` ${goal.day_count} days of showing up.` : '';
      maybeShareMilestonePost(user.id, `🎉 Completed "${goal.title}"!${dayNote}`, 'Goal completed');
    }
    return { error };
  }, [goals, user]);

  return { goals, completedGoals, loading, addGoal, checkIn, backdatedCheckIn, updateProgress, updateTier, deleteGoal, completeGoal, refetch: fetchGoals };
};
