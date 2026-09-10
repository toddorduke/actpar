import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import './LoginPage.css';

const INITIAL_FORM = { email: '', password: '' };

// Floating background affirmations -- each gets a scattered position and a
// staggered drift animation (see LoginPage.css) so they read as ambient
// motion behind the card, not as a grid.
const AFFIRMATIONS = [
  'You’ve got this 💪',
  'One day at a time',
  'Small steps, big wins',
  'Progress > perfection',
  'Show up for you',
  'Keep the streak alive 🔥',
  'You’re stronger than you think',
  'Today counts',
  'Consistency wins',
  'Trust the process',
  'Every check-in counts',
  'Be proud of today',
];

// Fixed layout so bubbles are spread out and don't overlap the card --
// randomizing on every render would also restart CSS animations.
// `mobileOk` bubbles sit in the gap above the bottom-sheet card on narrow
// screens (see the max-width: 640px rule in LoginPage.css) -- everything
// else would land under or behind the full-width sheet there, so only the
// handful anchored near the very top stay visible on mobile.
const BUBBLE_LAYOUT = [
  { top: '6%',  left: '20%', size: 'sm', duration: 11, mobileOk: true  },
  { top: '10%', left: '68%', size: 'md', duration: 13, mobileOk: true  },
  { top: '82%', left: '13%', size: 'md', duration: 12, mobileOk: false },
  { top: '86%', left: '66%', size: 'sm', duration: 10, mobileOk: false },
  { top: '15%', left: '42%', size: 'sm', duration: 14, mobileOk: true  },
  { top: '92%', left: '40%', size: 'sm', duration: 11, mobileOk: false },
  { top: '46%', left: '24%', size: 'sm', duration: 9,  mobileOk: false },
  { top: '30%', left: '90%', size: 'md', duration: 15, mobileOk: false },
  { top: '62%', left: '90%', size: 'sm', duration: 12, mobileOk: false },
  { top: '54%', left: '10%', size: 'sm', duration: 10, mobileOk: false },
  { top: '24%', left: '88%', size: 'sm', duration: 13, mobileOk: false },
  { top: '16%', left: '84%', size: 'sm', duration: 9,  mobileOk: false },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (rememberMe) {
      localStorage.removeItem('actpar_no_remember');
      sessionStorage.removeItem('actpar_session_active');
    } else {
      localStorage.setItem('actpar_no_remember', '1');
      sessionStorage.setItem('actpar_session_active', '1');
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-bubbles" aria-hidden="true">
        {BUBBLE_LAYOUT.map((pos, i) => (
          <span
            key={i}
            className={`login-bubble login-bubble--${pos.size}${pos.mobileOk ? ' login-bubble--mobile-ok' : ''}`}
            style={{ top: pos.top, left: pos.left, animationDuration: `${pos.duration}s` }}
          >
            {AFFIRMATIONS[i]}
          </span>
        ))}
      </div>
      <div className="login-container">
        <section className="login-box">
          <div className="login-logo">ActPar</div>
          <p className="login-tagline">Accountability for real goals, real people.</p>
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to continue your journey</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
            </div>

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="login-link">Create one</Link>
          </p>
          <p className="login-footer" style={{ marginTop: '8px' }}>
            <Link to="/about" className="login-link">What is ActPar? →</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
