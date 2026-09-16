// Shared hooks need *a* Supabase client, but web and mobile each need their
// own instance -- different storage adapter (browser storage vs
// AsyncStorage), different env var names (VITE_* vs EXPO_PUBLIC_*). Rather
// than hooks importing a platform-specific file directly (which would
// break sharing) or threading a `supabase` param through every hook call,
// each app's entry point calls setSupabaseClient() once at startup with
// its own already-configured client; every shared hook then pulls it from
// here.
let _client = null;

export function setSupabaseClient(client) {
  _client = client;
}

export function getSupabaseClient() {
  if (!_client) {
    throw new Error(
      '@actpar/shared: getSupabaseClient() called before setSupabaseClient(). ' +
      'Call setSupabaseClient(yourConfiguredClient) once at app startup, before rendering.'
    );
  }
  return _client;
}
