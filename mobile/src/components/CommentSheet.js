import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { getDisplayName, timeAgo } from '@actpar/shared';
import Avatar from './Avatar';

// Mobile equivalent of client/src/components/common/CommentPanel.jsx --
// a bottom-sheet modal instead of an inline panel, works for both Tribe
// and Pact posts (post_type is passed through to post_comments).
export default function CommentSheet({ visible, postId, postType, ownerTable, commentState, onClose }) {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const { commentsByPost, loadingPost, fetchComments, addComment, deleteComment } = commentState;
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modError, setModError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && postId && !commentsByPost[postId]) fetchComments(postId);
  }, [visible, postId]);

  const comments = commentsByPost[postId] ?? [];
  const loading = loadingPost[postId];

  async function submit() {
    if (!text.trim() || submitting) return;
    setModError('');
    setSubmitting(true);
    const result = await addComment(postId, postType, text, ownerTable);
    setSubmitting(false);
    if (result?.moderation) { setModError(result.moderation.message); return; }
    if (result?.error) return;
    setText('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#FF7A00" />
        ) : comments.length === 0 ? (
          <TouchableOpacity onPress={() => inputRef.current?.focus()}>
            <Text style={styles.empty}>No comments yet — tap to be the first!</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            style={styles.list}
            renderItem={({ item }) => {
              const name = getDisplayName(item.profiles);
              const isOwn = item.user_id === userId;
              return (
                <View style={styles.commentRow}>
                  <Avatar url={item.profiles?.avatar_url} name={name} size={30} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.author}>{name}</Text>
                      <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                  {isOwn && (
                    <TouchableOpacity onPress={() => deleteComment(postId, item.id)}>
                      <Text style={styles.delete}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}

        {modError ? <Text style={styles.modError}>{modError}</Text> : null}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              onSubmitEditing={submit}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={!text.trim() || submitting}>
              <Text style={styles.sendText}>{submitting ? '…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 17, fontWeight: 'bold', color: '#2B1D14' },
  close: { fontSize: 18, color: '#7A6F63' },
  empty: { textAlign: 'center', color: '#7A6F63', marginTop: 40, fontSize: 14 },
  list: { flex: 1, padding: 16 },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  avatar: { marginRight: 10 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  author: { fontWeight: '700', color: '#2B1D14', fontSize: 13 },
  time: { color: '#7A6F63', fontSize: 11 },
  commentText: { color: '#2B1D14', fontSize: 14, lineHeight: 20 },
  delete: { color: '#9ca3af', fontSize: 20, paddingHorizontal: 6 },
  modError: { color: '#dc2626', fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#2B1D14' },
  sendBtn: { backgroundColor: '#FF7A00', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
