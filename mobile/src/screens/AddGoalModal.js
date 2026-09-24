import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { INTEREST_TAGS, INTEREST_CONFIG, DISCLAIMER_TAGS, CUSTOM_TAG_DEFAULTS } from '../lib/contentSources';
import { DURATION_OPTIONS, getDurationBadge, durationLabel } from '../lib/goalDurations';

const FREQUENCIES = [
  ['daily', 'Daily'],
  ['3x_week', '3x / week'],
  ['weekly', 'Weekly'],
];

const PERIODS = [
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['total', 'One-Time'],
];

const HYROX_PRESET = [
  { name: 'SkiErg 1000m', valueType: 'time', unit: '' },
  { name: 'Sled Push 50m', valueType: 'time', unit: '' },
  { name: 'Sled Pull 50m', valueType: 'time', unit: '' },
  { name: 'Burpee Broad Jumps 80m', valueType: 'time', unit: '' },
  { name: 'Rowing 1000m', valueType: 'time', unit: '' },
  { name: 'Farmers Carry 200m', valueType: 'time', unit: '' },
  { name: 'Sandbag Lunges 100m', valueType: 'time', unit: '' },
  { name: 'Wall Balls (100 reps)', valueType: 'time', unit: '' },
];

export default function AddGoalModal({ visible, onClose, onCreate, atCap, isPremium }) {
  const [goalType, setGoalType] = useState('habit');
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [durationDays, setDurationDays] = useState(undefined); // undefined = not yet set
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('weekly');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState([]); // [{name, valueType, unit}]

  function selectTag(t) {
    setTag(t);
    const config = t === 'custom' ? CUSTOM_TAG_DEFAULTS : INTEREST_CONFIG[t];
    setFrequency(config.defaultFrequency);
    setDurationDays(config.defaultDuration);
  }

  function reset() {
    setGoalType('habit'); setTitle(''); setTag(null); setFrequency(null); setDurationDays(undefined);
    setTargetValue(''); setTargetUnit(''); setTargetPeriod('weekly'); setError(null); setMetrics([]);
  }

  const isNumeric = goalType === 'numeric';
  const isMulti = goalType === 'multi';
  const canSubmit = isNumeric
    ? title.trim() && tag && targetValue && targetUnit.trim()
    : isMulti
    ? title.trim() && tag && metrics.filter((m) => m.name.trim()).length > 0
    : title.trim() && tag && frequency;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const { error: createError, metricsError } = await onCreate({
      title: title.trim(), tag, goalType,
      frequency, durationDays,
      targetValue: isNumeric ? parseFloat(targetValue) : undefined,
      targetUnit: isNumeric ? targetUnit.trim() : undefined,
      targetPeriod: isNumeric ? targetPeriod : undefined,
      metrics: isMulti ? metrics.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), valueType: m.valueType, unit: m.unit.trim() })) : undefined,
    });
    setSubmitting(false);
    if (createError?.code === 'CAP_REACHED') {
      setError(
        isPremium
          ? "You've hit your active goal limit. Finish or pause one to add another."
          : "You've got as many active goals as your plan allows. Finish or pause one to add another, or upgrade for more."
      );
      return;
    }
    if (createError?.code === 'MODERATION') { setError(createError.message); return; }
    if (createError) { setError(createError.message ?? 'Something went wrong.'); return; }
    if (metricsError) { setError('Goal created, but one of the metrics failed to save — you can try adding it again from the goal.'); }
    reset();
    onClose();
  }

  const config = tag ? (tag === 'custom' ? CUSTOM_TAG_DEFAULTS : INTEREST_CONFIG[tag]) : null;
  const showDisclaimer = tag && DISCLAIMER_TAGS.includes(tag);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>New Goal</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>

        {atCap && (
          <View style={styles.capBanner}>
            <Text style={styles.capBannerText}>
              We limit goals on purpose. A few at a time is where people actually finish.
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.pill, goalType === 'habit' && styles.pillActive]} onPress={() => setGoalType('habit')}>
            <Text style={[styles.pillText, goalType === 'habit' && styles.pillTextActive]}>✓ Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, goalType === 'numeric' && styles.pillActive]} onPress={() => setGoalType('numeric')}>
            <Text style={[styles.pillText, goalType === 'numeric' && styles.pillTextActive]}>📊 Progress Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, goalType === 'multi' && styles.pillActive]} onPress={() => setGoalType('multi')}>
            <Text style={[styles.pillText, goalType === 'multi' && styles.pillTextActive]}>🏋️ Multi-Metric</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>What's the goal?</Text>
        <TextInput
          style={styles.input}
          placeholder={isNumeric ? 'e.g. Save $500' : isMulti ? 'e.g. HYROX Training' : 'e.g. Walk 20 minutes'}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.tagGrid}>
          {[...INTEREST_TAGS, 'custom'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tagChip, tag === t && styles.tagChipActive]}
              onPress={() => selectTag(t)}
            >
              <Text style={[styles.tagChipText, tag === t && styles.tagChipTextActive]}>
                {t === 'custom' ? 'Custom' : INTEREST_CONFIG[t].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tag && !isNumeric && (
          <>
            <Text style={styles.label}>How often?</Text>
            <View style={styles.row}>
              {FREQUENCIES.map(([val, lbl]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.pill, frequency === val && styles.pillActive]}
                  onPress={() => setFrequency(val)}
                >
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
                  <TouchableOpacity
                    key={String(opt)}
                    style={[styles.durationCard, selected && styles.durationCardActive]}
                    onPress={() => setDurationDays(opt)}
                  >
                    <Text style={[styles.durationValue, selected && styles.durationValueActive]}>{durationLabel(opt)}</Text>
                    {badge && <Text style={[styles.durationBadge, selected && styles.durationBadgeActive]}>{badge}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            {config.durationHint && <Text style={styles.hint}>{config.durationHint}</Text>}
          </>
        )}

        {tag && isNumeric && (
          <>
            <Text style={styles.label}>Target</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.targetInput]}
                placeholder="Target (e.g. 500)"
                keyboardType="numeric"
                value={targetValue}
                onChangeText={setTargetValue}
              />
              <TextInput
                style={[styles.input, styles.targetInput]}
                placeholder="unit (miles, lbs, $…)"
                value={targetUnit}
                onChangeText={setTargetUnit}
              />
            </View>

            <Text style={styles.label}>Resets</Text>
            <View style={styles.row}>
              {PERIODS.map(([val, lbl]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.pill, targetPeriod === val && styles.pillActive]}
                  onPress={() => setTargetPeriod(val)}
                >
                  <Text style={[styles.pillText, targetPeriod === val && styles.pillTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tag && isMulti && (
          <>
            <Text style={styles.label}>Metrics to track</Text>
            <Text style={styles.hint}>Add each thing you want to log a number or time for — one goal, several stations.</Text>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setMetrics(HYROX_PRESET.map((m) => ({ ...m })))}>
              <Text style={styles.presetBtnText}>⚡ Load HYROX stations</Text>
            </TouchableOpacity>

            {metrics.map((m, i) => (
              <View key={i} style={styles.metricRow}>
                <TextInput
                  style={[styles.input, styles.metricNameInput]}
                  placeholder="Metric name (e.g. SkiErg 1000m)"
                  value={m.name}
                  onChangeText={(v) => setMetrics((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: v } : row)))}
                />
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.metricTypeBtn, m.valueType === 'time' && styles.pillActive]}
                    onPress={() => setMetrics((prev) => prev.map((row, idx) => (idx === i ? { ...row, valueType: 'time' } : row)))}
                  >
                    <Text style={[styles.pillText, m.valueType === 'time' && styles.pillTextActive]}>⏱ Time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.metricTypeBtn, m.valueType === 'number' && styles.pillActive]}
                    onPress={() => setMetrics((prev) => prev.map((row, idx) => (idx === i ? { ...row, valueType: 'number' } : row)))}
                  >
                    <Text style={[styles.pillText, m.valueType === 'number' && styles.pillTextActive]}>🔢 Number</Text>
                  </TouchableOpacity>
                  {m.valueType === 'number' && (
                    <TextInput
                      style={[styles.input, styles.metricUnitInput]}
                      placeholder="unit (reps, lbs…)"
                      value={m.unit}
                      onChangeText={(v) => setMetrics((prev) => prev.map((row, idx) => (idx === i ? { ...row, unit: v } : row)))}
                    />
                  )}
                  <TouchableOpacity onPress={() => setMetrics((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Text style={styles.metricRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addMetricBtn}
              onPress={() => setMetrics((prev) => [...prev, { name: '', valueType: 'time', unit: '' }])}
            >
              <Text style={styles.addMetricBtnText}>+ Add a metric</Text>
            </TouchableOpacity>
          </>
        )}

        {tag && showDisclaimer && (
          <Text style={styles.disclaimer}>{INTEREST_CONFIG[tag].disclaimer}</Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Adding...' : 'Add Goal'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#2B1D14' },
  close: { fontSize: 20, color: '#7A6F63' },
  capBanner: { backgroundColor: '#fff7f0', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FF7A00' },
  capBannerText: { color: '#2B1D14', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: '#2B1D14', marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, fontSize: 15 },
  targetInput: { flex: 1 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  tagChipActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  tagChipText: { fontSize: 13, fontWeight: '600', color: '#7A6F63' },
  tagChipTextActive: { color: '#FF7A00' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  pillActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#7A6F63' },
  pillTextActive: { color: '#FF7A00' },
  durationCard: { flexBasis: '47%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', padding: 12, alignItems: 'center' },
  durationCardActive: { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.08)' },
  durationValue: { fontSize: 15, fontWeight: '700', color: '#2B1D14' },
  durationValueActive: { color: '#FF7A00' },
  durationBadge: { fontSize: 10, fontWeight: '600', color: '#7A6F63', marginTop: 4, textAlign: 'center' },
  durationBadgeActive: { color: '#E06400' },
  hint: { fontSize: 12, color: '#7A6F63', marginTop: 8, fontStyle: 'italic' },
  presetBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,122,0,0.08)', borderRadius: 999, borderWidth: 1.5, borderColor: '#FF7A00', paddingVertical: 8, paddingHorizontal: 14, marginTop: 10, marginBottom: 4 },
  presetBtnText: { color: '#E06400', fontSize: 13, fontWeight: '700' },
  metricRow: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginTop: 10 },
  metricNameInput: { marginBottom: 8 },
  metricTypeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  metricUnitInput: { flex: 1, paddingVertical: 8 },
  metricRemove: { fontSize: 16, color: '#7A6F63', paddingHorizontal: 6, paddingVertical: 8 },
  addMetricBtn: { alignSelf: 'flex-start', marginTop: 10 },
  addMetricBtnText: { color: '#FF7A00', fontSize: 13, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#7A6F63', marginTop: 14, lineHeight: 16 },
  error: { color: '#dc2626', fontSize: 13, marginTop: 12 },
  submitBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
