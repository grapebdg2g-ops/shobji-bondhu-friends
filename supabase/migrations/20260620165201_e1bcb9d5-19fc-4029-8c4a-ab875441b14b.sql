
CREATE TABLE public.govt_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  price_min numeric,
  price_max numeric,
  price_avg numeric NOT NULL,
  market_name text,
  district text NOT NULL,
  source text NOT NULL DEFAULT 'DAM',
  price_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_name, district, market_name, price_date, source)
);

GRANT SELECT ON public.govt_prices TO authenticated;
GRANT ALL ON public.govt_prices TO service_role;

ALTER TABLE public.govt_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read govt prices"
  ON public.govt_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_govt_prices_lookup
  ON public.govt_prices (product_name, district, price_date DESC);

-- Replace previous version (return type changes, so DROP+CREATE)
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
  SELECT
    (created_at AT TIME ZONE 'Asia/Dhaka')::date AS price_date,
    ROUND(AVG(price)::numeric, 2) AS avg_price,
    MIN(price)::numeric AS min_price,
    MAX(price)::numeric AS max_price,
    COUNT(*)::bigint AS data_points,
    'app'::text AS source
  FROM public.prices
  WHERE product_name ILIKE p_product
    AND district = p_district
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1

  UNION ALL

  SELECT
    g.price_date,
    g.price_avg AS avg_price,
    g.price_min AS min_price,
    g.price_max AS max_price,
    1::bigint AS data_points,
    g.source
  FROM public.govt_prices g
  WHERE g.product_name ILIKE p_product
    AND g.district = p_district
    AND g.price_date >= CURRENT_DATE - p_days

  ORDER BY price_date ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_price_history(text, text, int) TO authenticated, service_role;
