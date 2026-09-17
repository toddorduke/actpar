import React, { useContext, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useTribePosts, usePostLikes, usePostComments, useMeetupRsvp, getDisplayName, timeAgo } from '@actpar/shared';
import { useBlock } from '../hooks/useBlock';
import NudgeModal from '../components/NudgeModal';
import CommentSheet from '../components/CommentSheet';
import PostActionsSheet from '../components/PostActionsSheet';
import ReportModal from '../components/ReportModal';
import ConfirmModal from '../components/ConfirmModal';

const BADGE = {
  achievement: ['#d1fae5', '#065f46', '🏆 Achievement'],
  meetup: ['#FFF4E8', '#92400e', '📅 Meetup'],
  general: ['#dbeafe', '#1e40af', '💬 General'],
};

function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function PostCard({ post, liked, onLike, onComment, commentCount, goingCount, myRsvp, onRsvp, onMore }) {
  const [bg, text, label] = BADGE[post.post_type] || BADGE.general;
  const author = getDisplayName(post.profiles, 'Someone');
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{author}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
        <View style={[styles.postBadge, { backgroundColor: bg }]}>
          <Text style={[styles.postBadgeText, { color: text }]}>{label}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreBtn} onPress={() => onMore(post, author)}>
          <Text style={styles.postMoreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.postText}>{post.content}</Text>

      {post.post_type === 'achievement' && post.milestone && (
        <View style={styles.milestone}>
          <Text style={styles.milestoneText}>🏆 {post.milestone}</Text>
        </View>
      )}

      {post.post_type === 'meetup' && (
        <View style={styles.meetupBox}>
          {post.event_date ? <Text style={styles.meetupDetail}>📅 {formatEventDate(post.event_date)}</Text> : null}
          {post.location ? <Text style={styles.meetupDetail}>📍 {post.location}</Text> : null}
          <Text style={styles.meetupDetail}>👥 {goingCount ?? 0} going</Text>
          <TouchableOpacity
            style={[styles.joinBtn, myRsvp === 'going' && styles.joinBtnActive]}
            onPress={() => onRsvp(post.id, 'going')}
          >
            <Text style={[styles.joinBtnText, myRsvp === 'going' && styles.joinBtnTextActive]}>
              {myRsvp === 'going' ? "✓ You're going" : 'Join Meetup'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={() => onLike(post.id, post.likes ?? 0)}>
          <Text style={styles.postActionText}>{liked ? '❤️' : '🤍'} {post.likes ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => onComment(post.id)}>
          <Text style={styles.postActionText}>💬 {commentCount ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TribeScreen() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const { posts: allPosts, loading, createPost } = useTribePosts(userId);
  const { isBlocked, blockUser } = useBlock();
  const posts = useMemo(() => allPosts.filter((p) => !isBlocked(p.user_id)), [allPosts, isBlocked]);
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { likedIds, toggleLike } = usePostLikes(userId, postIds, 'tribe');
  const commentState = usePostComments(userId);
  const meetupPostIds = useMemo(() => posts.filter((p) => p.post_type === 'meetup').map((p) => p.id), [posts]);
  const { goingCounts, myRsvps, toggleRsvp } = useMeetupRsvp(userId, meetupPostIds);

  const [localLikes, setLocalLikes] = useState({});
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState('general');
  const [content, setContent] = useState('');
  const [milestone, setMilestone] = useState('');
  const [eventDateText, setEventDateText] = useState('');
  const [eventTimeText, setEventTimeText] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nudge, setNudge] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [actionsFor, setActionsFor] = useState(null); // { post, authorName }
  const [reportTarget, setReportTarget] = useState(null); // { postId, userId }
  const [blockTarget, setBlockTarget] = useState(null); // { userId, name }

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.post_type === filter);
  const postedToday = posts.filter((p) => p.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  function handleLike(postId, currentLikes) {
    const owner = posts.find((p) => p.id === postId)?.user_id;
    toggleLike(postId, currentLikes, (id, newCount) => setLocalLikes((prev) => ({ ...prev, [id]: newCount })), owner);
  }

  async function handleRsvp(postId, status) {
    const { error } = await toggleRsvp(postId, status);
    if (error) setNudge({ title: "Couldn't update your RSVP", message: 'Try again.' });
  }

  async function submitPost() {
    if (!content.trim()) { setNudge({ title: 'Add some text', message: 'Write something before posting.' }); return; }
    let eventDateIso = null;
    if (postType === 'meetup') {
      if (!eventDateText.trim() || !eventTimeText.trim()) {
        setNudge({ title: 'Add a date and time', message: 'Meetups need a date (YYYY-MM-DD) and time (HH:MM) so people know when to show up.' });
        return;
      }
      const parsed = new Date(`${eventDateText.trim()}T${eventTimeText.trim()}`);
      if (Number.isNaN(parsed.getTime())) {
        setNudge({ title: "That date didn't parse", message: 'Use YYYY-MM-DD for the date and HH:MM (24hr) for the time.' });
        return;
      }
      eventDateIso = parsed.toISOString();
    }
    setSubmitting(true);
    const { error, moderation } = await createPost({
      content: content.trim(),
      post_type: postType,
      milestone: postType === 'achievement' ? milestone.trim() : null,
      event_date: eventDateIso,
      location: postType === 'meetup' ? location.trim() : null,
    });
    setSubmitting(false);
    if (moderation) { setNudge({ title: 'Hold on', message: moderation.message }); return; }
    if (error) { setNudge({ title: "Couldn't post", message: 'Try again in a moment.' }); return; }
    setShowModal(false);
    setContent(''); setMilestone(''); setEventDateText(''); setEventTimeText(''); setLocation(''); setPostType('general');
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

        <View style={styles.statsRow}>
          {[[String(posts.length), 'Posts'], [String(postedToday), 'Today']].map(([n, l]) => (
            <View key={l} style={styles.statBox}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.createBtnText}>+ Create Post</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[['all', 'All Posts'], ['achievement', '🏆 Achievements'], ['meetup', '📅 Meetups'], ['general', '💬 General']].map(([val, label]) => (
            <TouchableOpacity key={val} style={[styles.filterTab, filter === val && styles.filterTabActive]} onPress={() => setFilter(val)}>
              <Text style={[styles.filterTabText, filter === val && styles.filterTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyText}>No posts yet — be the first to share.</Text>
          </View>
        ) : (
          filtered.map((post) => (
            <PostCard
              key={post.id}
              post={{ ...post, likes: localLikes[post.id] ?? post.likes }}
              liked={likedIds.has(post.id)}
              onLike={handleLike}
              onComment={setCommentPostId}
              commentCount={commentState.commentsByPost[post.id]?.length ?? post.comments_count ?? 0}
              goingCount={goingCounts[post.id]}
              myRsvp={myRsvps[post.id]}
              onRsvp={handleRsvp}
              onMore={(p, authorName) => setActionsFor({ post: p, authorName })}
            />
          ))
        )}

      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={submitPost} disabled={submitting}>
              <Text style={styles.modalPost}>{submitting ? 'Posting…' : 'Post'}</Text>
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
            {postType === 'achievement' && (
              <>
                <Text style={styles.fieldLabel}>Milestone (e.g. 5K PR)</Text>
                <TextInput style={styles.inputField} value={milestone} onChangeText={setMilestone} placeholder="What did you hit?" placeholderTextColor="#9ca3af" />
              </>
            )}
            {postType === 'meetup' && (
              <>
                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.inputField} value={eventDateText} onChangeText={setEventDateText} placeholder="2026-11-02" placeholderTextColor="#9ca3af" />
                <Text style={styles.fieldLabel}>Time (24hr, HH:MM)</Text>
                <TextInput style={styles.inputField} value={eventTimeText} onChangeText={setEventTimeText} placeholder="06:00" placeholderTextColor="#9ca3af" />
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput style={styles.inputField} value={location} onChangeText={setLocation} placeholder="Where's it happening?" placeholderTextColor="#9ca3af" />
              </>
            )}
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

      <CommentSheet
        visible={!!commentPostId}
        postId={commentPostId}
        postType="tribe"
        ownerTable="tribe_posts"
        commentState={commentState}
        onClose={() => setCommentPostId(null)}
      />

      <NudgeModal visible={!!nudge} title={nudge?.title} message={nudge?.message} onClose={() => setNudge(null)} />

      <PostActionsSheet
        visible={!!actionsFor}
        authorName={actionsFor?.authorName}
        onReport={() => {
          setReportTarget({ postId: actionsFor.post.id, userId: actionsFor.post.user_id });
          setActionsFor(null);
        }}
        onBlock={() => {
          setBlockTarget({ userId: actionsFor.post.user_id, name: actionsFor.authorName });
          setActionsFor(null);
        }}
        onClose={() => setActionsFor(null)}
      />

      <ReportModal
        visible={!!reportTarget}
        postId={reportTarget?.postId}
        reportedUserId={reportTarget?.userId}
        onClose={() => setReportTarget(null)}
        onSubmitted={({ error }) => {
          setReportTarget(null);
          setNudge(error ? { title: "Couldn't submit", message: error } : { title: 'Thanks for the report', message: "Our team will review it shortly." });
        }}
      />

      <ConfirmModal
        visible={!!blockTarget}
        title={`Block ${blockTarget?.name ?? 'this user'}?`}
        message="You won't see their posts anymore, and they won't be able to contact you. You can undo this later from Settings."
        confirmLabel="Block"
        destructive
        onConfirm={async () => {
          const target = blockTarget;
          setBlockTarget(null);
          const { error } = await blockUser(target.userId);
          if (error) setNudge({ title: "Couldn't block", message: 'Try again in a moment.' });
        }}
        onCancel={() => setBlockTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { padding: 16, paddingBottom: 30 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#FF7A00' },
  statLbl: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  createBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  filterScroll: { marginBottom: 14 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  filterTabActive: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  filterTabText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  filterTabTextActive: { color: '#fff' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#6b7280', fontSize: 14 },

  postCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFA64D', marginRight: 10 },
  postAuthor: { fontWeight: '700', color: '#1f2937', fontSize: 15 },
  postTime: { fontSize: 12, color: '#6b7280' },
  postBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  postBadgeText: { fontSize: 12, fontWeight: '600' },
  postMoreBtn: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4 },
  postMoreText: { fontSize: 20, color: '#9ca3af', fontWeight: '700' },
  postText: { color: '#374151', fontSize: 15, lineHeight: 22, marginBottom: 12 },

  milestone: { backgroundColor: '#FFF4E8', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 12 },
  milestoneText: { color: '#92400e', fontWeight: '600', fontSize: 13 },

  meetupBox: { backgroundColor: '#FFF4E8', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#FF7A00', marginBottom: 12 },
  meetupDetail: { color: '#78350f', fontSize: 13, marginBottom: 4 },
  joinBtn: { backgroundColor: '#FF7A00', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  joinBtnActive: { backgroundColor: '#10b981' },
  joinBtnText: { color: '#fff', fontWeight: '700' },
  joinBtnTextActive: { color: '#fff' },

  postActions: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postActionText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalCancel: { color: '#6b7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  modalPost: { color: '#FF7A00', fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  typeBtnActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  typeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
  typeBtnTextActive: { color: '#FF7A00' },
  textarea: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', minHeight: 140 },
  inputField: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937' },
});
