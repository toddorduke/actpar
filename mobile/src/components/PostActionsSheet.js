import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// Bottom sheet opened from a post's "⋯" button -- the in-content path to
// Guideline 1.2's required reporting + blocking mechanism (see ReportModal,
// useBlock). authorName is the post's author, not the viewer.
export default function PostActionsSheet({ visible, authorName, onReport, onBlock, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.row} onPress={onReport}>
            <Text style={styles.rowText}>🚩 Report Post</Text>
          </TouchableOpacity>
          {authorName ? (
            <TouchableOpacity style={styles.row} onPress={onBlock}>
              <Text style={[styles.rowText, styles.danger]}>🚫 Block {authorName}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.row, styles.cancelRow]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingBottom: 24 },
  row: { paddingVertical: 16, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowText: { fontSize: 16, fontWeight: '600', color: '#2B1D14' },
  danger: { color: '#dc2626' },
  cancelRow: { borderBottomWidth: 0, marginTop: 4 },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#7A6F63' },
});
