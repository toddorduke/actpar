import { supabase } from './supabase.js';

export const XP_VALUES = {
  CHECKIN:         10,
  GOAL_CREATED:    50,
  SPARK_SENT:      25,
  JOURNEY_STARTED: 75,
  MILESTONE_7:     100,
  MILESTONE_30:    500,
  MILESTONE_60:    1500,
  MILESTONE_90:    3000,
};

export function milestoneXP(days) {
  return XP_VALUES[`MILESTONE_${days}`] ?? 0;
}

export async function awardXP(userId, amount) {
  if (!userId || !amount) return;
  await supabase.rpc('add_xp', { uid: userId, xp_amount: amount });
}
