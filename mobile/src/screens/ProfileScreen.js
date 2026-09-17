import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useGoalsV2 } from '../hooks/useGoalsV2';
import { useProfile, useConnections, getDisplayName } from '@actpar/shared';
import ConfirmModal from '../components/ConfirmModal';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { session, signOut } = useContext(AuthContext);
  const userId = session?.user?.id;

  const { profile, loading } = useProfile(userId);
  const { goals } = useGoalsV2(userId);
  const { acceptedConnections } = useConnections(userId);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const bestStreak = goals.reduce((max, g) => Math.max(max, g.day_count ?? 0), 0);

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

        <View style={styles.profileHeader}>
          <View style={styles.coverBg} />
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{getDisplayName(profile, 'You')}</Text>
          {profile?.tagline ? <Text style={styles.userTagline}>{profile.tagline}</Text> : null}
          {profile?.city ? <Text style={styles.userCity}>📍 {profile.city}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          {[
            [String(goals.length), 'Goals'],
            [String(bestStreak), 'Best Streak'],
            [String(acceptedConnections.length), 'Connections'],
          ].map(([n, l]) => (
            <View key={l} style={styles.statBox}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Accountability Tribe</Text>
          {acceptedConnections.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('Connections')}>
              <Text style={styles.emptyText}>No connections yet — tap to find your people.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.tribeRow}>
              {acceptedConnections.map((c) => (
                <View key={c.partnerId} style={styles.tribeChip}>
                  <View style={styles.tribeAvatar} />
                  <Text style={styles.tribeName} numberOfLines={1}>{getDisplayName(c.partnerProfile, 'Partner').split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Active Goals</Text>
          {goals.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.emptyText}>No goals yet — tap to add one.</Text>
            </TouchableOpacity>
          ) : (
            goals.slice(0, 4).map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.goalDays}>{g.day_count ?? 0}d</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsText}>⚙️ Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={() => setConfirmSignOut(true)}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll need to log back in to continue."
        confirmLabel="Sign Out"
        destructive
        onConfirm={() => { setConfirmSignOut(false); signOut(); }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  scroll: { paddingBottom: 30 },

  profileHeader: { backgroundColor: '#fff', alignItems: 'center', paddingBottom: 20, marginBottom: 16 },
  coverBg: { height: 100, width: '100%', backgroundColor: '#FF7A00' },
  avatarContainer: { marginTop: -40, marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFA64D', borderWidth: 4, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#2B1D14', marginBottom: 4 },
  userTagline: { fontSize: 14, color: '#7A6F63', marginBottom: 4, textAlign: 'center', paddingHorizontal: 20 },
  userCity: { fontSize: 13, color: '#7A6F63' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#FF7A00' },
  statLbl: { fontSize: 10, color: '#7A6F63', marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2B1D14', marginBottom: 12 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { color: '#7A6F63', fontSize: 14, textAlign: 'center' },

  tribeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tribeChip: { alignItems: 'center', width: 60 },
  tribeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF7A00', marginBottom: 4 },
  tribeName: { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' },

  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  goalTitle: { fontSize: 14, color: '#2B1D14', fontWeight: '500', flex: 1 },
  goalDays: { fontSize: 14, fontWeight: '700', color: '#FF7A00' },

  settingsBtn: { marginHorizontal: 16, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 4 },
  settingsText: { color: '#2B1D14', fontWeight: '600', fontSize: 14 },

  signOutBtn: { marginHorizontal: 16, alignItems: 'center', padding: 14 },
  signOutText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
});
