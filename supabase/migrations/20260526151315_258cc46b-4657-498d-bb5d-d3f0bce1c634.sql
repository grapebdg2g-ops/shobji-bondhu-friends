
-- 1. Role enum + table
CREATE TYPE public.app_role AS ENUM ('farmer', 'expert', 'moderator', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. profiles extensions (BEFORE functions that reference them)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspension_until timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS expert_specialty text,
  ADD COLUMN IF NOT EXISTS expert_institution text,
  ADD COLUMN IF NOT EXISTS last_active timestamptz,
  ADD COLUMN IF NOT EXISTS total_reports int NOT NULL DEFAULT 0;

-- 3. Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND is_suspended = true
      AND (suspension_until IS NULL OR suspension_until > now())
  )
$$;

-- 4. user_roles policies
CREATE POLICY "Anyone authed can read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Widen profile SELECT for badges
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Authed users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Moderator/admin can delete any content
CREATE POLICY "Mods delete any post"
  ON public.posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mods delete any comment"
  ON public.post_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mods delete any exchange"
  ON public.exchanges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- 7. Block suspended users from creating content
DROP POLICY IF EXISTS "Auth insert own posts" ON public.posts;
CREATE POLICY "Active users insert own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Auth insert own comments" ON public.post_comments;
CREATE POLICY "Active users insert own comments"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users insert own exchanges" ON public.exchanges;
CREATE POLICY "Active users insert own exchanges"
  ON public.exchanges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

-- 8. Auto-assign farmer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'farmer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 9. Backfill: give farmer role to every existing user without one
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'farmer'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
ON CONFLICT (user_id, role) DO NOTHING;
