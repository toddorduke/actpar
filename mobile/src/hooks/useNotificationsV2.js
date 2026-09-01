import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Mirrors client/src/hooks/useNotifications.js. onConnectionAccepted lets
// the caller trigger the match-moment modal the instant one arrives while
// the app is open (the push notification covers the case where it isn't).
export function useNotificationsV2(userId, onConnectionAccepted) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let channel = null;

    async function setup() {
      // Realtime needs the current session's access token explicitly set
      // before subscribing -- without this, the channel subscribes fine at
      // the protocol level but RLS-authorized row delivery never arrives.
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult?.data?.session?.access_token;
      if (accessToken) {
        supabase.realtime.setAuth(accessToken);
      }
      if (cancelled) return;

      const onInsert = async (payload) => {
        const { data } = await supabase
          .from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
          .eq('id', payload.new.id)
          .single();
        if (data) {
          setNotifications((prev) => [data, ...prev]);
          if (data.type === 'connection_accepted' && onConnectionAccepted) {
            onConnectionAccepted(data);
          }
        }
      };

      channel = supabase.channel(`notif_v2_${userId}_${instanceId}`);
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        onInsert
      );
      channel.subscribe();
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, onConnectionAccepted]);

  const markRead = useCallback(async (notifId) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    if (!error) setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    return { error };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markRead, refetch: fetchNotifications };
}
