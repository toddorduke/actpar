import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useGoals } from '../../hooks/useGoals.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { supabase } from '../../lib/supabase.js';
import './ProfileSetupPage.css';

const CATEGORIES = [
  { value: 'Faith / Church', label: '✝️ Faith' },
  { value: 'Fitness',        label: '💪 Fitness' },
  { value: 'Nutrition',      label: '🥗 Nutrition' },
  { value: 'Mental Health',  label: '🧠 Mental Health' },
  { value: 'Career',         label: '💼 Career' },
  { value: 'Finance',        label: '💰 Finance' },
  { value: 'Sobriety',       label: '🌿 Sobriety' },
  { value: 'Reading',        label: '📚 Reading' },
  { value: 'Meditation',     label: '🧘 Meditation' },
  { value: 'Sleep',          label: '😴 Sleep' },
  { value: 'Relationships',  label: '❤️ Relationships' },
  { value: 'Education',      label: '🎓 Education' },
];

const STEPS = [
  { number: 1, label: 'Your Identity' },
  { number: 2, label: 'Your Photo' },
  { number: 3, label: 'Your First Goal' },
];

export default function ProfileSetupPage() {
  const { user } = useContext(AuthContext);
  const { profile, updateProfile } = useProfile();
  const { addGoal } = useGoals();
  const navigate = useNavigate();
  const toast = useToast();
  const avatarInputRef = useRef(null);

  const [step, setStep] = useState(1);

  // Step 1
  const [alterEgo, setAlterEgo] = useState('');
  const [tagline, setTagline] = useState('');

  // Step 2
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Step 3
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('');

  const [saving, setSaving] = useState(false);

  const firstName = profile?.first_name || user?.user_metadata?.first_name || '';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'You';

  useEffect(() => {
    if (profile) {
      setAlterEgo(profile.alter_ego_name ?? user?.user_metadata?.alter_ego_name ?? '');
      setTagline(profile.tagline ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile, user]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      toast(`Upload failed: ${uploadError.message}`, 'error');
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploadingAvatar(false);
    toast('Photo uploaded!', 'success');
  }

  async function handleStep1() {
    if (!alterEgo.trim()) {
      toast('Please enter your Alter Ego name.', 'error');
      return;
    }
    await updateProfile({ alter_ego_name: alterEgo.trim(), tagline: tagline.trim() || null });
    setStep(2);
  }

  function handleStep2() {
    if (!avatarUrl) {
      toast('Please upload a profile photo to continue.', 'error');
      return;
    }
    setStep(3);
  }

  async function handleFinish() {
    if (!goalTitle.trim()) {
      toast('Please enter at least one goal to continue.', 'error');
      return;
    }
    setSaving(true);
    await addGoal(goalTitle.trim(), goalCategory || null, { tier: 1 });
    await updateProfile({ avatar_url: avatarUrl, profile_setup_complete: true });
    await supabase.auth.updateUser({ data: { profile_setup_complete: true } });
    navigate('/', { replace: true });
  }

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">

        {/* Progress */}
        <div className="psu-progress-row">
          {STEPS.map((s) => (
            <div key={s.number} className={`psu-progress-step${step === s.number ? ' active' : step > s.number ? ' done' : ''}`}>
              <div className="psu-progress-dot">{step > s.number ? '✓' : s.number}</div>
              <span className="psu-progress-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <div className="psu-step">
            <div className="profile-setup-header">
              <div className="profile-setup-step">Step 1 of 3</div>
              <h1 className="profile-setup-title">Who are you becoming?</h1>
              <p className="profile-setup-subtitle">
                Your Alter Ego is the version of you that shows up no matter what. Name it and own it.
              </p>
            </div>

            <div className="psu-name-display">
              <span className="psu-name-label">Your name</span>
              <span className="psu-name-value">{displayName}</span>
            </div>

            <div className="profile-setup-fields">
              <div className="profile-setup-group">
                <label className="profile-setup-label">
                  Alter Ego Name <span className="profile-setup-required">*</span>
                </label>
                <input
                  className="profile-setup-input"
                  type="text"
                  placeholder="e.g. IronMike, FaithFirst, The Comeback Kid"
                  value={alterEgo}
                  onChange={(e) => setAlterEgo(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
                <span className="profile-setup-hint">This is your accountability persona — who you're becoming.</span>
              </div>

              <div className="profile-setup-group">
                <label className="profile-setup-label">Tagline <span className="psu-optional">optional</span></label>
                <input
                  className="profile-setup-input"
                  type="text"
                  placeholder="e.g. Building better habits, one day at a time"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={100}
                />
                <span className="profile-setup-hint">Short line shown under your name on your profile.</span>
              </div>
            </div>

            <button className="profile-setup-btn" onClick={handleStep1} disabled={!alterEgo.trim()}>
              Next: Add Your Photo →
            </button>
          </div>
        )}

        {/* ── Step 2: Photo ── */}
        {step === 2 && (
          <div className="psu-step">
            <div className="profile-setup-header">
              <div className="profile-setup-step">Step 2 of 3</div>
              <h1 className="profile-setup-title">Put a face to the name.</h1>
              <p className="profile-setup-subtitle">
                A real photo builds trust with your accountability partners. This is required.
              </p>
            </div>

            <div className="psu-avatar-center">
              <button
                className="profile-setup-avatar-btn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                type="button"
              >
                <Avatar url={avatarUrl} name={displayName} size={120} />
                <div className="profile-setup-avatar-overlay">
                  {uploadingAvatar ? '⏳' : avatarUrl ? '✏️' : '📷'}
                </div>
              </button>
              <span className="profile-setup-avatar-hint">
                {uploadingAvatar ? 'Uploading…' : avatarUrl ? 'Tap to change your photo' : 'Tap to upload a photo'}
              </span>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {!avatarUrl && (
              <p className="psu-required-note">A profile photo is required to continue.</p>
            )}

            <div className="psu-btn-row">
              <button className="profile-setup-btn ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="profile-setup-btn" onClick={handleStep2} disabled={!avatarUrl || uploadingAvatar}>
                Next: Set Your Goal →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: First Goal ── */}
        {step === 3 && (
          <div className="psu-step">
            <div className="profile-setup-header">
              <div className="profile-setup-step">Step 3 of 3</div>
              <h1 className="profile-setup-title">What are you working toward?</h1>
              <p className="profile-setup-subtitle">
                Set your first goal. This is what your accountability is built around.
              </p>
            </div>

            <div className="profile-setup-fields">
              <div className="profile-setup-group">
                <label className="profile-setup-label">
                  Your Goal <span className="profile-setup-required">*</span>
                </label>
                <input
                  className="profile-setup-input"
                  type="text"
                  placeholder="e.g. Run 3x a week, Read 20 minutes daily…"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  maxLength={120}
                  autoFocus
                />
              </div>

              <div className="profile-setup-group">
                <label className="profile-setup-label">Category <span className="psu-optional">optional</span></label>
                <div className="profile-setup-cats">
                  {CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`profile-setup-cat${goalCategory === value ? ' selected' : ''}`}
                      onClick={() => setGoalCategory((prev) => prev === value ? '' : value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="psu-btn-row">
              <button className="profile-setup-btn ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="profile-setup-btn" onClick={handleFinish} disabled={!goalTitle.trim() || saving}>
                {saving ? 'Setting up…' : "Let's Go 🚀"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
