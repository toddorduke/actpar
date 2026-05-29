import React, { useContext, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConnections } from '../../hooks/useConnections.js';
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
const SHARE_PATH  = 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z';

function FeedCard({ post, liked, isToggling, likeCount, onLike, onOpenComments, commentCount, onShare }) {
  const authorName  = getDisplayName(post.profiles);
  const gradient    = getGradient(post.post_type, post.id);
  const type        = post.post_type ?? 'general';
  const hasMedia    = !!post.media_url;
  const isVideo     = hasMedia && /\.(mp4|mov|webm|quicktime)$/i.test(post.media_url);
  const [burst, setBurst] = useState(false);

  function handleLike() {
    if (isToggling) return;
    if (!liked) { setBurst(true); setTimeout(() => setBurst(false), 600); }
    onLike(post.id, likeCount);
  }

  return (
    <div className="feed-card" style={hasMedia ? {} : { background: gradient }}>
      {/* Subtle noise texture overlay for gradient cards */}
      {!hasMedia && <div className="feed-card-noise" />}

      {hasMedia && !isVideo && <img src={post.media_url} alt="" className="feed-media-bg" />}
      {hasMedia && isVideo && (
        <video src={post.media_url} className="feed-media-bg" autoPlay muted loop playsInline />
      )}

      <div className="feed-card-scrim" />

      {/* Author — top left */}
      <div className="feed-top">
        <Link to={`/profile/${post.user_id}`} className="feed-author-link">
          <div className="feed-avatar-ring">
            <Avatar url={post.profiles?.avatar_url} name={authorName} size={40} />
          </div>
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
          onClick={handleLike}
          disabled={isToggling}
          aria-label="Like"
        >
          <div className="feed-like-wrap">
            <svg fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" width="30" height="30">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={HEART_PATH} />
            </svg>
            {burst && <span className="feed-like-burst">❤️</span>}
          </div>
          <span className="feed-action-count">{likeCount || ''}</span>
        </button>

        <button
          className="feed-action-btn"
          onClick={() => onOpenComments(post.id)}
          aria-label="Comments"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="30" height="30">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={BUBBLE_PATH} />
          </svg>
          <span className="feed-action-count">{commentCount || ''}</span>
        </button>

        <button
          className="feed-action-btn"
          onClick={() => onShare(post)}
          aria-label="Share"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={SHARE_PATH} />
          </svg>
          <span className="feed-action-count">Share</span>
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

// ── Share sheet ───────────────────────────────────────────────────────────────

function ShareSheet({ post, user, connections, onClose }) {
  const [view, setView]     = useState('main'); // 'main' | 'friends'
  const [search, setSearch] = useState('');
  const [sent, setSent]     = useState(new Set());
  const [copied, setCopied] = useState(false);

  const postUrl = `${import.meta.env.VITE_APP_URL}/post/${post.id}`;
  const snippet = post.content.length > 100 ? post.content.slice(0, 100).trimEnd() + '…' : post.content;

  const filtered = connections.filter((c) => {
    const name = `${c.partnerProfile?.first_name ?? ''} ${c.partnerProfile?.last_name ?? ''} ${c.partnerProfile?.alter_ego_name ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function sendToFriend(partnerId) {
    const msg = `Check this out 👀\n"${snippet}"\n${postUrl}`;
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: msg,
    });
    setSent((prev) => new Set([...prev, partnerId]));
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ActPar', text: snippet, url: postUrl });
      } catch {}
    } else {
      handleCopyLink();
    }
  }

  return (
    <div className="fss-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fss-sheet">
        <div className="fss-handle" />

        {view === 'main' && (
          <>
            <div className="fss-header">
              <span className="fss-title">Share Post</span>
              <button className="fss-close" onClick={onClose}>×</button>
            </div>

            <button className="fss-option" onClick={() => setView('friends')}>
              <div className="fss-option-icon">👥</div>
              <div className="fss-option-body">
                <div className="fss-option-label">Send to a Friend</div>
                <div className="fss-option-desc">Send via ActPar messages</div>
              </div>
              <span className="fss-chevron">›</span>
            </button>

            <button className="fss-option" onClick={handleCopyLink}>
              <div className="fss-option-icon">🔗</div>
              <div className="fss-option-body">
                <div className="fss-option-label">{copied ? 'Copied!' : 'Copy Link'}</div>
                <div className="fss-option-desc">actpar.com/post/…</div>
              </div>
            </button>

            <button className="fss-option" onClick={handleNativeShare}>
              <div className="fss-option-icon">↗</div>
              <div className="fss-option-body">
                <div className="fss-option-label">Share Outside App</div>
                <div className="fss-option-desc">Text, WhatsApp, Instagram…</div>
              </div>
            </button>
          </>
        )}

        {view === 'friends' && (
          <>
            <div className="fss-header">
              <button className="fss-back" onClick={() => setView('main')}>←</button>
              <span className="fss-title">Send to Friend</span>
              <button className="fss-close" onClick={onClose}>×</button>
            </div>

            <div className="fss-search-wrap">
              <input
                className="fss-search"
                placeholder="Search connections…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="fss-friends-list">
              {filtered.length === 0 && (
                <p className="fss-empty">No connections found</p>
              )}
              {filtered.map((c) => {
                const p    = c.partnerProfile;
                const name = getDisplayName(p, 'Someone');
                const pid  = p?.id;
                const wasSent = sent.has(pid);
                return (
                  <div key={pid} className="fss-friend-row">
                    <Avatar url={p?.avatar_url} name={name} size={40} />
                    <div className="fss-friend-info">
                      <div className="fss-friend-name">{name}</div>
                      {p?.alter_ego_name && <div className="fss-friend-ego">⚡ {p.alter_ego_name}</div>}
                    </div>
                    <button
                      className={`fss-send-btn${wasSent ? ' sent' : ''}`}
                      onClick={() => !wasSent && sendToFriend(pid)}
                      disabled={wasSent}
                    >
                      {wasSent ? '✓ Sent' : 'Send'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Post creation sheet ───────────────────────────────────────────────────────

// Upload via XHR so we get progress events
async function xhrUpload(path, file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/media/${path}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Cache-Control', '3600');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(JSON.parse(xhr.responseText)?.message ?? 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

function PostSheet({ user, createPost, onClose, onUploadStart, onUploadProgress, onUploadDone, onUploadError }) {
  const [postType, setPostType]       = useState('general');
  const [content, setContent]         = useState('');
  const [milestone, setMilestone]     = useState('');
  const [mediaFile, setMediaFile]     = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
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

    const capturedContent   = content.trim();
    const capturedType      = postType;
    const capturedMilestone = milestone;
    const capturedFile      = mediaFile;

    // Close sheet immediately — upload continues in background
    onClose();

    let media_url = null;

    if (capturedFile) {
      onUploadStart();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const ext  = capturedFile.name.split('.').pop();
        const path = `posts/${user.id}/${Date.now()}.${ext}`;
        await xhrUpload(path, capturedFile, session.access_token, onUploadProgress);
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        media_url = urlData.publicUrl;
      } catch (err) {
        onUploadError(err.message);
        return;
      }
    }

    const { error: postErr, moderation } = await createPost({
      content: capturedContent,
      post_type: capturedType,
      milestone: capturedType === 'achievement' ? capturedMilestone : null,
      media_url,
    });

    if (moderation || postErr) {
      onUploadError(moderation?.message ?? postErr?.message ?? 'Post failed');
      return;
    }
    onUploadDone();
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

        {/* Media preview — shown above caption when media is attached */}
        {previewUrl && (
          <div className="feed-post-preview">
            {isVideo
              ? <video src={previewUrl} controls className="feed-post-preview-media" />
              : <img src={previewUrl} alt="preview" className="feed-post-preview-media" />
            }
            <button className="feed-post-preview-remove" onClick={removeMedia}>✕</button>
            <span className="feed-post-preview-type">{isVideo ? '🎬 Video' : '📷 Photo'}</span>
          </div>
        )}

        {/* Caption / text */}
        {mediaFile && (
          <div className="feed-post-caption-label">
            <span>Caption</span>
            <span className="feed-post-caption-optional">(optional)</span>
          </div>
        )}
        <textarea
          className="feed-post-textarea"
          rows={mediaFile ? 2 : 4}
          placeholder={mediaFile ? 'Add a caption…' : "What's your win today?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

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
            disabled={!content.trim() && !mediaFile}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { user }                              = useContext(AuthContext);
  const { acceptedConnections }               = useConnections();
  const { posts, loading, createPost }        = useTribePosts(null);
  const postIds                               = useMemo(() => posts.map((p) => p.id), [posts]);
  const { likedIds, toggleLike, toggling }    = usePostLikes(postIds, 'tribe');
  const [localLikeCounts, setLocalLikeCounts] = useState({});
  const commentState                          = useCommentState();
  const [showSheet, setShowSheet]             = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [sharePost, setSharePost]             = useState(null);

  // Upload progress state
  const [uploadBar, setUploadBar] = useState(null); // null | { status, progress }
  const uploadTimerRef = useRef(null);

  function clearUploadBar() {
    clearTimeout(uploadTimerRef.current);
    uploadTimerRef.current = setTimeout(() => setUploadBar(null), 3000);
  }

  function handleUploadStart() {
    clearTimeout(uploadTimerRef.current);
    setUploadBar({ status: 'uploading', progress: 0 });
  }
  function handleUploadProgress(pct) {
    setUploadBar({ status: 'uploading', progress: pct });
  }
  function handleUploadDone() {
    setUploadBar({ status: 'done', progress: 100 });
    clearUploadBar();
  }
  function handleUploadError(msg) {
    setUploadBar({ status: 'error', progress: 100, message: msg });
    clearUploadBar();
  }

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

  const activePost = posts.find((p) => p.id === activeCommentPostId) ?? null;

  const sheetProps = {
    user,
    createPost,
    onClose: () => setShowSheet(false),
    onUploadStart: handleUploadStart,
    onUploadProgress: handleUploadProgress,
    onUploadDone: handleUploadDone,
    onUploadError: handleUploadError,
  };

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
        {showSheet && <PostSheet {...sheetProps} />}
      </div>
    );
  }

  return (
    <>
      {/* Upload progress bar — fixed at very top of screen */}
      {uploadBar && (
        <div className={`feed-upload-bar feed-upload-bar--${uploadBar.status}`}>
          <div
            className="feed-upload-bar-fill"
            style={{ width: `${uploadBar.progress}%` }}
          />
          <span className="feed-upload-bar-label">
            {uploadBar.status === 'uploading' && `Uploading… ${uploadBar.progress}%`}
            {uploadBar.status === 'done'      && '✓ Posted!'}
            {uploadBar.status === 'error'     && `✗ ${uploadBar.message ?? 'Upload failed'}`}
          </span>
        </div>
      )}

      {/* Dark backdrop fills the screen behind the centered column on desktop */}
      <div className="feed-desktop-backdrop" />
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
            onShare={setSharePost}
          />
        ))}
      </div>

      {/* Comment overlay */}
      {activePost && (
        <CommentOverlay
          post={activePost}
          commentState={commentState}
          onClose={handleCloseComments}
        />
      )}

      {/* Share sheet */}
      {sharePost && (
        <ShareSheet
          post={sharePost}
          user={user}
          connections={acceptedConnections}
          onClose={() => setSharePost(null)}
        />
      )}

      <button className="feed-fab" onClick={() => setShowSheet(true)} aria-label="Create post">+</button>

      {showSheet && <PostSheet {...sheetProps} />}
    </>
  );
}
