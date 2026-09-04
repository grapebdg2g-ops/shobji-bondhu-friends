-- P0-1: lock down profiles.UPDATE against self-privilege-escalation.
-- "Users can update own profile" had no column restriction, so any owner could
-- set is_verified / is_suspended / suspension_* / verified_* / expert_* /
-- *_count / last_active / phone (self-verify, self-unsuspend, fake-expert,
-- phone poisoning). Only UPDATE(role) was revoked.
--
-- Approach: BEFORE UPDATE trigger (not column REVOKEs) so that admins using
-- the client (admin panel, has_role('admin')) can still verify/suspend while
-- owners cannot touch privileged columns. Service_role and internal triggers
-- (counters, timestamps) bypass via NULL auth.uid() / trigger depth.
-- Additive. Reversible via DROP TRIGGER / DROP FUNCTION.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Internal trigger cascades (counters, timestamps) and service_role writes bypass.
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins may manage verification / suspension / expert status.
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
    OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
    OR NEW.suspension_until IS DISTINCT FROM OLD.suspension_until
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    OR NEW.expert_specialty IS DISTINCT FROM OLD.expert_specialty
    OR NEW.expert_institution IS DISTINCT FROM OLD.expert_institution
    OR NEW.posts_count IS DISTINCT FROM OLD.posts_count
    OR NEW.exchanges_count IS DISTINCT FROM OLD.exchanges_count
    OR NEW.prices_count IS DISTINCT FROM OLD.prices_count
    OR NEW.total_reports IS DISTINCT FROM OLD.total_reports
    OR NEW.last_active IS DISTINCT FROM OLD.last_active
    OR NEW.phone IS DISTINCT FROM OLD.phone
    OR NEW.role IS DISTINCT FROM OLD.role
  THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile fields';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Prevent id drift on own-update (USING without WITH CHECK allowed retargeting
-- the row's id within the same UPDATE statement scope).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
