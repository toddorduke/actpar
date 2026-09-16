import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { usePactV2 } from '../hooks/usePactV2';
import { getDisplayName } from '../lib/displayName';
import { timeAgo } from '../lib/timeAgo';
import NudgeModal from '../components/NudgeModal';

const BADGE_STYLE = {
  update: ['rgba(30,58,95,0.1)', '#1E3A5F', '📊 Update'],
  win: ['rgba(16,185,129,0.12)', '#065f46', '🎉 Win'],
  challenge: ['rgba(239,68,68,0.12)', '#991b1b', '💪 Challenge'],
  event: ['rgba(255,122,0,0.12)', '#92400e', '📅 Event'],
};

const ROLE_BADGE = { founder: '👑', 'co-lead': '⭐' };

export default function PactScreen() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const { myPacts, pact, members, rules, posts, myRole, openPacts, loading, createPact, joinPactOpen, joinPactByCode, createPost, leavePact } = usePactV2(userId);

  const [feedFilter, setFeedFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [postType, setPostType] = useState('update');
  const [content, setContent] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nudge, setNudge] = useState(null);

  const filtered = feedFilter === 'all' ? posts : posts.filter((p) => p.post_type === feedFilter);

  async function submitPost() {
    if (!content.trim()) { setNudge({ title: 'Write something first' }); return; }
    setSubmitting(true);
    const { error, moderation } = await createPost({ content: content.trim(), post_type: postType });
    setSubmitting(false);
    if (moderation) { setNudge({ title: 'Hold on', message: moderation.message }); return; }
    if (error) { setNudge({ title: "Couldn't post", message: 'Try again.' }); return; }
    setShowPost(false);
    setContent('');
  }

  async function submitCreate() {
    if (!newName.trim()) { setNudge({ title: 'Name your pact' }); return; }
    setSubmitting(true);
    const { error, moderation } = await createPact({ name: newName.trim(), description: newDesc.trim(), is_open: true });
    setSubmitting(false);
    if (moderation) { setNudge({ title: 'Hold on', message: moderation.message }); return; }
    if (error) { setNudge({ title: "Couldn't create pact", message: 'Try again.' }); return; }
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
  }

  async function submitJoinCode() {
    if (!inviteCode.trim()) { setNudge({ title: 'Enter an invite code' }); return; }
    const { error, pactName } = await joinPactByCode(inviteCode.trim());
    if (error) { setNudge({ title: "Couldn't join", message: 'Check the invite code and try again.' }); return; }
    setShowJoinCode(false);
    setInviteCode('');
    setNudge({ title: `Joined ${pactName}! 🎉` });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#FF7A00" />
      </SafeAreaView>
    );
  }

  // Not in any pact yet — browse open ones or create/join one
  if (!pact) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 The Pact</Text>
            <Text style={styles.emptySub}>Small accountability groups. Create one, join an open one below, or use an invite code.</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreate(true)}>
                <Text style={styles.primaryBtnText}>+ Create a Pact</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowJoinCode(true)}>
                <Text style={styles.secondaryBtnText}>Have an invite code?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Pacts</Text>
            {openPacts.length === 0 ? (
              <Text style={styles.emptySub}>No open pacts right now.</Text>
            ) : openPacts.map((p) => (
              <View key={p.id} style={styles.openPactCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.openPactName}>{p.name}</Text>
                  {p.description ? <Text style={styles.openPactDesc} numberOfLines={2}>{p.description}</Text> : null}
                </View>
                <TouchableOpacity style={styles.joinBtn} onPress={() => joinPactOpen(p.id)}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreate(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>Create a Pact</Text>
              <TouchableOpacity onPress={submitCreate} disabled={submitting}><Text style={styles.modalAction}>{submitting ? '…' : 'Create'}</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.inputField} value={newName} onChangeText={setNewName} placeholder="e.g. Morning Runners" placeholderTextColor="#9ca3af" />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={styles.textarea} multiline value={newDesc} onChangeText={setNewDesc} placeholder="What's this pact about?" placeholderTextColor="#9ca3af" textAlignVertical="top" />
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={showJoinCode} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowJoinCode(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>Join with Code</Text>
              <TouchableOpacity onPress={submitJoinCode}><Text style={styles.modalAction}>Join</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Invite Code</Text>
              <TextInput style={styles.inputField} value={inviteCode} onChangeText={setInviteCode} placeholder="Enter code" autoCapitalize="none" placeholderTextColor="#9ca3af" />
            </View>
          </SafeAreaView>
        </Modal>

        <NudgeModal visible={!!nudge} title={nudge?.title} message={nudge?.message ?? ' '} onClose={() => setNudge(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.pactHeader}>
          <Text style={styles.pactIcon}>🔐</Text>
          {!pact.is_open && <View style={styles.inviteBadge}><Text style={styles.inviteBadgeText}>⭐ Invite Only</Text></View>}
          <Text style={styles.pactName}>{pact.name}</Text>
          {pact.description ? <Text style={styles.pactDesc}>{pact.description}</Text> : null}
          <View style={styles.pactStats}>
            {[[String(members.length), 'Members'], [new Date(pact.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 'Created'], [String(posts.length), 'Posts']].map(([n, l]) => (
              <View key={l} style={styles.pactStat}>
                <Text style={styles.pactStatNum}>{n}</Text>
                <Text style={styles.pactStatLbl}>{l}</Text>
              </View>
            ))}
          </View>
          {pact.invite_code && (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Invite code</Text>
              <Text style={styles.codeValue}>{pact.invite_code}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Pact Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {members.map((m) => (
              <View key={m.user_id} style={styles.memberChip}>
                <View style={styles.memberAvatar}>
                  {ROLE_BADGE[m.role] ? <Text style={styles.memberBadge}>{ROLE_BADGE[m.role]}</Text> : null}
                </View>
                <Text style={styles.memberName} numberOfLines={1}>{getDisplayName(m.profiles, 'Member').split(' ')[0]}</Text>
                <Text style={styles.memberRole}>{m.role}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.createPostBtn} onPress={() => setShowPost(true)}>
            <Text style={styles.createPostText}>+ Create Post</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 12 }}>
            {[['all', 'All'], ['update', 'Updates'], ['win', 'Wins'], ['challenge', 'Challenges']].map(([val, label]) => (
              <TouchableOpacity key={val} style={[styles.filterTab, feedFilter === val && styles.filterTabActive]} onPress={() => setFeedFilter(val)}>
                <Text style={[styles.filterTabText, feedFilter === val && styles.filterTabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <Text style={styles.emptySub}>No posts yet — share the first update.</Text>
          ) : filtered.map((post) => {
            const [bg, color, label] = BADGE_STYLE[post.post_type] || BADGE_STYLE.update;
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthor}>{getDisplayName(post.profiles, 'Member')}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                  </View>
                  <View style={[styles.postBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.postBadgeText, { color }]}>{label}</Text>
                  </View>
                </View>
                <Text style={styles.postText}>{post.content}</Text>
              </View>
            );
          })}
        </View>

        {rules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Pact Rules</Text>
            {rules.map((r, i) => (
              <View key={r.id} style={styles.ruleItem}>
                <Text style={styles.ruleText}>{i + 1}. {r.rule_text}</Text>
              </View>
            ))}
          </View>
        )}

        {myPacts.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Other Pacts</Text>
            {myPacts.filter((p) => p.id !== pact.id).map((p) => (
              <Text key={p.id} style={styles.emptySub}>{p.name}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.leaveBtn} onPress={leavePact}>
          <Text style={styles.leaveBtnText}>Leave Pact</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={showPost} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPost(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Share with The Pact</Text>
            <TouchableOpacity onPress={submitPost} disabled={submitting}><Text style={styles.modalAction}>{submitting ? '…' : 'Post'}</Text></TouchableOpacity>
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

      <NudgeModal visible={!!nudge} title={nudge?.title} message={nudge?.message ?? ' '} onClose={() => setNudge(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  scroll: { padding: 16, paddingBottom: 30 },

  pactHeader: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,122,0,0.25)', marginBottom: 16, alignItems: 'flex-start' },
  pactIcon: { fontSize: 40, marginBottom: 8 },
  inviteBadge: { backgroundColor: 'rgba(255,122,0,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#FF7A00', marginBottom: 10 },
  inviteBadgeText: { color: '#FF7A00', fontWeight: '600', fontSize: 13 },
  pactName: { fontSize: 24, fontWeight: 'bold', color: '#2B1D14', marginBottom: 6 },
  pactDesc: { color: '#7A6F63', fontSize: 14, marginBottom: 16 },
  pactStats: { flexDirection: 'row', gap: 30, marginBottom: 14 },
  pactStat: { alignItems: 'center' },
  pactStatNum: { fontSize: 20, fontWeight: 'bold', color: '#FF7A00' },
  pactStatLbl: { fontSize: 11, color: '#7A6F63', marginTop: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeLabel: { color: '#7A6F63', fontSize: 12 },
  codeValue: { color: '#2B1D14', fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2B1D14', marginBottom: 12 },
  emptySub: { color: '#7A6F63', fontSize: 14, marginBottom: 12 },

  actionsRow: { gap: 10, marginTop: 12 },
  primaryBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#FF7A00', borderRadius: 12, padding: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#FF7A00', fontWeight: '700', fontSize: 15 },

  openPactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  openPactName: { fontWeight: '700', color: '#2B1D14', fontSize: 15 },
  openPactDesc: { color: '#7A6F63', fontSize: 13, marginTop: 2 },
  joinBtn: { backgroundColor: '#FF7A00', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  joinBtnText: { color: '#fff', fontWeight: '700' },

  memberChip: { alignItems: 'center', marginRight: 14, width: 70 },
  memberAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF7A00', marginBottom: 6, justifyContent: 'center', alignItems: 'center' },
  memberBadge: { fontSize: 18 },
  memberName: { color: '#2B1D14', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  memberRole: { color: '#7A6F63', fontSize: 10, textAlign: 'center' },

  createPostBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 14, alignItems: 'center' },
  createPostText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,122,0,0.3)', marginRight: 8 },
  filterTabActive: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  filterTabText: { color: '#7A6F63', fontWeight: '600', fontSize: 13 },
  filterTabTextActive: { color: '#fff' },

  postCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,122,0,0.15)' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFA64D', marginRight: 10 },
  postAuthor: { fontWeight: '700', color: '#2B1D14', fontSize: 14 },
  postTime: { fontSize: 12, color: '#7A6F63' },
  postBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  postBadgeText: { fontSize: 11, fontWeight: '700' },
  postText: { color: '#2B1D14', fontSize: 14, lineHeight: 21 },

  ruleItem: { backgroundColor: '#fff', borderLeftWidth: 3, borderLeftColor: '#FF7A00', borderRadius: 8, padding: 12, marginBottom: 8 },
  ruleText: { color: '#2B1D14', fontSize: 14 },

  leaveBtn: { alignItems: 'center', padding: 14, marginBottom: 20 },
  leaveBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalCancel: { color: '#6b7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  modalAction: { color: '#FF7A00', fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  typeBtnActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  typeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
  typeBtnTextActive: { color: '#FF7A00' },
  textarea: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', minHeight: 140 },
  inputField: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937' },
});
