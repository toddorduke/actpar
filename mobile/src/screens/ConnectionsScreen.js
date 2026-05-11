import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROFILES = [
  { id: 1, name: 'Jordan Lee', alterEgo: 'The Phoenix', goals: ['Morning Runs', 'Mindfulness'], category: 'fitness' },
  { id: 2, name: 'Taylor Kim', alterEgo: 'The Strategist', goals: ['Career Growth', 'Leadership'], category: 'career' },
  { id: 3, name: 'Morgan Davis', alterEgo: 'The Sage', goals: ['Meditation', 'Journaling'], category: 'mindfulness' },
  { id: 4, name: 'Alex Rivera', alterEgo: 'The Creator', goals: ['Photography', 'Writing'], category: 'creativity' },
  { id: 5, name: 'Sam Chen', alterEgo: 'The Warrior', goals: ['Weight Training', 'Nutrition'], category: 'fitness' },
];

const SPARKS = [
  { id: 1, name: 'Casey Park', alterEgo: 'The Visionary' },
  { id: 2, name: 'Riley Torres', alterEgo: 'The Builder' },
];

const BG_COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];

export default function ConnectionsScreen() {
  const [profiles, setProfiles] = useState(PROFILES);
  const [sparks, setSparks] = useState(SPARKS);

  const current = profiles[0];

  function skip() { setProfiles(p => p.slice(1)); }
  function connect() { Alert.alert('Connected! 🎉', `You are now connected with ${current?.name}`); setProfiles(p => p.slice(1)); }
  function spark() { Alert.alert('Spark Sent! ⚡', `${current?.name} will be notified.`); setProfiles(p => p.slice(1)); }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Sparks Received */}
        {sparks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Sparks Received ({sparks.length})</Text>
            {sparks.map(s => (
              <View key={s.id} style={styles.sparkRow}>
                <View style={styles.sparkAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sparkName}>{s.name}</Text>
                  <Text style={styles.sparkEgo}>{s.alterEgo}</Text>
                </View>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => { Alert.alert('Connected!'); setSparks(p => p.filter(x => x.id !== s.id)); }}>
                  <Text style={styles.acceptText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => setSparks(p => p.filter(x => x.id !== s.id))}>
                  <Text style={styles.declineText}>✗</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Find Your Tribe</Text>
          {profiles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>You've seen everyone!</Text>
              <Text style={styles.emptySub}>Check back later for new connections.</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setProfiles(PROFILES)}>
                <Text style={styles.resetText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={[styles.cardTop, { backgroundColor: BG_COLORS[profiles.length % BG_COLORS.length] }]}>
                <View style={styles.cardAvatar} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{current.name}</Text>
                <Text style={styles.cardEgo}>{current.alterEgo}</Text>
                <Text style={styles.tagsLabel}>GOALS</Text>
                <View style={styles.tags}>
                  {current.goals.map(g => (
                    <View key={g} style={styles.tag}>
                      <Text style={styles.tagText}>{g}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={skip}>
                  <Text style={styles.skipIcon}>✗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.sparkBtn]} onPress={spark}>
                  <Text style={styles.sparkIcon}>⚡</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.connectBtn]} onPress={connect}>
                  <Text style={styles.connectIcon}>✓</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>✓ Connect  •  ✗ Skip  •  ⚡ Spark</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>
          <View style={styles.statsRow}>
            {[['12', 'Connections'], ['34', 'Viewed'], ['8', 'Matches']].map(([n, l]) => (
              <View key={l} style={styles.statBox}>
                <Text style={styles.statNum}>{n}</Text>
                <Text style={styles.statLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Connection Tips</Text>
          {['Be genuine in your profile', 'Send sparks to show extra interest', 'Focus on aligned goals', 'Start conversations meaningfully'].map(tip => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { padding: 16, paddingBottom: 30 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },

  sparkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#fbbf24' },
  sparkAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f59e0b', marginRight: 12 },
  sparkName: { fontWeight: '700', color: '#1f2937', fontSize: 15 },
  sparkEgo: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  declineBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  declineText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  cardTop: { height: 200, alignItems: 'center', justifyContent: 'center' },
  cardAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 4, borderColor: '#fff' },
  cardBody: { padding: 20 },
  cardName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  cardEgo: { fontSize: 16, color: '#667eea', fontWeight: '600', marginBottom: 14 },
  tagsLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: 'rgba(102,126,234,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(102,126,234,0.3)' },
  tagText: { color: '#667eea', fontWeight: '600', fontSize: 13 },

  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, padding: 20, paddingTop: 10 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  skipBtn: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#ef4444' },
  skipIcon: { color: '#ef4444', fontSize: 24, fontWeight: 'bold' },
  sparkBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f59e0b' },
  sparkIcon: { fontSize: 28 },
  connectBtn: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#10b981' },
  connectIcon: { color: '#10b981', fontSize: 24, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#9ca3af', fontSize: 12, paddingBottom: 16 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  emptySub: { color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  resetBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  resetText: { color: '#fff', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#667eea' },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  tipRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  tipText: { color: '#374151', fontSize: 14 },
});
