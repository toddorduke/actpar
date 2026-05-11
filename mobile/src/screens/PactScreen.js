import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MEMBERS = [
  { id: 1, name: 'Sarah Martinez', role: 'Founder', badge: '👑' },
  { id: 2, name: 'Mike Thompson', role: 'Member', badge: '' },
  { id: 3, name: 'Emma Lewis', role: 'Member', badge: '' },
  { id: 4, name: 'Josh Kim', role: 'Co-Lead', badge: '⭐' },
  { id: 5, name: 'Maya Patel', role: 'Member', badge: '' },
  { id: 6, name: 'Alex Rodriguez', role: 'Member', badge: '' },
];

const INITIAL_POSTS = [
  { id: 1, type: 'win', author: 'Sarah Martinez', time: '2h ago', content: 'Hit my 60-day streak today! The Phoenix Circle has been everything. 🔥', likes: 12, comments: 5 },
  { id: 2, type: 'update', author: 'Mike Thompson', time: '5h ago', content: 'Week 3: Completed 5/7 morning runs. Still improving!', likes: 8, comments: 7 },
  { id: 3, type: 'challenge', author: 'Josh Kim', time: '1d ago', content: "7-day 5AM challenge — who's in? 💪", likes: 15, comments: 9 },
  { id: 4, type: 'win', author: 'Alex Rodriguez', time: '3d ago', content: 'Got the promotion I worked towards! Thank you all! 🎉', likes: 20, comments: 14 },
];

const BADGE_STYLE = {
  update: ['rgba(59,130,246,0.15)', '#1d4ed8', '📊 Update'],
  win: ['rgba(16,185,129,0.15)', '#065f46', '🎉 Win'],
  challenge: ['rgba(239,68,68,0.15)', '#991b1b', '💪 Challenge'],
  event: ['rgba(245,158,11,0.15)', '#92400e', '📅 Event'],
};

