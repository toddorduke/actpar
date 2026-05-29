import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './PostPage.css';

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tribe_posts')
      .select('*, profiles(first_name, last_name, alter_ego_name, avatar_url, id)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="pp-page"><div className="pp-spinner" /></div>;
  if (!post)   return <div className="pp-page"><p className="pp-missing">Post not found.</p></div>;

  const authorName = getDisplayName(post.profiles);
  const isVideo    = post.media_url && /\.(mp4|mov|webm|quicktime)$/i.test(post.media_url);

  return (
    <div className="pp-page">
      <div className="pp-card">
        <button className="pp-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {post.media_url && (
          <div className="pp-media-wrap">
            {isVideo
              ? <video src={post.media_url} controls className="pp-media" />
              : <img src={post.media_url} alt="" className="pp-media" />}
          </div>
        )}

        <div className="pp-body">
          <div className="pp-author">
            <Avatar url={post.profiles?.avatar_url} name={authorName} size={44} />
            <div>
              <div className="pp-author-name">{authorName}</div>
              <div className="pp-author-time">{timeAgo(post.created_at)}</div>
            </div>
          </div>

          {post.post_type === 'achievement' && post.milestone && (
            <div className="pp-milestone">🏆 {post.milestone}</div>
          )}

          <p className="pp-content">{post.content}</p>

          <button className="pp-feed-btn" onClick={() => navigate('/feed')}>
            View in Feed →
          </button>
        </div>
      </div>
    </div>
  );
}
