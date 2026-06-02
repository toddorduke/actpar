import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useGoals } from '../../hooks/useGoals.js';
import { usePartnerships } from '../../hooks/usePartnerships.js';
import { useProfile } from '../../hooks/useProfile.js';
import { useJournal } from '../../hooks/useJournal.js';
import { useMedia } from '../../hooks/useMedia.js';
import { useReflections, DEFAULT_QUESTIONS } from '../../hooks/useReflections.js';
import { useTribePosts } from '../../hooks/useTribePosts.js';
import { useConnections } from '../../hooks/useConnections.js';
import { useGoalProgress } from '../../hooks/useGoalProgress.js';
import { useCustomCategories } from '../../hooks/useCustomCategories.js';
import { useConnectionActivity, isMilestone } from '../../hooks/useConnectionActivity.js';
import { shouldShowRecap, dismissRecap, computeRecap } from '../../hooks/useWeeklyRecap.js';
import WeeklyRecapModal from '../../components/common/WeeklyRecapModal.jsx';
import MilestoneShareModal from '../../components/common/MilestoneShareModal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import '../Profile/ProfilePage.css';
import './HomePage.css';

// ── Constants ────────────────────────────────────────────────────────────────

const TIER_LABELS = { 1: 'Top Priority', 2: 'Important', 3: 'Foundation' };
const TIER_ORDER = [1, 2, 3];

const GOAL_CATEGORIES = [
  { value: 'faith', label: '✝️ Faith' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'sobriety', label: '🌱 Sobriety' },
  { value: 'mindfulness', label: '🧘 Mindfulness' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'mental_health', label: '🧠 Mental Health' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'relationships', label: '❤️ Relationships' },
  { value: 'learning', label: '📚 Learning' },
  { value: 'career', label: '💼 Career' },
  { value: 'other', label: '✨ Other' },
];

const CATEGORY_LABELS = Object.fromEntries(GOAL_CATEGORIES.map((c) => [c.value, c.label]));

const UNIT_SUGGESTIONS = {
  faith: ['chapters', 'minutes', 'prayers', 'verses'],
  fitness: ['miles', 'km', 'lbs', 'reps', 'sets', 'workouts'],
  sobriety: ['days', 'meetings', 'sessions'],
  mindfulness: ['minutes', 'sessions', 'days'],
  nutrition: ['calories', 'glasses', 'oz', 'meals'],
  mental_health: ['sessions', 'minutes', 'days'],
  finance: ['$', 'dollars', '%'],
  relationships: ['hours', 'dates', 'calls', 'conversations'],
  learning: ['pages', 'chapters', 'hours', 'lessons'],
  career: ['applications', 'hours', 'calls', 'meetings'],
  other: ['times', 'hours', 'days', 'units'],
};

const LOOKING_FOR_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

function localTimeToUtcHour(timeStr) {
  const [hours] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, 0, 0, 0);
  return d.getUTCHours();
}

