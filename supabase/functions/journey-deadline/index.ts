import { createClient } from 'jsr:@supabase/supabase-js@2';
import webPush from 'npm:web-push@3';

// Same two bugs found and fixed elsewhere this session, both present here
// too: (1) stale goals/checkin_logs table refs from before the goals_v2
// migration -- this function has been silently finding "already checked
// in" false and "your goal" as the title for every partnership since then;
// (2) hand-rolled Web Push crypto using importKey('raw', ...) on an EC
// private key, which WebCrypto has never supported -- replaced with the
// proven npm:web-push library the other fixed functions already use.

webPush.setVapidDetails(
  'mailto:hello@actpar.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now            = new Date();
  const currentUtcHour = now.getUTCHours();
  const today          = now.toISOString().split('T')[0];

  // Find active partnerships whose deadline fires this UTC hour
  const { data: partnerships, error: pErr } = await supabase
    .from('partnerships')
    .select('id, requester_id, receiver_id, goal_id_1, goal_id_2, deadline_display')
    .eq('status', 'active')
    .eq('deadline_utc_hour', currentUtcHour);

  if (pErr) {
    console.error('Partnership query error:', pErr.message);
    return new Response('DB error', { status: 500 });
  }
  if (!partnerships?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no deadlines this hour' }), { status: 200 });
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const p of partnerships) {
    const sides = [
      { userId: p.requester_id, goalId: p.goal_id_1 },
      { userId: p.receiver_id,  goalId: p.goal_id_2  },
    ];

    for (const { userId, goalId } of sides) {
      if (!userId) continue;

      // Check if they've already logged today
      const checkinQuery = supabase
        .from('goal_checkins_v2')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('done', true)
        .limit(1);

      if (goalId) checkinQuery.eq('goal_id', goalId);

      const { data: todayLog } = await checkinQuery;
      if (todayLog?.length) continue; // already checked in — skip

      // Fetch their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', userId)
        .single();

      // Fetch goal title
      let goalTitle = 'your goal';
      if (goalId) {
        const { data: goal } = await supabase
          .from('goals_v2')
          .select('title')
          .eq('id', goalId)
          .single();
        if (goal?.title) goalTitle = goal.title;
      }

      const firstName      = profile?.first_name ?? 'Hey';
      const deadlineDisplay = p.deadline_display ?? 'today';
      const notifBody      = `${firstName}, the ${deadlineDisplay} deadline is here — log "${goalTitle}" before the day's over. Your partner is counting on you 🤝`;

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id:  userId,
        actor_id: userId,
        type:     'journey_nudge',
        ref_id:   p.id,
        body:     notifBody,
      });

      // Push notification
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

      if (!subs?.length) continue;

      const payload = JSON.stringify({
        title: '⏰ Journey Check-in Deadline',
        body:  notifBody,
        url:   '/',
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
    }
  }

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    console.log(`Deleted ${staleEndpoints.length} stale subscription(s)`);
  }

  return new Response(
    JSON.stringify({ sent, hour: currentUtcHour, partnerships: partnerships.length, staleDeleted: staleEndpoints.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
