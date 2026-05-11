import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useGoals } from '../../hooks/useGoals.js';
import { useReflections } from '../../hooks/useReflections.js';
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
  const { goals, loading: goalsLoading, addGoal, deleteGoal } = useGoals();
  const { saveAnswer } = useReflections();
  const toast = useToast();

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
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
    <div className="home-page">
      <div className="home-container">
        <section className="welcome-section">
          <h1 className="welcome-title">
            Welcome back, <span className="welcome-name">{firstName}</span>! 👋
          </h1>
          <p className="welcome-subtitle">Stay motivated and crush your goals today</p>
        </section>

        <div className="feed-grid">
          <div className="main-feed">
            {/* Daily Reflection */}
            <div className="feed-card">
              <div className="card-header">
                <h2 className="card-title">
                  <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Daily Reflection
                </h2>
                <button type="button" className="view-all" onClick={() => navigate('/')}>My Profile</button>
              </div>
              <div className="questions-container">
                {QUESTIONS.map((question) => (
                  <div key={question.id} className="question-card">
                    <div className="question-text">{question.text}</div>
                    <textarea
                      className="answer-input"
                      placeholder="Share your thoughts..."
                      value={answers[question.id] ?? ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="submit-answer"
                      onClick={() => handleSubmitAnswer(question)}
                      disabled={submitting[question.id]}
                    >
                      {submitting[question.id] ? 'Saving...' : 'Submit Answer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Goals */}
            <div className="feed-card">
              <div className="card-header">
                <h2 className="card-title">
                  <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Active Goals
                </h2>
                <button type="button" className="view-all" onClick={() => setShowAddForm((v) => !v)}>
                  {showAddForm ? 'Cancel' : '+ Add Goal'}
                </button>
              </div>

              {showAddForm && (
                <form className="add-goal-form" onSubmit={handleAddGoal}>
                  <input
                    type="text"
                    className="add-goal-input"
                    placeholder="e.g. Morning Meditation"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="submit" className="add-goal-btn" disabled={addingGoal}>
                    {addingGoal ? 'Saving...' : 'Save'}
                  </button>
                </form>
              )}

              <div className="goals-feed">
                {goalsLoading && <p className="goals-empty">Loading goals...</p>}
                {!goalsLoading && goals.length === 0 && (
                  <p className="goals-empty">No goals yet — add one above to get started!</p>
                )}
                {goals.map((goal) => (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-item-header">
                      <span className="goal-name">{goal.title}</span>
                      <div className="goal-item-actions">
                        <span className="goal-day">Day {goal.day_count}</span>
                        <button
                          type="button"
                          className="goal-delete-btn"
                          onClick={() => deleteGoal(goal.id)}
                          aria-label="Remove goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="feed-card">
              <div className="card-header">
                <h2 className="card-title">
                  <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Access
                </h2>
              </div>
              <div className="quick-links">
                <button className="quick-link-btn" onClick={() => navigate('/connections')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Find Connections
                </button>
                <button className="quick-link-btn" onClick={() => navigate('/tribe-community')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Tribe Community
                </button>
                <button className="quick-link-btn" onClick={() => navigate('/pact')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  The Pact
                </button>
                <button className="quick-link-btn" onClick={() => navigate('/messages')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </button>
                <button className="quick-link-btn" onClick={() => navigate('/coaches')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Find a Coach
                </button>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            {/* Suggested Connections (real data) */}
            <div className="sidebar-card">
              <div className="card-header">
                <h3 className="sidebar-title">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Suggested Connections
                </h3>
                <button type="button" className="view-all" onClick={() => navigate('/connections')}>
                  See all
                </button>
              </div>
              <div className="suggested-people">
                {suggested.length === 0 && (
                  <p className="goals-empty" style={{ fontSize: '0.85rem', padding: '8px 0' }}>
                    No new suggestions right now.
                  </p>
                )}
                {suggested.map((person) => {
                  const name = `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || 'User';
                  return (
                    <div key={person.id} className="suggested-person">
                      <Avatar url={person.avatar_url} name={name} size={40} />
                      <div className="suggested-info">
                        <div className="suggested-name">{name}</div>
                        <div className="suggested-meta">
                          {person.alter_ego_name ? `⚡ ${person.alter_ego_name}` : person.city || 'Member'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="connect-btn"
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
            <div className="sidebar-card">
              <div className="card-header">
                <h3 className="sidebar-title">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  My Stats
                </h3>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{goals.length}</div>
                  <div className="stat-label">Active Goals</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{goals.filter(g => g.progress >= 100).length}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length) : 0}%</div>
                  <div className="stat-label">Avg Progress</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{goals.length > 0 ? Math.max(...goals.map(g => g.day_count || 0)) : 0}</div>
                  <div className="stat-label">Best Streak</div>
                </div>
              </div>
            </div>

            {/* Navigate to Profile */}
            <div className="sidebar-card">
              <div className="card-header">
                <h3 className="sidebar-title">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your Profile
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '12px' }}>
                Update your goals, affirmations, and what you're looking for in an accountability partner.
              </p>
              <button className="connect-btn" style={{ width: '100%' }} onClick={() => navigate('/')}>
                View Profile →
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
