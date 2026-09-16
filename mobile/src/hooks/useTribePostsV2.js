import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkText } from '../lib/contentModeration';

// Mirrors client/src/hooks/useTribePosts.js (non-paginated mode) --
// mobile's Tribe tab is a single scroll, no separate per-community view yet.
export function useTribePostsV2(userId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tribe_posts')
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .order('created_at', { ascending: false })
      .limit(100);
    setPosts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = useCallback(async ({ content, post_type, milestone, event_date, location }) => {
    if (!userId) return { data: null, error: new Error('Not authenticated') };
    const modResult = checkText(content);
    if (!modResult.ok) return { data: null, error: null, moderation: modResult };
    if (milestone) {
      const milestoneCheck = checkText(milestone);
      if (!milestoneCheck.ok) return { data: null, error: null, moderation: milestoneCheck };
    }

    const { data, error } = await supabase
      .from('tribe_posts')
      .insert({
        user_id: userId,
        content,
        post_type,
        milestone: milestone || null,
        event_date: event_date || null,
        location: location || null,
      })
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .single();
    if (!error) setPosts((prev) => [data, ...prev]);
    return { data, error };
  }, [userId]);

  return { posts, loading, createPost, refetch: fetchPosts };
}
