import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useGoalsV2(userId) {
  const [goals, setGoals] = useState([]);
  const [checkinsByGoal, setCheckinsByGoal] = useState({});
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeCap = isPremium ? 4 : 2;

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: profile }, { data: goalRows }] = await Promise.all([
      supabase.from('profiles').select('is_premium').eq('id', userId).single(),
      supabase.from('goals_v2').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setIsPremium(!!profile?.is_premium);
    setGoals(goalRows ?? []);

    const goalIds = (goalRows ?? []).map((g) => g.id);
    if (goalIds.length > 0) {
      const { data: checkins } = await supabase
        .from('goal_checkins_v2')
        .select('goal_id, date, done')
        .in('goal_id', goalIds);
      const byGoal = {};
      (checkins ?? []).forEach((c) => {
        if (!byGoal[c.goal_id]) byGoal[c.goal_id] = [];
        byGoal[c.goal_id].push(c);
      });
      setCheckinsByGoal(byGoal);
    } else {
      setCheckinsByGoal({});
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const pausedGoals = goals.filter((g) => g.status === 'paused');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const archivedGoals = goals.filter((g) => g.status === 'archived');
  const atCap = activeGoals.length >= activeCap;

  async function createGoal({ title, tag, frequency, durationDays }) {
    const endsAt = durationDays
      ? new Date(Date.now() + durationDays * 86400000).toISOString()
      : null;
    const { data, error } = await supabase
      .from('goals_v2')
      .insert({
        user_id: userId,
        title,
        tag,
        frequency,
        duration_days: durationDays,
        ends_at: endsAt,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('ACTIVE_GOAL_CAP_REACHED')) {
        return { data: null, error: { code: 'CAP_REACHED' } };
      }
      return { data: null, error };
    }
    await fetchAll();
    return { data, error: null };
  }

  async function checkIn(goalId) {
    const { error } = await supabase
      .from('goal_checkins_v2')
      .upsert({ goal_id: goalId, user_id: userId, date: todayStr(), done: true }, { onConflict: 'goal_id,date' });
    if (!error) await fetchAll();
    return { error };
  }

  async function pauseGoal(goalId) {
    const goal = goals.find((g) => g.id === goalId);
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error && goal) {
      await supabase.from('goal_lifecycle_events').insert({
        goal_id: goalId, user_id: userId, tag: goal.tag, duration_days: goal.duration_days, event: 'paused',
      });
      await fetchAll();
    }
    return { error };
  }

  async function resumeGoal(goalId) {
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'active', paused_at: null })
      .eq('id', goalId);
    if (error?.message?.includes('ACTIVE_GOAL_CAP_REACHED')) {
      return { error: { code: 'CAP_REACHED' } };
    }
    if (!error) await fetchAll();
    return { error };
  }

  async function completeGoal(goalId) {
    const goal = goals.find((g) => g.id === goalId);
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', goalId);
    if (!error && goal) {
      await supabase.from('goal_lifecycle_events').insert({
        goal_id: goalId, user_id: userId, tag: goal.tag, duration_days: goal.duration_days, event: 'completed',
      });
      await fetchAll();
    }
    return { error };
  }

  async function archiveGoal(goalId) {
    const goal = goals.find((g) => g.id === goalId);
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'archived' })
      .eq('id', goalId);
    if (!error && goal) {
      await supabase.from('goal_lifecycle_events').insert({
        goal_id: goalId, user_id: userId, tag: goal.tag, duration_days: goal.duration_days, event: 'archived',
      });
      await fetchAll();
    }
    return { error };
  }

  // Extend a completed/ongoing goal by extraDays, or "restart" after too
  // many missed check-ins (spec section 4) with a fresh 30-day window.
  async function extendGoal(goalId, extraDays) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: { message: 'Goal not found' } };
    const base = goal.ends_at ? new Date(goal.ends_at) : new Date();
    const newEndsAt = new Date(base.getTime() + extraDays * 86400000).toISOString();
    const { error } = await supabase
      .from('goals_v2')
      .update({ status: 'active', ends_at: newEndsAt, completed_at: null })
      .eq('id', goalId);
    if (!error) await fetchAll();
    return { error };
  }

  // Edit title/tag/frequency/duration. Increments change_count and logs
  // an edit event so the UI can decide whether to show the "switched a
  // few times" nudge (3rd change within 30 days).
  async function editGoal(goalId, updates) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { error: { message: 'Goal not found' }, recentEditCount: 0 };

    const { error } = await supabase
      .from('goals_v2')
      .update({ ...updates, change_count: (goal.change_count ?? 0) + 1 })
      .eq('id', goalId);
    if (error) return { error, recentEditCount: 0 };

    await supabase.from('goal_edits_v2').insert({ goal_id: goalId, user_id: userId });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await supabase
      .from('goal_edits_v2')
      .select('id', { count: 'exact', head: true })
      .eq('goal_id', goalId)
      .gte('created_at', thirtyDaysAgo);

    await fetchAll();
    return { error: null, recentEditCount: count ?? 0 };
  }

  return {
    goals, activeGoals, pausedGoals, completedGoals, archivedGoals,
    checkinsByGoal, loading, isPremium, activeCap, atCap,
    createGoal, checkIn, pauseGoal, resumeGoal, completeGoal, archiveGoal, extendGoal, editGoal,
    refetch: fetchAll,
  };
}
