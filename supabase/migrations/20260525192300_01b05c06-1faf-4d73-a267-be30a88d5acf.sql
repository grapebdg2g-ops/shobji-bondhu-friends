
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS posts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exchanges_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prices_count integer NOT NULL DEFAULT 0;

-- Counter trigger functions
CREATE OR REPLACE FUNCTION public.bump_profile_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col text := TG_ARGV[0];
  uid uuid;
  delta int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    uid := NEW.user_id; delta := 1;
  ELSE
    uid := OLD.user_id; delta := -1;
  END IF;
  IF uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  EXECUTE format('UPDATE public.profiles SET %I = GREATEST(%I + $1, 0) WHERE id = $2', col, col)
    USING delta, uid;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS posts_count_ins ON public.posts;
DROP TRIGGER IF EXISTS posts_count_del ON public.posts;
CREATE TRIGGER posts_count_ins AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('posts_count');
CREATE TRIGGER posts_count_del AFTER DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('posts_count');

DROP TRIGGER IF EXISTS exchanges_count_ins ON public.exchanges;
DROP TRIGGER IF EXISTS exchanges_count_del ON public.exchanges;
CREATE TRIGGER exchanges_count_ins AFTER INSERT ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('exchanges_count');
CREATE TRIGGER exchanges_count_del AFTER DELETE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('exchanges_count');

DROP TRIGGER IF EXISTS prices_count_ins ON public.prices;
DROP TRIGGER IF EXISTS prices_count_del ON public.prices;
CREATE TRIGGER prices_count_ins AFTER INSERT ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('prices_count');
CREATE TRIGGER prices_count_del AFTER DELETE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_counter('prices_count');

-- Backfill existing counts
UPDATE public.profiles p SET
  posts_count = COALESCE((SELECT count(*) FROM public.posts WHERE user_id = p.id), 0),
  exchanges_count = COALESCE((SELECT count(*) FROM public.exchanges WHERE user_id = p.id), 0),
  prices_count = COALESCE((SELECT count(*) FROM public.prices WHERE user_id = p.id), 0);

-- Storage bucket: avatars (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
