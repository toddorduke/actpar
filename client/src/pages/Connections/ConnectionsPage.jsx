import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConnections } from '../../hooks/useConnections.js';
import { useBlock } from '../../hooks/useBlock.js';
import { useCustomCategories } from '../../hooks/useCustomCategories.js';
import { usePartnerships } from '../../hooks/usePartnerships.js';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import SparkModal, { getSparksUsedToday } from '../../components/common/SparkModal.jsx';
import { getDisplayName } from '../../utils/displayName.js';
import './ConnectionsPage.css';

// Local hours 6 AM–11 PM converted to UTC for the deadline picker
const DEADLINE_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  const utcHour = d.getUTCHours();
  const display = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
  return { localHour: h, utcHour, display };
});

const TIER_LABELS = { 1: 'Top Priority', 2: 'Important', 3: 'Foundation' };

const LF_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    browseProfiles,
    incomingSparks,
    incomingConnects,
    sentSparks,
    sentConnects,
    acceptedConnections,
    loading,
    sendSpark,
    acceptSpark,
    declineSpark,
    cancelRequest,
    skipProfile,
  } = useConnections();

  const [mainTab, setMainTab] = useState('connections');
  const { blockedIds } = useBlock();
  const [partnerStats, setPartnerStats] = useState({});
  const [cheerSent, setCheerSent] = useState(new Set());
  const { partnerships, partnerSide, proposeJourney, acceptJourney, declineJourney } = usePartnerships();

  // My goals for the journey modals
  const [myGoals, setMyGoals] = useState([]);
  const fetchMyGoals = () => {
    if (!user) return;
    supabase.from('goals').select('id, title, goal_type, tier').eq('user_id', user.id).eq('is_active', true)
      .then(({ data }) => setMyGoals(data ?? []));
  };
  useEffect(() => { fetchMyGoals(); }, [user]);

  // Inline new-goal form state (shared by both modals)
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTier, setNewGoalTier] = useState(2);
  const [savingGoal, setSavingGoal] = useState(false);

  async function handleCreateGoal() {
    if (!newGoalTitle.trim() || savingGoal) return;
    setSavingGoal(true);
    const { data } = await supabase.from('goals').insert({
      user_id: user.id,
      title: newGoalTitle.trim(),
      tier: newGoalTier,
      goal_type: 'habit',
      is_active: true,
    }).select('id, title, goal_type, tier').single();
    if (data) {
      setMyGoals((prev) => [...prev, data]);
      setJourneyGoalId(data.id);
      setShowNewGoal(false);
      setNewGoalTitle('');
      setNewGoalTier(2);
    }
    setSavingGoal(false);
  }

  // Journey modal state
  const [journeyModal, setJourneyModal] = useState(null); // { partnerId, partnerName, partnerAvatar }
  const [acceptModal, setAcceptModal] = useState(null);   // { partnershipId, partnerName, partnerGoalTitle }
  const [journeyGoalId, setJourneyGoalId] = useState('');
  const [journeyDeadlineHour, setJourneyDeadlineHour] = useState('');
  const [proposing, setProposing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  async function handleProposeJourney() {
    if (!journeyModal || proposing) return;
    setProposing(true);
    let deadlineUtcHour = null;
    let deadlineDisplay = null;
    if (journeyDeadlineHour !== '') {
      const opt = DEADLINE_OPTIONS.find((o) => o.localHour === parseInt(journeyDeadlineHour));
      if (opt) { deadlineUtcHour = opt.utcHour; deadlineDisplay = opt.display; }
    }
    await proposeJourney(journeyModal.partnerId, journeyGoalId || null, deadlineUtcHour, deadlineDisplay);
    setProposing(false);
    setJourneyModal(null);
    setJourneyGoalId('');
    setJourneyDeadlineHour('');
    setShowNewGoal(false);
    setNewGoalTitle('');
  }

  async function handleAcceptJourney() {
    if (!acceptModal || accepting) return;
    setAccepting(true);
    await acceptJourney(acceptModal.partnershipId, journeyGoalId || null);
    setAccepting(false);
    setAcceptModal(null);
    setJourneyGoalId('');
    setJourneyDeadlineHour('');
    setShowNewGoal(false);
    setNewGoalTitle('');
  }

  function journeyWithPartner(partnerId) {
    return partnerships.find((p) =>
      (p.requester_id === user?.id && p.receiver_id === partnerId) ||
      (p.receiver_id === user?.id && p.requester_id === partnerId)
    );
  }

  // Incoming journey invites (pending, receiver = me)
  const incomingJourneys = partnerships.filter(
    (p) => p.status === 'pending' && p.receiver_id === user?.id
  );

  useEffect(() => {
    if (mainTab !== 'my-network' || acceptedConnections.length === 0) return;
    const partnerIds = acceptedConnections.map((c) => c.partnerId).filter(Boolean);
    if (partnerIds.length === 0) return;
    supabase
      .from('goals')
      .select('user_id, day_count, last_checked_in')
      .in('user_id', partnerIds)
      .eq('is_active', true)
      .then(({ data }) => {
        const stats = {};
        for (const g of data ?? []) {
          if (!stats[g.user_id]) stats[g.user_id] = { bestStreak: 0, activeGoals: 0, lastCheckin: null };
          stats[g.user_id].activeGoals++;
          if ((g.day_count ?? 0) > stats[g.user_id].bestStreak) stats[g.user_id].bestStreak = g.day_count ?? 0;
          if (g.last_checked_in && (!stats[g.user_id].lastCheckin || g.last_checked_in > stats[g.user_id].lastCheckin)) {
            stats[g.user_id].lastCheckin = g.last_checked_in;
          }
        }
        setPartnerStats(stats);
      });
  }, [mainTab, acceptedConnections.length]);

  function lastActiveLabel(lastCheckin) {
    if (!lastCheckin) return null;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastCheckin === today) return 'Active today ✓';
    if (lastCheckin === yesterday) return 'Active yesterday';
    const days = Math.floor((Date.now() - new Date(lastCheckin)) / 86400000);
    return `Active ${days}d ago`;
  }

  async function sendCheer(partnerId, partnerName) {
    const myName = getDisplayName(user?.user_metadata, 'Your connection');
    await supabase.from('notifications').insert({
      user_id: partnerId,
      actor_id: user.id,
      type: 'cheer',
      body: `${myName} sent you a cheer! Keep it up! 🔥`,
    });
    setCheerSent((prev) => new Set([...prev, partnerId]));
  }
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [lfFilter, setLfFilter] = useState('');
  const [lfSearch, setLfSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [mobileConnOpen, setMobileConnOpen] = useState(false);
  const [sparkModalOpen, setSparkModalOpen] = useState(false);
  const sparksRemaining = Math.max(0, 5 - getSparksUsedToday());

  const { search: searchCats, createOrAdopt } = useCustomCategories(user?.id);
  const lfSuggestions = useMemo(() => searchCats(lfSearch), [lfSearch, searchCats]);
  const hasExactMatch = lfSuggestions.some(
    (c) => c.name.toLowerCase() === lfSearch.toLowerCase().trim(),
  );

  async function handleCategorySelect(name) {
    await createOrAdopt(name);
    setLfFilter(name);
    setLfSearch('');
  }

  function toggleLfFilter(cat) {
    setLfFilter((prev) => (prev === cat ? '' : cat));
  }

  const visibleProfiles = browseProfiles.filter((p) => {
    const name = getDisplayName(p).toLowerCase();
    const alterEgo = (p.alter_ego_name ?? '').toLowerCase();
    const lfTags = (p.looking_for ?? []).join(' ').toLowerCase();
    const matchesSearch = !searchValue
      || name.includes(searchValue.toLowerCase())
      || alterEgo.includes(searchValue.toLowerCase())
      || lfTags.includes(searchValue.toLowerCase());
    const matchesFilter = activeFilter === 'all'
      || (p.account_type ?? '').toLowerCase() === activeFilter;
    const matchesLf = !lfFilter
      || (p.looking_for ?? []).some((t) => t.toLowerCase() === lfFilter.toLowerCase());
    const matchesGender = genderFilter === 'all'
      || (p.gender ?? '').toLowerCase() === genderFilter.toLowerCase();
    const notBlocked = !blockedIds.has(p.id);
    return matchesSearch && matchesFilter && matchesLf && matchesGender && notBlocked;
  });

  const currentProfile = visibleProfiles[0];

  async function handleConnect() {
    if (!currentProfile) return;
    await sendSpark(currentProfile.id); // no message = regular connect
  }

  function handleOpenSparkModal() {
    if (!currentProfile) return;
    setSparkModalOpen(true);
  }

  function handleSkip() {
    if (!currentProfile) return;
    skipProfile(currentProfile.id);
  }

  return (
    <>
    {sparkModalOpen && currentProfile && (
      <SparkModal
        profile={currentProfile}
        onSend={(msg) => sendSpark(currentProfile.id, msg)}
        onClose={() => setSparkModalOpen(false)}
      />
    )}

    {/* Propose journey modal */}
    {journeyModal && (
      <div className="journey-modal-overlay" onClick={(e) => e.target === e.currentTarget && setJourneyModal(null)}>
        <div className="journey-modal">
          <button className="journey-modal-close" onClick={() => setJourneyModal(null)}>×</button>
          <div className="journey-modal-header">
            <Avatar url={journeyModal.partnerAvatar} name={journeyModal.partnerName} size={56} />
            <div>
              <h2 className="journey-modal-title">Start a Journey Together</h2>
              <p className="journey-modal-subtitle">with <strong>{journeyModal.partnerName}</strong></p>
            </div>
          </div>
          <p className="journey-modal-hint">Which goal do you want <strong>{journeyModal.partnerName}</strong> to hold you accountable for?</p>
          <div className="journey-goal-list">
            {myGoals.filter((g) => g.goal_type !== 'numeric').map((g) => (
              <button
                key={g.id}
                className={`journey-goal-item${journeyGoalId === g.id ? ' selected' : ''}`}
                onClick={() => setJourneyGoalId((prev) => prev === g.id ? '' : g.id)}
              >
                <span className="journey-goal-title">{g.title}</span>
                <span className="journey-goal-tier">{TIER_LABELS[g.tier] ?? 'Foundation'}</span>
              </button>
            ))}
          </div>
          {!showNewGoal ? (
            <button className="journey-add-goal-btn" onClick={() => setShowNewGoal(true)}>＋ Add a new goal</button>
          ) : (
            <div className="journey-new-goal-form">
              <input
                className="journey-new-goal-input"
                placeholder="Goal title (e.g. Run every morning)"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                autoFocus
              />
              <select className="journey-new-goal-tier" value={newGoalTier} onChange={(e) => setNewGoalTier(Number(e.target.value))}>
                <option value={1}>Top Priority</option>
                <option value={2}>Important</option>
                <option value={3}>Foundation</option>
              </select>
              <div className="journey-new-goal-actions">
                <button className="journey-new-goal-save" onClick={handleCreateGoal} disabled={!newGoalTitle.trim() || savingGoal}>
                  {savingGoal ? 'Saving...' : 'Save Goal'}
                </button>
                <button className="journey-new-goal-cancel" onClick={() => { setShowNewGoal(false); setNewGoalTitle(''); }}>Cancel</button>
              </div>
            </div>
          )}
          {!journeyGoalId && !showNewGoal && (
            <p className="journey-skip-hint">No goal selected — that's OK, you can add one later.</p>
          )}
          <div className="journey-deadline-section">
            <label className="journey-deadline-label">Daily check-in deadline <span className="journey-deadline-optional">(optional)</span></label>
            <select
              className="journey-deadline-select"
              value={journeyDeadlineHour}
              onChange={(e) => setJourneyDeadlineHour(e.target.value)}
            >
              <option value="">No deadline</option>
              {DEADLINE_OPTIONS.map((opt) => (
                <option key={opt.localHour} value={String(opt.localHour)}>{opt.display}</option>
              ))}
            </select>
            <p className="journey-deadline-hint">
              {journeyDeadlineHour
                ? `We'll remind you both if you haven't checked in by ${DEADLINE_OPTIONS.find((o) => o.localHour === parseInt(journeyDeadlineHour))?.display} each day.`
                : "Set a daily deadline and we'll both get a reminder if you haven't logged in yet."}
            </p>
          </div>
          <button className="journey-propose-btn" onClick={handleProposeJourney} disabled={proposing}>
            {proposing ? 'Sending...' : 'Propose Journey →'}
          </button>
        </div>
      </div>
    )}

    {/* Accept journey modal */}
    {acceptModal && (
      <div className="journey-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAcceptModal(null)}>
        <div className="journey-modal">
          <button className="journey-modal-close" onClick={() => setAcceptModal(null)}>×</button>
          <div className="journey-modal-header">
            <div className="journey-modal-rocket">🚀</div>
            <div>
              <h2 className="journey-modal-title">Journey Invitation</h2>
              <p className="journey-modal-subtitle">from <strong>{acceptModal.partnerName}</strong></p>
            </div>
          </div>
          {acceptModal.partnerGoalTitle && (
            <p className="journey-modal-hint">
              <strong>{acceptModal.partnerName}</strong> is committing to <em>"{acceptModal.partnerGoalTitle}"</em>.
            </p>
          )}
          {acceptModal.deadlineDisplay && (
            <p className="journey-modal-hint journey-deadline-info">
              ⏰ Proposed daily deadline: <strong>{acceptModal.deadlineDisplay}</strong> — we'll remind you both if you haven't checked in by then.
            </p>
          )}
          <p className="journey-modal-hint">Pick a goal to share back <span style={{ color: '#9ca3af' }}>(optional)</span>:</p>
          <div className="journey-goal-list">
            {myGoals.filter((g) => g.goal_type !== 'numeric').map((g) => (
              <button
                key={g.id}
                className={`journey-goal-item${journeyGoalId === g.id ? ' selected' : ''}`}
                onClick={() => setJourneyGoalId((prev) => prev === g.id ? '' : g.id)}
              >
                <span className="journey-goal-title">{g.title}</span>
                <span className="journey-goal-tier">{TIER_LABELS[g.tier] ?? 'Foundation'}</span>
              </button>
            ))}
          </div>
          {!showNewGoal ? (
            <button className="journey-add-goal-btn" onClick={() => setShowNewGoal(true)}>＋ Add a new goal</button>
          ) : (
            <div className="journey-new-goal-form">
              <input
                className="journey-new-goal-input"
                placeholder="Goal title (e.g. Run every morning)"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                autoFocus
              />
              <select className="journey-new-goal-tier" value={newGoalTier} onChange={(e) => setNewGoalTier(Number(e.target.value))}>
                <option value={1}>Top Priority</option>
                <option value={2}>Important</option>
                <option value={3}>Foundation</option>
              </select>
              <div className="journey-new-goal-actions">
                <button className="journey-new-goal-save" onClick={handleCreateGoal} disabled={!newGoalTitle.trim() || savingGoal}>
                  {savingGoal ? 'Saving...' : 'Save Goal'}
                </button>
                <button className="journey-new-goal-cancel" onClick={() => { setShowNewGoal(false); setNewGoalTitle(''); }}>Cancel</button>
              </div>
            </div>
          )}
          <div className="journey-accept-actions">
            <button className="journey-propose-btn" onClick={handleAcceptJourney} disabled={accepting}>
              {accepting ? 'Accepting...' : 'Accept Journey 🚀'}
            </button>
            <button className="journey-decline-link" onClick={() => { declineJourney(acceptModal.partnershipId); setAcceptModal(null); }}>
              Decline
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="connections-page">
      <section className="page-header">
        <h1 className="page-title">Sparks</h1>
        <p className="page-subtitle">Find goal-driven people who match your journey</p>
      </section>

      {/* Main tab switcher */}
      <div className="connections-main-tabs">
        <button
          className={`connections-main-tab${mainTab === 'connections' ? ' active' : ''}`}
          onClick={() => setMainTab('connections')}
        >
          ⚡ Discover
        </button>
        <button
          className={`connections-main-tab${mainTab === 'my-network' ? ' active' : ''}`}
          onClick={() => setMainTab('my-network')}
        >
          👥 My Network
          {(incomingSparks.length + incomingConnects.length) > 0 && (
            <span className="connections-main-tab-badge">{incomingSparks.length + incomingConnects.length}</span>
          )}
        </button>
      </div>

      {/* My Network tab */}
      {mainTab === 'my-network' && (
        <div className="my-network-page">

          {/* Status legend */}
          <div className="mn-legend">
            <span className="mn-legend-item"><span className="mn-legend-dot mn-legend-dot--connected" />Connected · you're linked up</span>
            <span className="mn-legend-item"><span className="mn-legend-dot mn-legend-dot--waiting" />Awaiting · ball's in their court</span>
            <span className="mn-legend-item"><span className="mn-legend-dot mn-legend-dot--journey" />🚀 Journey · holding each other accountable</span>
          </div>

          {/* Incoming journey invites */}
          {incomingJourneys.length > 0 && (
            <div className="mn-section mn-journey-invites">
              <h3 className="mn-section-title">🚀 Someone wants to journey with you</h3>
              {incomingJourneys.map((p) => {
                const requesterName = getDisplayName(p.requester, 'Someone');
                return (
                  <div key={p.id} className="mn-journey-invite-row">
                    <Avatar url={p.requester?.avatar_url} name={requesterName} size={44} />
                    <div className="mn-journey-invite-body">
                      <div className="mn-journey-invite-text">
                        <strong>{requesterName}</strong> wants to start an accountability journey with you
                        {p.goal1 && <> on <em>"{p.goal1.title}"</em></>}
                      </div>
                    </div>
                    <div className="mn-journey-invite-actions">
                      <button
                        className="mn-journey-accept-btn"
                        onClick={() => {
                          setJourneyGoalId('');
                          setAcceptModal({ partnershipId: p.id, partnerName: requesterName, partnerGoalTitle: p.goal1?.title ?? null, deadlineDisplay: p.deadline_display ?? null });
                        }}
                      >Accept</button>
                      <button className="mn-journey-decline-btn" onClick={() => declineJourney(p.id)}>Decline</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Incoming connection requests */}
          {(incomingConnects.length > 0 || incomingSparks.length > 0) && (
            <div className="mn-section">
              <h3 className="mn-section-title">They Reached Out to You</h3>
              {incomingConnects.map((req) => {
                const p = req.profiles;
                const name = getDisplayName(p, 'Someone');
                return (
                  <div key={req.requester_id} className="mn-row">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                        {name}
                      </button>
                      <span className="mn-status-line">Sent you a connection request — accept to link up</span>
                    </div>
                    <div className="mn-actions">
                      <button className="mn-accept-btn" onClick={() => acceptSpark(req.requester_id)}>Accept</button>
                      <button className="mn-decline-btn" onClick={() => declineSpark(req.requester_id)}>Decline</button>
                    </div>
                  </div>
                );
              })}
              {incomingSparks.map((req) => {
                const p = req.profiles;
                const name = getDisplayName(p, 'Someone');
                return (
                  <div key={req.requester_id} className="mn-row mn-row-spark">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                        {name}
                      </button>
                      <span className="mn-status-line">⚡ Sparked you with a personal message</span>
                      {req.spark_message && <span className="mn-spark-msg">"{req.spark_message.slice(0, 60)}{req.spark_message.length > 60 ? '…' : ''}"</span>}
                    </div>
                    <button className="mn-accept-btn" onClick={() => acceptConnection(req.requester_id)}>Accept</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accepted connections */}
          <div className="mn-section">
            <h3 className="mn-section-title">Connected ({acceptedConnections.length})</h3>
            {acceptedConnections.length === 0 && (
              <p className="mn-empty">
                {(sentSparks.length + sentConnects.length) > 0
                  ? 'Nobody has accepted yet — check back soon or try Discover to reach more people.'
                  : 'No connections yet — head to Discover and send a spark to someone!'}
              </p>
            )}
            <div className="mn-connections-list">
              {acceptedConnections.map((c) => {
                const name = c.partnerProfile
                  ? getDisplayName(c.partnerProfile)
                  : 'Connected User';
                const stats = partnerStats[c.partnerId];
                const isToday = stats?.lastCheckin === new Date().toISOString().split('T')[0];
                return (
                  <div key={c.id} className="mn-conn-row">
                    <button className="mn-conn-avatar-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                      <Avatar url={c.partnerProfile?.avatar_url} name={name} size={46} />
                    </button>

                    <div className="mn-conn-body">
                      <button className="mn-conn-name-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                        {name}
                      </button>
                      <span className="mn-status-line mn-status-line--connected">
                        ✅ Connected
                        {c.partnerProfile?.alter_ego_name ? ` · ⚡ ${c.partnerProfile.alter_ego_name}` : ''}
                      </span>
                      <div className="mn-conn-meta">
                        {stats && (
                          <>
                            {stats.bestStreak > 0 && (
                              <span className="mn-conn-pill mn-conn-pill--streak">🔥 {stats.bestStreak}d</span>
                            )}
                            <span className="mn-conn-pill">🎯 {stats.activeGoals} goal{stats.activeGoals !== 1 ? 's' : ''}</span>
                            {lastActiveLabel(stats.lastCheckin) && (
                              <span className={`mn-conn-pill${isToday ? ' mn-conn-pill--today' : ''}`}>
                                {lastActiveLabel(stats.lastCheckin)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mn-conn-actions">
                      {(() => {
                        const j = journeyWithPartner(c.partnerId);
                        if (!j) return (
                          <button
                            className="mn-conn-journey-btn"
                            onClick={() => { setJourneyGoalId(''); setJourneyModal({ partnerId: c.partnerId, partnerName: name, partnerAvatar: c.partnerProfile?.avatar_url }); }}
                          >🚀 Start Journey</button>
                        );
                        if (j.status === 'pending') return (
                          <span className="mn-conn-journey-pending">
                            {j.requester_id === user?.id ? '⏳ Invite Sent' : '🚀 Invited You'}
                          </span>
                        );
                        return (
                          <span className="mn-conn-journey-active">🚀 On a Journey</span>
                        );
                      })()}
                      <button
                        className={`mn-conn-cheer-btn${cheerSent.has(c.partnerId) ? ' sent' : ''}`}
                        onClick={() => !cheerSent.has(c.partnerId) && sendCheer(c.partnerId, name)}
                        disabled={cheerSent.has(c.partnerId)}
                      >
                        {cheerSent.has(c.partnerId) ? '🔥 Cheered!' : '🔥 Cheer'}
                      </button>
                      <button className="mn-conn-icon-btn" title="View profile" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </button>
                      <button className="mn-conn-icon-btn mn-conn-icon-btn--msg" title="Message" onClick={() => navigate(`/messages?with=${c.partnerId}`)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sent pending — sparks + connects merged */}
          {(sentSparks.length + sentConnects.length) > 0 && (
            <div className="mn-section">
              <h3 className="mn-section-title">You Reached Out ({sentSparks.length + sentConnects.length})</h3>
              <p className="mn-section-hint">Ball's in their court — you'll be notified when they accept.</p>
              {[...sentSparks, ...sentConnects].map((req) => {
                const p = req.profiles;
                const name = getDisplayName(p, 'Someone');
                const isSpark = !!req.spark_message;
                return (
                  <div key={req.receiver_id} className="mn-row">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                        {name}
                      </button>
                      <span className="mn-status-line">
                        {isSpark ? '⚡ You sparked them with a message — awaiting their response' : '✓ You sent a connection request — awaiting their response'}
                      </span>
                      {req.spark_message && (
                        <span className="mn-sent-msg">"{req.spark_message}"</span>
                      )}
                    </div>
                    <button className="mn-cancel-btn" onClick={() => cancelRequest(req.receiver_id)} title="Cancel">
                      ✗
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {mainTab === 'connections' && <><div className="connections-grid">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search by Name or Alter Ego
            </h3>
            <div className="search-input-wrap">
              <svg className="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search profiles..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          {/* Connection Requests (no message) — visible to all */}
          {incomingConnects.length > 0 && (
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Connection Requests
                <span className="spark-count">{incomingConnects.length}</span>
              </h3>
              <p className="spark-description">These people want to connect with you.</p>
              <div className="incoming-requests-list">
                {incomingConnects.map((req) => {
                  const name = req.profiles
                    ? getDisplayName(req.profiles)
                    : 'Someone';
                  return (
                    <div key={req.requester_id} className="incoming-req-item">
                      <button className="incoming-req-avatar-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                        <Avatar url={req.profiles?.avatar_url} name={name} size={36} />
                      </button>
                      <button className="incoming-req-info incoming-req-name-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                        <div className="incoming-req-name">{name}</div>
                        {req.profiles?.alter_ego_name && (
                          <div className="incoming-req-ego">⚡ {req.profiles.alter_ego_name}</div>
                        )}
                      </button>
                      <div className="incoming-req-actions">
                        <button className="req-accept-btn" onClick={() => acceptSpark(req.requester_id)} title="Accept">✓</button>
                        <button className="req-decline-btn" onClick={() => declineSpark(req.requester_id)} title="Decline">✗</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sparks (with personal message) — behind paywall */}
          <div className="sidebar-card spark-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sparks ⚡
              <span className="spark-count">{incomingSparks.length}</span>
            </h3>
            <p className="spark-description" style={{ marginBottom: 6 }}>
              Sparks include a personal message from the sender — they put extra effort in.
            </p>
            {incomingSparks.length === 0 ? (
              <p className="spark-description" style={{ color: '#d1d5db' }}>No sparks yet</p>
            ) : (
              <div className="sparks-list">
                {incomingSparks.slice(0, 3).map((spark) => {
                  const sp = spark.profiles;
                  const spName = getDisplayName(sp, 'Someone');
                  return (
                    <div key={spark.requester_id} className="spark-item">
                      <Avatar url={sp?.avatar_url} name={spName} size={36} />
                      <div className="spark-info">
                        <div className="spark-name">{spName}</div>
                        {sp?.alter_ego_name && <div className="spark-alter">⚡ {sp.alter_ego_name}</div>}
                      </div>
                      <button className="spark-accept-btn" onClick={() => acceptConnection(spark.requester_id)}>Accept</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Your Stats
            </h3>
            <div className="stats-grid">
              <div className="stat-item"><div className="stat-number">{acceptedConnections.length}</div><div className="stat-label">Connections</div></div>
              <div className="stat-item"><div className="stat-number">{incomingSparks.length}</div><div className="stat-label">⚡ Sparks</div></div>
              <div className="stat-item"><div className="stat-number">{incomingConnects.length}</div><div className="stat-label">✓ Requests</div></div>
            </div>
          </div>

        </aside>

        {/* Card Stack */}
        <main className="card-stack-container">
          {/* Mobile-only search bar */}
          <div className="mob-filter-bar">
            <input
              type="text"
              className="mob-search-input"
              placeholder="Search profiles..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <div className="empty-title">Loading profiles...</div>
            </div>
          ) : (
            <div className="card-stack">
              {visibleProfiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <div className="empty-title">You've seen everyone!</div>
                  <p className="empty-message">Check back later for new goal-driven individuals.</p>
                </div>
              ) : (
                visibleProfiles.slice(0, 3).map((profile, i) => (
                  <div
                    key={profile.id}
                    className={`profile-card${i === 0 ? ' profile-card-top' : ''}`}
                    style={{
                      transform: `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
                      zIndex: 10 - i,
                    }}
                    onClick={i === 0 ? () => navigate(`/profile/${profile.id}`) : undefined}
                  >
                    {i === 0 && (
                      <>
                        <div className="card-header">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.first_name}
                              className="card-header-media"
                            />
                          ) : profile.featured_video_url ? (
                            <video
                              src={profile.featured_video_url}
                              className="card-header-video"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <div className="card-header-fallback">
                              <div className="card-avatar" />
                            </div>
                          )}
                        </div>
                        <div className="card-content">
                          <div className="card-name-row">
                            <div className="profile-name">
                              {getDisplayName(profile, 'Unknown')}
                            </div>
                            <span className="card-type-badge">{profile.account_type ?? 'Personal'}</span>
                          </div>
                          <div className="card-meta-row">
                            {profile.alter_ego_name && (
                              <span className="profile-alter-ego">⚡ {profile.alter_ego_name}</span>
                            )}
                            {profile.age && (
                              <span className="card-age">{profile.age} yrs</span>
                            )}
                          </div>
                          {profile.matchReason && (
                            <div className="card-match-reason">
                              ✨ {profile.matchReason}
                            </div>
                          )}
                          {profile.city && (
                            <div className="profile-city">📍 {profile.city}</div>
                          )}
                          {profile.tagline && (
                            <div className="card-section">
                              <div className="card-section-label">Their Journey</div>
                              <p className="card-tagline">"{profile.tagline}"</p>
                            </div>
                          )}
                          {profile.bio && (
                            <div className="card-section">
                              <div className="card-section-label">About Me</div>
                              <p className="card-bio">{profile.bio}</p>
                            </div>
                          )}
                          {profile.goals?.length > 0 && (
                            <div className="card-section">
                              <div className="card-section-label">Working On</div>
                              <div className="card-goals">
                                {profile.goals.slice(0, 3).map((g, idx) => (
                                  <span key={idx} className="card-goal-chip">{g.title}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {profile.looking_for?.length > 0 && (
                            <div className="card-section">
                              <div className="card-section-label">Looking For</div>
                              <div className="card-goals">
                                {profile.looking_for.slice(0, 4).map((tag, idx) => (
                                  <span key={idx} className="card-lf-chip">{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            className="card-view-profile-btn"
                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${profile.id}`); }}
                          >
                            View Full Profile →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && visibleProfiles.length > 0 && (
            <>
              <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                <button className="action-btn skip-btn" onClick={handleSkip} title="Skip — not for me">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="30" height="30">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  className="action-btn spark-send-btn"
                  onClick={handleOpenSparkModal}
                  title={sparksRemaining > 0 ? `Send a Spark with a message (${sparksRemaining} left today)` : 'No sparks left today'}
                  disabled={sparksRemaining === 0}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="30" height="30">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <button className="action-btn connect-btn" onClick={handleConnect} title="Connect — send a request">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="30" height="30">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
              <div className="swipe-instructions">
                <span title="Send a connection request">✓ Connect</span>
                {' • '}
                <span title="Not interested">✗ Skip</span>
                {' • '}
                <span title={`Send a personal message with your request (${sparksRemaining}/5 left today)`}>⚡ Spark with message</span>
                {' • '}
                <span title="Tap the card to view their full profile">👆 Tap card to view</span>
              </div>
            </>
          )}

          {/* Mobile-only: My Connections accordion */}
          <div className="mob-connections-row">
            <button
              className="mob-connections-toggle"
              onClick={() => setMobileConnOpen((o) => !o)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              My Connections ({acceptedConnections.length})
              <span className="mob-toggle-arrow">{mobileConnOpen ? '▲' : '▼'}</span>
            </button>
            {mobileConnOpen && (
              <div className="mob-connections-list">
                {acceptedConnections.length === 0 ? (
                  <p className="mob-conn-empty">No connections yet — start sparking!</p>
                ) : (
                  acceptedConnections.slice(0, 8).map((c) => {
                    const name = c.partnerProfile
                      ? getDisplayName(c.partnerProfile)
                      : 'Connected User';
                    return (
                      <div key={c.id} className="mob-conn-item">
                        <button className="mob-conn-avatar-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                          <Avatar url={c.partnerProfile?.avatar_url} name={name} size={36} />
                        </button>
                        <button className="mob-conn-name-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                          {name}
                        </button>
                        <button
                          className="mob-conn-msg-btn"
                          onClick={() => navigate(`/messages?with=${c.partnerId}`)}
                          title="Message"
                        >
                          💬
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Your Connections
            </h3>
            <div className="connections-list">
              {acceptedConnections.length === 0 && (
                <p style={{ color: '#d1d5db', fontSize: '0.9em', marginTop: 0 }}>No connections yet</p>
              )}
              {acceptedConnections.slice(0, 5).map((c) => {
                const name = c.partnerProfile
                  ? getDisplayName(c.partnerProfile)
                  : 'Connected User';
                return (
                  <div key={c.id} className="connection-item">
                    <button className="connection-avatar-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                      <Avatar url={c.partnerProfile?.avatar_url} name={name} size={38} />
                    </button>
                    <div className="connection-info">
                      <button className="connection-name-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                        {name}
                      </button>
                    </div>
                    <button
                      className="connection-msg-btn"
                      onClick={() => navigate(`/messages?with=${c.partnerId}`)}
                      title="Send message"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              {acceptedConnections.length > 5 && (
                <button className="connections-see-all-btn" onClick={() => setMainTab('my-network')}>
                  See all {acceptedConnections.length} connections →
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-card tips-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Connection Tips
            </h3>
            <div className="tips-list">
              <div className="tip-item">💡 Be genuine in your profile</div>
              <div className="tip-item">⚡ Send sparks to show extra interest</div>
              <div className="tip-item">🎯 Focus on aligned goals</div>
              <div className="tip-item">💬 Start conversations meaningfully</div>
            </div>
          </div>

          {(sentSparks.length > 0 || sentConnects.length > 0) && (
            <div className="sidebar-card">
              <h3 className="sidebar-title">Sent — Waiting</h3>
              <div className="sent-counts">
                {sentSparks.length > 0 && (
                  <div className="sent-count-row">
                    <span className="sent-count-label">⚡ Sparks</span>
                    <span className="sent-count-num spark">{sentSparks.length}</span>
                  </div>
                )}
                {sentConnects.length > 0 && (
                  <div className="sent-count-row">
                    <span className="sent-count-label">✓ Requests</span>
                    <span className="sent-count-num connect">{sentConnects.length}</span>
                  </div>
                )}
                <button className="sent-view-all-btn" onClick={() => setMainTab('my-network')}>
                  View all →
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile-only: left sidebar items */}
      <div className="mob-left-cards">
        <div className="sidebar-card">
          <h3 className="sidebar-title">
            <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search by Name or Alter Ego
          </h3>
          <div className="search-input-wrap">
            <svg className="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search profiles..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {incomingConnects.length > 0 && (
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Connection Requests
              <span className="spark-count">{incomingConnects.length}</span>
            </h3>
            <p className="spark-description">These people want to connect with you.</p>
            <div className="incoming-requests-list">
              {incomingConnects.map((req) => {
                const name = req.profiles ? getDisplayName(req.profiles) : 'Someone';
                return (
                  <div key={req.requester_id} className="incoming-req-item">
                    <button className="incoming-req-avatar-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <Avatar url={req.profiles?.avatar_url} name={name} size={36} />
                    </button>
                    <button className="incoming-req-info incoming-req-name-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <div className="incoming-req-name">{name}</div>
                      {req.profiles?.alter_ego_name && (
                        <div className="incoming-req-ego">⚡ {req.profiles.alter_ego_name}</div>
                      )}
                    </button>
                    <div className="incoming-req-actions">
                      <button className="req-accept-btn" onClick={() => acceptSpark(req.requester_id)} title="Accept">✓</button>
                      <button className="req-decline-btn" onClick={() => declineSpark(req.requester_id)} title="Decline">✗</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sidebar-card spark-card">
          <h3 className="sidebar-title">
            <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Sparks ⚡
            <span className="spark-count">{incomingSparks.length}</span>
          </h3>
          <p className="spark-description" style={{ marginBottom: 6 }}>
            Sparks include a personal message from the sender — they put extra effort in.
          </p>
          {incomingSparks.length === 0 ? (
            <p className="spark-description" style={{ color: '#d1d5db' }}>No sparks yet</p>
          ) : (
            <div className="sparks-locked">
              {incomingSparks.slice(0, 3).map((spark) => (
                <div key={spark.requester_id} className="spark-item spark-item-locked">
                  <div className="spark-avatar-blur" />
                  <div className="spark-info">
                    <div className="spark-name-blur" />
                    <div className="spark-alter-blur" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-card">
          <h3 className="sidebar-title">
            <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Your Stats
          </h3>
          <div className="stats-grid">
            <div className="stat-item"><div className="stat-number">{acceptedConnections.length}</div><div className="stat-label">Connections</div></div>
            <div className="stat-item"><div className="stat-number">{incomingSparks.length}</div><div className="stat-label">⚡ Sparks</div></div>
            <div className="stat-item"><div className="stat-number">{incomingConnects.length}</div><div className="stat-label">✓ Requests</div></div>
          </div>
        </div>
      </div>

      {/* Mobile-only: Your Connections + Connection Tips */}
      <div className="mob-right-cards">
        <div className="sidebar-card">
          <h3 className="sidebar-title">
            <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Your Connections
          </h3>
          <div className="connections-list">
            {acceptedConnections.length === 0 && (
              <p style={{ color: '#d1d5db', fontSize: '0.9em', marginTop: 0 }}>No connections yet</p>
            )}
            {acceptedConnections.slice(0, 5).map((c) => {
              const name = c.partnerProfile ? getDisplayName(c.partnerProfile) : 'Connected User';
              return (
                <div key={c.id} className="connection-item">
                  <button className="connection-avatar-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                    <Avatar url={c.partnerProfile?.avatar_url} name={name} size={38} />
                  </button>
                  <div className="connection-info">
                    <button className="connection-name-btn" onClick={() => navigate(`/profile/${c.partnerId}`)}>
                      {name}
                    </button>
                  </div>
                  <button
                    className="connection-msg-btn"
                    onClick={() => navigate(`/messages?with=${c.partnerId}`)}
                    title="Send message"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {acceptedConnections.length > 5 && (
              <button className="connections-see-all-btn" onClick={() => setMainTab('my-network')}>
                See all {acceptedConnections.length} connections →
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-card tips-card">
          <h3 className="sidebar-title">
            <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Connection Tips
          </h3>
          <div className="tips-list">
            <div className="tip-item">💡 Be genuine in your profile</div>
            <div className="tip-item">⚡ Send sparks to show extra interest</div>
            <div className="tip-item">🎯 Focus on aligned goals</div>
            <div className="tip-item">💬 Start conversations meaningfully</div>
          </div>
        </div>
      </div>
      </>}
    </div>
    </>
  );
}
