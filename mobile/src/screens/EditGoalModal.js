import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { INTEREST_CONFIG, CUSTOM_TAG_DEFAULTS } from '../lib/contentSources';
import { DURATION_OPTIONS, getDurationBadge, durationLabel } from '../lib/goalDurations';

const FREQUENCIES = [
  ['daily', 'Daily'],
  ['3x_week', '3x / week'],
  ['weekly', 'Weekly'],
];

export default function EditGoalModal({ visible, goal, onClose, onSave }) {
  const [frequency, setFrequency] = useState('daily');
  const [durationDays, setDurationDays] = useState(30);

  useEffect(() => {
    if (goal) { setFrequency(goal.frequency); setDurationDays(goal.duration_days); }
  }, [goal]);

  if (!goal) return null;
  const config = goal.tag === 'custom' ? CUSTOM_TAG_DEFAULTS : (INTEREST_CONFIG[goal.tag] ?? CUSTOM_TAG_DEFAULTS);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit "{goal.title}"</Text>

          <Text style={styles.label}>How often?</Text>
          <View style={styles.row}>
            {FREQUENCIES.map(([val, lbl]) => (
              <TouchableOpacity key={val} style={[styles.pill, frequency === val && styles.pillActive]} onPress={() => setFrequency(val)}>
                <Text style={[styles.pillText, frequency === val && styles.pillTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration</Text>
          <View style={styles.row}>
            {DURATION_OPTIONS.map((opt) => {
              const badge = getDurationBadge(config.defaultDuration, opt);
              const selected = durationDays === opt;
              return (
                <TouchableOpacity key={String(opt)} style={[styles.durationCard, selected && styles.durationCardActive]} onPress={() => setDurationDays(opt)}>
                  <Text style={[styles.durationValue, selected && styles.durationValueActive]}>{durationLabel(opt)}</Text>
                  {badge && <Text style={styles.durationBadge}>{badge}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ frequency, duration_days: durationDays })}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22 },
  title: { fontSize: 17, fontWeight: '800', color: '#2B1D14', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#2B1D14', marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb' },
  pillActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#7A6F63' },
  pillTextActive: { color: '#FF7A00' },
  durationCard: { flexBasis: '47%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', padding: 10, alignItems: 'center' },
  durationCardActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  durationValue: { fontSize: 14, fontWeight: '700', color: '#2B1D14' },
  durationValueActive: { color: '#FF7A00' },
  durationBadge: { fontSize: 10, color: '#7A6F63', marginTop: 2 },
  saveBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancel: { textAlign: 'center', color: '#7A6F63', marginTop: 12, fontSize: 13 },
});
