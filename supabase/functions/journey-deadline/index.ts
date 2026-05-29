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

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<number> {
  try {
    const { endpoint, p256dh, auth } = sub;

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
        .from('checkin_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('checked_in_at', `${today}T00:00:00Z`)
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
          .from('goals')
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

      const results = await Promise.allSettled(
        subs.map((s) => sendWebPush(s, payload).then((status) => ({ status, endpoint: s.endpoint }))),
      );

      let anySent = false;
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.status === 200 || r.value.status === 201) {
            anySent = true;
          } else if (r.value.status === 410 || r.value.status === 404) {
            staleEndpoints.push(r.value.endpoint);
          }
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
