
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.ai_chat_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  embedding vector(768),
  answer text NOT NULL,
  category text,
  crop_type text,
  season text,
  hit_count int NOT NULL DEFAULT 0,
  helpful_count int NOT NULL DEFAULT 0,
  unhelpful_count int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Server-only table: access via server functions using service role.
GRANT ALL ON public.ai_chat_cache TO service_role;

ALTER TABLE public.ai_chat_cache ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: all reads/writes go through server functions.

CREATE INDEX ai_chat_cache_embedding_idx
  ON public.ai_chat_cache USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_ai_chat_cache_category ON public.ai_chat_cache(category, season);
CREATE INDEX idx_ai_chat_cache_expires ON public.ai_chat_cache(expires_at);

CREATE TRIGGER ai_chat_cache_set_updated_at
BEFORE UPDATE ON public.ai_chat_cache
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.search_cache(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.82,
  max_results int DEFAULT 3,
  filter_category text DEFAULT NULL,
  filter_season text DEFAULT NULL
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
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT max_results;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_ai_chat_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ai_chat_cache WHERE expires_at < now();
$$;

CREATE OR REPLACE FUNCTION public.increment_cache_hit(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ai_chat_cache SET hit_count = hit_count + 1 WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.record_cache_feedback(_id uuid, _helpful boolean)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ai_chat_cache
  SET helpful_count = helpful_count + CASE WHEN _helpful THEN 1 ELSE 0 END,
      unhelpful_count = unhelpful_count + CASE WHEN _helpful THEN 0 ELSE 1 END
  WHERE id = _id;
$$;
