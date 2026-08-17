-- Social connections: request, accept, decline and cancel workflow.
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS connections_requester_idx
  ON public.connections (requester_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS connections_addressee_idx
  ON public.connections (addressee_id, status, updated_at DESC);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
CREATE POLICY "Users can view their connections"
  ON public.connections FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can delete their connections" ON public.connections;
CREATE POLICY "Users can delete their connections"
  ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

GRANT SELECT, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

CREATE OR REPLACE FUNCTION public.request_connection(target_user_id uuid)
RETURNS public.connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  existing public.connections;
  created public.connections;
  requester_name text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;
  IF target_user_id IS NULL OR target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Invalid connection target';
  END IF;

  SELECT * INTO existing
  FROM public.connections
  WHERE (requester_id = current_user_id AND addressee_id = target_user_id)
     OR (requester_id = target_user_id AND addressee_id = current_user_id)
  ORDER BY updated_at DESC
  LIMIT 1;

  IF existing.id IS NOT NULL THEN
    IF existing.status = 'accepted' THEN
      RETURN existing;
    ELSIF existing.requester_id = target_user_id
      AND existing.addressee_id = current_user_id
      AND existing.status = 'pending' THEN
      UPDATE public.connections
      SET status = 'accepted', updated_at = now()
      WHERE id = existing.id
      RETURNING * INTO created;
      RETURN created;
    ELSIF existing.requester_id = current_user_id
      AND existing.addressee_id = target_user_id
      AND existing.status = 'pending' THEN
      RETURN existing;
    END IF;
  END IF;

  INSERT INTO public.connections (requester_id, addressee_id, status)
  VALUES (current_user_id, target_user_id, 'pending')
  ON CONFLICT (requester_id, addressee_id)
  DO UPDATE SET status = 'pending', updated_at = now()
  RETURNING * INTO created;

  SELECT COALESCE(name, 'একজন কৃষক') INTO requester_name
  FROM public.profiles WHERE id = current_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (
    target_user_id,
    'connection_request',
    'নতুন সংযোগ অনুরোধ',
    COALESCE(requester_name, 'একজন কৃষক') || ' আপনার সঙ্গে সংযুক্ত হতে চান',
    created.id,
    'connection'
  );

  RETURN created;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_connection(connection_id uuid, next_status text)
RETURNS public.connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  updated public.connections;
  responder_name text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;
  IF next_status NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid connection status';
  END IF;

  UPDATE public.connections
  SET status = next_status, updated_at = now()
  WHERE id = connection_id
    AND addressee_id = current_user_id
    AND status = 'pending'
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;

  SELECT COALESCE(name, 'একজন কৃষক') INTO responder_name
  FROM public.profiles WHERE id = current_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (
    updated.requester_id,
    'connection_response',
    CASE WHEN next_status = 'accepted' THEN 'সংযোগ গ্রহণ করা হয়েছে' ELSE 'সংযোগ অনুরোধ প্রত্যাখ্যান করা হয়েছে' END,
    COALESCE(responder_name, 'একজন কৃষক') || CASE WHEN next_status = 'accepted' THEN ' আপনার সংযোগ অনুরোধ গ্রহণ করেছেন' ELSE ' আপনার সংযোগ অনুরোধ গ্রহণ করেননি' END,
    updated.id,
    'connection'
  );

  RETURN updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_connection(connection_id uuid)
RETURNS public.connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.connections;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  UPDATE public.connections
  SET status = 'cancelled', updated_at = now()
  WHERE id = connection_id
    AND requester_id = auth.uid()
    AND status = 'pending'
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;

  RETURN updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_connection_state(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.status = 'accepted' THEN 'accepted'
    WHEN c.status = 'pending' AND c.requester_id = auth.uid() THEN 'outgoing_pending'
    WHEN c.status = 'pending' AND c.addressee_id = auth.uid() THEN 'incoming_pending'
    ELSE NULL
  END
  FROM public.connections c
  WHERE (c.requester_id = auth.uid() AND c.addressee_id = target_user_id)
     OR (c.requester_id = target_user_id AND c.addressee_id = auth.uid())
  ORDER BY c.updated_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.request_connection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_connection(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_connection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_state(uuid) TO authenticated;

CREATE TRIGGER connections_set_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
