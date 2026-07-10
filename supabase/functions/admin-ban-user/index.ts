import { createClient } from 'jsr:@supabase/supabase-js@2';

// Kept in sync with ADMIN_EMAILS in client/src/pages/Admin/AdminPage.jsx
const ADMIN_EMAILS = ['toddwork1995@gmail.com'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !caller) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (!ADMIN_EMAILS.includes(caller.email ?? '')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
