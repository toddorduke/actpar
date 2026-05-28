import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { playSparkSound, playDingSound } from '../utils/sounds.js';

export const useNotifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Real-time: push new notifications instantly
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
          .eq('id', payload.new.id)
          .single();
        if (data) {
          setNotifications((prev) => [data, ...prev]);
          if (data.type === 'connection_request') playSparkSound();
          else playDingSound();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markRead = useCallback(async (notifId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    if (!error) setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    return { error };
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (!error) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    return { error };
  }, [user]);

  const deleteNotif = useCallback(async (notifId) => {
    await supabase.from('notifications').delete().eq('id', notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead, deleteNotif, refetch: fetchNotifications };
};

// Helper — call this anywhere to create a notification.
// actorId = null means a system/milestone notification (always fires, even for self).
// actorId = a real user id blocks self-notifications (don't notify yourself for social actions).
export async function createNotification({ userId, actorId, type, refId, body }) {
  if (!userId) return;
  if (actorId && userId === actorId) return; // block social self-notifications only
  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    ref_id: refId ?? null,
    body,
  });
}
