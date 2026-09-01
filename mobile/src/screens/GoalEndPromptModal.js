import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// Shown the day a goal's endsAt is reached (spec section 4). If check-in
// completion looks healthy, frames it as a celebration with Extend/Start
// New; if too many check-ins were missed, offers Restart/Shorten instead
// of failing loudly.
export default function GoalEndPromptModal({ visible, goal, wasSuccessful, onExtend, onStartNew, onRestart, onShorten, onClose }) {
  if (!goal) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {wasSuccessful ? (
            <>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.title}>Goal complete!</Text>
              <Text style={styles.body}>You made it through "{goal.title}". What's next?</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onExtend}>
                <Text style={styles.primaryBtnText}>Extend 30 more days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onStartNew}>
                <Text style={styles.secondaryBtnText}>Start a new goal</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>💛</Text>
              <Text style={styles.title}>"{goal.title}" wrapped up</Text>
              <Text style={styles.body}>Looks like a few check-ins slipped — that happens. No judgment, just pick a way forward.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onRestart}>
                <Text style={styles.primaryBtnText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onShorten}>
                <Text style={styles.secondaryBtnText}>Shorten to 30 days</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={onClose}><Text style={styles.dismiss}>Not now</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 19, fontWeight: '800', color: '#2B1D14', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 14, color: '#7A6F63', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  primaryBtn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: '#2B1D14', fontWeight: '700', fontSize: 14 },
  dismiss: { color: '#7A6F63', fontSize: 13, marginTop: 14, textDecorationLine: 'underline' },
});
