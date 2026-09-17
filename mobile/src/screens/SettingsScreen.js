import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useProfile } from '@actpar/shared';
import { supabase } from '../lib/supabase';
import { useBlock } from '../hooks/useBlock';
import ConfirmModal from '../components/ConfirmModal';

// Mobile's answer to client/src/pages/Settings/SettingsPage.jsx -- not a
// full port (mobile has no browser-push toggle, no coach fields, no data
// export yet), just the pieces that were flat-out missing on mobile:
// notification prefs, blocked-user management, and account deletion.
// Delete Account and content moderation/reporting are launch requirements
// for both app stores (see CLAUDE.md-adjacent audit notes) -- this screen
// plus TribeScreen's report/block wiring is what closes that gap.
export default function SettingsScreen({ navigation }) {
  const { session, signOut } = useContext(AuthContext);
  const userId = session?.user?.id;
  const { profile, loading, updateProfile } = useProfile(userId);
  const { blockedProfiles, loading: blockedLoading, unblockUser } = useBlock();

  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifReminderHour, setNotifReminderHour] = useState(8);
  const [notifSparks, setNotifSparks] = useState(true);
  const [notifPact, setNotifPact] = useState(true);
  const [notifTribe, setNotifTribe] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmUnblock, setConfirmUnblock] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const prefs = profile.notification_prefs ?? {};
    setNotifDailyReminder(prefs.daily_reminder ?? true);
    setNotifReminderHour(prefs.reminder_hour ?? 8);
    setNotifSparks(prefs.sparks ?? true);
    setNotifPact(prefs.pact ?? true);
    setNotifTribe(prefs.tribe ?? false);
  }, [profile]);

  async function savePrefs(next) {
    setSavingPrefs(true);
    await updateProfile({
      notification_prefs: {
        ...(profile?.notification_prefs ?? {}),
        daily_reminder: notifDailyReminder,
        reminder_hour: notifReminderHour,
        sparks: notifSparks,
        pact: notifPact,
        tribe: notifTribe,
        ...next,
      },
    });
    setSavingPrefs(false);
  }

  function toggle(setter, key, current) {
    const next = !current;
    setter(next);
    savePrefs({ [key]: next });
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      setDeleting(false);
      setDeleteError(error.message);
      return;
    }
    signOut();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#FF7A00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notification Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Daily Check-In Reminder</Text>
              <Text style={styles.toggleDesc}>Remind you to check in on your goals each day</Text>
            </View>
            <Switch value={notifDailyReminder} onValueChange={() => toggle(setNotifDailyReminder, 'daily_reminder', notifDailyReminder)} />
          </View>
          {notifDailyReminder && (
            <View style={styles.hourRow}>
              <Text style={styles.hourLabel}>Remind me at</Text>
              <View style={styles.hourPicker}>
                {[6, 8, 12, 17, 20].map((h) => {
                  const label = h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.hourChip, notifReminderHour === h && styles.hourChipActive]}
                      onPress={() => { setNotifReminderHour(h); savePrefs({ reminder_hour: h }); }}
                    >
                      <Text style={[styles.hourChipText, notifReminderHour === h && styles.hourChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Spark Requests</Text>
              <Text style={styles.toggleDesc}>When someone sends you a spark connection</Text>
            </View>
            <Switch value={notifSparks} onValueChange={() => toggle(setNotifSparks, 'sparks', notifSparks)} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Pact Activity</Text>
              <Text style={styles.toggleDesc}>Updates from your accountability pact</Text>
            </View>
            <Switch value={notifPact} onValueChange={() => toggle(setNotifPact, 'pact', notifPact)} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Tribe Community</Text>
              <Text style={styles.toggleDesc}>New posts in the community feed</Text>
            </View>
            <Switch value={notifTribe} onValueChange={() => toggle(setNotifTribe, 'tribe', notifTribe)} />
          </View>

          {savingPrefs && <Text style={styles.savingHint}>Saving…</Text>}
        </View>

        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 Blocked Users</Text>
          {blockedLoading ? (
            <ActivityIndicator color="#FF7A00" />
          ) : blockedProfiles.length === 0 ? (
            <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
          ) : (
            blockedProfiles.map((p) => (
              <View key={p.id} style={styles.blockedRow}>
                <Text style={styles.blockedName}>
                  {p.alter_ego_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Someone'}
                </Text>
                <TouchableOpacity style={styles.unblockBtn} onPress={() => setConfirmUnblock(p)}>
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Delete Account */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={styles.dangerTitle}>Delete Account</Text>
          <Text style={styles.dangerDesc}>
            Permanently delete your account and all associated data — goals, posts, connections. This cannot be undone.
          </Text>
          <Text style={styles.deleteLabel}>Type DELETE to confirm:</Text>
          <TextInput
            style={styles.deleteInput}
            placeholder="DELETE"
            placeholderTextColor="#9ca3af"
            value={deleteInput}
            onChangeText={setDeleteInput}
            autoCapitalize="characters"
          />
          {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
          <TouchableOpacity
            style={[styles.deleteBtn, (deleteInput !== 'DELETE' || deleting) && styles.deleteBtnDisabled]}
            disabled={deleteInput !== 'DELETE' || deleting}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Permanently Delete Account'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <ConfirmModal
        visible={!!confirmUnblock}
        title={`Unblock ${confirmUnblock?.alter_ego_name || confirmUnblock?.first_name || 'this user'}?`}
        message="They'll be able to see your posts and contact you again."
        confirmLabel="Unblock"
        onConfirm={async () => {
          const target = confirmUnblock;
          setConfirmUnblock(null);
          await unblockUser(target.id);
        }}
        onCancel={() => setConfirmUnblock(null)}
      />
    </SafeAreaView>
  );
}

// react-native's built-in Switch pulls in extra native-module wiring on some
// RN versions when imported at the top with everything else destructured
// from 'react-native' in one line elsewhere in this codebase's other
// screens -- imported directly here to keep this screen self-contained.
function Switch({ value, onValueChange }) {
  return (
    <TouchableOpacity
      style={[toggleStyles.track, value && toggleStyles.trackOn]}
      onPress={onValueChange}
      activeOpacity={0.8}
    >
      <View style={[toggleStyles.knob, value && toggleStyles.knobOn]} />
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  track: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#e5e7eb', padding: 3, justifyContent: 'center' },
  trackOn: { backgroundColor: '#FF7A00' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  knobOn: { transform: [{ translateX: 20 }] },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  scroll: { padding: 16, paddingBottom: 40 },

  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2B1D14', marginBottom: 12 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#2B1D14' },
  toggleDesc: { fontSize: 12, color: '#7A6F63', marginTop: 2 },
  savingHint: { fontSize: 12, color: '#7A6F63', marginTop: 8, fontStyle: 'italic' },

  hourRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  hourLabel: { fontSize: 13, fontWeight: '600', color: '#7A6F63', marginBottom: 8 },
  hourPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb' },
  hourChipActive: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  hourChipText: { fontSize: 12, fontWeight: '600', color: '#7A6F63' },
  hourChipTextActive: { color: '#fff' },

  emptyText: { fontSize: 13, color: '#7A6F63' },
  blockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  blockedName: { fontSize: 14, color: '#2B1D14', fontWeight: '500' },
  unblockBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,122,0,0.1)' },
  unblockText: { color: '#FF7A00', fontWeight: '700', fontSize: 12 },

  dangerSection: { borderWidth: 1.5, borderColor: 'rgba(220,38,38,0.25)' },
  dangerTitle: { fontSize: 16, fontWeight: '800', color: '#dc2626', marginBottom: 8 },
  dangerDesc: { fontSize: 13, color: '#7A6F63', lineHeight: 19, marginBottom: 14 },
  deleteLabel: { fontSize: 13, fontWeight: '600', color: '#2B1D14', marginBottom: 6 },
  deleteInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#2B1D14', marginBottom: 8 },
  deleteError: { color: '#dc2626', fontSize: 12, marginBottom: 8 },
  deleteBtn: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
