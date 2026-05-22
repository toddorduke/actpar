import React, { useContext, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { useTribePosts } from '../../hooks/useTribePosts.js';
import { usePostLikes } from '../../hooks/usePostLikes.js';
import CommentPanel, { useCommentState } from '../../components/common/CommentPanel.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './FeedPage.css';

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov'];
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

const CARD_GRADIENTS = [
  'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(160deg, #134e5e 0%, #1a3a4a 50%, #0d2b36 100%)',
  'linear-gradient(160deg, #141e30 0%, #1c2f4a 50%, #243b55 100%)',
  'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(160deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
  'linear-gradient(160deg, #2d1b69 0%, #1a1040 50%, #0d0820 100%)',
];
const ACHIEVEMENT_GRADIENT = 'linear-gradient(160deg, #451a03 0%, #78350f 50%, #92400e 100%)';
const MEETUP_GRADIENT      = 'linear-gradient(160deg, #022c22 0%, #064e3b 50%, #065f46 100%)';

function getGradient(postType, postId) {
  if (postType === 'achievement') return ACHIEVEMENT_GRADIENT;
  if (postType === 'meetup')      return MEETUP_GRADIENT;
  const idx = ((postId?.charCodeAt(0) ?? 0) + (postId?.charCodeAt(4) ?? 0)) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[idx];
}

const HEART_PATH  = 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
const BUBBLE_PATH = 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';

function FeedCard({ post, liked, isToggling, likeCount, onLike, onOpenComments, commentCount }) {
  const authorName = getDisplayName(post.profiles);
  const gradient   = getGradient(post.post_type, post.id);
  const type       = post.post_type ?? 'general';
  const hasMedia   = !!post.media_url;
  const isVideo    = hasMedia && /\.(mp4|mov|webm|quicktime)$/i.test(post.media_url);

  return (
    <div className="feed-card" style={hasMedia ? {} : { background: gradient }}>
      {hasMedia && !isVideo && <img src={post.media_url} alt="" className="feed-media-bg" />}
      {hasMedia && isVideo && (
        <video src={post.media_url} className="feed-media-bg" autoPlay muted loop playsInline />
      )}

      <div className="feed-card-scrim" />

      {/* Author — top left */}
      <div className="feed-top">
        <Link to={`/profile/${post.user_id}`} className="feed-author-link">
          <Avatar url={post.profiles?.avatar_url} name={authorName} size={38} />
          <div className="feed-author-info">
            <span className="feed-author-name">{authorName}</span>
            <span className="feed-author-time">{timeAgo(post.created_at)}</span>
          </div>
        </Link>
        {type !== 'general' && (
          <span className={`feed-type-badge feed-type-${type}`}>
            {type === 'achievement' ? '🏆 Achievement' : '📅 Meetup'}
          </span>
        )}
      </div>

      {/* Action buttons — right side */}
      <div className="feed-actions">
        <button
          className={`feed-action-btn${liked ? ' liked' : ''}`}
          onClick={() => onLike(post.id, likeCount)}
          disabled={isToggling}
          aria-label="Like"
        >
          <svg fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={HEART_PATH} />
          </svg>
          <span className="feed-action-count">{likeCount || ''}</span>
        </button>

        <button
          className="feed-action-btn"
          onClick={() => onOpenComments(post.id)}
          aria-label="Comments"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={BUBBLE_PATH} />
          </svg>
          <span className="feed-action-count">{commentCount || ''}</span>
        </button>
      </div>

      {/* Post content — bottom left */}
      <div className="feed-bottom">
        {type === 'achievement' && post.milestone && (
          <div className="feed-milestone">🎯 {post.milestone}</div>
        )}
        <p className="feed-content">{post.content}</p>
      </div>
    </div>
  );
}

// ── Comment overlay (rendered at page level, not inside the card) ─────────────
function CommentOverlay({ post, commentState, onClose }) {
  return (
    <div className="feed-comment-overlay-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="feed-comment-overlay-sheet">
        <div className="feed-comment-overlay-header">
          <span className="feed-comment-overlay-title">Comments</span>
          <button className="feed-comment-overlay-close" onClick={onClose}>×</button>
        </div>
        <div className="feed-comment-overlay-body">
          <CommentPanel
            postId={post.id}
            postType="tribe"
            comments={commentState.commentsByPost[post.id] ?? []}
            loading={!!commentState.loadingPost[post.id]}
            onAdd={commentState.addComment}
            onDelete={commentState.deleteComment}
          />
        </div>
      </div>
    </div>
  );
}

// ── Post creation sheet ───────────────────────────────────────────────────────

function PostSheet({ user, createPost, onClose, onSuccess }) {
  const [postType, setPostType]       = useState('general');
  const [content, setContent]         = useState('');
  const [milestone, setMilestone]     = useState('');
  const [mediaFile, setMediaFile]     = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const fileRef                       = useRef(null);

  function pickFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = ALLOWED_IMAGE.includes(file.type);
    const isVideo = ALLOWED_VIDEO.includes(file.type);
    if (!isImage && !isVideo) { setError('Unsupported file type.'); return; }
    if (isImage && file.size > MAX_IMAGE) { setError('Photo too large (max 10 MB).'); return; }
    if (isVideo && file.size > MAX_VIDEO) { setError('Video too large (max 200 MB).'); return; }
    setError('');
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeMedia() {
    setMediaFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit() {
    if (!content.trim() && !mediaFile) { setError('Add some text or media to post.'); return; }
    setSubmitting(true);
    setError('');

    let media_url = null;

    if (mediaFile) {
      setUploading(true);
      const ext  = mediaFile.name.split('.').pop();
      const path = `posts/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(path, mediaFile, { cacheControl: '3600', upsert: false });
      setUploading(false);
      if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      media_url = urlData.publicUrl;
    }

    const { error: postErr, moderation } = await createPost({
      content: content.trim(),
      post_type: postType,
      milestone: postType === 'achievement' ? milestone : null,
      media_url,
    });

    setSubmitting(false);
    if (moderation) { setError(moderation.message); return; }
    if (postErr)    { setError(postErr.message); return; }
    onSuccess();
  }

  const isVideo = previewUrl && mediaFile && ALLOWED_VIDEO.includes(mediaFile.type);

  return (
    <div className="feed-post-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="feed-post-sheet">
        <div className="feed-post-sheet-handle" />

        <div className="feed-post-sheet-header">
          <span>New Post</span>
          <button className="feed-post-sheet-close" onClick={onClose}>×</button>
        </div>

        {/* Type selector */}
        <div className="feed-post-type-row">
          {[['general', '💬 General'], ['achievement', '🏆 Achievement'], ['meetup', '📅 Meetup']].map(([val, lbl]) => (
            <button
              key={val}
              className={`feed-post-type-btn${postType === val ? ' active' : ''}`}
              onClick={() => setPostType(val)}
            >{lbl}</button>
          ))}
        </div>

        {/* Milestone */}
        {postType === 'achievement' && (
          <input
            className="feed-post-milestone-input"
            placeholder="Milestone reached (e.g. 30-day streak)"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
          />
        )}

        {/* Text */}
        <textarea
          className="feed-post-textarea"
          rows={4}
          placeholder="What's your win today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Media preview */}
        {previewUrl && (
          <div className="feed-post-preview">
            {isVideo
              ? <video src={previewUrl} controls className="feed-post-preview-media" />
              : <img src={previewUrl} alt="preview" className="feed-post-preview-media" />
            }
            <button className="feed-post-preview-remove" onClick={removeMedia}>✕</button>
          </div>
        )}

        {error && <p className="feed-post-error">{error}</p>}

        {/* Footer */}
        <div className="feed-post-sheet-footer">
          <button className="feed-post-media-btn" onClick={() => fileRef.current?.click()} title="Add photo or video">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={pickFile} />

          <button
            className="feed-post-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !mediaFile)}
          >
            {uploading ? 'Uploading…' : submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { user }                              = useContext(AuthContext);
  const { posts, loading, createPost }        = useTribePosts(null);
  const postIds                               = useMemo(() => posts.map((p) => p.id), [posts]);
  const { likedIds, toggleLike, toggling }    = usePostLikes(postIds, 'tribe');
  const [localLikeCounts, setLocalLikeCounts] = useState({});
  const commentState                          = useCommentState();
  const [showSheet, setShowSheet]             = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [toast, setToast]                     = useState('');

  function handleLike(postId, currentCount) {
    toggleLike(postId, currentCount, (id, newCount) => {
      setLocalLikeCounts((prev) => ({ ...prev, [id]: newCount }));
    }, null);
  }

  function handleOpenComments(postId) {
    setActiveCommentPostId(postId);
    if (!commentState.commentsByPost[postId]) {
      commentState.togglePanel(postId);
    }
  }

  function handleCloseComments() {
    setActiveCommentPostId(null);
  }

  function handlePostSuccess() {
    setShowSheet(false);
    setToast('Post shared! 🎉');
    setTimeout(() => setToast(''), 3000);
  }

  const activePost = posts.find((p) => p.id === activeCommentPostId) ?? null;

  if (loading) {
    return (
      <div className="feed-page feed-loading-state">
        <div className="feed-loading-spinner" />
        <p>Loading feed…</p>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="feed-page feed-empty-state">
        <span style={{ fontSize: '3rem' }}>🎬</span>
        <h3>Nothing here yet</h3>
        <p>Be the first to post.</p>
        <button className="feed-fab" onClick={() => setShowSheet(true)} aria-label="Create post">+</button>
        {showSheet && (
          <PostSheet user={user} createPost={createPost} onClose={() => setShowSheet(false)} onSuccess={handlePostSuccess} />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="feed-page">
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            liked={likedIds.has(post.id)}
            isToggling={toggling.has(post.id)}
            likeCount={localLikeCounts[post.id] ?? post.likes ?? 0}
            onLike={handleLike}
            onOpenComments={handleOpenComments}
            commentCount={commentState.commentCount(post.id)}
          />
        ))}
      </div>

      {/* Comment overlay — rendered outside the snap scroll so it scrolls freely */}
      {activePost && (
        <CommentOverlay
          post={activePost}
          commentState={commentState}
          onClose={handleCloseComments}
        />
      )}

      <button className="feed-fab" onClick={() => setShowSheet(true)} aria-label="Create post">+</button>

      {showSheet && (
        <PostSheet user={user} createPost={createPost} onClose={() => setShowSheet(false)} onSuccess={handlePostSuccess} />
      )}

      {toast && <div className="feed-toast">{toast}</div>}
    </>
  );
}
