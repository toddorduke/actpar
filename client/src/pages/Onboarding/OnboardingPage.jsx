import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useGoals } from '../../hooks/useGoals.js';
import { supabase } from '../../lib/supabase.js';
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

const MOTIVATIONS = [
  'Accountability', 'Consistency', 'Community', 'Faith',
  'Spiritual Growth', 'Sobriety', 'Mental Health', 'Financial Freedom',
  'Family', 'Healing', 'Purpose', 'Focus', 'Confidence', 'Balance',
  'Weight Loss', 'Strength', 'Energy', 'Gratitude', 'Career Growth',
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

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const { user } = useContext(AuthContext);
  const { profile } = useProfile();
  const { addGoal } = useGoals();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [motivations, setMotivations] = useState([]);
  const [workingOn, setWorkingOn] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [saving, setSaving] = useState(false);

  // Step 4 — suggested connections
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sparkedIds, setSparkedIds] = useState(new Set());

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';

  // Load suggested profiles when entering step 4
  useEffect(() => {
    if (step !== 6 || !user) return;
    let cancelled = false;
    setLoadingSuggestions(true);

    const load = async () => {
      let profiles = [];

      if (goalCategory) {
        // Find users with a goal in the same category
        const { data: goalRows } = await supabase
          .from('goals')
          .select('user_id')
          .eq('category', goalCategory)
          .eq('is_active', true)
          .neq('user_id', user.id)
          .limit(12);

        const ids = [...new Set((goalRows ?? []).map((g) => g.user_id))].slice(0, 6);

        if (ids.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, city')
            .in('id', ids);
          profiles = data ?? [];
        }
      }

      // Fallback: recent onboarded users
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

      // Attach one goal title per profile
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

      if (!cancelled) {
        setSuggestions(profiles);
        setLoadingSuggestions(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [step, user?.id, goalCategory]);

  async function handleSpark(profileId) {
    setSparkedIds((prev) => new Set([...prev, profileId]));
    await supabase
      .from('connections')
      .insert({ requester_id: user.id, receiver_id: profileId, status: 'pending' });
  }

  function toggleMotivation(m) {
    setMotivations((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : prev.length < 3 ? [...prev, m] : prev
    );
  }

  function toggleWorkingOn(a) {
    setWorkingOn((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  function toggleStrength(s) {
    setStrengths((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleWeakness(w) {
    setWeaknesses((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);
  }

  async function handleGoalStep() {
    if (goalTitle.trim()) {
      await addGoal(goalTitle.trim(), goalCategory || null);
    }
    setStep(3);
  }

  async function handleFinish() {
    setSaving(true);
    await Promise.all([
      supabase.auth.updateUser({ data: { onboarding_complete: true, working_on: workingOn, strengths, weaknesses } }),
      supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id),
    ]);
    setSaving(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="onboarding-page">
      {/* Progress bar — hidden on final step */}
      {step < 8 && (
        <div className="onboarding-progress">
          <div
            className="onboarding-progress-fill"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div className="onboarding-step onboarding-welcome">
          <div className="welcome-orb" />
          <div className="welcome-content">
            <div className="welcome-emoji">🔥</div>
            <h1 className="welcome-title">Welcome, {firstName}!</h1>
            <p className="welcome-subtitle">
              Your personal accountability journey starts here.
            </p>
            <ul className="welcome-features">
              <li><span className="feature-icon">🎯</span> Set goals and track your progress daily</li>
              <li><span className="feature-icon">⚡</span> Spark connections with like-minded people</li>
              <li><span className="feature-icon">🤝</span> Join Pacts for group accountability</li>
            </ul>
            <button className="onboarding-btn primary" onClick={() => setStep(2)}>
              Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — First Goal */}
      {step === 2 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 1 of 5</div>
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
            <button className="onboarding-btn ghost" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — What Drives You */}
      {step === 3 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 2 of 5</div>
            <h2 className="step-title">What drives you?</h2>
            <p className="step-subtitle">Pick up to 3 things that motivate you most.</p>
          </div>

          <div className="step-body">
            <div className="motivations-grid">
              {MOTIVATIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`motivation-chip${motivations.includes(m) ? ' selected' : ''}`}
                  onClick={() => toggleMotivation(m)}
                >
                  {m}
                  {motivations.includes(m) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
            {motivations.length === 3 && (
              <p className="motivation-max-note">Maximum 3 selected</p>
            )}
          </div>

          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(4)}>
              {motivations.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — What Are You Working to Overcome? */}
      {step === 4 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 3 of 5</div>
            <h2 className="step-title">What are you working to overcome?</h2>
            <p className="step-subtitle">Pick everything that resonates — no judgment here.</p>
          </div>
          <div className="step-body">
            <div className="motivations-grid">
              {GROWTH_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`motivation-chip${workingOn.includes(a) ? ' selected' : ''}`}
                  onClick={() => toggleWorkingOn(a)}
                >
                  {a}
                  {workingOn.includes(a) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(5)}>
              {workingOn.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(3)}>Back</button>
          </div>
        </div>
      )}

      {/* Step 5 — What Are Your Superpowers? */}
      {step === 5 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 4 of 5</div>
            <h2 className="step-title">What are your superpowers?</h2>
            <p className="step-subtitle">Own it — what do you naturally bring to the table?</p>
          </div>
          <div className="step-body">
            <div className="motivations-grid">
              {STRENGTHS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`motivation-chip${strengths.includes(s) ? ' selected' : ''}`}
                  onClick={() => toggleStrength(s)}
                >
                  {s}
                  {strengths.includes(s) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(6)}>
              {strengths.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(4)}>Back</button>
          </div>
        </div>
      )}

      {/* Step 6 — What Are Your Weaknesses? */}
      {step === 6 && (
        <div className="onboarding-step">
          <div className="step-header">
            <div className="step-number">Step 5 of 5</div>
            <h2 className="step-title">What are you still working on inside?</h2>
            <p className="step-subtitle">Owning it is the first step to changing it.</p>
          </div>
          <div className="step-body">
            <div className="motivations-grid">
              {WEAKNESSES.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`motivation-chip${weaknesses.includes(w) ? ' selected' : ''}`}
                  onClick={() => toggleWeakness(w)}
                >
                  {w}
                  {weaknesses.includes(w) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(7)}>
              {weaknesses.length > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(5)}>Back</button>
          </div>
        </div>
      )}

      {/* Step 7 — Find Your People */}
      {step === 7 && (
        <div className="onboarding-step">
          <div className="step-header">
            <h2 className="step-title">Find your people</h2>
            <p className="step-subtitle">
              {goalCategory
                ? 'People working toward the same goals as you.'
                : 'Connect with others on their accountability journey.'}
            </p>
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
                        : <div className="suggestion-avatar-fallback">{p.first_name?.[0] ?? '?'}</div>
                      }
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{p.first_name} {p.last_name}</div>
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
              <p className="spark-count-note">
                ⚡ {sparkedIds.size} spark{sparkedIds.size > 1 ? 's' : ''} sent — they'll be notified!
              </p>
            )}
          </div>

          <div className="step-actions">
            <button className="onboarding-btn primary" onClick={() => setStep(8)}>
              {sparkedIds.size > 0 ? 'Continue' : 'Skip for Now'}
            </button>
            <button className="onboarding-btn ghost" onClick={() => setStep(6)}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 8 — All Set */}
      {step === 8 && (
        <div className="onboarding-step onboarding-finish">
          <div className="finish-checkmark">✅</div>
          <h2 className="finish-title">You're all set, {firstName}!</h2>
          <p className="finish-subtitle">Here's what to do next:</p>

          <div className="next-steps">
            <div className="next-step-card">
              <span className="next-step-icon">🎯</span>
              <div>
                <div className="next-step-label">Your Profile</div>
                <div className="next-step-desc">Add more goals and track your streak</div>
              </div>
            </div>
            <div className="next-step-card">
              <span className="next-step-icon">⚡</span>
              <div>
                <div className="next-step-label">Connections</div>
                <div className="next-step-desc">Spark connections with people who share your goals</div>
              </div>
            </div>
            <div className="next-step-card">
              <span className="next-step-icon">🤝</span>
              <div>
                <div className="next-step-label">Pacts</div>
                <div className="next-step-desc">Join a group for daily accountability</div>
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
