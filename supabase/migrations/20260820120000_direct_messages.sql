-- Real-time one-to-one messages between accepted connections only.
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS direct_messages_sender_recipient_idx
  ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_sender_idx
  ON public.direct_messages (recipient_id, sender_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Connected users can read direct messages" ON public.direct_messages;
CREATE POLICY "Connected users can read direct messages"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (
    (sender_id = auth.uid() OR recipient_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.connections c
      WHERE c.status = 'accepted'
        AND (
          (c.requester_id = sender_id AND c.addressee_id = recipient_id)
          OR (c.requester_id = recipient_id AND c.addressee_id = sender_id)
        )
    )
  );

DROP POLICY IF EXISTS "Connected users can send direct messages" ON public.direct_messages;
CREATE POLICY "Connected users can send direct messages"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.connections c
      WHERE c.status = 'accepted'
        AND (
          (c.requester_id = sender_id AND c.addressee_id = recipient_id)
          OR (c.requester_id = recipient_id AND c.addressee_id = sender_id)
        )
    )
  );

GRANT SELECT, INSERT ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

CREATE OR REPLACE FUNCTION public.send_direct_message(target_user_id uuid, message_body text)
RETURNS public.direct_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  created public.direct_messages;
  sender_name text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;
  IF target_user_id IS NULL OR target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Invalid message target';
  END IF;
  IF char_length(trim(message_body)) < 1 OR char_length(message_body) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.connections c
    WHERE c.status = 'accepted'
      AND (
        (c.requester_id = current_user_id AND c.addressee_id = target_user_id)
        OR (c.requester_id = target_user_id AND c.addressee_id = current_user_id)
      )
  ) THEN
    RAISE EXCEPTION 'Accepted connection required';
  END IF;

  INSERT INTO public.direct_messages (sender_id, recipient_id, body)
  VALUES (current_user_id, target_user_id, trim(message_body))
  RETURNING * INTO created;

  SELECT COALESCE(name, 'একজন কৃষক') INTO sender_name
  FROM public.profiles
  WHERE id = current_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (
    target_user_id,
    'message',
    'নতুন মেসেজ',
    COALESCE(sender_name, 'একজন কৃষক') || ' আপনাকে একটি মেসেজ পাঠিয়েছেন',
    current_user_id,
    'message'
  );

  RETURN created;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_direct_messages_read(peer_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  IF auth.uid() IS NULL OR peer_user_id IS NULL OR peer_user_id = auth.uid() THEN
    RETURN 0;
  END IF;

  UPDATE public.direct_messages
  SET read_at = now()
  WHERE recipient_id = auth.uid()
    AND sender_id = peer_user_id
    AND read_at IS NULL;

  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_direct_threads()
RETURNS TABLE(
  peer_id uuid,
  peer_name text,
  peer_avatar_url text,
  peer_district text,
  last_body text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH visible_messages AS (
    SELECT
      dm.*,
      CASE WHEN dm.sender_id = auth.uid() THEN dm.recipient_id ELSE dm.sender_id END AS other_id
    FROM public.direct_messages dm
    WHERE (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.connections c
        WHERE c.status = 'accepted'
          AND (
            (c.requester_id = dm.sender_id AND c.addressee_id = dm.recipient_id)
            OR (c.requester_id = dm.recipient_id AND c.addressee_id = dm.sender_id)
          )
      )
  ),
  latest AS (
    SELECT DISTINCT ON (other_id)
      other_id,
      body,
      created_at
    FROM visible_messages
    ORDER BY other_id, created_at DESC
  )
  SELECT
    latest.other_id,
    p.name,
    p.avatar_url,
    p.district,
    latest.body,
    latest.created_at,
    (
      SELECT count(*)
      FROM public.direct_messages unread
      WHERE unread.sender_id = latest.other_id
        AND unread.recipient_id = auth.uid()
        AND unread.read_at IS NULL
    ) AS unread_count
  FROM latest
  JOIN public.profiles p ON p.id = latest.other_id
  ORDER BY latest.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.send_direct_message(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_direct_messages_read(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_direct_threads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_direct_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_direct_messages_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_direct_threads() TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END;
$$;

COMMENT ON TABLE public.direct_messages IS 'Private real-time messages available only between accepted connections.';
COMMENT ON COLUMN public.direct_messages.read_at IS 'Set when the recipient opens the conversation.';
