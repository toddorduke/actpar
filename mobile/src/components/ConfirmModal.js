import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// Same rationale as NudgeModal: Alert.alert's confirm-with-buttons form
// doesn't render reliably on React Native Web, so destructive confirms
// (archive, etc.) use this instead.
export default function ConfirmModal({ visible, title, message, confirmLabel = 'Confirm', destructive, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <TouchableOpacity style={[styles.btn, destructive && styles.btnDanger]} onPress={onConfirm}>
            <Text style={styles.btnText}>{confirmLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
  btn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnDanger: { backgroundColor: '#dc2626' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#7A6F63', fontWeight: '600', fontSize: 14 },
});
