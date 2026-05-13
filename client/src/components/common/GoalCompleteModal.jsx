import React, { useEffect, useRef } from 'react';
import './GoalCompleteModal.css';

const COLORS = ['#f59e0b', '#fbbf24', '#fcd34d', '#7c3aed', '#a855f7', '#10b981', '#ef4444', '#3b82f6'];

function GoldConfetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => i);
  return (
    <div className="gc-confetti" aria-hidden="true">
      {pieces.map((i) => {
        const color = COLORS[i % COLORS.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2 + Math.random() * 1.5;
        const size = 7 + Math.random() * 9;
        const shape = i % 4;
        return (
          <div
            key={i}
            className="gc-piece"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: size,
              height: shape === 0 ? size : shape === 1 ? size * 0.4 : size,
              borderRadius: shape === 0 ? '50%' : shape === 2 ? 2 : 0,
              background: color,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function GoalCompleteModal({ goalTitle, dayCount, onComplete, onKeepGoing }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onKeepGoing();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onKeepGoing]);

  return (
    <div
      className="gc-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onKeepGoing()}
    >
      <GoldConfetti />
      <div className="gc-card">
        <div className="gc-trophy">🏆</div>

        <div className="gc-badge-row">
          <span className="gc-badge">{dayCount} Days</span>
          <span className="gc-badge gc-badge--gold">GOAL COMPLETE</span>
        </div>

        <h1 className="gc-headline">You Did It.</h1>
        <p className="gc-goal-name">"{goalTitle}"</p>
        <p className="gc-sub">
          90 days of showing up, no matter what. That's not luck — that's who you are now.
          This goal is part of you.
        </p>

        <div className="gc-divider" />

        <p className="gc-prompt">What do you want to do with this goal?</p>

        <div className="gc-actions">
          <button className="gc-complete-btn" onClick={onComplete}>
            <span className="gc-complete-icon">🏆</span>
            Move to Trophy Case
            <span className="gc-complete-sub">Lock it in and celebrate the win</span>
          </button>
          <button className="gc-keep-btn" onClick={onKeepGoing}>
            Keep the streak going →
          </button>
        </div>
      </div>
    </div>
  );
}
