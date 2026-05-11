import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import './LoginPage.css';

const INITIAL_FORM = { email: '', password: '' };

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

    // AuthContext picks up the session change automatically
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
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

            <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>

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
