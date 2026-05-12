import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

export const useConnections = () => {
  const { user } = useContext(AuthContext);
  const [browseProfiles, setBrowseProfiles] = useState([]);
  const [incomingSparks, setIncomingSparks] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: sentData } = await supabase
      .from('connections')
      .select('receiver_id')
      .eq('requester_id', user.id);

    const { data: receivedData } = await supabase
      .from('connections')
      .select('requester_id, status, profiles(id, first_name, last_name, alter_ego_name)')
      .eq('receiver_id', user.id);

    const { data: acceptedData } = await supabase
      .from('connections')
      .select('id, requester_id, receiver_id, profiles!connections_receiver_id_fkey(first_name, last_name)')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const sentIds = (sentData ?? []).map((r) => r.receiver_id);
    const receivedIds = (receivedData ?? []).map((r) => r.requester_id);
    const excludeIds = [user.id, ...sentIds, ...receivedIds];

    const pending = (receivedData ?? []).filter((r) => r.status === 'pending');
    setIncomingSparks(pending);
    setAcceptedConnections(acceptedData ?? []);

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

  const sendSpark = useCallback(async (receiverId) => {
    const { error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' });
    if (!error) {
      setBrowseProfiles((prev) => prev.filter((p) => p.id !== receiverId));
      // Get sender name for the notification body
      const { data: sender } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      const name = sender ? `${sender.first_name ?? ''} ${sender.last_name ?? ''}`.trim() : 'Someone';
      createNotification({
        userId: receiverId,
        actorId: user.id,
        type: 'connection_request',
        body: `${name} sent you a spark ⚡`,
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
    }
    return { error };
  }, [user]);

  const declineSpark = useCallback(async (requesterId) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('requester_id', requesterId)
      .eq('receiver_id', user.id);
    if (!error) {
      setIncomingSparks((prev) => prev.filter((s) => s.requester_id !== requesterId));
    }
    return { error };
  }, [user]);

  const skipProfile = useCallback((profileId) => {
    setBrowseProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }, []);

  return {
    browseProfiles,
    incomingSparks,
    acceptedConnections,
    loading,
    sendSpark,
    acceptSpark,
    declineSpark,
    skipProfile,
    refetch: fetchData,
  };
};
