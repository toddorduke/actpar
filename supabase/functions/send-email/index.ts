import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = 'ActPar <noreply@mail.actpar.com>';
const APP_URL = 'https://www.actpar.com';

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) {
    console.error('sendEmail failed:', e);
    return false;
  }
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:520px;background:#1a1a2e;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 32px 24px;border-bottom:1px solid rgba(245,158,11,0.2);">
            <span style="font-size:22px;font-weight:800;color:#f59e0b;letter-spacing:-0.5px;">ActPar</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;">
              You're receiving this because you have an ActPar account.<br>
              <a href="${APP_URL}/settings" style="color:rgba(245,158,11,0.6);text-decoration:none;">Manage notifications</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#f59e0b;color:#000;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

function buildSparkHtml(senderName: string, sparkMessage: string | null): string {
  const msg = sparkMessage
    ? `<p style="margin:16px 0 0;padding:16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;color:rgba(255,255,255,0.85);font-size:15px;font-style:italic;">"${sparkMessage}"</p>`
    : '';
  return emailWrapper(`
    <p style="margin:0 0 8px;font-size:26px;">⚡</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">${senderName} sent you a spark</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">They want to connect with you on ActPar. Check out their profile and decide if you're in.</p>
    ${msg}
    ${ctaButton('View Spark', `${APP_URL}/connections`)}
  `);
}

function buildMatchHtml(otherName: string): string {
  return emailWrapper(`
    <p style="margin:0 0 8px;font-size:26px;">⚡</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">You're connected with ${otherName}!</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">You can now message each other and cheer each other on.</p>
    ${ctaButton('Send a Message', `${APP_URL}/connections`)}
  `);
}

function buildMessageHtml(senderName: string, preview: string): string {
  return emailWrapper(`
    <p style="margin:0 0 8px;font-size:26px;">💬</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">New message from ${senderName}</h1>
    <p style="margin:16px 0 0;padding:16px;background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;">${preview}</p>
    ${ctaButton('Reply', `${APP_URL}/messages`)}
  `);
}

function buildReminderHtml(firstName: string, message: string): string {
  const name = firstName || 'there';
  return emailWrapper(`
    <p style="margin:0 0 8px;font-size:26px;">🔥</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Daily check-in, ${name}</h1>
    <p style="margin:12px 0 0;font-size:16px;color:rgba(255,255,255,0.75);line-height:1.65;">${message}</p>
    ${ctaButton('Log Today', APP_URL)}
  `);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // ── Direct call: daily reminder email fallback ────────────────────────────
  if (body.type === 'daily_reminder') {
    const { userId, firstName, message } = body as {
      userId: string; firstName: string; message: string;
    };
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const email = authData?.user?.email;
    if (!email) return new Response(JSON.stringify({ sent: false, reason: 'no email' }), { status: 200 });

    const html = buildReminderHtml(firstName, message);
    const sent = await sendEmail(email, `Time to check in, ${firstName || 'there'} 🔥`, html);
    return new Response(JSON.stringify({ sent }), { status: 200 });
  }

  // ── Database webhook format ───────────────────────────────────────────────
  const webhookType = body.type as string;   // "INSERT"
  const table       = body.table as string;
  const record      = body.record as Record<string, unknown> | undefined;

  if (!record || (webhookType !== 'INSERT' && webhookType !== 'UPDATE')) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  // ── Spark (connections INSERT) ────────────────────────────────────────────
  if (table === 'connections' && webhookType === 'INSERT') {
    const { requester_id, receiver_id, spark_message } = record as {
      requester_id: string; receiver_id: string; spark_message: string | null;
    };

    const [{ data: receiverAuth }, { data: requesterProfile }] = await Promise.all([
      supabase.auth.admin.getUserById(receiver_id),
      supabase.from('profiles').select('first_name, last_name').eq('id', requester_id).single(),
    ]);

    const email = receiverAuth?.user?.email;
    if (!email) return new Response(JSON.stringify({ sent: false, reason: 'no receiver email' }), { status: 200 });

    const senderName = requesterProfile
      ? `${requesterProfile.first_name ?? ''} ${requesterProfile.last_name ?? ''}`.trim()
      : 'Someone';

    const html = buildSparkHtml(senderName, spark_message ?? null);
    const sent = await sendEmail(email, `${senderName} sent you a spark ⚡`, html);
    return new Response(JSON.stringify({ sent }), { status: 200 });
  }

  // ── Match (connections UPDATE → accepted, opt-in only) ────────────────────
  if (table === 'connections' && webhookType === 'UPDATE') {
    const { requester_id, receiver_id, status } = record as {
      requester_id: string; receiver_id: string; status: string;
    };
    if (status !== 'accepted') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not accepted' }), { status: 200 });
    }

    const [{ data: requesterProfile }, { data: receiverProfile }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, notification_prefs').eq('id', requester_id).single(),
      supabase.from('profiles').select('first_name, last_name, notification_prefs').eq('id', receiver_id).single(),
    ]);

    const nameOf = (p: { first_name?: string; last_name?: string } | null) =>
      p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Someone' : 'Someone';
    const requesterName = nameOf(requesterProfile);
    const receiverName = nameOf(receiverProfile);

    async function notify(userId: string, prefs: Record<string, unknown> | null | undefined, otherName: string) {
      if (!prefs?.email_match) return { sent: false, reason: 'opted out' };
      const { data: auth } = await supabase.auth.admin.getUserById(userId);
      const email = auth?.user?.email;
      if (!email) return { sent: false, reason: 'no email' };
      const sent = await sendEmail(email, `You're connected with ${otherName} ⚡`, buildMatchHtml(otherName));
      return { sent };
    }

    const [requesterResult, receiverResult] = await Promise.all([
      notify(requester_id, requesterProfile?.notification_prefs as Record<string, unknown>, receiverName),
      notify(receiver_id, receiverProfile?.notification_prefs as Record<string, unknown>, requesterName),
    ]);

    return new Response(JSON.stringify({ requesterResult, receiverResult }), { status: 200 });
  }

  // ── New message (direct_messages INSERT) ─────────────────────────────────
  if (table === 'direct_messages' && webhookType === 'INSERT') {
    const { sender_id, receiver_id, content, read_at } = record as {
      sender_id: string; receiver_id: string; content: string; read_at: string | null;
    };

    // Skip if already read (user was active)
    if (read_at) return new Response(JSON.stringify({ skipped: true, reason: 'already read' }), { status: 200 });

    const [{ data: receiverAuth }, { data: senderProfile }] = await Promise.all([
      supabase.auth.admin.getUserById(receiver_id),
      supabase.from('profiles').select('first_name, last_name').eq('id', sender_id).single(),
    ]);

    const email = receiverAuth?.user?.email;
    if (!email) return new Response(JSON.stringify({ sent: false, reason: 'no receiver email' }), { status: 200 });

    const senderName = senderProfile
      ? `${senderProfile.first_name ?? ''} ${senderProfile.last_name ?? ''}`.trim()
      : 'Someone';

    const preview = (content ?? '').slice(0, 200);
    const html = buildMessageHtml(senderName, preview);
    const sent = await sendEmail(email, `New message from ${senderName}`, html);
    return new Response(JSON.stringify({ sent }), { status: 200 });
  }

  return new Response(JSON.stringify({ skipped: true, reason: 'unhandled table' }), { status: 200 });
});
