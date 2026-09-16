import React, { useContext, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useGoalsV2 } from '../hooks/useGoalsV2';
import { useConnectionsV2 } from '../hooks/useConnectionsV2';
import { useProfileV2 } from '../hooks/useProfileV2';

const COLORS = ['#FF7A00', '#E06400', '#10b981', '#1E3A5F'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;

  const { profile } = useProfileV2(userId);
  const { goals, loading: goalsLoading } = useGoalsV2(userId);
  const { acceptedConnections } = useConnectionsV2(userId);

  const habitGoals = useMemo(() => goals.filter((g) => g.goal_type !== 'numeric'), [goals]);
  const today = todayStr();
  const checkedInToday = habitGoals.filter((g) => g.last_checked_in === today);
  const bestStreak = goals.reduce((max, g) => Math.max(max, g.day_count ?? 0), 0);
  const greetingName = profile?.alter_ego_name || profile?.first_name || 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (goalsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#FF7A00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.banner}>
          <Text style={styles.bannerGreeting}>{greeting}, {greetingName} 👋</Text>
          <Text style={styles.bannerSub}>
            {bestStreak > 0 ? `Your best streak is ${bestStreak} days. Keep going!` : 'Ready to start your first streak today?'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          {[
            [String(goals.length), 'Active Goals'],
            [String(bestStreak), 'Best Streak'],
            [String(acceptedConnections.length), 'Partners'],
          ].map(([num, label]) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              ['📊', 'My Goals', 'Goals'],
              ['👥', 'Find Partner', 'Connections'],
              ['🔐', 'View Pact', 'Pact'],
              ['🌍', 'Tribe', 'Tribe'],
            ].map(([icon, label, screen]) => (
              <TouchableOpacity key={label} style={styles.actionCard} onPress={() => navigation.navigate(screen)}>
                <Text style={styles.actionIcon}>{icon}</Text>
                <Text style={styles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Today's Check-In</Text>
            <Text style={styles.progressCount}>{checkedInToday.length}/{habitGoals.length}</Text>
          </View>
          {habitGoals.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.emptyText}>No goals yet — tap to add your first one.</Text>
            </TouchableOpacity>
          ) : (
            habitGoals.map((goal, i) => {
              const done = goal.last_checked_in === today;
              return (
                <TouchableOpacity key={goal.id} style={styles.checkInRow} onPress={() => navigation.navigate('Goals')}>
                  <View style={[styles.checkCircle, { borderColor: COLORS[i % COLORS.length], backgroundColor: done ? COLORS[i % COLORS.length] : 'transparent' }]}>
                    {done && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkLabel}>{goal.title}</Text>
                    <Text style={styles.checkStreak}>{goal.day_count ?? 0} day streak</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  scroll: { padding: 16, paddingBottom: 30 },

  banner: { backgroundColor: '#FF7A00', borderRadius: 16, padding: 20, marginBottom: 16 },
  bannerGreeting: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#FF7A00' },
  statLbl: { fontSize: 11, color: '#7A6F63', marginTop: 2, textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2B1D14', marginBottom: 12 },
  progressCount: { fontSize: 14, fontWeight: '700', color: '#FF7A00' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { color: '#7A6F63', fontSize: 14 },

  checkInRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkLabel: { fontSize: 15, color: '#2B1D14', fontWeight: '500' },
  checkStreak: { fontSize: 12, color: '#7A6F63', marginTop: 2 },
});
