-- P0-5 + P0-6: scope AI cache serving and dedupe feedback votes.
--
-- P0-5: search_cache filtered only on category+season, so cached answers
-- mentioning one crop/district were served to others. Adds crop + district
-- scoping (exact match via IS NOT DISTINCT FROM so legacy NULL rows keep
-- working). Writers must store district (chat.functions.ts updated together).
-- P0-6: record_cache_feedback blindly incremented counters, so one user could
-- replay votes and globally suppress any entry at unhelpful_count>=5.
-- Votes are now one-per-user in ai_cache_votes; counters are recomputed.
-- Additive. Reversible by dropping new objects / restoring prior bodies.

-- 1) District column for cache scoping.
ALTER TABLE public.ai_chat_cache ADD COLUMN IF NOT EXISTS district text;
CREATE INDEX IF NOT EXISTS idx_ai_chat_cache_scope
  ON public.ai_chat_cache(category, season, district);

-- 2) Scoped search. New optional filters default NULL = legacy behavior.
-- DROP first: CREATE OR REPLACE cannot change a function signature, and the
-- old unscoped bodies must not survive as overloads.
DROP FUNCTION IF EXISTS public.search_cache(vector, float, int, text, text);
CREATE OR REPLACE FUNCTION public.search_cache(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.82,
  max_results int DEFAULT 3,
  filter_category text DEFAULT NULL,
  filter_season text DEFAULT NULL,
  filter_crop text DEFAULT NULL,
  filter_district text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  category text,
  similarity float,
  hit_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.question,
    c.answer,
    c.category,
    (1 - (c.embedding <=> query_embedding))::float AS similarity,
    c.hit_count
  FROM public.ai_chat_cache c
  WHERE c.expires_at > now()
    AND c.unhelpful_count < 5
    AND c.embedding IS NOT NULL
    AND (filter_category IS NULL OR c.category = filter_category)
    AND (filter_season IS NULL OR c.season = filter_season OR c.season = 'সারা বছর')
    AND (filter_crop IS NULL OR c.crop_type IS NOT DISTINCT FROM filter_crop)
    AND (filter_district IS NULL OR c.district IS NOT DISTINCT FROM filter_district)
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT max_results;
$$;

-- Keep the new signature server-only like before (the old REVOKE/GRANT in
-- 20260704160855 targeted the 5-arg signature).
REVOKE EXECUTE ON FUNCTION public.search_cache(vector, float, int, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_cache(vector, float, int, text, text, text, text) TO service_role;

-- 3) One vote per user per cache entry (server-written via RPC only).
CREATE TABLE IF NOT EXISTS public.ai_cache_votes (
  cache_id uuid NOT NULL REFERENCES public.ai_chat_cache(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helpful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cache_id, user_id)
);
ALTER TABLE public.ai_cache_votes ENABLE ROW LEVEL SECURITY;
-- No client policies: votes are written only through record_cache_feedback.
GRANT ALL ON public.ai_cache_votes TO service_role;
CREATE INDEX IF NOT EXISTS idx_ai_cache_votes_cache ON public.ai_cache_votes(cache_id);

-- 4) Freeze current counters as the base (existing votes cannot be attributed
-- to users), then recompute totals as base + accountable per-user votes.
ALTER TABLE public.ai_chat_cache
  ADD COLUMN IF NOT EXISTS base_helpful int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_unhelpful int NOT NULL DEFAULT 0;
UPDATE public.ai_chat_cache
SET base_helpful = helpful_count, base_unhelpful = unhelpful_count
WHERE base_helpful = 0 AND base_unhelpful = 0
  AND (helpful_count <> 0 OR unhelpful_count <> 0);

-- 5) Feedback RPC now takes the voter and recomputes counters from votes.
-- DROP the old blind-increment body so it cannot survive as an overload.
DROP FUNCTION IF EXISTS public.record_cache_feedback(uuid, boolean);
CREATE OR REPLACE FUNCTION public.record_cache_feedback(_id uuid, _helpful boolean, _voter uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _id IS NULL OR _voter IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ai_chat_cache WHERE id = _id) THEN
    RETURN;
  END IF;

  INSERT INTO public.ai_cache_votes(cache_id, user_id, helpful)
  VALUES (_id, _voter, _helpful)
  ON CONFLICT (cache_id, user_id)
  DO UPDATE SET helpful = EXCLUDED.helpful, created_at = now();

  UPDATE public.ai_chat_cache c
  SET helpful_count = c.base_helpful + (
        SELECT count(*) FROM public.ai_cache_votes v
        WHERE v.cache_id = _id AND v.helpful
      ),
      unhelpful_count = c.base_unhelpful + (
        SELECT count(*) FROM public.ai_cache_votes v
        WHERE v.cache_id = _id AND NOT v.helpful
      )
  WHERE c.id = _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_cache_feedback(uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cache_feedback(uuid, boolean, uuid) TO service_role;
