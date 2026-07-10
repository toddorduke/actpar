import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { playDingSound } from '../utils/sounds.js';
import { checkText } from '../utils/contentModeration.js';
import { track, Events } from '../lib/analytics.js';
import { createNotification } from './useNotifications.js';
import { getDisplayName } from '../utils/displayName.js';

export const useDirectMessages = (otherUserId) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [otherProfile, setOtherProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !otherUserId) return;
    setLoading(true);

    const [{ data: msgs }, { data: profile }] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('*, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, alter_ego_name, tagline')
        .eq('id', otherUserId)
        .single(),
    ]);

    setMessages(msgs ?? []);
    setOtherProfile(profile ?? null);

    // Mark unread received messages as read
    const unread = (msgs ?? []).filter((m) => m.receiver_id === user.id && !m.read_at);
    if (unread.length > 0) {
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .is('read_at', null);
    }

    setLoading(false);
  }, [user, otherUserId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Real-time subscription for incoming messages
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`dm_${[user.id, otherUserId].sort().join('_')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.new.sender_id !== otherUserId) return;
        const { data } = await supabase
          .from('direct_messages')
          .select('*, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        if (data) {
          setMessages((prev) => [...prev, data]);
          playDingSound();
          // Mark as read immediately since thread is open
          await supabase
            .from('direct_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', data.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !user || !otherUserId) return { error: new Error('Missing data') };
    const modResult = checkText(content);
    if (!modResult.ok) return { error: null, moderation: modResult };
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: user.id, receiver_id: otherUserId, content: content.trim() })
      .select('*, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url)')
      .single();
    if (!error && data) {
      track(Events.MESSAGE_SENT);
      setMessages((prev) => [...prev, data]);
      const myName = getDisplayName(user?.user_metadata, 'Someone');
      createNotification({
        userId: otherUserId,
        actorId: user.id,
        type: 'new_message',
        body: `${myName} sent you a message`,
      });
    }
    return { error };
  }, [user, otherUserId]);

  return { messages, otherProfile, loading, sendMessage, refetch: fetchMessages };
};
