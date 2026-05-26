CREATE TABLE public.muted_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  muted_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, muted_id),
  CHECK (user_id <> muted_id)
);

CREATE INDEX idx_muted_users_user_id ON public.muted_users(user_id);

GRANT SELECT, INSERT, DELETE ON public.muted_users TO authenticated;
GRANT ALL ON public.muted_users TO service_role;

ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mutes"
ON public.muted_users FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mutes"
ON public.muted_users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own mutes"
ON public.muted_users FOR DELETE TO authenticated
USING (auth.uid() = user_id);