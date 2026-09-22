import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { checkText } from '../lib/contentModeration.js';

// For 'multi'-type goals (see supabase/migrations/20260922165325_add_multi_metric_
// goal_type.sql for why: HYROX stations, a lifting program's separate lifts,
// anything where one goal needs several independently-tracked components
// instead of the one-number-one-unit shape 'numeric' goals have).
//
// metrics: [{ id, name, value_type, unit, target_value, position, logs: [...] }]
// each metric's logs are its most recent entries (newest first), each
// { id, value, note, logged_at }.
export function useGoalMetrics(userId, goalId) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!userId || !goalId) { setMetrics([]); setLoading(false); return; }
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data: metricRows } = await supabase
      .from('goal_metrics_v2')
      .select('*')
      .eq('goal_id', goalId)
      .order('position', { ascending: true });

    const metricIds = (metricRows ?? []).map((m) => m.id);
    let logsByMetric = {};
    if (metricIds.length > 0) {
      const { data: logRows } = await supabase
        .from('goal_metric_logs_v2')
        .select('*')
        .in('metric_id', metricIds)
        .order('logged_at', { ascending: false });
      logsByMetric = (logRows ?? []).reduce((acc, row) => {
        (acc[row.metric_id] ??= []).push(row);
        return acc;
      }, {});
    }

    setMetrics((metricRows ?? []).map((m) => ({ ...m, logs: logsByMetric[m.id] ?? [] })));
    setLoading(false);
  }, [userId, goalId]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // name, valueType ('time'|'number'), unit (ignored for 'time'), targetValue (optional)
  const addMetric = useCallback(async (name, valueType, unit, targetValue) => {
    if (!userId || !goalId) return { error: new Error('Not authenticated') };
    const nameCheck = checkText(name);
    if (!nameCheck.ok) return { data: null, error: null, moderation: nameCheck };
    const position = metrics.length;
    const { data, error } = await getSupabaseClient()
      .from('goal_metrics_v2')
      .insert({
        goal_id: goalId,
        user_id: userId,
        name: name.trim(),
        value_type: valueType,
        unit: valueType === 'time' ? null : (unit || null),
        target_value: targetValue ?? null,
        position,
      })
      .select()
      .single();
    if (!error && data) setMetrics((prev) => [...prev, { ...data, logs: [] }]);
    return { data, error };
  }, [userId, goalId, metrics.length]);

  const deleteMetric = useCallback(async (metricId) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { error } = await getSupabaseClient().from('goal_metrics_v2').delete().eq('id', metricId);
    if (!error) setMetrics((prev) => prev.filter((m) => m.id !== metricId));
    return { error };
  }, [userId]);

  // value is always numeric: seconds for 'time' metrics, the raw number
  // for 'number' ones. Callers doing mm:ss input convert before calling.
  const logValue = useCallback(async (metricId, value, note = '') => {
    if (!userId || !goalId) return { error: new Error('Not authenticated') };
    if (note.trim()) {
      const noteCheck = checkText(note);
      if (!noteCheck.ok) return { data: null, error: null, moderation: noteCheck };
    }
    const { data, error } = await getSupabaseClient()
      .from('goal_metric_logs_v2')
      .insert({ metric_id: metricId, goal_id: goalId, user_id: userId, value, note: note.trim() || null })
      .select()
      .single();
    if (!error && data) {
      setMetrics((prev) => prev.map((m) => (m.id === metricId ? { ...m, logs: [data, ...m.logs] } : m)));
    }
    return { data, error };
  }, [userId, goalId]);

  // Log several metrics from one session in a single round trip -- the
  // point of this hook existing at all is letting someone enter an entire
  // HYROX session's worth of station times in one screen instead of 8
  // separate taps. entries: [{ metricId, value }] -- skips any with no
  // value (a session doesn't have to cover every metric).
  const logSession = useCallback(async (entries, note = '') => {
    if (!userId || !goalId) return { error: new Error('Not authenticated') };
    const toLog = entries.filter((e) => e.value !== null && e.value !== undefined && e.value !== '');
    if (toLog.length === 0) return { error: null, data: [] };
    if (note.trim()) {
      const noteCheck = checkText(note);
      if (!noteCheck.ok) return { data: null, error: null, moderation: noteCheck };
    }
    const loggedAt = new Date().toISOString();
    const { data, error } = await getSupabaseClient()
      .from('goal_metric_logs_v2')
      .insert(toLog.map((e) => ({
        metric_id: e.metricId,
        goal_id: goalId,
        user_id: userId,
        value: e.value,
        note: note.trim() || null,
        logged_at: loggedAt,
      })))
      .select();
    if (!error && data) {
      setMetrics((prev) => prev.map((m) => {
        const newLogs = data.filter((d) => d.metric_id === m.id);
        return newLogs.length ? { ...m, logs: [...newLogs, ...m.logs] } : m;
      }));
    }
    return { data, error };
  }, [userId, goalId]);

  return { metrics, loading, addMetric, deleteMetric, logValue, logSession, refetch: fetchMetrics };
}
