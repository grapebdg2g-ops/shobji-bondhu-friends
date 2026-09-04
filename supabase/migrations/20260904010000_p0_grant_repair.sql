-- P0-2: repair missing table GRANTs.
-- Several core tables have RLS policies but never received table-level GRANTs,
-- so PostgREST (anon/authenticated) fails with 42501 despite passing RLS.
-- This migration grants exactly what the existing policies already intend.
-- Additive only. Reversible via REVOKE. Does not weaken any policy.

-- posts / likes / comments (public read intended via USING(true) policies)
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.post_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.post_likes TO authenticated;
GRANT SELECT ON public.post_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;

-- Users may edit their own comments (previously no UPDATE policy; edits were
-- impossible while GRANT would suggest otherwise). Suspended users excluded.
DROP POLICY IF EXISTS "Users update own comments" ON public.post_comments;
CREATE POLICY "Users update own comments"
  ON public.post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

-- disease history / notifications / push subscriptions (owner-scoped)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disease_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- app installs (anonymous pre-login installs intended by policy)
GRANT SELECT, INSERT ON public.app_installs TO anon, authenticated;

-- prices: authenticated SELECT already granted; add anon read (USING(true)
-- policy intends public read) + authenticated DML (owner policies exist).
GRANT SELECT ON public.prices TO anon;
GRANT INSERT, UPDATE, DELETE ON public.prices TO authenticated;

-- exchanges: DML for owners (policies exist). No anon grant: anon access was
-- intentionally revoked in 20260701080543 (authenticated-only marketplace).
GRANT INSERT, UPDATE, DELETE ON public.exchanges TO authenticated;

-- profiles: column SELECT grants exist; INSERT/UPDATE table grants were missing.
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- weather alerts log: admin SELECT policy exists but no grant, so admin reads fail.
GRANT SELECT ON public.weather_alerts_sent TO authenticated;
