// Server-only helper for pg_cron / scheduler webhook auth.
// Transitional policy (do not weaken further):
//   1. Preferred: `x-cron-secret: <CRON_SECRET|PUSH_CRON_SECRET>`
//   2. Legacy (existing pg_cron jobs): `apikey: <SUPABASE_PUBLISHABLE_KEY|SUPABASE_ANON_KEY>`
//      Accepted so current DB-scheduled jobs keep working until their headers
//      are updated to send x-cron-secret. The anon key is public by design,
//      so treat legacy acceptance as obscurity, not real security.
//   3. If neither is configured on the server, deny (fail closed) —
//      except crop-reminders which historically allowed open access; it now
//      also denies so all hooks behave identically.
//
// To finish the migration:
//   a) Set CRON_SECRET in hosting env (and Supabase vault for pg_cron).
//   b) Update each cron.schedule() headers to include
//      "x-cron-secret":"<secret>" (see supabase/migrations/*cron*).
//   c) Rotate the Supabase anon/publishable key (it appears in git history
//      and in old migration files) — then legacy apikey acceptance can be
//      removed and only x-cron-secret enforced.

function getCronSecret(): string {
  return process.env.CRON_SECRET ?? process.env.PUSH_CRON_SECRET ?? "";
}

function getLegacyApiKeys(): string[] {
  return [process.env.SUPABASE_PUBLISHABLE_KEY ?? "", process.env.SUPABASE_ANON_KEY ?? ""].filter(
    Boolean,
  );
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = getCronSecret();
  if (cronSecret) {
    const provided =
      request.headers.get("x-cron-secret") ?? request.headers.get("x-push-cron-secret");
    if (provided === cronSecret) return true;
  }
  // Legacy path: existing pg_cron jobs send only the anon apikey.
  const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
  if (apikey && getLegacyApiKeys().includes(apikey)) return true;
  return false;
}

export function unauthorizedCronResponse() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
