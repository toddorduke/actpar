import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const useConversations = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('id, content, created_at, read_at, receiver_id, receiver:profiles!direct_messages_receiver_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300),
      supabase
        .from('direct_messages')
        .select('id, content, created_at, read_at, sender_id, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300),
    ]);

    // Count unread per sender
    const unreadCounts = {};
    for (const msg of received ?? []) {
      if (!msg.read_at) {
        unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
      }
    }

    // Build conversation map keyed by partner id
    const convMap = {};

    for (const msg of sent ?? []) {
      const pid = msg.receiver_id;
      if (!convMap[pid] || msg.created_at > convMap[pid].lastMessage.created_at) {
        convMap[pid] = { partnerId: pid, partner: msg.receiver, lastMessage: { ...msg, isMine: true } };
      }
    }
    for (const msg of received ?? []) {
      const pid = msg.sender_id;
      if (!convMap[pid] || msg.created_at > convMap[pid].lastMessage.created_at) {
        convMap[pid] = { ...(convMap[pid] ?? {}), partnerId: pid, partner: msg.sender, lastMessage: { ...msg, isMine: false } };
      }
    }
    for (const conv of Object.values(convMap)) {
      conv.unread = unreadCounts[conv.partnerId] || 0;
    }

    setConversations(
      Object.values(convMap).sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Without this, the unread badge (nav bar + conversation list) only ever
  // reflects the moment this hook first mounted — new messages arriving
  // elsewhere in the app would never update it until a full page reload.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => { fetchConversations(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
};
