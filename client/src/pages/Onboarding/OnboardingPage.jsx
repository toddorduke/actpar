import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useGoals } from '../../hooks/useGoals.js';
import { supabase } from '../../lib/supabase.js';
import { getDisplayName } from '../../utils/displayName.js';
import './OnboardingPage.css';

const CATEGORIES = [
  { value: 'faith', label: '✝️ Faith' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'sobriety', label: '🌱 Sobriety' },
  { value: 'mindfulness', label: '🧘 Mindfulness' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'mental_health', label: '🧠 Mental Health' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'relationships', label: '❤️ Relationships' },
  { value: 'learning', label: '📚 Learning' },
  { value: 'career', label: '💼 Career' },
  { value: 'other', label: '✨ Other' },
];

const LF_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

const GROWTH_AREAS = [
  'Beating Procrastination', 'Building Daily Discipline', 'Sharpening My Focus',
  'Staying Consistent', 'Reigniting My Motivation', 'Mastering My Time',
  'Silencing Self-Doubt', 'Breaking Old Habits', 'Taking More Action',
  'Quieting Overthinking', 'Managing Stress Better', 'Showing Up for Myself',
];

const STRENGTHS = [
  'Natural Leader', 'Great Listener', 'Creative Thinker', 'Quick Learner',
  'Problem Solver', 'Detail-Oriented', 'Self-Starter', 'Big-Picture Thinker',
  'Highly Empathetic', 'Resilient Under Pressure', 'Strong Communicator', 'Team Player',
];

const WEAKNESSES = [
  "I can be too hard on myself",
  "Patience is a muscle I'm still training",
  "I sometimes avoid hard conversations",
  "I struggle with saying no",
  "I get in my own way",
  "I shut down under pressure",
  "I put everyone else first",
  "I fear what others think",
  "I take on too much at once",
  "I have trouble asking for help",
  "I can be overly cautious",
  "I hold on to things too long",
];

const TIER_META = [
  { tier: 1, label: 'Top Priority', color: '#f59e0b', placeholder: 'e.g. Attend church weekly, Save $500/month…' },
  { tier: 2, label: 'Important', color: '#d97706', placeholder: 'e.g. Work out 4x a week, Read 20 min daily…' },
  { tier: 3, label: 'Foundation', color: '#92400e', placeholder: 'e.g. Sleep 8 hours, Drink more water…' },
];

// Quick:   welcome(1) → identity(2) → goals(3) → people(4) → done(5)
// Thorough: welcome(1) → identity(2) → looking-for(3) → goals(4) → holding-back(5) → know-yourself(6) → people(7) → done(8)

