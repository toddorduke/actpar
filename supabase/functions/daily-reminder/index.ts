import { createClient } from 'jsr:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = 'mailto:hello@actpar.com';

// ── Web Push helpers (RFC 8291 / VAPID) ──────────────────────────────────────

function base64UrlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function base64UrlEncode(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hkdf(secret: ArrayBuffer | Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(info) },
    keyMaterial, length * 8
  );
  return new Uint8Array(bits);
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const { endpoint, p256dh, auth } = sub;

  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);
  const publicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits']
  ).catch(() =>
    crypto.subtle.importKey('pkcs8', privateKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits'])
  );
  void privateKey; // used in deriveBits below

  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;
  const hdr = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = base64UrlEncode(JSON.stringify({ aud: audience, exp: expiry, sub: VAPID_SUBJECT }));
  const signingKey = await crypto.subtle.importKey(
    'raw', base64UrlDecode(VAPID_PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, new TextEncoder().encode(`${hdr}.${claims}`));
  const jwt = `${hdr}.${claims}.${base64UrlEncode(sig)}`;
  const vapidAuth = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  const serverPubRaw = await crypto.subtle.exportKey('raw', serverKP.publicKey);
  const clientPub = await crypto.subtle.importKey('raw', base64UrlDecode(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPub }, serverKP.privateKey, 256);
  const authBytes = base64UrlDecode(auth);
  const prk = await hkdf(sharedSecret, authBytes, 'Content-Encoding: auth\0', 32);
  const keyInfo = concatBytes(new Uint8Array(prk), new Uint8Array(serverPubRaw), base64UrlDecode(p256dh));
  const cek = await hkdf(keyInfo, salt, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = await hkdf(keyInfo, salt, 'Content-Encoding: nonce\0', 12);

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const encoded = new TextEncoder().encode(payload);
  const padded = new Uint8Array(encoded.length + 2);
  padded.set(encoded);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, padded);

  const header = new Uint8Array(21 + serverPubRaw.byteLength);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = serverPubRaw.byteLength;
  header.set(new Uint8Array(serverPubRaw), 21);
  const body = concatBytes(header, new Uint8Array(encrypted));

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
}

// ── Adaptive message builder ──────────────────────────────────────────────────

type Goal = { title: string; day_count: number; category?: string | null };

function buildMessage(firstName: string, goal: Goal, missedYesterday: boolean): string {
  const name = firstName || 'there';
  const { title, day_count, category } = goal;
  const streak = day_count ?? 0;
  const cat = (category ?? '').toLowerCase();

  const isSobriety = ['sobriety', 'recovery', 'mental health', 'sobriety'].some(k => cat.includes(k));
  const isFaith    = ['faith', 'church', 'meditation', 'prayer', 'spiritual'].some(k => cat.includes(k));
  const isFitness  = ['fitness', 'nutrition', 'sleep', 'health', 'workout'].some(k => cat.includes(k));
  const isFinance  = ['finance', 'career', 'education', 'reading'].some(k => cat.includes(k));

  if (missedYesterday) {
    if (isSobriety) return `Hey ${name} — yesterday happened. Today is a new day. Log "${title}" and keep moving forward.`;
    if (isFaith)    return `Hey ${name} — grace covers yesterday. Today's commitment is what matters. Log "${title}".`;
    return `Hey ${name} — you missed yesterday. Today is your reset. Log "${title}" and get back on track.`;
  }

  if (streak === 0) {
    return `Hey ${name} — day one starts right now. Log "${title}" and start your streak.`;
  }

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

  if (streak < 90) {
    return `${streak} days, ${name}. Almost at 90. Log "${title}" — you don't come this far to only come this far.`;
  }

  return `${streak} days, ${name}. This is what elite consistency looks like. Log "${title}" and keep going.`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const currentUtcHour = new Date().getUTCHours();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  const { data: candidates, error: profileErr } = await supabase
    .from('profiles')
    .select('id, first_name, notification_prefs, push_subscriptions(endpoint, p256dh, auth)')
    .filter('notification_prefs->>daily_reminder', 'eq', 'true')
    .filter('notification_prefs->>reminder_utc_hour', 'eq', String(currentUtcHour));

  if (profileErr) {
    console.error('Profile query error:', profileErr.message);
    return new Response('DB error', { status: 500 });
  }

  if (!candidates?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no candidates' }), { status: 200 });
  }

  let sent = 0;
  let skipped = 0;

  for (const user of candidates) {
    const prefs = (user as { notification_prefs?: Record<string, unknown> }).notification_prefs ?? {};
    const subs = (user as { push_subscriptions: { endpoint: string; p256dh: string; auth: string }[] }).push_subscriptions;
    if (!subs?.length) { skipped++; continue; }

    // Get unchecked habit goals with category + streak info
    const { data: unchecked } = await supabase
      .from('goals')
      .select('id, title, day_count, category')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .neq('goal_type', 'numeric')
      .or(`last_checked_in.is.null,last_checked_in.lt.${today}`)
      .order('tier', { ascending: true })
      .limit(1);

    if (!unchecked?.length) { skipped++; continue; }

    // Check if they missed yesterday (look at checkin_logs)
    const { data: yesterdayLog } = await supabase
      .from('checkin_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('checked_in_at', `${yesterday}T00:00:00Z`)
      .lt('checked_in_at', `${today}T00:00:00Z`)
      .limit(1);

    const missedYesterday = !yesterdayLog?.length;
    const firstName = (user as { first_name?: string }).first_name ?? '';
    const goal = unchecked[0] as Goal;

    const autoCheckin = prefs.auto_checkin === true;
    const url = autoCheckin ? '/?auto-checkin=true' : '/';

    const body = buildMessage(firstName, goal, missedYesterday);

    const payload = JSON.stringify({
      title: autoCheckin ? 'Tap to log your goals ⚡' : 'Time to check in',
      body,
      url,
    });

    const results = await Promise.allSettled(subs.map((s) => sendWebPush(s, payload)));
    const anySuccess = results.some((r) => r.status === 'fulfilled' && (r.value === 200 || r.value === 201));
    if (anySuccess) sent++;
  }

  return new Response(JSON.stringify({ sent, skipped, hour: currentUtcHour }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
