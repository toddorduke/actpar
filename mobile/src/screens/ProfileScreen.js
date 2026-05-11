import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const USER = {
  name: 'Alex Johnson',
  tagline: 'Building better habits, one day at a time',
  goals: [
    { id: 1, title: 'Morning Meditation', day: 45, priority: 1, progress: 50, partners: ['Sarah M.', 'Mike T.'] },
    { id: 2, title: 'Exercise Daily', day: 23, priority: 2, progress: 26, partners: [] },
    { id: 3, title: 'Read 30 Minutes', day: 67, priority: 3, progress: 74, partners: ['Emma L.'] },
    { id: 4, title: 'Healthy Eating', day: 12, priority: 4, progress: 13, partners: ['Sarah M.'] },
  ],
  tribe: [
    { id: 1, name: 'Sarah M.', status: 'online' },
    { id: 2, name: 'Mike T.', status: 'offline' },
    { id: 3, name: 'Emma L.', status: 'online' },
    { id: 4, name: 'Josh K.', status: 'offline' },
    { id: 5, name: 'Maya P.', status: 'online' },
  ],
};

const COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b'];

export default function ProfileScreen() {
  const [showCoach, setShowCoach] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.coverBg} />
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userTagline}>{USER.tagline}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('Edit Profile coming soon!')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[['4', 'Goals'], ['147', 'Total Days'], ['5', 'Tribe Members'], ['3', 'Pacts']].map(([n, l]) => (
            <View key={l} style={styles.statBox}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Goal Pyramid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Goal Pyramid</Text>
          {USER.goals.map((goal, i) => (
            <View key={goal.id} style={[styles.goalCard, { borderLeftColor: COLORS[i] }]}>
              <View style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalPriority}>Priority {goal.priority}</Text>
                  {goal.partners.length > 0 && <Text style={styles.goalPartners}>👥 {goal.partners.join(', ')}</Text>}
                </View>
                <View style={styles.dayBadge}>
                  <Text style={[styles.dayNum, { color: COLORS[i] }]}>{goal.day}</Text>
                  <Text style={styles.dayLbl}>days</Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: COLORS[i] }]} />
              </View>
              <Text style={styles.progressText}>{goal.progress}% to 90 days</Text>
            </View>
          ))}
        </View>

        {/* Accountability Tribe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Accountability Tribe</Text>
          <View style={styles.tribeRow}>
            {USER.tribe.map(member => (
              <TouchableOpacity key={member.id} style={styles.tribeChip} onPress={() => Alert.alert(member.name)}>
                <View style={styles.tribeAvatar}>
                  <View style={[styles.statusDot, { backgroundColor: member.status === 'online' ? '#10b981' : '#9ca3af' }]} />
                </View>
                <Text style={styles.tribeName}>{member.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photos</Text>
          <View style={styles.photosGrid}>
            {['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444'].map((color, i) => (
              <TouchableOpacity key={i} style={[styles.photoItem, { backgroundColor: color }]} onPress={() => Alert.alert(`Photo ${i + 1} clicked!`)} />
            ))}
          </View>
        </View>

        {/* Coach Section */}
        <TouchableOpacity style={styles.coachBanner} onPress={() => setShowCoach(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachBannerTitle}>🏆 Work with a Coach</Text>
            <Text style={styles.coachBannerSub}>Dr. Sarah Martinez • Executive Coach</Text>
          </View>
          <Text style={styles.coachArrow}>›</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Coach Modal */}
      <Modal visible={showCoach} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCoach(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Coach Profile</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.coachHeader}>
              <View style={styles.coachPhoto} />
              <View style={styles.coachVerified}><Text style={styles.coachVerifiedText}>✓ Certified</Text></View>
            </View>
            <Text style={styles.coachName}>Dr. Sarah Martinez</Text>
            <Text style={styles.coachTagline}>Certified Executive & Life Transformation Coach</Text>

            {[['🎯', 'Focus', 'Leadership, Burnout Recovery, Career Clarity'], ['⚡', 'Method', 'Neuroscience-based strategy'], ['📊', 'Results', '95% of clients report improved confidence in 3 months']].map(([icon, label, val]) => (
              <View key={label} style={styles.coachStat}>
                <Text style={styles.coachStatIcon}>{icon}</Text>
                <View>
                  <Text style={styles.coachStatLabel}>{label}</Text>
                  <Text style={styles.coachStatVal}>{val}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.bookBtn} onPress={() => Alert.alert('Booking Requested! 🎉', 'Dr. Martinez will contact you within 24 hours.')}>
              <Text style={styles.bookBtnText}>📅 Book Discovery Call</Text>
            </TouchableOpacity>

            <Text style={styles.coachSectionTitle}>About Me</Text>
            <Text style={styles.coachBio}>Hi, I'm Sarah! For the past decade, I've been on a mission to help high-achieving professionals break free from burnout and rediscover their purpose. I combine neuroscience-based strategies with mindfulness practices to help my clients achieve sustainable success.</Text>

            <Text style={styles.coachSectionTitle}>Services</Text>
            {[['1-on-1 Executive Coaching', '$350/session'], ['Group Coaching Program', '$197/month'], ['Intensive Breakthrough Session', '$500']].map(([title, price]) => (
              <TouchableOpacity key={title} style={styles.serviceRow} onPress={() => Alert.alert(title, `Starting at ${price}`)}>
                <Text style={styles.serviceTitle}>{title}</Text>
                <Text style={styles.servicePrice}>{price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { paddingBottom: 30 },

  profileHeader: { backgroundColor: '#fff', alignItems: 'center', paddingBottom: 20, marginBottom: 16, position: 'relative' },
  coverBg: { height: 100, width: '100%', backgroundColor: '#667eea' },
  avatarContainer: { marginTop: -40, marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f093fb', borderWidth: 4, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  userTagline: { fontSize: 14, color: '#6b7280', marginBottom: 14, textAlign: 'center', paddingHorizontal: 20 },
  editBtn: { borderWidth: 1.5, borderColor: '#667eea', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  editBtnText: { color: '#667eea', fontWeight: '600', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#667eea' },
  statLbl: { fontSize: 10, color: '#6b7280', marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },

  goalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 2 },
  goalPriority: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  goalPartners: { fontSize: 12, color: '#6b7280' },
  dayBadge: { alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 8, minWidth: 50 },
  dayNum: { fontSize: 20, fontWeight: 'bold' },
  dayLbl: { fontSize: 10, color: '#6b7280' },
  progressBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 10 },
  progressText: { fontSize: 11, color: '#6b7280' },

  tribeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tribeChip: { alignItems: 'center', width: 60 },
  tribeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#667eea', marginBottom: 4, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  tribeName: { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoItem: { width: '31%', aspectRatio: 1, borderRadius: 10 },

  coachBanner: { marginHorizontal: 16, backgroundColor: '#667eea', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  coachBannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  coachBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  coachArrow: { color: '#fff', fontSize: 28, fontWeight: '300' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalClose: { fontSize: 20, color: '#6b7280', fontWeight: '300' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  modalBody: { padding: 16 },

  coachHeader: { position: 'relative', marginBottom: 14 },
  coachPhoto: { width: '100%', height: 180, borderRadius: 14, backgroundColor: '#667eea' },
  coachVerified: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#10b981', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  coachVerifiedText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  coachName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  coachTagline: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
  coachStat: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 8 },
  coachStatIcon: { fontSize: 24, marginTop: 2 },
  coachStatLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  coachStatVal: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  bookBtn: { backgroundColor: '#667eea', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  coachSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  coachBio: { color: '#374151', lineHeight: 22, fontSize: 14, marginBottom: 20 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#667eea' },
  serviceTitle: { fontWeight: '600', color: '#1f2937', fontSize: 14, flex: 1 },
  servicePrice: { backgroundColor: '#667eea', color: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700' },
});
