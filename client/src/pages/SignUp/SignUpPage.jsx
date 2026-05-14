import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import './SignUpPage.css';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

const GOAL_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

const GROWTH_AREAS = [
  'Beating Procrastination', 'Building Daily Discipline', 'Sharpening My Focus',
  'Staying Consistent', 'Reigniting My Motivation', 'Mastering My Time',
  'Silencing Self-Doubt', 'Breaking Old Habits', 'Taking More Action',
  'Quieting Overthinking', 'Managing Stress Better', 'Showing Up for Myself',
];

const INITIAL_FORM = {
  firstName: '', lastName: '', gender: '', email: '', phone: '',
  password: '', confirmPassword: '', age: '', alterEgoName: '',
  city: '', state: '', accountType: '',
};


const BUBBLE_COUNT = 7;

const SignUpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [lookingFor, setLookingFor] = useState([]);
  const [workingOn, setWorkingOn] = useState([]);
  const [customGoal, setCustomGoal] = useState('');

  const toggleGoal = (cat) => setLookingFor(prev =>
    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
  );
  const toggleGrowth = (area) => setWorkingOn(prev =>
    prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
  );

  function addCustomGoal() {
    const tag = customGoal.trim();
    if (!tag || lookingFor.includes(tag)) { setCustomGoal(''); return; }
    setLookingFor(prev => [...prev, tag]);
    setCustomGoal('');
  }

  // Alter ego availability
  const [egoStatus, setEgoStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const egoTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const safeZone = { xStart: 30, xEnd: 70, yStart: 20, yEnd: 80 };
    const bubbleSize = window.innerWidth < 768 ? 110 : 160;
    const minDistance = bubbleSize * 1.3;
    const placed = [];

    const overlaps = (x, y) => placed.some(b => {
      const dx = b.x - x, dy = b.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    const fallbacks = [
      'Your future self is cheering for you.', 'Progress, not perfection.',
      'Small steps every day.', 'Stay focused on your why.', 'Consistency beats intensity.',
    ];

    const generateBubbles = async () => {
      const bubbleList = [];
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        let top, left, attempts = 0;
        do {
          top = Math.random() * 90; left = Math.random() * 90; attempts++;
          if (attempts > 200) break;
        } while (
          (left > safeZone.xStart && left < safeZone.xEnd && top > safeZone.yStart && top < safeZone.yEnd) ||
          overlaps(left, top)
        );
        placed.push({ x: left, y: top });
        bubbleList.push({
          id: i,
          quote: fallbacks[Math.floor(Math.random() * fallbacks.length)],
          style: { top: `${top}%`, left: `${left}%`, width: `${bubbleSize}px`, height: `${bubbleSize}px` },
        });
      }
      if (!cancelled) setBubbles(bubbleList);
    };

    generateBubbles();
    return () => { cancelled = true; };
  }, []);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'alterEgoName') checkAlterEgo(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match.', 'error'); return;
    }
    if (!agreedToTerms) {
      toast('Please agree to the Terms of Service and Privacy Policy.', 'error'); return;
    }
    if (egoStatus === 'taken') {
      toast('That Alter Ego Name is already taken — try a different one.', 'error'); return;
    }

    setSubmitting(true);

    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${appUrl}/onboarding`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender || null,
          age: formData.age ? Number.parseInt(formData.age, 10) : null,
          alter_ego_name: formData.alterEgoName || null,
          city: formData.city || null,
          state: formData.state || null,
          phone: formData.phone || null,
          account_type: formData.accountType,
          looking_for: lookingFor,
          working_on: workingOn,
        },
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase().includes('alter_ego')
        ? 'That Alter Ego Name is already taken — try a different one.'
        : error.message;
      toast(`❌ ${msg}`, 'error');
      setSubmitting(false);
      return;
    }

    // If session is null, Supabase requires email confirmation first
    if (!signUpData.session) {
      setSubmitting(false);
      navigate('/check-email', { state: { email: formData.email } });
      return;
    }

    navigate('/onboarding');
  };

  return (
    <div className="signup-page">
      <div className="signup-bubbles">
        {bubbles.map((bubble) => (
          <div key={bubble.id} className="bubble" style={bubble.style}>{bubble.quote}</div>
        ))}
      </div>

      <div className="signup-container">
        <section className="signup-box">
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-brand">
              <div className="signup-brand-logo">ActPar</div>
              <p className="signup-brand-tagline">The accountability platform for real goals, real people.</p>
            </div>
            <h2>Create Your Account</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} autoComplete="given-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} autoComplete="family-name" required />
              </div>
            </div>

            <fieldset className="fieldset">
              <legend>Select your Gender:</legend>
              <div className="radio-group">
                {['Male', 'Female'].map(g => (
                  <label key={g} htmlFor={`gender-${g.toLowerCase()}`} className="radio-option">
                    <input type="radio" id={`gender-${g.toLowerCase()}`} name="gender" value={g} checked={formData.gender === g} onChange={handleChange} />
                    {g}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number <span className="signup-field-hint" style={{ fontStyle: 'normal' }}>(optional)</span></label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" placeholder="e.g. (404) 555-0123" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} autoComplete="bday" min="0" max="120" required />
              </div>
              <div className="form-group">
                <label htmlFor="alterEgoName">Alter Ego Name</label>
                <input
                  type="text" id="alterEgoName" name="alterEgoName"
                  value={formData.alterEgoName} onChange={handleChange}
                  autoComplete="nickname" placeholder="e.g. The Iron Version"
                  className={egoStatus === 'taken' ? 'input-error' : egoStatus === 'available' ? 'input-success' : ''}
                />
                {egoStatus === 'checking' && <span className="signup-field-hint">Checking availability…</span>}
                {egoStatus === 'available' && <span className="signup-field-hint ego-available">✓ Available!</span>}
                {egoStatus === 'taken' && <span className="signup-field-hint ego-taken">✗ Already taken — try another.</span>}
                {!egoStatus && <span className="signup-field-hint">Your accountability persona — who you're becoming.</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} autoComplete="address-level2" placeholder="e.g. Atlanta" />
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <select id="state" name="state" value={formData.state} onChange={handleChange}>
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="accountType">What kind of account are you setting up:</label>
              <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange} required>
                <option value="" disabled>Select account type</option>
                <option value="Personal">Personal</option>
                <option value="Coach">Coach</option>
              </select>
            </div>

            <div className="form-group">
              <label>What do you want to achieve? <span className="signup-field-hint" style={{ fontStyle: 'normal' }}>(pick all that apply)</span></label>
              <div className="signup-goal-chips">
                {GOAL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`signup-goal-chip${lookingFor.includes(cat) ? ' selected' : ''}`}
                    onClick={() => toggleGoal(cat)}
                  >
                    {cat}
                  </button>
                ))}
                {lookingFor.filter(t => !GOAL_CATEGORIES.includes(t)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="signup-goal-chip selected"
                    onClick={() => setLookingFor(prev => prev.filter(t => t !== tag))}
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="signup-custom-row">
                <input
                  type="text"
                  className="signup-custom-input"
                  placeholder="Something else? Add your own…"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomGoal(); } }}
                />
                <button type="button" className="signup-custom-add" onClick={addCustomGoal}>+</button>
              </div>
            </div>

            <div className="form-group">
              <label>What are you ready to conquer? <span className="signup-field-hint" style={{ fontStyle: 'normal' }}>(pick all that apply)</span></label>
              <div className="signup-goal-chips">
                {GROWTH_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    className={`signup-goal-chip${workingOn.includes(area) ? ' selected' : ''}`}
                    onClick={() => toggleGrowth(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <label className="signup-terms-row">
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
              <span>
                I agree to the{' '}
                <a href="/legal/terms-of-service.html" target="_blank" rel="noreferrer" className="signup-link">Terms of Service</a>
                {' '}and{' '}
                <a href="/legal/privacy-policy.html" target="_blank" rel="noreferrer" className="signup-link">Privacy Policy</a>
              </span>
            </label>

            <button type="submit" disabled={submitting || !agreedToTerms || egoStatus === 'taken'}>
              {submitting ? 'Creating account...' : 'Create My Account'}
            </button>
          </form>

          <p className="signup-footer">Already have an account?{' '}<Link to="/login" className="signup-link">Sign in</Link></p>
          <p className="signup-footer" style={{ marginTop: '6px' }}><Link to="/about" className="signup-link">What is ActPar? →</Link></p>
        </section>
      </div>
    </div>
  );
};

export default SignUpPage;
