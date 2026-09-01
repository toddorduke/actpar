import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// A simple in-app modal used instead of the native Alert.alert for
// nudges/notices -- Alert.alert renders inconsistently on React Native
// Web, and this stays visually consistent with the rest of the app on
// every platform.
export default function NudgeModal({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 22 },
  title: { fontSize: 16, fontWeight: '800', color: '#2B1D14', marginBottom: 8 },
  message: { fontSize: 14, color: '#7A6F63', lineHeight: 20, marginBottom: 18 },
  btn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
