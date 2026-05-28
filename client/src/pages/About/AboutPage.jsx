import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const HOW_STEPS = [
  {
    num: '01',
    icon: '🎯',
    title: 'Set Your Goal',
    desc: "Pick what you're working on — fitness, sobriety, finances, faith, anything. Name your Alter Ego and commit to showing up.",
  },
  {
    num: '02',
    icon: '⚡',
    title: 'Find Your Partner',
    desc: "Browse people chasing similar goals. Send a Spark to connect. One real accountability partner changes everything.",
  },
  {
    num: '03',
    icon: '🚀',
    title: 'Show Up Daily',
    desc: 'Log progress, message your partner, post wins to the Tribe feed. Small daily check-ins build unstoppable momentum.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried every app. ActPar is the first one where I actually felt like someone cared if I showed up.",
    name: 'T.W.',
    goal: 'Fitness',
    emoji: '💪',
  },
  {
    quote: "My accountability partner messages me every morning. I haven't missed a workout in 60 days.",
    name: 'D.R.',
    goal: 'Discipline',
    emoji: '🔥',
  },
  {
    quote: 'Being open about my recovery journey here changed everything. Real people, zero judgment.',
    name: 'J.B.',
    goal: 'Sobriety',
    emoji: '🌱',
  },
];

const CATEGORIES = [
  { icon: '💪', label: 'Fitness' },
  { icon: '🌱', label: 'Sobriety' },
  { icon: '✝️', label: 'Faith' },
  { icon: '💰', label: 'Finance' },
  { icon: '🧠', label: 'Mental Health' },
  { icon: '🥗', label: 'Nutrition' },
  { icon: '📚', label: 'Learning' },
  { icon: '❤️', label: 'Relationships' },
  { icon: '🧘', label: 'Mindfulness' },
  { icon: '💼', label: 'Career' },
  { icon: '😴', label: 'Sleep' },
  { icon: '🌊', label: 'Recovery' },
];

const TICKER_ITEMS = [
  '⚡ Marcus sparked with Jordan',
  '🔥 Destiny hit 30 days sober',
  '💪 Alex logged day 14 of Fitness',
  '🎯 Chris set a new savings goal',
  '✝️ Maya checked in on her faith journey',
  '🌱 Jordan posted a win in Tribe',
  '⚡ Sam sparked with Riley',
  '🔥 Drew hit a 21-day streak',
  '💰 Morgan shared a finance win',
  '💪 Casey logged their morning workout',
];

