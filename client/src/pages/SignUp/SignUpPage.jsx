import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import './SignUpPage.css';

const BUBBLE_COUNT = 7;

const SignUpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Capture referral code from URL and persist it through the signup flow
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('actpar_referral', ref);
  }, [searchParams]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bubbles, setBubbles] = useState([]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match.', 'error'); return;
    }
    if (!agreedToTerms) {
      toast('Please agree to the Terms of Service and Privacy Policy.', 'error'); return;
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
          account_type: 'Personal',
        },
      },
    });

    if (error) {
      toast(`❌ ${error.message}`, 'error');
      setSubmitting(false);
      return;
    }

    // Fresh signup — clear any stale "no remember me" flag from a previous session
    // so the new session survives page reloads (e.g. email confirmation redirect)
    localStorage.removeItem('actpar_no_remember');
    sessionStorage.setItem('actpar_session_active', '1');

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
            <p className="signup-sub">Just the basics — you'll set up your profile next.</p>

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

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
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

            <button type="submit" disabled={submitting || !agreedToTerms}>
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
