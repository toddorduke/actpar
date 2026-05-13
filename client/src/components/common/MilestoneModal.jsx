import React, { useEffect, useRef } from 'react';
import './MilestoneModal.css';

const MESSAGES = {
  7:  { headline: "One Week Strong!", sub: "Seven days in a row. The habit is forming — don't stop now." },
  30: { headline: "30-Day Legend!", sub: "A full month of showing up. That's real commitment." },
  60: { headline: "60 Days of Fire!", sub: "Two months straight. You're built different." },
  90: { headline: "90-Day Champion!", sub: "Three months. You didn't just start — you finished. Elite." },
};

const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#f97316'];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((i) => {
        const color = COLORS[i % COLORS.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 1.2;
        const duration = 1.8 + Math.random() * 1.4;
        const size = 6 + Math.random() * 8;
        const isCircle = i % 3 === 0;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: size,
              height: isCircle ? size : size * 0.5,
              borderRadius: isCircle ? '50%' : 2,
              background: color,
            }}
          />
        );
      })}
    </div>
  );
}

export default function MilestoneModal({ days, goalTitle, onClose, onShare }) {
  const msg = MESSAGES[days] ?? { headline: `${days}-Day Streak!`, sub: "Keep the momentum going!" };
  const overlayRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="milestone-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <Confetti />
      <div className="milestone-card">
        <div className="milestone-flame">🔥</div>
        <div className="milestone-days">{days} Days</div>
        <h2 className="milestone-headline">{msg.headline}</h2>
        <p className="milestone-goal-name">"{goalTitle}"</p>
        <p className="milestone-sub">{msg.sub}</p>

        <div className="milestone-actions">
          {onShare && (
            <button className="milestone-share-btn" onClick={onShare}>
              Share to Tribe
            </button>
          )}
          <button className="milestone-close-btn" onClick={onClose}>
            Keep Going
          </button>
        </div>
      </div>
    </div>
  );
}
