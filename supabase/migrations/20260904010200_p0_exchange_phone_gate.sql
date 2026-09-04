-- P0-3: gate get_exchange_phone on ownership or accepted connection.
-- Previously any authenticated user could retrieve any active exchange's
-- user_phone by enumerating ids, bypassing the column-level SELECT revoke.
-- New rule mirrors get_connected_farmer_phone: owner sees own phone;
-- others only with an accepted connection to the owner; everyone else NULL.
-- Same signature and grants (callers unchanged). Reversible by redeploying
-- the previous function body from 20260701080543.

CREATE OR REPLACE FUNCTION public.get_exchange_phone(_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  owner_phone text;
BEGIN
  IF auth.uid() IS NULL OR _id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.user_id, e.user_phone INTO owner_id, owner_phone
  FROM public.exchanges e
  WHERE e.id = _id AND e.is_active = true
  LIMIT 1;

  IF owner_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Owner may always see their own listing phone.
  IF owner_id = auth.uid() THEN
    RETURN owner_phone;
  END IF;

  -- Others need an accepted connection with the owner.
  IF NOT EXISTS (
    SELECT 1
    FROM public.connections c
    WHERE c.status = 'accepted'
      AND ((c.requester_id = auth.uid() AND c.addressee_id = owner_id)
        OR (c.requester_id = owner_id AND c.addressee_id = auth.uid()))
  ) THEN
    RETURN NULL;
  END IF;

  RETURN owner_phone;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_exchange_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exchange_phone(uuid) TO authenticated;
