import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConnections } from '../../hooks/useConnections.js';
import { useBlock } from '../../hooks/useBlock.js';
import { useCustomCategories } from '../../hooks/useCustomCategories.js';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import SparkModal, { getSparksUsedToday } from '../../components/common/SparkModal.jsx';
import './ConnectionsPage.css';

const SUGGESTED_PACTS = [
  { title: 'The Phoenix Circle', members: 8 },
  { title: 'Morning Warriors', members: 5 },
];

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
    const myName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') || 'Your connection';
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
    const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.toLowerCase();
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

          {/* Incoming requests */}
          {(incomingConnects.length > 0 || incomingSparks.length > 0) && (
            <div className="mn-section">
              <h3 className="mn-section-title">Pending — Incoming</h3>
              {incomingConnects.map((req) => {
                const p = req.profiles;
                const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Someone';
                return (
                  <div key={req.requester_id} className="mn-row">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                        {name}
                      </button>
                      <span className="mn-badge connect-badge">✓ Connection Request</span>
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
                const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Someone';
                return (
                  <div key={req.requester_id} className="mn-row mn-row-spark">
                    <div className="mn-avatar-locked"><span>⚡</span></div>
                    <div className="mn-info">
                      <span className="mn-name-locked">Hidden — upgrade to reveal</span>
                      <span className="mn-badge spark-badge">⚡ Spark with message</span>
                      <span className="mn-spark-msg-blur">"{req.spark_message?.slice(0, 40)}…"</span>
                    </div>
                    <button className="mn-premium-btn">Go Premium</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accepted connections */}
          <div className="mn-section">
            <h3 className="mn-section-title">Your Connections ({acceptedConnections.length})</h3>
            {acceptedConnections.length === 0 && (
              <p className="mn-empty">No connections yet — start sparking!</p>
            )}
            <div className="mn-connections-list">
              {acceptedConnections.map((c) => {
                const name = c.partnerProfile
                  ? `${c.partnerProfile.first_name ?? ''} ${c.partnerProfile.last_name ?? ''}`.trim()
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
                      <div className="mn-conn-meta">
                        {c.partnerProfile?.alter_ego_name && (
                          <span className="mn-conn-ego">⚡ {c.partnerProfile.alter_ego_name}</span>
                        )}
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

          {/* Sent pending sparks */}
          {sentSparks.length > 0 && (
            <div className="mn-section">
              <h3 className="mn-section-title">Sparks Sent — Waiting ({sentSparks.length})</h3>
              {sentSparks.map((req) => {
                const p = req.profiles;
                const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Someone';
                return (
                  <div key={req.receiver_id} className="mn-row">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                        {name}
                      </button>
                      <span className="mn-badge spark-badge">⚡ Spark sent</span>
                      {req.spark_message && (
                        <span className="mn-sent-msg">"{req.spark_message}"</span>
                      )}
                    </div>
                    <button className="mn-cancel-btn" onClick={() => cancelRequest(req.receiver_id)} title="Cancel spark">
                      ✗
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sent pending regular connects */}
          {sentConnects.length > 0 && (
            <div className="mn-section">
              <h3 className="mn-section-title">Requests Sent — Waiting ({sentConnects.length})</h3>
              {sentConnects.map((req) => {
                const p = req.profiles;
                const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Someone';
                return (
                  <div key={req.receiver_id} className="mn-row">
                    <button className="mn-avatar-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                      <Avatar url={p?.avatar_url} name={name} size={44} />
                    </button>
                    <div className="mn-info">
                      <button className="mn-name-btn" onClick={() => navigate(`/profile/${req.receiver_id}`)}>
                        {name}
                      </button>
                      <span className="mn-badge connect-badge">✓ Request pending</span>
                    </div>
                    <button className="mn-cancel-btn" onClick={() => cancelRequest(req.receiver_id)} title="Cancel request">
                      ✗
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Find a Coach tab — redirect to coach discovery page */}
      {mainTab === 'coaches' && (
        <div className="find-coach-tab">
          <div className="find-coach-promo">
            <div className="find-coach-icon">🏅</div>
            <h2 className="find-coach-title">Work with a Coach</h2>
            <p className="find-coach-desc">Browse certified coaches for fitness, nutrition, mindset, and more. Book sessions directly in the app.</p>
            <button className="find-coach-cta" onClick={() => navigate('/coaches')}>
              Browse All Coaches →
            </button>
          </div>
        </div>
      )}

      {mainTab === 'connections' && <div className="connections-grid">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search by Name
            </h3>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search profiles..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button className="search-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
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
                    ? `${req.profiles.first_name ?? ''} ${req.profiles.last_name ?? ''}`.trim()
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
              <p className="spark-description" style={{ color: '#9ca3af' }}>No sparks yet</p>
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
                <div className="spark-paywall">
                  <span>🔒</span>
                  <span>Upgrade to see who sparked you &amp; read their message</span>
                  <button className="spark-upgrade-btn">Go Premium</button>
                </div>
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

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Quick Filters
            </h3>
            <div className="filter-buttons">
              {[['all', 'All'], ['personal', '👤 Personal'], ['coach', '🏋️ Coach']].map(([f, lbl]) => (
                <button
                  key={f}
                  className={`filter-btn${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">Gender</h3>
            <div className="filter-buttons">
              {[['all', 'All'], ['male', '♂ Male'], ['female', '♀ Female']].map(([g, lbl]) => (
                <button
                  key={g}
                  className={`filter-btn${genderFilter === g ? ' active' : ''}`}
                  onClick={() => setGenderFilter(g)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Looking For
            </h3>
            <p className="lf-filter-hint">Find partners seeking the same thing</p>

            {/* Custom category search */}
            <div className="lf-search-wrap">
              <input
                type="text"
                className="lf-search-input"
                placeholder="Search or add a focus area…"
                value={lfSearch}
                onChange={(e) => setLfSearch(e.target.value)}
              />
              {lfSearch && (
                <button className="lf-search-clear" onClick={() => setLfSearch('')}>×</button>
              )}
            </div>

            {lfSearch.trim().length > 0 && (
              <div className="lf-suggestions">
                {lfSuggestions.map((c) => (
                  <button
                    key={c.id}
                    className="lf-suggestion-chip"
                    onClick={() => handleCategorySelect(c.name)}
                  >
                    {c.name}
                    {c.status === 'active'
                      ? <span className="lf-cat-badge lf-cat-active">popular</span>
                      : <span className="lf-cat-badge lf-cat-pending">{c.use_count}/3</span>
                    }
                  </button>
                ))}
                {lfSearch.trim().length >= 3 && !hasExactMatch && (
                  <button
                    className="lf-create-chip"
                    onClick={() => handleCategorySelect(lfSearch.trim())}
                  >
                    + Create "{lfSearch.trim()}" as a category
                  </button>
                )}
                {lfSuggestions.length === 0 && lfSearch.trim().length < 3 && (
                  <p className="lf-search-hint">Keep typing to search…</p>
                )}
              </div>
            )}

            <div className="lf-filter-chips">
              {LF_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`lf-filter-chip${lfFilter === cat ? ' active' : ''}`}
                  onClick={() => toggleLfFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {lfFilter && (
              <button className="lf-clear-btn" onClick={() => setLfFilter('')}>
                Clear filter ×
              </button>
            )}
          </div>
        </aside>

        {/* Card Stack */}
        <main className="card-stack-container">
          {/* Mobile-only compact filter bar */}
          <div className="mob-filter-bar">
            <input
              type="text"
              className="mob-search-input"
              placeholder="Search profiles..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div className="mob-quick-filters">
              {[['all', 'All'], ['personal', 'Personal'], ['coach', 'Coach']].map(([f, lbl]) => (
                <button
                  key={f}
                  className={`mob-filter-chip${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >{lbl}</button>
              ))}
              <span className="mob-filter-divider" />
              {[['all', 'All ⚤'], ['male', '♂'], ['female', '♀']].map(([g, lbl]) => (
                <button
                  key={g}
                  className={`mob-filter-chip${genderFilter === g ? ' active' : ''}`}
                  onClick={() => setGenderFilter(g)}
                >{lbl}</button>
              ))}
            </div>
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
                              {`${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Unknown'}
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
                          <div className="card-view-profile-hint">
                            Tap card or click below to view full profile →
                          </div>
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
                      ? `${c.partnerProfile.first_name ?? ''} ${c.partnerProfile.last_name ?? ''}`.trim()
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
                <p style={{ color: '#6b7280', fontSize: '0.9em', marginTop: 0 }}>No connections yet</p>
              )}
              {acceptedConnections.slice(0, 5).map((c) => {
                const name = c.partnerProfile
                  ? `${c.partnerProfile.first_name ?? ''} ${c.partnerProfile.last_name ?? ''}`.trim()
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

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Suggested Pacts
            </h3>
            <div className="pacts-list">
              {SUGGESTED_PACTS.map((p) => (
                <div key={p.title} className="pact-item">
                  <div className="pact-item-title">{p.title}</div>
                  <div className="pact-item-members">{p.members} members</div>
                </div>
              ))}
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
      </div>}
    </div>
    </>
  );
}
