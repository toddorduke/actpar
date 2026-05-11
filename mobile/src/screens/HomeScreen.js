import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOALS = [
  { id: 1, title: 'Morning Meditation', days: 45, priority: 1, progress: 50, partners: ['Sarah M.', 'Mike T.'] },
  { id: 2, title: 'Exercise Daily', days: 23, priority: 2, progress: 26, partners: [] },
  { id: 3, title: 'Read 30 Minutes', days: 67, priority: 3, progress: 74, partners: ['Emma L.'] },
  { id: 4, title: 'Healthy Eating', days: 12, priority: 4, progress: 13, partners: ['Sarah M.'] },
];

const COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b'];

function GoalCard({ goal, color }) {
  return (
    <View style={[styles.goalCard, { borderLeftColor: color }]}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>{goal.days}</Text>
          <Text style={styles.dayLabel}>days</Text>
        </View>
      </View>
      <Text style={styles.priorityLabel}>Priority {goal.priority}</Text>
      {goal.partners.length > 0 && (
        <Text style={styles.partners}>👥 {goal.partners.join(', ')}</Text>
      )}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${goal.progress}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressText}>{goal.progress}% to 90 days</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [newGoal, setNewGoal] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Welcome Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerGreeting}>Good morning, Alex 👋</Text>
          <Text style={styles.bannerSub}>You're on a 45-day streak. Keep going!</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[['4', 'Active Goals'], ['147', 'Total Days'], ['3', 'Partners']].map(([num, label]) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Goal Pyramid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Goal Pyramid</Text>
            <TouchableOpacity onPress={() => setShowInput(!showInput)}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {showInput && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="New goal name..."
                value={newGoal}
                onChangeText={setNewGoal}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={styles.inputBtn} onPress={() => { setNewGoal(''); setShowInput(false); }}>
                <Text style={styles.inputBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {GOALS.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} color={COLORS[i]} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[['📊', 'Log Progress'], ['👥', 'Find Partner'], ['🔐', 'View Pact'], ['🏆', 'Leaderboard']].map(([icon, label]) => (
              <TouchableOpacity key={label} style={styles.actionCard}>
                <Text style={styles.actionIcon}>{icon}</Text>
                <Text style={styles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Check-In */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Today's Check-In</Text>
          {GOALS.map((goal, i) => (
            <View key={goal.id} style={styles.checkInRow}>
              <View style={[styles.checkCircle, { borderColor: COLORS[i] }]}>
                <Text style={{ color: COLORS[i], fontWeight: 'bold' }}>✓</Text>
              </View>
              <Text style={styles.checkLabel}>{goal.title}</Text>
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

  banner: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  bannerGreeting: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#667eea' },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  addBtn: { color: '#667eea', fontWeight: '600', fontSize: 15 },

  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#667eea', fontSize: 15, color: '#1f2937' },
  inputBtn: { backgroundColor: '#667eea', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  inputBtnText: { color: '#fff', fontWeight: '700' },

  goalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', flex: 1 },
  dayBadge: { alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 6, minWidth: 48 },
  dayNumber: { fontSize: 18, fontWeight: 'bold', color: '#667eea' },
  dayLabel: { fontSize: 10, color: '#6b7280' },
  priorityLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  partners: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', borderRadius: 10 },
  progressText: { fontSize: 12, color: '#6b7280' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  checkInRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkLabel: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
});
