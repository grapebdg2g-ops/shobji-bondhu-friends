
-- posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  user_district text,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general','help','success','weather')),
  content text NOT NULL CHECK (char_length(content) <= 500),
  image_url text,
  crop_tag text,
  likes_count int NOT NULL DEFAULT 0,
  comments_count int NOT NULL DEFAULT 0,
  district text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX posts_district_idx ON public.posts (district);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Auth insert own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- post_likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX post_likes_post_idx ON public.post_likes (post_id);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth insert own likes" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  content text NOT NULL CHECK (char_length(content) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at DESC);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Auth insert own comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RPCs
CREATE OR REPLACE FUNCTION public.increment_likes(post_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes(post_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_comments(post_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = post_id;
$$;

-- storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Feed images public read" ON storage.objects FOR SELECT USING (bucket_id = 'feed-images');
CREATE POLICY "Auth users upload feed images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own feed images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed sample posts (system user id - nullable user_id won't work due to FK, so use a real null-safe approach: insert with a fake user requires a user. Instead skip user_id FK via dedicated seed)
-- Use first auth user if exists; otherwise skip seeds
DO $$
DECLARE
  seed_user uuid;
BEGIN
  SELECT id INTO seed_user FROM auth.users ORDER BY created_at LIMIT 1;
  IF seed_user IS NOT NULL THEN
    INSERT INTO public.posts (user_id, user_name, user_district, type, content, crop_tag, district) VALUES
      (seed_user, 'কৃষক রহিম', 'ঢাকা', 'help', 'আমার ধান গাছের পাতা হলুদ হয়ে যাচ্ছে, কী করবো?', 'ধান', 'ঢাকা'),
      (seed_user, 'কৃষক করিম', 'রাজশাহী', 'success', 'এ বছর আলুতে বিঘা প্রতি ৮০ মণ পেয়েছি, সবাইকে জানাতে চাইলাম!', 'আলু', 'রাজশাহী'),
      (seed_user, 'কৃষক জামাল', 'ঢাকা', 'general', 'কারওয়ান বাজারে আজ পেঁয়াজের দাম হঠাৎ বেড়ে গেছে', 'পেঁয়াজ', 'ঢাকা'),
      (seed_user, 'আবহাওয়া বার্তা', 'সিলেট', 'weather', 'আগামী ৩ দিন ভারী বৃষ্টির সম্ভাবনা, ধান কাটা এগিয়ে আনুন', 'ধান', 'সিলেট'),
      (seed_user, 'কৃষক সালাম', 'চট্টগ্রাম', 'success', 'হাইব্রিড টমেটো চাষে এ মৌসুমে ভালো লাভ হয়েছে', 'টমেটো', 'চট্টগ্রাম');
  END IF;
END $$;
