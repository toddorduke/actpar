import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import './AppGuide.css';

// Each slide: route to navigate to, CSS selector to spotlight
const QUICK_SLIDES = [
  {
    emoji: '🎯',
    title: 'Your Goals',
    body: 'This is your home base. Set goals, log daily progress, and build streaks. Your Alter Ego is the version of you that shows up no matter what — name it and own it.',
    tip: 'Tap your profile to add your first goal right now.',
    route: '/',
    target: '.home-card',
  },
  {
    emoji: '⚡',
    title: 'Sparks & Connections',
    body: 'Browse people chasing goals like yours. Send a Spark to show interest — if they spark back you\'re connected and can message each other. One real accountability partner can change everything.',
    tip: 'Head to Connections and send your first Spark.',
    route: '/connections',
    target: 'a[href="/connections"]',
  },
  {
    emoji: '🌍',
    title: 'The Tribe',
    body: 'ActPar\'s community feed. Post wins, share struggles, encourage others. No highlight reels — just real people doing the work every single day.',
    tip: 'Post your first update in Tribe and introduce yourself.',
    route: '/tribe-community',
    target: 'a[href="/tribe-community"]',
  },
  {
    emoji: '🚀',
    title: "You're Ready",
    body: 'That\'s the core of ActPar. Your goals are waiting, and a community of people on the same journey is right here. Start with one connection, one goal, one post.',
    tip: 'The rest follows. Let\'s go.',
    route: '/',
    target: '.home-welcome',
  },
];

const FULL_SLIDES = [
  ...QUICK_SLIDES.slice(0, 3),
  {
    emoji: '💬',
    title: 'Direct Messages',
    body: 'Real one-on-one conversations with your connections. Check in on each other, share wins, call each other out — no noise, just accountability.',
    tip: 'Message a connection and set up your first check-in.',
    route: '/messages',
    target: 'a[href="/messages"]',
  },
  {
    emoji: '🔔',
    title: 'Stay Accountable',
    body: 'Turn on notifications so you never miss a Spark or a message from your connections. Accountability only works if you show up — let ActPar remind you.',
    tip: 'Go to Settings → Notifications to customize your alerts.',
    route: '/',
    target: '.nav-icon-btn',
  },
  QUICK_SLIDES[3],
];

function storageKey(userId) {
  return `actpar_guide_seen_${userId}`;
}

function findTarget(selector) {
  if (!selector) return null;
  const all = Array.from(document.querySelectorAll(selector));
  // Prefer a visible element
  return (
    all.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) || null
  );
}

