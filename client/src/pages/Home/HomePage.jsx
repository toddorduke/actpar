import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useGoals } from '../../hooks/useGoals.js';
import { useProfile } from '../../hooks/useProfile.js';
import { getDisplayName } from '../../utils/displayName.js';
import { useReflections } from '../../hooks/useReflections.js';
import { useConnections } from '../../hooks/useConnections.js';
import { useConnectionActivity, isMilestone } from '../../hooks/useConnectionActivity.js';
import { shouldShowRecap, dismissRecap, computeRecap } from '../../hooks/useWeeklyRecap.js';
import WeeklyRecapModal from '../../components/common/WeeklyRecapModal.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import './HomePage.css';

const QUESTIONS = [
  { id: 1, text: "What's one thing you're grateful for today?" },
  { id: 2, text: "What's the biggest win you had this week with your goals?" },
  { id: 3, text: "What's one challenge you're facing right now, and how can your tribe help?" },
];

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { goals, loading: goalsLoading, addGoal, deleteGoal, checkIn } = useGoals();
  const { profile } = useProfile();
  const { saveAnswer } = useReflections();
  const { acceptedConnections } = useConnections();
  const { activity, loading: activityLoading } = useConnectionActivity(acceptedConnections);
  const toast = useToast();

  const [showRecap, setShowRecap] = useState(() => false);
  const [recap, setRecap] = useState(null);

  // Show recap once goals have loaded so we have real data
  useEffect(() => {
    if (goalsLoading) return;
    if (!shouldShowRecap()) return;
    const computed = computeRecap(goals, acceptedConnections, activity);
    setRecap(computed);
    setShowRecap(true);
  }, [goalsLoading]);

  const [checkingIn, setCheckingIn] = useState({});
  const todayStr = new Date().toISOString().split('T')[0];
  const habitGoals = goals.filter((g) => g.goal_type !== 'numeric');
  const allCheckedIn = habitGoals.length > 0 && habitGoals.every((g) => g.last_checked_in === todayStr);
  const autoCheckinRan = useRef(false);

  // Auto-check-in when user taps the daily reminder notification
  useEffect(() => {
    if (goalsLoading) return;
    if (!searchParams.get('auto-checkin')) return;
    if (autoCheckinRan.current) return;
    autoCheckinRan.current = true;

    const unchecked = habitGoals.filter((g) => g.last_checked_in !== todayStr);
    if (unchecked.length === 0) {
      toast("You've already logged everything today ✓", 'success');
    } else {
      Promise.all(unchecked.map((g) => checkIn(g.id, 'auto'))).then(() => {
        toast(`✓ ${unchecked.length} goal${unchecked.length !== 1 ? 's' : ''} logged automatically`, 'success', 4000);
      });
    }
    // Clean the URL param without a page reload
    setSearchParams((p) => { p.delete('auto-checkin'); return p; }, { replace: true });
  }, [goalsLoading]);

  async function handleQuickCheckIn(goalId) {
    if (checkingIn[goalId]) return;
    setCheckingIn((p) => ({ ...p, [goalId]: true }));
    const result = await checkIn(goalId);
    setCheckingIn((p) => ({ ...p, [goalId]: false }));
    if (result?.alreadyDone) return;
    if (result?.milestone) {
      toast(`🔥 ${result.milestone}-day streak on "${result.goalTitle}"!`, 'success', 4000);
    }
  }

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [cheerSent, setCheerSent] = useState(new Set());

  async function sendCheer(item) {
    const myName = getDisplayName(user?.user_metadata, 'Your connection');
    await supabase.from('notifications').insert({
      user_id: item.profiles.id,
      actor_id: user.id,
      type: 'cheer',
      body: `${myName} cheered your check-in on "${item.title}"! 🔥`,
    });
    setCheerSent((prev) => new Set([...prev, item.id]));
  }
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Real suggested connections: profiles not yet connected
  const [suggested, setSuggested] = useState([]);
  const [sendingTo, setSendingTo] = useState(null);


  const firstName = user?.user_metadata?.first_name ?? 'there';

  useEffect(() => {
    async function loadSuggested() {
      if (!user) return;

      // Get all connection IDs (sent or received)
      const { data: conns } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const excludeIds = [user.id];
      for (const c of conns ?? []) {
        excludeIds.push(c.requester_id, c.receiver_id);
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, alter_ego_name, city, avatar_url, tagline')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(4);

      setSuggested(profiles ?? []);
    }
    loadSuggested();
  }, [user]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswer = async (question) => {
    const content = answers[question.id];
    if (!content?.trim()) {
      toast('Please write an answer before submitting.', 'warning');
      return;
    }
    setSubmitting((prev) => ({ ...prev, [question.id]: true }));
    const { error } = await saveAnswer({ question: question.text, answer: content.trim(), isPublic: false });
    if (error) {
      toast(`Couldn't save: ${error?.message || JSON.stringify(error)}`, 'error');
    } else {
      toast('Reflection saved! 💫', 'success');
      setAnswers((prev) => ({ ...prev, [question.id]: '' }));
    }
    setSubmitting((prev) => ({ ...prev, [question.id]: false }));
  };

  const handleAddGoal = async (event) => {
    event.preventDefault();
    if (!newGoalTitle.trim()) return;
    setAddingGoal(true);
    await addGoal(newGoalTitle.trim());
    setNewGoalTitle('');
    setShowAddForm(false);
    setAddingGoal(false);
  };

  const handleSendSpark = async (profileId) => {
    setSendingTo(profileId);
    const { error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, receiver_id: profileId, status: 'pending' });
    if (!error) {
      setSuggested((prev) => prev.filter((p) => p.id !== profileId));
      toast('Spark sent! ⚡', 'success');
    }
    setSendingTo(null);
  };

  return (
    <>
    <div className="home-page">
      <div className="home-container">
        {/* Welcome Banner */}
        <div className="home-welcome">
          <div>
            <h1 className="home-welcome-title">
              Welcome back, <span className="home-welcome-name">{firstName}</span> 👋
            </h1>
            <p className="home-welcome-sub">Stay consistent. Every check-in counts.</p>
          </div>
          {shouldShowRecap() && (
            <button
              className="recap-trigger-btn"
              onClick={() => {
                setRecap(computeRecap(goals, acceptedConnections, activity));
                setShowRecap(true);
              }}
            >
              📊 Weekly Recap
            </button>
          )}
        </div>

        <div className="home-grid">
          <div className="home-main">

            {/* Getting Started — shown until all 4 steps are complete */}
            {!goalsLoading && (() => {
              const hasGoal        = goals.length > 0;
              const hasConnection  = acceptedConnections.length > 0;
              const hasProfile     = !!(profile?.avatar_url && profile?.tagline);
              const hasReminders   = !!(profile?.notification_prefs?.daily_reminder);
              const allDone = hasGoal && hasConnection && hasProfile && hasReminders;
              if (allDone) return null;
              const steps = [
                {
                  done: hasGoal,
                  title: 'Add your first goal',
                  desc: 'Set a habit or progress goal to track your journey',
                  cta: 'Go →', action: () => navigate('/profile'),
                },
                {
                  done: hasConnection,
                  title: 'Connect with an accountability partner',
                  desc: 'Find someone working toward similar goals and spark them',
                  cta: 'Find →', action: () => navigate('/connections'),
                },
                {
                  done: hasProfile,
                  title: 'Complete your profile',
                  desc: 'Add a photo and tagline so others can find you',
                  cta: 'Edit →', action: () => navigate('/profile'),
                },
                {
                  done: hasReminders,
                  title: 'Enable daily reminders',
                  desc: 'Get a nudge every day so you never miss a check-in',
                  cta: 'Set up →', action: () => navigate('/settings'),
                },
              ];
              const completedCount = steps.filter(s => s.done).length;
              return (
                <div className="home-card home-getting-started">
                  <div className="home-gs-header">
                    <h2 className="home-card-title">🚀 Getting Started</h2>
                    <span className="home-gs-progress">{completedCount}/{steps.length}</span>
                  </div>
                  <p className="home-gs-sub">Complete these steps to get the most out of ActPar.</p>
                  <div className="home-gs-steps">
                    {steps.map((s) => (
                      <div key={s.title} className={`home-gs-step${s.done ? ' done' : ''}`}>
                        <span className="home-gs-check">{s.done ? '✅' : '⭕'}</span>
                        <div className="home-gs-step-info">
                          <div className="home-gs-step-title">{s.title}</div>
                          <div className="home-gs-step-desc">{s.desc}</div>
                        </div>
                        {!s.done && (
                          <button className="home-gs-step-btn" onClick={s.action}>{s.cta}</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Daily Check-In Cards */}
            {!goalsLoading && habitGoals.length > 0 && (
              <div className="home-card">
                <div className="home-card-header">
                  <h2 className="home-card-title">
                    <svg className="home-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Today's Check-Ins
                  </h2>
                  {allCheckedIn && <span className="checkin-all-done-badge">All done 🔥</span>}
                </div>

                {allCheckedIn ? (
                  <div className="checkin-all-done">
                    <div className="checkin-done-icon">🔥</div>
                    <div>
                      <div className="checkin-done-title">You're locked in for today.</div>
                      <div className="checkin-done-sub">Every goal checked. Come back tomorrow to keep the streak alive.</div>
                    </div>
                  </div>
                ) : (
                  <div className="checkin-card-grid">
                    {habitGoals.map((goal) => {
                      const done = goal.last_checked_in === todayStr;
                      const loading = !!checkingIn[goal.id];
                      const nextMilestone = [7, 30, 60, 90].find((m) => m > (goal.day_count ?? 0));
                      const daysLeft = nextMilestone ? nextMilestone - (goal.day_count ?? 0) : null;
                      return (
                        <div key={goal.id} className={`checkin-card${done ? ' checkin-card--done' : ''}`}>
                          <div className="checkin-card-streak">
                            <span className="checkin-card-day">{goal.day_count ?? 0}</span>
                            <span className="checkin-card-day-label">days</span>
                          </div>
                          <div className="checkin-card-info">
                            <div className="checkin-card-title">{goal.title}</div>
                            {daysLeft !== null && !done && (
                              <div className="checkin-card-milestone">
                                {daysLeft === 1 ? `1 day to ${nextMilestone}-day milestone!` : `${daysLeft} days to ${nextMilestone}-day milestone`}
                              </div>
                            )}
                          </div>
                          <button
                            className={`checkin-card-btn${done ? ' done' : ''}`}
                            onClick={() => handleQuickCheckIn(goal.id)}
                            disabled={done || loading}
                          >
                            {done ? '✓' : loading ? '...' : 'Check In'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Active Goals */}
            <div className="home-card">
              <div className="home-card-header">
                <h2 className="home-card-title">
                  <svg className="home-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Active Goals
                </h2>
                <button type="button" className="home-card-link" onClick={() => navigate('/profile')}>Manage →</button>
              </div>
              {goalsLoading && <p className="home-empty">Loading goals...</p>}
              {!goalsLoading && goals.length === 0 && (
                <p className="home-empty">No goals yet — go to your profile to add one.</p>
              )}
              <div className="home-goals-list">
                {goals.map((goal) => {
                  const pct = goal.goal_type === 'numeric'
                    ? Math.min(((goal.progress ?? 0) / (goal.target_value || 1)) * 100, 100)
                    : Math.min(((goal.day_count ?? 0) / 90) * 100, 100);
                  return (
                    <div key={goal.id} className="home-goal-item">
                      <div className="home-goal-top">
                        <span className="home-goal-title">{goal.title}</span>
                        <span className="home-goal-day">
                          {goal.goal_type === 'numeric' ? `${Math.round(pct)}%` : `Day ${goal.day_count ?? 0}`}
                        </span>
                      </div>
                      <div className="home-goal-bar">
                        <div className="home-goal-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Reflection — single question */}
            <div className="home-card">
              <div className="home-card-header">
                <h2 className="home-card-title">
                  <svg className="home-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Daily Reflection
                </h2>
                <button type="button" className="home-card-link" onClick={() => navigate('/profile')}>My Profile</button>
              </div>
              <div className="home-reflection-q">{QUESTIONS[0].text}</div>
              <textarea
                className="home-reflection-input"
                placeholder="Share your thoughts..."
                value={answers[QUESTIONS[0].id] ?? ''}
                onChange={(e) => handleAnswerChange(QUESTIONS[0].id, e.target.value)}
              />
              <button
                type="button"
                className="home-reflection-submit"
                onClick={() => handleSubmitAnswer(QUESTIONS[0])}
                disabled={submitting[QUESTIONS[0].id]}
              >
                {submitting[QUESTIONS[0].id] ? 'Saving...' : 'Save Reflection'}
              </button>
            </div>

            {/* Connection Activity */}
            <div className="home-card">
              <div className="home-card-header">
                <h2 className="home-card-title">
                  <svg className="home-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connection Activity
                </h2>
                <button type="button" className="home-card-link" onClick={() => navigate('/tribe-community')}>See in Tribe</button>
              </div>
              {activityLoading && <p className="home-empty">Loading...</p>}
              {!activityLoading && acceptedConnections.length === 0 && (
                <p className="home-empty">Connect with people on the Connections page to see their activity here.</p>
              )}
              {!activityLoading && acceptedConnections.length > 0 && activity.length === 0 && (
                <p className="home-empty">No activity in the last 3 days — check back soon!</p>
              )}
              {activity.length > 0 && (
                <div className="home-activity-list">
                  {activity.slice(0, 5).map((item) => {
                    const name = item.profiles
                      ? getDisplayName(item.profiles, 'Someone')
                      : 'Someone';
                    const milestone = isMilestone(item.day_count);
                    const isToday = item.last_checked_in === new Date().toISOString().split('T')[0];
                    return (
                      <div
                        key={item.id}
                        className={`home-activity-item${milestone ? ' home-activity-item--milestone' : ''}`}
                        onClick={() => navigate(`/profile/${item.profiles?.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile/${item.profiles?.id}`)}
                      >
                        <Avatar url={item.profiles?.avatar_url} name={name} size={36} />
                        <div className="home-activity-body">
                          <div className="home-activity-text">
                            <span className="home-activity-name">{name}</span>
                            {milestone
                              ? <> hit a <strong>{item.day_count}-day milestone</strong> on "{item.title}" 🎉</>
                              : <> checked in on "{item.title}"</>}
                          </div>
                          <div className="home-activity-meta">
                            {item.profiles?.alter_ego_name && `⚡ ${item.profiles.alter_ego_name} · `}
                            {isToday ? 'Today' : 'Recently'} · Day {item.day_count}
                          </div>
                        </div>
                        {milestone && <div className="home-activity-milestone-badge">{item.day_count}d</div>}
                        <button
                          className={`home-activity-cheer-btn${cheerSent.has(item.id) ? ' sent' : ''}`}
                          onClick={(e) => { e.stopPropagation(); if (!cheerSent.has(item.id)) sendCheer(item); }}
                          disabled={cheerSent.has(item.id)}
                          title="Send a cheer"
                        >
                          {cheerSent.has(item.id) ? '🔥' : '👏'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="home-sidebar">
            {/* Suggested Connections */}
            <div className="home-sidebar-card">
              <div className="home-card-header">
                <h3 className="home-sidebar-title">People You May Know</h3>
                <button type="button" className="home-card-link" onClick={() => navigate('/connections')}>See all</button>
              </div>
              <div className="home-suggested-list">
                {suggested.length === 0 && (
                  <p className="home-empty">No new suggestions right now.</p>
                )}
                {suggested.map((person) => {
                  const name = getDisplayName(person, 'User');
                  return (
                    <div key={person.id} className="home-suggested-item">
                      <Avatar url={person.avatar_url} name={name} size={40} />
                      <div className="home-suggested-info">
                        <div className="home-suggested-name">{name}</div>
                        <div className="home-suggested-meta">
                          {person.alter_ego_name ? `⚡ ${person.alter_ego_name}` : person.city || 'Member'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="home-spark-btn"
                        onClick={() => handleSendSpark(person.id)}
                        disabled={sendingTo === person.id}
                      >
                        {sendingTo === person.id ? '...' : '⚡ Spark'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Stats */}
            <div className="home-sidebar-card">
              <h3 className="home-sidebar-title">My Stats</h3>
              <div className="home-stats-grid">
                <div className="home-stat">
                  <div className="home-stat-value">{goals.length}</div>
                  <div className="home-stat-label">Active Goals</div>
                </div>
                <div className="home-stat">
                  <div className="home-stat-value">{goals.length > 0 ? Math.max(...goals.map(g => g.day_count || 0)) : 0}</div>
                  <div className="home-stat-label">Best Streak</div>
                </div>
                <div className="home-stat">
                  <div className="home-stat-value">{acceptedConnections.length}</div>
                  <div className="home-stat-label">Connections</div>
                </div>
                <div className="home-stat">
                  <div className="home-stat-value">{habitGoals.filter(g => g.last_checked_in === todayStr).length}</div>
                  <div className="home-stat-label">Done Today</div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="home-sidebar-card">
              <h3 className="home-sidebar-title">Quick Access</h3>
              <div className="home-quick-links">
                <button className="home-quick-btn" onClick={() => navigate('/connections')}>⚡ Sparks</button>
                <button className="home-quick-btn" onClick={() => navigate('/tribe-community')}>🌍 Tribe</button>
                <button className="home-quick-btn" onClick={() => navigate('/messages')}>💬 Messages</button>
                <button className="home-quick-btn" onClick={() => navigate('/profile')}>👤 Profile</button>
              </div>
            </div>

            {/* Leaderboard teaser */}
            <div className="home-sidebar-card">
              <h3 className="home-sidebar-title">🏆 Leaderboard</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>
                See who's leading in your city and globally.
              </p>
              <button
                className="home-card-link"
                style={{ fontSize: '0.88rem', fontWeight: 700 }}
                onClick={() => navigate('/leaderboard')}
              >
                View Full Leaderboard →
              </button>
            </div>

          </aside>
        </div>
      </div>
    </div>

    {showRecap && recap && (
      <WeeklyRecapModal
        recap={recap}
        onClose={() => { dismissRecap(); setShowRecap(false); }}
      />
    )}
    </>
  );
};

export default HomePage;
