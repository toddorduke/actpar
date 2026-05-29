import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export const useTribePosts = (communityId = null) => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tribe_posts')
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data } = await query;
    setPosts(data ?? []);
    setLoading(false);
  }, [communityId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = useCallback(async ({ content, post_type, milestone, community_id, media_url }) => {
    const modResult = checkText(content);
    if (!modResult.ok) return { data: null, error: null, moderation: modResult };
    if (milestone) {
      const milestoneCheck = checkText(milestone);
      if (!milestoneCheck.ok) return { data: null, error: null, moderation: milestoneCheck };
    }

    const { data, error } = await supabase
      .from('tribe_posts')
      .insert({
        user_id: user.id,
        content,
        post_type,
        milestone: milestone || null,
        community_id: community_id || null,
        media_url: media_url || null,
      })
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .single();
    if (!error) setPosts((prev) => [data, ...prev]);
    return { data, error };
  }, [user]);

  const likePost = useCallback(async (postId, currentLikes) => {
    const { error } = await supabase
      .from('tribe_posts')
      .update({ likes: currentLikes + 1 })
      .eq('id', postId);
    if (!error) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
      );
    }
  }, []);

  return { posts, loading, createPost, likePost, refetch: fetchPosts };
};