export default function AppGuide() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [phase, setPhase] = useState(null); // null | 'choice' | 'quick' | 'full'
  const [slide, setSlide] = useState(0);
  const [neverShow, setNeverShow] = useState(true);
  const [spotlight, setSpotlight] = useState(null); // { top, left, width, height }
  const rafRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.tour_dismissed) return;
    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) setPhase('choice');
  }, [user]);

  // Allow Settings (or anywhere) to trigger the tour via a custom event
  useEffect(() => {
    function handleStartTour(e) {
      const type = e.detail?.type ?? 'choice';
      setSlide(0);
      setSpotlight(null);
      setPhase(type);
    }
    window.addEventListener('actpar:start-tour', handleStartTour);
    return () => window.removeEventListener('actpar:start-tour', handleStartTour);
  }, []);

  const dismiss = useCallback(async () => {
    setSpotlight(null);
    setPhase(null);
    if (!user) return;
    if (neverShow) {
      localStorage.setItem(storageKey(user.id), '1');
      await supabase.auth.updateUser({ data: { tour_dismissed: true } });
    } else {
      // Only block re-show for this session
      sessionStorage.setItem(storageKey(user.id), '1');
    }
  }, [user, neverShow]);

  function startGuide(type) {
    setSlide(0);
    setPhase(type);
  }

  // Navigate + spotlight on each slide
  useEffect(() => {
    if (phase !== 'quick' && phase !== 'full') return;
    const slides = phase === 'quick' ? QUICK_SLIDES : FULL_SLIDES;
    const current = slides[slide];

    // Navigate to the slide's page
    navigate(current.route);

    // Wait for page to render then spotlight the target
    cancelAnimationFrame(rafRef.current);
    const timer = setTimeout(() => {
      if (!current.target) { setSpotlight(null); return; }

      const el = findTarget(current.target);
      if (!el) { setSpotlight(null); return; }

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Small extra delay to let scroll settle
      const t2 = setTimeout(() => {
        const r = el.getBoundingClientRect();
        const pad = 10;
        setSpotlight({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2, elTop: r.top, elBottom: r.bottom });
      }, 150);
      return () => clearTimeout(t2);
    }, 350);

    return () => clearTimeout(timer);
  }, [slide, phase, navigate]);

  if (!phase) return null;

  // ── Choice screen ─────────────────────────────────────────────────────────
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
                <div className="guide-choice-btn-desc">Every feature — 6 slides, 4 min</div>
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
          <label className="guide-never-show">
            <input
              type="checkbox"
              checked={neverShow}
              onChange={(e) => setNeverShow(e.target.checked)}
            />
            Don't show this again next time
          </label>
        </div>
      </div>
    );
  }

  // ── Slide deck ────────────────────────────────────────────────────────────
  const slides = phase === 'quick' ? QUICK_SLIDES : FULL_SLIDES;
  const current = slides[slide];
  const isLast = slide === slides.length - 1;
  const isMobile = window.innerWidth <= 540;

  // On mobile: no spotlight, tooltip anchors to bottom via CSS.
  // On desktop: position tooltip relative to the spotlight target.
  const tooltipStyle = (() => {
    if (isMobile) return {};
    if (!spotlight) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const TOOLTIP_H = 420; // generous estimate of tooltip height
    const GAP = 16;
    const centerX = { left: '50%', transform: 'translateX(-50%)' };
    const spaceBelow = window.innerHeight - spotlight.elBottom - GAP;
    const spaceAbove = spotlight.elTop - GAP;

    if (spaceBelow >= TOOLTIP_H) {
      return { top: spotlight.elBottom + GAP, ...centerX };
    }
    if (spaceAbove >= TOOLTIP_H) {
      return { top: spotlight.elTop - TOOLTIP_H - GAP, ...centerX };
    }
    // Not enough room either side — center on screen
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  })();

  return (
    <>
      {/* Spotlight cutout — desktop only. Box-shadow handles all dimming so no separate dim div needed. */}
      {!isMobile && spotlight && (
        <div
          className="guide-spotlight"
          style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        />
      )}

      {/* Dim overlay on mobile (no spotlight cutout) and when spotlight hasn't loaded yet */}
      {(isMobile || !spotlight) && <div className="guide-dim" />}

      {/* Floating tooltip */}
      <div className="guide-tooltip" style={tooltipStyle}>
        <div className="guide-tooltip-header">
          <span className="guide-slide-counter">{slide + 1} / {slides.length}</span>
          <button className="guide-skip-btn" onClick={dismiss}>✕ Skip</button>
        </div>

        <div className="guide-tooltip-body">
          <div className="guide-slide-emoji">{current.emoji}</div>
          <h3 className="guide-slide-title">{current.title}</h3>
          <p className="guide-slide-text">{current.body}</p>
          <div className="guide-slide-tip">
            <span className="guide-tip-label">Try it:</span> {current.tip}
          </div>
        </div>

        <div className="guide-dots">
          {slides.map((_, i) => (
            <button key={i} className={`guide-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />
          ))}
        </div>

        <div className="guide-slide-actions">
          {slide > 0 && (
            <button className="guide-back-btn" onClick={() => setSlide((s) => s - 1)}>← Back</button>
          )}
          {isLast ? (
            <button className="guide-next-btn" onClick={dismiss}>Let's Go! 🚀</button>
          ) : (
            <button className="guide-next-btn" onClick={() => setSlide((s) => s + 1)}>Next →</button>
          )}
        </div>
      </div>
    </>
  );
}
