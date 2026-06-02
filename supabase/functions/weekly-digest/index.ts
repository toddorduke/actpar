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
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all users with push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth');

    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    const userIds = [...new Set(subs.map((s) => s.user_id))];

    // Get all connections for these users
    const { data: connections } = await supabase
      .from('connections')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`);

    // Build a map of userId → connected user IDs
    const connMap = new Map<string, Set<string>>();
    for (const c of connections ?? []) {
      if (!connMap.has(c.requester_id)) connMap.set(c.requester_id, new Set());
      if (!connMap.has(c.receiver_id)) connMap.set(c.receiver_id, new Set());
      connMap.get(c.requester_id)!.add(c.receiver_id);
      connMap.get(c.receiver_id)!.add(c.requester_id);
    }

    // Get check-ins from the past week
    const { data: checkins } = await supabase
      .from('checkin_logs')
      .select('user_id, goal_id, checked_in_at, goals!checkin_logs_goal_id_fkey(title)')
      .gte('checked_in_at', weekAgo);

    // Get milestones (goals that hit a milestone day this week)
    const { data: milestoneGoals } = await supabase
      .from('goals')
      .select('user_id, title, day_count, profiles!goals_user_id_fkey(first_name, alter_ego_name)')
      .in('day_count', [7, 30, 60, 90])
      .gte('updated_at', weekAgo)
      .eq('is_active', true);

    // Build per-user check-in counts
    const checkinsByUser = new Map<string, number>();
    for (const c of checkins ?? []) {
      checkinsByUser.set(c.user_id, (checkinsByUser.get(c.user_id) ?? 0) + 1);
    }

    // Build milestone map
    const milestonesByUser = new Map<string, { title: string; days: number }[]>();
    for (const g of milestoneGoals ?? []) {
      if (!milestonesByUser.has(g.user_id)) milestonesByUser.set(g.user_id, []);
      milestonesByUser.get(g.user_id)!.push({ title: g.title, days: g.day_count });
    }

    // Get display names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, alter_ego_name')
      .in('id', [...connMap.keys()]);

    const nameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.alter_ego_name || p.first_name || 'Someone');
    }

    const subsByUser = new Map<string, typeof subs>();
    for (const sub of subs) {
      if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, []);
      subsByUser.get(sub.user_id)!.push(sub);
    }

    let sent = 0;

    for (const userId of userIds) {
      const circle = connMap.get(userId);
      if (!circle?.size) continue;

      const circleIds = [...circle];

      // Count circle activity this week
      const circleCheckins = circleIds.reduce((n, id) => n + (checkinsByUser.get(id) ?? 0), 0);
      const circleMilestones = circleIds.flatMap((id) => milestonesByUser.get(id) ?? []);

      if (circleCheckins === 0 && circleMilestones.length === 0) continue;

      // Build notification body
      const lines: string[] = [];

      if (circleMilestones.length > 0) {
        const m = circleMilestones[0];
        const name = nameMap.get(circleIds.find((id) => milestonesByUser.get(id)?.length)!) ?? 'Someone';
        lines.push(`🏆 ${name} hit a ${m.days}-day streak on "${m.title}"`);
      }

      if (circleCheckins > 0) {
        lines.push(`⚡ ${circleCheckins} check-in${circleCheckins !== 1 ? 's' : ''} from your circle this week`);
      }

      const body = lines.join(' · ');
      const payload = JSON.stringify({
        title: 'ActPar — Your weekly recap 🔥',
        body,
        url: '/',
      });

      const userSubs = subsByUser.get(userId) ?? [];
      for (const sub of userSubs) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('410') || msg.includes('404')) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
