import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [ready, setReady] = useState(false);   // true once Supabase confirms recovery session
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    // If no event fires within 4 seconds the link is invalid/expired
    const timer = setTimeout(() => {
      setInvalid((prev) => prev || !ready);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast(error.message, 'error');
      return;
    }

    toast('Password updated! Please sign in.', 'success');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="rp-page">
      <div className="rp-container">
        <div className="rp-box">
          <div className="rp-logo">ActPar</div>

          {invalid && !ready ? (
            <>
              <div className="rp-icon">⚠️</div>
              <h2 className="rp-title">Link expired</h2>
              <p className="rp-subtitle">
                This reset link is invalid or has expired. Reset links are single-use and expire after 1 hour.
              </p>
              <button className="rp-btn primary" onClick={() => navigate('/forgot-password')}>
                Request a new link
              </button>
            </>
          ) : !ready ? (
            <>
              <div className="rp-icon rp-spin">⏳</div>
              <h2 className="rp-title">Verifying link…</h2>
              <p className="rp-subtitle">Just a moment while we verify your reset link.</p>
            </>
          ) : (
            <>
              <div className="rp-icon">🔑</div>
              <h2 className="rp-title">Set a new password</h2>
              <p className="rp-subtitle">Choose something strong that you haven't used before.</p>

              <form className="rp-form" onSubmit={handleSubmit}>
                <div className="rp-field">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="rp-field">
                  <label htmlFor="confirm">Confirm new password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button type="submit" className="rp-btn primary" disabled={submitting}>
                  {submitting ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
