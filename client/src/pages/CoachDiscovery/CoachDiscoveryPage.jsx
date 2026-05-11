import React, { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { COACHES, SPECIALTIES, PRICE_RANGES } from '../../data/coaches.js';
import './CoachDiscoveryPage.css';

const EXPERIENCE_OPTIONS = ['Under 1 year', '1–2 years', '3–5 years', '5–10 years', '10+ years'];
const RATE_OPTIONS = ['$20–40/hr', '$40–60/hr', '$60–80/hr', '$80–100/hr', '$100+/hr'];

const EMPTY_FORM = {
  full_name: '', email: '', location: '',
  specialty: '', experience: '', certifications: '',
  session_types: [], rate_range: '', bio: '', why_coach: '',
};

function BecomeCoachModal({ onClose, userId }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const toggleSessionType = (type) => setForm((p) => ({
    ...p,
    session_types: p.session_types.includes(type)
      ? p.session_types.filter((t) => t !== type)
      : [...p.session_types, type],
  }));

  const step1Valid = form.full_name.trim() && form.email.trim() && form.location.trim();
  const step2Valid = form.specialty && form.experience;
  const step3Valid = form.session_types.length > 0 && form.rate_range && form.bio.trim() && form.why_coach.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!step3Valid) return;
    setSubmitting(true);
    const { error } = await supabase.from('coach_applications').insert({
      user_id: userId,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      specialty: form.specialty,
      experience: form.experience,
      certifications: form.certifications.trim() || null,
      session_types: form.session_types,
      rate_range: form.rate_range,
      bio: form.bio.trim(),
      why_coach: form.why_coach.trim(),
    });
    setSubmitting(false);
    if (error) { toast(`Couldn't submit: ${error.message}`, 'error'); return; }
    setSubmitted(true);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="coach-apply-modal">
        <div className="coach-apply-header">
          <div>
            <h2 className="coach-apply-title">
              {submitted ? '🎉 Application Received!' : '✨ Become a Coach'}
            </h2>
            {!submitted && <p className="coach-apply-sub">Step {step} of 3</p>}
          </div>
          <button className="close-modal" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!submitted && (
          <div className="coach-apply-progress">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`progress-step${step >= s ? ' done' : ''}${step === s ? ' active' : ''}`} />
            ))}
          </div>
        )}

        {submitted ? (
          <div className="coach-apply-success">
            <div className="success-icon">🏅</div>
            <h3>Thanks, {form.full_name.split(' ')[0]}!</h3>
            <p>Your application is under review. We'll reach out to <strong>{form.email}</strong> within 3–5 business days.</p>
            <p className="success-note">In the meantime, you can still use all the standard features of the platform.</p>
            <button className="coach-apply-btn" onClick={onClose}>Back to Coaches</button>
          </div>
        ) : (
          <form className="coach-apply-body" onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>

            {/* Step 1 — About You */}
            {step === 1 && (
              <div className="apply-step">
                <h3 className="step-heading">About You</h3>
                <div className="apply-form-group">
                  <label>Full Name *</label>
                  <input className="apply-input" placeholder="e.g. Alex Johnson" value={form.full_name} onChange={set('full_name')} required />
                </div>
                <div className="apply-form-group">
                  <label>Email Address *</label>
                  <input className="apply-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                </div>
                <div className="apply-form-group">
                  <label>Location *</label>
                  <input className="apply-input" placeholder="e.g. Austin, TX" value={form.location} onChange={set('location')} required />
                </div>
                <button
                  type="button"
                  className="coach-apply-btn"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2 — Your Expertise */}
            {step === 2 && (
              <div className="apply-step">
                <h3 className="step-heading">Your Expertise</h3>
                <div className="apply-form-group">
                  <label>Coaching Specialty *</label>
                  <select className="apply-input" value={form.specialty} onChange={set('specialty')} required>
                    <option value="">Select a specialty…</option>
                    {SPECIALTIES.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="apply-form-group">
                  <label>Years of Experience *</label>
                  <div className="apply-options-grid">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`apply-option-btn${form.experience === opt ? ' active' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, experience: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="apply-form-group">
                  <label>Certifications <span className="label-optional">(optional)</span></label>
                  <textarea
                    className="apply-input apply-textarea"
                    placeholder="List any relevant certifications, e.g. NASM CPT, Precision Nutrition L1…"
                    value={form.certifications}
                    onChange={set('certifications')}
                    rows={3}
                  />
                </div>
                <div className="apply-btn-row">
                  <button type="button" className="apply-back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="coach-apply-btn" disabled={!step2Valid} onClick={() => setStep(3)}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 3 — Coaching Details */}
            {step === 3 && (
              <div className="apply-step">
                <h3 className="step-heading">Your Coaching Style</h3>
                <div className="apply-form-group">
                  <label>Session Types *</label>
                  <div className="apply-checkbox-row">
                    {['virtual', 'in-person'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`apply-option-btn${form.session_types.includes(type) ? ' active' : ''}`}
                        onClick={() => toggleSessionType(type)}
                      >
                        {type === 'virtual' ? '💻 Virtual' : '📍 In-Person'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="apply-form-group">
                  <label>Desired Hourly Rate *</label>
                  <div className="apply-options-grid">
                    {RATE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`apply-option-btn${form.rate_range === opt ? ' active' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, rate_range: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="apply-form-group">
                  <label>Your Bio *</label>
                  <textarea
                    className="apply-input apply-textarea"
                    placeholder="Tell potential clients about yourself, your background, and your coaching approach…"
                    value={form.bio}
                    onChange={set('bio')}
                    rows={4}
                    required
                  />
                </div>
                <div className="apply-form-group">
                  <label>Why do you want to coach on ActPar? *</label>
                  <textarea
                    className="apply-input apply-textarea"
                    placeholder="What motivates you to help others achieve their goals?"
                    value={form.why_coach}
                    onChange={set('why_coach')}
                    rows={3}
                    required
                  />
                </div>
                <div className="apply-btn-row">
                  <button type="button" className="apply-back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className="coach-apply-btn" disabled={!step3Valid || submitting}>
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function CoachDiscoveryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [sessionType, setSessionType] = useState('all');
  const [priceRange, setPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showApply, setShowApply] = useState(false);

  const filtered = useMemo(() => {
    let list = COACHES.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchSpecialty = specialty === 'All' || c.specialty === specialty;
      const matchType = sessionType === 'all' || c.sessionTypes.includes(sessionType);
      const range = PRICE_RANGES[priceRange];
      const matchPrice = c.rateNum >= range.min && c.rateNum < range.max;
      return matchSearch && matchSpecialty && matchType && matchPrice;
    });

    if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.rateNum - b.rateNum);
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.rateNum - a.rateNum);
    else if (sortBy === 'reviews') list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);

    return list;
  }, [search, specialty, sessionType, priceRange, sortBy]);

  return (
    <div className="discovery-page">
      <section className="discovery-header">
        <div className="discovery-header-text">
          <h1 className="discovery-title">Find Your Coach</h1>
          <p className="discovery-subtitle">Connect with certified coaches who match your goals</p>
        </div>
        <button className="become-coach-btn" onClick={() => setShowApply(true)}>
          ✨ Become a Coach
        </button>
      </section>

      <div className="discovery-search-bar">
        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="discovery-search-input"
          placeholder="Search coaches, specialties, or skills…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      <div className="discovery-body">
        <aside className="filters-sidebar">
          <div className="filter-section">
            <h3 className="filter-heading">Specialty</h3>
            <div className="filter-list">
              {SPECIALTIES.map(s => (
                <button key={s} className={`filter-option${specialty === s ? ' active' : ''}`} onClick={() => setSpecialty(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-heading">Session Type</h3>
            <div className="filter-list">
              {[['all', 'All Types'], ['virtual', '💻 Virtual'], ['in-person', '📍 In-Person']].map(([val, lbl]) => (
                <button key={val} className={`filter-option${sessionType === val ? ' active' : ''}`} onClick={() => setSessionType(val)}>{lbl}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-heading">Price Range</h3>
            <div className="filter-list">
              {PRICE_RANGES.map((r, i) => (
                <button key={r.label} className={`filter-option${priceRange === i ? ' active' : ''}`} onClick={() => setPriceRange(i)}>{r.label}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="discovery-results">
          <div className="results-header">
            <span className="results-count">{filtered.length} coach{filtered.length !== 1 ? 'es' : ''} found</span>
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {filtered.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <p>No coaches match your filters. Try adjusting your search.</p>
            </div>
          )}

          <div className="coaches-grid">
            {filtered.map(coach => (
              <div key={coach.id} className="coach-card" onClick={() => navigate(`/coach/${coach.id}`)}>
                <div className="coach-card-header">
                  <div className="coach-card-avatar" />
                  <div className="coach-card-meta">
                    <div className="coach-card-name-row">
                      <h3 className="coach-card-name">{coach.name}</h3>
                      {coach.verified && <span className="coach-verified-badge">✓ Verified</span>}
                    </div>
                    <div className="coach-card-specialty">{coach.specialty}</div>
                    <div className="coach-card-location">📍 {coach.location}</div>
                  </div>
                  <div className="coach-card-rate">{coach.rate}</div>
                </div>

                <p className="coach-card-bio">{Array.isArray(coach.bio) ? coach.bio[0] : coach.bio}</p>

                <div className="coach-card-tags">
                  {coach.tags.map(t => <span key={t} className="coach-tag">{t}</span>)}
                </div>

                <div className="coach-card-footer">
                  <div className="coach-card-stats">
                    <span className="coach-rating">⭐ {coach.rating} ({coach.reviewCount})</span>
                    <span className="coach-session-types">
                      {coach.sessionTypes.includes('virtual') && <span className="stype virtual">💻</span>}
                      {coach.sessionTypes.includes('in-person') && <span className="stype in-person">📍</span>}
                    </span>
                    {coach.teamSize > 0 && (
                      <span className="coach-team-size">👥 {coach.teamSize} trainer{coach.teamSize !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <button
                    className="view-coach-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/coach/${coach.id}`); }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showApply && (
        <BecomeCoachModal onClose={() => setShowApply(false)} userId={user?.id} />
      )}
    </div>
  );
}
