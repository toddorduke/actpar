import { createClient } from 'npm:@supabase/supabase-js@2';
import webPush from 'npm:web-push@3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

webPush.setVapidDetails(
  'mailto:' + Deno.env.get('VAPID_SUBJECT'),
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async () => {
  try {
    const currentUtcHour = new Date().getUTCHours();
    const todayStr = new Date().toISOString().split('T')[0];

    // Find all active goals due for a reminder that haven't been checked in today
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, day_count, user_id')
      .eq('reminder_utc_hour', currentUtcHour)
      .eq('is_active', true)
      .neq('last_checked_in', todayStr);

    if (goalsError) throw goalsError;
    if (!goals?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    const userIds = [...new Set(goals.map((g) => g.user_id))];

    // Get push subscriptions for those users
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (subError) throw subError;

    const subsByUser = new Map<string, typeof subs>();
    for (const sub of subs ?? []) {
      if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, []);
      subsByUser.get(sub.user_id)!.push(sub);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const goal of goals) {
      const userSubs = subsByUser.get(goal.user_id);
      if (!userSubs?.length) continue;

      const streakMsg = goal.day_count > 0
        ? ` You're on a ${goal.day_count}-day streak — don't break it! 🔥`
        : '';

      const payload = JSON.stringify({
        title: 'ActPar — Time to check in 🎯',
        body: `"${goal.title}"${streakMsg}`,
        url: '/',
        goalId: goal.id,
      });

      for (const sub of userSubs) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${sub.endpoint.slice(-10)}: ${msg}`);
          // Remove stale subscriptions (410 = Gone)
          if (msg.includes('410') || msg.includes('404')) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, goals: goals.length, errors }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
