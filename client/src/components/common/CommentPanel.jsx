import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { usePostComments } from '../../hooks/usePostComments.js';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './CommentPanel.css';

export function useCommentState() {
  const { commentsByPost, loadingPost, fetchComments, addComment, deleteComment } = usePostComments();
  const [openPanels, setOpenPanels] = useState({});

  function togglePanel(postId) {
    const isOpening = !openPanels[postId];
    setOpenPanels((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (isOpening && !commentsByPost[postId]) {
      fetchComments(postId);
    }
  }

  function commentCount(postId) {
    return (commentsByPost[postId] ?? []).length;
  }

  return { openPanels, commentsByPost, loadingPost, togglePanel, addComment, deleteComment, commentCount };
}

export default function CommentPanel({ postId, postType, comments = [], loading, onAdd, onDelete }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onAdd(postId, postType, text);
    setText('');
    setSubmitting(false);
  }

  return (
    <div className="comment-panel">
      {loading && <p className="comment-loading">Loading comments...</p>}

      {!loading && comments.length === 0 && (
        <p className="comment-empty">No comments yet — be the first!</p>
      )}

      <div className="comment-list">
        {comments.map((c) => {
          const name = getDisplayName(c.profiles);
          const isOwn = c.user_id === user?.id;
          return (
            <div key={c.id} className="comment-item">
              <button className="comment-avatar-btn" onClick={() => navigate(`/profile/${c.user_id}`)}>
                <Avatar url={c.profiles?.avatar_url} name={name} size={30} />
              </button>
              <div className="comment-body">
                <div className="comment-meta">
                  <button className="comment-author-btn" onClick={() => navigate(`/profile/${c.user_id}`)}>
                    {name}
                  </button>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
              {isOwn && (
                <button className="comment-delete-btn" onClick={() => onDelete(postId, c.id)} aria-label="Delete">
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form className="comment-input-row" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="comment-input"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
        />
        <button className="comment-submit-btn" type="submit" disabled={!text.trim() || submitting}>
          {submitting ? '...' : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
