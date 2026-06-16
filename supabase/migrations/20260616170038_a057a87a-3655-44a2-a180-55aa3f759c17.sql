
-- 1. Restrict SELECT on profiles.phone (column-level)
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;

-- Owner self-read helper
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

-- Admin bulk phone lookup
CREATE OR REPLACE FUNCTION public.admin_get_phones(_ids uuid[])
RETURNS TABLE(id uuid, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.phone
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND public.has_role(auth.uid(), 'admin')
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_phones(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_phones(uuid[]) TO authenticated;

-- Admin phone search
CREATE OR REPLACE FUNCTION public.admin_find_user_by_phone(_phone text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles
  WHERE phone = _phone
    AND public.has_role(auth.uid(), 'admin')
  LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.admin_find_user_by_phone(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_phone(text) TO authenticated;

-- 2. Prevent self role-escalation on profiles.role
REVOKE UPDATE (role) ON public.profiles FROM anon, authenticated;

-- 3. Lock down user_roles SELECT — only own row, plus admins/moderators
DROP POLICY IF EXISTS "Anyone authed can read roles" ON public.user_roles;
CREATE POLICY "Read own role or privileged"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- Public-safe role lookup for badges (exposes only farmer/expert)
CREATE OR REPLACE FUNCTION public.get_public_user_roles(_ids uuid[])
RETURNS TABLE(user_id uuid, role app_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ur.user_id, ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = ANY(_ids)
    AND ur.role IN ('farmer', 'expert')
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_user_roles(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_public_user_roles(uuid[]) TO authenticated;
