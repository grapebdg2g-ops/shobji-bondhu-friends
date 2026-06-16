CREATE TABLE public.feature_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null default 'organic_fertilizer',
  created_at timestamptz not null default now(),
  unique (user_id, feature)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_waitlist TO authenticated;
GRANT ALL ON public.feature_waitlist TO service_role;
ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own waitlist" ON public.feature_waitlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own waitlist" ON public.feature_waitlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own waitlist" ON public.feature_waitlist FOR DELETE TO authenticated USING (auth.uid() = user_id);