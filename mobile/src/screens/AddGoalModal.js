import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { INTEREST_TAGS, INTEREST_CONFIG, DISCLAIMER_TAGS, CUSTOM_TAG_DEFAULTS } from '../lib/contentSources';
import { DURATION_OPTIONS, getDurationBadge, durationLabel } from '../lib/goalDurations';

const FREQUENCIES = [
  ['daily', 'Daily'],
  ['3x_week', '3x / week'],
  ['weekly', 'Weekly'],
];

export default function AddGoalModal({ visible, onClose, onCreate, atCap, isPremium }) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [durationDays, setDurationDays] = useState(undefined); // undefined = not yet set
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function selectTag(t) {
    setTag(t);
    const config = t === 'custom' ? CUSTOM_TAG_DEFAULTS : INTEREST_CONFIG[t];
    setFrequency(config.defaultFrequency);
    setDurationDays(config.defaultDuration);
  }

  function reset() {
    setTitle(''); setTag(null); setFrequency(null); setDurationDays(undefined); setError(null);
  }

  async function handleSubmit() {
    if (!title.trim() || !tag || !frequency) return;
    setSubmitting(true);
    setError(null);
    const { error: createError } = await onCreate({ title: title.trim(), tag, frequency, durationDays });
    setSubmitting(false);
    if (createError?.code === 'CAP_REACHED') {
      setError(
        isPremium
          ? "You've hit your active goal limit. Finish or pause one to add another."
          : "You've got as many active goals as your plan allows. Finish or pause one to add another, or upgrade for more."
      );
      return;
    }
    if (createError) { setError(createError.message ?? 'Something went wrong.'); return; }
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

        <Text style={styles.label}>What's the goal?</Text>
        <TextInput style={styles.input} placeholder="e.g. Walk 20 minutes" value={title} onChangeText={setTitle} />

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

        {tag && (
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

            {showDisclaimer && (
              <Text style={styles.disclaimer}>{INTEREST_CONFIG[tag].disclaimer}</Text>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, (!title.trim() || !tag) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!title.trim() || !tag || submitting}
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
  disclaimer: { fontSize: 11, color: '#7A6F63', marginTop: 14, lineHeight: 16 },
  error: { color: '#dc2626', fontSize: 13, marginTop: 12 },
  submitBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
