-- Farmer directory contact actions.
-- Phone numbers stay hidden from profiles SELECT. A farmer can retrieve a
-- contact's phone only after both users have an accepted connection.
CREATE OR REPLACE FUNCTION public.get_connected_farmer_phone(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_phone text;
BEGIN
  IF auth.uid() IS NULL OR target_user_id IS NULL OR target_user_id = auth.uid() THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.connections c
    WHERE c.status = 'accepted'
      AND ((c.requester_id = auth.uid() AND c.addressee_id = target_user_id)
        OR (c.requester_id = target_user_id AND c.addressee_id = auth.uid()))
  ) THEN
    RETURN NULL;
  END IF;

  SELECT p.phone INTO target_phone
  FROM public.profiles p
  WHERE p.id = target_user_id;

  RETURN target_phone;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_connected_farmer_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_connected_farmer_phone(uuid) TO authenticated;

-- Safe public friends list for authenticated profile viewers.
CREATE OR REPLACE FUNCTION public.get_public_connected_farmers(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  district text,
  upazila text,
  avatar_url text,
  bio text,
  crops text[],
  role text,
  is_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.district, p.upazila, p.avatar_url, p.bio, p.crops, p.role, p.is_verified
  FROM public.connections c
  JOIN public.profiles p ON p.id = CASE
    WHEN c.requester_id = target_user_id THEN c.addressee_id
    ELSE c.requester_id
  END
  WHERE c.status = 'accepted'
    AND (c.requester_id = target_user_id OR c.addressee_id = target_user_id)
  ORDER BY p.name NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_connected_farmers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_connected_farmers(uuid) TO authenticated;
