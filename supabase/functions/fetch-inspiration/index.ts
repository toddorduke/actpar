import { createClient } from 'jsr:@supabase/supabase-js@2';

// Proxies Pexels search so the API key never reaches the client, and so a
// query is capped to a small, predictable request shape -- this endpoint
// only ever forwards a short search phrase, never lets the client pass
// through arbitrary Pexels API params.
const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY')!;

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

  // Auth: this is content shown inside the app, not a public endpoint --
  // require a real logged-in user so it can't be scraped as a free,
  // unauthenticated Pexels proxy.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  const { query } = await req.json().catch(() => ({}));
  if (!query || typeof query !== 'string' || !query.trim()) {
    return new Response('Missing query', { status: 400 });
  }
  // Keep the forwarded query short -- it's already a curated phrase or a
  // trimmed goal title on the client side, this is just a hard backstop.
  const safeQuery = query.trim().slice(0, 80);

  const [photosRes, videosRes] = await Promise.all([
    fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=2&orientation=square`,
      { headers: { Authorization: PEXELS_API_KEY } },
    ),
    fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(safeQuery)}&per_page=1&orientation=square`,
      { headers: { Authorization: PEXELS_API_KEY } },
    ),
  ]);

  if (!photosRes.ok) {
    console.error('Pexels photos error:', await photosRes.text());
    return new Response('Pexels error', { status: 502 });
  }

  const photoData = await photosRes.json();
  const items: any[] = (photoData.photos ?? []).map((p: any) => ({
    type: 'photo',
    id: `photo-${p.id}`,
    url: p.src.medium,
    alt: p.alt || safeQuery,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    pexelsUrl: p.url,
  }));

  // Video search failing shouldn't sink the whole request -- fall back to
  // photos-only rather than a hard error over one optional clip.
  if (videosRes.ok) {
    const videoData = await videosRes.json();
    const video = (videoData.videos ?? [])[0];
    if (video) {
      // Prefer a small file -- this is a decorative loop, not a full player,
      // so grab the lowest-width mp4 rather than the largest available.
      const mp4Files = (video.video_files ?? []).filter((f: any) => f.file_type === 'video/mp4');
      const smallest = mp4Files.sort((a: any, b: any) => (a.width ?? 0) - (b.width ?? 0))[0];
      if (smallest) {
        items.push({
          type: 'video',
          id: `video-${video.id}`,
          videoUrl: smallest.link,
          posterUrl: video.image,
          alt: safeQuery,
          photographer: video.user?.name ?? 'Pexels',
          photographerUrl: video.user?.url ?? 'https://www.pexels.com',
          pexelsUrl: video.url,
        });
      }
    }
  }

  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