export default function OnboardingPage() {
  const { user } = useContext(AuthContext);
  const { profile } = useProfile();
  const { addGoal } = useGoals();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Identity fields
  const [alterEgoName, setAlterEgoName] = useState('');
  const [egoStatus, setEgoStatus] = useState(null);
  const egoTimer = useRef(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');

  // Looking for
  const [lookingFor, setLookingFor] = useState([]);

  // Goals — 3 tiers
  const [tierGoals, setTierGoals] = useState([
    { title: '', category: '' },
    { title: '', category: '' },
    { title: '', category: '' },
  ]);

  // Holding back / know yourself
  const [workingOn, setWorkingOn] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);

  // People suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sparkedIds, setSparkedIds] = useState(new Set());

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';

  const peopleStep = mode === 'quick' ? 4 : 7;
  const doneStep   = mode === 'quick' ? 5 : 8;
  const totalSteps = mode === 'quick' ? 3 : 6;

  function progressPct() {
    if (step <= 1 || step >= doneStep) return 0;
    return ((step - 1) / totalSteps) * 100;
  }

  // Alter ego availability check
  const checkAlterEgo = useCallback((name) => {
    clearTimeout(egoTimer.current);
    if (!name.trim()) { setEgoStatus(null); return; }
    setEgoStatus('checking');
    egoTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('alter_ego_name', name.trim())
        .maybeSingle();
      setEgoStatus(data ? 'taken' : 'available');
    }, 600);
  }, []);

  // Load people suggestions when entering people step
  useEffect(() => {
    if (step !== peopleStep || !user || !mode) return;
    let cancelled = false;
    setLoadingSuggestions(true);

    const load = async () => {
      let profiles = [];
      const seen = new Set();
      const primaryCategory = tierGoals[0].category;

      if (workingOn.length > 0) {
        const formattedArr = `{${workingOn.map((v) => `"${v}"`).join(',')}}`;
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, city')
          .neq('id', user.id)
          .eq('onboarding_complete', true)
          .filter('working_on', 'ov', formattedArr)
          .limit(6);
        (data ?? []).forEach((p) => { if (!seen.has(p.id)) { seen.add(p.id); profiles.push(p); } });
      }

      if (profiles.length < 6 && primaryCategory) {
        const { data: goalRows } = await supabase
          .from('goals')
          .select('user_id')
          .eq('category', primaryCategory)
          .eq('is_active', true)
          .neq('user_id', user.id)
          .limit(12);

        const ids = [...new Set((goalRows ?? []).map((g) => g.user_id))]
          .filter((id) => !seen.has(id))
          .slice(0, 6 - profiles.length);

        if (ids.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, city')
            .in('id', ids);
          (data ?? []).forEach((p) => { if (!seen.has(p.id)) { seen.add(p.id); profiles.push(p); } });
        }
      }

      if (profiles.length === 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, city')
          .neq('id', user.id)
          .eq('onboarding_complete', true)
          .order('created_at', { ascending: false })
          .limit(6);
        profiles = data ?? [];
      }

      if (profiles.length > 0) {
        const { data: goals } = await supabase
          .from('goals')
          .select('user_id, title')
          .in('user_id', profiles.map((p) => p.id))
          .eq('is_active', true);
        const goalMap = {};
        (goals ?? []).forEach((g) => { if (!goalMap[g.user_id]) goalMap[g.user_id] = g.title; });
        profiles = profiles.map((p) => ({ ...p, goalTitle: goalMap[p.id] ?? null }));
      }

      if (!cancelled) { setSuggestions(profiles); setLoadingSuggestions(false); }
    };

    load();
    return () => { cancelled = true; };
  }, [step, peopleStep, user?.id, tierGoals, workingOn, mode]);

  async function handleSpark(profileId) {
    setSparkedIds((prev) => new Set([...prev, profileId]));
    await supabase.from('connections').insert({ requester_id: user.id, receiver_id: profileId, status: 'pending' });
  }

  function chooseMode(chosen) {
    setMode(chosen);
    setStep(2);
  }

  async function handleGoalsStep() {
    const goalsToSave = tierGoals
      .map((g, i) => g.title.trim() ? { title: g.title.trim(), category: g.category || null, tier: i + 1 } : null)
      .filter(Boolean);
    if (goalsToSave.length > 0) {
      await Promise.all(goalsToSave.map((g) => addGoal(g.title, g.category, { tier: g.tier })));
    }
    setStep(mode === 'quick' ? peopleStep : 5);
  }

  async function handleFinish() {
    setSaving(true);
    const profileUpdate = {
      onboarding_complete: true,
      working_on: workingOn,
      looking_for: lookingFor,
    };
    if (alterEgoName.trim()) profileUpdate.alter_ego_name = alterEgoName.trim();
    if (gender) profileUpdate.gender = gender;
    if (age) profileUpdate.age = parseInt(age, 10);
    if (city.trim()) profileUpdate.city = city.trim();

    await Promise.all([
      supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          profile_setup_complete: true,
          working_on: workingOn,
          strengths,
          weaknesses,
          alter_ego_name: alterEgoName.trim() || null,
          gender: gender || null,
          age: age ? parseInt(age, 10) : null,
          city: city.trim() || null,
        },
      }),
      supabase.from('profiles').update(profileUpdate).eq('id', user.id),
    ]);
    setSaving(false);
    navigate('/', { replace: true });
  }

  const goalStepNumber = mode === 'quick' ? 3 : 4;
  const goalDisplayStep = mode === 'quick' ? 2 : 3;

  return (
    <div className="onboarding-page">
      {step > 1 && step < doneStep && (
        <div className="onboarding-progress">
          <div className="onboarding-progress-fill" style={{ width: `${progressPct()}%` }} />
        </div>
      )}

      {/* ── Step 1: Welcome + path choice ── */}
      {step === 1 && (
        <div className="onboarding-step onboarding-welcome">
          <div className="welcome-orb" />
          <div className="welcome-content">
            <div className="welcome-emoji">🔥</div>
            <h1 className="welcome-title">Welcome, {firstName}!</h1>
            <p className="welcome-subtitle">Your personal accountability journey starts here.</p>
            <ul className="welcome-features">
              <li><span className="feature-icon">🎯</span> Set goals and track your progress daily</li>
              <li><span className="feature-icon">⚡</span> Spark connections with like-minded people</li>
              <li><span className="feature-icon">🌍</span> Join the Tribe community for inspiration</li>
            </ul>
            <div className="setup-path-label">How do you want to get started?</div>
            <div className="setup-path-cards">
              <button className="setup-path-card" onClick={() => chooseMode('quick')}>
                <div className="path-icon">⚡</div>
                <div className="path-title">Quick Setup</div>
                <div className="path-desc">Set your goals, find people, and jump in. Under 3 minutes.</div>
                <div className="path-steps">3 steps</div>
              </button>
              <button className="setup-path-card" onClick={() => chooseMode('thorough')}>
                <div className="path-icon">🧠</div>
                <div className="path-title">Thorough Setup</div>
                <div className="path-desc">Go deeper — define your why, your strengths, and what you're overcoming.</div>
                <div className="path-steps">6 steps</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Identity ── */}
      {step === 2 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 1 of {totalSteps}</div>
            <h2 className="step-title">Who are you becoming?</h2>
            <p className="step-subtitle">
              {mode === 'quick'
                ? 'Create your accountability persona — the version of you that shows up every day.'
                : 'Tell us a bit about yourself so we can match you with the right people.'}
            </p>
          </div>
          <div className="step-body">
            <div className="form-group">
              <label className="form-label">Alter Ego Name <span className="form-label-hint">(optional)</span></label>
              <input
                className={`onboarding-input${egoStatus === 'taken' ? ' input-error' : egoStatus === 'available' ? ' input-success' : ''}`}
                type="text"
                placeholder="e.g. The Iron Version, Phoenix, The Grinder…"
                value={alterEgoName}
                onChange={(e) => { setAlterEgoName(e.target.value); checkAlterEgo(e.target.value); }}
                maxLength={40}
              />
              {egoStatus === 'checking' && <span className="signup-field-hint">Checking availability…</span>}
              {egoStatus === 'available' && <span className="signup-field-hint ego-available">✓ Available!</span>}
              {egoStatus === 'taken' && <span className="signup-field-hint ego-taken">✗ Already taken — try another.</span>}
              {!egoStatus && <span className="signup-field-hint">Your accountability persona — the name you go by when you're locked in.</span>}
            </div>

            {mode === 'thorough' && (
              <>
                <div className="form-row-onboarding">
                  <div className="form-group">
                    <label className="form-label">Gender <span className="form-label-hint">(optional)</span></label>
                    <div className="onboarding-radio-group">
                      {['Male', 'Female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`onboarding-radio-btn${gender === g ? ' selected' : ''}`}
                          onClick={() => setGender((prev) => prev === g ? '' : g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age <span className="form-label-hint">(optional)</span></label>
                    <input
                      className="onboarding-input"
                      type="number"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="13" max="120"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">City <span className="form-label-hint">(optional)</span></label>
                  <input
                    className="onboarding-input"
                    type="text"
                    placeholder="e.g. Atlanta, Chicago, Dallas…"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <div className="step-actions">
            <button
              className="onboarding-btn primary"
              onClick={() => setStep(mode === 'quick' ? goalStepNumber : 3)}
              disabled={egoStatus === 'taken'}
            >
              {alterEgoName.trim() ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3 (thorough only): Looking For ── */}
      {step === 3 && mode === 'thorough' && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 2 of {totalSteps}</div>
            <h2 className="step-title">What are you looking for?</h2>
            <p className="step-subtitle">This helps us match you with the right accountability partners.</p>
          </div>
          <div className="step-body">
            <div className="motivations-grid">
              {LF_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`motivation-chip${lookingFor.includes(cat) ? ' selected' : ''}`}
                  onClick={() => setLookingFor((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])}
                >
                  {cat}{lookingFor.includes(cat) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(4)}>
              {lookingFor.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(2)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Goals step (step 3 quick / step 4 thorough) ── */}
      {step === goalStepNumber && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step {goalDisplayStep} of {totalSteps}</div>
            <h2 className="step-title">Set your 3 goals</h2>
            <p className="step-subtitle">Rank them by priority — these build your pyramid on your profile.</p>
          </div>
          <div className="step-body">
            {TIER_META.map((meta, i) => (
              <div key={meta.tier} className="tier-goal-card">
                <div className="tier-goal-header">
                  <span className="tier-goal-badge" style={{ background: meta.color }}>Tier {meta.tier}</span>
                  <span className="tier-goal-label">{meta.label}</span>
                  {i > 0 && <span className="tier-goal-optional">optional</span>}
                </div>
                <input
                  className="onboarding-input"
                  type="text"
                  placeholder={meta.placeholder}
                  value={tierGoals[i].title}
                  onChange={(e) => setTierGoals((prev) => prev.map((g, j) => j === i ? { ...g, title: e.target.value } : g))}
                  maxLength={120}
                />
                <div className="category-grid category-grid--compact">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`category-chip${tierGoals[i].category === c.value ? ' selected' : ''}`}
                      onClick={() => setTierGoals((prev) => prev.map((g, j) => j === i ? { ...g, category: g.category === c.value ? '' : c.value } : g))}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="step-actions">
            <button
              className="onboarding-btn primary"
              onClick={handleGoalsStep}
              disabled={!tierGoals[0].title.trim()}
            >
              {tierGoals[0].title.trim() ? 'Save My Goals & Continue' : 'Add at least one goal to continue'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(mode === 'quick' ? 2 : 3)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 5 (thorough only): What's holding you back ── */}
      {step === 5 && mode === 'thorough' && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 4 of {totalSteps}</div>
            <h2 className="step-title">What's holding you back?</h2>
            <p className="step-subtitle">Be honest with yourself. This is just between you and your goals.</p>
          </div>
          <div className="step-body">
            <div className="motivations-grid">
              {GROWTH_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`motivation-chip${workingOn.includes(a) ? ' selected' : ''}`}
                  onClick={() => setWorkingOn((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])}
                >
                  {a}{workingOn.includes(a) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(6)}>
              {workingOn.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(4)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 6 (thorough only): Know yourself ── */}
      {step === 6 && mode === 'thorough' && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 5 of {totalSteps}</div>
            <h2 className="step-title">Know yourself, grow yourself.</h2>
            <p className="step-subtitle">Own your strengths and acknowledge what you're still building.</p>
          </div>
          <div className="step-body">
            <div className="form-group">
              <label className="form-label">What are your superpowers?</label>
              <div className="motivations-grid">
                {STRENGTHS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`motivation-chip${strengths.includes(s) ? ' selected' : ''}`}
                    onClick={() => setStrengths((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  >
                    {s}{strengths.includes(s) && <span className="chip-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">What are you still working on inside?</label>
              <div className="motivations-grid">
                {WEAKNESSES.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`motivation-chip${weaknesses.includes(w) ? ' selected' : ''}`}
                    onClick={() => setWeaknesses((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w])}
                  >
                    {w}{weaknesses.includes(w) && <span className="chip-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(peopleStep)}>
              {strengths.length > 0 || weaknesses.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(5)}>Back</button>
          </div>
        </div>
      )}

      {/* ── People step ── */}
      {step === peopleStep && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step {mode === 'quick' ? 3 : 6} of {totalSteps}</div>
            <h2 className="step-title">Find your people</h2>
            <p className="step-subtitle">
              {workingOn.length > 0
                ? 'People working through the same struggles as you.'
                : tierGoals[0].category
                  ? 'People working toward the same goals as you.'
                  : 'Connect with others on their accountability journey.'}
            </p>
            <div className="spark-explainer">
              <span className="spark-explainer-icon">⚡</span>
              <div>
                <strong>What's a Spark?</strong> It's how you connect on ActPar. Send one to say "I see you, let's hold each other accountable." If they spark back, you're connected and can message each other.
              </div>
            </div>
          </div>
          <div className="step-body">
            {loadingSuggestions ? (
              <div className="suggestions-loading">
                <div className="suggestions-spinner" />
                Finding people for you…
              </div>
            ) : suggestions.length === 0 ? (
              <div className="suggestions-empty">
                <span>🌐</span>
                <p>No one to show yet — explore Connections after you're in!</p>
              </div>
            ) : (
              <div className="suggestion-list">
                {suggestions.map((p) => (
                  <div key={p.id} className="suggestion-card">
                    <div className="suggestion-avatar">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" />
                        : <div className="suggestion-avatar-fallback">{getDisplayName(p, '?')[0]}</div>
                      }
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{getDisplayName(p)}</div>
                      {p.goalTitle && <div className="suggestion-goal">🎯 {p.goalTitle}</div>}
                      {p.city && <div className="suggestion-city">📍 {p.city}</div>}
                    </div>
                    <button
                      className={`suggestion-spark-btn${sparkedIds.has(p.id) ? ' sparked' : ''}`}
                      onClick={() => handleSpark(p.id)}
                      disabled={sparkedIds.has(p.id)}
                    >
                      {sparkedIds.has(p.id) ? '✓ Sparked' : '⚡ Spark'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {sparkedIds.size > 0 && (
              <p className="spark-count-note">⚡ {sparkedIds.size} spark{sparkedIds.size > 1 ? 's' : ''} sent — they'll be notified!</p>
            )}
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(doneStep)}>
              {sparkedIds.size > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(mode === 'quick' ? goalStepNumber : 6)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === doneStep && (
        <div className="onboarding-step onboarding-finish">
          <div className="finish-checkmark">✅</div>
          <h2 className="finish-title">You're all set, {firstName}!</h2>
          <p className="finish-subtitle">
            {mode === 'quick'
              ? "You're ready to go. Dive in and start building momentum."
              : "You've laid the foundation. Now it's time to show up every day."}
          </p>
          <div className="next-steps">
            <div className="next-step-card">
              <span className="next-step-icon">🎯</span>
              <div>
                <div className="next-step-label">Check In Daily</div>
                <div className="next-step-desc">Log your goals every day to build your streak</div>
              </div>
            </div>
            <div className="next-step-card">
              <span className="next-step-icon">🌍</span>
              <div>
                <div className="next-step-label">Explore Communities</div>
                <div className="next-step-desc">Find your people in open communities</div>
              </div>
            </div>
          </div>
          <button className="onboarding-btn primary" onClick={handleFinish} disabled={saving}>
            {saving ? 'Setting things up…' : 'Start My Journey →'}
          </button>
        </div>
      )}
    </div>
  );
}
