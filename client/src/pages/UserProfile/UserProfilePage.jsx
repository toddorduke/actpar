import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { createNotification } from '../../hooks/useNotifications.js';
import { useBlock } from '../../hooks/useBlock.js';
import ReportModal from '../../components/common/ReportModal.jsx';
import './UserProfilePage.css';

const TIER_LABELS = { 1: 'Top Priority', 2: 'Important', 3: 'Foundation' };

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [affirmations, setAffirmations] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const { blockUser, unblockUser, isBlocked } = useBlock();

  useEffect(() => {
    if (!userId || userId === user?.id) {
      navigate('/profile');
      return;
    }
    loadProfile();
  }, [userId, user]);

  async function loadProfile() {
    setLoading(true);

    const [
      { data: prof },
      { data: goalData },
      { data: postData },
      { data: connData },
      { data: reflData },
      { data: affData },
      { data: journalData },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, alter_ego_name, city, tagline, bio, avatar_url, featured_video_url, account_type, looking_for, affirmation_start_date, age')
        .eq('id', userId)
        .single(),
      supabase
        .from('goals')
        .select('id, title, tier, day_count, progress, goal_type, target_value, target_unit, target_period')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('tier'),
      supabase
        .from('tribe_posts')
        .select('id, content, post_type, likes, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status')
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .maybeSingle(),
      supabase
        .from('reflections')
        .select('id, question, answer, created_at, type')
        .eq('user_id', userId)
        .eq('is_public', true)
        .eq('type', 'reflection')
        .order('created_at', { ascending: false }),
      supabase
        .from('reflections')
        .select('id, answer, created_at')
        .eq('user_id', userId)
        .eq('is_public', true)
        .eq('type', 'affirmation')
        .order('created_at', { ascending: false }),
      supabase
        .from('journal_entries')
        .select('id, subject, body, created_at')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
    ]);

    setProfile(prof ?? null);
    setGoals(goalData ?? []);
    setPosts(postData ?? []);
    setReflections(reflData ?? []);
    setAffirmations(affData ?? []);
    setJournalEntries(journalData ?? []);

    if (connData) {
      setConnectionId(connData.id);
      if (connData.status === 'accepted') {
        setConnectionStatus('accepted');
      } else if (connData.status === 'pending') {
        setConnectionStatus(connData.requester_id === user.id ? 'pending_sent' : 'pending_received');
      }
    }

    setLoading(false);
  }

  async function handleSendSpark() {
    setActing(true);
    const { error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, receiver_id: userId, status: 'pending' });
    if (error) {
      toast(`Couldn't send spark: ${error.message}`, 'error');
    } else {
      setConnectionStatus('pending_sent');
      const { data: me } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      const name = me ? `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() : 'Someone';
      createNotification({ userId, actorId: user.id, type: 'connection_request', body: `${name} sent you a spark ⚡` });
      toast('Spark sent! ⚡', 'success');
    }
    setActing(false);
  }

  async function handleBlock() {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';
    const blocked = isBlocked(userId);
    if (blocked) {
      await unblockUser(userId);
      toast(`${name} unblocked.`, 'success');
    } else {
      await blockUser(userId);
      toast(`${name} blocked. They can no longer message or spark you.`, 'success');
    }
    setShowBlockConfirm(false);
  }

  async function handleAcceptSpark() {
    setActing(true);
    const { error } = await supabase
      .update({ status: 'accepted' })
      .eq('requester_id', userId)
      .eq('receiver_id', user.id);
    if (error) {
      toast(`Error: ${error.message}`, 'error');
    } else {
      setConnectionStatus('accepted');
      const { data: me } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      const name = me ? `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() : 'Someone';
      createNotification({ userId, actorId: user.id, type: 'connection_accepted', body: `${name} accepted your spark ⚡ You're now connected!` });
      toast('Connected! ⚡', 'success');
    }
    setActing(false);
  }

  if (loading) return <div className="up-page"><div className="up-loading">Loading profile...</div></div>;
  if (!profile) return <div className="up-page"><div className="up-loading">Profile not found.</div></div>;

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'User';
  const affirmationDay = profile.affirmation_start_date
    ? Math.floor((Date.now() - new Date(profile.affirmation_start_date)) / 86400000) + 1
    : null;

  const tabs = [
    { id: 'overview', label: `Goals (${goals.length})` },
    { id: 'posts', label: `Posts (${posts.length})` },
    ...(reflections.length > 0 ? [{ id: 'reflections', label: `Reflections (${reflections.length})` }] : []),
    ...(affirmations.length > 0 ? [{ id: 'affirmations', label: `Affirmations (${affirmations.length})` }] : []),
    ...(journalEntries.length > 0 ? [{ id: 'journal', label: `Journal (${journalEntries.length})` }] : []),
  ];

  return (
    <div className="up-page">
      <div className="up-container">
        {/* Back */}
        <button className="up-back-btn" onClick={() => navigate(-1)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header card */}
        <div className="up-header-card">
          {/* Featured media */}
          {(profile.avatar_url || profile.featured_video_url) && (
            <div className="up-featured-media">
              {profile.featured_video_url ? (
                <video src={profile.featured_video_url} className="up-featured-video" autoPlay muted loop playsInline />
              ) : (
                <img src={profile.avatar_url} alt={fullName} className="up-featured-img" />
              )}
            </div>
          )}

          <div className="up-header-top">
            <div className="up-avatar-wrap">
              <Avatar url={profile.avatar_url} name={fullName} size={90} />
            </div>
            <div className="up-header-info">
              <h1 className="up-name">{fullName}</h1>
              {profile.alter_ego_name && <div className="up-alter-ego">⚡ {profile.alter_ego_name}</div>}
              {profile.age && <div className="up-age">{profile.age} years old</div>}
              {profile.city && <div className="up-city">📍 {profile.city}</div>}
              {profile.account_type && <span className="up-account-badge">{profile.account_type}</span>}
              {profile.tagline && <p className="up-tagline">"{profile.tagline}"</p>}
            </div>

            {/* Action buttons */}
            <div className="up-actions">
              {connectionStatus === 'accepted' && (
                <button className="up-action-btn up-msg-btn" onClick={() => navigate(`/messages?with=${userId}`)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              )}
              {connectionStatus === null && (
                <button className="up-action-btn up-spark-btn" onClick={handleSendSpark} disabled={acting}>
                  ⚡ Send Spark
                </button>
              )}
              {connectionStatus === 'pending_sent' && (
                <button className="up-action-btn up-pending-btn" disabled>Spark Sent ✓</button>
              )}
              {connectionStatus === 'pending_received' && (
                <button className="up-action-btn up-accept-btn" onClick={handleAcceptSpark} disabled={acting}>
                  ⚡ Accept Spark
                </button>
              )}
              <div className="up-safety-actions">
                <button className="up-safety-btn" onClick={() => setShowReport(true)} title="Report user">🚩 Report</button>
                <button
                  className={`up-safety-btn${isBlocked(userId) ? ' unblock' : ''}`}
                  onClick={() => setShowBlockConfirm(true)}
                >
                  {isBlocked(userId) ? '🔓 Unblock' : '🚫 Block'}
                </button>
              </div>
            </div>
          </div>

          {/* About Me */}
          {profile.bio && (
            <div className="up-about-me">
              <div className="up-section-label">About Me</div>
              <p className="up-bio">{profile.bio}</p>
            </div>
          )}

          {/* Looking For */}
          {(profile.looking_for ?? []).length > 0 && (
            <div className="up-looking-for">
              <div className="up-section-label">Looking for an accountability partner in:</div>
              <div className="up-lf-chips">
                {profile.looking_for.map((tag) => (
                  <span key={tag} className="up-lf-chip">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats strip */}
          <div className="up-stats-strip">
            <div className="up-stat">
              <div className="up-stat-value">{goals.length}</div>
              <div className="up-stat-label">Active Goals</div>
            </div>
            {affirmationDay && (
              <div className="up-stat">
                <div className="up-stat-value">Day {Math.min(affirmationDay, 30)}</div>
                <div className="up-stat-label">Affirmation Challenge</div>
              </div>
            )}
            <div className="up-stat">
              <div className="up-stat-value">{posts.length}</div>
              <div className="up-stat-label">Posts</div>
            </div>
            {goals.some(g => g.goal_type !== 'numeric') && (
              <div className="up-stat">
                <div className="up-stat-value">
                  {Math.max(...goals.filter(g => g.goal_type !== 'numeric').map(g => g.day_count || 0))}
                </div>
                <div className="up-stat-label">Best Streak</div>
              </div>
            )}
            {reflections.length > 0 && (
              <div className="up-stat">
                <div className="up-stat-value">{reflections.length}</div>
                <div className="up-stat-label">Reflections</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              className={`up-tab${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Goals tab */}
        {activeTab === 'overview' && (
          <div className="up-goals-grid">
            {goals.length === 0 && <p className="up-empty">No active goals yet.</p>}
            {goals.map((goal) => {
              const isNumeric = goal.goal_type === 'numeric';
              const progress = isNumeric
                ? goal.target_value ? Math.min(((goal.progress ?? 0) / goal.target_value) * 100, 100) : 0
                : Math.min(((goal.day_count || 0) / 90) * 100, 100);
              const meta = isNumeric
                ? goal.target_value
                  ? `${goal.progress ?? 0} / ${goal.target_value} ${goal.target_unit ?? ''}`.trim()
                  : `${goal.progress ?? 0} ${goal.target_unit ?? ''}`.trim()
                : `Day ${goal.day_count ?? 0}`;
              return (
                <div key={goal.id} className={`up-goal-card tier-${goal.tier ?? 3}`}>
                  <div className="up-goal-header">
                    <span className="up-goal-title">{goal.title}</span>
                    <span className="up-goal-tier">{TIER_LABELS[goal.tier ?? 3]}</span>
                  </div>
                  <div className="up-goal-meta">{meta}</div>
                  <div className="up-goal-bar">
                    <div className="up-goal-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="up-posts">
            {posts.length === 0 && <p className="up-empty">No posts yet.</p>}
            {posts.map((post) => (
              <div key={post.id} className="up-post-card">
                <div className="up-post-header">
                  <Avatar url={profile.avatar_url} name={fullName} size={36} />
                  <div className="up-post-meta">
                    <span className="up-post-author">{fullName}</span>
                    <span className="up-post-time">{timeAgo(post.created_at)}</span>
                  </div>
                </div>
                <p className="up-post-content">{post.content}</p>
                <div className="up-post-likes">♥ {post.likes ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reflections tab */}
        {activeTab === 'reflections' && (
          <div className="up-reflections">
            {reflections.length === 0 && <p className="up-empty">No public reflections shared yet.</p>}
            {reflections.map((r) => (
              <div key={r.id} className="up-reflection-card">
                <div className="up-reflection-q">{r.question}</div>
                <p className="up-reflection-a">{r.answer}</p>
                <div className="up-reflection-time">{timeAgo(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Affirmations tab */}
        {activeTab === 'affirmations' && (
          <div className="up-reflections">
            {affirmations.length === 0 && <p className="up-empty">No public affirmations shared yet.</p>}
            {affirmations.map((a) => (
              <div key={a.id} className="up-affirmation-card">
                <div className="up-affirmation-icon">✨</div>
                <p className="up-affirmation-text">{a.answer}</p>
                <div className="up-reflection-time">{timeAgo(a.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Journal tab */}
        {activeTab === 'journal' && (
          <div className="up-posts">
            {journalEntries.length === 0 && <p className="up-empty">No public journal entries shared yet.</p>}
            {journalEntries.map((entry) => (
              <div key={entry.id} className="up-post-card">
                {entry.subject && <div className="up-journal-subject">{entry.subject}</div>}
                <p className="up-post-content">{entry.body}</p>
                <div className="up-post-likes">{timeAgo(entry.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReport && <ReportModal reportedUserId={userId} onClose={() => setShowReport(false)} />}

      {showBlockConfirm && (
        <div className="up-block-overlay" onClick={() => setShowBlockConfirm(false)}>
          <div className="up-block-box" onClick={e => e.stopPropagation()}>
            <h3>{isBlocked(userId) ? 'Unblock this person?' : 'Block this person?'}</h3>
            <p>
              {isBlocked(userId)
                ? 'They will be able to see your profile and send you sparks again.'
                : "They won't be able to message you or send sparks. You can unblock them anytime."}
            </p>
            <div className="up-block-actions">
              <button className="up-block-confirm-btn" onClick={handleBlock}>
                {isBlocked(userId) ? 'Yes, Unblock' : 'Yes, Block'}
              </button>
              <button className="up-block-cancel-btn" onClick={() => setShowBlockConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
