import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const base = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${base}/reset-password`,
    });

    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-box">
          <div className="fp-logo">ActPar</div>

          {sent ? (
            <>
              <div className="fp-success-icon">📬</div>
              <h2 className="fp-title">Check your email</h2>
              <p className="fp-subtitle">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the link to set a new password.
              </p>
              <p className="fp-hint">Didn't get it? Check your spam folder or try again.</p>
              <button className="fp-btn ghost" onClick={() => setSent(false)}>
                Try a different email
              </button>
              <Link to="/login" className="fp-back-link">← Back to sign in</Link>
            </>
          ) : (
            <>
              <h2 className="fp-title">Forgot your password?</h2>
              <p className="fp-subtitle">
                Enter the email you signed up with and we'll send you a reset link.
              </p>

              <form className="fp-form" onSubmit={handleSubmit}>
                <div className="fp-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && <div className="fp-error">{error}</div>}

                <button type="submit" className="fp-btn primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <Link to="/login" className="fp-back-link">← Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
