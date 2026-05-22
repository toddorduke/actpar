import { createClient } from 'jsr:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const VAPID_SUBJECT     = 'mailto:hello@actpar.com';

// ── Web Push (RFC 8291 / VAPID) ───────────────────────────────────────────────

function b64uDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64uEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hkdf(secret: ArrayBuffer | Uint8Array, salt: Uint8Array, info: string, len: number): Promise<Uint8Array> {
  const km = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(info) },
    km, len * 8,
  );
  return new Uint8Array(bits);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

// Returns HTTP status, or -1 on network error.
async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<number> {
  try {
    const { endpoint, p256dh, auth } = sub;

    // VAPID JWT
    const url      = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const expiry   = Math.floor(Date.now() / 1000) + 12 * 3600;
    const hdr      = b64uEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const claims   = b64uEncode(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: expiry, sub: VAPID_SUBJECT })));
    const sigKey   = await crypto.subtle.importKey(
      'raw', b64uDecode(VAPID_PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' }, sigKey, new TextEncoder().encode(`${hdr}.${claims}`),
    );
    const jwt       = `${hdr}.${claims}.${b64uEncode(sig)}`;
    const vapidAuth = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

    // Encrypt payload (RFC 8291 aes128gcm)
    const salt     = crypto.getRandomValues(new Uint8Array(16));
    const serverKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey));
    const clientPub = await crypto.subtle.importKey('raw', b64uDecode(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const shared    = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPub }, serverKP.privateKey, 256);
    const authBytes = b64uDecode(auth);

    const prk   = await hkdf(shared, authBytes, 'Content-Encoding: auth\0', 32);
    const keyInfo = concat(prk, serverPub, b64uDecode(p256dh));
    const cek   = await hkdf(keyInfo, salt, 'Content-Encoding: aes128gcm\0', 16);
    const nonce = await hkdf(keyInfo, salt, 'Content-Encoding: nonce\0', 12);

    const aesKey  = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
    const encoded = new TextEncoder().encode(payload);
    const padded  = new Uint8Array(encoded.length + 2);
    padded.set(encoded);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded);

    const recordHeader = new Uint8Array(21 + serverPub.byteLength);
    recordHeader.set(salt);
    new DataView(recordHeader.buffer).setUint32(16, 4096, false);
    recordHeader[20] = serverPub.byteLength;
    recordHeader.set(serverPub, 21);
    const body = concat(recordHeader, new Uint8Array(encrypted));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuth,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
      },
      body,
    });
    return res.status;
  } catch {
    return -1;
  }
}

// ── Adaptive message builder ──────────────────────────────────────────────────

type Goal = { title: string; day_count: number; category?: string | null };

