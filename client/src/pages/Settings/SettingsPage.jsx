import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useProfile } from '../../hooks/useProfile.js';
import { useToast } from '../../components/common/Toast.jsx';
import { usePushNotifications } from '../../hooks/usePushNotifications.js';
import { useCustomCategories } from '../../hooks/useCustomCategories.js';
import Avatar from '../../components/common/Avatar.jsx';
import { supabase } from '../../lib/supabase.js';
import './SettingsPage.css';

const LF_CATEGORIES = [
  'Faith / Church', 'Fitness', 'Nutrition', 'Mental Health', 'Career',
  'Finance', 'Sobriety', 'Reading', 'Meditation', 'Sleep', 'Relationships', 'Education',
];

const US_CITIES = [
  'Albuquerque, NM', 'Anchorage, AK', 'Arlington, TX', 'Atlanta, GA', 'Aurora, CO',
  'Austin, TX', 'Bakersfield, CA', 'Baltimore, MD', 'Baton Rouge, LA', 'Birmingham, AL',
  'Boise, ID', 'Boston, MA', 'Buffalo, NY', 'Chandler, AZ', 'Charlotte, NC',
  'Chesapeake, VA', 'Chicago, IL', 'Chula Vista, CA', 'Cincinnati, OH', 'Cleveland, OH',
  'Colorado Springs, CO', 'Columbus, OH', 'Corpus Christi, TX', 'Dallas, TX', 'Denver, CO',
  'Detroit, MI', 'Durham, NC', 'El Paso, TX', 'Fort Wayne, IN', 'Fort Worth, TX',
  'Fremont, CA', 'Fresno, CA', 'Garland, TX', 'Gilbert, AZ', 'Glendale, AZ',
  'Glendale, CA', 'Greensboro, NC', 'Henderson, NV', 'Hialeah, FL', 'Honolulu, HI',
  'Houston, TX', 'Indianapolis, IN', 'Irvine, CA', 'Irving, TX', 'Jacksonville, FL',
  'Jersey City, NJ', 'Kansas City, MO', 'Laredo, TX', 'Las Vegas, NV', 'Lexington, KY',
  'Lincoln, NE', 'Long Beach, CA', 'Los Angeles, CA', 'Louisville, KY', 'Lubbock, TX',
  'Madison, WI', 'Memphis, TN', 'Mesa, AZ', 'Miami, FL', 'Milwaukee, WI',
  'Minneapolis, MN', 'Nashville, TN', 'New Orleans, LA', 'New York, NY', 'Newark, NJ',
  'Norfolk, VA', 'North Las Vegas, NV', 'Oakland, CA', 'Oklahoma City, OK', 'Omaha, NE',
  'Orlando, FL', 'Philadelphia, PA', 'Phoenix, AZ', 'Pittsburgh, PA', 'Plano, TX',
  'Portland, OR', 'Raleigh, NC', 'Reno, NV', 'Richmond, VA', 'Riverside, CA',
  'Sacramento, CA', 'Saint Paul, MN', 'San Antonio, TX', 'San Diego, CA', 'San Francisco, CA',
  'San Jose, CA', 'Santa Ana, CA', 'Scottsdale, AZ', 'Seattle, WA', 'Spokane, WA',
  'St. Louis, MO', 'Stockton, CA', 'Tampa, FL', 'Toledo, OH', 'Tucson, AZ',
  'Tulsa, OK', 'Virginia Beach, VA', 'Washington, DC', 'Wichita, KS', 'Winston-Salem, NC',
];

