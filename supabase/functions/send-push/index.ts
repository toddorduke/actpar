import { createClient } from 'jsr:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = 'mailto:hello@actpar.com';

// Minimal Web Push implementation using VAPID
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const { endpoint, p256dh, auth } = subscription;

  // Import VAPID keys
  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);
  const publicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, ['deriveKey', 'deriveBits']
  ).catch(() =>
    crypto.subtle.importKey(
      'pkcs8', privateKeyBytes,
      { name: 'ECDH', namedCurve: 'P-256' },
      false, ['deriveKey', 'deriveBits']
    )
  );

  // Build VAPID JWT
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;
  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = base64UrlEncode(JSON.stringify({ aud: audience, exp: expiry, sub: VAPID_SUBJECT }));
  const signingKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(`${header}.${claims}`)
  );
  const jwt = `${header}.${claims}.${base64UrlEncode(sig)}`;

  const vapidAuth = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

  // Encrypt payload using Web Push encryption (RFC 8291)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const clientPublicKey = await crypto.subtle.importKey('raw', base64UrlDecode(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []);

  const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, 256);
  const authBytes = base64UrlDecode(auth);

  // HKDF for content encryption key and nonce
  const prk = await hkdf(sharedSecret, authBytes, 'Content-Encoding: auth\0', 32);
  const cek = await hkdf(await concatArrays(prk, serverPublicKeyRaw, base64UrlDecode(p256dh)), salt, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = await hkdf(await concatArrays(prk, serverPublicKeyRaw, base64UrlDecode(p256dh)), salt, 'Content-Encoding: nonce\0', 12);

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const encoded = new TextEncoder().encode(payload);
  const padded = new Uint8Array(encoded.length + 2);
  padded.set(encoded);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, padded);

  // Build header (RFC 8291 §2)
  const header2 = new Uint8Array(21 + serverPublicKeyRaw.byteLength);
  header2.set(salt);
  new DataView(header2.buffer).setUint32(16, 4096, false);
  header2[20] = serverPublicKeyRaw.byteLength;
  header2.set(new Uint8Array(serverPublicKeyRaw), 21);
  const body = await concatBytes(header2, new Uint8Array(encrypted));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': vapidAuth,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body,
  });
  return res.status;
}

// ── helpers ──────────────────────────────────────────────────────────────────

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

async function concatArrays(...arrays: (ArrayBuffer | Uint8Array)[]): Promise<ArrayBuffer> {
  return concatBytes(...arrays.map((a) => a instanceof Uint8Array ? a : new Uint8Array(a)));
}

async function concatBytes(...arrays: Uint8Array[]): Promise<Uint8Array> {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { record } = await req.json();
  if (!record?.user_id) return new Response('Missing user_id', { status: 400 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', record.user_id);

  if (!subs?.length) return new Response('No subscriptions', { status: 200 });

  const payload = JSON.stringify({
    title: 'ActPar',
    body: record.body ?? 'You have a new notification.',
    url: '/',
  });

  await Promise.allSettled(subs.map((sub) => sendWebPush(sub, payload)));

  return new Response('Sent', { status: 200 });
});
