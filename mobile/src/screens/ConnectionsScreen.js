import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useConnectionsV2 } from '../hooks/useConnectionsV2';
import { getDisplayName } from '../lib/displayName';
import NudgeModal from '../components/NudgeModal';

const BG_COLORS = ['#FF7A00', '#E06400', '#1E3A5F', '#FFA64D', '#10b981'];

export default function ConnectionsScreen() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const {
    browseProfiles, incomingSparks, acceptedConnections, loading,
    sendSpark, acceptSpark, declineSpark, skipProfile,
  } = useConnectionsV2(userId);

  const [alert, setAlert] = useState(null);
  const [sparkMessage, setSparkMessage] = useState('');

  const current = browseProfiles[0];

  async function handleSpark() {
    if (!current) return;
    const { error } = await sendSpark(current.id, sparkMessage.trim() || null);
    setSparkMessage('');
    setAlert(error ? { title: "Couldn't send that spark — try again." } : { title: `Spark sent to ${getDisplayName(current)}! ⚡` });
  }

  async function handleAccept(requesterId, name) {
    const { error } = await acceptSpark(requesterId);
    setAlert(error ? { title: "Couldn't accept — try again." } : { title: `You're connected with ${name}!` });
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

        {/* Sparks Received */}
        {incomingSparks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Sparks Received ({incomingSparks.length})</Text>
            {incomingSparks.map((s) => {
              const name = getDisplayName(s.profiles, 'Someone');
              return (
                <View key={s.requester_id} style={styles.sparkRow}>
                  <View style={styles.sparkAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sparkName}>{name}</Text>
                    {s.spark_message && <Text style={styles.sparkMsg} numberOfLines={2}>"{s.spark_message}"</Text>}
                  </View>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(s.requester_id, name)}>
                    <Text style={styles.acceptText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => declineSpark(s.requester_id)}>
                    <Text style={styles.declineText}>✗</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Find Your Tribe</Text>
          {!current ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>You've seen everyone!</Text>
              <Text style={styles.emptySub}>Check back later for new people to connect with.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={[styles.cardTop, { backgroundColor: BG_COLORS[browseProfiles.length % BG_COLORS.length] }]}>
                <View style={styles.cardAvatar} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{getDisplayName(current)}</Text>
                {current.city ? <Text style={styles.cardCity}>📍 {current.city}</Text> : null}
                {current.tagline ? <Text style={styles.cardTagline}>{current.tagline}</Text> : null}
                {current.matchReason && <Text style={styles.matchReason}>✨ {current.matchReason}</Text>}
                {current.goals.length > 0 && (
                  <>
                    <Text style={styles.tagsLabel}>GOALS</Text>
                    <View style={styles.tags}>
                      {current.goals.slice(0, 4).map((g) => (
                        <View key={g.title} style={styles.tag}>
                          <Text style={styles.tagText}>{g.title}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                <TextInput
                  style={styles.sparkInput}
                  placeholder="Add a message (optional)..."
                  placeholderTextColor="#9ca3af"
                  value={sparkMessage}
                  onChangeText={setSparkMessage}
                />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={() => skipProfile(current.id)}>
                  <Text style={styles.skipIcon}>✗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.sparkBtn]} onPress={handleSpark}>
                  <Text style={styles.sparkIcon}>⚡</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>✗ Skip  •  ⚡ Spark</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>
          <View style={styles.statsRow}>
            {[
              [String(acceptedConnections.length), 'Connections'],
              [String(incomingSparks.length), 'Pending Sparks'],
              [String(browseProfiles.length), 'To Browse'],
            ].map(([n, l]) => (
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
          {['Be genuine in your profile', 'Send sparks to show extra interest', 'Focus on aligned goals', 'Start conversations meaningfully'].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <NudgeModal
        visible={!!alert}
        title={alert?.title}
        message={alert?.message ?? ' '}
        onClose={() => setAlert(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { padding: 16, paddingBottom: 30 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },

  sparkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E8', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FFA64D' },
  sparkAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF7A00', marginRight: 12 },
  sparkName: { fontWeight: '700', color: '#1f2937', fontSize: 15 },
  sparkMsg: { color: '#7A6F63', fontSize: 13, marginTop: 2 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  declineBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  declineText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  cardTop: { height: 160, alignItems: 'center', justifyContent: 'center' },
  cardAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 4, borderColor: '#fff' },
  cardBody: { padding: 20 },
  cardName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  cardCity: { fontSize: 14, color: '#7A6F63', marginBottom: 4 },
  cardTagline: { fontSize: 14, color: '#374151', marginBottom: 8 },
  matchReason: { fontSize: 13, color: '#FF7A00', fontWeight: '600', marginBottom: 12 },
  tagsLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: 'rgba(255,122,0,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,122,0,0.3)' },
  tagText: { color: '#FF7A00', fontWeight: '600', fontSize: 13 },
  sparkInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, fontSize: 14, color: '#1f2937' },

  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, padding: 20, paddingTop: 10 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  skipBtn: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#ef4444' },
  skipIcon: { color: '#ef4444', fontSize: 24, fontWeight: 'bold' },
  sparkBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF7A00' },
  sparkIcon: { fontSize: 28 },
  hint: { textAlign: 'center', color: '#9ca3af', fontSize: 12, paddingBottom: 16 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  emptySub: { color: '#6b7280', textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#FF7A00' },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2, textAlign: 'center' },

  tipRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  tipText: { color: '#374151', fontSize: 14 },
});
