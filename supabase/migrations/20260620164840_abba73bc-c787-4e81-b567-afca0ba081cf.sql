
CREATE TABLE public.price_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  district text NOT NULL,
  prediction_json jsonb NOT NULL,
  data_points int NOT NULL DEFAULT 0,
  trend text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.price_predictions TO authenticated;
GRANT ALL ON public.price_predictions TO service_role;

ALTER TABLE public.price_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read predictions"
  ON public.price_predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_prediction_lookup
  ON public.price_predictions (product_name, district, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_price_history(
  p_product text,
  p_district text,
  p_days int DEFAULT 30
)
RETURNS TABLE(day date, avg_price numeric, min_price numeric, max_price numeric, sample_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
    ROUND(AVG(price)::numeric, 2) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    COUNT(*) AS sample_count
  FROM public.prices
  WHERE product_name = p_product
    AND district = p_district
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 1 ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_price_history(text, text, int) TO authenticated, anon, service_role;
