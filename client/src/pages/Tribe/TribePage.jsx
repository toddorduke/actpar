import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useCommunities } from '../../hooks/useCommunities.js';
import { useProfile } from '../../hooks/useProfile.js';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import './TribePage.css';

export default function TribePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { myCommunities, communities, myMemberships, createCommunity, joinCommunity } = useCommunities();
  const toast = useToast();

  const [memberCount, setMemberCount] = useState(null);
  const [showCreateComm, setShowCreateComm] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [creatingComm, setCreatingComm] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count != null) setMemberCount(count);
    });
  }, []);

  const discoverCommunities = useMemo(() => {
    const lookingFor = (profile?.looking_for ?? []).map((s) => s.toLowerCase());
    const unjoined = communities.filter((c) => !myMemberships.includes(c.id));
    if (!lookingFor.length) return unjoined;
    return unjoined.sort((a, b) => {
      const score = (c) => lookingFor.reduce((n, kw) =>
        n + ((c.name ?? '').toLowerCase().includes(kw) || (c.description ?? '').toLowerCase().includes(kw) ? 1 : 0), 0
      );
      return score(b) - score(a);
    });
  }, [communities, myMemberships, profile]);

  const filteredBrowse = useMemo(() => {
    if (!browseSearch.trim()) return communities;
    const q = browseSearch.toLowerCase();
    return communities.filter((c) =>
      (c.name ?? '').toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)
    );
  }, [communities, browseSearch]);

  async function submitCreateCommunity() {
    if (!commName.trim()) return;
    setCreatingComm(true);
    const { data, error } = await createCommunity({ name: commName, description: commDesc });
    setCreatingComm(false);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowCreateComm(false);
    setCommName('');
    setCommDesc('');
    toast('Community created! 🎉', 'success');
    if (data) navigate(`/community/${data.id}`);
  }

  return (
    <div className="tribe-hub-page">
      {/* Header */}
      <section className="tribe-hub-header">
        <div className="tribe-hub-header-text">
          <h1 className="tribe-hub-title">Tribe</h1>
          <p className="tribe-hub-subtitle">Your communities, your people</p>
        </div>
        <button className="tribe-hub-create-btn" onClick={() => setShowCreateComm(true)}>
          + Create
        </button>
      </section>

      {/* Stats row */}
      <div className="tribe-hub-stats">
        <div className="tribe-hub-stat">
          <span className="tribe-hub-stat-number">{memberCount ?? '—'}</span>
          <span className="tribe-hub-stat-label">Members</span>
        </div>
        <div className="tribe-hub-stat">
          <span className="tribe-hub-stat-number">{myCommunities.length}</span>
          <span className="tribe-hub-stat-label">My Communities</span>
        </div>
        <div className="tribe-hub-stat">
          <span className="tribe-hub-stat-number">{communities.length}</span>
          <span className="tribe-hub-stat-label">Total Communities</span>
        </div>
      </div>

      {/* My Communities */}
      <section className="tribe-hub-section">
        <div className="tribe-hub-section-header">
          <h2 className="tribe-hub-section-title">My Communities</h2>
          <button className="tribe-hub-browse-link" onClick={() => setShowBrowse(true)}>Browse all →</button>
        </div>

        {myCommunities.length === 0 ? (
          <div className="tribe-hub-empty">
            <span className="tribe-hub-empty-icon">🌐</span>
            <p>You haven't joined any communities yet.</p>
            <button className="tribe-hub-join-prompt" onClick={() => setShowBrowse(true)}>Browse Communities</button>
          </div>
        ) : (
          <div className="tribe-hub-comm-grid">
            {myCommunities.map((c) => (
              <button
                key={c.id}
                className="tribe-hub-comm-card"
                onClick={() => navigate(`/community/${c.id}`)}
              >
                <div className="tribe-hub-comm-avatar">
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} />
                    : c.name.charAt(0).toUpperCase()}
                </div>
                <div className="tribe-hub-comm-info">
                  <div className="tribe-hub-comm-name">{c.name}</div>
                  {c.description && <div className="tribe-hub-comm-desc">{c.description}</div>}
                </div>
                <span className="tribe-hub-comm-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      {discoverCommunities.length > 0 && (
        <section className="tribe-hub-section">
          <h2 className="tribe-hub-section-title">✨ Discover Communities</h2>
          <div className="tribe-hub-discover-list">
            {discoverCommunities.slice(0, 6).map((c) => (
              <div key={c.id} className="tribe-hub-discover-item">
                <div className="tribe-hub-discover-avatar">
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} />
                    : c.name.charAt(0).toUpperCase()}
                </div>
                <div className="tribe-hub-discover-info">
                  <div className="tribe-hub-discover-name">{c.name}</div>
                  {c.description && <div className="tribe-hub-discover-desc">{c.description}</div>}
                </div>
                <button
                  className="tribe-hub-join-btn"
                  onClick={async () => {
                    await joinCommunity(c.id);
                    navigate(`/community/${c.id}`);
                  }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
          {discoverCommunities.length > 6 && (
            <button className="tribe-hub-see-all" onClick={() => setShowBrowse(true)}>
              See all {discoverCommunities.length} communities →
            </button>
          )}
        </section>
      )}

      {/* ── Create Community Modal ── */}
      {showCreateComm && (
        <div className="tribe-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateComm(false)}>
          <div className="tribe-modal">
            <button className="tribe-modal-close" onClick={() => setShowCreateComm(false)}>×</button>
            <h2 className="tribe-modal-title">Create a Community</h2>
            <p className="tribe-modal-hint">Build a space for people working toward the same things.</p>
            <div className="tribe-modal-field">
              <label className="tribe-modal-label">Community Name *</label>
              <input
                className="tribe-modal-input"
                placeholder="e.g. Early Risers, Finance Freedom..."
                value={commName}
                onChange={(e) => setCommName(e.target.value)}
                maxLength={60}
                autoFocus
              />
            </div>
            <div className="tribe-modal-field">
              <label className="tribe-modal-label">Description <span className="tribe-modal-optional">(optional)</span></label>
              <textarea
                className="tribe-modal-textarea"
                placeholder="What is this community about?"
                value={commDesc}
                onChange={(e) => setCommDesc(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>
            <button
              className="tribe-modal-btn"
              onClick={submitCreateCommunity}
              disabled={!commName.trim() || creatingComm}
            >
              {creatingComm ? 'Creating…' : 'Create Community 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* ── Browse Communities Modal ── */}
      {showBrowse && (
        <div className="tribe-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBrowse(false)}>
          <div className="tribe-modal tribe-modal--wide">
            <button className="tribe-modal-close" onClick={() => setShowBrowse(false)}>×</button>
            <h2 className="tribe-modal-title">Browse Communities</h2>
            <input
              className="tribe-modal-input"
              placeholder="Search communities..."
              value={browseSearch}
              onChange={(e) => setBrowseSearch(e.target.value)}
            />
            <div className="tribe-browse-list">
              {filteredBrowse.map((c) => {
                const joined = myMemberships.includes(c.id);
                return (
                  <div key={c.id} className="tribe-browse-item">
                    <div className="tribe-browse-avatar">
                      {c.avatar_url
                        ? <img src={c.avatar_url} alt={c.name} />
                        : c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="tribe-browse-info">
                      <div className="tribe-browse-name">{c.name}</div>
                      {c.description && <div className="tribe-browse-desc">{c.description}</div>}
                    </div>
                    {joined ? (
                      <button className="tribe-browse-open-btn" onClick={() => { setShowBrowse(false); navigate(`/community/${c.id}`); }}>
                        Open
                      </button>
                    ) : (
                      <button className="tribe-browse-join-btn" onClick={async () => {
                        await joinCommunity(c.id);
                        setShowBrowse(false);
                        navigate(`/community/${c.id}`);
                      }}>
                        Join
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredBrowse.length === 0 && (
                <p className="tribe-browse-empty">No communities found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
