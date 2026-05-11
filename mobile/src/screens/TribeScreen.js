import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_POSTS = [
  { id: 1, type: 'achievement', author: 'Sarah Martinez', time: '2h ago', content: 'I just completed my 60-day meditation streak! 🧘‍♀️', milestone: '60-Day Streak', likes: 47, comments: 12 },
  { id: 2, type: 'meetup', author: 'Mike Thompson', time: '4h ago', content: "Let's get moving! Looking for morning run partners.", meetup: { title: 'Morning Run Group', date: 'Nov 2', time: '6:00 AM', location: 'Central Park' }, likes: 23, comments: 8, attending: 5 },
  { id: 3, type: 'general', author: 'Emma Lewis', time: '6h ago', content: 'Anyone struggling with weekend consistency? Would love tips! 💪', likes: 34, comments: 19 },
  { id: 4, type: 'achievement', author: 'Josh Kim', time: '1d ago', content: 'Hit my weight loss goal! Down 25 pounds in 3 months. 🎉', milestone: '25 Pounds Lost', likes: 89, comments: 31 },
];

const BADGE = { achievement: ['#d1fae5', '#065f46', '🏆 Achievement'], meetup: ['#fef3c7', '#92400e', '📅 Meetup'], general: ['#dbeafe', '#1e40af', '💬 General'] };

function PostCard({ post, onLike, onJoin }) {
  const [bg, text, label] = BADGE[post.type] || BADGE.general;
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.author}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        <View style={[styles.postBadge, { backgroundColor: bg }]}>
          <Text style={[styles.postBadgeText, { color: text }]}>{label}</Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.content}</Text>

      {post.type === 'achievement' && post.milestone && (
        <View style={styles.milestone}>
          <Text style={styles.milestoneText}>🏆 {post.milestone}</Text>
        </View>
      )}

      {post.type === 'meetup' && post.meetup && (
        <View style={styles.meetupBox}>
          <Text style={styles.meetupTitle}>{post.meetup.title}</Text>
          <Text style={styles.meetupDetail}>📅 {post.meetup.date} at {post.meetup.time}</Text>
          <Text style={styles.meetupDetail}>📍 {post.meetup.location}</Text>
          {post.attending !== undefined && <Text style={styles.meetupDetail}>👥 {post.attending} attending</Text>}
          <TouchableOpacity style={styles.joinBtn} onPress={() => onJoin(post.id)}>
            <Text style={styles.joinBtnText}>Join Meetup</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={() => onLike(post.id)}>
          <Text style={styles.postActionText}>❤️ {post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => Alert.alert('Comments coming soon!')}>
          <Text style={styles.postActionText}>💬 {post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => Alert.alert('Shared!')}>
          <Text style={styles.postActionText}>↗️ Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TribeScreen() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState('general');
  const [content, setContent] = useState('');

  const filtered = filter === 'all' ? posts : posts.filter(p =>
    filter === 'achievements' ? p.type === 'achievement' :
    filter === 'meetups' ? p.type === 'meetup' : p.type === 'general'
  );

  function handleLike(id) { setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p)); }
  function handleJoin(id) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, attending: (p.attending || 0) + 1 } : p));
    const post = posts.find(p => p.id === id);
    if (post?.meetup) Alert.alert('Joined!', `You're attending ${post.meetup.title}`);
  }

  function submitPost() {
    if (!content.trim()) { Alert.alert('Please write something!'); return; }
    setPosts(prev => [{ id: Date.now(), type: postType, author: 'You', time: 'Just now', content, likes: 0, comments: 0 }, ...prev]);
    setShowModal(false);
    setContent('');
    Alert.alert('Posted! 🎉');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          {[['1,247', 'Members'], ['342', 'Active'], ['523', 'Posts Today']].map(([n, l]) => (
            <View key={l} style={styles.statBox}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Create Post Button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.createBtnText}>+ Create Post</Text>
        </TouchableOpacity>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[['all', 'All Posts'], ['achievements', '🏆 Achievements'], ['meetups', '📅 Meetups'], ['general', '💬 General']].map(([val, label]) => (
            <TouchableOpacity key={val} style={[styles.filterTab, filter === val && styles.filterTabActive]} onPress={() => setFilter(val)}>
              <Text style={[styles.filterTabText, filter === val && styles.filterTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed */}
        {filtered.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onJoin={handleJoin} />)}

      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={submitPost}>
              <Text style={styles.modalPost}>Post</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Post Type</Text>
            <View style={styles.typeRow}>
              {[['general', '💬 General'], ['achievement', '🏆 Achievement'], ['meetup', '📅 Meetup']].map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeBtn, postType === val && styles.typeBtnActive]} onPress={() => setPostType(val)}>
                  <Text style={[styles.typeBtnText, postType === val && styles.typeBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>What's on your mind?</Text>
            <TextInput
              style={styles.textarea}
              multiline
              numberOfLines={6}
              placeholder="Share your thoughts, achievements, or organize a meetup..."
              value={content}
              onChangeText={setContent}
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { padding: 16, paddingBottom: 30 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#667eea' },
  statLbl: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  createBtn: { backgroundColor: '#667eea', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  filterScroll: { marginBottom: 14 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  filterTabActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  filterTabText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  filterTabTextActive: { color: '#fff' },

  postCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f093fb', marginRight: 10 },
  postAuthor: { fontWeight: '700', color: '#1f2937', fontSize: 15 },
  postTime: { fontSize: 12, color: '#6b7280' },
  postBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  postBadgeText: { fontSize: 12, fontWeight: '600' },
  postText: { color: '#374151', fontSize: 15, lineHeight: 22, marginBottom: 12 },

  milestone: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 12 },
  milestoneText: { color: '#92400e', fontWeight: '600', fontSize: 13 },

  meetupBox: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#f59e0b', marginBottom: 12 },
  meetupTitle: { fontWeight: '700', color: '#92400e', fontSize: 15, marginBottom: 8 },
  meetupDetail: { color: '#78350f', fontSize: 13, marginBottom: 4 },
  joinBtn: { backgroundColor: '#f59e0b', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  joinBtnText: { color: '#fff', fontWeight: '700' },

  postActions: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postActionText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalCancel: { color: '#6b7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  modalPost: { color: '#667eea', fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  typeBtnActive: { borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.08)' },
  typeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
  typeBtnTextActive: { color: '#667eea' },
  textarea: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', minHeight: 140 },
});
