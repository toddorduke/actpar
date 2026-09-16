import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { createNotification } from './useNotifications.js';
import { getDisplayName } from '../lib/displayName.js';
import { awardXP, XP_VALUES } from '../lib/xp.js';
import { checkText } from '../lib/contentModeration.js';

// onSparkSent: optional (hasMessage: boolean) => void -- web wires this to
// its posthog track() + a Web Audio spark sound; mobile can omit it (or
// wire its own haptic/sound later). Kept out of this package so shared
// code doesn't depend on browser-only APIs.
export function useConnections(userId, { onSparkSent, onSparkAccepted } = {}) {
  const [browseProfiles, setBrowseProfiles] = useState([]);
  const [incomingSparks, setIncomingSparks] = useState([]);
  const [incomingConnects, setIncomingConnects] = useState([]);
  const [sentSparks, setSentSparks] = useState([]);
  const [sentConnects, setSentConnects] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const supabase = getSupabaseClient();

    const [{ data: sentData }, { data: receivedData }, { data: acceptedData }] = await Promise.all([
      supabase
        .from('connections')
        .select('receiver_id, status, spark_message, profiles!connections_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .eq('requester_id', userId)
        .neq('status', 'declined'),
      supabase
        .from('connections')
        .select('requester_id, status, spark_message, profiles!connections_requester_id_fkey(id, first_name, last_name, alter_ego_name, avatar_url)')
        .eq('receiver_id', userId),
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, requester:profiles!connections_requester_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name), receiver:profiles!connections_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted'),
    ]);

    const sentAll = sentData ?? [];
    const sentIds = sentAll.map((r) => r.receiver_id);
    const receivedIds = (receivedData ?? []).map((r) => r.requester_id);
    const excludeIds = [userId, ...sentIds, ...receivedIds];

    const pending = (receivedData ?? []).filter((r) => r.status === 'pending');
    setIncomingSparks(pending.filter((r) => r.spark_message));
    setIncomingConnects(pending.filter((r) => !r.spark_message));

    const sentPending = sentAll.filter((r) => r.status === 'pending');
    setSentSparks(sentPending.filter((r) => r.spark_message));
    setSentConnects(sentPending.filter((r) => !r.spark_message));

    setAcceptedConnections(
      (acceptedData ?? []).map((c) => ({
        ...c,
        partnerId: c.requester_id === userId ? c.receiver_id : c.requester_id,
        partnerProfile: c.requester_id === userId ? c.receiver : c.requester,
      }))
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, alter_ego_name, age, city, account_type, tagline, bio, avatar_url, looking_for, gender, accountability_style, checkin_frequency')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(50);

    const profileList = profiles ?? [];
    let goalsMap = {};

    // Fetch their goals + current user's profile/goals in parallel
    const [goalsResult, myProfResult, myGoalsResult] = await Promise.all([
      profileList.length > 0
        ? supabase.from('goals_v2').select('user_id, title, tier').in('user_id', profileList.map((p) => p.id)).eq('status', 'active')
        : Promise.resolve({ data: [] }),
      supabase.from('profiles').select('looking_for, city, accountability_style, checkin_frequency').eq('id', userId).single(),
      supabase.from('goals_v2').select('title').eq('user_id', userId).eq('status', 'active'),
    ]);

    for (const g of goalsResult.data ?? []) {
      if (!goalsMap[g.user_id]) goalsMap[g.user_id] = [];
      goalsMap[g.user_id].push({ title: g.title, tier: g.tier });
    }

    const myLf = myProfResult.data?.looking_for ?? [];
    const myCity = (myProfResult.data?.city ?? '').toLowerCase().trim();
    const myStyle = myProfResult.data?.accountability_style ?? '';
    const myFreq = myProfResult.data?.checkin_frequency ?? '';
    const myGoalWords = new Set(
      (myGoalsResult.data ?? [])
        .flatMap((g) => g.title.toLowerCase().split(/\W+/))
        .filter((w) => w.length > 3)
    );

    function calcScore(p, pGoals) {
      let score = 0;
      const sharedLf = (p.looking_for ?? []).filter((t) =>
        myLf.some((m) => m.toLowerCase() === t.toLowerCase())
      );
      score += sharedLf.length * 3;
      if (myCity && (p.city ?? '').toLowerCase().trim() === myCity) score += 2;
      if (myStyle && p.accountability_style === myStyle) score += 2;
      if (myFreq && p.checkin_frequency === myFreq) score += 2;
      const theirWords = pGoals.flatMap((g) => g.title.toLowerCase().split(/\W+/)).filter((w) => w.length > 3);
      if (theirWords.some((w) => myGoalWords.has(w))) score += 1;
      return score;
    }

    function calcReason(p, pGoals) {
      const sharedLf = (p.looking_for ?? []).filter((t) =>
        myLf.some((m) => m.toLowerCase() === t.toLowerCase())
      );
      if (sharedLf.length === 1) return `Both looking for ${sharedLf[0]} support`;
      if (sharedLf.length > 1) return `Share ${sharedLf.length} interests: ${sharedLf.slice(0, 2).join(', ')}`;
      if (myStyle && p.accountability_style === myStyle && myFreq && p.checkin_frequency === myFreq) return 'Same accountability style and check-in rhythm';
      if (myStyle && p.accountability_style === myStyle) return 'Same accountability style';
      if (myFreq && p.checkin_frequency === myFreq) return 'Same check-in rhythm';
      if (myCity && (p.city ?? '').toLowerCase().trim() === myCity) return `Local to you in ${p.city}`;
      const theirWords = pGoals.flatMap((g) => g.title.toLowerCase().split(/\W+/)).filter((w) => w.length > 3);
      if (theirWords.some((w) => myGoalWords.has(w))) return 'Working on similar goals';
      return null;
    }

    const scored = profileList
      .map((p) => {
        const pGoals = goalsMap[p.id] ?? [];
        return { ...p, goals: pGoals, matchScore: calcScore(p, pGoals), matchReason: calcReason(p, pGoals) };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    setBrowseProfiles(scored);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendSpark = useCallback(async (receiverId, sparkMessage = null) => {
    if (!userId) return { error: new Error('Not authenticated') };
    if (sparkMessage) {
      const messageCheck = checkText(sparkMessage);
      if (!messageCheck.ok) return { error: null, moderation: messageCheck };
    }
    const supabase = getSupabaseClient();
    const row = { requester_id: userId, receiver_id: receiverId, status: 'pending' };
    if (sparkMessage) row.spark_message = sparkMessage;
    const { error } = await supabase.from('connections').insert(row);
    if (!error) {
      onSparkSent?.(!!sparkMessage);
      awardXP(userId, XP_VALUES.SPARK_SENT);
      setBrowseProfiles((prev) => prev.filter((p) => p.id !== receiverId));
      const { data: sender } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
      const name = getDisplayName(sender, 'Someone');
      const notifBody = sparkMessage
        ? `${name} sparked you ⚡ "${sparkMessage.slice(0, 60)}${sparkMessage.length > 60 ? '…' : ''}"`
        : `${name} wants to connect with you`;
      createNotification({ userId: receiverId, actorId: userId, type: 'connection_request', body: notifBody });
    }
    return { error };
  }, [userId, onSparkSent]);

  const acceptSpark = useCallback(async (requesterId) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    if (!error) {
      onSparkAccepted?.();
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      setIncomingConnects((prev) => prev.filter((s) => s.requester_id !== requesterId));
      const { data: accepter } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
      const name = getDisplayName(accepter, 'Someone');
      createNotification({ userId: requesterId, actorId: userId, type: 'connection_accepted', body: `${name} accepted your spark ⚡ You're now connected!` });
      fetchData();
    }
    return { error };
  }, [userId, fetchData, onSparkAccepted]);

  const declineSpark = useCallback(async (requesterId) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { error } = await getSupabaseClient()
      .from('connections')
      .update({ status: 'declined' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    if (!error) {
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      setIncomingConnects((prev) => prev.filter((s) => s.requester_id !== requesterId));
    }
    return { error };
  }, [userId]);

  const cancelRequest = useCallback(async (receiverId) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { error } = await getSupabaseClient()
      .from('connections')
      .delete()
      .eq('requester_id', userId)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending');
    if (!error) {
      setSentSparks((prev) => prev.filter((s) => s.receiver_id !== receiverId));
      setSentConnects((prev) => prev.filter((s) => s.receiver_id !== receiverId));
    }
    return { error };
  }, [userId]);

  const skipProfile = useCallback((profileId) => {
    setBrowseProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }, []);

  return {
    browseProfiles,
    incomingSparks,
    incomingConnects,
    sentSparks,
    sentConnects,
    acceptedConnections,
    loading,
    sendSpark,
    acceptSpark,
    declineSpark,
    cancelRequest,
    skipProfile,
    refetch: fetchData,
  };
}
