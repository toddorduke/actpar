import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import './SignUpPage.css';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  gender: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  alterEgoName: '',
  city: '',
  accountType: '',
};

const BUBBLE_COUNT = 7;

const SignUpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const safeZone = { xStart: 30, xEnd: 70, yStart: 20, yEnd: 80 };
    const bubbleSize = window.innerWidth < 768 ? 110 : 160;
    const minDistance = bubbleSize * 1.3;
    const placed = [];

    const overlaps = (x, y) => {
      for (const bubble of placed) {
        const dx = bubble.x - x;
        const dy = bubble.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          return true;
        }
      }
      return false;
    };

    const fetchQuote = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/quotes/random');
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        const payload = await response.json();
        return payload?.quote || 'Keep growing, one step at a time.';
      } catch (error) {
        console.error('Unable to fetch quote', error);
        const fallbacks = [
          'Your future self is cheering for you.',
          'Progress, not perfection.',
          'Small steps every day.',
          'Stay focused on your why.',
          'Consistency beats intensity.'
        ];
        const index = Math.floor(Math.random() * fallbacks.length);
        return fallbacks[index];
      }
    };

    const generateBubbles = async () => {
      const bubbleList = [];

      for (let i = 0; i < BUBBLE_COUNT; i += 1) {
        let top;
        let left;
        let attempts = 0;

        do {
          top = Math.random() * 90;
          left = Math.random() * 90;
          attempts += 1;
          if (attempts > 200) {
            break;
          }
        } while (
          (left > safeZone.xStart && left < safeZone.xEnd && top > safeZone.yStart && top < safeZone.yEnd) ||
          overlaps(left, top)
        );

        placed.push({ x: left, y: top });
        const quote = await fetchQuote();

        bubbleList.push({
          id: i,
          quote,
          style: {
            top: `${top}%`,
            left: `${left}%`,
            width: `${bubbleSize}px`,
            height: `${bubbleSize}px`
          }
        });
      }

      if (!cancelled) {
        setBubbles(bubbleList);
      }
    };

    generateBubbles();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (!agreedToTerms) {
      toast('Please agree to the Terms of Service and Privacy Policy.', 'error');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender || null,
          age: formData.age ? Number.parseInt(formData.age, 10) : null,
          alter_ego_name: formData.alterEgoName,
          city: formData.city,
          account_type: formData.accountType,
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

    // If Supabase auto-confirms (no email verification), user is now logged in → go to onboarding
    // If email verification is required, they'll go through login first, then hit onboarding
    navigate('/onboarding');
  };

  return (
    <div className="signup-page">
      <div className="signup-bubbles">
        {bubbles.map((bubble) => (
          <div key={bubble.id} className="bubble" style={bubble.style}>
            {bubble.quote}
          </div>
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
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <fieldset className="fieldset">
              <legend>Select your Gender:</legend>
              <div className="radio-group">
                <label htmlFor="gender-male" className="radio-option">
                  <input
                    type="radio"
                    id="gender-male"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={handleChange}
                  />
                  Male
                </label>
                <label htmlFor="gender-female" className="radio-option">
                  <input
                    type="radio"
                    id="gender-female"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={handleChange}
                  />
                  Female
                </label>
              </div>
            </fieldset>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
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
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  autoComplete="bday"
                  min="0"
                  max="120"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="alterEgoName">Alter Ego Name</label>
                <input
                  type="text"
                  id="alterEgoName"
                  name="alterEgoName"
                  value={formData.alterEgoName}
                  onChange={handleChange}
                  autoComplete="nickname"
                  placeholder="e.g. The Iron Version"
                />
                <span className="signup-field-hint">Your accountability persona — who you're becoming.</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="city">What city are you in?</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                autoComplete="address-level2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountType">What kind of account are you setting up:</label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select account type
                </option>
                <option value="Personal">Personal</option>
                <option value="Coach">Coach</option>
              </select>
            </div>

            <label className="signup-terms-row">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
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

          <p className="signup-footer">
            Already have an account?{' '}
            <Link to="/login" className="signup-link">Sign in</Link>
          </p>
          <p className="signup-footer" style={{ marginTop: '6px' }}>
            <Link to="/about" className="signup-link">What is ActPar? →</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default SignUpPage;
