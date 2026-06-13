import React from 'react';
import Avatar from './Avatar.jsx';
import './WeeklyRecapModal.css';

const GRADE_ORDER = ['Missed', 'Rough', 'Decent', 'Strong', 'Flawless'];

function gradeDelta(current, prev) {
  if (!prev) return null;
  const ci = GRADE_ORDER.indexOf(current);
  const pi = GRADE_ORDER.indexOf(prev);
  if (ci === -1 || pi === -1 || ci === pi) return null;
  return ci > pi ? 'up' : 'down';
}

export default function WeeklyRecapModal({ recap, prevGrade, onClose }) {
  const {
    dateRange, habitGoals, activeThisWeek, totalStreakDays,
    bestStreak, goalsWithMilestone, activeConnections,
    grade, gradeColor, message,
  } = recap;

  const delta = gradeDelta(grade, prevGrade);

  const activeIds = new Set(activeThisWeek.map((g) => g.id));

  return (
    <div className="wr-overlay" onClick={(e) => e.target.classList.contains('wr-overlay') && onClose()}>
      <div className="wr-card">

        {/* Header */}
        <div className="wr-header">
          <div className="wr-header-label">Weekly Recap</div>
          <h2 className="wr-title">How was your week?</h2>
          <p className="wr-date-range">{dateRange}</p>
          <button className="wr-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="wr-body">

          {/* Grade */}
          <div className="wr-grade-row">
            <div className="wr-grade-block">
              <div className="wr-grade" style={{ color: gradeColor }}>{grade}</div>
              {delta && (
                <span className={`wr-grade-delta wr-grade-delta--${delta}`}>
                  {delta === 'up' ? '▲' : '▼'} vs last week
                </span>
              )}
              {!delta && prevGrade && (
                <span className="wr-grade-delta wr-grade-delta--same">= same as last week</span>
              )}
            </div>
            <p className="wr-message">{message}</p>
          </div>

          {/* Stats row */}
          <div className="wr-stats">
            <div className="wr-stat">
              <div className="wr-stat-num" style={{ color: gradeColor }}>
                {activeThisWeek.length}/{habitGoals.length}
              </div>
              <div className="wr-stat-label">Goals Active</div>
            </div>
            <div className="wr-stat">
              <div className="wr-stat-num">{totalStreakDays}</div>
              <div className="wr-stat-label">Total Streak Days</div>
            </div>
            <div className="wr-stat">
              <div className="wr-stat-num">{activeConnections}</div>
              <div className="wr-stat-label">Active Connections</div>
            </div>
          </div>

          {/* Best streak */}
          {bestStreak && bestStreak.day_count > 0 && (
            <div className="wr-best-streak">
              <span className="wr-fire">🔥</span>
              <div>
                <div className="wr-best-streak-title">Best Streak</div>
                <div className="wr-best-streak-detail">
                  {bestStreak.title} · <strong>Day {bestStreak.day_count}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Goal breakdown */}
          {habitGoals.length > 0 && (
            <div className="wr-section">
              <div className="wr-section-label">Goal Breakdown</div>
              <div className="wr-goal-list">
                {habitGoals.map((g) => {
                  const active = activeIds.has(g.id);
                  return (
                    <div key={g.id} className={`wr-goal-row${active ? ' active' : ' missed'}`}>
                      <span className="wr-goal-check">{active ? '✅' : '❌'}</span>
                      <div className="wr-goal-info">
                        <span className="wr-goal-name">{g.title}</span>
                        <span className="wr-goal-day">Day {g.day_count ?? 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milestone alerts */}
          {goalsWithMilestone.length > 0 && (
            <div className="wr-section">
              <div className="wr-section-label">Closing In 🎯</div>
              {goalsWithMilestone.map((g) => (
                <div key={g.id} className="wr-milestone-alert">
                  <span>"{g.title}"</span>
                  <span className="wr-milestone-tag">
                    {g.daysToMilestone === 0
                      ? `Hit ${g.nextMilestone} days today!`
                      : `${g.daysToMilestone}d to ${g.nextMilestone}-day milestone`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button className="wr-cta" onClick={onClose}>
            Let's make next week count →
          </button>
        </div>
      </div>
    </div>
  );
}
