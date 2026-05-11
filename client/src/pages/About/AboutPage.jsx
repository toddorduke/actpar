import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AboutPage.css';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Goal Tracking',
    desc: 'Set habit goals or numeric targets. Log daily check-ins, track streaks, and get notified when you hit milestones.',
  },
  {
    icon: '⚡',
    title: 'Spark Connections',
    desc: 'Find people working toward the same goals. Send a spark to connect and keep each other accountable.',
  },
  {
    icon: '🤝',
    title: 'Pacts',
    desc: 'Form or join a group with shared commitments. Set rules, post updates, and hold each other to the standard.',
  },
  {
    icon: '🌍',
    title: 'Tribe Community',
    desc: 'Share wins, struggles, and encouragement with the broader ActPar community.',
  },
  {
    icon: '💬',
    title: 'Direct Messages',
    desc: 'Private one-on-one conversations with your connections — real talk, real support.',
  },
  {
    icon: '🏋️',
    title: 'Coach Marketplace',
    desc: 'Find a verified coach in your area of growth. Faith, fitness, finance, sobriety, relationships, and more.',
  },
];

const CATEGORIES = [
  { icon: '✝️', label: 'Faith & Spirituality' },
  { icon: '💪', label: 'Fitness & Health' },
  { icon: '🌱', label: 'Sobriety & Recovery' },
  { icon: '🧠', label: 'Mental Health' },
  { icon: '💰', label: 'Finance & Wealth' },
  { icon: '❤️', label: 'Relationships & Family' },
  { icon: '🥗', label: 'Nutrition' },
  { icon: '🧘', label: 'Mindfulness & Wellness' },
  { icon: '📚', label: 'Learning & Growth' },
  { icon: '💼', label: 'Career & Business' },
];

const VALUES = [
  { icon: '🔥', title: 'Accountability First', desc: 'Progress happens when someone is watching. We build that into everything.' },
  { icon: '🌎', title: 'Every Journey Matters', desc: 'Whether you\'re chasing sobriety, savings, or strength — your goal deserves real support.' },
  { icon: '🔒', title: 'Safe Community', desc: 'We have real moderation, blocking, and reporting tools. This is a judgment-free zone.' },
  { icon: '🤲', title: 'Built for Real People', desc: 'Not influencers. Not highlight reels. Just people doing the work every day.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-logo">ActPar</div>
          <h1 className="about-headline">Accountability for every goal,<br />every background, every journey.</h1>
          <p className="about-subheadline">
            ActPar is a social accountability platform where real people set goals,
            build connections, and actually follow through — together.
          </p>
          <div className="about-hero-actions">
            <Link to="/signup" className="about-cta-btn primary">Get Started Free</Link>
            <Link to="/login" className="about-cta-btn ghost">Sign In</Link>
          </div>
        </div>
        <div className="about-hero-orb" />
      </section>

      {/* Mission */}
      <section className="about-section about-mission">
        <div className="about-container">
          <div className="about-mission-text">
            <span className="about-section-tag">Our Mission</span>
            <h2>Most people quit because they're going alone.</h2>
            <p>
              ActPar exists to change that. We believe accountability is the missing ingredient
              in most people's journey — not motivation, not information, not willpower.
              When someone is watching, when someone cares, when you've made a commitment to
              a real person — you show up differently.
            </p>
            <p>
              We built ActPar for the person in recovery who needs a daily check-in partner.
              For the person trying to get their finances right. For the athlete, the believer,
              the parent trying to be better. Every goal matters here.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="about-section">
        <div className="about-container">
          <span className="about-section-tag">What We Offer</span>
          <h2 className="about-section-title">Everything you need to stay on track</h2>
          <div className="about-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="about-feature-card">
                <div className="about-feature-icon">{f.icon}</div>
                <h3 className="about-feature-title">{f.title}</h3>
                <p className="about-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="about-section about-categories-section">
        <div className="about-container">
          <span className="about-section-tag">Who It's For</span>
          <h2 className="about-section-title">Built for every kind of goal</h2>
          <p className="about-section-sub">
            ActPar isn't just a fitness app. We support accountability across every area of life.
          </p>
          <div className="about-categories-grid">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="about-category-chip">
                <span>{c.icon}</span>
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section">
        <div className="about-container">
          <span className="about-section-tag">Our Values</span>
          <h2 className="about-section-title">What we stand for</h2>
          <div className="about-values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="about-value-card">
                <div className="about-value-icon">{v.icon}</div>
                <h3 className="about-value-title">{v.title}</h3>
                <p className="about-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-section about-cta-section">
        <div className="about-container">
          <div className="about-cta-box">
            <h2>Ready to start?</h2>
            <p>Join thousands of people holding each other accountable every single day.</p>
            <Link to="/signup" className="about-cta-btn primary large">Create Your Free Account</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-container">
          <div className="about-footer-top">
            <div className="about-footer-brand">
              <div className="about-footer-logo">ActPar</div>
              <p>Accountability for every journey.</p>
            </div>
            <div className="about-footer-links">
              <div className="about-footer-col">
                <div className="about-footer-col-title">Platform</div>
                <Link to="/signup">Sign Up</Link>
                <Link to="/login">Sign In</Link>
                <Link to="/coaches">Find a Coach</Link>
              </div>
              <div className="about-footer-col">
                <div className="about-footer-col-title">Legal</div>
                <a href="/legal/terms-of-service.html" target="_blank" rel="noreferrer">Terms of Service</a>
                <a href="/legal/privacy-policy.html" target="_blank" rel="noreferrer">Privacy Policy</a>
                <a href="mailto:legal@actpar.com">Contact Legal</a>
              </div>
              <div className="about-footer-col">
                <div className="about-footer-col-title">Support</div>
                <a href="mailto:hello@actpar.com">Contact Us</a>
                <a href="mailto:dmca@actpar.com">DMCA</a>
                <a href="mailto:safety@actpar.com">Report Safety Issue</a>
              </div>
            </div>
          </div>
          <div className="about-footer-bottom">
            <span>© {new Date().getFullYear()} ActPar. All rights reserved.</span>
            <span>Made in Georgia 🍑</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
