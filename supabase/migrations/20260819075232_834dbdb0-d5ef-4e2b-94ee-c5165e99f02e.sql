-- Facebook-style post reactions and threaded comment replies

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'care', 'haha', 'wow', 'sad', 'angry')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions (post_id, reaction_type);
CREATE INDEX IF NOT EXISTS post_reactions_user_idx ON public.post_reactions (user_id, post_id);

GRANT SELECT ON public.post_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reactions" ON public.post_reactions;
CREATE POLICY "Anyone can read reactions" ON public.post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Active users insert own reactions" ON public.post_reactions;
CREATE POLICY "Active users insert own reactions" ON public.post_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Active users update own reactions" ON public.post_reactions;
CREATE POLICY "Active users update own reactions" ON public.post_reactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Users delete own reactions" ON public.post_reactions;
CREATE POLICY "Users delete own reactions" ON public.post_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Backfill existing likes into the new reaction model without duplicating users.
INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
SELECT post_id, user_id, 'like'
FROM public.post_likes
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Keep the existing posts.likes_count field compatible with the new reaction table.
UPDATE public.posts AS p
SET likes_count = COALESCE((SELECT COUNT(*)::integer FROM public.post_reactions r WHERE r.post_id = p.id), 0);

CREATE OR REPLACE FUNCTION public.sync_post_reaction_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  affected_post_id uuid;
BEGIN
  affected_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.posts
  SET likes_count = (SELECT COUNT(*)::integer FROM public.post_reactions WHERE post_id = affected_post_id)
  WHERE id = affected_post_id;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_reaction_count ON public.post_reactions;
CREATE TRIGGER trg_sync_post_reaction_count
  AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_count();

CREATE OR REPLACE FUNCTION public.touch_post_reaction_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_post_reaction_updated_at ON public.post_reactions;
CREATE TRIGGER trg_touch_post_reaction_updated_at
  BEFORE UPDATE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_post_reaction_updated_at();

-- A comment can now reply to a top-level comment. Existing comments remain top-level.
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON public.post_comments (parent_id, created_at ASC);

-- Notify post owners about new reaction types and reply authors about replies.
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (
    v_owner,
    'reaction',
    'নতুন প্রতিক্রিয়া',
    CASE NEW.reaction_type
      WHEN 'love' THEN 'ভালোবাসা'
      WHEN 'care' THEN 'যত্ন'
      WHEN 'haha' THEN 'হাহা'
      WHEN 'wow' THEN 'বাহ'
      WHEN 'sad' THEN 'দুঃখ'
      WHEN 'angry' THEN 'রাগ'
      ELSE 'পছন্দ'
    END || ' — আপনার পোস্টে নতুন প্রতিক্রিয়া এসেছে',
    NEW.post_id,
    'post'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_notify_post_reaction
  AFTER INSERT OR UPDATE OF reaction_type ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_reaction();

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_parent_owner uuid;
  v_snippet text;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  v_snippet := LEFT(NEW.content, 30);
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
    VALUES (v_owner, 'comment', 'নতুন মন্তব্য', COALESCE(NEW.user_name, 'একজন কৃষক') || ': ' || v_snippet, NEW.post_id, 'post');
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_owner FROM public.post_comments WHERE id = NEW.parent_id;
    IF v_parent_owner IS NOT NULL AND v_parent_owner <> NEW.user_id AND v_parent_owner <> v_owner THEN
      INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
      VALUES (v_parent_owner, 'comment_reply', 'আপনার মন্তব্যে উত্তর', COALESCE(NEW.user_name, 'একজন কৃষক') || ': ' || v_snippet, NEW.post_id, 'post');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;