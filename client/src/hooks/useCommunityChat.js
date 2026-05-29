import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export const useCommunityChat = (communityId) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    const { data } = await supabase
      .from('community_messages')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(data ?? []);
    setLoading(false);
  }, [communityId]);

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    if (!communityId) return;
    const channel = supabase
      .channel(`community_chat_${communityId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `community_id=eq.${communityId}`,
      }, async (payload) => {
        // Fetch with profile join since realtime doesn't include it
        const { data } = await supabase
          .from('community_messages')
          .select('*, profiles(first_name, last_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        if (data) setMessages((prev) => [...prev, data]);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [communityId, fetchMessages]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !user) return { moderation: null };
    const modResult = checkText(content);
    if (!modResult.ok) return { moderation: modResult };
    await supabase
      .from('community_messages')
      .insert({ community_id: communityId, user_id: user.id, content: content.trim() });
    return { moderation: null };
  }, [communityId, user]);

  return { messages, loading, sendMessage };
};
