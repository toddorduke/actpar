import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';
import { awardXP, XP_VALUES } from '../lib/xp.js';
import { track, Events } from '../lib/analytics.js';

export function usePartnerships() {
  const { user } = useContext(AuthContext);
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPartnerships = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('partnerships')
      .select(`
        *,
        requester:profiles!partnerships_requester_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name),
        receiver:profiles!partnerships_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name),
        goal1:goals!partnerships_goal_id_1_fkey(id, title, day_count, last_checked_in),
        goal2:goals!partnerships_goal_id_2_fkey(id, title, day_count, last_checked_in)
      `)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .neq('status', 'ended')
      .order('created_at', { ascending: false });
    setPartnerships(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPartnerships(); }, [fetchPartnerships]);

  // Helper: for a given partnership, return the partner's profile and goal from the current user's perspective
  function partnerSide(p) {
    const iAmRequester = p.requester_id === user?.id;
    return {
      partnerProfile: iAmRequester ? p.receiver : p.requester,
      partnerId: iAmRequester ? p.receiver_id : p.requester_id,
      myGoal: iAmRequester ? p.goal1 : p.goal2,
      partnerGoal: iAmRequester ? p.goal2 : p.goal1,
      myGoalId: iAmRequester ? p.goal_id_1 : p.goal_id_2,
      iAmRequester,
    };
  }

  const proposeJourney = useCallback(async (receiverId, goalId, deadlineUtcHour = null, deadlineDisplay = null) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('partnerships')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        goal_id_1: goalId || null,
        status: 'pending',
        deadline_utc_hour: deadlineUtcHour,
        deadline_display: deadlineDisplay,
      })
      .select()
      .single();
    if (!error && data) {
      awardXP(user.id, XP_VALUES.JOURNEY_STARTED);
      track(Events.JOURNEY_PROPOSED, { has_goal: !!goalId });
      setPartnerships((prev) => [data, ...prev]);
      const goalTitle = goalId
        ? (await supabase.from('goals').select('title').eq('id', goalId).single()).data?.title
        : null;
      createNotification({
        userId: receiverId,
        actorId: user.id,
        type: 'journey_invite',
        refId: data.id,
        body: `wants to start an accountability journey with you${goalTitle ? ` on "${goalTitle}"` : ''} 🚀`,
      });
    }
    return { data, error };
  }, [user]);

  const acceptJourney = useCallback(async (partnershipId, goalId) => {
    if (!user) return { error: 'Not authenticated' };
    const now = new Date().toISOString();
    const partnership = partnerships.find((p) => p.id === partnershipId);
    const { error } = await supabase
      .from('partnerships')
      .update({ goal_id_2: goalId || null, status: 'active', started_at: now })
      .eq('id', partnershipId);
    if (!error) {
      track(Events.JOURNEY_ACCEPTED);
      await fetchPartnerships();
      if (partnership?.requester_id) {
        createNotification({
          userId: partnership.requester_id,
          actorId: user.id,
          type: 'journey_accepted',
          refId: partnershipId,
          body: `accepted your accountability journey — you're in it together now! 🚀`,
        });
      }
    }
    return { error };
  }, [user, partnerships, fetchPartnerships]);

  const declineJourney = useCallback(async (partnershipId) => {
    const { error } = await supabase.from('partnerships').delete().eq('id', partnershipId);
    if (!error) setPartnerships((prev) => prev.filter((p) => p.id !== partnershipId));
    return { error };
  }, []);

  const linkGoal = useCallback(async (partnershipId, goalId) => {
    if (!user) return { error: 'Not authenticated' };
    const partnership = partnerships.find((p) => p.id === partnershipId);
    if (!partnership) return { error: 'Partnership not found' };
    const iAmRequester = partnership.requester_id === user.id;
    const field = iAmRequester ? 'goal_id_1' : 'goal_id_2';
    const { error } = await supabase.from('partnerships').update({ [field]: goalId }).eq('id', partnershipId);
    if (!error) { track(Events.JOURNEY_GOAL_LINKED); await fetchPartnerships(); }
    return { error };
  }, [user, partnerships, fetchPartnerships]);

  const endJourney = useCallback(async (partnershipId) => {
    const { error } = await supabase.from('partnerships').update({ status: 'ended' }).eq('id', partnershipId);
    if (!error) setPartnerships((prev) => prev.filter((p) => p.id !== partnershipId));
    return { error };
  }, []);

  return { partnerships, loading, partnerSide, proposeJourney, acceptJourney, declineJourney, endJourney, linkGoal, refetch: fetchPartnerships };
}
