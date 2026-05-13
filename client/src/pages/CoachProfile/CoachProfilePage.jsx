import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import { COACHES } from '../../data/coaches.js';
import { useCoachProfile } from '../../hooks/useCoaches.js';
import './CoachProfilePage.css';

const TABS = ['Overview', 'Sessions', 'Workouts', 'Videos', 'Team'];

const LEVEL_COLORS = {
  'Beginner': '#10b981',
  'Intermediate': '#f59e0b',
  'Advanced': '#ef4444',
  'All Levels': '#6b7280',
};

export default function CoachProfilePage() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useContext(AuthContext);

  // Try real DB coach first (UUID), fall back to sample data (numeric id)
  const isUuid = coachId && coachId.includes('-');
  const { coach: dbCoach, loading: dbLoading } = useCoachProfile(isUuid ? coachId : null);
  const sampleCoach = isUuid ? null : COACHES.find(c => String(c.id) === String(coachId));
  const coach = dbCoach ?? sampleCoach;

  const [activeTab, setActiveTab] = useState('Overview');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionType, setSessionType] = useState('both');
  const [videoPreview, setVideoPreview] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', goal: '', time: 'Morning (9am – 12pm)' });
  const [submitting, setSubmitting] = useState(false);

  if (isUuid && dbLoading) {
    return <div className="coach-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="loading-spinner" /></div>;
  }

  if (!coach) {
    return (
      <div className="coach-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h2 style={{ color: '#111827', margin: 0 }}>Coach not found</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>That profile doesn't exist or has been removed.</p>
          <button className="coach-book-btn" onClick={() => navigate('/coaches')}>Browse Coaches</button>
        </div>
      </div>
    );
  }

  const tabs = ['Overview', 'Sessions', 'Workouts'];
  if (coach.videos?.length > 0) tabs.push('Videos');
  if (coach.team?.length > 0) tabs.push('Team');

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.id]: e.target.value })); }

  function openBooking(session = null) {
    setSelectedSession(session);
    setShowBooking(true);
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.goal) {
      toast('Please fill out all required fields.', 'warning');
      return;
    }
    setSubmitting(true);

    if (isUuid && coach?.isReal && user) {
      const sessionLabel = selectedSession
        ? `"${selectedSession.title}" (${selectedSession.price})`
        : 'a coaching session';
      const msgContent =
        `Hi ${coach.name.split(' ')[0]}! I'd like to book ${sessionLabel}.\n\n` +
        `My goal: ${form.goal}\n` +
        `Preferred time: ${form.time}\n\n` +
        `Looking forward to working with you!`;

      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: coach.id,
        content: msgContent,
      });

      const myName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
        .filter(Boolean).join(' ') || 'A new client';
      await supabase.from('notifications').insert({
        user_id: coach.id,
        actor_id: user.id,
        type: 'booking_request',
        body: `${myName} requested a coaching session with you! Check your messages.`,
      });

      setSubmitting(false);
      setShowBooking(false);
      setForm({ name: '', email: '', phone: '', goal: '', time: 'Morning (9am – 12pm)' });
      toast('Booking request sent! Opening your conversation...', 'success');
      navigate(`/messages?with=${coach.id}`);
    } else {
      await new Promise(r => setTimeout(r, 800));
      setSubmitting(false);
      setShowBooking(false);
      setForm({ name: '', email: '', phone: '', goal: '', time: 'Morning (9am – 12pm)' });
      toast(`Booking request sent! ${coach.name} will contact you within 24 hours.`, 'success');
    }
  }

  const filteredSessions = (coach.sessions ?? []).filter(s =>
    sessionType === 'both' || s.type === sessionType
  );

  const bioParas = Array.isArray(coach.bio) ? coach.bio : [coach.bio];

  return (
    <div className="coach-page">

      {/* Hero */}
      <section className="coach-hero">
        <div className="coach-hero-bg" />
        <div className="coach-hero-content">
          <div className="coach-photo-wrap">
            <div className="coach-photo" />
            {coach.verified && (
              <div className="verified-badge">
                <svg fill="currentColor" viewBox="0 0 20 20" width="13" height="13">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Coach
              </div>
            )}
          </div>

          <div className="coach-hero-info">
            <div className="coach-meta-row">
              <span className="coach-specialty-tag">{coach.specialty}</span>
              <span className="coach-location">📍 {coach.location}</span>
            </div>
            <h1 className="coach-name">{coach.name}</h1>
            <p className="coach-tagline">{coach.tagline}</p>

            <div className="coach-stats-row">
              <div className="coach-stat"><span className="cstat-num">{coach.rating}</span><span className="cstat-lbl">⭐ Rating</span></div>
              <div className="coach-stat-divider" />
              <div className="coach-stat"><span className="cstat-num">{coach.reviewCount}</span><span className="cstat-lbl">Reviews</span></div>
              <div className="coach-stat-divider" />
              <div className="coach-stat"><span className="cstat-num">{coach.experience}</span><span className="cstat-lbl">Experience</span></div>
              <div className="coach-stat-divider" />
              <div className="coach-stat"><span className="cstat-num">{coach.clientsHelped}</span><span className="cstat-lbl">Clients</span></div>
              <div className="coach-stat-divider" />
              <div className="coach-stat"><span className="cstat-num">{coach.rate}</span><span className="cstat-lbl">Per Session</span></div>
            </div>

            <div className="coach-hero-actions">
              <button className="coach-book-btn" onClick={() => openBooking()}>📅 Book a Session</button>
              <button
                className="coach-msg-btn"
                onClick={() => isUuid && coach?.isReal && user ? navigate(`/messages?with=${coach.id}`) : openBooking()}
              >
                💬 Message
              </button>
            </div>
          </div>
        </div>

        <div className="coach-tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`coach-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <div className="coach-body">

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="tab-grid">
            <div className="tab-main">
              <div className="coach-card">
                <h2 className="card-heading">About</h2>
                <div className="coach-bio">
                  {bioParas.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>

              {coach.philosophy && (
                <div className="coach-card">
                  <h2 className="card-heading">Coaching Philosophy</h2>
                  <div className="philosophy-box">
                    <p className="philosophy-statement">"{coach.philosophy.statement}"</p>
                    {coach.philosophy.beliefs?.length > 0 && (
                      <ul className="philosophy-beliefs">
                        {coach.philosophy.beliefs.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {coach.testimonials?.length > 0 && (
                <div className="coach-card">
                  <h2 className="card-heading">Client Success Stories</h2>
                  <div className="testimonials-list">
                    {coach.testimonials.map((t, i) => (
                      <div key={i} className="testimonial-card">
                        <div className="testimonial-quote">"</div>
                        <p className="testimonial-text">{t.text}</p>
                        <div className="testimonial-author">
                          <Avatar name={t.author} size={42} />
                          <div>
                            <div className="author-name">{t.author}</div>
                            <div className="author-role">{t.role}</div>
                            <div className="author-stars">{'⭐'.repeat(t.rating)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="tab-sidebar">
              {coach.credentials?.length > 0 && (
                <div className="coach-card">
                  <h3 className="sidebar-heading">Certifications</h3>
                  <div className="credentials-list">
                    {coach.credentials.map(c => (
                      <div key={c.name} className="credential-item">
                        <div className="credential-name">{c.name}</div>
                        <div className="credential-org">{c.org}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {coach.awards?.length > 0 && (
                <div className="coach-card">
                  <h3 className="sidebar-heading">Awards</h3>
                  <div className="awards-list">
                    {coach.awards.map(a => (
                      <div key={a} className="award-item"><span>🏆</span><span>{a}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {coach.values?.length > 0 && (
                <div className="coach-card">
                  <h3 className="sidebar-heading">Core Values</h3>
                  <div className="values-wrap">
                    {coach.values.map(v => <span key={v} className="value-chip">{v}</span>)}
                  </div>
                </div>
              )}

              {coach.links?.length > 0 && (
                <div className="coach-card">
                  <h3 className="sidebar-heading">Links</h3>
                  <div className="links-list">
                    {coach.links.map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="external-link">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ── SESSIONS ── */}
        {activeTab === 'Sessions' && (
          <div className="sessions-section">
            <div className="sessions-header">
              <h2 className="section-heading">Upcoming Sessions</h2>
              <div className="session-type-filter">
                {[['both', 'All'], ['virtual', '💻 Virtual'], ['in-person', '📍 In-Person']].map(([val, lbl]) => (
                  <button
                    key={val}
                    className={`type-filter-btn${sessionType === val ? ' active' : ''}`}
                    onClick={() => setSessionType(val)}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="sessions-grid">
              {filteredSessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-card-top">
                    <span className={`session-type-badge ${session.type}`}>
                      {session.type === 'virtual' ? '💻 Virtual' : '📍 In-Person'}
                    </span>
                    <span className="session-price">{session.price}</span>
                  </div>
                  <h3 className="session-title">{session.title}</h3>
                  <div className="session-details">
                    <div className="session-detail">📅 {session.date}</div>
                    <div className="session-detail">🕐 {session.time}</div>
                    <div className="session-detail">⏱ {session.duration}</div>
                    <div className="session-detail">👥 {session.spots} spot{session.spots !== 1 ? 's' : ''} left</div>
                  </div>
                  <button
                    className="session-book-btn"
                    onClick={() => openBooking(session)}
                    disabled={session.spots === 0}
                  >
                    {session.spots === 0 ? 'Fully Booked' : 'Book This Session'}
                  </button>
                </div>
              ))}
            </div>

            {filteredSessions.length === 0 && (
              <div className="empty-state">No {sessionType === 'both' ? '' : sessionType + ' '}sessions available right now.</div>
            )}
          </div>
        )}

        {/* ── WORKOUTS ── */}
        {activeTab === 'Workouts' && (
          <div className="workouts-section">
            <h2 className="section-heading">Programs & Workouts</h2>
            <div className="workouts-grid">
              {(coach.workouts ?? []).map(w => (
                <div key={w.id} className="workout-card">
                  <div className="workout-card-top">
                    <span className="workout-category">{w.category}</span>
                    <span className="workout-level" style={{ color: LEVEL_COLORS[w.level] ?? '#6b7280' }}>{w.level}</span>
                  </div>
                  <h3 className="workout-title">{w.title}</h3>
                  <p className="workout-desc">{w.description}</p>
                  <div className="workout-meta">
                    <span>📅 {w.duration}</span>
                    <span>🏋️ {w.sessions} sessions</span>
                  </div>
                  <button className="workout-cta" onClick={() => openBooking()}>Get This Program</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIDEOS ── */}
        {activeTab === 'Videos' && coach.videos?.length > 0 && (
          <div className="videos-section">
            <h2 className="section-heading">Video Content</h2>
            <div className="videos-grid">
              {coach.videos.map((v, i) => (
                <div key={v.id} className="video-card" onClick={() => setVideoPreview(v)}>
                  <div className="video-thumb" style={{ background: `linear-gradient(135deg, ${['#f59e0b','#d97706','#fbbf24','#b45309','#d97706','#0d9488'][i % 6]} 0%, ${['#d97706','#f59e0b','#b45309','#fbbf24','#0d9488','#d97706'][i % 6]} 100%)` }}>
                    <div className="video-play-btn">▶</div>
                    <span className="video-duration">{v.duration}</span>
                  </div>
                  <div className="video-info">
                    <span className="video-category">{v.category}</span>
                    <h3 className="video-title">{v.title}</h3>
                    <span className="video-views">{v.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEAM ── */}
        {activeTab === 'Team' && coach.team?.length > 0 && (
          <div className="team-section">
            <div className="team-header">
              <h2 className="section-heading">The Coaching Team</h2>
              <p className="team-subtitle">Specialists working under {coach.name.split(' ').slice(-1)[0]}'s program</p>
            </div>
            <div className="team-grid">
              {coach.team.map(member => (
                <div key={member.name} className="team-card">
                  <Avatar name={member.name} size={64} shape="circle" />
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <div className="team-role">{member.role}</div>
                    <div className="team-specialty">🎯 {member.specialty}</div>
                    <div className="team-exp">⏱ {member.experience} experience</div>
                    {member.link && (
                      <a href={member.link} target="_blank" rel="noopener noreferrer" className="team-link">View Profile →</a>
                    )}
                  </div>
                  <button className="team-msg-btn" onClick={() => openBooking()}>Message</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Video Preview Modal */}
      {videoPreview && (
        <div className="modal-overlay" onClick={() => setVideoPreview(null)}>
          <div className="video-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{videoPreview.title}</h2>
                <p className="modal-session-info">{videoPreview.category} · {videoPreview.duration} · {videoPreview.views} views</p>
              </div>
              <button className="modal-close" onClick={() => setVideoPreview(null)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="video-preview-screen">
              <div className="video-preview-icon">▶</div>
              <p className="video-preview-label">Full video available when you book a session with {coach.name.split(' ')[0]}</p>
              <button className="session-book-btn" style={{ marginTop: 16 }} onClick={() => { setVideoPreview(null); openBooking(); }}>
                Book a Session to Watch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBooking(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedSession ? `Book: ${selectedSession.title}` : 'Book a Session'}
                </h2>
                {selectedSession && (
                  <p className="modal-session-info">
                    {selectedSession.date} · {selectedSession.time} · {selectedSession.price}
                  </p>
                )}
              </div>
              <button className="modal-close" onClick={() => setShowBooking(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="booking-form" onSubmit={submitBooking}>
              {!selectedSession && (
                <div className="form-group">
                  <label>Session Type</label>
                  <div className="session-type-toggle">
                    <button type="button" className={`toggle-btn${form.sessionType !== 'in-person' ? ' active' : ''}`} onClick={() => setForm(p => ({ ...p, sessionType: 'virtual' }))}>💻 Virtual</button>
                    <button type="button" className={`toggle-btn${form.sessionType === 'in-person' ? ' active' : ''}`} onClick={() => setForm(p => ({ ...p, sessionType: 'in-person' }))}>📍 In-Person</button>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input type="text" id="name" className="form-input" placeholder="Your name" required value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input type="email" id="email" className="form-input" placeholder="you@email.com" required value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone (optional)</label>
                <input type="tel" id="phone" className="form-input" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="goal">What's your primary goal? *</label>
                <textarea id="goal" className="form-input" rows="3" placeholder="Tell me what you'd like to achieve..." required value={form.goal} onChange={handleChange} />
              </div>
              {!selectedSession && (
                <div className="form-group">
                  <label htmlFor="time">Preferred Time</label>
                  <select id="time" className="form-input" value={form.time} onChange={handleChange}>
                    <option>Morning (9am – 12pm)</option>
                    <option>Afternoon (12pm – 5pm)</option>
                    <option>Evening (5pm – 8pm)</option>
                  </select>
                </div>
              )}
              <button type="submit" className="booking-submit-btn" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Booking Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
