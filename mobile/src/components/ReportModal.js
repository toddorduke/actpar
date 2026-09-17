import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

// RN port of client/src/components/common/ReportModal.jsx -- same `reports`
// table, same reason list, so web/mobile reports land in one admin queue.
const REASONS = [
  'Nudity or sexual content',
  'Violence or dangerous content',
  'Harassment or bullying',
  'Hate speech or slurs',
  'Drug or illegal content',
  'Spam or misleading',
  'Self-harm or suicide',
  'Other',
];

export default function ReportModal({ visible, postId, reportedUserId, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason('');
    setDetails('');
  }

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      post_id: postId ?? null,
      reported_user_id: reportedUserId ?? null,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) { onSubmitted?.({ error: "Couldn't submit your report — please try again." }); return; }
    reset();
    onSubmitted?.({ error: null });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Content</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.intro}>Help keep this community safe. Tell us what's wrong with this content.</Text>

          <ScrollView style={styles.reasonList}>
            {REASONS.map((r) => (
              <TouchableOpacity key={r} style={[styles.reasonRow, reason === r && styles.reasonRowSelected]} onPress={() => setReason(r)}>
                <View style={[styles.radio, reason === r && styles.radioSelected]} />
                <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.details}
            placeholder="Additional details (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            maxLength={500}
            value={details}
            onChangeText={setDetails}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!reason || submitting) && styles.submitBtnDisabled]}
            disabled={!reason || submitting}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Report'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#2B1D14' },
  close: { fontSize: 26, color: '#7A6F63', lineHeight: 26 },
  intro: { fontSize: 13, color: '#7A6F63', marginBottom: 14, lineHeight: 18 },

  reasonList: { maxHeight: 280, marginBottom: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1.5, borderColor: '#e5e7eb' },
  reasonRowSelected: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.06)' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db', marginRight: 10 },
  radioSelected: { borderColor: '#FF7A00', backgroundColor: '#FF7A00' },
  reasonText: { fontSize: 14, color: '#374151', flex: 1 },
  reasonTextSelected: { color: '#2B1D14', fontWeight: '600' },

  details: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#2B1D14', minHeight: 70, marginBottom: 14 },

  submitBtn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