const GROWTH_AREAS = [
  'Beating Procrastination', 'Building Daily Discipline', 'Sharpening My Focus',
  'Staying Consistent', 'Reigniting My Motivation', 'Mastering My Time',
  'Silencing Self-Doubt', 'Breaking Old Habits', 'Taking More Action',
  'Quieting Overthinking', 'Managing Stress Better', 'Showing Up for Myself',
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
  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, subscribe: subscribePush, unsubscribe: unsubscribePush, permission: pushPermission, pushError } = usePushNotifications();

  // Account
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  // Profile
  const [alterEgo, setAlterEgo] = useState('');
  const [egoStatus, setEgoStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const egoTimer = useRef(null);
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef(null);
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [workingOn, setWorkingOn] = useState([]);
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
  const [notifReminderHour, setNotifReminderHour] = useState(8);
  const [notifAutoCheckin, setNotifAutoCheckin] = useState(false);
  const [notifSparks, setNotifSparks] = useState(true);
  const [notifPact, setNotifPact] = useState(true);
  const [notifTribe, setNotifTribe] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Coach profile
  const [coachSpecialty, setCoachSpecialty] = useState('');
  const [coachTagline, setCoachTagline] = useState('');
  const [coachRate, setCoachRate] = useState('');
  const [coachRateNum, setCoachRateNum] = useState('');
  const [coachExperience, setCoachExperience] = useState('');
  const [coachClients, setCoachClients] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [coachSessionTypes, setCoachSessionTypes] = useState([]);
  const [savingCoach, setSavingCoach] = useState(false);
  const [coachSaved, setCoachSaved] = useState(false);

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
      setWorkingOn(profile.working_on ?? []);
      const prefs = profile.notification_prefs ?? {};
      setNotifDailyReminder(prefs.daily_reminder ?? true);
      setNotifReminderHour(prefs.reminder_hour ?? 8);
      setNotifAutoCheckin(prefs.auto_checkin ?? false);
      setNotifSparks(prefs.sparks ?? true);
      setNotifPact(prefs.pact ?? true);
      setNotifTribe(prefs.tribe ?? false);
      // Coach fields
      setCoachSpecialty(profile.coach_specialty ?? '');
      setCoachTagline(profile.coach_tagline ?? '');
      setCoachRate(profile.coach_rate ?? '');
      setCoachRateNum(profile.coach_rate_num ?? '');
      setCoachExperience(profile.coach_experience ?? '');
      setCoachClients(profile.coach_clients_helped ?? '');
      setCoachBio((profile.coach_bio ?? []).join('\n\n'));
      setCoachSessionTypes(profile.coach_session_types ?? []);
    }
  }, [profile]);

  const checkAlterEgo = useCallback((name) => {
    clearTimeout(egoTimer.current);
    const trimmed = name.trim();
    if (!trimmed || trimmed.toLowerCase() === (profile?.alter_ego_name ?? '').toLowerCase()) {
      setEgoStatus(null);
      return;
    }
    setEgoStatus('checking');
    egoTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('alter_ego_name', trimmed)
        .neq('id', user.id)
        .maybeSingle();
      setEgoStatus(data ? 'taken' : 'available');
    }, 600);
  }, [profile?.alter_ego_name, user?.id]);

  // Close city dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cityOptions = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    return q ? US_CITIES.filter((c) => c.toLowerCase().includes(q)) : US_CITIES;
  }, [citySearch]);

  const [lfSearch, setLfSearch] = useState('');
  const { search: searchCats, createOrAdopt } = useCustomCategories(user?.id);
  const lfSuggestions = useMemo(() => searchCats(lfSearch), [lfSearch, searchCats]);
  const hasExactMatch = lfSuggestions.some(
    (c) => c.name.toLowerCase() === lfSearch.toLowerCase().trim(),
  );

  function toggleLf(cat) {
    setLookingFor((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleAddCustomLf(name) {
    await createOrAdopt(name);
    setLookingFor((prev) => prev.includes(name) ? prev : [...prev, name]);
    setLfSearch('');
  }

  async function handleSaveAccount(e) {
    e.preventDefault();
    setSavingAccount(true);
    await Promise.all([
      updateProfile({ first_name: firstName, last_name: lastName }),
      supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } }),
    ]);
    setSavingAccount(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === user?.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      setEmailMsg({ type: 'error', text: error.message });
    } else {
      setEmailMsg({ type: 'success', text: 'Confirmation sent to your new email — click the link to complete the change.' });
      setNewEmail('');
    }
    setTimeout(() => setEmailMsg(null), 6000);
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

    const trimmedEgo = alterEgo.trim() || null;
    const egoChanged = trimmedEgo !== (profile?.alter_ego_name ?? null);

    if (egoChanged && egoStatus === 'taken') {
      toast('That Alter Ego Name is already taken — try a different one.', 'error');
      setSavingProfile(false);
      return;
    }

    if (egoChanged && trimmedEgo) {
      const changeCount = profile?.alter_ego_change_count ?? 0;
      const lastChanged = profile?.alter_ego_last_changed ? new Date(profile.alter_ego_last_changed) : null;
      const daysSinceLast = lastChanged ? (Date.now() - lastChanged) / 86400000 : Infinity;
      const withinWindow = daysSinceLast < 30;
      const changesLeft = withinWindow ? Math.max(0, 3 - changeCount) : 3;

      if (changesLeft === 0) {
        const daysLeft = Math.ceil(30 - daysSinceLast);
        toast(`You've reached the alter ego name change limit. Try again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`, 'error');
        setSavingProfile(false);
        return;
      }

      const newCount = withinWindow ? changeCount + 1 : 1;
      await updateProfile({
        alter_ego_name: trimmedEgo,
        alter_ego_change_count: newCount,
        alter_ego_last_changed: new Date().toISOString(),
        tagline: tagline.trim() || null,
        city: city.trim() || null,
        gender: gender || null,
        looking_for: lookingFor,
        working_on: workingOn,
      });
    } else {
      await updateProfile({
        alter_ego_name: trimmedEgo,
        tagline: tagline.trim() || null,
        city: city.trim() || null,
        gender: gender || null,
        looking_for: lookingFor,
        working_on: workingOn,
      });
    }

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
    const utcOffset = new Date().getTimezoneOffset(); // minutes behind UTC (positive = west)
    const reminderUtcHour = ((notifReminderHour + Math.round(utcOffset / 60)) + 24) % 24;
    await updateProfile({
      notification_prefs: {
        daily_reminder: notifDailyReminder,
        reminder_hour: notifReminderHour,
        reminder_utc_hour: reminderUtcHour,
        auto_checkin: notifAutoCheckin,
        sparks: notifSparks,
        pact: notifPact,
        tribe: notifTribe,
      },
    });
    setSavingNotifs(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  async function handleSaveCoach(e) {
    e.preventDefault();
    setSavingCoach(true);
    const bioArray = coachBio.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    await updateProfile({
      coach_specialty: coachSpecialty.trim() || null,
      coach_tagline: coachTagline.trim() || null,
      coach_rate: coachRate.trim() || null,
      coach_rate_num: coachRateNum ? Number(coachRateNum) : null,
      coach_experience: coachExperience.trim() || null,
      coach_clients_helped: coachClients.trim() || null,
      coach_bio: bioArray,
      coach_session_types: coachSessionTypes,
    });
    setSavingCoach(false);
    setCoachSaved(true);
    setTimeout(() => setCoachSaved(false), 2500);
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
            {SECTIONS.filter(s => !s.coachOnly || profile?.account_type === 'Coach').map((s) => (
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
              <p className="settings-desc">Your legal name and email are set at registration and cannot be changed.</p>
              <div className="settings-form">
                <div className="settings-field-row">
                  <div className="settings-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profile?.first_name ?? ''}
                      className="settings-input disabled"
                      disabled
                    />
                  </div>
                  <div className="settings-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profile?.last_name ?? ''}
                      className="settings-input disabled"
                      disabled
                    />
                  </div>
                </div>
                <div className="settings-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    className="settings-input disabled"
                    disabled
                  />
                </div>
              </div>
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
                  {(() => {
                    const changeCount = profile?.alter_ego_change_count ?? 0;
                    const lastChanged = profile?.alter_ego_last_changed ? new Date(profile.alter_ego_last_changed) : null;
                    const daysSinceLast = lastChanged ? (Date.now() - lastChanged) / 86400000 : Infinity;
                    const withinWindow = daysSinceLast < 30;
                    const changesLeft = withinWindow ? Math.max(0, 3 - changeCount) : 3;
                    const locked = changesLeft === 0;
                    const daysLeft = locked ? Math.ceil(30 - daysSinceLast) : null;
                    return (
                      <>
                        <input
                          type="text"
                          value={alterEgo}
                          onChange={(e) => { setAlterEgo(e.target.value); checkAlterEgo(e.target.value); }}
                          className={`settings-input${locked ? ' disabled' : egoStatus === 'taken' ? ' input-error' : egoStatus === 'available' ? ' input-success' : ''}`}
                          placeholder="Your accountability persona (e.g. IronMike, FaithFirst)"
                          maxLength={40}
                          disabled={locked}
                        />
                        {locked ? (
                          <span className="settings-hint ego-locked">
                            🔒 Name change limit reached — available again in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </span>
                        ) : egoStatus === 'checking' ? (
                          <span className="settings-hint">Checking availability…</span>
                        ) : egoStatus === 'taken' ? (
                          <span className="settings-hint ego-taken">✗ Already taken — try another name.</span>
                        ) : egoStatus === 'available' ? (
                          <span className="settings-hint ego-available">✓ Available!</span>
                        ) : withinWindow && changeCount > 0 ? (
                          <span className="settings-hint">
                            ⚡ {3 - changeCount} name change{3 - changeCount !== 1 ? 's' : ''} remaining this period
                          </span>
                        ) : (
                          <span className="settings-hint">3 changes allowed per 30 days</span>
                        )}
                      </>
                    );
                  })()}
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

                <div className="settings-field" ref={cityRef}>
                  <label>City</label>
                  <div className="settings-city-dropdown">
                    <button
                      type="button"
                      className="settings-city-trigger"
                      onClick={() => { setCityOpen((o) => !o); setCitySearch(''); }}
                    >
                      <span className={city ? '' : 'settings-city-placeholder'}>
                        {city || 'Select your city'}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {cityOpen && (
                      <div className="settings-city-menu">
                        <input
                          autoFocus
                          type="text"
                          className="settings-city-search"
                          placeholder="Search city..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                        />
                        <div className="settings-city-list">
                          {city && (
                            <button
                              type="button"
                              className="settings-city-option settings-city-clear"
                              onClick={() => { setCity(''); setCityOpen(false); }}
                            >
                              Clear selection
                            </button>
                          )}
                          {cityOptions.length === 0 && (
                            <div className="settings-city-empty">No cities found</div>
                          )}
                          {cityOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`settings-city-option${city === c ? ' selected' : ''}`}
                              onClick={() => { setCity(c); setCityOpen(false); }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

                  {/* Custom category search */}
                  <div className="settings-lf-search-wrap">
                    <input
                      type="text"
                      className="settings-lf-search"
                      placeholder="Search or add a focus area…"
                      value={lfSearch}
                      onChange={(e) => setLfSearch(e.target.value)}
                    />
                    {lfSearch && (
                      <button type="button" className="settings-lf-search-clear" onClick={() => setLfSearch('')}>×</button>
                    )}
                  </div>
                  {lfSearch.trim().length > 0 && (
                    <div className="settings-lf-suggestions">
                      {lfSuggestions.map((c) => (
                        <button key={c.id} type="button" className="settings-lf-suggestion" onClick={() => handleAddCustomLf(c.name)}>
                          {c.name}
                          {c.status === 'active'
                            ? <span className="settings-lf-badge settings-lf-active">popular</span>
                            : <span className="settings-lf-badge settings-lf-pending">{c.use_count}/3</span>
                          }
                        </button>
                      ))}
                      {lfSearch.trim().length >= 3 && !hasExactMatch && (
                        <button type="button" className="settings-lf-create" onClick={() => handleAddCustomLf(lfSearch.trim())}>
                          + Create "{lfSearch.trim()}" as a category
                        </button>
                      )}
                    </div>
                  )}

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
                    {lookingFor.filter((t) => !LF_CATEGORIES.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="settings-lf-chip selected settings-lf-custom"
                        onClick={() => toggleLf(tag)}
                      >
                        {tag} ×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-field">
                  <label>What's holding you back?</label>
                  <span className="settings-hint" style={{ marginBottom: 8 }}>Used to match you with people working through the same things</span>
                  <div className="settings-lf-chips">
                    {GROWTH_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        className={`settings-lf-chip${workingOn.includes(area) ? ' selected' : ''}`}
                        onClick={() => setWorkingOn((prev) =>
                          prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="settings-save-btn" disabled={savingProfile || egoStatus === 'taken'}>
                  {profileSaved ? '✓ Saved' : savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </section>
          )}

          {/* Password */}
          {/* Coach Profile */}
          {activeSection === 'coach' && profile?.account_type === 'Coach' && (
            <section className="settings-section">
              <h3 className="settings-section-title">Coach Profile</h3>
              <p className="settings-desc">This is what clients see when they browse the coach marketplace.</p>
              <form onSubmit={handleSaveCoach} className="settings-form">
                <div className="settings-field">
                  <label>Specialty</label>
                  <input type="text" className="settings-input" value={coachSpecialty} onChange={e => setCoachSpecialty(e.target.value)} placeholder="e.g. Fitness & Mindset, Financial Wellness" />
                </div>
                <div className="settings-field">
                  <label>Coach Tagline</label>
                  <input type="text" className="settings-input" value={coachTagline} onChange={e => setCoachTagline(e.target.value)} placeholder="e.g. Certified Executive & Fitness Coach" maxLength={100} />
                </div>
                <div className="settings-field-row">
                  <div className="settings-field">
                    <label>Hourly Rate (display)</label>
                    <input type="text" className="settings-input" value={coachRate} onChange={e => setCoachRate(e.target.value)} placeholder="e.g. $75/hr" />
                  </div>
                  <div className="settings-field">
                    <label>Rate (number only)</label>
                    <input type="number" className="settings-input" value={coachRateNum} onChange={e => setCoachRateNum(e.target.value)} placeholder="75" min={0} />
                  </div>
                </div>
                <div className="settings-field-row">
                  <div className="settings-field">
                    <label>Years of Experience</label>
                    <input type="text" className="settings-input" value={coachExperience} onChange={e => setCoachExperience(e.target.value)} placeholder="e.g. 5 years" />
                  </div>
                  <div className="settings-field">
                    <label>Clients Helped</label>
                    <input type="text" className="settings-input" value={coachClients} onChange={e => setCoachClients(e.target.value)} placeholder="e.g. 50+" />
                  </div>
                </div>
                <div className="settings-field">
                  <label>Session Types</label>
                  <div className="settings-radio-group">
                    {['virtual', 'in-person'].map(t => (
                      <label key={t} className={`settings-radio-option${coachSessionTypes.includes(t) ? ' selected' : ''}`}>
                        <input type="checkbox" checked={coachSessionTypes.includes(t)} onChange={() => setCoachSessionTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="settings-field">
                  <label>Bio</label>
                  <textarea className="settings-input" value={coachBio} onChange={e => setCoachBio(e.target.value)} rows={6} placeholder="Write your bio here. Separate paragraphs with a blank line." style={{ resize: 'vertical' }} />
                  <span className="settings-hint">Separate paragraphs with a blank line between them.</span>
                </div>
                <button type="submit" className="settings-save-btn" disabled={savingCoach}>
                  {coachSaved ? '✓ Saved' : savingCoach ? 'Saving...' : 'Save Coach Profile'}
                </button>
              </form>
            </section>
          )}

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

              {pushSupported ? (
                <div className="settings-push-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-title">Browser Push Notifications</div>
                    <div className="settings-toggle-desc">
                      {pushPermission === 'denied'
                        ? <>Notifications blocked in your browser. Go to your browser's site settings for actpar.com and allow notifications, then come back.</>
                        : pushError
                        ? <span style={{ color: '#ef4444' }}>{pushError}</span>
                        : 'Get notified even when the app is closed.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch${pushSubscribed ? ' on' : ''}`}
                    onClick={pushSubscribed ? unsubscribePush : subscribePush}
                    disabled={pushLoading || pushPermission === 'denied'}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              ) : (
                <div className="settings-push-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-title">Browser Push Notifications</div>
                    <div className="settings-toggle-desc" style={{ color: '#9ca3af' }}>
                      Not supported on this browser. Try Chrome or Edge on desktop, or make sure you're on HTTPS.
                    </div>
                  </div>
                </div>
              )}

              <div className="settings-toggles">
                {[
                  [notifDailyReminder, setNotifDailyReminder, 'Daily Check-In Reminder', 'Remind you to check in on your goals each day',
                    notifDailyReminder && (
                      <div className="settings-reminder-extras">
                        <div className="settings-reminder-time">
                          <label className="settings-reminder-label">Remind me at</label>
                          <select
                            className="settings-reminder-select"
                            value={notifReminderHour}
                            onChange={(e) => setNotifReminderHour(Number(e.target.value))}
                          >
                            {Array.from({ length: 24 }, (_, h) => {
                              const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
                              return <option key={h} value={h}>{label}</option>;
                            })}
                          </select>
                          <span className="settings-reminder-tz">(your local time)</span>
                        </div>
                      </div>
                    )
                  ],
                  [notifSparks, setNotifSparks, 'Spark Requests', 'When someone sends you a spark connection'],
                  [notifTribe, setNotifTribe, 'Tribe Community', 'New posts in the community feed'],
                ].map(([val, setter, title, desc, extra]) => (
                  <div key={title} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <div className="settings-toggle-title">{title}</div>
                      <div className="settings-toggle-desc">{desc}</div>
                      {extra}
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
