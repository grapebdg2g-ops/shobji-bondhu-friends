
-- ============================================================
-- 1) profiles.phone: revoke SELECT on phone from anon/authenticated
-- ============================================================
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, district, upazila, crops, role, created_at, updated_at,
  avatar_url, bio, posts_count, exchanges_count, prices_count,
  is_verified, is_suspended, suspension_reason, suspension_until,
  verified_at, verified_by, expert_specialty, expert_institution,
  last_active, total_reports
) ON public.profiles TO authenticated;
GRANT SELECT (
  id, name, district, upazila, crops, role, created_at,
  avatar_url, bio, posts_count, exchanges_count, prices_count,
  is_verified, expert_specialty, expert_institution
) ON public.profiles TO anon;

-- ============================================================
-- 2) exchanges: restrict SELECT to authenticated + hide user_phone column
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read active exchanges" ON public.exchanges;
CREATE POLICY "Authed users can read active exchanges"
  ON public.exchanges FOR SELECT
  TO authenticated
  USING (is_active = true OR auth.uid() = user_id);

REVOKE SELECT ON public.exchanges FROM anon, authenticated;
GRANT SELECT (
  id, title, description, type, is_free, price, unit, image_url,
  district, upazila, user_id, user_name, is_active, created_at
) ON public.exchanges TO authenticated;

-- SECURITY DEFINER RPC for phone lookup (authenticated only)
CREATE OR REPLACE FUNCTION public.get_exchange_phone(_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_phone FROM public.exchanges
  WHERE id = _id AND is_active = true AND auth.uid() IS NOT NULL
  LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.get_exchange_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exchange_phone(uuid) TO authenticated;

-- ============================================================
-- 3) Storage: drop broad SELECT (list) policies on public buckets.
--    Public buckets serve files via public URL/CDN without needing this policy.
-- ============================================================
DROP POLICY IF EXISTS "Exchange images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Feed images public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;

-- ============================================================
-- 4) Realtime: scope messages policy to user's own topic
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Users can subscribe to own realtime topic"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

-- ============================================================
-- 5) weather_alerts_sent: add admin-only SELECT policy
-- ============================================================
CREATE POLICY "Admins can view weather alerts log"
  ON public.weather_alerts_sent FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6) SECURITY DEFINER function execute grants: revoke from PUBLIC/anon
--    and grant only to roles that need to invoke them.
-- ============================================================

-- Internal trigger/helper functions - revoke from callers entirely
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_price_drop() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_profile_counter() FROM PUBLIC, anon, authenticated;

-- RPCs used from app - restrict to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_phones(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_phones(uuid[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_find_user_by_phone(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_phone(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_user_roles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_user_roles(uuid[]) TO authenticated;

-- like/comment counters (called from client) - authenticated only
REVOKE EXECUTE ON FUNCTION public.increment_likes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_likes(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_likes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_likes(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_comments(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_comments(uuid) TO authenticated;

-- has_role / is_active_user are used inside RLS policies - grant to both
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO authenticated, anon;

-- price history: public read
REVOKE EXECUTE ON FUNCTION public.get_price_history(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_price_history(text, text, integer) TO authenticated, anon;
