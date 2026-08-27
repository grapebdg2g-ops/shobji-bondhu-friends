ALTER TABLE public.prices
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'retail';

ALTER TABLE public.govt_prices
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'কেজি',
  ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'retail';

ALTER TABLE public.prices
  DROP CONSTRAINT IF EXISTS prices_source_check,
  DROP CONSTRAINT IF EXISTS prices_price_type_check,
  ADD CONSTRAINT prices_source_check CHECK (source IN ('community')) NOT VALID,
  ADD CONSTRAINT prices_price_type_check CHECK (price_type IN ('retail', 'wholesale', 'growers')) NOT VALID,
  DROP CONSTRAINT IF EXISTS prices_positive_price_check,
  ADD CONSTRAINT prices_positive_price_check CHECK (price > 0 AND price <= 1000000) NOT VALID;

ALTER TABLE public.govt_prices
  DROP CONSTRAINT IF EXISTS govt_prices_price_type_check,
  ADD CONSTRAINT govt_prices_price_type_check CHECK (price_type IN ('retail', 'wholesale', 'growers')) NOT VALID,
  DROP CONSTRAINT IF EXISTS govt_prices_positive_price_check,
  ADD CONSTRAINT govt_prices_positive_price_check CHECK (price_avg > 0 AND price_avg <= 1000000) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_prices_market_lookup
  ON public.prices (district, lower(product_name), lower(market_name), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_govt_prices_market_lookup
  ON public.govt_prices (district, lower(product_name), price_date DESC);

CREATE OR REPLACE FUNCTION public.set_price_previous_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.previous_price IS NULL THEN
    SELECT p.price
      INTO NEW.previous_price
      FROM public.prices p
     WHERE lower(trim(p.product_name)) = lower(trim(NEW.product_name))
       AND lower(trim(p.market_name)) = lower(trim(NEW.market_name))
       AND p.district = NEW.district
       AND COALESCE(p.upazila, '') = COALESCE(NEW.upazila, '')
       AND p.unit = NEW.unit
       AND p.price_type = NEW.price_type
       AND p.id <> COALESCE(NEW.id, gen_random_uuid())
     ORDER BY p.created_at DESC
     LIMIT 1;
  END IF;

  IF NEW.price <= 0 OR NEW.price > 1000000 THEN
    RAISE EXCEPTION 'Price must be greater than zero and no more than 1000000';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_price_previous_value() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prices_previous_value ON public.prices;
CREATE TRIGGER trg_prices_previous_value
  BEFORE INSERT ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.set_price_previous_value();

DROP FUNCTION IF EXISTS public.get_price_history(text, text, int);
CREATE OR REPLACE FUNCTION public.get_price_history(
  p_product text,
  p_district text,
  p_days int DEFAULT 30
)
RETURNS TABLE(
  price_date date,
  avg_price numeric,
  min_price numeric,
  max_price numeric,
  data_points bigint,
  source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily AS (
    SELECT
      (p.created_at AT TIME ZONE 'Asia/Dhaka')::date AS price_date,
      ROUND(AVG(p.price)::numeric, 2) AS avg_price,
      MIN(p.price)::numeric AS min_price,
      MAX(p.price)::numeric AS max_price,
      COUNT(*)::bigint AS data_points,
      'community'::text AS source
    FROM public.prices p
    WHERE p.product_name ILIKE p_product
      AND p.district = p_district
      AND p.created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
    UNION ALL
    SELECT
      g.price_date,
      g.price_avg AS avg_price,
      COALESCE(g.price_min, g.price_avg) AS min_price,
      COALESCE(g.price_max, g.price_avg) AS max_price,
      1::bigint AS data_points,
      COALESCE(g.source, 'DAM')::text AS source
    FROM public.govt_prices g
    WHERE g.product_name ILIKE p_product
      AND g.district = p_district
      AND g.price_date >= CURRENT_DATE - p_days
  )
  SELECT
    d.price_date,
    ROUND(AVG(d.avg_price)::numeric, 2) AS avg_price,
    MIN(d.min_price)::numeric AS min_price,
    MAX(d.max_price)::numeric AS max_price,
    SUM(d.data_points)::bigint AS data_points,
    string_agg(DISTINCT d.source, ', ' ORDER BY d.source) AS source
  FROM daily d
  GROUP BY d.price_date
  ORDER BY d.price_date ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_price_history(text, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_price_history(text, text, int) TO authenticated, service_role;

SELECT cron.unschedule('market-prices-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'market-prices-daily');

SELECT cron.schedule(
  'market-prices-daily',
  '15 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--8650a8d8-8f85-4dd3-b151-3b951324aae3.lovable.app/api/public/hooks/fetch-govt-prices',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bXdpYmZsdGN4YXFqbHB3eW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTg5NjUsImV4cCI6MjA5NTI3NDk2NX0.10teMxa8N22OzCUewExju68fJZAZpt_lGgDeVhsHzQk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);