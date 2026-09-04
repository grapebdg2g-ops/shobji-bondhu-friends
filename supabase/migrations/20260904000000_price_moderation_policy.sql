-- Security hotfix: allow moderators/admins to delete any community price.
-- Matches the existing pattern for posts/comments/exchanges
-- ("Mods delete any post/comment/exchange" in 20260526151315).
-- Without this, /admin/prices delete fails RLS for non-owners.
-- Additive only: no existing policies touched.

DROP POLICY IF EXISTS "Mods delete any price" ON public.prices;

CREATE POLICY "Mods delete any price"
  ON public.prices FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'admin')
  );

-- NOTE (manual follow-up, do not put secrets in migrations):
-- 1. Set CRON_SECRET in hosting env + Supabase vault.
-- 2. Update pg_cron jobs (market-prices-daily, crop-reminders-daily, plus any
--    external schedulers for weather-alerts / send-scheduled-broadcasts /
--    check-prediction-accuracy) to send header "x-cron-secret":"<secret>".
--    Hooks accept the legacy `apikey` header during transition, then legacy
--    acceptance should be removed from src/lib/cron-auth.server.ts.
-- 3. Rotate the Supabase anon/publishable key: it appears in git history
--    (.env was tracked) and in older migration files embedding the JWT.
