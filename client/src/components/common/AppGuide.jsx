import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import './AppGuide.css';

const QUICK_SLIDES = [
  {
    emoji: '🎯',
    title: 'Your Profile & Goals',
    body: 'This is your home base. Set goals, log progress daily, and build streaks. Your Alter Ego is the version of you that shows up no matter what — name it and own it.',
    tip: 'Tap your profile to add your first goal right now.',
  },
  {
    emoji: '⚡',
    title: 'Sparks & Connections',
    body: 'Browse people chasing goals like yours. Send a Spark to show interest, or hit Connect to link up directly. One real accountability partner can change everything.',
    tip: 'Head to the Sparks tab and swipe through your first few profiles.',
  },
  {
    emoji: '🌍',
    title: 'The Tribe',
    body: 'ActPar\'s community feed. Post wins, share struggles, encourage others. No highlight reels — just real people doing the work every single day.',
    tip: 'Post your first update in Tribe and introduce yourself.',
  },
  {
    emoji: '🚀',
    title: 'You\'re Ready',
    body: 'That\'s the core of ActPar. Your profile is set up, your goals are waiting, and a community of people on the same journey is right here.',
    tip: 'Start with one connection, one goal, one post. The rest follows.',
  },
];

const FULL_SLIDES = [
  ...QUICK_SLIDES.slice(0, 3),
  {
    emoji: '🔐',
    title: 'The Pact',
    body: 'Create or join a private accountability circle. Set your own rules, post updates to your circle, and hold each other to the standard. Invite-only or open for anyone to join.',
    tip: 'Go to the Pact tab to create your first circle or find an open one.',
  },
  {
    emoji: '💬',
    title: 'Direct Messages',
    body: 'Real one-on-one conversations with your connections. Check in on each other, share wins, call each other out — no noise, just accountability.',
    tip: 'Message a connection and set up your first check-in.',
  },
  {
    emoji: '🏋️',
    title: 'Coach Marketplace',
    body: 'Browse verified coaches across fitness, faith, finance, sobriety, mental health, and more. Read their story, see their focus areas, and connect directly.',
    tip: 'Head to Connections → Find a Coach to browse coaches.',
  },
  {
    emoji: '🔔',
    title: 'Stay Accountable',
    body: 'Turn on notifications so you never miss a Spark, a Pact post, or a message from your circle. Accountability only works if you show up — let ActPar remind you.',
    tip: 'Go to Settings → Notifications to customize what alerts you get.',
  },
  QUICK_SLIDES[3],
];

function storageKey(userId) {
  return `actpar_guide_seen_${userId}`;
}

export default function AppGuide() {
  const { user } = useContext(AuthContext);
  const [phase, setPhase] = useState(null); // null | 'choice' | 'quick' | 'full'
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.tour_dismissed) return;
    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) setPhase('choice');
  }, [user]);

  async function dismiss() {
    if (user) {
      localStorage.setItem(storageKey(user.id), '1');
      await supabase.auth.updateUser({ data: { tour_dismissed: true } });
    }
    setPhase(null);
  }

  function startGuide(type) {
    setSlide(0);
    setPhase(type);
  }

  if (!phase) return null;

  // ── Choice screen ──────────────────────────────────────────────────────────
  if (phase === 'choice') {
    return (
      <div className="guide-overlay">
        <div className="guide-modal guide-choice-modal">
          <div className="guide-choice-emoji">👋</div>
          <h2 className="guide-choice-title">Welcome to ActPar</h2>
          <p className="guide-choice-sub">
            Before you dive in, would you like a quick tour of how everything works?
          </p>
          <div className="guide-choice-options">
            <button className="guide-choice-btn primary" onClick={() => startGuide('quick')}>
              <span className="guide-choice-btn-icon">⚡</span>
              <div>
                <div className="guide-choice-btn-label">Quick Tour</div>
                <div className="guide-choice-btn-desc">The basics — 4 slides, 2 min</div>
              </div>
            </button>
            <button className="guide-choice-btn secondary" onClick={() => startGuide('full')}>
              <span className="guide-choice-btn-icon">📖</span>
              <div>
                <div className="guide-choice-btn-label">Full Tour</div>
                <div className="guide-choice-btn-desc">Every feature — 8 slides, 5 min</div>
              </div>
            </button>
            <button className="guide-choice-btn ghost" onClick={dismiss}>
              <span className="guide-choice-btn-icon">🗺️</span>
              <div>
                <div className="guide-choice-btn-label">I'll explore on my own</div>
                <div className="guide-choice-btn-desc">You can always find this in Settings → About</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Slide deck ─────────────────────────────────────────────────────────────
  const slides = phase === 'quick' ? QUICK_SLIDES : FULL_SLIDES;
  const current = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="guide-overlay">
      <div className="guide-modal guide-slide-modal">
        {/* Header */}
        <div className="guide-slide-header">
          <span className="guide-slide-counter">{slide + 1} of {slides.length}</span>
          <button className="guide-skip-btn" onClick={dismiss}>Skip tour</button>
        </div>

        {/* Slide content */}
        <div className="guide-slide-body">
          <div className="guide-slide-emoji">{current.emoji}</div>
          <h2 className="guide-slide-title">{current.title}</h2>
          <p className="guide-slide-text">{current.body}</p>
          <div className="guide-slide-tip">
            <span className="guide-tip-label">Try it:</span> {current.tip}
          </div>
        </div>

        {/* Dot nav */}
        <div className="guide-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`guide-dot${i === slide ? ' active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="guide-slide-actions">
          {slide > 0 && (
            <button className="guide-back-btn" onClick={() => setSlide((s) => s - 1)}>
              ← Back
            </button>
          )}
          {isLast ? (
            <button className="guide-next-btn" onClick={dismiss}>
              Let's Go! 🚀
            </button>
          ) : (
            <button className="guide-next-btn" onClick={() => setSlide((s) => s + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
