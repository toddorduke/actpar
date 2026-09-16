import { createClient } from 'jsr:@supabase/supabase-js@2';
import webPush from 'npm:web-push@3';

// Adaptive check-in reminders: up to 3 spaced reminders/day per user,
// auto-spaced from a single chosen start hour (not 3 manually-picked
// times). Each reminder queries what's still unchecked *at that moment*
// and only mentions those goals; the sequence stops firing early once
// everything's done for the day. Runs on the same hourly cron as before
// (daily-reminder-hourly, 0 * * * *) -- no schedule change needed, this
// function just decides per-user whether *this* hour is their next slot.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const MAX_REMINDERS_PER_DAY = 3;
const REMINDER_SPACING_HOURS = 5; // e.g. start=9am -> slots at 9am/2pm/7pm UTC-offset-adjusted by the user's own hour choice

webPush.setVapidDetails(
  'mailto:hello@actpar.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

type Goal = { id: string; title: string; day_count: number; tag?: string | null };

function buildMessage(firstName: string, goals: Goal[], missedYesterday: boolean): string {
  const name = firstName || 'there';
  const primary = goals[0];
  const streak = primary.day_count ?? 0;
  const cat = (primary.tag ?? '').toLowerCase();
  const others = goals.length - 1;
  const suffix = others > 0 ? ` (+${others} more)` : '';

  const isSobriety = cat.includes('sobriety');
  const isFaith = cat.includes('faith');
  const isFitness = cat.includes('fitness');
  const isFinance = cat.includes('finance') || cat.includes('career');

  if (missedYesterday) {
    if (isSobriety) return `Hey ${name} — yesterday happened. Today is a new day. Log "${primary.title}"${suffix} and keep moving forward.`;
    if (isFaith)    return `Hey ${name} — grace covers yesterday. Today's commitment is what matters. Log "${primary.title}"${suffix}.`;
    return `Hey ${name} — you missed yesterday. Today is your reset. Log "${primary.title}"${suffix} and get back on track.`;
  }
  if (streak === 0) return `Hey ${name} — day one starts right now. Log "${primary.title}"${suffix} and start your streak.`;
  if (streak < 7) {
    if (isSobriety) return `${streak} day${streak !== 1 ? 's' : ''} strong, ${name}. Log "${primary.title}"${suffix} — you're doing the hard work.`;
    if (isFaith)    return `Day ${streak + 1}, ${name}. Stay committed to "${primary.title}"${suffix} — small steps build big faith.`;
    if (isFitness)  return `${streak} day${streak !== 1 ? 's' : ''} in, ${name}. Your body is adapting. Log "${primary.title}"${suffix} today.`;
    return `${streak} day${streak !== 1 ? 's' : ''} in, ${name}. Keep the momentum — log "${primary.title}"${suffix} today.`;
  }
  if (streak < 30) {
    if (isSobriety) return `${streak} days of strength, ${name}. Log "${primary.title}"${suffix} — this is real progress.`;
    if (isFaith)    return `${streak} days, ${name}. Your consistency is building something. Don't miss "${primary.title}"${suffix} today.`;
    if (isFinance)  return `${streak} days, ${name}. Discipline compounds — log "${primary.title}"${suffix} and keep building.`;
    return `${streak} days strong, ${name}. Log "${primary.title}"${suffix} before the day gets away from you.`;
  }
  if (streak < 60) {
    if (isSobriety) return `${streak} days, ${name}. That's real. Log "${primary.title}"${suffix} — every day you choose this matters.`;
    return `${streak} days, ${name}. You're in rare territory. Log "${primary.title}"${suffix} — this streak is worth protecting.`;
  }
  if (streak < 90) return `${streak} days, ${name}. Almost at 90. Log "${primary.title}"${suffix} — you don't come this far to only come this far.`;
  return `${streak} days, ${name}. This is what elite consistency looks like. Log "${primary.title}"${suffix} and keep going.`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  const { data: candidates, error: profileErr } = await supabase
    .from('profiles')
    .select('id, first_name, notification_prefs, reminder_count_today, reminder_count_date')
    .filter('notification_prefs->>daily_reminder', 'eq', 'true')
    .not('notification_prefs->>reminder_utc_hour', 'is', null);

  if (profileErr) {
    console.error('Profile query error:', profileErr.message);
    return new Response('DB error', { status: 500 });
  }
  if (!candidates?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no candidates' }), { status: 200 });
  }

  let sent = 0, skipped = 0, completedEarly = 0;
  const staleEndpoints: string[] = [];

  for (const candidate of candidates) {
    const prefs = (candidate.notification_prefs ?? {}) as Record<string, unknown>;
    const startHour = Number(prefs.reminder_utc_hour);
    if (Number.isNaN(startHour)) { skipped++; continue; }

    // Reset the daily counter if this is candidate's first reminder-eligible
    // moment we've seen today (their last recorded count was for an earlier date).
    const countToday = candidate.reminder_count_date === today ? (candidate.reminder_count_today ?? 0) : 0;
    if (countToday >= MAX_REMINDERS_PER_DAY) { skipped++; continue; }

    // Is *this* hour this candidate's next reminder slot?
    const expectedHour = (startHour + countToday * REMINDER_SPACING_HOURS) % 24;
    if (expectedHour !== currentUtcHour) { skipped++; continue; }

    // What's still unchecked right now? Only habit goals -- numeric goals
    // use goal_progress_v2 and a different "done for today" concept.
    const { data: unchecked } = await supabase
      .from('goals_v2')
      .select('id, title, day_count, tag')
      .eq('user_id', candidate.id)
      .eq('status', 'active')
      .neq('goal_type', 'numeric')
      .or(`last_checked_in.is.null,last_checked_in.lt.${today}`)
      .order('tier', { ascending: true });

    if (!unchecked?.length) {
      // Nothing outstanding for today -- stop firing further reminders
      // rather than nagging about goals already checked in.
      await supabase.from('profiles')
        .update({ reminder_count_today: MAX_REMINDERS_PER_DAY, reminder_count_date: today })
        .eq('id', candidate.id);
      completedEarly++;
      continue;
    }

    const firstName = (candidate.first_name as string) ?? '';
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', candidate.id);

    if (!subs?.length) {
      // Email fallback for users without a push subscription.
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'daily_reminder',
            userId: candidate.id,
            firstName,
            message: buildMessage(firstName, unchecked as Goal[], false),
          }),
        });
      } catch { /* silent -- push is primary */ }
      await supabase.from('profiles')
        .update({ reminder_count_today: countToday + 1, reminder_count_date: today })
        .eq('id', candidate.id);
      skipped++;
      continue;
    }

    // Did they check in on anything at all yesterday?
    const { data: yesterdayCheckin } = await supabase
      .from('goal_checkins_v2')
      .select('id')
      .eq('user_id', candidate.id)
      .eq('date', yesterday)
      .eq('done', true)
      .limit(1);
    const missedYesterday = !yesterdayCheckin?.length;

    const payload = JSON.stringify({
      title: 'Time to check in',
      body: buildMessage(firstName, unchecked as Goal[], missedYesterday),
      url: '/',
    });

    let anySent = false;
    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        anySent = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('410') || msg.includes('404')) staleEndpoints.push(sub.endpoint);
      }
    }
    if (anySent) sent++;

    await supabase.from('profiles')
      .update({ reminder_count_today: countToday + 1, reminder_count_date: today })
      .eq('id', candidate.id);
  }

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
  }

  return new Response(
    JSON.stringify({ sent, skipped, completedEarly, hour: currentUtcHour, staleDeleted: staleEndpoints.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
