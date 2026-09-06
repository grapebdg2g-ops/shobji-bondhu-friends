// Server-only helper for pg_cron / scheduler webhook auth.
// Policy: every scheduled hook must send `x-cron-secret: <CRON_SECRET>`.
// The legacy `apikey: <anon key>` path has been removed — the anon key is
// public by design and the old one has been rotated out.
// If no secret is configured on the server, deny (fail closed).
//
// The database side keeps the same secret in public.internal_secrets (no RLS
// policies, service_role grant only) and pg_cron jobs call
// public.invoke_cron_hook('<path>'), which attaches the header.

function getCronSecret(): string {
  return process.env.CRON_SECRET ?? process.env.PUSH_CRON_SECRET ?? "";
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = getCronSecret();
  if (!cronSecret) return false;
  const provided =
    request.headers.get("x-cron-secret") ?? request.headers.get("x-push-cron-secret");
  return provided === cronSecret;
}

export function unauthorizedCronResponse() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
