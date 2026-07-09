import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useCommunities } from '../../hooks/useCommunities.js';
import { useTribePosts } from '../../hooks/useTribePosts.js';
import { useCommunityEvents } from '../../hooks/useCommunityEvents.js';
import { useCommunityChat } from '../../hooks/useCommunityChat.js';
import { useCommunityChallenges } from '../../hooks/useCommunityChallenges.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import CommentPanel, { useCommentState } from '../../components/common/CommentPanel.jsx';
import { useReactions, REACTION_EMOJIS } from '../../hooks/useReactions.js';
import ReportModal from '../../components/common/ReportModal.jsx';
import { supabase } from '../../lib/supabase.js';
import { timeAgo, formatEventDate } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './CommunityPage.css';

const POST_TRUNCATE = 300;

// ── Feed Tab ─────────────────────────────────────────────
function FeedTab({ communityId, isAdmin, pinnedPostId, onPin }) {
  const { user } = useContext(AuthContext);
  const { posts, loading, createPost, likePost } = useTribePosts(communityId);
  const toast = useToast();
  const commentState = useCommentState(posts);
  const postIds = useMemo(() => posts.map(p => p.id), [posts]);
  const { counts: reactionCounts, myReactions, loadReactions, toggleReaction } = useReactions();
  useEffect(() => { if (postIds.length) loadReactions(postIds); }, [postIds.join(',')]);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [milestone, setMilestone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportedUserId, setReportedUserId] = useState(null);

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const { error, moderation } = await createPost({ content, post_type: postType, milestone, community_id: communityId });
    setSubmitting(false);
    if (moderation) { toast(moderation.message, 'warning', 7000); return; }
    if (error) { toast('Post failed', 'error'); return; }
    setContent('');
    setMilestone('');
    setPostType('general');
  }

  const pinned = pinnedPostId ? posts.find((p) => p.id === pinnedPostId) : null;
  const feed = posts.slice(0, visibleCount);

  return (
    <div className="comm-feed">
      {/* Compose */}
      <div className="comm-compose">
        <div className="compose-type-row">
          {[['general', '💬'], ['achievement', '🏆'], ['meetup', '📅']].map(([v, e]) => (
            <button key={v} className={`compose-type-btn${postType === v ? ' active' : ''}`} onClick={() => setPostType(v)}>
              {e} {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <textarea
          className="compose-textarea"
          placeholder="Share something with this community..."
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {postType === 'achievement' && (
          <input className="compose-milestone" placeholder="Milestone (e.g. 5K PR)" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
        )}
        <button className="compose-submit" onClick={submit} disabled={submitting || !content.trim()}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Pinned post */}
      {pinned && (
        <div className="comm-post-card pinned-post">
          <div className="pinned-label">📌 Pinned</div>
          <PostCard post={pinned} onLike={likePost} isAdmin={isAdmin} onPin={onPin} isPinned onReport={(pid, uid) => { setReportPostId(pid); setReportedUserId(uid); }} currentUserId={user?.id} commentState={commentState} reactionCounts={reactionCounts[pinned.id]} myReaction={myReactions[pinned.id]} onReact={toggleReaction} />
        </div>
      )}

      {loading && <div className="comm-empty">Loading posts...</div>}
      {!loading && posts.length === 0 && <div className="comm-empty">No posts yet — start the conversation above!</div>}

      {feed.map((p) => p.id !== pinnedPostId && (
        <PostCard key={p.id} post={p} onLike={likePost} isAdmin={isAdmin} onPin={onPin} isPinned={false} onReport={(pid, uid) => { setReportPostId(pid); setReportedUserId(uid); }} currentUserId={user?.id} commentState={commentState} reactionCounts={reactionCounts[p.id]} myReaction={myReactions[p.id]} onReact={toggleReaction} />
      ))}

      {visibleCount < posts.length && (
        <button className="load-more-btn" onClick={() => setVisibleCount((n) => n + 10)}>Load more</button>
      )}

      {reportPostId && (
        <ReportModal
          postId={reportPostId}
          reportedUserId={reportedUserId}
          onClose={() => { setReportPostId(null); setReportedUserId(null); }}
        />
      )}
    </div>
  );
}

function PostCard({ post, onLike, isAdmin, onPin, isPinned, onReport, currentUserId, commentState, reactionCounts, myReaction, onReact }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = post.content.length > POST_TRUNCATE && !expanded;
  const authorName = getDisplayName(post.profiles);
  const { openPanels, commentsByPost, loadingPost, togglePanel, addComment, deleteComment, commentCount } = commentState;
  const isOpen = !!openPanels[post.id];
  const count = commentCount(post.id);

  return (
    <div className="comm-post-card">
      <div className="comm-post-header">
        <Avatar url={post.profiles?.avatar_url} name={authorName} size={38} />
        <div>
          <div className="comm-post-author">{authorName}</div>
          <div className="comm-post-time">{timeAgo(post.created_at)}</div>
        </div>
        {isAdmin && (
          <button className="pin-btn" onClick={() => onPin(isPinned ? null : post.id)} title={isPinned ? 'Unpin' : 'Pin post'}>
            {isPinned ? '📌 Unpin' : '📌 Pin'}
          </button>
        )}
        {post.user_id !== currentUserId && (
          <button className="comm-report-btn" onClick={() => onReport(post.id, post.user_id)} title="Report post">⋯</button>
        )}
      </div>
      <p className="comm-post-text">
        {truncated ? post.content.slice(0, POST_TRUNCATE).trimEnd() + '...' : post.content}
        {post.content.length > POST_TRUNCATE && (
          <button className="see-more-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? ' See less' : ' See more'}
          </button>
        )}
      </p>
      {post.milestone && <div className="comm-post-milestone">🏆 {post.milestone}</div>}
      <div className="comm-post-actions">
        <button className="comm-like-btn" onClick={() => onLike(post.id, post.likes)}>
          ❤️ {post.likes ?? 0}
        </button>
        <button className={`comm-comment-btn${isOpen ? ' active' : ''}`} onClick={() => togglePanel(post.id)}>
          💬 {count > 0 ? count : ''} Comment{count !== 1 ? 's' : ''}
        </button>
      </div>
      {onReact && (
        <div className="comm-post-reactions">
          {REACTION_EMOJIS.map(({ key, label }) => {
            const c = reactionCounts?.[key] ?? 0;
            const active = myReaction === key;
            return (
              <button key={key} className={`comm-reaction-chip${active ? ' active' : ''}`} onClick={() => onReact(post.id, key)}>
                {label}{c > 0 && <span className="comm-reaction-count">{c}</span>}
              </button>
            );
          })}
        </div>
      )}
      {isOpen && (
        <CommentPanel
          postId={post.id}
          postType="tribe"
          comments={commentsByPost[post.id] ?? []}
          loading={!!loadingPost[post.id]}
          onAdd={addComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}

// ── Events Tab ───────────────────────────────────────────
function EventsTab({ communityId, isAdmin }) {
  const { user } = useContext(AuthContext);
  const { events, rsvps, loading, createEvent, rsvp, deleteEvent } = useCommunityEvents(communityId);
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', location: '', event_date: '',
    price: '', stripe_payment_link: '', max_attendees: '',
  });
  const [saving, setSaving] = useState(false);
  const isPaid = Number(form.price) > 0;

  async function handleCreate(e) {
    e.preventDefault();
    if (isPaid && !form.stripe_payment_link) {
      toast('Add your Stripe Payment Link for paid events', 'warning'); return;
    }
    setSaving(true);
    const { error, moderation } = await createEvent({
      ...form,
      price: Number(form.price) || 0,
      max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
    });
    setSaving(false);
    if (moderation) { toast(moderation.message, 'error'); return; }
    if (error) { toast('Failed to create event', 'error'); return; }
    setShowForm(false);
    setForm({ title: '', description: '', location: '', event_date: '', price: '', stripe_payment_link: '', max_attendees: '' });
    toast('Event created! 🎉', 'success');
  }

  const upcoming = events.filter((e) => new Date(e.event_date) >= new Date());
  const past = events.filter((e) => new Date(e.event_date) < new Date());

  return (
    <div className="events-tab">
      <div className="events-header">
        <h3 className="tab-section-title">Upcoming Events</h3>
        <button className="comm-action-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <form className="event-form" onSubmit={handleCreate}>
          <input className="comm-input" placeholder="Event title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="comm-textarea" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input className="comm-input" placeholder="📍 Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          <input className="comm-input" type="datetime-local" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} required />

          <div className="form-row">
            <div>
              <label className="event-form-label">Price (leave 0 for free)</label>
              <div className="price-input-wrap">
                <span className="price-symbol">$</span>
                <input
                  className="comm-input price-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="event-form-label">Max attendees (optional)</label>
              <input className="comm-input" type="number" min="1" placeholder="Unlimited" value={form.max_attendees} onChange={(e) => setForm((p) => ({ ...p, max_attendees: e.target.value }))} />
            </div>
          </div>

          {isPaid && (
            <div className="stripe-link-field">
              <label className="event-form-label">
                💳 Stripe Payment Link
                <a className="stripe-help-link" href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noreferrer">
                  Create one in Stripe →
                </a>
              </label>
              <input
                className="comm-input"
                placeholder="https://buy.stripe.com/..."
                value={form.stripe_payment_link}
                onChange={(e) => setForm((p) => ({ ...p, stripe_payment_link: e.target.value }))}
                required={isPaid}
              />
              <p className="stripe-link-hint">Members will be sent to this link to pay before their spot is confirmed.</p>
            </div>
          )}

          <button className="comm-action-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</button>
        </form>
      )}

      {loading && <div className="comm-empty">Loading events...</div>}
      {!loading && upcoming.length === 0 && <div className="comm-empty">No upcoming events — create one above!</div>}

      <div className="events-list">
        {upcoming.map((ev) => <EventCard key={ev.id} event={ev} myStatus={rsvps[ev.id]} onRsvp={rsvp} onDelete={isAdmin || ev.created_by === user?.id ? deleteEvent : null} />)}
      </div>

      {past.length > 0 && (
        <>
          <h3 className="tab-section-title" style={{ marginTop: 32 }}>Past Events</h3>
          <div className="events-list events-list--past">
            {past.map((ev) => <EventCard key={ev.id} event={ev} myStatus={rsvps[ev.id]} onRsvp={rsvp} past />)}
          </div>
        </>
      )}
    </div>
  );
}

function EventCard({ event, myStatus, onRsvp, onDelete, past }) {
  const going = (event.event_rsvps ?? []).filter((r) => r.status === 'going').length;
  const maybe = (event.event_rsvps ?? []).filter((r) => r.status === 'maybe').length;
  const isPaid = Number(event.price) > 0;
  const isFull = event.max_attendees && going >= event.max_attendees;

  function handleRsvp(status) {
    if (isPaid && status === 'going' && event.stripe_payment_link) {
      // Open Stripe payment link in new tab — RSVP is marked pending until paid
      window.open(event.stripe_payment_link, '_blank', 'noopener,noreferrer');
      onRsvp(event.id, 'going');
      return;
    }
    onRsvp(event.id, status);
  }

  return (
    <div className={`event-card${past ? ' event-card--past' : ''}`}>
      <div className="event-date-badge">
        <div className="event-month">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</div>
        <div className="event-day">{new Date(event.event_date).getDate()}</div>
      </div>
      <div className="event-info">
        <div className="event-title-row">
          <div className="event-title">{event.title}</div>
          {isPaid && (
            <div className="event-price-badge">
              ${Number(event.price).toFixed(2)}
            </div>
          )}
        </div>
        {event.location && <div className="event-location">📍 {event.location}</div>}
        <div className="event-time">{formatEventDate(event.event_date)}</div>
        {event.description && <p className="event-desc">{event.description}</p>}
        <div className="event-rsvp-counts">
          <span>✅ {going} going</span>
          <span>🤔 {maybe} maybe</span>
          {event.max_attendees && (
            <span className={isFull ? 'event-full-label' : ''}>
              {isFull ? '🔒 Full' : `${event.max_attendees - going} spots left`}
            </span>
          )}
        </div>
        {!past && (
          <div className="event-rsvp-row">
            {isFull && myStatus !== 'going' ? (
              <span className="event-full-label">This event is full</span>
            ) : (
              <>
                <button
                  className={`rsvp-btn${myStatus === 'going' ? ' active' : ''}${isPaid ? ' rsvp-btn--paid' : ''}`}
                  onClick={() => handleRsvp('going')}
                >
                  {isPaid ? `💳 Pay $${Number(event.price).toFixed(2)} & Go` : '✅ Going'}
                </button>
                {!isPaid && (
                  <button className={`rsvp-btn${myStatus === 'maybe' ? ' active' : ''}`} onClick={() => handleRsvp('maybe')}>
                    🤔 Maybe
                  </button>
                )}
                <button className={`rsvp-btn${myStatus === 'not_going' ? ' active' : ''}`} onClick={() => handleRsvp('not_going')}>
                  ❌ Can't go
                </button>
              </>
            )}
            {onDelete && (
              <button className="rsvp-btn rsvp-btn--delete" onClick={() => onDelete(event.id)}>Delete</button>
            )}
          </div>
        )}
        {isPaid && myStatus === 'going' && (
          <div className="event-paid-note">
            💳 Payment handled via Stripe. Check your email for confirmation.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Members Tab ──────────────────────────────────────────
function MembersTab({ communityId, isAdmin, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!communityId) return;
    supabase
      .from('community_memberships')
      .select('*, profiles(id, first_name, last_name, alter_ego_name, avatar_url, city, account_type)')
      .eq('community_id', communityId)
      .then(({ data }) => { setMembers(data ?? []); setLoading(false); });
  }, [communityId]);

  async function removeMember(userId) {
    await supabase.from('community_memberships').delete().eq('community_id', communityId).eq('user_id', userId);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    toast('Member removed', 'success');
  }

  async function toggleAdmin(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    await supabase.from('community_memberships').update({ role: newRole }).eq('community_id', communityId).eq('user_id', userId);
    setMembers((prev) => prev.map((m) => m.user_id === userId ? { ...m, role: newRole } : m));
  }

  if (loading) return <div className="comm-empty">Loading members...</div>;

  return (
    <div className="members-tab">
      <div className="members-count">{members.length} member{members.length !== 1 ? 's' : ''}</div>
      <div className="members-grid">
        {members.map((m) => {
          const name = getDisplayName(m.profiles);
          return (
            <div key={m.user_id} className="member-card">
              <Avatar url={m.profiles?.avatar_url} name={name} size={52} />
              <div className="member-info">
                <div className="member-name">{name}</div>
                {m.profiles?.alter_ego_name && <div className="member-alter-ego">⚡ {m.profiles.alter_ego_name}</div>}
                {m.profiles?.city && <div className="member-city">📍 {m.profiles.city}</div>}
                <div className={`member-role-badge${m.role === 'admin' ? ' admin' : ''}`}>{m.role}</div>
              </div>
              {isAdmin && m.user_id !== currentUserId && (
                <div className="member-actions">
                  <button className="member-action-btn" onClick={() => toggleAdmin(m.user_id, m.role)}>
                    {m.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button className="member-action-btn danger" onClick={() => removeMember(m.user_id)}>Remove</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat Tab ─────────────────────────────────────────────
function ChatTab({ communityId }) {
  const { user } = useContext(AuthContext);
  const { messages, loading, sendMessage } = useCommunityChat(communityId);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
  }

  return (
    <div className="chat-tab">
      <div className="chat-messages">
        {loading && <div className="comm-empty">Loading chat...</div>}
        {!loading && messages.length === 0 && <div className="comm-empty">No messages yet — say hello! 👋</div>}
        {messages.map((m) => {
          const isMe = m.user_id === user?.id;
          const name = getDisplayName(m.profiles);
          return (
            <div key={m.id} className={`chat-message${isMe ? ' me' : ''}`}>
              {!isMe && <Avatar url={m.profiles?.avatar_url} name={name} size={32} />}
              <div className="chat-bubble-wrap">
                {!isMe && <div className="chat-sender">{name}</div>}
                <div className="chat-bubble">{m.content}</div>
                <div className="chat-time">{timeAgo(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          className="chat-input"
          placeholder="Send a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="chat-send-btn" type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}

// ── Challenges Tab ───────────────────────────────────────
function ChallengesTab({ communityId }) {
  const { user } = useContext(AuthContext);
  const { challenges, loading, createChallenge, logEntry } = useCommunityChallenges(communityId);
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', target_value: '', unit: 'miles', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [logForms, setLogForms] = useState({});

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await createChallenge({ ...form, target_value: Number(form.target_value) });
    setSaving(false);
    if (error) { toast('Failed to create challenge', 'error'); return; }
    setShowForm(false);
    setForm({ title: '', description: '', target_value: '', unit: 'miles', start_date: '', end_date: '' });
    toast('Challenge created! 💪', 'success');
  }

  async function handleLog(challengeId) {
    const { value, note } = logForms[challengeId] ?? {};
    if (!value) return;
    const { error } = await logEntry(challengeId, Number(value), note);
    if (error) { toast('Failed to log entry', 'error'); return; }
    setLogForms((prev) => ({ ...prev, [challengeId]: { value: '', note: '' } }));
    toast('Progress logged! 🎯', 'success');
  }

  return (
    <div className="challenges-tab">
      <div className="events-header">
        <h3 className="tab-section-title">Active Challenges</h3>
        <button className="comm-action-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Challenge'}
        </button>
      </div>

      {showForm && (
        <form className="event-form" onSubmit={handleCreate}>
          <input className="comm-input" placeholder="Challenge title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="comm-textarea" placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="form-row">
            <input className="comm-input" type="number" placeholder="Target (e.g. 100)" value={form.target_value} onChange={(e) => setForm((p) => ({ ...p, target_value: e.target.value }))} required />
            <input className="comm-input" placeholder="Unit (miles, reps…)" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} required />
          </div>
          <div className="form-row">
            <input className="comm-input" type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
            <input className="comm-input" type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required />
          </div>
          <button className="comm-action-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Challenge'}</button>
        </form>
      )}

      {loading && <div className="comm-empty">Loading challenges...</div>}
      {!loading && challenges.length === 0 && <div className="comm-empty">No challenges yet — set one for your community!</div>}

      {challenges.map((ch) => {
        const total = (ch.challenge_entries ?? []).reduce((sum, e) => sum + Number(e.value), 0);
        const pct = Math.min((total / ch.target_value) * 100, 100);
        const myEntries = (ch.challenge_entries ?? []).filter((e) => e.user_id === user?.id);
        const myTotal = myEntries.reduce((sum, e) => sum + Number(e.value), 0);

        // Leaderboard
        const byUser = {};
        (ch.challenge_entries ?? []).forEach((e) => {
          const name = getDisplayName(e.profiles);
          byUser[e.user_id] = { name, total: (byUser[e.user_id]?.total ?? 0) + Number(e.value) };
        });
        const leaderboard = Object.values(byUser).sort((a, b) => b.total - a.total).slice(0, 5);

        return (
          <div key={ch.id} className="challenge-card">
            <div className="challenge-header">
              <div className="challenge-title">{ch.title}</div>
              <div className="challenge-dates">{ch.start_date} → {ch.end_date}</div>
            </div>
            {ch.description && <p className="challenge-desc">{ch.description}</p>}

            <div className="challenge-progress">
              <div className="challenge-progress-labels">
                <span>{total.toLocaleString()} / {Number(ch.target_value).toLocaleString()} {ch.unit}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="challenge-bar">
                <div className="challenge-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="challenge-my">My contribution: <strong>{myTotal} {ch.unit}</strong></div>

            {leaderboard.length > 0 && (
              <div className="challenge-leaderboard">
                {leaderboard.map((l, i) => (
                  <div key={l.name} className="challenge-leader">
                    <span className="challenge-leader-rank">#{i + 1}</span>
                    <span className="challenge-leader-name">{l.name}</span>
                    <span className="challenge-leader-val">{l.total} {ch.unit}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="challenge-log">
              <input
                className="comm-input"
                type="number"
                placeholder={`Log ${ch.unit}...`}
                value={logForms[ch.id]?.value ?? ''}
                onChange={(e) => setLogForms((p) => ({ ...p, [ch.id]: { ...p[ch.id], value: e.target.value } }))}
              />
              <input
                className="comm-input"
                placeholder="Note (optional)"
                value={logForms[ch.id]?.note ?? ''}
                onChange={(e) => setLogForms((p) => ({ ...p, [ch.id]: { ...p[ch.id], note: e.target.value } }))}
              />
              <button className="comm-action-primary" onClick={() => handleLog(ch.id)} disabled={!logForms[ch.id]?.value}>
                Log Progress
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Leaderboard Tab ──────────────────────────────────────
function LeaderboardTab({ communityId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) return;
    async function load() {
      // Get members + their goal check-in counts (day_count sum)
      const { data: members } = await supabase
        .from('community_memberships')
        .select('user_id, profiles(first_name, last_name, avatar_url)')
        .eq('community_id', communityId);

      if (!members?.length) { setLoading(false); return; }

      const ids = members.map((m) => m.user_id);
      const { data: goals } = await supabase
        .from('goals')
        .select('user_id, day_count')
        .in('user_id', ids)
        .eq('is_active', true);

      const totals = {};
      (goals ?? []).forEach((g) => {
        totals[g.user_id] = (totals[g.user_id] ?? 0) + (g.day_count ?? 0);
      });

      const ranked = members
        .map((m) => ({
          user_id: m.user_id,
          name: getDisplayName(m.profiles),
          avatar_url: m.profiles?.avatar_url,
          total_days: totals[m.user_id] ?? 0,
        }))
        .sort((a, b) => b.total_days - a.total_days);

      setRows(ranked);
      setLoading(false);
    }
    load();
  }, [communityId]);

  if (loading) return <div className="comm-empty">Loading leaderboard...</div>;
  if (rows.length === 0) return <div className="comm-empty">No data yet — start checking in on your goals!</div>;

  return (
    <div className="leaderboard-tab">
      <p className="leaderboard-subtitle">Ranked by total goal check-in days across all active goals</p>
      {rows.map((r, i) => (
        <div key={r.user_id} className={`lb-row${i < 3 ? ` lb-top-${i + 1}` : ''}`}>
          <div className="lb-rank">{i + 1}</div>
          <Avatar url={r.avatar_url} name={r.name} size={40} />
          <div className="lb-name">{r.name}</div>
          <div className="lb-score">{r.total_days} <span>days</span></div>
        </div>
      ))}
    </div>
  );
}

// ── Main Community Page ──────────────────────────────────
const TABS = [
  ['feed', '💬 Feed'],
  ['events', '📅 Events'],
  ['members', '👥 Members'],
  ['chat', '💬 Chat'],
];

export default function CommunityPage() {
  const { id: communityId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const { communities, myMemberships, joinCommunity, leaveCommunity, refetch } = useCommunities();
  const [activeTab, setActiveTab] = useState('feed');
  const [editingCover, setEditingCover] = useState(false);
  const coverInputRef = useRef(null);

  const community = communities.find((c) => c.id === communityId);
  const isMember = myMemberships.includes(communityId);
  const isAdmin = community?.created_by === user?.id ||
    (community && communities.find((c) => c.id === communityId));

  // Check actual admin role from memberships
  const [userRole, setUserRole] = useState('member');
  useEffect(() => {
    if (!communityId || !user) return;
    supabase
      .from('community_memberships')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setUserRole(data.role); });
  }, [communityId, user]);

  const isActualAdmin = userRole === 'admin' || community?.created_by === user?.id;

  async function handlePinPost(postId) {
    await supabase.from('communities').update({ pinned_post_id: postId }).eq('id', communityId);
    refetch();
    toast(postId ? 'Post pinned!' : 'Post unpinned', 'success');
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const path = `community_covers/${communityId}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (error) { toast('Upload failed', 'error'); return; }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    await supabase.from('communities').update({ cover_url: urlData.publicUrl }).eq('id', communityId);
    refetch();
    toast('Cover updated!', 'success');
  }

  async function copyJoinCode() {
    if (!community?.join_code) return;
    await navigator.clipboard.writeText(community.join_code);
    toast('Join code copied!', 'success');
  }

  if (!community) {
    return <div style={{ padding: 40, color: '#374151' }}>Loading community...</div>;
  }

  return (
    <div className="community-page">
      {/* Cover */}
      <div className="comm-cover" style={community.cover_url ? { backgroundImage: `url(${community.cover_url})` } : {}}>
        {!community.cover_url && <div className="comm-cover-placeholder">🏃</div>}
        {isActualAdmin && (
          <button className="comm-cover-edit-btn" onClick={() => coverInputRef.current?.click()}>
            📷 Change Cover
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
      </div>

      {/* Community Header */}
      <div className="comm-header">
        <div className="comm-header-left">
          <button className="comm-back-btn" onClick={() => navigate('/tribe-community')}>← Back</button>
          <div>
            <h1 className="comm-name">{community.name}</h1>
            {community.description && <p className="comm-description">{community.description}</p>}
          </div>
        </div>
        <div className="comm-header-right">
          {isActualAdmin && (
            <button className="comm-share-btn" onClick={copyJoinCode} title="Copy invite code">
              🔗 Invite Code: <strong>{community.join_code}</strong>
            </button>
          )}
          {isMember ? (
            <button className="comm-leave-btn" onClick={() => { leaveCommunity(communityId); navigate('/tribe-community'); }}>
              Leave
            </button>
          ) : (
            <button className="comm-join-btn" onClick={() => joinCommunity(communityId)}>
              Join Community
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="comm-tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={`comm-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="comm-content">
        {activeTab === 'feed' && <FeedTab communityId={communityId} isAdmin={isActualAdmin} pinnedPostId={community.pinned_post_id} onPin={handlePinPost} />}
        {activeTab === 'events' && <EventsTab communityId={communityId} isAdmin={isActualAdmin} />}
        {activeTab === 'members' && <MembersTab communityId={communityId} isAdmin={isActualAdmin} currentUserId={user?.id} />}
        {activeTab === 'chat' && <ChatTab communityId={communityId} />}
      </div>
    </div>
  );
}
