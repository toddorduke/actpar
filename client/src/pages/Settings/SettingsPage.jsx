import React, { useContext, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useToast } from '../../components/common/Toast.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { supabase } from '../../lib/supabase.js';
import './SettingsPage.css';

const LF_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

const SECTIONS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'profile', label: 'My Profile', icon: '✨' },
  { id: 'password', label: 'Password', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'about', label: 'About ActPar', icon: 'ℹ️' },
  { id: 'danger', label: 'Delete Account', icon: '⚠️' },
];

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const toast = useToast();
  const avatarInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('account');

  // Account
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email] = useState(user?.email ?? '');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Profile
  const [alterEgo, setAlterEgo] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Notifications
  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifSparks, setNotifSparks] = useState(true);
  const [notifPact, setNotifPact] = useState(true);
  const [notifTribe, setNotifTribe] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setAlterEgo(profile.alter_ego_name ?? '');
      setTagline(profile.tagline ?? '');
      setCity(profile.city ?? '');
      setGender(profile.gender ?? '');
      setLookingFor(profile.looking_for ?? []);
      const prefs = profile.notification_prefs ?? {};
      setNotifDailyReminder(prefs.daily_reminder ?? true);
      setNotifSparks(prefs.sparks ?? true);
      setNotifPact(prefs.pact ?? true);
      setNotifTribe(prefs.tribe ?? false);
    }
  }, [profile]);

  function toggleLf(cat) {
    setLookingFor((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSaveAccount(e) {
    e.preventDefault();
    setSavingAccount(true);
    await updateProfile({ first_name: firstName, last_name: lastName });
    setSavingAccount(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) { toast(`Upload failed: ${uploadError.message}`, 'error'); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    await updateProfile({ avatar_url: urlData.publicUrl });
    toast('Profile photo updated!', 'success');
    setUploadingAvatar(false);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({
      alter_ego_name: alterEgo.trim() || null,
      tagline: tagline.trim() || null,
      city: city.trim() || null,
      gender: gender || null,
      looking_for: lookingFor,
    });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setTimeout(() => setPasswordMsg(null), 3000);
  }

  async function handleSaveNotifs() {
    setSavingNotifs(true);
    await updateProfile({
      notification_prefs: {
        daily_reminder: notifDailyReminder,
        sparks: notifSparks,
        pact: notifPact,
        tribe: notifTribe,
      },
    });
    setSavingNotifs(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      setDeleting(false);
      alert(`Error: ${error.message}`);
      return;
    }
    logout();
    navigate('/login');
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <aside className="settings-sidebar">
          <h2 className="settings-title">Settings</h2>
          <nav className="settings-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`settings-nav-item${activeSection === s.id ? ' active' : ''}${s.id === 'danger' ? ' danger' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <span className="settings-nav-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-content">

          {/* Account */}
          {activeSection === 'account' && (
            <section className="settings-section">
              <h3 className="settings-section-title">Account Information</h3>
              <form onSubmit={handleSaveAccount} className="settings-form">
                <div className="settings-field-row">
                  <div className="settings-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="settings-input"
                      placeholder="First name"
                    />
                  </div>
                  <div className="settings-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="settings-input"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="settings-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    className="settings-input disabled"
                    disabled
                  />
                  <span className="settings-hint">Email cannot be changed here.</span>
                </div>
                <button type="submit" className="settings-save-btn" disabled={savingAccount}>
                  {accountSaved ? '✓ Saved' : savingAccount ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </section>
          )}

          {/* My Profile */}
          {activeSection === 'profile' && (
            <section className="settings-section">
              <h3 className="settings-section-title">My Profile</h3>
              <p className="settings-desc">This is what others see when they browse connections and view your profile.</p>
              <form onSubmit={handleSaveProfile} className="settings-form">

                <div className="settings-field">
                  <label>Profile Photo</label>
                  <div className="settings-avatar-row">
                    <Avatar url={profile?.avatar_url} name={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()} size={64} />
                    <div className="settings-avatar-actions">
                      <button type="button" className="settings-avatar-btn" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                        {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                      </button>
                      <span className="settings-hint">JPG, PNG or GIF — max 5MB</span>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </div>
                </div>

                <div className="settings-field">
                  <label>Alter Ego Name</label>
                  <input
                    type="text"
                    value={alterEgo}
                    onChange={(e) => setAlterEgo(e.target.value)}
                    className="settings-input"
                    placeholder="Your accountability persona (e.g. IronMike, FaithFirst)"
                    maxLength={40}
                  />
                  <span className="settings-hint">Shown on your connection card with a ⚡</span>
                </div>

                <div className="settings-field">
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="settings-input"
                    placeholder="e.g. Building discipline one day at a time"
                    maxLength={100}
                  />
                </div>

                <div className="settings-field">
                  <label>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="settings-input"
                    placeholder="e.g. Atlanta, GA"
                  />
                </div>

                <div className="settings-field">
                  <label>Gender</label>
                  <div className="settings-radio-group">
                    {[['Male', '♂ Male'], ['Female', '♀ Female']].map(([val, lbl]) => (
                      <label key={val} className={`settings-radio-option${gender === val ? ' selected' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value={val}
                          checked={gender === val}
                          onChange={() => setGender(val)}
                        />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="settings-field">
                  <label>Looking For Accountability In</label>
                  <span className="settings-hint" style={{ marginBottom: 8 }}>Select all that apply — used to match you with the right people</span>
                  <div className="settings-lf-chips">
                    {LF_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`settings-lf-chip${lookingFor.includes(cat) ? ' selected' : ''}`}
                        onClick={() => toggleLf(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="settings-save-btn" disabled={savingProfile}>
                  {profileSaved ? '✓ Saved' : savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </section>
          )}

          {/* Password */}
          {activeSection === 'password' && (
            <section className="settings-section">
              <h3 className="settings-section-title">Change Password</h3>
              <form onSubmit={handleChangePassword} className="settings-form">
                <div className="settings-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="settings-input"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                <div className="settings-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="settings-input"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
                {passwordMsg && (
                  <div className={`settings-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
                )}
                <button type="submit" className="settings-save-btn" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <section className="settings-section">
              <h3 className="settings-section-title">Notification Preferences</h3>
              <p className="settings-desc">Choose what you want to be notified about.</p>
              <div className="settings-toggles">
                {[
                  [notifDailyReminder, setNotifDailyReminder, 'Daily Check-In Reminder', 'Remind you to check in on your goals each day'],
                  [notifSparks, setNotifSparks, 'Spark Requests', 'When someone sends you a spark connection'],
                  [notifPact, setNotifPact, 'Pact Activity', 'New posts and updates in your pacts'],
                  [notifTribe, setNotifTribe, 'Tribe Community', 'New posts in the community feed'],
                ].map(([val, setter, title, desc]) => (
                  <div key={title} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <div className="settings-toggle-title">{title}</div>
                      <div className="settings-toggle-desc">{desc}</div>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch${val ? ' on' : ''}`}
                      onClick={() => setter(!val)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="settings-save-btn"
                style={{ marginTop: '20px' }}
                onClick={handleSaveNotifs}
                disabled={savingNotifs}
              >
                {notifSaved ? '✓ Saved' : savingNotifs ? 'Saving...' : 'Save Preferences'}
              </button>
            </section>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <section className="settings-section">
              <h3 className="settings-section-title">About ActPar</h3>
              <p className="settings-desc">
                ActPar is a social accountability platform built to help real people
                set goals and actually follow through — together.
              </p>
              <div className="settings-about-links">
                <Link to="/about" className="settings-about-link">
                  <span>🌐</span> About &amp; Mission
                </Link>
                <button
                  className="settings-about-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                  onClick={() => {
                    Object.keys(localStorage)
                      .filter((k) => k.startsWith('actpar_guide_seen_'))
                      .forEach((k) => localStorage.removeItem(k));
                    window.location.reload();
                  }}
                >
                  <span>🗺️</span> Replay App Guide
                </button>
                <a href="/legal/terms-of-service.html" target="_blank" rel="noreferrer" className="settings-about-link">
                  <span>📄</span> Terms of Service
                </a>
                <a href="/legal/privacy-policy.html" target="_blank" rel="noreferrer" className="settings-about-link">
                  <span>🔒</span> Privacy Policy
                </a>
                <a href="mailto:hello@actpar.com" className="settings-about-link">
                  <span>✉️</span> Contact Us
                </a>
                <a href="mailto:safety@actpar.com" className="settings-about-link">
                  <span>🚨</span> Report a Safety Issue
                </a>
              </div>
              <div className="settings-about-version">
                Version 1.0.0 &nbsp;·&nbsp; © {new Date().getFullYear()} ActPar
              </div>
            </section>
          )}

          {/* Delete Account */}
          {activeSection === 'danger' && (
            <section className="settings-section danger-section">
              <h3 className="settings-section-title danger-title">Delete Account</h3>
              <p className="settings-desc">
                Permanently delete your account and all associated data — goals, posts, connections, and media. <strong>This cannot be undone.</strong>
              </p>
              {!showDeleteConfirm ? (
                <button className="delete-account-btn" onClick={() => setShowDeleteConfirm(true)}>
                  Delete My Account
                </button>
              ) : (
                <div className="delete-confirm-box">
                  <p className="delete-confirm-label">Type <strong>DELETE</strong> to confirm:</p>
                  <input
                    type="text"
                    className="settings-input delete-input"
                    placeholder="DELETE"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                  />
                  <div className="delete-confirm-actions">
                    <button
                      className="delete-confirm-btn"
                      disabled={deleteInput !== 'DELETE' || deleting}
                      onClick={handleDeleteAccount}
                    >
                      {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </button>
                    <button
                      className="delete-cancel-btn"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
