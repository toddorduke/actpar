import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePact } from '../../hooks/usePact.js';
import { usePostLikes } from '../../hooks/usePostLikes.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import CommentPanel, { useCommentState } from '../../components/common/CommentPanel.jsx';
import { supabase } from '../../lib/supabase.js';
import './PactPage.css';

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post, onLike, onViewProfile, commentState, likedIds, toggling, likeCount }) {
  const { openPanels, commentsByPost, loadingPost, togglePanel, addComment, deleteComment, commentCount } = commentState;
  const liked = likedIds?.has(post.id) ?? false;
  const isToggling = toggling?.has(post.id) ?? false;
  const badgeMap = {
    update: ['badge-update', '📊 Update'],
    win: ['badge-win', '🎉 Win'],
    challenge: ['badge-challenge', '💪 Challenge'],
    event: ['badge-event', '📅 Event'],
  };
  const type = post.post_type ?? 'update';
  const [cls, label] = badgeMap[type] || badgeMap.update;
  const count = commentCount(post.id);
  const isOpen = !!openPanels[post.id];
  const authorName = post.profiles
    ? `${post.profiles.first_name ?? ''} ${post.profiles.last_name ?? ''}`.trim() || 'Member'
    : 'Member';

  return (
    <div className="post-card">
      <div className="post-header">
        <button className="post-author-btn" onClick={() => onViewProfile(post.user_id)}>
          <Avatar url={post.profiles?.avatar_url} name={authorName} size={40} />
        </button>
        <div className="post-author-info">
          <button className="post-author-btn post-author-name" onClick={() => onViewProfile(post.user_id)}>{authorName}</button>
          <div className="post-timestamp">{timeAgo(post.created_at)}</div>
        </div>
        <span className={`post-badge ${cls}`}>{label}</span>
      </div>
      <p className="post-text">{post.content}</p>
      <div className="post-actions">
        <button
          className={`action-btn${liked ? ' active liked' : ''}`}
          onClick={() => onLike(post.id, likeCount ?? post.likes ?? 0)}
          disabled={isToggling}
        >
          <svg className="action-icon" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount ?? post.likes ?? 0}
        </button>
        <button className={`action-btn${isOpen ? ' active' : ''}`} onClick={() => togglePanel(post.id)}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {count > 0 ? count : ''} Comment{count !== 1 ? 's' : ''}
        </button>
      </div>
      {isOpen && (
        <CommentPanel
          postId={post.id}
          postType="pact"
          comments={commentsByPost[post.id] ?? []}
          loading={!!loadingPost[post.id]}
          onAdd={addComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}

function RulesList({ rules, myRole, onAdd, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const canEdit = myRole === 'founder' || myRole === 'co-lead';

  async function saveEdit() {
    if (!editText.trim()) return;
    await onUpdate(editingId, editText.trim());
    setEditingId(null);
  }

  async function saveNew() {
    if (!newRuleText.trim()) return;
    await onAdd(newRuleText.trim());
    setNewRuleText('');
    setAddingNew(false);
  }

  return (
    <div className="rules-list">
      {rules.map((rule, i) => (
        <div key={rule.id} className="rule-item">
          {editingId === rule.id ? (
            <div className="rule-edit-row">
              <input className="rule-edit-input" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus />
              <button className="rule-save-btn" onClick={saveEdit}>✓</button>
              <button className="rule-cancel-btn" onClick={() => setEditingId(null)}>✕</button>
            </div>
          ) : (
            <>
              <span className="rule-number">{i + 1}.</span>
              <span className="rule-text">{rule.rule_text}</span>
              {canEdit && (
                <div className="rule-actions">
                  <button className="rule-edit-btn" onClick={() => { setEditingId(rule.id); setEditText(rule.rule_text); }}>✎</button>
                  <button className="rule-delete-btn" onClick={() => onDelete(rule.id)}>×</button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {canEdit && (
        addingNew ? (
          <div className="rule-edit-row">
            <input className="rule-edit-input" placeholder="New rule..." value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveNew()} autoFocus />
            <button className="rule-save-btn" onClick={saveNew}>✓</button>
            <button className="rule-cancel-btn" onClick={() => setAddingNew(false)}>✕</button>
          </div>
        ) : (
          <button className="add-rule-btn" onClick={() => setAddingNew(true)}>+ Add Rule</button>
        )
      )}
    </div>
  );
}

// ── Progress Leaderboard ──────────────────────────────────────────────────────
function PactLeaderboard({ members }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    if (!members.length) return;
    const userIds = members.map((m) => m.user_id);
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    supabase
      .from('goal_progress')
      .select('user_id')
      .in('user_id', userIds)
      .gte('logged_at', monday.toISOString())
      .then(({ data }) => {
        const counts = {};
        (data ?? []).forEach((r) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
        setBoard(
          members
            .map((m) => {
              const name = m.profiles
                ? `${m.profiles.first_name ?? ''} ${m.profiles.last_name ?? ''}`.trim() || 'Member'
                : 'Member';
              return { userId: m.user_id, name, count: counts[m.user_id] || 0 };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      });
  }, [members.length]);

  if (!board.length || board.every((m) => m.count === 0)) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="sidebar-card">
      <h3 className="sidebar-title">📈 This Week's Logs</h3>
      <div className="leaderboard-list">
        {board.map((item, i) => (
          <div key={item.userId} className="leaderboard-item">
            <span className="leaderboard-rank">{medals[i] ?? `${i + 1}.`}</span>
            <span className="leaderboard-name">{item.name}</span>
            <span className="leaderboard-count">{item.count} log{item.count !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── No Pact Screen ────────────────────────────────────────────────────────────
function NoPactScreen({ openPacts, onCreate, onJoinOpen, onJoinCode }) {
  return (
    <div className="no-pact-screen">
      <div className="no-pact-icon">🔐</div>
      <h1 className="no-pact-title">The Pact</h1>
      <p className="no-pact-subtitle">
        Your inner circle. Invite-only, rule-driven, and built on one foundation: you check on each other — no exceptions.
      </p>
      <div className="no-pact-actions">
        <button className="create-pact-btn" onClick={onCreate}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create a Pact
        </button>
        <button className="join-pact-btn" onClick={onJoinCode}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Join with Invite Code
        </button>
      </div>

      {openPacts.length > 0 && (
        <div className="open-pacts-section">
          <h2 className="open-pacts-title">Open Pacts — Join Freely</h2>
          <div className="open-pacts-list">
            {openPacts.map((p) => (
              <div key={p.id} className="open-pact-card">
                <div className="open-pact-icon">🔓</div>
                <div className="open-pact-info">
                  <div className="open-pact-name">{p.name}</div>
                  {p.description && <div className="open-pact-desc">{p.description}</div>}
                </div>
                <button className="open-pact-join-btn" onClick={() => onJoinOpen(p.id, p.name)}>
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PactPage() {
  const [activePactId, setActivePactId] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const commentState = useCommentState();

  const {
    myPacts, pact, members, rules, posts, myRole, openPacts, loading,
    switchPact, createPact, joinPactOpen, joinPactByCode, toggleOpen,
    addRule, updateRule, deleteRule, createPost,
    removeMember, updateMemberRole, leavePact, deletePact,
  } = usePact(activePactId);

  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { likedIds, toggleLike, toggling } = usePostLikes(postIds, 'pact');
  const [localLikeCounts, setLocalLikeCounts] = useState({});

  function handlePactLike(id, currentLikes) {
    const post = posts.find((p) => p.id === id);
    toggleLike(id, currentLikes, (postId, newCount) =>
      setLocalLikeCounts((prev) => ({ ...prev, [postId]: newCount })),
      post?.user_id ?? null
    );
  }

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mobilePactTab, setMobilePactTab] = useState('feed');

  function handleSwitchPact(id) {
    setActivePactId(id);
    switchPact(id);
    setFeedFilter('all');
  }

  const [pactName, setPactName] = useState('');
  const [pactDesc, setPactDesc] = useState('');
  const [pactIsOpen, setPactIsOpen] = useState(true);
  const [draftRules, setDraftRules] = useState([
    'Check in on each other — no one goes quiet without someone reaching out.',
    '',
    '',
  ]);
  const [creating, setCreating] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [postType, setPostType] = useState('update');
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredPosts = feedFilter === 'all'
    ? posts
    : posts.filter((p) => {
        const t = p.post_type ?? 'update';
        if (feedFilter === 'updates') return t === 'update';
        if (feedFilter === 'wins') return t === 'win';
        if (feedFilter === 'challenges') return t === 'challenge';
        return true;
      });

  async function handleCreate(e) {
    e.preventDefault();
    if (!pactName.trim()) return;
    setCreating(true);
    const { error } = await createPact({ name: pactName.trim(), description: pactDesc.trim(), initialRules: draftRules, is_open: pactIsOpen });
    setCreating(false);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowCreateModal(false);
    setPactName(''); setPactDesc(''); setDraftRules(['', '', '']);
  }

  async function handleJoinCode(e) {
    e.preventDefault();
    setJoining(true);
    const { error, pactName: name } = await joinPactByCode(inviteCode);
    setJoining(false);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowJoinModal(false);
    setInviteCode('');
    toast(`You joined "${name}"! Welcome to The Pact. 🔥`, 'success');
  }

  async function handleJoinOpen(pactId, name) {
    const { error } = await joinPactOpen(pactId);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    toast(`You joined "${name}"! Welcome to The Pact. 🔥`, 'success');
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSubmitting(true);
    const { error } = await createPost({ content: postContent, post_type: postType });
    setSubmitting(false);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowPostModal(false);
    setPostContent('');
    setPostType('update');
  }

  async function handleToggleOpen(val) {
    const { error } = await toggleOpen(val);
    if (error) toast(`Error: ${error.message}`, 'error');
  }

  async function handleRemoveMember(userId, name) {
    const { error } = await removeMember(userId);
    if (error) toast(`Error: ${error.message}`, 'error');
    else toast(`${name} removed from the pact.`, 'success');
  }

  async function handleRoleChange(userId, currentRole) {
    const newRole = currentRole === 'co-lead' ? 'member' : 'co-lead';
    const { error } = await updateMemberRole(userId, newRole);
    if (error) toast(`Error: ${error.message}`, 'error');
    else toast(newRole === 'co-lead' ? 'Promoted to Co-Lead ⭐' : 'Demoted to Member', 'success');
  }

  async function handleLeavePact() {
    const { error } = await leavePact();
    if (error) toast(`Error: ${error.message}`, 'error');
    else toast('You left the pact.', 'success');
  }

  async function handleDeletePact() {
    const { error } = await deletePact();
    if (error) toast(`Error: ${error.message}`, 'error');
    else { setConfirmDelete(false); toast('Pact dissolved.', 'success'); }
  }

  function copyInviteCode() {
    if (!pact?.invite_code) return;
    navigator.clipboard.writeText(pact.invite_code);
    toast('Invite code copied!', 'success');
  }

  if (loading) {
    return <div className="pact-page"><div className="pact-loading">Loading your pact...</div></div>;
  }

  if (!pact) {
    return (
      <div className="pact-page">
        <NoPactScreen
          openPacts={openPacts}
          onCreate={() => setShowCreateModal(true)}
          onJoinOpen={handleJoinOpen}
          onJoinCode={() => setShowJoinModal(true)}
        />

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Create Your Pact</h2>
                <button className="close-modal" onClick={() => setShowCreateModal(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form className="modal-body" onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Pact Name</label>
                  <input type="text" className="input-field" placeholder="e.g., The Iron Circle" value={pactName} onChange={(e) => setPactName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="post-textarea" rows="3" placeholder="What is this pact about?" value={pactDesc} onChange={(e) => setPactDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Access</label>
                  <div className="access-toggle-row">
                    <button type="button" className={`access-btn${pactIsOpen ? ' active' : ''}`} onClick={() => setPactIsOpen(true)}>
                      🔓 Open — anyone can join
                    </button>
                    <button type="button" className={`access-btn${!pactIsOpen ? ' active' : ''}`} onClick={() => setPactIsOpen(false)}>
                      🔒 Closed — invite code only
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Rules <span className="label-hint">(you can edit these later)</span></label>
                  {draftRules.map((rule, i) => (
                    <div key={i} className="draft-rule-row">
                      <span className="draft-rule-num">{i + 1}.</span>
                      <input
                        type="text"
                        className={`input-field draft-rule-input${i === 0 ? ' foundation-rule' : ''}`}
                        placeholder={i === 0 ? 'Foundation rule — how will you check on each other?' : `Rule ${i + 1}...`}
                        value={rule}
                        onChange={(e) => { const u = [...draftRules]; u[i] = e.target.value; setDraftRules(u); }}
                      />
                      {i === 0
                        ? <span className="foundation-rule-pin" title="Every pact starts with this rule">📌</span>
                        : <button type="button" className="remove-rule-btn" onClick={() => setDraftRules(draftRules.filter((_, idx) => idx !== i))}>×</button>
                      }
                    </div>
                  ))}
                  <button type="button" className="add-draft-rule-btn" onClick={() => setDraftRules([...draftRules, ''])}>+ Add another rule</button>
                </div>
                <button type="submit" className="submit-btn" disabled={creating}>{creating ? 'Creating...' : 'Create Pact 🔐'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Join by code Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowJoinModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Join a Pact</h2>
                <button className="close-modal" onClick={() => setShowJoinModal(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form className="modal-body" onSubmit={handleJoinCode}>
                <p className="modal-intro">Enter the invite code shared with you by the pact founder.</p>
                <div className="form-group">
                  <label>Invite Code</label>
                  <input type="text" className="input-field" placeholder="e.g., a3f9b2c1d4" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
                </div>
                <button type="submit" className="submit-btn" disabled={joining}>{joining ? 'Joining...' : 'Join Pact'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Inside a Pact ─────────────────────────────────────────────────────────
  const isFounder = myRole === 'founder';

  return (
    <div className="pact-page">

      {/* Pact Switcher Tabs */}
      {myPacts.length > 0 && (
        <div className="pact-switcher">
          {myPacts.map((p) => (
            <button
              key={p.id}
              className={`pact-switcher-tab${(pact?.id === p.id) ? ' active' : ''}`}
              onClick={() => handleSwitchPact(p.id)}
            >
              🔐 {p.name}
              <span className={`pact-role-badge${p.myRole === 'founder' ? ' founder' : ''}`}>
                {p.myRole === 'founder' ? '👑' : p.myRole === 'co-lead' ? '⭐' : ''}
                {p.myRole}
              </span>
            </button>
          ))}
          <button className="pact-switcher-new" onClick={() => setShowCreateModal(true)}>
            + New Pact
          </button>
        </div>
      )}

      <section className="pact-header">
        <div className="pact-banner" />
        <div className="pact-icon">🔐</div>
        <div className="pact-info">
          <div className="invite-badge">
            <svg fill="currentColor" viewBox="0 0 20 20" width="14" height="14">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {pact.is_open ? '🔓 Open' : '🔒 Invite Only'} · {myRole === 'founder' ? '👑 Founder' : myRole === 'co-lead' ? '⭐ Co-Lead' : 'Member'}
          </div>
          <h1 className="pact-name">{pact.name}</h1>
          {pact.description && <p className="pact-description">{pact.description}</p>}
          <div className="pact-stats">
            <div className="stat"><span className="stat-number">{members.length}</span><span className="stat-label">Members</span></div>
            <div className="stat"><span className="stat-number">{rules.length}</span><span className="stat-label">Rules</span></div>
            <div className="stat"><span className="stat-number">{posts.length}</span><span className="stat-label">Posts</span></div>
          </div>

          <div className="pact-header-actions">
            {/* Invite code always visible */}
            <div className="invite-code-row">
              <span className="invite-code-label">Invite Code:</span>
              <code className="invite-code-value">{pact.invite_code}</code>
              <button className="invite-btn" onClick={copyInviteCode}>Copy</button>
            </div>

            {/* Founder-only: open/closed toggle */}
            {isFounder && (
              <div className="access-toggle-row">
                <button
                  type="button"
                  className={`access-btn${pact.is_open ? ' active' : ''}`}
                  onClick={() => handleToggleOpen(true)}
                >
                  🔓 Open
                </button>
                <button
                  type="button"
                  className={`access-btn${!pact.is_open ? ' active' : ''}`}
                  onClick={() => handleToggleOpen(false)}
                >
                  🔒 Closed
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile-only section tabs */}
      <div className="pact-mobile-tabs">
        {[['feed', '📝 Feed'], ['members', '👥 Members'], ['info', '📊 Info']].map(([tab, label]) => (
          <button
            key={tab}
            className={`pact-mobile-tab${mobilePactTab === tab ? ' active' : ''}`}
            onClick={() => setMobilePactTab(tab)}
          >{label}</button>
        ))}
      </div>

      <div className={`pact-grid mob-tab-${mobilePactTab}`}>
        <aside className="left-sidebar">
          <button className="create-post-btn" onClick={() => setShowPostModal(true)}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </button>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Members ({members.length})
            </h3>
            <div className="members-list">
              {members.map((m) => {
                const name = m.profiles ? `${m.profiles.first_name ?? ''} ${m.profiles.last_name ?? ''}`.trim() || 'Member' : 'Member';
                const badge = m.role === 'founder' ? '👑' : m.role === 'co-lead' ? '⭐' : '';
                const isMe = m.user_id === pact?.created_by || m.role === 'founder';
                const canManage = isFounder && !isMe;
                return (
                  <div key={m.id} className="member-item">
                    <button className="member-avatar-btn" onClick={() => navigate(`/profile/${m.profiles?.id ?? m.user_id}`)}>
                      <Avatar url={m.profiles?.avatar_url} name={name} size={38} />
                      {badge && <span className="member-badge">{badge}</span>}
                    </button>
                    <div className="member-info">
                      <button className="member-name-btn" onClick={() => navigate(`/profile/${m.profiles?.id ?? m.user_id}`)}>{name}</button>
                      <div className="member-role">{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</div>
                    </div>
                    {canManage && (
                      <div className="member-admin-btns">
                        <button
                          className="member-role-btn"
                          title={m.role === 'co-lead' ? 'Demote to Member' : 'Promote to Co-Lead'}
                          onClick={() => handleRoleChange(m.user_id, m.role)}
                        >
                          {m.role === 'co-lead' ? '↓' : '⭐'}
                        </button>
                        <button
                          className="member-remove-btn"
                          title="Remove from pact"
                          onClick={() => handleRemoveMember(m.user_id, name)}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isFounder ? (
              <button className="dissolve-pact-btn" onClick={() => setConfirmDelete(true)}>
                Dissolve Pact
              </button>
            ) : (
              <button className="leave-pact-btn" onClick={handleLeavePact}>
                Leave Pact
              </button>
            )}
          </div>

          <div className="sidebar-card rules-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Pact Rules
            </h3>
            {rules.length === 0 && <p className="rules-empty">{isFounder ? 'No rules yet — add one below.' : 'No rules set yet.'}</p>}
            <RulesList rules={rules} myRole={myRole} onAdd={addRule} onUpdate={updateRule} onDelete={deleteRule} />
          </div>
        </aside>

        <main className="main-feed">
          <button className="create-post-btn mob-feed-post-btn" onClick={() => setShowPostModal(true)}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>
          <div className="feed-header">
            <div className="feed-tabs">
              {[['all', 'All Posts'], ['updates', '📊 Updates'], ['wins', '🎉 Wins'], ['challenges', '💪 Challenges']].map(([val, label]) => (
                <button key={val} className={`feed-tab${feedFilter === val ? ' active' : ''}`} onClick={() => setFeedFilter(val)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="feed-container">
            {filteredPosts.length === 0 ? (
              <div className="feed-empty-pact">
                {posts.length === 0 ? 'No posts yet — be the first to share!' : 'No posts match this filter.'}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handlePactLike}
                  onViewProfile={(uid) => navigate(`/profile/${uid}`)}
                  commentState={commentState}
                  likedIds={likedIds}
                  toggling={toggling}
                  likeCount={localLikeCounts[post.id] ?? post.likes ?? 0}
                />
              ))
            )}
          </div>
        </main>

        <aside className="right-sidebar">
          <PactLeaderboard members={members} />

          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Pact Stats</h3>
            <div className="stats-grid-pact">
              <div className="stat-item"><div className="stat-number">{members.length}</div><div className="stat-label">Members</div></div>
              <div className="stat-item"><div className="stat-number">{posts.length}</div><div className="stat-label">Posts</div></div>
              <div className="stat-item"><div className="stat-number">{rules.length}</div><div className="stat-label">Rules</div></div>
              <div className="stat-item"><div className="stat-number">{posts.filter((p) => p.post_type === 'win').length}</div><div className="stat-label">Wins</div></div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">🏆 Top Contributors</h3>
            <div className="top-contributors">
              {(() => {
                const counts = {};
                posts.forEach((p) => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });
                return members
                  .map((m) => ({ m, count: counts[m.user_id] || 0 }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map(({ m, count }) => {
                    const name = m.profiles ? `${m.profiles.first_name ?? ''} ${m.profiles.last_name ?? ''}`.trim() || 'Member' : 'Member';
                    return (
                      <div key={m.id} className="contributor-item">
                        <Avatar url={m.profiles?.avatar_url} name={name} size={32} />
                        <div>
                          <div className="contributor-name">{name}</div>
                          <div className="contributor-posts">{count} post{count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </aside>
      </div>

      {showPostModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPostModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Share with The Pact</h2>
              <button className="close-modal" onClick={() => setShowPostModal(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form className="modal-body" onSubmit={handlePost}>
              <div className="form-group">
                <label>Post Type</label>
                <div className="post-type-buttons">
                  {[['update', '📊 Update'], ['win', '🎉 Win'], ['challenge', '💪 Challenge'], ['event', '📅 Event']].map(([val, lbl]) => (
                    <button key={val} type="button" className={`type-btn${postType === val ? ' active' : ''}`} onClick={() => setPostType(val)}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>What's on your mind?</label>
                <textarea className="post-textarea" rows="5" placeholder="Share a win, update, or challenge your pact..." value={postContent} onChange={(e) => setPostContent(e.target.value)} required />
              </div>
              <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Posting...' : 'Post to Pact 🔐'}</button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Dissolve Pact?</h2>
              <button className="close-modal" onClick={() => setConfirmDelete(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', marginBottom: 24 }}>
                This will permanently delete <strong>{pact?.name}</strong>, all its rules, and all posts. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="submit-btn" style={{ background: '#ef4444' }} onClick={handleDeletePact}>
                  Yes, Dissolve
                </button>
                <button className="join-pact-btn" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
