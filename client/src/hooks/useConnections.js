import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

export const useConnections = () => {
  const { user } = useContext(AuthContext);
  const [browseProfiles, setBrowseProfiles] = useState([]);
  const [incomingSparks, setIncomingSparks] = useState([]);     // pending received WITH message
  const [incomingConnects, setIncomingConnects] = useState([]); // pending received WITHOUT message
  const [sentSparks, setSentSparks] = useState([]);             // pending sent WITH message
  const [sentConnects, setSentConnects] = useState([]);         // pending sent WITHOUT message
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

    // Normalise accepted: always expose partner profile regardless of which side user is on
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
    if (profileList.length > 0) {
      const profileIds = profileList.map((p) => p.id);
      const { data: goalsData } = await supabase
        .from('goals')
        .select('user_id, title, tier')
        .in('user_id', profileIds)
        .eq('is_active', true);
      for (const g of goalsData ?? []) {
        if (!goalsMap[g.user_id]) goalsMap[g.user_id] = [];
        goalsMap[g.user_id].push({ title: g.title, tier: g.tier });
      }
    }

    setBrowseProfiles(profileList.map((p) => ({ ...p, goals: goalsMap[p.id] ?? [] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendSpark = useCallback(async (receiverId, sparkMessage = null) => {
    const row = { requester_id: user.id, receiver_id: receiverId, status: 'pending' };
    if (sparkMessage) row.spark_message = sparkMessage;
    const { error } = await supabase.from('connections').insert(row);
    if (!error) {
      setBrowseProfiles((prev) => prev.filter((p) => p.id !== receiverId));
      const { data: sender } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      const name = sender ? `${sender.first_name ?? ''} ${sender.last_name ?? ''}`.trim() : 'Someone';
      const notifBody = sparkMessage
        ? `${name} sparked you ⚡ "${sparkMessage.slice(0, 60)}${sparkMessage.length > 60 ? '…' : ''}"`
        : `${name} wants to connect with you`;
      createNotification({
        userId: receiverId,
        actorId: user.id,
        type: 'connection_request',
        body: notifBody,
      });
    }
    return { error };
  }, [user]);

  const acceptSpark = useCallback(async (requesterId) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', user.id);
    if (!error) {
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      const { data: accepter } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      const name = accepter ? `${accepter.first_name ?? ''} ${accepter.last_name ?? ''}`.trim() : 'Someone';
      createNotification({
        userId: requesterId,
        actorId: user.id,
        type: 'connection_accepted',
        body: `${name} accepted your spark ⚡ You're now connected!`,
      });
      // Refresh to get the newly accepted connection into acceptedConnections
      fetchData();
    }
    return { error };
  }, [user, fetchData]);

  const declineSpark = useCallback(async (requesterId) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', user.id);
    if (!error) {
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
      setIncomingConnects((prev) => prev.filter((s) => s.requester_id !== requesterId));
    }
    return { error };
  }, [user]);

  const skipProfile = useCallback((profileId) => {
    setBrowseProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }, []);

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
};