function roundNum(n) {
  return Number.isInteger(n) ? n : Math.round(n * 10) / 10;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── GoalCard ─────────────────────────────────────────────────────────────────

const GoalCard = ({ goal, animate, onTierChange, onCheckIn, progressData, onLogProgress, checkinDates = new Set(), onDelete, onComplete }) => {
  const isNumeric = goal.goal_type === 'numeric';
  const habitPct = useMemo(() => Math.min((goal.day_count / 90) * 100, 100), [goal.day_count]);
  const checkedInToday = goal.last_checked_in === getTodayStr();
  const [checking, setChecking] = useState(false);
  const [logValue, setLogValue] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logging, setLogging] = useState(false);

  const numericPct = useMemo(() => {
    if (!isNumeric || !goal.target_value) return 0;
    return Math.min(((progressData?.total ?? 0) / goal.target_value) * 100, 100);
  }, [isNumeric, goal.target_value, progressData?.total]);

  const badges = useMemo(() => {
    if (isNumeric) return [];
    const earned = [];
    if (goal.day_count >= 30) earned.push({ id: '30', label: '30-Day Streak' });
    if (goal.day_count >= 60) earned.push({ id: '60', label: '60-Day Streak' });
    return earned;
  }, [goal.day_count, isNumeric]);

  async function handleCheckIn() {
    if (checkedInToday || checking) return;
    setChecking(true);
    await onCheckIn(goal.id);
    setChecking(false);
  }

  async function handleLog() {
    if (!logValue || logging) return;
    setLogging(true);
    await onLogProgress(goal.id, parseFloat(logValue), logNote);
    setLogValue('');
    setLogNote('');
    setLogging(false);
  }

  const periodLabel = goal.target_period === 'weekly'
    ? 'this week' : goal.target_period === 'monthly' ? 'this month' : 'total';
  const lastEntry = progressData?.entries?.[0];
  const activePct = isNumeric ? numericPct : habitPct;

  return (
    <div className={`goal-card tier-${goal.tier ?? 3}`}>
      <div className="goal-header">
        <div>
          <h3 className="goal-title">{goal.title}</h3>
          {goal.category && (
            <span className="goal-category-badge">{CATEGORY_LABELS[goal.category] ?? goal.category}</span>
          )}
        </div>
        <div className="goal-meta">
          <select
            className="tier-select"
            value={goal.tier ?? 3}
            onChange={(e) => onTierChange(goal.id, Number(e.target.value))}
          >
            <option value={1}>Top Priority</option>
            <option value={2}>Important</option>
            <option value={3}>Foundation</option>
          </select>
          {isNumeric ? (
            <div className="numeric-target-display">
              <span className="numeric-target-value">{goal.target_value}</span>
              <span className="numeric-target-unit">{goal.target_unit}</span>
              <span className="numeric-target-period">
                /{goal.target_period === 'total' ? 'total' : goal.target_period === 'weekly' ? 'wk' : 'mo'}
              </span>
            </div>
          ) : (
            <div className="day-count">
              <div className="day-number">{goal.day_count}</div>
              <div className="day-label">days</div>
            </div>
          )}
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-info">
          {isNumeric ? (
            <span>{roundNum(progressData?.total ?? 0)} / {goal.target_value} {goal.target_unit} {periodLabel}</span>
          ) : (
            <span>Progress to 90 days</span>
          )}
          <strong>{Math.round(activePct)}%</strong>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${animate ? activePct : 0}%` }}>
            {activePct > 20 && animate && (
              <span className="progress-percentage">{Math.round(activePct)}%</span>
            )}
          </div>
        </div>
        {!isNumeric && (
          <div className="milestone-markers"><span>0</span><span>30</span><span>60</span><span>90</span></div>
        )}
      </div>

      {!isNumeric && (
        <div className="goal-checkin-calendar" title="Last 30 days">
          {Array.from({ length: 30 }, (_, i) => {
            const d = new Date(Date.now() - (29 - i) * 86400000);
            const dateStr = d.toISOString().split('T')[0];
            const done = checkinDates.has(dateStr);
            const isToday = dateStr === getTodayStr();
            return (
              <div
                key={dateStr}
                className={`goal-cal-dot${done ? ' done' : ''}${isToday ? ' today' : ''}`}
                title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${done ? ' ✓' : ''}`}
              />
            );
          })}
        </div>
      )}

      {isNumeric ? (
        <div className="log-progress-area">
          <div className="log-progress-row">
            <input
              type="number"
              className="log-value-input"
              placeholder="0"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              min="0"
              step="any"
            />
            <span className="log-unit-label">{goal.target_unit}</span>
            <input
              type="text"
              className="log-note-input"
              placeholder="note (optional)"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
            />
            <button className="log-btn" onClick={handleLog} disabled={!logValue || logging}>
              {logging ? '...' : 'Log'}
            </button>
          </div>
          {lastEntry && (
            <div className="last-log-info">
              Last: +{lastEntry.value} {goal.target_unit} · {timeAgo(lastEntry.logged_at)}
              {lastEntry.note ? ` · "${lastEntry.note}"` : ''}
            </div>
          )}
        </div>
      ) : (
        <button
          className={`checkin-btn${checkedInToday ? ' done' : ''}`}
          onClick={handleCheckIn}
          disabled={checkedInToday || checking}
        >
          {checkedInToday ? '✓ Done for today' : checking ? 'Saving...' : '✓ Check in for today'}
        </button>
      )}

      {badges.length > 0 && (
        <div className="achievement-badges">
          {badges.map((badge) => (
            <span key={badge.id} className="badge">
              <svg className="badge-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <div className="goal-card-footer">
        {onComplete && !isNumeric && (
          <button className="goal-footer-btn goal-complete-btn" onClick={() => onComplete(goal.id)}>
            ✓ Mark Complete
          </button>
        )}
        {onDelete && (
          <button className="goal-footer-btn goal-delete-btn" onClick={() => onDelete(goal.id)}>
            Remove Goal
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // — Hooks —
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { createOrAdopt } = useCustomCategories(profile?.id);
  const { reflections, affirmations, saveAnswer, saveAffirmation } = useReflections();
  const { goals, loading: goalsLoading, updateTier, addGoal, checkIn, deleteGoal, completeGoal } = useGoals();
  const { progressMap, logProgress } = useGoalProgress(goals);
  const { entries, loading: journalLoading, createEntry, deleteEntry } = useJournal();
  const { posts, loading: postsLoading, createPost } = useTribePosts();
  const { photos, videos, uploadFile, deleteMedia } = useMedia();
  const { acceptedConnections } = useConnections();
  const { partnerships, partnerSide, linkGoal } = usePartnerships();
  const { activity, loading: activityLoading } = useConnectionActivity(acceptedConnections);

  // — Derived —
  const todayStr = getTodayStr();
  const habitGoals = useMemo(() => goals.filter((g) => g.goal_type !== 'numeric'), [goals]);
  const allCheckedIn = habitGoals.length > 0 && habitGoals.every((g) => g.last_checked_in === todayStr);
  const goalsByTier = useMemo(() => {
    const map = { 1: [], 2: [], 3: [] };
    goals.forEach((g) => { map[g.tier ?? 3].push(g); });
    return map;
  }, [goals]);
  const [myOwnPosts, setMyOwnPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const activeQuestions = profile?.reflection_questions ?? DEFAULT_QUESTIONS;
  const affirmationDayNumber = useMemo(() => {
    if (!profile?.affirmation_start_date) return null;
    return Math.floor((Date.now() - new Date(profile.affirmation_start_date)) / 86400000) + 1;
  }, [profile?.affirmation_start_date]);
  const completedAffirmationDays = useMemo(() => {
    if (!profile?.affirmation_start_date) return new Set();
    const start = new Date(profile.affirmation_start_date);
    const days = new Set();
    affirmations.forEach((a) => {
      const d = Math.floor((new Date(a.created_at) - start) / 86400000) + 1;
      if (d >= 1 && d <= 30) days.add(d);
    });
    return days;
  }, [affirmations, profile?.affirmation_start_date]);
  const doneAffirmationToday = affirmations.some((a) => a.created_at?.startsWith(todayStr));
  const todayAffirmation = affirmations.find((a) => a.created_at?.startsWith(todayStr));
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Your Profile';

  // — Weekly recap —
  const [showRecap, setShowRecap] = useState(false);
  const [recap, setRecap] = useState(null);
  useEffect(() => {
    if (goalsLoading) return;
    if (!shouldShowRecap()) return;
    const computed = computeRecap(goals, acceptedConnections, activity);
    setRecap(computed);
    setShowRecap(true);
  }, [goalsLoading]);

  // — Auto check-in from notification deep-link —
  const autoCheckinRan = useRef(false);
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
    setSearchParams((p) => { p.delete('auto-checkin'); return p; }, { replace: true });
  }, [goalsLoading]);

  // — Connection data —
  const [connectionProfiles, setConnectionProfiles] = useState([]);
  useEffect(() => {
    if (!profile?.id || acceptedConnections.length === 0) { setConnectionProfiles([]); return; }
    const partnerIds = acceptedConnections.map((c) =>
      c.requester_id === profile.id ? c.receiver_id : c.requester_id
    );
    supabase
      .from('profiles')
      .select('id, first_name, last_name, tagline, city, avatar_url')
      .in('id', partnerIds)
      .limit(5)
      .then(({ data }) => setConnectionProfiles(data ?? []));
  }, [profile?.id, acceptedConnections.length]);

  // — Check-in history for streak calendars (last 30 days) —
  const [checkinHistory, setCheckinHistory] = useState({}); // { goalId: Set<'YYYY-MM-DD'> }
  useEffect(() => {
    const habitGoalIds = goals.filter((g) => g.goal_type !== 'numeric').map((g) => g.id);
    if (!habitGoalIds.length) { setCheckinHistory({}); return; }
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    supabase
      .from('checkin_logs')
      .select('goal_id, checked_in_at')
      .in('goal_id', habitGoalIds)
      .gte('checked_in_at', since)
      .then(({ data }) => {
        const map = {};
        for (const row of data ?? []) {
          const dateStr = row.checked_in_at.slice(0, 10);
          if (!map[row.goal_id]) map[row.goal_id] = new Set();
          map[row.goal_id].add(dateStr);
        }
        setCheckinHistory(map);
      });
  }, [goals.length]);

  const [activeTab, setActiveTab] = useState('overview');

  // — My own posts (direct query, not limited by global feed) —
  useEffect(() => {
    if (!profile?.id || activeTab !== 'posts') return;
    setMyPostsLoading(true);
    supabase
      .from('tribe_posts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setMyOwnPosts(data ?? []); setMyPostsLoading(false); });
  }, [profile?.id, activeTab]);

  // — Suggested people —
  const [suggested, setSuggested] = useState([]);
  const [sendingTo, setSendingTo] = useState(null);
  useEffect(() => {
    async function loadSuggested() {
      if (!user) return;
      const { data: conns } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const excludeIds = [user.id];
      for (const c of conns ?? []) { excludeIds.push(c.requester_id, c.receiver_id); }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, alter_ego_name, city, avatar_url, tagline')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(4);
      setSuggested(profiles ?? []);
    }
    loadSuggested();
  }, [user]);

  // — Cheer state —
  const [cheerSent, setCheerSent] = useState(new Set());

  // — UI state —
  const [animateGoals, setAnimateGoals] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ tagline: '', bio: '', alter_ego_name: '', city: '' });
  const [saving, setSaving] = useState(false);

  // Per-item check-in loading (Today's Check-Ins cards)
  const [checkingIn, setCheckingIn] = useState({});

  // Reflection Q&A (profile sidebar)
  const [answers, setAnswers] = useState({});
  const [publicAnswers, setPublicAnswers] = useState({});
  const [savingAnswers, setSavingAnswers] = useState({});
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState(null);
  const [savingQuestions, setSavingQuestions] = useState(false);

  // Affirmation
  const [affirmationText, setAffirmationText] = useState('');
  const [affirmationPublic, setAffirmationPublic] = useState(false);
  const [savingAffirmation, setSavingAffirmation] = useState(false);

  // Journey goal picker
  const [milestoneModal, setMilestoneModal] = useState(null); // { milestone, goalTitle }
  const [journeyGoalPicker, setJourneyGoalPicker] = useState(null); // { partnershipId }
  const [journeyPickerGoalId, setJourneyPickerGoalId] = useState('');
  const [journeyPickerShowNew, setJourneyPickerShowNew] = useState(false);
  const [journeyPickerNewTitle, setJourneyPickerNewTitle] = useState('');
  const [journeyPickerNewTier, setJourneyPickerNewTier] = useState(2);
  const [journeyPickerSaving, setJourneyPickerSaving] = useState(false);

  async function handleJourneyLinkGoal() {
    if (!journeyPickerGoalId || journeyPickerSaving) return;
    setJourneyPickerSaving(true);
    await linkGoal(journeyGoalPicker.partnershipId, journeyPickerGoalId);
    setJourneyPickerSaving(false);
    setJourneyGoalPicker(null);
    setJourneyPickerGoalId('');
    setJourneyPickerShowNew(false);
    setJourneyPickerNewTitle('');
  }

  async function handleJourneyCreateAndLink() {
    if (!journeyPickerNewTitle.trim() || journeyPickerSaving) return;
    setJourneyPickerSaving(true);
    const { data } = await supabase.from('goals').insert({
      user_id: user.id,
      title: journeyPickerNewTitle.trim(),
      tier: journeyPickerNewTier,
      goal_type: 'habit',
      is_active: true,
    }).select('id').single();
    if (data) {
      await linkGoal(journeyGoalPicker.partnershipId, data.id);
    }
    setJourneyPickerSaving(false);
    setJourneyGoalPicker(null);
    setJourneyPickerGoalId('');
    setJourneyPickerShowNew(false);
    setJourneyPickerNewTitle('');
  }

  // Add goal form
  const addGoalRef = useRef(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [newGoalType, setNewGoalType] = useState('habit');
  const [newGoalUnit, setNewGoalUnit] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalPeriod, setNewGoalPeriod] = useState('weekly');
  const [newGoalReminder, setNewGoalReminder] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  // Looking For
  const [lookingFor, setLookingFor] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [savingLookingFor, setSavingLookingFor] = useState(false);

  // Post modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState('general');
  const [postContent, setPostContent] = useState('');
  const [postMilestone, setPostMilestone] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Journal
  const [journalSubject, setJournalSubject] = useState('');
  const [journalBody, setJournalBody] = useState('');
  const [journalPublic, setJournalPublic] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);

  // Media upload
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov'];
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile_, setUploadFile_] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('everyone');
  const [uploadShareTo, setUploadShareTo] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  // — Effects —
  useEffect(() => {
    const timer = setTimeout(() => setAnimateGoals(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (profile) {
      setEditForm({
        tagline: profile.tagline ?? '',
        bio: profile.bio ?? '',
        alter_ego_name: profile.alter_ego_name ?? '',
        city: profile.city ?? '',
      });
      setLookingFor(profile.looking_for ?? []);
    }
  }, [profile]);

  // — Nudge tracking (in-memory per session) —
  const [nudgeSent, setNudgeSent] = useState(new Set());

  // — Notify journey partner when current user checks in on a shared goal —
  function notifyJourneyPartner(goalId) {
    const goalTitle = goals.find((g) => g.id === goalId)?.title;
    for (const p of partnerships) {
      if (p.status !== 'active') continue;
      const { partnerId, myGoalId } = partnerSide(p);
      if (myGoalId !== goalId) continue;
      const days = p.started_at
        ? Math.floor((Date.now() - new Date(p.started_at)) / 86400000) + 1
        : 1;
      supabase.from('notifications').insert({
        user_id: partnerId,
        actor_id: user.id,
        type: 'journey_checkin',
        ref_id: p.id,
        body: `checked in on "${goalTitle}" — Day ${days} of your journey! 🔥`,
      });
    }
  }

  // — Shared check-in handler used by both quick cards and GoalCard buttons —
  async function handleGoalCheckIn(goalId) {
    const result = await checkIn(goalId);
    if (result?.alreadyDone) return result;
    setCheckinHistory((prev) => {
      const existing = prev[goalId] ?? new Set();
      return { ...prev, [goalId]: new Set([...existing, todayStr]) };
    });
    notifyJourneyPartner(goalId);
    if (result?.milestone) {
      setMilestoneModal({ milestone: result.milestone, goalTitle: result.goalTitle });
    }
    return result;
  }

  // — Handlers —
  async function handleQuickCheckIn(goalId) {
    if (checkingIn[goalId]) return;
    setCheckingIn((p) => ({ ...p, [goalId]: true }));
    await handleGoalCheckIn(goalId);
    setCheckingIn((p) => ({ ...p, [goalId]: false }));
  }

  async function handleNudge(partnerId, goalTitle) {
    const myName = getDisplayName(profile, 'Your partner');
    await supabase.from('notifications').insert({
      user_id: partnerId,
      actor_id: user.id,
      type: 'journey_nudge',
      body: `${myName} is checking on you — have you done "${goalTitle}" today? 💪`,
    });
    setNudgeSent((prev) => new Set([...prev, partnerId]));
  }

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

  async function handleSendSpark(profileId) {
    setSendingTo(profileId);
    const { error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, receiver_id: profileId, status: 'pending' });
    if (!error) {
      setSuggested((prev) => prev.filter((p) => p.id !== profileId));
      toast('Spark sent! ⚡', 'success');
    }
    setSendingTo(null);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile(editForm);
    setSaving(false);
    setEditing(false);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    if (newGoalType === 'numeric' && (!newGoalUnit.trim() || !newGoalTarget)) return;
    setAddingGoal(true);
    const reminderUtcHour = newGoalReminder ? localTimeToUtcHour(newGoalReminder) : null;
    await addGoal(newGoalTitle.trim(), newGoalCategory || null, {
      goal_type: newGoalType,
      target_value: newGoalType === 'numeric' ? parseFloat(newGoalTarget) : null,
      target_unit: newGoalType === 'numeric' ? newGoalUnit.trim() : null,
      target_period: newGoalType === 'numeric' ? newGoalPeriod : null,
      reminder_utc_hour: reminderUtcHour,
    });
    setNewGoalTitle('');
    setNewGoalCategory('');
    setNewGoalUnit('');
    setNewGoalTarget('');
    setNewGoalPeriod('weekly');
    setNewGoalType('habit');
    setNewGoalReminder('');
    setAddingGoal(false);
  };

  async function handleSaveAnswer(index) {
    const q = activeQuestions[index];
    const answer = answers[index]?.trim();
    if (!answer) return;
    setSavingAnswers((prev) => ({ ...prev, [index]: true }));
    const { error } = await saveAnswer({ question: q, answer, isPublic: publicAnswers[index] ?? false });
    setSavingAnswers((prev) => ({ ...prev, [index]: false }));
    if (!error) {
      setAnswers((prev) => ({ ...prev, [index]: '' }));
      toast('Reflection saved! 💫', 'success');
    }
  }

  async function handleSaveQuestions() {
    setSavingQuestions(true);
    await updateProfile({ reflection_questions: draftQuestions });
    setSavingQuestions(false);
    setEditingQuestions(false);
  }

  async function handleSaveAffirmation() {
    if (!affirmationText.trim()) return;
    setSavingAffirmation(true);
    try {
      const { error } = await saveAffirmation({ answer: affirmationText.trim(), isPublic: affirmationPublic });
      if (error) { toast(`Couldn't save: ${error?.message || JSON.stringify(error)}`, 'error'); return; }
      setAffirmationText('');
      toast('Affirmation saved! ✨', 'success');
    } catch (e) {
      toast(`Error: ${e?.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingAffirmation(false);
    }
  }

  async function handleStartChallenge() {
    const { error } = await updateProfile({ affirmation_start_date: todayStr });
    if (error) toast(`Couldn't start challenge: ${error.message}`, 'error');
  }

  async function handleNewRound() {
    const { error } = await updateProfile({ affirmation_start_date: todayStr });
    if (error) toast(`Couldn't start new round: ${error.message}`, 'error');
  }

  function toggleLookingFor(tag) {
    setLookingFor((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const tag = customTag.trim();
    if (!tag || lookingFor.includes(tag)) return;
    setLookingFor((prev) => [...prev, tag]);
    setCustomTag('');
    createOrAdopt(tag);
  }

  async function handleSaveLookingFor() {
    setSavingLookingFor(true);
    const { error } = await updateProfile({ looking_for: lookingFor });
    setSavingLookingFor(false);
    if (!error) toast('Looking For updated! 🔍', 'success');
  }

  async function handleDeletePost(postId) {
    await supabase.from('tribe_posts').delete().eq('id', postId);
    setMyOwnPosts((prev) => prev.filter((p) => p.id !== postId));
    toast('Post deleted.', 'success');
  }

  async function handleSubmitPost() {
    if (!postContent.trim()) return;
    setSubmittingPost(true);
    const { error, moderation } = await createPost({
      content: postContent,
      post_type: postType,
      milestone: postType === 'achievement' ? postMilestone : null,
    });
    setSubmittingPost(false);
    if (moderation) { toast(moderation.message, moderation.type === 'crisis' ? 'warning' : 'error', 7000); return; }
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowPostModal(false);
    setPostContent('');
    setPostMilestone('');
    setPostType('general');
    toast('Post shared to the community! 🎉', 'success');
  }

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!journalSubject.trim() || !journalBody.trim()) return;
    setSavingEntry(true);
    await createEntry({ subject: journalSubject, body: journalBody, is_public: journalPublic });
    setJournalSubject('');
    setJournalBody('');
    setJournalPublic(false);
    setSavingEntry(false);
  };

  function validateFile(file) {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) { toast('Unsupported file type.', 'error'); return false; }
    if (isImage && file.size > MAX_IMAGE_SIZE) { toast('Photo too large. Max 10 MB.', 'error'); return false; }
    if (isVideo && file.size > MAX_VIDEO_SIZE) { toast('Video too large. Max 200 MB.', 'error'); return false; }
    return true;
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast('Profile photo must be JPG, PNG, WebP, or GIF.', 'error'); return; }
    if (file.size > MAX_IMAGE_SIZE) { toast('Image too large. Max 10 MB.', 'error'); return; }
    const ext = file.name.split('.').pop();
    const path = `avatars/${profile.id}.${ext}`;
    const { error: storageError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: true });
    if (storageError) { toast(`Upload failed: ${storageError.message}`, 'error'); return; }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    await updateProfile({ avatar_url: urlData.publicUrl });
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setUploadFile_(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUploadModal(true);
  }

  function toggleShareTo(val) {
    setUploadShareTo((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadFile_) return;
    setUploading(true);
    const { error } = await uploadFile({ file: uploadFile_, caption: uploadCaption, visibility: uploadVisibility, shareTo: uploadShareTo });
    setUploading(false);
    if (error) { toast(`Upload failed: ${error.message}`, 'error'); return; }
    setShowUploadModal(false);
    setUploadFile_(null);
    setUploadCaption('');
    setUploadVisibility('everyone');
    setUploadShareTo([]);
    setPreviewUrl(null);
  }

  function closeUploadModal() {
    setShowUploadModal(false);
    setUploadFile_(null);
    setPreviewUrl(null);
    setUploadCaption('');
    setUploadVisibility('everyone');
    setUploadShareTo([]);
  }

  if (profileLoading) {
    return <div className="profile-page"><p style={{ padding: 32, color: '#374151' }}>Loading...</p></div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Journey goal picker modal */}
      {milestoneModal && (
        <MilestoneShareModal
          milestone={milestoneModal.milestone}
          goalTitle={milestoneModal.goalTitle}
          displayName={profile?.alter_ego_name || profile?.first_name || 'You'}
          onClose={() => setMilestoneModal(null)}
        />
      )}

      {journeyGoalPicker && (
        <div className="journey-modal-overlay" onClick={(e) => e.target === e.currentTarget && setJourneyGoalPicker(null)}>
          <div className="journey-modal">
            <button className="journey-modal-close" onClick={() => setJourneyGoalPicker(null)}>×</button>
            <h2 className="journey-modal-title">Link a Goal to Your Journey</h2>
            <p className="journey-modal-hint">Pick one of your habit goals or create a new one:</p>
            <div className="journey-goal-list">
              {habitGoals.map((g) => (
                <button
                  key={g.id}
                  className={`journey-goal-item${journeyPickerGoalId === g.id ? ' selected' : ''}`}
                  onClick={() => setJourneyPickerGoalId((prev) => prev === g.id ? '' : g.id)}
                >
                  <span className="journey-goal-title">{g.title}</span>
                  <span className="journey-goal-tier">{{ 1: 'Top Priority', 2: 'Important', 3: 'Foundation' }[g.tier] ?? 'Foundation'}</span>
                </button>
              ))}
            </div>
            {!journeyPickerShowNew ? (
              <button className="journey-add-goal-btn" onClick={() => setJourneyPickerShowNew(true)}>＋ Create a new goal</button>
            ) : (
              <div className="journey-new-goal-form">
                <input
                  className="journey-new-goal-input"
                  placeholder="Goal title (e.g. Run every morning)"
                  value={journeyPickerNewTitle}
                  onChange={(e) => setJourneyPickerNewTitle(e.target.value)}
                  autoFocus
                />
                <select className="journey-new-goal-tier" value={journeyPickerNewTier} onChange={(e) => setJourneyPickerNewTier(Number(e.target.value))}>
                  <option value={1}>Top Priority</option>
                  <option value={2}>Important</option>
                  <option value={3}>Foundation</option>
                </select>
                <div className="journey-new-goal-actions">
                  <button className="journey-new-goal-save" onClick={handleJourneyCreateAndLink} disabled={!journeyPickerNewTitle.trim() || journeyPickerSaving}>
                    {journeyPickerSaving ? 'Saving...' : 'Save & Link'}
                  </button>
                  <button className="journey-new-goal-cancel" onClick={() => { setJourneyPickerShowNew(false); setJourneyPickerNewTitle(''); }}>Cancel</button>
                </div>
              </div>
            )}
            {!journeyPickerShowNew && (
              <button className="journey-propose-btn" onClick={handleJourneyLinkGoal} disabled={!journeyPickerGoalId || journeyPickerSaving}>
                {journeyPickerSaving ? 'Linking...' : 'Link Goal →'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="profile-page">

        {/* ── Profile header ── */}
        <header className="profile-header">
          <div className="profile-header-content">
            <div className="profile-header-top">
              {/* Avatar + identity */}
              <div className="profile-header-identity">
                <div className="profile-avatar-wrapper">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="Profile" className="profile-avatar-img" />
                    : <div className="profile-avatar-placeholder">{fullName.charAt(0)}</div>
                  }
                  <label className="avatar-upload-btn" title="Change photo">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="profile-header-info">
                  <h1 className="profile-name">{fullName}</h1>
                  {profile?.alter_ego_name && (
                    <div className="profile-alter-ego-block">
                      <span className="alter-ego-label">Alter Ego</span>
                      <span className="alter-ego-name">⚡ {profile.alter_ego_name}</span>
                    </div>
                  )}
                  {profile?.city && <div className="profile-header-city">📍 {profile.city}</div>}
                  <p className="profile-tagline">{profile?.tagline || 'Building better habits, one day at a time'}</p>
                  {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

                  {/* Weekly recap trigger */}
                  {shouldShowRecap() && (
                    <button
                      className="recap-trigger-btn"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        setRecap(computeRecap(goals, acceptedConnections, activity));
                        setShowRecap(true);
                      }}
                    >
                      📊 Weekly Recap
                    </button>
                  )}
                </div>
              </div>

              {photos.length > 0 && (
                <div className="profile-header-photos">
                  <div className="header-photos-label">Latest Photos</div>
                  <div className="header-photos-row">
                    {photos.slice(0, 3).map((photo) => (
                      <img key={photo.id} src={photo.file_url} alt={photo.caption || ''} className="header-photo-thumb" />
                    ))}
                  </div>
                </div>
              )}

              <button className="edit-profile-btn" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing && (
              <form className="edit-profile-form" onSubmit={handleSave}>
                <div className="edit-row">
                  <div className="edit-field">
                    <label>Alter Ego Name</label>
                    <input value={editForm.alter_ego_name} onChange={(e) => setEditForm((p) => ({ ...p, alter_ego_name: e.target.value }))} placeholder="e.g. The Phoenix" />
                  </div>
                  <div className="edit-field">
                    <label>City</label>
                    <input value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. New York" />
                  </div>
                </div>
                <div className="edit-field">
                  <label>Tagline</label>
                  <input value={editForm.tagline} onChange={(e) => setEditForm((p) => ({ ...p, tagline: e.target.value }))} placeholder="Building better habits, one day at a time" />
                </div>
                <div className="edit-field">
                  <label>About Me</label>
                  <textarea
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    value={editForm.bio}
                    onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell people about yourself…"
                    maxLength={500}
                  />
                </div>
                <button type="submit" className="save-profile-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            {[['overview', 'Overview'], ['journal', 'Journal'], ['posts', 'My Posts'], ['reflections', 'Reflections']].map(([id, label]) => (
              <button
                key={id}
                className={`profile-tab${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="profile-content-grid">
            <div className="profile-main">

              {/* Getting Started checklist */}
              {!goalsLoading && (() => {
                const hasGoal       = goals.length > 0;
                const hasConnection = acceptedConnections.length > 0;
                const hasProfile    = !!(profile?.avatar_url && profile?.tagline);
                const hasReminders  = !!(profile?.notification_prefs?.daily_reminder);
                const allDone = hasGoal && hasConnection && hasProfile && hasReminders;
                if (allDone) return null;
                const steps = [
                  {
                    done: hasGoal,
                    title: 'Add your first goal',
                    desc: 'Set a habit or progress goal to track your journey',
                    cta: 'Add →',
                    action: () => { addGoalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
                  },
                  {
                    done: hasConnection,
                    title: 'Connect with an accountability partner',
                    desc: 'Find someone working toward similar goals and spark them',
                    cta: 'Find →',
                    action: () => navigate('/connections'),
                  },
                  {
                    done: hasProfile,
                    title: 'Complete your profile',
                    desc: 'Add a photo and tagline so others can find you',
                    cta: 'Edit →',
                    action: () => setEditing(true),
                  },
                  {
                    done: hasReminders,
                    title: 'Enable daily reminders',
                    desc: 'Get a nudge every day so you never miss a check-in',
                    cta: 'Set up →',
                    action: () => navigate('/settings'),
                  },
                ];
                const completedCount = steps.filter((s) => s.done).length;
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

              {/* Today's Check-Ins */}
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

              {/* Goal Pyramid */}
              <section className="profile-section">
                <div className="section-header">
                  <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2>Goal Pyramid</h2>
                </div>
                {goalsLoading && <p className="goals-empty">Loading goals...</p>}
                {!goalsLoading && goals.length === 0 && (
                  <p className="goals-empty">No goals yet — add one using the form on the right!</p>
                )}
                {!goalsLoading && goals.length > 0 && (
                  <div className="pyramid-container">
                    {TIER_ORDER.map((tier) => {
                      const tierGoals = goalsByTier[tier];
                      if (tierGoals.length === 0) return null;
                      return (
                        <div key={tier} className={`pyramid-tier tier-row-${tier}`}>
                          <div className="tier-label">{TIER_LABELS[tier]}</div>
                          <div className="tier-goals">
                            {tierGoals.map((goal) => (
                              <GoalCard
                                key={goal.id}
                                goal={goal}
                                animate={animateGoals}
                                onTierChange={updateTier}
                                onCheckIn={handleGoalCheckIn}
                                progressData={progressMap[goal.id]}
                                onLogProgress={logProgress}
                                checkinDates={checkinHistory[goal.id] ?? new Set()}
                                onDelete={(id) => setConfirmDialog({ message: 'Remove this goal?', onConfirm: () => deleteGoal(id) })}
                                onComplete={(id) => setConfirmDialog({ message: 'Mark this goal as completed?', onConfirm: () => completeGoal(id) })}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

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
                      const name = item.profiles ? getDisplayName(item.profiles, 'Someone') : 'Someone';
                      const milestone = isMilestone(item.day_count);
                      const isToday = item.last_checked_in === todayStr;
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

              {/* Photos & Videos */}
              <section className="profile-section">
                <div className="media-grid">
                  <div className="media-card">
                    <div className="section-header">
                      <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3>Photos</h3>
                    </div>
                    <div className="photos-grid">
                      {photos.map((photo) => (
                        <div key={photo.id} className="photo-item-wrapper">
                          <img src={photo.file_url} alt={photo.caption || 'photo'} className="photo-item" />
                          <div className="media-overlay">
                            <span className="media-visibility-badge">{photo.visibility}</span>
                            <button className="media-delete-btn" onClick={() => setConfirmDialog({ message: 'Delete this photo?', onConfirm: () => deleteMedia(photo.id, photo.file_url) })}>×</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="upload-add-btn" onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}>
                        <span>+</span> Add Photo
                      </button>
                    </div>
                  </div>
                  <div className="media-card">
                    <div className="section-header">
                      <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3>Videos</h3>
                    </div>
                    <div className="videos-container">
                      {videos.map((video) => (
                        <div key={video.id} className="video-item">
                          <video src={video.file_url} className="video-player" controls playsInline preload="metadata" />
                          <div className="video-item-footer">
                            <div className="video-title">{video.caption || 'Video'}</div>
                            <button className="media-delete-btn" onClick={() => setConfirmDialog({ message: 'Delete this video?', onConfirm: () => deleteMedia(video.id, video.file_url) })}>×</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="upload-video-btn" onClick={() => { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }}>
                        + Upload Video
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Sidebar ── */}
            <aside className="profile-sidebar">
              <button className="profile-create-post-btn" onClick={() => setShowPostModal(true)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Post
              </button>

              {/* My Stats */}
              <div className="home-sidebar-card">
                <h3 className="home-sidebar-title">My Stats</h3>
                <div className="home-stats-grid">
                  <div className="home-stat">
                    <div className="home-stat-value">{goals.length}</div>
                    <div className="home-stat-label">Active Goals</div>
                  </div>
                  <div className="home-stat">
                    <div className="home-stat-value">{goals.length > 0 ? Math.max(...goals.map((g) => g.day_count || 0)) : 0}</div>
                    <div className="home-stat-label">Best Streak</div>
                  </div>
                  <div className="home-stat">
                    <div className="home-stat-value">{acceptedConnections.length}</div>
                    <div className="home-stat-label">Connections</div>
                  </div>
                  <div className="home-stat">
                    <div className="home-stat-value">{habitGoals.filter((g) => g.last_checked_in === todayStr).length}</div>
                    <div className="home-stat-label">Done Today</div>
                  </div>
                </div>
              </div>

              {/* Suggested people */}
              {suggested.length > 0 && (
                <div className="home-sidebar-card">
                  <div className="home-card-header">
                    <h3 className="home-sidebar-title">People You May Know</h3>
                    <button type="button" className="home-card-link" onClick={() => navigate('/connections')}>See all</button>
                  </div>
                  <div className="home-suggested-list">
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
              )}

              {/* About Me */}
              <div className="profile-sidebar-card">
                <div className="sidebar-about-header">
                  <h3 className="sidebar-card-title">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    About Me
                  </h3>
                  <button className="edit-questions-btn" onClick={() => setEditing((v) => !v)}>✏️ Edit</button>
                </div>
                {profile?.bio
                  ? <p className="about-me-bio">{profile.bio}</p>
                  : <p className="about-me-empty">No bio yet — click Edit to add one.</p>
                }
                {(profile?.city || profile?.state) && (
                  <div className="about-me-location">📍 {[profile.city, profile.state].filter(Boolean).join(', ')}</div>
                )}
              </div>

              {/* Looking For */}
              <div className="profile-sidebar-card">
                <h3 className="sidebar-card-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Looking For
                </h3>
                <p className="lf-hint">Select what kind of accountability partner you're seeking</p>
                <div className="lf-chips">
                  {LOOKING_FOR_CATEGORIES.map((cat) => (
                    <button key={cat} type="button" className={`lf-chip${lookingFor.includes(cat) ? ' active' : ''}`} onClick={() => toggleLookingFor(cat)}>
                      {cat}
                    </button>
                  ))}
                  {lookingFor.filter((t) => !LOOKING_FOR_CATEGORIES.includes(t)).map((tag) => (
                    <button key={tag} type="button" className="lf-chip active lf-chip-custom" onClick={() => toggleLookingFor(tag)}>
                      {tag} ×
                    </button>
                  ))}
                </div>
                <div className="lf-custom-row">
                  <input
                    className="lf-custom-input"
                    placeholder="Add custom tag..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                  />
                  <button type="button" className="lf-custom-add" onClick={addCustomTag}>+</button>
                </div>
                <button className="lf-save-btn" onClick={handleSaveLookingFor} disabled={savingLookingFor}>
                  {savingLookingFor ? 'Saving...' : 'Save'}
                </button>
              </div>

              {/* Add a Goal */}
              <div className="profile-sidebar-card" ref={addGoalRef}>
                <h3 className="sidebar-card-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add a Goal
                </h3>
                <form className="add-goal-form-wrap" onSubmit={handleAddGoal}>
                  <div className="goal-type-toggle">
                    <button
                      type="button"
                      className={`goal-type-btn${newGoalType === 'habit' ? ' active' : ''}`}
                      onClick={() => setNewGoalType('habit')}
                    >✓ Habit</button>
                    <button
                      type="button"
                      className={`goal-type-btn${newGoalType === 'numeric' ? ' active' : ''}`}
                      onClick={() => setNewGoalType('numeric')}
                    >📊 Progress Goal</button>
                  </div>
                  <div className="add-goal-row">
                    <input
                      type="text"
                      className="add-goal-input"
                      placeholder={newGoalType === 'habit' ? 'e.g. Attend church weekly' : 'e.g. Run more miles'}
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="add-goal-btn"
                      disabled={addingGoal || (newGoalType === 'numeric' && (!newGoalUnit.trim() || !newGoalTarget))}
                    >
                      {addingGoal ? '...' : 'Add'}
                    </button>
                  </div>
                  {newGoalType === 'numeric' && (
                    <div className="numeric-goal-fields">
                      <div className="numeric-inputs-row">
                        <input type="number" className="add-goal-input target-num-input" placeholder="Target" min="0" step="any" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} required />
                        <input type="text" className="add-goal-input unit-text-input" placeholder="unit (miles, lbs, $…)" value={newGoalUnit} onChange={(e) => setNewGoalUnit(e.target.value)} required />
                      </div>
                      {newGoalCategory && UNIT_SUGGESTIONS[newGoalCategory] && (
                        <div className="unit-suggestion-chips">
                          {UNIT_SUGGESTIONS[newGoalCategory].map((u) => (
                            <button key={u} type="button" className={`unit-chip${newGoalUnit === u ? ' active' : ''}`} onClick={() => setNewGoalUnit(u)}>{u}</button>
                          ))}
                        </div>
                      )}
                      <div className="period-toggle">
                        {[['weekly', 'Weekly'], ['monthly', 'Monthly'], ['total', 'One-Time']].map(([val, lbl]) => (
                          <button key={val} type="button" className={`period-btn${newGoalPeriod === val ? ' active' : ''}`} onClick={() => setNewGoalPeriod(val)}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="add-goal-categories">
                    {GOAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`goal-cat-chip${newGoalCategory === cat.value ? ' active' : ''}`}
                        onClick={() => setNewGoalCategory((prev) => prev === cat.value ? '' : cat.value)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="add-goal-reminder">
                    <span className="add-goal-reminder-label">🔔 Daily reminder</span>
                    <select
                      className="add-goal-reminder-select"
                      value={newGoalReminder}
                      onChange={(e) => setNewGoalReminder(e.target.value)}
                    >
                      <option value="">No reminder</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i % 12 === 0 ? 12 : i % 12;
                        const ampm = i < 12 ? 'AM' : 'PM';
                        const val = `${String(i).padStart(2, '0')}:00`;
                        return <option key={i} value={val}>{h}:00 {ampm}</option>;
                      })}
                    </select>
                  </div>
                </form>
              </div>

              {/* Daily Reflection */}
              <div className="profile-sidebar-card">
                <div className="reflection-card-header">
                  <h3 className="sidebar-card-title">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Daily Reflection
                  </h3>
                  <button className="edit-questions-btn" onClick={editingQuestions ? () => setEditingQuestions(false) : () => { setDraftQuestions([...activeQuestions]); setEditingQuestions(true); }}>
                    {editingQuestions ? 'Cancel' : '✏️ Edit'}
                  </button>
                </div>
                {editingQuestions ? (
                  <div className="edit-questions-form">
                    {(draftQuestions ?? activeQuestions).map((q, i) => (
                      <div key={i} className="edit-question-row">
                        <span className="edit-question-num">{i + 1}.</span>
                        <input className="edit-question-input" value={q} onChange={(e) => setDraftQuestions((prev) => prev.map((x, j) => j === i ? e.target.value : x))} placeholder={`Question ${i + 1}`} />
                      </div>
                    ))}
                    <button className="save-questions-btn" onClick={handleSaveQuestions} disabled={savingQuestions}>
                      {savingQuestions ? 'Saving...' : 'Save Questions'}
                    </button>
                  </div>
                ) : (
                  <div className="reflection-list">
                    {activeQuestions.map((q, i) => (
                      <div key={i} className="reflection-item">
                        <p className="reflection-question">{q}</p>
                        <textarea className="reflection-input" placeholder="Your thoughts..." rows={2} value={answers[i] ?? ''} onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))} />
                        <div className="reflection-footer">
                          <label className="reflection-privacy-toggle">
                            <input type="checkbox" checked={publicAnswers[i] ?? false} onChange={(e) => setPublicAnswers((prev) => ({ ...prev, [i]: e.target.checked }))} />
                            <span>{publicAnswers[i] ? '🌍 Public' : '🔒 Private'}</span>
                          </label>
                          <button type="button" className="reflection-submit" onClick={() => handleSaveAnswer(i)} disabled={savingAnswers[i] || !answers[i]?.trim()}>
                            {savingAnswers[i] ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 30-Day Affirmation */}
              <div className="profile-sidebar-card affirmation-card">
                <h3 className="sidebar-card-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  30-Day Affirmation
                </h3>
                {!profile?.affirmation_start_date ? (
                  <div className="affirmation-start">
                    <p className="affirmation-start-desc">Commit to writing one positive affirmation every day for 30 days.</p>
                    <button className="affirmation-begin-btn" onClick={handleStartChallenge}>Start the Challenge</button>
                  </div>
                ) : affirmationDayNumber > 30 ? (
                  <div className="affirmation-complete">
                    <div className="affirmation-complete-icon">🎉</div>
                    <p className="affirmation-complete-text">You completed 30 days!</p>
                    <button className="affirmation-begin-btn" onClick={handleNewRound}>Start New Round</button>
                  </div>
                ) : (
                  <>
                    <div className="affirmation-progress-row">
                      <span className="affirmation-day-label">Day {affirmationDayNumber} of 30</span>
                      <span className="affirmation-count">{completedAffirmationDays.size} done</span>
                    </div>
                    <div className="affirmation-grid">
                      {Array.from({ length: 30 }, (_, i) => {
                        const day = i + 1;
                        const done = completedAffirmationDays.has(day);
                        const isToday = day === affirmationDayNumber;
                        const future = day > affirmationDayNumber;
                        return (
                          <div key={day} className={`affirmation-day${done ? ' done' : ''}${isToday && !done ? ' today' : ''}${future ? ' future' : ''}`} title={`Day ${day}`} />
                        );
                      })}
                    </div>
                    {doneAffirmationToday ? (
                      <div className="affirmation-done-today">
                        <span className="affirmation-done-label">✓ Today's affirmation</span>
                        <p className="affirmation-done-text">"{todayAffirmation?.answer}"</p>
                      </div>
                    ) : (
                      <div className="affirmation-form">
                        <textarea className="affirmation-textarea" placeholder="I am..." rows={3} value={affirmationText} onChange={(e) => setAffirmationText(e.target.value)} />
                        <div className="reflection-footer">
                          <label className="reflection-privacy-toggle">
                            <input type="checkbox" checked={affirmationPublic} onChange={(e) => setAffirmationPublic(e.target.checked)} />
                            <span>{affirmationPublic ? '🌍 Public' : '🔒 Private'}</span>
                          </label>
                          <button className="reflection-submit" onClick={handleSaveAffirmation} disabled={savingAffirmation || !affirmationText.trim()}>
                            {savingAffirmation ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* My Journeys */}
              {partnerships.filter((p) => p.status === 'active').length > 0 && (
                <div className="profile-sidebar-card journey-card">
                  <h3 className="sidebar-card-title">
                    🚀 My Journeys
                  </h3>
                  <div className="journey-list">
                    {partnerships.filter((p) => p.status === 'active').map((p) => {
                      const { partnerProfile, partnerId, myGoal, partnerGoal } = partnerSide(p);
                      const partnerName = getDisplayName(partnerProfile, 'Partner');
                      const daysTogether = p.started_at
                        ? Math.floor((Date.now() - new Date(p.started_at)) / 86400000) + 1
                        : 1;
                      const todayDateStr = getTodayStr();
                      const myCheckedToday = myGoal?.last_checked_in === todayDateStr;
                      const partnerCheckedToday = partnerGoal?.last_checked_in === todayDateStr;
                      return (
                        <div key={p.id} className="journey-item">
                          <div className="journey-item-header">
                            <button className="journey-avatar-btn" onClick={() => navigate(`/profile/${partnerId}`)}>
                              <Avatar url={partnerProfile?.avatar_url} name={partnerName} size={38} />
                            </button>
                            <div className="journey-item-info">
                              <button className="journey-partner-name" onClick={() => navigate(`/profile/${partnerId}`)}>
                                {partnerName}
                              </button>
                              <div className="journey-day-count">Day {daysTogether} together</div>
                            </div>
                          </div>
                          <div className="journey-goals-row">
                            {myGoal ? (
                              <div className={`journey-goal-chip${myCheckedToday ? ' done' : ''}`}>
                                <span className="journey-goal-who">You</span>
                                <span className="journey-goal-title">{myGoal.title}</span>
                                <span className="journey-goal-status">{myCheckedToday ? '✓' : '○'}</span>
                              </div>
                            ) : (
                              <button
                                className="journey-link-goal-btn"
                                onClick={() => { setJourneyGoalPicker({ partnershipId: p.id }); setJourneyPickerGoalId(''); setJourneyPickerShowNew(false); }}
                              >＋ Link your goal</button>
                            )}
                            {partnerGoal && (
                              <div className={`journey-goal-chip${partnerCheckedToday ? ' done' : ''}`}>
                                <span className="journey-goal-who">{partnerName.split(' ')[0]}</span>
                                <span className="journey-goal-title">{partnerGoal.title}</span>
                                <span className="journey-goal-status">{partnerCheckedToday ? '✓' : '○'}</span>
                              </div>
                            )}
                          </div>
                          <div className="journey-action-row">
                            {partnerGoal && !partnerCheckedToday && (
                              <button
                                className={`journey-nudge-btn${nudgeSent.has(partnerId) ? ' sent' : ''}`}
                                onClick={() => !nudgeSent.has(partnerId) && handleNudge(partnerId, partnerGoal.title)}
                                disabled={nudgeSent.has(partnerId)}
                                title={nudgeSent.has(partnerId) ? 'Nudge sent!' : `Remind ${partnerName.split(' ')[0]} to check in`}
                              >
                                {nudgeSent.has(partnerId) ? '✓ Nudged' : `👋 Nudge ${partnerName.split(' ')[0]}`}
                              </button>
                            )}
                            <button
                              className="journey-msg-btn"
                              onClick={() => navigate(`/messages?with=${partnerId}`)}
                            >
                              💬 Message
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Now */}
              <div className="profile-sidebar-card">
                <h3 className="sidebar-card-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Active Now
                </h3>
                <div className="active-members-list">
                  {connectionProfiles.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0 }}>No connections yet — send a spark to someone!</p>
                  )}
                  {connectionProfiles.map((p) => {
                    const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Member';
                    return (
                      <div key={p.id} className="active-member-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${p.id}`)}>
                        <Avatar url={p.avatar_url} name={name} size={36} />
                        <div className="active-member-info">
                          <div className="active-member-name">{name}</div>
                          <div className="active-member-status">{p.tagline || p.city || 'Spark connection'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Access */}
              <div className="home-sidebar-card">
                <h3 className="home-sidebar-title">Quick Access</h3>
                <div className="home-quick-links">
                  <button className="home-quick-btn" onClick={() => navigate('/connections')}>⚡ Sparks</button>
                  <button className="home-quick-btn" onClick={() => navigate('/tribe-community')}>🌍 Tribe</button>
                  <button className="home-quick-btn" onClick={() => navigate('/messages')}>💬 Messages</button>
                  <button className="home-quick-btn" onClick={() => navigate('/leaderboard')}>🏆 Ranks</button>
                </div>
              </div>

            </aside>
          </div>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === 'journal' && (
          <div className="journal-layout">
            <section className="profile-section journal-form-section">
              <div className="section-header">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h2>New Entry</h2>
              </div>
              <form className="journal-form" onSubmit={handleSaveEntry}>
                <input type="text" className="journal-subject" placeholder="Subject..." value={journalSubject} onChange={(e) => setJournalSubject(e.target.value)} required />
                <textarea className="journal-body" placeholder="Write your thoughts, reflections, or anything on your mind..." value={journalBody} onChange={(e) => setJournalBody(e.target.value)} rows={8} required />
                <div className="journal-form-footer">
                  <label className="journal-privacy-toggle">
                    <input type="checkbox" checked={journalPublic} onChange={(e) => setJournalPublic(e.target.checked)} />
                    <span className="privacy-label">{journalPublic ? '🌍 Public — visible to your tribe' : '🔒 Private — only you can see this'}</span>
                  </label>
                  <button type="submit" className="journal-save-btn" disabled={savingEntry}>{savingEntry ? 'Saving...' : 'Save Entry'}</button>
                </div>
              </form>
            </section>
            <section className="profile-section">
              <div className="section-header">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2>Past Entries</h2>
              </div>
              {journalLoading && <p className="goals-empty">Loading entries...</p>}
              {!journalLoading && entries.length === 0 && <p className="goals-empty">No journal entries yet — write your first one above!</p>}
              <div className="journal-entries-list">
                {entries.map((entry) => (
                  <div key={entry.id} className="journal-entry-card">
                    <div className="journal-entry-header">
                      <div className="journal-entry-meta">
                        <h3 className="journal-entry-subject">{entry.subject}</h3>
                        <span className="journal-entry-timestamp">{formatDate(entry.created_at)}</span>
                      </div>
                      <div className="journal-entry-actions">
                        <span className={`journal-privacy-badge ${entry.is_public ? 'public' : 'private'}`}>{entry.is_public ? '🌍 Public' : '🔒 Private'}</span>
                        <button type="button" className="journal-expand-btn" onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>{expandedEntry === entry.id ? 'Collapse' : 'Read'}</button>
                        <button type="button" className="journal-delete-btn" onClick={() => setConfirmDialog({ message: 'Delete this entry?', onConfirm: () => deleteEntry(entry.id) })}>×</button>
                      </div>
                    </div>
                    {expandedEntry === entry.id && <p className="journal-entry-body">{entry.body}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── MY POSTS TAB ── */}
        {activeTab === 'posts' && (
          <section className="profile-section">
            <div className="section-header">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h2>My Community Posts</h2>
            </div>
            {myPostsLoading && <p className="goals-empty">Loading posts...</p>}
            {!myPostsLoading && myOwnPosts.length === 0 && <p className="goals-empty">You haven't posted to the community yet — head to Tribe to share something!</p>}
            <div className="my-posts-list">
              {myOwnPosts.map((post) => {
                const typeLabel = post.post_type === 'achievement' ? '🏆 Achievement' : post.post_type === 'meetup' ? '📅 Meetup' : '💬 General';
                return (
                  <div key={post.id} className="my-post-card">
                    <div className="my-post-header">
                      <span className="my-post-type">{typeLabel}</span>
                      <span className="my-post-date">{formatDate(post.created_at)}</span>
                      <button
                        type="button"
                        className="my-post-delete-btn"
                        onClick={() => setConfirmDialog({ message: 'Delete this post?', onConfirm: () => handleDeletePost(post.id) })}
                        title="Delete post"
                      >×</button>
                    </div>
                    {post.milestone && <div className="my-post-milestone">🏆 {post.milestone}</div>}
                    <p className="my-post-content">{post.content}</p>
                    <div className="my-post-stats"><span>❤️ {post.likes} likes</span></div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── REFLECTIONS TAB ── */}
        {activeTab === 'reflections' && (
          <div className="journal-layout">
            <section className="profile-section">
              <div className="section-header">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2>Daily Reflections</h2>
              </div>
              {reflections.length === 0
                ? <p className="goals-empty">No reflections saved yet — answer the daily questions on the Overview tab.</p>
                : (
                  <div className="reflections-tab-list">
                    {reflections.map((r) => (
                      <div key={r.id} className="reflection-tab-item">
                        <div className="reflection-tab-meta">
                          <span className="reflection-tab-q">{r.question}</span>
                          <div className="reflection-tab-badges">
                            <span className={`ref-privacy-badge ${r.is_public ? 'public' : 'private'}`}>{r.is_public ? '🌍 Public' : '🔒 Private'}</span>
                            <span className="reflection-history-date">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <p className="reflection-tab-answer">{r.answer}</p>
                      </div>
                    ))}
                  </div>
                )
              }
            </section>
            <section className="profile-section">
              <div className="section-header">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h2>Affirmations</h2>
              </div>
              {affirmations.length === 0
                ? <p className="goals-empty">No affirmations saved yet — start the 30-day challenge on the Overview tab.</p>
                : (
                  <div className="reflections-tab-list">
                    {affirmations.map((a, i) => (
                      <div key={a.id} className="reflection-tab-item affirmation-tab-item">
                        <div className="reflection-tab-meta">
                          <span className="reflection-tab-q">
                            Day {profile?.affirmation_start_date
                              ? Math.floor((new Date(a.created_at) - new Date(profile.affirmation_start_date)) / 86400000) + 1
                              : i + 1}
                          </span>
                          <div className="reflection-tab-badges">
                            <span className={`ref-privacy-badge ${a.is_public ? 'public' : 'private'}`}>{a.is_public ? '🌍 Public' : '🔒 Private'}</span>
                            <span className="reflection-history-date">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <p className="reflection-tab-answer">{a.answer}</p>
                      </div>
                    ))}
                  </div>
                )
              }
            </section>
          </div>
        )}

        {/* Hidden file input */}
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileSelect} />

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeUploadModal()}>
            <div className="upload-modal">
              <div className="upload-modal-header">
                <h2>Upload {uploadFile_?.type?.startsWith('video') ? 'Video' : 'Photo'}</h2>
                <button className="upload-modal-close" onClick={closeUploadModal}>×</button>
              </div>
              <form onSubmit={handleUploadSubmit} className="upload-modal-body">
                {previewUrl && (
                  <div className="upload-preview">
                    {uploadFile_?.type?.startsWith('video')
                      ? <video src={previewUrl} className="upload-preview-media" controls />
                      : <img src={previewUrl} alt="preview" className="upload-preview-media" />
                    }
                  </div>
                )}
                <div className="upload-field">
                  <label>Caption (optional)</label>
                  <input type="text" className="upload-input" placeholder="Add a caption..." value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} />
                </div>
                <div className="upload-field">
                  <label>Who can see this?</label>
                  <div className="visibility-options">
                    {[['everyone', '🌍 Everyone'], ['tribe', '👥 My Tribe'], ['connections', '⚡ My Sparks']].map(([val, label]) => (
                      <button key={val} type="button" className={`visibility-btn${uploadVisibility === val ? ' active' : ''}`} onClick={() => setUploadVisibility(val)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="upload-field">
                  <label>Also share to</label>
                  <div className="shareto-options">
                    {[['tribe_feed', '📢 Tribe Feed'], ['profile', '👤 Profile Only']].map(([val, label]) => (
                      <button key={val} type="button" className={`shareto-btn${uploadShareTo.includes(val) ? ' active' : ''}`} onClick={() => toggleShareTo(val)}>{label}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="upload-submit-btn" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showPostModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPostModal(false)}>
            <div className="upload-modal">
              <div className="upload-modal-header">
                <h2>Create Post</h2>
                <button className="upload-modal-close" onClick={() => setShowPostModal(false)}>×</button>
              </div>
              <div className="upload-modal-body">
                <div className="upload-field">
                  <label>Post Type</label>
                  <div className="post-type-buttons">
                    {[['general', '💬 General'], ['achievement', '🏆 Achievement'], ['meetup', '📅 Meetup']].map(([val, lbl]) => (
                      <button key={val} type="button" className={`type-btn${postType === val ? ' active' : ''}`} onClick={() => setPostType(val)}>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div className="upload-field">
                  <label>What's on your mind?</label>
                  <textarea className="journal-body" rows={5} placeholder="Share your thoughts, achievements, or organize a meetup..." value={postContent} onChange={(e) => setPostContent(e.target.value)} />
                </div>
                {postType === 'achievement' && (
                  <div className="upload-field">
                    <label>Milestone Reached</label>
                    <input type="text" className="upload-input" placeholder="e.g., 30-day streak, Lost 10 lbs..." value={postMilestone} onChange={(e) => setPostMilestone(e.target.value)} />
                  </div>
                )}
                <button className="upload-submit-btn" onClick={handleSubmitPost} disabled={submittingPost || !postContent.trim()}>
                  {submittingPost ? 'Posting...' : 'Post to Community'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDialog && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
            onCancel={() => setConfirmDialog(null)}
            confirmLabel="Delete"
            danger
          />
        )}
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