export default function PactScreen() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [feedFilter, setFeedFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [postType, setPostType] = useState('update');
  const [content, setContent] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const filtered = feedFilter === 'all' ? posts : posts.filter(p =>
    feedFilter === 'wins' ? p.type === 'win' :
    feedFilter === 'updates' ? p.type === 'update' : p.type === 'challenge'
  );

  function handleLike(id) { setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p)); }

  function submitPost() {
    if (!content.trim()) { Alert.alert('Write something first!'); return; }
    setPosts(prev => [{ id: Date.now(), type: postType, author: 'You', time: 'Just now', content, likes: 0, comments: 0 }, ...prev]);
    setShowPost(false); setContent('');
    Alert.alert('Shared with The Pact! 🔥');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Pact Header */}
        <View style={styles.pactHeader}>
          <Text style={styles.pactIcon}>🔐</Text>
          <View style={styles.inviteBadge}><Text style={styles.inviteBadgeText}>⭐ Invite Only</Text></View>
          <Text style={styles.pactName}>The Phoenix Circle</Text>
          <Text style={styles.pactDesc}>An elite accountability group for ambitious goal-crushers</Text>
          <View style={styles.pactStats}>
            {[['8', 'Members'], ['Jan 2025', 'Created'], [String(posts.length), 'Posts']].map(([n, l]) => (
              <View key={l} style={styles.pactStat}>
                <Text style={styles.pactStatNum}>{n}</Text>
                <Text style={styles.pactStatLbl}>{l}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
            <Text style={styles.inviteBtnText}>+ Invite Member</Text>
          </TouchableOpacity>
        </View>

        {/* Current Challenge */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>⚡ Current Challenge</Text>
          <Text style={styles.challengeName}>30-Day Consistency Sprint</Text>
          <Text style={styles.challengeDesc}>Complete daily goal actions for 30 consecutive days</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressLabel}>Day 18 of 30 • 6 of 8 members active today</Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Pact Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MEMBERS.map(m => (
              <TouchableOpacity key={m.id} style={styles.memberChip} onPress={() => Alert.alert(m.name, m.role)}>
                <View style={styles.memberAvatar}>
                  {m.badge ? <Text style={styles.memberBadge}>{m.badge}</Text> : null}
                </View>
                <Text style={styles.memberName}>{m.name.split(' ')[0]}</Text>
                <Text style={styles.memberRole}>{m.role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Feed */}
        <View style={styles.section}>
          <View style={styles.feedHeader}>
            <TouchableOpacity style={styles.createPostBtn} onPress={() => setShowPost(true)}>
              <Text style={styles.createPostText}>+ Create Post</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {[['all', 'All'], ['updates', 'Updates'], ['wins', 'Wins'], ['challenges', 'Challenges']].map(([val, label]) => (
              <TouchableOpacity key={val} style={[styles.filterTab, feedFilter === val && styles.filterTabActive]} onPress={() => setFeedFilter(val)}>
                <Text style={[styles.filterTabText, feedFilter === val && styles.filterTabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filtered.map(post => {
            const [bg, color, label] = BADGE_STYLE[post.type] || BADGE_STYLE.update;
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                  <View style={[styles.postBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.postBadgeText, { color }]}>{label}</Text>
                  </View>
                </View>
                <Text style={styles.postText}>{post.content}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.postAction}>
                    <Text style={styles.postActionText}>❤️ {post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Coming soon!')} style={styles.postAction}>
                    <Text style={styles.postActionText}>💬 {post.comments}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Pact Rules</Text>
          {['Post weekly progress updates', 'Support fellow members', 'Be honest and accountable', "Respect privacy — what's shared here stays here"].map((rule, i) => (
            <View key={i} style={styles.ruleItem}>
              <Text style={styles.ruleText}>{i + 1}. {rule}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showPost} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPost(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Share with The Pact</Text>
            <TouchableOpacity onPress={submitPost}><Text style={styles.modalAction}>Post</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {[['update', '📊 Update'], ['win', '🎉 Win'], ['challenge', '💪 Challenge']].map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeBtn, postType === val && styles.typeBtnActive]} onPress={() => setPostType(val)}>
                  <Text style={[styles.typeBtnText, postType === val && styles.typeBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput style={styles.textarea} multiline numberOfLines={6} placeholder="What's happening with your goals?" value={content} onChangeText={setContent} placeholderTextColor="#9ca3af" textAlignVertical="top" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInvite(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <TouchableOpacity onPress={() => { if (!inviteEmail) { Alert.alert('Enter an email'); return; } Alert.alert('Invitation Sent! 🎉', `Invite sent to ${inviteEmail}`); setShowInvite(false); setInviteEmail(''); }}><Text style={styles.modalAction}>Send</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput style={styles.inputField} placeholder="friend@example.com" value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 16, paddingBottom: 30 },

  pactHeader: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 16, alignItems: 'flex-start' },
  pactIcon: { fontSize: 48, marginBottom: 10 },
  inviteBadge: { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#f59e0b', marginBottom: 10 },
  inviteBadgeText: { color: '#fbbf24', fontWeight: '600', fontSize: 13 },
  pactName: { fontSize: 26, fontWeight: 'bold', color: '#fbbf24', marginBottom: 6 },
  pactDesc: { color: '#9ca3af', fontSize: 14, marginBottom: 16 },
  pactStats: { flexDirection: 'row', gap: 30, marginBottom: 16 },
  pactStat: { alignItems: 'center' },
  pactStatNum: { fontSize: 22, fontWeight: 'bold', color: '#fbbf24' },
  pactStatLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  inviteBtn: { backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  inviteBtnText: { color: '#1a1a2e', fontWeight: '700', fontSize: 15 },

  challengeCard: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 16 },
  challengeTitle: { color: '#fbbf24', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  challengeName: { color: '#fbbf24', fontWeight: 'bold', fontSize: 17, marginBottom: 4 },
  challengeDesc: { color: '#9ca3af', fontSize: 13, marginBottom: 12 },
  progressBg: { height: 10, backgroundColor: 'rgba(26,26,46,0.5)', borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 10 },
  progressLabel: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#fbbf24', marginBottom: 12 },

  memberChip: { alignItems: 'center', marginRight: 14, width: 70 },
  memberAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f59e0b', marginBottom: 6, justifyContent: 'center', alignItems: 'center' },
  memberBadge: { fontSize: 18 },
  memberName: { color: '#e0e0e0', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  memberRole: { color: '#6b7280', fontSize: 10, textAlign: 'center' },

  feedHeader: { marginBottom: 12 },
  createPostBtn: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 14, alignItems: 'center' },
  createPostText: { color: '#1a1a2e', fontWeight: '700', fontSize: 16 },

  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginRight: 8 },
  filterTabActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  filterTabText: { color: '#9ca3af', fontWeight: '600', fontSize: 13 },
  filterTabTextActive: { color: '#1a1a2e' },

  postCard: { backgroundColor: 'rgba(26,26,46,0.6)', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f59e0b', marginRight: 10 },
  postAuthor: { fontWeight: '700', color: '#e0e0e0', fontSize: 14 },
  postTime: { fontSize: 12, color: '#6b7280' },
  postBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  postBadgeText: { fontSize: 11, fontWeight: '700' },
  postText: { color: '#d1d5db', fontSize: 14, lineHeight: 21, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(245,158,11,0.1)' },
  postAction: {},
  postActionText: { color: '#9ca3af', fontSize: 14 },

  ruleItem: { backgroundColor: 'rgba(26,26,46,0.5)', borderLeftWidth: 3, borderLeftColor: '#f59e0b', borderRadius: 8, padding: 12, marginBottom: 8 },
  ruleText: { color: '#d1d5db', fontSize: 14 },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalCancel: { color: '#6b7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  modalAction: { color: '#667eea', fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  typeBtnActive: { borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.08)' },
  typeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
  typeBtnTextActive: { color: '#667eea' },
  textarea: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', minHeight: 140 },
  inputField: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937' },
});
