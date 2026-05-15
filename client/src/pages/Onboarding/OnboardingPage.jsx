import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useGoals } from '../../hooks/useGoals.js';
import { supabase } from '../../lib/supabase.js';
import { getDisplayName } from '../../utils/displayName.js';
import './OnboardingPage.css';

const CATEGORIES = [
  { value: 'faith', label: '✝️ Faith & Spirituality' },
  { value: 'fitness', label: '💪 Fitness & Health' },
  { value: 'sobriety', label: '🌱 Sobriety & Recovery' },
  { value: 'mindfulness', label: '🧘 Mindfulness & Wellness' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'mental_health', label: '🧠 Mental Health' },
  { value: 'finance', label: '💰 Finance & Wealth' },
  { value: 'relationships', label: '❤️ Relationships & Family' },
  { value: 'learning', label: '📚 Learning & Growth' },
  { value: 'career', label: '💼 Career & Business' },
  { value: 'other', label: '✨ Other' },
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

// Quick: welcome → goal → people → done (steps 1-4)
// Thorough: welcome → goal → holding back → strengths → people → done (steps 1-6)

export default function OnboardingPage() {
  const { user } = useContext(AuthContext);
  const { profile } = useProfile();
  const { addGoal } = useGoals();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null | 'quick' | 'thorough'
  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [workingOn, setWorkingOn] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [saving, setSaving] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sparkedIds, setSparkedIds] = useState(new Set());

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';

  // People step is 3 for quick, 5 for thorough
  const peopleStep = mode === 'quick' ? 3 : 5;
  const doneStep = mode === 'quick' ? 4 : 6;
  const totalSteps = mode === 'quick' ? 3 : 5; // excluding welcome

  function progressPct() {
    if (step === 1) return 0;
    return ((step - 1) / totalSteps) * 100;
  }

  // Load suggestions when entering people step
  useEffect(() => {
    if (step !== peopleStep || !user || !mode) return;
    let cancelled = false;
    setLoadingSuggestions(true);

    const load = async () => {
      let profiles = [];
      const seen = new Set();

      // Priority 1: match by working_on overlap (what the new user is struggling with)
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

      // Priority 2: match by same goal category
      if (profiles.length < 6 && goalCategory) {
        const { data: goalRows } = await supabase
          .from('goals')
          .select('user_id')
          .eq('category', goalCategory)
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

      // Fallback: recent users
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
        const profileIds = profiles.map((p) => p.id);
        const { data: goals } = await supabase
          .from('goals')
          .select('user_id, title')
          .in('user_id', profileIds)
          .eq('is_active', true);
        const goalMap = {};
        (goals ?? []).forEach((g) => { if (!goalMap[g.user_id]) goalMap[g.user_id] = g.title; });
        profiles = profiles.map((p) => ({ ...p, goalTitle: goalMap[p.id] ?? null }));
      }

      if (!cancelled) { setSuggestions(profiles); setLoadingSuggestions(false); }
    };

    load();
    return () => { cancelled = true; };
  }, [step, peopleStep, user?.id, goalCategory, workingOn, mode]);

  async function handleSpark(profileId) {
    setSparkedIds((prev) => new Set([...prev, profileId]));
    await supabase.from('connections').insert({ requester_id: user.id, receiver_id: profileId, status: 'pending' });
  }

  function chooseMode(chosen) {
    setMode(chosen);
    setStep(2);
  }

  async function handleGoalStep() {
    if (goalTitle.trim()) await addGoal(goalTitle.trim(), goalCategory || null);
    setStep(mode === 'quick' ? 3 : 3); // both go to step 3 next, but thorough shows motivations
  }

  async function handleFinish() {
    setSaving(true);
    await Promise.all([
      supabase.auth.updateUser({ data: { onboarding_complete: true, profile_setup_complete: true, working_on: workingOn, strengths, weaknesses } }),
      supabase.from('profiles').update({ onboarding_complete: true, working_on: workingOn }).eq('id', user.id),
    ]);
    setSaving(false);
    navigate('/', { replace: true });
  }

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
                <div className="path-desc">Set a goal, find people, and jump in. Under 2 minutes.</div>
                <div className="path-steps">2 steps</div>
              </button>
              <button className="setup-path-card" onClick={() => chooseMode('thorough')}>
                <div className="path-icon">🧠</div>
                <div className="path-title">Thorough Setup</div>
                <div className="path-desc">Go deeper — define your why, your strengths, and what you're overcoming.</div>
                <div className="path-steps">5 steps</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: First Goal ── */}
      {step === 2 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 1 of {totalSteps}</div>
            <h2 className="step-title">What do you want to achieve?</h2>
            <p className="step-subtitle">Set your first goal to start tracking progress.</p>
          </div>
          <div className="step-body">
            <div className="form-group">
              <label className="form-label">My goal is to…</label>
              <input
                className="onboarding-input"
                type="text"
                placeholder="e.g. Attend church weekly, Save $500/month, Work out 4x a week…"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="category-grid">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`category-chip${goalCategory === c.value ? ' selected' : ''}`}
                    onClick={() => setGoalCategory((prev) => (prev === c.value ? '' : c.value))}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={handleGoalStep}>
              {goalTitle.trim() ? 'Save & Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3 (thorough only): What's holding you back ── */}
      {step === 3 && mode === 'thorough' && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 2 of {totalSteps}</div>
            <h2 className="step-title">What's holding you back?</h2>
            <p className="step-subtitle">Be honest with yourself. This is just between you and your goals.</p>
          </div>
          <div className="step-body">
            <div className="form-group">
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
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(4)}>
              {workingOn.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(2)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 4 (thorough only): Strengths + Weaknesses ── */}
      {step === 4 && mode === 'thorough' && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 3 of {totalSteps}</div>
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
            <button className="onboarding-btn primary" onClick={() => setStep(5)}>
              {strengths.length > 0 || weaknesses.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(3)}>Back</button>
          </div>
        </div>
      )}

      {/* ── People step (step 3 quick / step 5 thorough) ── */}
      {step === peopleStep && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step {mode === 'quick' ? 2 : 4} of {totalSteps}</div>
            <h2 className="step-title">Find your people</h2>
            <p className="step-subtitle">
              {workingOn.length > 0 ? 'People who are working through the same struggles as you.' : goalCategory ? 'People working toward the same goals as you.' : 'Connect with others on their accountability journey.'}
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
            <button className="onboarding-btn ghost" onClick={() => setStep(mode === 'quick' ? 2 : 4)}>Back</button>
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
