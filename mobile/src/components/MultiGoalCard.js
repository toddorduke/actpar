import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import { useGoalMetrics } from '@actpar/shared';

function formatMetricValue(value, metric) {
  if (value === null || value === undefined) return '—';
  if (metric.value_type === 'time') {
    const total = Math.round(value);
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  }
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}${metric.unit ? ` ${metric.unit}` : ''}`;
}

// Lower is better for time (a faster split), higher is better otherwise
// (more reps, more weight, more distance).
function isBetter(value, currentBest, metric) {
  if (currentBest === null || currentBest === undefined) return true;
  return metric.value_type === 'time' ? value < currentBest : value > currentBest;
}

function metricBest(metric) {
  return metric.logs.reduce((best, log) => (isBetter(log.value, best, metric) ? log.value : best), null);
}

function LogSessionModal({ goal, metrics, onLogSession, onClose }) {
  const [inputs, setInputs] = useState({}); // { [metricId]: { mm, ss, num } }
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function setField(metricId, field, value) {
    setInputs((prev) => ({ ...prev, [metricId]: { ...prev[metricId], [field]: value } }));
  }

  async function handleSubmit() {
    const entries = metrics
      .map((m) => {
        const row = inputs[m.id] ?? {};
        if (m.value_type === 'time') {
          const mm = parseFloat(row.mm);
          const ss = parseFloat(row.ss);
          if (Number.isNaN(mm) && Number.isNaN(ss)) return null;
          const value = (Number.isNaN(mm) ? 0 : mm) * 60 + (Number.isNaN(ss) ? 0 : ss);
          return { metricId: m.id, value };
        }
        const value = parseFloat(row.num);
        if (Number.isNaN(value)) return null;
        return { metricId: m.id, value };
      })
      .filter(Boolean);

    if (entries.length === 0) { setFeedback('Log at least one metric.'); return; }

    setSubmitting(true);
    const { error, moderation } = await onLogSession(entries, note);
    setSubmitting(false);
    if (moderation) { setFeedback(moderation.message); return; }
    if (error) { setFeedback('Something went wrong — try again.'); return; }
    onClose();
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log a Session</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
        </View>
        <Text style={styles.modalHint}>{goal.title} — fill in whatever you tracked, skip the rest.</Text>

        {metrics.map((m) => (
          <View key={m.id} style={styles.sessionRow}>
            <Text style={styles.sessionMetricName}>{m.name}</Text>
            {m.value_type === 'time' ? (
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="mm"
                  keyboardType="numeric"
                  value={inputs[m.id]?.mm ?? ''}
                  onChangeText={(v) => setField(m.id, 'mm', v)}
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="ss"
                  keyboardType="numeric"
                  value={inputs[m.id]?.ss ?? ''}
                  onChangeText={(v) => setField(m.id, 'ss', v)}
                />
              </View>
            ) : (
              <TextInput
                style={styles.numberInput}
                placeholder={m.unit || 'value'}
                keyboardType="numeric"
                value={inputs[m.id]?.num ?? ''}
                onChangeText={(v) => setField(m.id, 'num', v)}
              />
            )}
          </View>
        ))}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="How'd it go?"
          value={note}
          onChangeText={setNote}
          multiline
        />

        {feedback && <Text style={styles.error}>{feedback}</Text>}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Save Session'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

export default function MultiGoalCard({ goal, userId, tagLabel, onEdit, onPause, onComplete, onArchive }) {
  const { metrics, loading, logSession } = useGoalMetrics(userId, goal.id);
  const [showLog, setShowLog] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{goal.title}</Text>
        <Text style={styles.cardTag}>{tagLabel}</Text>
      </View>

      {!loading && metrics.length === 0 && (
        <Text style={styles.cardMeta}>No metrics on this goal yet.</Text>
      )}

      {metrics.map((m) => {
        const last = m.logs[0]?.value;
        const best = metricBest(m);
        return (
          <View key={m.id} style={styles.metricSummaryRow}>
            <Text style={styles.metricSummaryName}>{m.name}</Text>
            <View style={styles.metricSummaryValues}>
              <Text style={styles.metricSummaryLast}>{last !== undefined ? formatMetricValue(last, m) : 'Not logged'}</Text>
              {best !== null && <Text style={styles.metricSummaryBest}>best {formatMetricValue(best, m)}</Text>}
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.logSessionBtn} onPress={() => setShowLog(true)}>
        <Text style={styles.logSessionBtnText}>📋 Log a Session</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onEdit}><Text style={styles.actionLink}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={onPause}><Text style={styles.actionLink}>Pause</Text></TouchableOpacity>
        <TouchableOpacity onPress={onComplete}><Text style={styles.actionLink}>Complete</Text></TouchableOpacity>
        <TouchableOpacity onPress={onArchive}><Text style={styles.actionLinkDanger}>Archive</Text></TouchableOpacity>
      </View>

      {showLog && (
        <LogSessionModal
          goal={goal}
          metrics={metrics}
          onLogSession={logSession}
          onClose={() => setShowLog(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2B1D14', flex: 1 },
  cardTag: { fontSize: 11, fontWeight: '700', color: '#E06400', backgroundColor: 'rgba(255,122,0,0.08)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  cardMeta: { fontSize: 12, color: '#7A6F63', marginTop: 6 },
  metricSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  metricSummaryName: { fontSize: 13, fontWeight: '600', color: '#2B1D14', flex: 1 },
  metricSummaryValues: { alignItems: 'flex-end' },
  metricSummaryLast: { fontSize: 14, fontWeight: '700', color: '#2B1D14' },
  metricSummaryBest: { fontSize: 11, color: '#FF7A00', fontWeight: '600', marginTop: 2 },
  logSessionBtn: { backgroundColor: '#FF7A00', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 14 },
  logSessionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' },
  actionLink: { color: '#7A6F63', fontSize: 12, fontWeight: '600' },
  actionLinkDanger: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: '#FBF6EE', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#2B1D14' },
  modalClose: { fontSize: 20, color: '#7A6F63' },
  modalHint: { fontSize: 12, color: '#7A6F63', marginBottom: 10, fontStyle: 'italic' },
  sessionRow: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionMetricName: { fontSize: 13, fontWeight: '600', color: '#2B1D14', flex: 1 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeInput: { width: 50, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, fontSize: 14, textAlign: 'center' },
  timeColon: { fontSize: 14, fontWeight: '700', color: '#7A6F63' },
  numberInput: { width: 90, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, fontSize: 14, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#2B1D14', marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, fontSize: 15 },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 12 },
  submitBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
