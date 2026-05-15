import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { supabase } from '../../lib/supabase.js';
import './ProfileSetupPage.css';

const CATEGORIES = [
  { value: 'faith',        label: '✝️ Faith' },
  { value: 'fitness',      label: '💪 Fitness' },
  { value: 'nutrition',    label: '🥗 Nutrition' },
  { value: 'mental-health',label: '🧠 Mental Health' },
  { value: 'career',       label: '💼 Career' },
  { value: 'finance',      label: '💰 Finance' },
  { value: 'sobriety',     label: '🌿 Sobriety' },
  { value: 'reading',      label: '📚 Reading' },
  { value: 'meditation',   label: '🧘 Meditation' },
  { value: 'sleep',        label: '😴 Sleep' },
  { value: 'relationships',label: '❤️ Relationships' },
  { value: 'education',    label: '🎓 Education' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

export default function ProfileSetupPage() {
  const { user } = useContext(AuthContext);
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const toast = useToast();
  const avatarInputRef = useRef(null);

  const [alterEgo, setAlterEgo] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const firstName = profile?.first_name || user?.user_metadata?.first_name || '';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'You';

  useEffect(() => {
    if (profile) {
      setAlterEgo(profile.alter_ego_name ?? user?.user_metadata?.alter_ego_name ?? '');
      setTagline(profile.tagline ?? '');
      setBio(profile.bio ?? '');
      setCity(profile.city ?? user?.user_metadata?.city ?? '');
      setState(profile.state ?? user?.user_metadata?.state ?? '');
      setLookingFor(profile.looking_for ?? []);
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
  }

  async function handleFinish() {
    if (!bio.trim()) {
      toast('Please add a short bio so others know who you are.', 'error');
      return;
    }

    setSaving(true);

    await updateProfile({
      alter_ego_name: alterEgo.trim() || null,
      tagline: tagline.trim() || null,
      bio: bio.trim(),
      city: city.trim() || null,
      state: state || null,
      looking_for: lookingFor,
      avatar_url: avatarUrl ?? undefined,
      profile_setup_complete: true,
    });

    await supabase.auth.updateUser({ data: { profile_setup_complete: true } });

    navigate('/', { replace: true });
  }

  const canFinish = bio.trim().length >= 10;

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">

        <div className="profile-setup-header">
          <div className="profile-setup-step">Almost there!</div>
          <h1 className="profile-setup-title">Set up your profile</h1>
          <p className="profile-setup-subtitle">
            This is how other members will find and connect with you.
          </p>
        </div>

        {/* Avatar */}
        <div className="profile-setup-avatar-section">
          <button
            className="profile-setup-avatar-btn"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            type="button"
          >
            <Avatar url={avatarUrl} name={displayName} size={96} />
            <div className="profile-setup-avatar-overlay">
              {uploadingAvatar ? '...' : '📷'}
            </div>
          </button>
          <span className="profile-setup-avatar-hint">
            {uploadingAvatar ? 'Uploading…' : 'Tap to add a photo'}
          </span>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Fields */}
        <div className="profile-setup-fields">

          <div className="profile-setup-group">
            <label className="profile-setup-label">Tagline</label>
            <input
              className="profile-setup-input"
              type="text"
              placeholder="e.g. Building better habits, one day at a time"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={100}
            />
            <span className="profile-setup-hint">Short line shown under your name.</span>
          </div>

          <div className="profile-setup-group">
            <label className="profile-setup-label">
              About Me <span className="profile-setup-required">*</span>
            </label>
            <textarea
              className="profile-setup-textarea"
              placeholder="Tell people about yourself — your story, what you're working on, what drives you…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <span className="profile-setup-char-count">{bio.length}/500</span>
          </div>

          <div className="profile-setup-group">
            <label className="profile-setup-label">
              What are you focused on?
              <span className="profile-setup-cat-count"> {lookingFor.length}/3</span>
            </label>
            <span className="profile-setup-hint" style={{ marginBottom: 8 }}>Pick up to 3 categories.</span>
            <div className="profile-setup-cats">
              {CATEGORIES.map(({ value, label }) => {
                const selected = lookingFor.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`profile-setup-cat${selected ? ' selected' : ''}`}
                    onClick={() => {
                      if (selected) {
                        setLookingFor((prev) => prev.filter((v) => v !== value));
                      } else if (lookingFor.length < 3) {
                        setLookingFor((prev) => [...prev, value]);
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="profile-setup-group">
            <label className="profile-setup-label">Alter Ego Name</label>
            <input
              className="profile-setup-input"
              type="text"
              placeholder="e.g. The Iron Version"
              value={alterEgo}
              onChange={(e) => setAlterEgo(e.target.value)}
              maxLength={60}
            />
            <span className="profile-setup-hint">Your accountability persona — who you're becoming.</span>
          </div>

          <div className="profile-setup-row">
            <div className="profile-setup-group">
              <label className="profile-setup-label">City</label>
              <input
                className="profile-setup-input"
                type="text"
                placeholder="e.g. Atlanta"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="profile-setup-group">
              <label className="profile-setup-label">State</label>
              <select
                className="profile-setup-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

        </div>

        <button
          className="profile-setup-btn"
          onClick={handleFinish}
          disabled={!canFinish || saving}
        >
          {saving ? 'Saving…' : 'Complete My Profile →'}
        </button>

        <p className="profile-setup-required-note">
          * Bio is required — everything else you can update later in Settings.
        </p>

      </div>
    </div>
  );
}
