import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from '../hooks/useNotifications.js';
import { getDisplayName } from '../utils/displayName.js';
import { track, Events } from '../lib/analytics.js';
import { awardXP, XP_VALUES } from '../lib/xp.js';
import { playSparkSound } from '../utils/sounds.js';
import { checkText } from '../utils/contentModeration.js';

export const ConnectionsContext = createContext(null);

export const ConnectionsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [browseProfiles, setBrowseProfiles] = useState([]);
  const [incomingSparks, setIncomingSparks] = useState([]);
  const [incomingConnects, setIncomingConnects] = useState([]);
  const [sentSparks, setSentSparks] = useState([]);
  const [sentConnects, setSentConnects] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: sentData }, { data: receivedData }, { data: acceptedData }] = await Promise.all([
      supabase
        .from('connections')
        .select('receiver_id, status, spark_message, profiles!connections_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .eq('requester_id', user.id)
        .neq('status', 'declined'),
      supabase
        .from('connections')
        .select('requester_id, status, spark_message, profiles!connections_requester_id_fkey(id, first_name, last_name, alter_ego_name, avatar_url)')
        .eq('receiver_id', user.id),
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, requester:profiles!connections_requester_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name), receiver:profiles!connections_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted'),
    ]);

    const sentAll = sentData ?? [];
    const sentIds = sentAll.map((r) => r.receiver_id);
    const receivedIds = (receivedData ?? []).map((r) => r.requester_id);
    const excludeIds = [user.id, ...sentIds, ...receivedIds];

    const pending = (receivedData ?? []).filter((r) => r.status === 'pending');
    setIncomingSparks(pending.filter((r) => r.spark_message));
    setIncomingConnects(pending.filter((r) => !r.spark_message));

    const sentPending = sentAll.filter((r) => r.status === 'pending');
    setSentSparks(sentPending.filter((r) => r.spark_message));
    setSentConnects(sentPending.filter((r) => !r.spark_message));

    setAcceptedConnections(
      (acceptedData ?? []).map((c) => ({
        ...c,
        partnerId: c.requester_id === user.id ? c.receiver_id : c.requester_id,
        partnerProfile: c.requester_id === user.id ? c.receiver : c.requester,
      }))
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, alter_ego_name, age, city, account_type, tagline, bio, avatar_url, looking_for, gender')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(50);

    const profileList = profiles ?? [];
    let goalsMap = {};

    // Fetch their goals + current user's profile/goals in parallel
    const [goalsResult, myProfResult, myGoalsResult] = await Promise.all([
      profileList.length > 0
        ? supabase.from('goals').select('user_id, title, tier').in('user_id', profileList.map((p) => p.id)).eq('is_active', true)
        : Promise.resolve({ data: [] }),
      supabase.from('profiles').select('looking_for, city').eq('id', user.id).single(),
      supabase.from('goals').select('title').eq('user_id', user.id).eq('is_active', true),
    ]);

    for (const g of goalsResult.data ?? []) {
      if (!goalsMap[g.user_id]) goalsMap[g.user_id] = [];
      goalsMap[g.user_id].push({ title: g.title, tier: g.tier });
    }

    const myLf = myProfResult.data?.looking_for ?? [];
    const myCity = (myProfResult.data?.city ?? '').toLowerCase().trim();
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
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendSpark = useCallback(async (receiverId, sparkMessage = null) => {
    if (sparkMessage) {
      const messageCheck = checkText(sparkMessage);
      if (!messageCheck.ok) return { error: null, moderation: messageCheck };
    }
    const row = { requester_id: user.id, receiver_id: receiverId, status: 'pending' };
    if (sparkMessage) row.spark_message = sparkMessage;
    const { error } = await supabase.from('connections').insert(row);
    if (!error) {
      track(Events.SPARK_SENT, { has_message: !!sparkMessage });
      awardXP(user.id, XP_VALUES.SPARK_SENT);
      playSparkSound();
      setBrowseProfiles((prev) => prev.filter((p) => p.id !== receiverId));
      const { data: sender } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      const name = getDisplayName(sender, 'Someone');
      const notifBody = sparkMessage
        ? `${name} sparked you ⚡ "${sparkMessage.slice(0, 60)}${sparkMessage.length > 60 ? '…' : ''}"`
        : `${name} wants to connect with you`;
      createNotification({ userId: receiverId, actorId: user.id, type: 'connection_request', body: notifBody });
    }
    return { error };
  }, [user]);

  const acceptSpark = useCallback(async (requesterId) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (!error) {
      track(Events.SPARK_ACCEPTED);
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      setIncomingConnects((prev) => prev.filter((s) => s.requester_id !== requesterId));
      const { data: accepter } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      const name = getDisplayName(accepter, 'Someone');
      createNotification({ userId: requesterId, actorId: user.id, type: 'connection_accepted', body: `${name} accepted your spark ⚡ You're now connected!` });
      fetchData();
    }
    return { error };
  }, [user, fetchData]);

  const declineSpark = useCallback(async (requesterId) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (!error) {
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      setIncomingConnects((prev) => prev.filter((s) => s.requester_id !== requesterId));
    }
    return { error };
  }, [user]);

  const cancelRequest = useCallback(async (receiverId) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('requester_id', user.id)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending');
    if (!error) {
      setSentSparks((prev) => prev.filter((s) => s.receiver_id !== receiverId));
      setSentConnects((prev) => prev.filter((s) => s.receiver_id !== receiverId));
    }
    return { error };
  }, [user]);

  const skipProfile = useCallback((profileId) => {
    setBrowseProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }, []);

  return (
    <ConnectionsContext.Provider value={{
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
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
};
