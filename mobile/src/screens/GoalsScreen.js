import React, { useContext, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useGoalsV2 } from '../hooks/useGoalsV2';
import { useGoalProgressV2 } from '../hooks/useGoalProgressV2';
import { INTEREST_CONFIG } from '../lib/contentSources';
import { durationLabel } from '../lib/goalDurations';
import AddGoalModal from './AddGoalModal';
import EditGoalModal from './EditGoalModal';
import GoalEndPromptModal from './GoalEndPromptModal';
import NudgeModal from '../components/NudgeModal';
import ConfirmModal from '../components/ConfirmModal';
import { getLiveStreak } from '../lib/streak';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tagLabel(tag) {
  return tag === 'custom' ? 'Custom' : (INTEREST_CONFIG[tag]?.label ?? tag);
}

export default function GoalsScreen() {
  const { session } = useContext(AuthContext);
  const userId = session?.user?.id;
  const {
    activeGoals, pausedGoals, completedGoals, checkinsByGoal,
    loading, isPremium, activeCap, atCap,
    createGoal, checkIn, pauseGoal, resumeGoal, completeGoal, archiveGoal, extendGoal, editGoal, refetch,
  } = useGoalsV2(userId);

  const numericGoals = useMemo(() => activeGoals.filter((g) => g.goal_type === 'numeric'), [activeGoals]);
  const { progressMap, logProgress } = useGoalProgressV2(userId, numericGoals);
  const [progressInputs, setProgressInputs] = useState({});

  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nudge, setNudge] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  async function handleLogProgress(goalId) {
    const value = parseFloat(progressInputs[goalId]);
    if (!value && value !== 0) return;
    const { error } = await logProgress(goalId, value);
    if (!error) setProgressInputs((prev) => ({ ...prev, [goalId]: '' }));
  }

  const endedGoal = useMemo(() => {
    const today = todayStr();
    return activeGoals.find((g) => g.ends_at && g.ends_at.slice(0, 10) <= today) ?? null;
  }, [activeGoals]);

  const endedGoalStats = useMemo(() => {
    if (!endedGoal) return null;
    const checkins = checkinsByGoal[endedGoal.id] ?? [];
    const doneCount = checkins.filter((c) => c.done).length;
    const daysElapsed = Math.max(1, Math.round((Date.now() - new Date(endedGoal.created_at)) / 86400000));
    const rate = doneCount / daysElapsed;
    return { rate, wasSuccessful: rate >= 0.5 };
  }, [endedGoal, checkinsByGoal]);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate(payload) {
    return createGoal(payload);
  }

  async function handleEditSave(updates) {
    const goalId = editingGoal.id;
    setEditingGoal(null);
    const { recentEditCount, error } = await editGoal(goalId, updates);
    if (error) { setNudge({ title: 'Error', message: error.message ?? 'Could not save changes.' }); return; }
    if (recentEditCount >= 3) {
      setNudge({
        title: 'Just checking in',
        message: "You've switched this goal a few times — want to talk it through with your AP?",
      });
    }
  }

  function isCheckedInToday(goalId) {
    const checkins = checkinsByGoal[goalId] ?? [];
    return checkins.some((c) => c.date === todayStr() && c.done);
  }

  function confirmArchive(goalId) {
    setArchiveTarget(goalId);
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your Goals</Text>
        <Text style={styles.capLabel}>{activeGoals.length}/{activeCap} active</Text>
      </View>

      {atCap ? (
        isPremium ? (
          <View style={styles.capBanner}>
            <Text style={styles.capBannerText}>{`You've got ${activeGoals.length} active. Finish or pause one to add another.`}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => setShowUpgradeNudge(true)}>
            <Text style={styles.upgradeBannerText}>You're at your free plan's limit. Upgrade to Member Pro for more active goals →</Text>
          </TouchableOpacity>
        )
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add Goal</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.framingCopy}>We limit goals on purpose. A few at a time is where people actually finish.</Text>

      {!loading && activeGoals.length === 0 && (
        <Text style={styles.empty}>No active goals yet — add one to get started.</Text>
      )}

      {activeGoals.map((goal) => {
        const isNumeric = goal.goal_type === 'numeric';
        const checkedIn = !isNumeric && isCheckedInToday(goal.id);
        const streak = isNumeric ? null : getLiveStreak(goal, todayStr());
        const progress = progressMap[goal.id];
        const total = progress?.total ?? 0;
        const pct = goal.target_value ? Math.min((total / goal.target_value) * 100, 100) : 0;

        return (
          <View key={goal.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardTag}>{tagLabel(goal.tag)}</Text>
            </View>

            {isNumeric ? (
              <>
                <Text style={styles.cardMeta}>
                  {total} / {goal.target_value} {goal.target_unit} ({goal.target_period === 'total' ? 'total' : goal.target_period === 'weekly' ? 'this week' : 'this month'})
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                </View>
                <View style={styles.progressLogRow}>
                  <TextInput
                    style={styles.progressInput}
                    value={progressInputs[goal.id] ?? ''}
                    onChangeText={(v) => setProgressInputs((prev) => ({ ...prev, [goal.id]: v }))}
                    placeholder={`Log ${goal.target_unit ?? ''}...`}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.logBtn} onPress={() => handleLogProgress(goal.id)}>
                    <Text style={styles.logBtnText}>Log</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardMeta}>
                  {goal.frequency === '3x_week' ? '3x / week' : goal.frequency} · {durationLabel(goal.duration_days)}
                </Text>
                {streak !== null && (
                  <View style={styles.streakRow}>
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={styles.streakCount}>{streak}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.actionRow}>
              {!isNumeric && (
                <TouchableOpacity
                  style={[styles.checkInBtn, checkedIn && styles.checkInBtnDone]}
                  onPress={() => checkIn(goal.id)}
                  disabled={checkedIn}
                >
                  <Text style={[styles.checkInBtnText, checkedIn && styles.checkInBtnTextDone]}>
                    {checkedIn ? '✓ Checked in' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setEditingGoal(goal)}><Text style={styles.actionLink}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pauseGoal(goal.id)}><Text style={styles.actionLink}>Pause</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => completeGoal(goal.id)}><Text style={styles.actionLink}>Complete</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmArchive(goal.id)}><Text style={styles.actionLinkDanger}>Archive</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}

      {pausedGoals.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Paused</Text>
          {pausedGoals.map((goal) => (
            <View key={goal.id} style={[styles.card, styles.cardMuted]}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardMeta}>Paused — auto-archives after 14 days</Text>
              <TouchableOpacity style={styles.resumeBtn} onPress={() => resumeGoal(goal.id)}>
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {completedGoals.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Completed</Text>
          {completedGoals.map((goal) => (
            <View key={goal.id} style={[styles.card, styles.cardMuted]}>
              <Text style={styles.cardTitle}>🏆 {goal.title}</Text>
            </View>
          ))}
        </>
      )}

      <AddGoalModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={handleCreate}
        atCap={atCap}
        isPremium={isPremium}
      />
      <EditGoalModal
        visible={!!editingGoal}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSave={handleEditSave}
      />
      <GoalEndPromptModal
        visible={!!endedGoal}
        goal={endedGoal}
        wasSuccessful={endedGoalStats?.wasSuccessful}
        onExtend={() => endedGoal && extendGoal(endedGoal.id, 30)}
        onStartNew={() => endedGoal && completeGoal(endedGoal.id).then(() => setShowAdd(true))}
        onRestart={() => endedGoal && extendGoal(endedGoal.id, endedGoal.duration_days ?? 30)}
        onShorten={() => endedGoal && extendGoal(endedGoal.id, 30)}
        onClose={() => endedGoal && archiveGoal(endedGoal.id)}
      />
      <NudgeModal
        visible={!!nudge}
        title={nudge?.title}
        message={nudge?.message}
        onClose={() => setNudge(null)}
      />
      <NudgeModal
        visible={showUpgradeNudge}
        title="Upgrade to Member Pro"
        message="Get up to 4 active goals at once."
        onClose={() => setShowUpgradeNudge(false)}
      />
      <ConfirmModal
        visible={!!archiveTarget}
        title="Archive goal?"
        message="This hides it from your active list but keeps it in your history."
        confirmLabel="Archive"
        destructive
        onConfirm={() => { archiveGoal(archiveTarget); setArchiveTarget(null); }}
        onCancel={() => setArchiveTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  header: { fontSize: 24, fontWeight: '800', color: '#2B1D14' },
  capLabel: { fontSize: 13, color: '#7A6F63', fontWeight: '600' },
  addBtn: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  capBanner: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', padding: 14, marginTop: 14 },
  capBannerText: { color: '#2B1D14', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  upgradeBanner: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 14, marginTop: 14 },
  upgradeBannerText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  framingCopy: { fontSize: 12, color: '#7A6F63', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#7A6F63', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardMuted: { opacity: 0.8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2B1D14', flex: 1 },
  cardTag: { fontSize: 11, fontWeight: '700', color: '#E06400', backgroundColor: 'rgba(255,122,0,0.08)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  cardMeta: { fontSize: 12, color: '#7A6F63', marginTop: 6 },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 10 },
  streakFire: { fontSize: 16 },
  streakCount: { fontSize: 20, fontWeight: '800', color: '#FF7A00' },
  streakLabel: { fontSize: 12, fontWeight: '600', color: '#7A6F63' },
  progressBarTrack: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 999, marginTop: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF7A00', borderRadius: 999 },
  progressLogRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  progressInput: { flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 },
  logBtn: { backgroundColor: '#FF7A00', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18, justifyContent: 'center' },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' },
  checkInBtn: { backgroundColor: '#FF7A00', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  checkInBtnDone: { backgroundColor: '#f3f4f6' },
  checkInBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  checkInBtnTextDone: { color: '#7A6F63' },
  actionLink: { color: '#7A6F63', fontSize: 12, fontWeight: '600' },
  actionLinkDanger: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#7A6F63', marginTop: 24, marginBottom: 4 },
  resumeBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgba(255,122,0,0.08)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  resumeBtnText: { color: '#FF7A00', fontWeight: '700', fontSize: 12 },
});
