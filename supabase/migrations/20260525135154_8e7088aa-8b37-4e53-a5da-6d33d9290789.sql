-- 1) Column-level privileges: hide sensitive cols from anon role
REVOKE SELECT (user_phone) ON public.exchanges FROM anon;
REVOKE SELECT (user_name, user_id) ON public.prices FROM anon;

-- Ensure authenticated still has full SELECT
GRANT SELECT ON public.exchanges TO authenticated;
GRANT SELECT ON public.prices TO authenticated;

-- 2) Realtime authorization: require authenticated users to subscribe
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);