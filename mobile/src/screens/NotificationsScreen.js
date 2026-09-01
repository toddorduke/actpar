import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNotificationsV2 } from '../hooks/useNotificationsV2';

const ICONS = {
  connection_request: '⚡',
  connection_accepted: '🎉',
  streak_milestone: '🔥',
  progress_complete: '🎯',
  journey_invite: '🤝',
  journey_accepted: '🤝',
  journey_checkin: '💪',
  journey_nudge: '💪',
  new_message: '💬',
  post_like: '❤️',
  cheer: '🎉',
  pact_joined: '🔐',
  pact_post: '🔐',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const { notifications, loading, markRead } = useNotificationsV2(userId);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {!loading && notifications.length === 0 && (
        <Text style={styles.empty}>Nothing yet — activity from your connections and goals will show up here.</Text>
      )}
      {notifications.map((n) => (
        <TouchableOpacity
          key={n.id}
          style={[styles.row, !n.read && styles.rowUnread]}
          onPress={() => markRead(n.id)}
        >
          <Text style={styles.icon}>{ICONS[n.type] ?? '🔔'}</Text>
          <View style={styles.rowText}>
            <Text style={styles.body}>{n.body}</Text>
            <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
          </View>
          {!n.read && <View style={styles.dot} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#2B1D14', marginTop: 12, marginBottom: 14 },
  empty: { textAlign: 'center', color: '#7A6F63', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  rowUnread: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.05)' },
  icon: { fontSize: 20, marginRight: 12 },
  rowText: { flex: 1 },
  body: { fontSize: 14, color: '#2B1D14', fontWeight: '600' },
  time: { fontSize: 11, color: '#7A6F63', marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF7A00', marginLeft: 8 },
});