export default function AboutPage() {
  return (
    <div className="lp-page">

      {/* ── Minimal sticky nav ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-logo">ActPar</div>
          <div className="lp-nav-actions">
            <Link to="/login" className="lp-nav-signin">Sign In</Link>
            <Link to="/signup" className="lp-nav-cta">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-glow lp-glow-left" />
        <div className="lp-hero-glow lp-glow-right" />
        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <div className="lp-hero-tag">Your accountability community</div>
            <h1 className="lp-hero-h1">
              The people who<br />
              <span className="lp-hero-accent">show up for you</span><br />
              are already here.
            </h1>
            <p className="lp-hero-sub">
              Set real goals. Find a real partner. Actually follow through.
              ActPar is the social accountability platform for people who are
              serious about change — across every area of life.
            </p>
            <div className="lp-hero-btns">
              <Link to="/signup" className="lp-btn-primary">Get Started — It's Free</Link>
              <Link to="/login" className="lp-btn-ghost">I have an account →</Link>
            </div>
            <div className="lp-hero-pills">
              <span className="lp-pill">💪 Fitness</span>
              <span className="lp-pill">🌱 Sobriety</span>
              <span className="lp-pill">💰 Finance</span>
              <span className="lp-pill">✝️ Faith</span>
              <span className="lp-pill lp-pill-more">+ more</span>
            </div>
          </div>

          <div className="lp-hero-right">
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-screen">
                <div className="lp-mini-header">
                  <span className="lp-mini-logo">ActPar</span>
                  <span className="lp-mini-bell">🔔</span>
                </div>

                <div className="lp-mini-card">
                  <div className="lp-mini-avatar lp-avatar-m">M</div>
                  <div className="lp-mini-card-info">
                    <div className="lp-mini-name">Marcus Webb</div>
                    <div className="lp-mini-goal">💪 Fitness · 30-day goal</div>
                  </div>
                  <div className="lp-mini-streak">🔥 14</div>
                </div>

                <div className="lp-mini-progress-wrap">
                  <div className="lp-mini-progress-label">Today's check-in</div>
                  <div className="lp-mini-progress-bar">
                    <div className="lp-mini-progress-fill" style={{ width: '73%' }} />
                  </div>
                  <div className="lp-mini-progress-pct">73%</div>
                </div>

                <div className="lp-mini-notif">
                  <span className="lp-mini-notif-icon">⚡</span>
                  <span className="lp-mini-notif-text"><b>Destiny</b> sparked with you!</span>
                </div>

                <div className="lp-mini-post">
                  <div className="lp-mini-avatar lp-avatar-d">D</div>
                  <div className="lp-mini-post-body">
                    <div className="lp-mini-post-name">Destiny Reyes</div>
                    <div className="lp-mini-post-text">Day 14 done. No excuses. 🔥</div>
                    <div className="lp-mini-post-actions">
                      <span>❤️ 12</span>
                      <span>💬 4</span>
                    </div>
                  </div>
                </div>

                <div className="lp-mini-connect-card">
                  <div className="lp-mini-avatar lp-avatar-j">J</div>
                  <div className="lp-mini-card-info">
                    <div className="lp-mini-name">Jordan Brooks</div>
                    <div className="lp-mini-goal">🌱 Sobriety · 90-day goal</div>
                  </div>
                  <button className="lp-mini-spark-btn">⚡ Spark</button>
                </div>
              </div>
              <div className="lp-phone-bar" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Activity ticker ── */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="lp-ticker-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-tag">Simple by design</div>
          <h2 className="lp-section-h2">How ActPar works</h2>
          <p className="lp-section-sub">Three steps to the accountability you've been missing.</p>
          <div className="lp-how-grid">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="lp-how-card">
                <div className="lp-how-num">{step.num}</div>
                <div className="lp-how-icon">{step.icon}</div>
                <h3 className="lp-how-title">{step.title}</h3>
                <p className="lp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="lp-section lp-dark-section">
        <div className="lp-container">
          <div className="lp-section-tag">Who it's for</div>
          <h2 className="lp-section-h2">Built for every kind of goal</h2>
          <p className="lp-section-sub">
            ActPar isn't just a fitness app. Whatever you're working on,<br />
            there's a community of people here going through the same thing.
          </p>
          <div className="lp-categories-grid">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="lp-category-chip">
                <span className="lp-category-icon">{c.icon}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-tag">Real stories</div>
          <h2 className="lp-section-h2">People who stopped going alone</h2>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial-card">
                <div className="lp-testimonial-stars">★★★★★</div>
                <p className="lp-testimonial-quote">"{t.quote}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.emoji}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-goal">{t.goal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-dark-section">
        <div className="lp-container">
          <div className="lp-section-tag">What's inside</div>
          <h2 className="lp-section-h2">Everything you need to stay on track</h2>
          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap lp-fi-amber">🎯</div>
              <h3 className="lp-feature-title">Goal Tracking</h3>
              <p className="lp-feature-desc">Set habit goals or numeric targets. Log daily check-ins, build streaks, and hit milestones with your Alter Ego driving you.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap lp-fi-purple">⚡</div>
              <h3 className="lp-feature-title">Spark Connections</h3>
              <p className="lp-feature-desc">Browse people chasing similar goals. Send a Spark — if they Spark back, you're connected and can hold each other accountable.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap lp-fi-green">🌍</div>
              <h3 className="lp-feature-title">Tribe Feed</h3>
              <p className="lp-feature-desc">Post wins, share struggles, and encourage the community. No highlight reels — just real people doing the work every single day.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap lp-fi-blue">💬</div>
              <h3 className="lp-feature-title">Direct Messages</h3>
              <p className="lp-feature-desc">Private one-on-one conversations with your partner. Real talk, real check-ins, real support — no noise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <div className="lp-cta-box">
            <div className="lp-cta-glow" />
            <div className="lp-cta-emoji">🚀</div>
            <h2 className="lp-cta-h2">Ready to stop going it alone?</h2>
            <p className="lp-cta-sub">
              Your accountability partner is already here.<br />
              All you have to do is show up.
            </p>
            <Link to="/signup" className="lp-btn-primary lp-btn-large">Create Your Free Account</Link>
            <p className="lp-cta-note">Free to join · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">ActPar</div>
              <p>Accountability for every journey.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">Platform</div>
                <Link to="/signup">Sign Up</Link>
                <Link to="/login">Sign In</Link>
              </div>
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">Legal</div>
                <a href="/legal/terms-of-service.html" target="_blank" rel="noreferrer">Terms of Service</a>
                <a href="/legal/privacy-policy.html" target="_blank" rel="noreferrer">Privacy Policy</a>
                <a href="mailto:legal@actpar.com">Contact Legal</a>
              </div>
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">Support</div>
                <a href="mailto:hello@actpar.com">Contact Us</a>
                <a href="mailto:dmca@actpar.com">DMCA</a>
                <a href="mailto:safety@actpar.com">Report Safety Issue</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} ActPar. All rights reserved.</span>
            <span>Made in Georgia 🍑</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