function buildMessage(firstName: string, goal: Goal, missedYesterday: boolean): string {
  const name   = firstName || 'there';
  const { title, day_count, category } = goal;
  const streak = day_count ?? 0;
  const cat    = (category ?? '').toLowerCase();

  const isSobriety = ['sobriety', 'recovery', 'mental health'].some(k => cat.includes(k));
  const isFaith    = ['faith', 'church', 'meditation', 'prayer', 'spiritual'].some(k => cat.includes(k));
  const isFitness  = ['fitness', 'nutrition', 'sleep', 'health', 'workout'].some(k => cat.includes(k));
  const isFinance  = ['finance', 'career', 'education', 'reading'].some(k => cat.includes(k));

  if (missedYesterday) {
    if (isSobriety) return `Hey ${name} — yesterday happened. Today is a new day. Log "${title}" and keep moving forward.`;
    if (isFaith)    return `Hey ${name} — grace covers yesterday. Today's commitment is what matters. Log "${title}".`;
    return `Hey ${name} — you missed yesterday. Today is your reset. Log "${title}" and get back on track.`;
  }
  if (streak === 0) return `Hey ${name} — day one starts right now. Log "${title}" and start your streak.`;
  if (streak < 7) {
    if (isSobriety) return `${streak} day${streak !== 1 ? 's' : ''} strong, ${name}. Log "${title}" — you're doing the hard work.`;
    if (isFaith)    return `Day ${streak + 1}, ${name}. Stay committed to "${title}" — small steps build big faith.`;
    if (isFitness)  return `${streak} day${streak !== 1 ? 's' : ''} in, ${name}. Your body is adapting. Log "${title}" today.`;
    return `${streak} day${streak !== 1 ? 's' : ''} in, ${name}. Keep the momentum — log "${title}" today.`;
  }
  if (streak < 30) {
    if (isSobriety) return `${streak} days of strength, ${name}. Log "${title}" — this is real progress.`;
    if (isFaith)    return `${streak} days, ${name}. Your consistency is building something. Don't miss "${title}" today.`;
    if (isFinance)  return `${streak} days, ${name}. Discipline compounds — log "${title}" and keep building.`;
    return `${streak} days strong, ${name}. Log "${title}" before the day gets away from you.`;
  }
  if (streak < 60) {
    if (isSobriety) return `${streak} days, ${name}. That's real. Log "${title}" — every day you choose this matters.`;
    return `${streak} days, ${name}. You're in rare territory. Log "${title}" — this streak is worth protecting.`;
  }
  if (streak < 90) return `${streak} days, ${name}. Almost at 90. Log "${title}" — you don't come this far to only come this far.`;
  return `${streak} days, ${name}. This is what elite consistency looks like. Log "${title}" and keep going.`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
  const yesterday      = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  // Step 1: find users whose reminder fires this UTC hour
  const { data: candidates, error: profileErr } = await supabase
    .from('profiles')
    .select('id, first_name, notification_prefs')
    .filter('notification_prefs->>daily_reminder', 'eq', 'true')
    .filter('notification_prefs->>reminder_utc_hour', 'eq', String(currentUtcHour));

  if (profileErr) {
    console.error('Profile query error:', profileErr.message);
    return new Response('DB error', { status: 500 });
  }
  if (!candidates?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no candidates this hour' }), { status: 200 });
  }

  let sent = 0, skipped = 0;
  const staleEndpoints: string[] = [];

  for (const candidate of candidates) {
    const prefs = (candidate.notification_prefs ?? {}) as Record<string, unknown>;

    // Step 2: get their push subscriptions (separate query — avoids FK join ambiguity)
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', candidate.id);

    if (!subs?.length) {
      // Email fallback — fetch goal then call send-email
      try {
        const { data: emailGoal } = await supabase
          .from('goals')
          .select('id, title, day_count, category')
          .eq('user_id', candidate.id)
          .eq('is_active', true)
          .neq('goal_type', 'numeric')
          .or(`last_checked_in.is.null,last_checked_in.lt.${today}`)
          .order('tier', { ascending: true })
          .limit(1);
        if (emailGoal?.length) {
          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'daily_reminder',
              userId: candidate.id,
              firstName: candidate.first_name ?? '',
              message: buildMessage(candidate.first_name ?? '', emailGoal[0] as Goal, false),
            }),
          });
        }
      } catch { /* silent — push is primary */ }
      skipped++;
      continue;
    }

    // Step 3: find their highest-priority unchecked habit goal today
    const { data: unchecked } = await supabase
      .from('goals')
      .select('id, title, day_count, category')
      .eq('user_id', candidate.id)
      .eq('is_active', true)
      .neq('goal_type', 'numeric')
      .or(`last_checked_in.is.null,last_checked_in.lt.${today}`)
      .order('tier', { ascending: true })
      .limit(1);

    if (!unchecked?.length) { skipped++; continue; }

    // Step 4: did they check in at all yesterday?
    const { data: yesterdayLog } = await supabase
      .from('checkin_logs')
      .select('id')
      .eq('user_id', candidate.id)
      .gte('checked_in_at', `${yesterday}T00:00:00Z`)
      .lt('checked_in_at', `${today}T00:00:00Z`)
      .limit(1);

    const missedYesterday = !yesterdayLog?.length;
    const goal = unchecked[0] as Goal;
    const firstName = (candidate.first_name as string) ?? '';
    const autoCheckin = prefs.auto_checkin === true;

    const payload = JSON.stringify({
      title: autoCheckin ? 'Tap to log your goals ⚡' : 'Time to check in',
      body: buildMessage(firstName, goal, missedYesterday),
      url: autoCheckin ? '/?auto-checkin=true' : '/',
    });

    // Step 5: send to all their devices, collect stale endpoints
    const results = await Promise.allSettled(
      subs.map((s) => sendWebPush(s, payload).then((status) => ({ status, endpoint: s.endpoint }))),
    );

    let anySent = false;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.status === 200 || r.value.status === 201) {
          anySent = true;
        } else if (r.value.status === 410 || r.value.status === 404) {
          // Subscription expired — queue for deletion
          staleEndpoints.push(r.value.endpoint);
        }
      }
    }
    if (anySent) sent++;
  }

  // Clean up expired subscriptions in one batch
  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    console.log(`Deleted ${staleEndpoints.length} stale subscription(s)`);
  }

  return new Response(
    JSON.stringify({ sent, skipped, hour: currentUtcHour, staleDeleted: staleEndpoints.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
